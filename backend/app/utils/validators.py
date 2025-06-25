import re
from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app.models.user import User


def validate_json(*required_fields):
    """Decorator to validate required JSON fields"""

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not request.is_json:
                return jsonify({'error': 'Content-Type must be application/json'}), 400

            data = request.get_json()
            if not data:
                return jsonify({'error': 'No JSON data provided'}), 400

            missing_fields = []
            for field in required_fields:
                if field not in data or data[field] is None or data[field] == '':
                    missing_fields.append(field)

            if missing_fields:
                return jsonify({
                    'error': 'Missing required fields',
                    'missing_fields': missing_fields
                }), 400

            return f(*args, **kwargs)

        return decorated_function

    return decorator


def admin_required(f):
    """Decorator to require admin privileges"""

    @wraps(f)
    def decorated_function(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user or not user.is_admin():
            return jsonify({'error': 'Admin access required'}), 403

        return f(*args, **kwargs)

    return decorated_function


def super_admin_required(f):
    """Decorator to require super admin privileges"""

    @wraps(f)
    def decorated_function(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user or not user.is_super_admin():
            return jsonify({'error': 'Super admin access required'}), 403

        return f(*args, **kwargs)

    return decorated_function


class ValidationError(Exception):
    """Custom validation error"""

    def __init__(self, message, field=None):
        self.message = message
        self.field = field
        super().__init__(self.message)


class Validator:
    """Data validation utilities"""

    @staticmethod
    def validate_email(email):
        """Validate email format"""
        if not email:
            raise ValidationError("Email is required", "email")

        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, email):
            raise ValidationError("Invalid email format", "email")

        return email.lower()

    @staticmethod
    def validate_phone(phone):
        """Validate and format Kenyan phone number"""
        if not phone:
            raise ValidationError("Phone number is required", "phone")

        # Remove any spaces or special characters
        phone = re.sub(r'[^\d+]', '', phone)

        # Check if it's a valid Kenyan number
        if phone.startswith('+254'):
            if len(phone) != 13:
                raise ValidationError("Invalid phone number format", "phone")
            return phone
        elif phone.startswith('254'):
            if len(phone) != 12:
                raise ValidationError("Invalid phone number format", "phone")
            return f'+{phone}'
        elif phone.startswith('07') or phone.startswith('01'):
            if len(phone) != 10:
                raise ValidationError("Invalid phone number format", "phone")
            return f'+254{phone[1:]}'
        else:
            raise ValidationError("Invalid phone number format", "phone")

    @staticmethod
    def validate_password(password):
        """Validate password strength"""
        if not password:
            raise ValidationError("Password is required", "password")

        if len(password) < 6:
            raise ValidationError("Password must be at least 6 characters long", "password")

        return password

    @staticmethod
    def validate_required_string(value, field_name, min_length=1, max_length=None):
        """Validate required string field"""
        if not value or not isinstance(value, str):
            raise ValidationError(f"{field_name} is required", field_name.lower().replace(' ', '_'))

        value = value.strip()
        if len(value) < min_length:
            raise ValidationError(f"{field_name} must be at least {min_length} characters",
                                  field_name.lower().replace(' ', '_'))

        if max_length and len(value) > max_length:
            raise ValidationError(f"{field_name} must not exceed {max_length} characters",
                                  field_name.lower().replace(' ', '_'))

        return value

    @staticmethod
    def validate_positive_number(value, field_name):
        """Validate positive number"""
        if value is None:
            raise ValidationError(f"{field_name} is required", field_name.lower().replace(' ', '_'))

        try:
            number = float(value)
            if number <= 0:
                raise ValidationError(f"{field_name} must be a positive number", field_name.lower().replace(' ', '_'))
            return number
        except (ValueError, TypeError):
            raise ValidationError(f"{field_name} must be a valid number", field_name.lower().replace(' ', '_'))

    @staticmethod
    def validate_integer(value, field_name, min_value=None, max_value=None):
        """Validate integer value"""
        if value is None:
            raise ValidationError(f"{field_name} is required", field_name.lower().replace(' ', '_'))

        try:
            number = int(value)

            if min_value is not None and number < min_value:
                raise ValidationError(f"{field_name} must be at least {min_value}",
                                      field_name.lower().replace(' ', '_'))

            if max_value is not None and number > max_value:
                raise ValidationError(f"{field_name} must not exceed {max_value}", field_name.lower().replace(' ', '_'))

            return number
        except (ValueError, TypeError):
            raise ValidationError(f"{field_name} must be a valid integer", field_name.lower().replace(' ', '_'))

    @staticmethod
    def validate_choice(value, choices, field_name):
        """Validate value is in allowed choices"""
        if value not in choices:
            raise ValidationError(f"{field_name} must be one of: {', '.join(choices)}",
                                  field_name.lower().replace(' ', '_'))

        return value

    @staticmethod
    def validate_url(url, field_name):
        """Validate URL format"""
        if not url:
            return None

        url_pattern = re.compile(
            r'^https?://'  # http:// or https://
            r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
            r'localhost|'  # localhost...
            r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
            r'(?::\d+)?'  # optional port
            r'(?:/?|[/?]\S+)$', re.IGNORECASE)

        if not url_pattern.match(url):
            raise ValidationError(f"Invalid {field_name} format", field_name.lower().replace(' ', '_'))

        return url