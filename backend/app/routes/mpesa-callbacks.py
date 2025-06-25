from flask import Blueprint, request, jsonify
from app import db
from app.models.payment import Payment, PaymentStatus
from app.models.order import Order, OrderStatus
from app.services.whatsapp_service import WhatsAppService
from datetime import datetime
import logging

mpesa_bp = Blueprint('mpesa', __name__)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@mpesa_bp.route('/callback', methods=['POST'])
def mpesa_callback():
    """Handle M-Pesa STK Push callback"""
    try:
        data = request.get_json()
        logger.info(f"M-Pesa callback received: {data}")

        # Extract callback data
        stk_callback = data.get('Body', {}).get('stkCallback', {})
        merchant_request_id = stk_callback.get('MerchantRequestID')
        checkout_request_id = stk_callback.get('CheckoutRequestID')
        result_code = stk_callback.get('ResultCode')
        result_desc = stk_callback.get('ResultDesc')

        # Find payment by checkout_request_id
        payment = Payment.query.filter_by(checkout_request_id=checkout_request_id).first()

        if not payment:
            logger.error(f"Payment not found for checkout_request_id: {checkout_request_id}")
            return jsonify({'ResultCode': 0, 'ResultDesc': 'Payment not found'}), 200

        # Update payment based on result code
        if result_code == 0:  # Success
            callback_metadata = stk_callback.get('CallbackMetadata', {})
            items = callback_metadata.get('Item', [])

            # Extract transaction details
            for item in items:
                if item.get('Name') == 'MpesaReceiptNumber':
                    payment.mpesa_receipt_number = item.get('Value')
                elif item.get('Name') == 'TransactionDate':
                    # Convert transaction date to datetime
                    transaction_date = str(item.get('Value'))
                    payment.completed_at = datetime.strptime(transaction_date, '%Y%m%d%H%M%S')
                elif item.get('Name') == 'PhoneNumber':
                    payment.mpesa_phone_number = item.get('Value')

            payment.status = PaymentStatus.COMPLETED
            payment.result_code = str(result_code)
            payment.result_description = result_desc

            # Update order status if payment is linked to an order
            if payment.order_id:
                order = Order.query.get(payment.order_id)
                if order and order.payment_status == 'pending':
                    order.payment_status = 'completed'
                    order.status = OrderStatus.CONFIRMED
                    order.confirmed_at = datetime.utcnow()

                    # Send WhatsApp notification
                    try:
                        whatsapp_service = WhatsAppService()
                        whatsapp_service.send_payment_confirmation(order, payment)
                    except Exception as e:
                        logger.error(f"Failed to send WhatsApp notification: {e}")

            logger.info(f"Payment {payment.id} completed successfully")

        else:  # Failed
            payment.status = PaymentStatus.FAILED
            payment.result_code = str(result_code)
            payment.result_description = result_desc

            logger.info(f"Payment {payment.id} failed: {result_desc}")

        payment.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({'ResultCode': 0, 'ResultDesc': 'Callback processed successfully'}), 200

    except Exception as e:
        logger.error(f"Error processing M-Pesa callback: {e}")
        db.session.rollback()
        return jsonify({'ResultCode': 1, 'ResultDesc': 'Internal server error'}), 500


@mpesa_bp.route('/paybill-callback', methods=['POST'])
def mpesa_paybill_callback():
    """Handle M-Pesa Paybill callback"""
    try:
        data = request.get_json()
        logger.info(f"M-Pesa paybill callback received: {data}")

        # Extract paybill transaction details
        transaction_type = data.get('TransactionType')
        trans_id = data.get('TransID')
        trans_time = data.get('TransTime')
        trans_amount = data.get('TransAmount')
        business_short_code = data.get('BusinessShortCode')
        bill_ref_number = data.get('BillRefNumber')
        invoice_number = data.get('InvoiceNumber')
        org_account_balance = data.get('OrgAccountBalance')
        third_party_trans_id = data.get('ThirdPartyTransID')
        msisdn = data.get('MSISDN')
        first_name = data.get('FirstName')
        middle_name = data.get('MiddleName')
        last_name = data.get('LastName')

        # Process paybill payment
        from app.services.payment_service import PaymentService
        payment_service = PaymentService()

        result = payment_service.process_paybill_callback({
            'transaction_id': trans_id,
            'transaction_time': trans_time,
            'amount': trans_amount,
            'account_number': bill_ref_number,
            'phone_number': msisdn,
            'customer_name': f"{first_name} {middle_name} {last_name}".strip()
        })

        if result['success']:
            logger.info(f"Paybill payment processed successfully: {trans_id}")
        else:
            logger.error(f"Failed to process paybill payment: {result['message']}")

        return jsonify({'ResultCode': 0, 'ResultDesc': 'Paybill callback processed'}), 200

    except Exception as e:
        logger.error(f"Error processing paybill callback: {e}")
        return jsonify({'ResultCode': 1, 'ResultDesc': 'Internal server error'}), 500


@mpesa_bp.route('/timeout', methods=['POST'])
def mpesa_timeout():
    """Handle M-Pesa timeout callback"""
    try:
        data = request.get_json()
        logger.info(f"M-Pesa timeout callback received: {data}")

        checkout_request_id = data.get('Body', {}).get('stkCallback', {}).get('CheckoutRequestID')

        if checkout_request_id:
            payment = Payment.query.filter_by(checkout_request_id=checkout_request_id).first()
            if payment:
                payment.status = PaymentStatus.FAILED
                payment.result_description = 'Transaction timeout'
                payment.updated_at = datetime.utcnow()
                db.session.commit()

                logger.info(f"Payment {payment.id} marked as timeout")

        return jsonify({'ResultCode': 0, 'ResultDesc': 'Timeout processed'}), 200

    except Exception as e:
        logger.error(f"Error processing timeout: {e}")
        return jsonify({'ResultCode': 1, 'ResultDesc': 'Internal server error'}), 500