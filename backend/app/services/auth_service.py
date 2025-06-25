import re
import secrets
import string
from datetime import datetime, timedelta
from app import db, redis_client
from app.models.user import User
from flask_jwt_extended import create_access_token
import logging

logger = logging.getLogger(__name__)


class AuthService:

    @staticmethod
    def generate_verification_code():
        """Generate a 6-digit verification code"""
        return ''.join(secrets.choice(string.digits) for _ in range(6))

    @staticmethod
    def generate_password_reset_token():
        """Generate a secure password reset token"""
        return secrets.token_urlsafe(32)

    @staticmethod
    def validate_phone_number(phone):
        """Validate and format Kenyan phone number"""
        # Remove any spaces or special characters
        phone = re.sub(r'[^\d+]', '', phone)

        # Check if it's a valid Kenyan number
        if phone.startswith('+254'):
            if len(phone) == 13:
                return phone
        elif phone.startswith('254'):
            if len(phone) == 12:
                return f'+{phone}'
        elif phone.startswith('07') or phone.startswith('01'):
            if len(phone) == 10:
                return f'+254{phone[1:]}'

        return None

    @staticmethod
    def validate_email(email):
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None

    @staticmethod
    def validate_password_strength(password):
        """Validate password strength"""
        errors = []

        if len(password) < 8:
            errors.append('Password must be at least 8 characters long')

        if not re.search(r'[A-Z]', password):
            errors.append('Password must contain at least one uppercase letter')

        if not re.search(r'[a-z]', password):
            errors.append('Password must contain at least one lowercase letter')

        if not re.search(r'\d', password):
            errors.append('Password must contain at least one number')

        return {'valid': len(errors) == 0, 'errors': errors}

    @staticmethod
    def send_verification_code(phone_number, code_type='phone_verification'):
        """Send verification code via SMS/WhatsApp"""
        try:
            if not redis_client:
                logger.warning("Redis not available for verification codes")
                return {'success': False, 'message': 'Service temporarily unavailable'}

            code = AuthService.generate_verification_code()

            # Store code in Redis with 5-minute expiry
            redis_key = f"{code_type}:{phone_number}"
            redis_client.setex(redis_key, 300, code)  # 5 minutes

            # In production, integrate with SMS/WhatsApp service
            # For now, just log the code (remove in production)
            logger.info(f"Verification code for {phone_number}: {code}")

            # TODO: Integrate with actual SMS service (e.g., Africa's Talking)
            # sms_service.send_sms(phone_number, f"Your Multical verification code is: {code}")

            return {
                'success': True,
                'message': 'Verification code sent successfully',
                'code': code  # Remove this in production
            }

        except Exception as e:
            logger.error(f"Error sending verification code: {e}")
            return {'success': False, 'message': 'Failed to send verification code'}

    @staticmethod
    def verify_code(phone_number, code, code_type='phone_verification'):
        """Verify the submitted code"""
        try:
            if not redis_client:
                return {'success': False, 'message': 'Service temporarily unavailable'}

            redis_key = f"{code_type}:{phone_number}"
            stored_code = redis_client.get(redis_key)

            if not stored_code:
                return {'success': False, 'message': 'Code expired or not found'}

            if stored_code == code:
                # Delete the code after successful verification
                redis_client.delete(redis_key)
                return {'success': True, 'message': 'Code verified successfully'}
            else:
                return {'success': False, 'message': 'Invalid verification code'}

        except Exception as e:
            logger.error(f"Error verifying code: {e}")
            return {'success': False, 'message': 'Verification failed'}

    @staticmethod
    def create_password_reset_request(email):
        """Create a password reset request"""
        try:
            user = User.query.filter_by(email=email.lower()).first()
            if not user:
                # Don't reveal if email exists or not
                return {'success': True, 'message': 'If the email exists, a reset link will be sent'}

            token = AuthService.generate_password_reset_token()

            if redis_client:
                # Store reset token in Redis with 1-hour expiry
                redis_key = f"password_reset:{token}"
                redis_client.setex(redis_key, 3600, user.id)  # 1 hour

                # TODO: Send reset email
                # email_service.send_password_reset_email(user.email, token)

                logger.info(f"Password reset token for {email}: {token}")

                return {
                    'success': True,
                    'message': 'Password reset instructions sent to your email',
                    'token': token  # Remove this in production
                }
            else:
                return {'success': False, 'message': 'Service temporarily unavailable'}

        except Exception as e:
            logger.error(f"Error creating password reset request: {e}")
            return {'success': False, 'message': 'Failed to process reset request'}

    @staticmethod
    def reset_password(token, new_password):
        """Reset password using token"""
        try:
            if not redis_client:
                return {'success': False, 'message': 'Service temporarily unavailable'}

            redis_key = f"password_reset:{token}"
            user_id = redis_client.get(redis_key)

            if not user_id:
                return {'success': False, 'message': 'Invalid or expired reset token'}

            user = User.query.get(int(user_id))
            if not user:
                return {'success': False, 'message': 'User not found'}

            # Validate new password
            validation = AuthService.validate_password_strength(new_password)
            if not validation['valid']:
                return {'success': False, 'message': validation['errors'][0]}

            # Update password
            from flask_bcrypt import generate_password_hash
            user.password_hash = generate_password_hash(new_password).decode('utf-8')
            user.updated_at = datetime.utcnow()

            # Delete the reset token
            redis_client.delete(redis_key)

            db.session.commit()

            return {'success': True, 'message': 'Password reset successfully'}

        except Exception as e:
            db.session.rollback()
            logger.error(f"Error resetting password: {e}")
            return {'success': False, 'message': 'Failed to reset password'}

    @staticmethod
    def verify_phone_number(user_id, verification_code):
        """Verify user's phone number"""
        try:
            user = User.query.get(user_id)
            if not user:
                return {'success': False, 'message': 'User not found'}

            result = AuthService.verify_code(user.phone, verification_code, 'phone_verification')

            if result['success']:
                user.phone_verified = True
                user.updated_at = datetime.utcnow()
                db.session.commit()

                return {'success': True, 'message': 'Phone number verified successfully'}
            else:
                return result

        except Exception as e:
            db.session.rollback()
            logger.error(f"Error verifying phone number: {e}")
            return {'success': False, 'message': 'Phone verification failed'}

    @staticmethod
    def check_user_exists(email=None, phone=None):
        """Check if user exists by email or phone"""
        try:
            if email:
                user = User.query.filter_by(email=email.lower()).first()
                if user:
                    return {'exists': True, 'field': 'email'}

            if phone:
                formatted_phone = AuthService.validate_phone_number(phone)
                if formatted_phone:
                    user = User.query.filter_by(phone=formatted_phone).first()
                    if user:
                        return {'exists': True, 'field': 'phone'}

            return {'exists': False}

        except Exception as e:
            logger.error(f"Error checking user existence: {e}")
            return {'exists': False}