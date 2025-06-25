import requests
import base64
import json
from datetime import datetime
from app import db
from app.models.payment import Payment, PaymentStatus, PaymentMethod
from app.models.order import Order
from flask import current_app
import logging

logger = logging.getLogger(__name__)


class MpesaService:
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

        self.timeout_url = f"{self.callback_url}/timeout"
        self.result_url = f"{self.callback_url}/callback"
        self.validation_url = f"{self.callback_url}/validation"
        self.confirmation_url = f"{self.callback_url}/confirmation"

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

            response = requests.get(url, headers=headers, timeout=30)

            if response.status_code == 200:
                data = response.json()
                return data.get('access_token')
            else:
                logger.error(f"Failed to get access token: {response.text}")
                return None

        except Exception as e:
            logger.error(f"Error getting access token: {e}")
            return None

    def generate_password(self):
        """Generate M-Pesa password and timestamp"""
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        password_string = f"{self.shortcode}{self.passkey}{timestamp}"
        password = base64.b64encode(password_string.encode()).decode()
        return password, timestamp

    def format_phone_number(self, phone_number):
        """Format phone number to the required format (254XXXXXXXXX)"""
        # Remove any non-digit characters except +
        phone = ''.join(c for c in phone_number if c.isdigit() or c == '+')

        if phone.startswith('+254'):
            return phone[1:]  # Remove the + sign
        elif phone.startswith('254'):
            return phone
        elif phone.startswith('07') or phone.startswith('01'):
            return f"254{phone[1:]}"
        elif phone.startswith('7') or phone.startswith('1'):
            return f"254{phone}"
        else:
            raise ValueError("Invalid phone number format")

    def initiate_stk_push(self, phone_number, amount, order_id=None, customer_id=None, description="Payment"):
        """Initiate M-Pesa STK Push (Lipa na M-Pesa Online)"""
        try:
            access_token = self.get_access_token()
            if not access_token:
                return {
                    'success': False,
                    'message': 'Failed to authenticate with M-Pesa',
                    'error_code': 'AUTH_FAILED'
                }

            # Format phone number
            try:
                formatted_phone = self.format_phone_number(phone_number)
            except ValueError as e:
                return {
                    'success': False,
                    'message': 'Invalid phone number format',
                    'error_code': 'INVALID_PHONE'
                }

            # Generate password and timestamp
            password, timestamp = self.generate_password()

            # Create payment record
            payment = Payment(
                order_id=order_id,
                customer_id=customer_id,
                payment_method=PaymentMethod.MPESA_STK,
                amount=float(amount),
                status=PaymentStatus.PENDING,
                mpesa_phone_number=formatted_phone,
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
                'PartyA': formatted_phone,
                'PartyB': self.shortcode,
                'PhoneNumber': formatted_phone,
                'CallBackURL': self.result_url,
                'AccountReference': f"MUL{payment.id:06d}",
                'TransactionDesc': description[:20]  # M-Pesa limits description to 20 chars
            }

            logger.info(f"Initiating STK push for payment {payment.id}")
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            response_data = response.json()

            if response.status_code == 200 and response_data.get('ResponseCode') == '0':
                # Update payment with M-Pesa details
                payment.checkout_request_id = response_data.get('CheckoutRequestID')
                payment.merchant_request_id = response_data.get('MerchantRequestID')
                db.session.commit()

                logger.info(f"STK push initiated successfully for payment {payment.id}")

                return {
                    'success': True,
                    'payment_id': payment.id,
                    'checkout_request_id': payment.checkout_request_id,
                    'merchant_request_id': payment.merchant_request_id,
                    'message': 'STK push sent successfully. Please check your phone.'
                }
            else:
                payment.status = PaymentStatus.FAILED
                payment.result_description = response_data.get('errorMessage', 'STK push failed')
                payment.result_code = response_data.get('errorCode', 'UNKNOWN')
                db.session.commit()

                logger.error(f"STK push failed for payment {payment.id}: {response_data}")

                return {
                    'success': False,
                    'message': response_data.get('errorMessage', 'Failed to initiate payment'),
                    'error_code': response_data.get('errorCode', 'STK_PUSH_FAILED')
                }

        except Exception as e:
            db.session.rollback()
            logger.error(f"Error initiating STK push: {e}")
            return {
                'success': False,
                'message': f'Internal error: {str(e)}',
                'error_code': 'INTERNAL_ERROR'
            }

    def query_stk_status(self, checkout_request_id):
        """Query the status of an STK push transaction"""
        try:
            access_token = self.get_access_token()
            if not access_token:
                return {
                    'success': False,
                    'message': 'Failed to authenticate with M-Pesa'
                }

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

            response = requests.post(url, json=payload, headers=headers, timeout=30)
            response_data = response.json()

            return {
                'success': True,
                'result_code': response_data.get('ResultCode'),
                'result_desc': response_data.get('ResultDesc'),
                'raw_response': response_data
            }

        except Exception as e:
            logger.error(f"Error querying STK status: {e}")
            return {
                'success': False,
                'message': f'Query failed: {str(e)}'
            }

    def register_urls(self):
        """Register callback URLs with M-Pesa"""
        try:
            access_token = self.get_access_token()
            if not access_token:
                return {
                    'success': False,
                    'message': 'Failed to authenticate with M-Pesa'
                }

            url = f"{self.base_url}/mpesa/c2b/v1/registerurl"

            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }

            payload = {
                'ShortCode': self.shortcode,
                'ResponseType': 'Completed',  # or 'Cancelled'
                'ConfirmationURL': self.confirmation_url,
                'ValidationURL': self.validation_url
            }

            response = requests.post(url, json=payload, headers=headers, timeout=30)
            response_data = response.json()

            if response.status_code == 200:
                logger.info("M-Pesa URLs registered successfully")
                return {
                    'success': True,
                    'message': 'URLs registered successfully',
                    'response': response_data
                }
            else:
                logger.error(f"Failed to register URLs: {response_data}")
                return {
                    'success': False,
                    'message': 'Failed to register URLs',
                    'response': response_data
                }

        except Exception as e:
            logger.error(f"Error registering URLs: {e}")
            return {
                'success': False,
                'message': f'Registration failed: {str(e)}'
            }

    def simulate_c2b_transaction(self, phone_number, amount, account_number):
        """Simulate C2B transaction (for testing in sandbox)"""
        try:
            if self.environment != 'sandbox':
                return {
                    'success': False,
                    'message': 'C2B simulation only available in sandbox environment'
                }

            access_token = self.get_access_token()
            if not access_token:
                return {
                    'success': False,
                    'message': 'Failed to authenticate with M-Pesa'
                }

            # Format phone number
            formatted_phone = self.format_phone_number(phone_number)

            url = f"{self.base_url}/mpesa/c2b/v1/simulate"

            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }

            payload = {
                'ShortCode': self.shortcode,
                'CommandID': 'CustomerPayBillOnline',
                'Amount': int(float(amount)),
                'Msisdn': formatted_phone,
                'BillRefNumber': account_number
            }

            response = requests.post(url, json=payload, headers=headers, timeout=30)
            response_data = response.json()

            return {
                'success': response.status_code == 200,
                'message': response_data.get('ResponseDescription', 'Transaction simulated'),
                'response': response_data
            }

        except Exception as e:
            logger.error(f"Error simulating C2B transaction: {e}")
            return {
                'success': False,
                'message': f'Simulation failed: {str(e)}'
            }

    def account_balance(self):
        """Get account balance"""
        try:
            access_token = self.get_access_token()
            if not access_token:
                return {
                    'success': False,
                    'message': 'Failed to authenticate with M-Pesa'
                }

            url = f"{self.base_url}/mpesa/accountbalance/v1/query"

            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }

            payload = {
                'Initiator': current_app.config.get('MPESA_INITIATOR_NAME'),
                'SecurityCredential': current_app.config.get('MPESA_SECURITY_CREDENTIAL'),
                'CommandID': 'AccountBalance',
                'PartyA': self.shortcode,
                'IdentifierType': '4',
                'Remarks': 'Account balance query',
                'QueueTimeOutURL': self.timeout_url,
                'ResultURL': self.result_url
            }

            response = requests.post(url, json=payload, headers=headers, timeout=30)
            response_data = response.json()

            return {
                'success': response.status_code == 200,
                'response': response_data
            }

        except Exception as e:
            logger.error(f"Error getting account balance: {e}")
            return {
                'success': False,
                'message': f'Balance query failed: {str(e)}'
            }

    def transaction_status(self, transaction_id):
        """Query transaction status"""
        try:
            access_token = self.get_access_token()
            if not access_token:
                return {
                    'success': False,
                    'message': 'Failed to authenticate with M-Pesa'
                }

            url = f"{self.base_url}/mpesa/transactionstatus/v1/query"

            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }

            payload = {
                'Initiator': current_app.config.get('MPESA_INITIATOR_NAME'),
                'SecurityCredential': current_app.config.get('MPESA_SECURITY_CREDENTIAL'),
                'CommandID': 'TransactionStatusQuery',
                'TransactionID': transaction_id,
                'PartyA': self.shortcode,
                'IdentifierType': '4',
                'ResultURL': self.result_url,
                'QueueTimeOutURL': self.timeout_url,
                'Remarks': 'Transaction status query',
                'Occasion': 'Transaction status check'
            }

            response = requests.post(url, json=payload, headers=headers, timeout=30)
            response_data = response.json()

            return {
                'success': response.status_code == 200,
                'response': response_data
            }

        except Exception as e:
            logger.error(f"Error querying transaction status: {e}")
            return {
                'success': False,
                'message': f'Status query failed: {str(e)}'
            }