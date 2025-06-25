import requests
import base64
import json
from datetime import datetime
from app import db
from app.models.payment import Payment, PaymentStatus, PaymentMethod
from app.models.order import Order
from app.models.user import User
from flask import current_app
import logging

logger = logging.getLogger(__name__)


class PaymentService:
    def __init__(self):
        self.consumer_key = current_app.config.get('MPESA_CONSUMER_KEY')
        self.consumer_secret = current_app.config.get('MPESA_CONSUMER_SECRET')
        self.shortcode = current_app.config.get('MPESA_SHORTCODE')
        self.passkey = current_app.config.get('MPESA_PASSKEY')
        self.callback_url = current_app.config.get('MPESA_CALLBACK_URL')
        self.environment = current_app.config.get('MPESA_ENVIRONMENT', 'sandbox')

        # Set API URLs based on environment
        if self.environment == 'production':
            self.base_url = 'https://api.safaricom.co.ke'
        else:
            self.base_url = 'https://sandbox.safaricom.co.ke'

    def get_access_token(self):
        """Get M-Pesa access token"""
        try:
            url = f"{self.base_url}/oauth/v1/generate?grant_type=client_credentials"

            # Create basic auth header
            credentials = f"{self.consumer_key}:{self.consumer_secret}"
            encoded_credentials = base64.b64encode(credentials.encode()).decode()

            headers = {
                'Authorization': f'Basic {encoded_credentials}',
                'Content-Type': 'application/json'
            }

            response = requests.get(url, headers=headers)

            if response.status_code == 200:
                return response.json().get('access_token')
            else:
                logger.error(f"Failed to get access token: {response.text}")
                return None

        except Exception as e:
            logger.error(f"Error getting access token: {e}")
            return None

    def generate_password(self):
        """Generate M-Pesa password"""
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        password_string = f"{self.shortcode}{self.passkey}{timestamp}"
        password = base64.b64encode(password_string.encode()).decode()
        return password, timestamp

    def initiate_stk_push(self, phone_number, amount, order_id=None, customer_id=None, description="Payment"):
        """Initiate M-Pesa STK Push"""
        try:
            access_token = self.get_access_token()
            if not access_token:
                return {'success': False, 'message': 'Failed to get access token'}

            # Format phone number
            if phone_number.startswith('0'):
                phone_number = f"254{phone_number[1:]}"
            elif phone_number.startswith('+254'):
                phone_number = phone_number[1:]
            elif not phone_number.startswith('254'):
                phone_number = f"254{phone_number}"

            # Generate password and timestamp
            password, timestamp = self.generate_password()

            # Create payment record
            payment = Payment(
                order_id=order_id,
                customer_id=customer_id,
                payment_method=PaymentMethod.MPESA_STK,
                amount=amount,
                status=PaymentStatus.PENDING,
                mpesa_phone_number=phone_number,
                description=description
            )

            db.session.add(payment)
            db.session.flush()  # Get payment ID

            # Prepare STK push request
            url = f"{self.base_url}/mpesa/stkpush/v1/processrequest"

            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }

            payload = {
                'BusinessShortCode': self.shortcode,
                'Password': password,
                'Timestamp': timestamp,
                'TransactionType': 'CustomerPayBillOnline',
                'Amount': int(float(amount)),
                'PartyA': phone_number,
                'PartyB': self.shortcode,
                'PhoneNumber': phone_number,
                'CallBackURL': f"{self.callback_url}/callback",
                'AccountReference': f"MUL{payment.id}",
                'TransactionDesc': description
            }

            response = requests.post(url, json=payload, headers=headers)
            response_data = response.json()

            if response.status_code == 200 and response_data.get('ResponseCode') == '0':
                # Update payment with M-Pesa details
                payment.checkout_request_id = response_data.get('CheckoutRequestID')
                payment.merchant_request_id = response_data.get('MerchantRequestID')
                db.session.commit()

                return {
                    'success': True,
                    'payment_id': payment.id,
                    'checkout_request_id': payment.checkout_request_id,
                    'message': 'STK push initiated successfully'
                }
            else:
                payment.status = PaymentStatus.FAILED
                payment.result_description = response_data.get('errorMessage', 'STK push failed')
                db.session.commit()

                return {
                    'success': False,
                    'message': response_data.get('errorMessage', 'STK push failed')
                }

        except Exception as e:
            db.session.rollback()
            logger.error(f"Error initiating STK push: {e}")
            return {'success': False, 'message': f'Internal error: {str(e)}'}

    def process_paybill_payment(self, phone_number, amount, account_number, transaction_id=None):
        """Process paybill payment (for manual verification)"""
        try:
            # Find customer by account number (could be order number or phone)
            customer = None
            order = None

            # Try to find order by order number
            if account_number.startswith('MUL'):
                order = Order.query.filter_by(order_number=account_number).first()
                if order:
                    customer = User.query.get(order.customer_id)

            # If no order found, try to find customer by phone
            if not customer:
                # Format phone number for lookup
                formatted_phone = phone_number
                if phone_number.startswith('254'):
                    formatted_phone = f"+{phone_number}"

                customer = User.query.filter_by(phone=formatted_phone).first()

            if not customer:
                return {'success': False, 'message': 'Customer not found'}

            # Create payment record
            payment = Payment(
                order_id=order.id if order else None,
                customer_id=customer.id,
                payment_method=PaymentMethod.MPESA_PAYBILL,
                amount=amount,
                status=PaymentStatus.PENDING,
                mpesa_phone_number=phone_number,
                mpesa_transaction_id=transaction_id,
                transaction_reference=account_number,
                description=f"Paybill payment for {account_number}"
            )

            db.session.add(payment)
            db.session.commit()

            return {
                'success': True,
                'payment_id': payment.id,
                'message': 'Paybill payment recorded for verification'
            }

        except Exception as e:
            db.session.rollback()
            logger.error(f"Error processing paybill payment: {e}")
            return {'success': False, 'message': f'Internal error: {str(e)}'}

    def process_paybill_callback(self, callback_data):
        """Process paybill callback from M-Pesa"""
        try:
            transaction_id = callback_data.get('transaction_id')
            amount = callback_data.get('amount')
            account_number = callback_data.get('account_number')
            phone_number = callback_data.get('phone_number')

            # Check if payment already exists
            existing_payment = Payment.query.filter_by(
                mpesa_transaction_id=transaction_id
            ).first()

            if existing_payment:
                return {'success': True, 'message': 'Payment already processed'}

            # Create new payment from callback
            result = self.process_paybill_payment(
                phone_number=phone_number,
                amount=amount,
                account_number=account_number,
                transaction_id=transaction_id
            )

            if result['success']:
                # Auto-approve the payment since it came from M-Pesa
                payment = Payment.query.get(result['payment_id'])
                payment.status = PaymentStatus.COMPLETED
                payment.completed_at = datetime.utcnow()

                # Update order if linked
                if payment.order_id:
                    order = Order.query.get(payment.order_id)
                    if order:
                        order.payment_status = 'completed'
                        order.status = 'confirmed'
                        order.confirmed_at = datetime.utcnow()

                db.session.commit()

            return result

        except Exception as e:
            db.session.rollback()
            logger.error(f"Error processing paybill callback: {e}")
            return {'success': False, 'message': f'Internal error: {str(e)}'}

    def verify_payment(self, payment_id):
        """Verify payment status"""
        try:
            payment = Payment.query.get(payment_id)
            if not payment:
                return {'success': False, 'message': 'Payment not found'}

            # For STK push payments, we can query M-Pesa API
            if payment.payment_method == PaymentMethod.MPESA_STK and payment.checkout_request_id:
                return self.query_stk_status(payment.checkout_request_id)

            # For paybill, return current status
            return {
                'success': True,
                'status': payment.status.value,
                'payment': payment.to_dict()
            }

        except Exception as e:
            logger.error(f"Error verifying payment: {e}")
            return {'success': False, 'message': f'Internal error: {str(e)}'}

    def query_stk_status(self, checkout_request_id):
        """Query STK push status from M-Pesa"""
        try:
            access_token = self.get_access_token()
            if not access_token:
                return {'success': False, 'message': 'Failed to get access token'}

            password, timestamp = self.generate_password()

            url = f"{self.base_url}/mpesa/stkpushquery/v1/query"

            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }

            payload = {
                'BusinessShortCode': self.shortcode,
                'Password': password,
                'Timestamp': timestamp,
                'CheckoutRequestID': checkout_request_id
            }

            response = requests.post(url, json=payload, headers=headers)
            response_data = response.json()

            return {
                'success': True,
                'status': response_data.get('ResultCode'),
                'description': response_data.get('ResultDesc'),
                'data': response_data
            }

        except Exception as e:
            logger.error(f"Error querying STK status: {e}")
            return {'success': False, 'message': f'Internal error: {str(e)}'}