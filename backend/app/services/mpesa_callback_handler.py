from app import db
from app.models.payment import Payment, PaymentStatus
from app.models.order import Order, OrderStatus
from app.models.user import User
from app.services.whatsapp_service import WhatsAppService
from app.services.email_service import EmailService
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class MpesaCallbackHandler:
    def __init__(self):
        self.whatsapp_service = WhatsAppService()
        self.email_service = EmailService()

    def handle_stk_callback(self, callback_data):
        """Handle STK Push callback from M-Pesa"""
        try:
            logger.info(f"Processing STK callback: {callback_data}")

            # Extract callback data
            stk_callback = callback_data.get('Body', {}).get('stkCallback', {})
            merchant_request_id = stk_callback.get('MerchantRequestID')
            checkout_request_id = stk_callback.get('CheckoutRequestID')
            result_code = stk_callback.get('ResultCode')
            result_desc = stk_callback.get('ResultDesc')

            if not checkout_request_id:
                logger.error("No CheckoutRequestID in callback")
                return {'success': False, 'message': 'Invalid callback data'}

            # Find payment by checkout_request_id
            payment = Payment.query.filter_by(checkout_request_id=checkout_request_id).first()

            if not payment:
                logger.error(f"Payment not found for checkout_request_id: {checkout_request_id}")
                return {'success': False, 'message': 'Payment not found'}

            # Update payment based on result code
            if result_code == 0:  # Success
                return self._handle_successful_payment(payment, stk_callback)
            else:  # Failed or cancelled
                return self._handle_failed_payment(payment, result_code, result_desc)

        except Exception as e:
            logger.error(f"Error processing STK callback: {e}")
            db.session.rollback()
            return {'success': False, 'message': f'Callback processing failed: {str(e)}'}

    def _handle_successful_payment(self, payment, stk_callback):
        """Handle successful payment callback"""
        try:
            callback_metadata = stk_callback.get('CallbackMetadata', {})
            items = callback_metadata.get('Item', [])

            # Extract transaction details
            for item in items:
                name = item.get('Name')
                value = item.get('Value')

                if name == 'MpesaReceiptNumber':
                    payment.mpesa_receipt_number = str(value)
                elif name == 'TransactionDate':
                    # Convert transaction date to datetime (format: 20231201143022)
                    try:
                        transaction_date = str(value)
                        payment.completed_at = datetime.strptime(transaction_date, '%Y%m%d%H%M%S')
                    except ValueError:
                        payment.completed_at = datetime.utcnow()
                elif name == 'Amount':
                    # Verify amount matches
                    if float(value) != payment.amount:
                        logger.warning(
                            f"Amount mismatch for payment {payment.id}: expected {payment.amount}, got {value}")
                elif name == 'PhoneNumber':
                    payment.mpesa_phone_number = str(value)

            payment.status = PaymentStatus.COMPLETED
            payment.result_code = '0'
            payment.result_description = 'Payment completed successfully'
            payment.updated_at = datetime.utcnow()

            # Update order status if payment is linked to an order
            if payment.order_id:
                order = Order.query.get(payment.order_id)
                if order:
                    order.payment_status = 'completed'

                    # Update order status based on current status
                    if order.status == OrderStatus.PENDING:
                        order.status = OrderStatus.CONFIRMED
                        order.confirmed_at = datetime.utcnow()

                    order.updated_at = datetime.utcnow()

                    # Send notifications
                    self._send_payment_notifications(order, payment)

            db.session.commit()

            logger.info(f"Payment {payment.id} completed successfully - Receipt: {payment.mpesa_receipt_number}")

            return {
                'success': True,
                'message': 'Payment processed successfully',
                'payment_id': payment.id,
                'receipt_number': payment.mpesa_receipt_number
            }

        except Exception as e:
            logger.error(f"Error handling successful payment: {e}")
            db.session.rollback()
            raise

    def _handle_failed_payment(self, payment, result_code, result_desc):
        """Handle failed payment callback"""
        try:
            payment.status = PaymentStatus.FAILED
            payment.result_code = str(result_code)
            payment.result_description = result_desc or 'Payment failed'
            payment.updated_at = datetime.utcnow()

            # Log failure reason
            failure_reasons = {
                1: 'Insufficient funds',
                17: 'User cancelled transaction',
                26: 'Invalid phone number',
                2001: 'Invalid PIN',
                1032: 'Request cancelled by user'
            }

            reason = failure_reasons.get(result_code, f'Unknown error (Code: {result_code})')
            logger.info(f"Payment {payment.id} failed: {reason}")

            # If payment is linked to an order, keep order as pending
            if payment.order_id:
                order = Order.query.get(payment.order_id)
                if order:
                    order.payment_status = 'failed'
                    order.updated_at = datetime.utcnow()

                    # Send failure notification
                    self._send_payment_failure_notification(order, payment, reason)

            db.session.commit()

            return {
                'success': True,
                'message': 'Payment failure processed',
                'payment_id': payment.id,
                'failure_reason': reason
            }

        except Exception as e:
            logger.error(f"Error handling failed payment: {e}")
            db.session.rollback()
            raise

    def handle_c2b_callback(self, callback_data):
        """Handle C2B (Paybill) callback from M-Pesa"""
        try:
            logger.info(f"Processing C2B callback: {callback_data}")

            # Extract transaction details
            transaction_type = callback_data.get('TransactionType')
            trans_id = callback_data.get('TransID')
            trans_time = callback_data.get('TransTime')
            trans_amount = callback_data.get('TransAmount')
            business_short_code = callback_data.get('BusinessShortCode')
            bill_ref_number = callback_data.get('BillRefNumber')
            invoice_number = callback_data.get('InvoiceNumber')
            msisdn = callback_data.get('MSISDN')
            first_name = callback_data.get('FirstName', '')
            middle_name = callback_data.get('MiddleName', '')
            last_name = callback_data.get('LastName', '')

            # Check if transaction already exists
            existing_payment = Payment.query.filter_by(mpesa_transaction_id=trans_id).first()
            if existing_payment:
                logger.info(f"C2B transaction {trans_id} already processed")
                return {'success': True, 'message': 'Transaction already processed'}

            # Process the payment
            return self._process_c2b_payment({
                'transaction_id': trans_id,
                'transaction_time': trans_time,
                'amount': trans_amount,
                'account_number': bill_ref_number,
                'phone_number': msisdn,
                'customer_name': f"{first_name} {middle_name} {last_name}".strip(),
                'transaction_type': transaction_type
            })

        except Exception as e:
            logger.error(f"Error processing C2B callback: {e}")
            return {'success': False, 'message': f'C2B processing failed: {str(e)}'}

    def _process_c2b_payment(self, transaction_data):
        """Process C2B payment"""
        try:
            transaction_id = transaction_data['transaction_id']
            amount = float(transaction_data['amount'])
            account_number = transaction_data['account_number']
            phone_number = transaction_data['phone_number']
            customer_name = transaction_data['customer_name']

            # Find customer and order
            customer = None
            order = None

            # Try to find order by account number (order number)
            if account_number.startswith('MUL'):
                try:
                    payment_id = int(account_number[3:])
                    existing_payment = Payment.query.get(payment_id)
                    if existing_payment and existing_payment.order_id:
                        order = Order.query.get(existing_payment.order_id)
                        customer = User.query.get(order.customer_id) if order else None
                except ValueError:
                    pass

            # If no order found, try to find customer by phone
            if not customer and phone_number:
                # Format phone number for lookup
                formatted_phone = phone_number
                if phone_number.startswith('254'):
                    formatted_phone = f"+{phone_number}"

                customer = User.query.filter_by(phone=formatted_phone).first()

            # Create payment record
            payment = Payment(
                order_id=order.id if order else None,
                customer_id=customer.id if customer else None,
                payment_method=PaymentMethod.MPESA_PAYBILL,
                amount=amount,
                status=PaymentStatus.COMPLETED,
                mpesa_phone_number=phone_number,
                mpesa_transaction_id=transaction_id,
                mpesa_receipt_number=transaction_id,  # For C2B, transaction ID is the receipt
                transaction_reference=account_number,
                description=f"Paybill payment - {account_number}",
                completed_at=datetime.utcnow()
            )

            db.session.add(payment)

            # Update order if found
            if order:
                order.payment_status = 'completed'
                if order.status == OrderStatus.PENDING:
                    order.status = OrderStatus.CONFIRMED
                    order.confirmed_at = datetime.utcnow()
                order.updated_at = datetime.utcnow()

                # Send notifications
                self._send_payment_notifications(order, payment)

            db.session.commit()

            logger.info(f"C2B payment {transaction_id} processed successfully")

            return {
                'success': True,
                'message': 'C2B payment processed successfully',
                'payment_id': payment.id,
                'transaction_id': transaction_id
            }

        except Exception as e:
            logger.error(f"Error processing C2B payment: {e}")
            db.session.rollback()
            raise

    def _send_payment_notifications(self, order, payment):
        """Send payment confirmation notifications"""
        try:
            # Send WhatsApp notification
            if order.customer_phone:
                self.whatsapp_service.send_payment_confirmation(order, payment)

            # Send email notification
            if order.customer_email:
                self.email_service.send_order_confirmation_email(order)

        except Exception as e:
            logger.error(f"Error sending payment notifications: {e}")
            # Don't raise exception as payment is already processed

    def _send_payment_failure_notification(self, order, payment, reason):
        """Send payment failure notification"""
        try:
            if order.customer_phone:
                message = f"""
❌ *Payment Failed - Multical*

Hello {order.customer_name}!

Your payment for order {order.order_number} was not successful.

Reason: {reason}
Amount: KSh {payment.amount:,.2f}

Please try again or contact us for assistance.

For support: Call/WhatsApp +254700000000
"""
                self.whatsapp_service.send_text_message(order.customer_phone, message.strip())

        except Exception as e:
            logger.error(f"Error sending failure notification: {e}")

    def handle_timeout_callback(self, callback_data):
        """Handle timeout callback"""
        try:
            logger.info(f"Processing timeout callback: {callback_data}")

            checkout_request_id = callback_data.get('Body', {}).get('stkCallback', {}).get('CheckoutRequestID')

            if checkout_request_id:
                payment = Payment.query.filter_by(checkout_request_id=checkout_request_id).first()
                if payment and payment.status == PaymentStatus.PENDING:
                    payment.status = PaymentStatus.FAILED
                    payment.result_description = 'Transaction timeout'
                    payment.updated_at = datetime.utcnow()
                    db.session.commit()

                    logger.info(f"Payment {payment.id} marked as timeout")

            return {'success': True, 'message': 'Timeout processed'}

        except Exception as e:
            logger.error(f"Error processing timeout: {e}")
            return {'success': False, 'message': str(e)}