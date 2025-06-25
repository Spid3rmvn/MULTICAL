from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app import db
from app.models.user import User, UserRole
from datetime import datetime
import re

auth_bp = Blueprint('auth', __name__)


def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_phone(phone):
    """Validate Kenyan phone number"""
    # Remove any spaces or special characters
    phone = re.sub(r'[^\d+]', '', phone)

    # Check if it's a valid Kenyan number
    if phone.startswith('+254'):
        return len(phone) == 13
    elif phone.startswith('254'):
        return len(phone) == 12
    elif phone.startswith('07') or phone.startswith('01'):
        return len(phone) == 10

    return False


def format_phone_number(phone):
    """Format phone number to standard format"""
    phone = re.sub(r'[^\d+]', '', phone)

    if phone.startswith('+254'):
        return phone
    elif phone.startswith('254'):
        return f'+{phone}'
    elif phone.startswith('07') or phone.startswith('01'):
        return f'+254{phone[1:]}'

    return phone


@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ['email', 'phone', 'password', 'first_name', 'last_name']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400

        # Validate email format
        if not validate_email(data['email']):
            return jsonify({'error': 'Invalid email format'}), 400

        # Validate phone format
        if not validate_phone(data['phone']):
            return jsonify({'error': 'Invalid phone number format'}), 400

        # Format phone number
        formatted_phone = format_phone_number(data['phone'])

        # Check if user already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already registered'}), 400

        if User.query.filter_by(phone=formatted_phone).first():
            return jsonify({'error': 'Phone number already registered'}), 400

        # Validate password strength
        if len(data['password']) < 6:
            return jsonify({'error': 'Password must be at least 6 characters long'}), 400

        # Create new user
        user = User(
            email=data['email'].lower(),
            phone=formatted_phone,
            password=data['password'],
            first_name=data['first_name'].title(),
            last_name=data['last_name'].title(),
            role=UserRole.ADMIN if data.get('is_admin') else UserRole.CUSTOMER
        )

        db.session.add(user)
        db.session.commit()

        # Create access token
        access_token = create_access_token(identity=user.id)

        return jsonify({
            'message': 'Registration successful',
            'user': user.to_dict(),
            'access_token': access_token
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Registration failed', 'details': str(e)}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()

        if not data.get('login') or not data.get('password'):
            return jsonify({'error': 'Login credentials are required'}), 400

        # Login can be email or phone
        login_value = data['login']

        # Find user by email or phone
        user = None
        if validate_email(login_value):
            user = User.query.filter_by(email=login_value.lower()).first()
        elif validate_phone(login_value):
            formatted_phone = format_phone_number(login_value)
            user = User.query.filter_by(phone=formatted_phone).first()

        if not user or not user.check_password(data['password']):
            return jsonify({'error': 'Invalid credentials'}), 401

        if not user.is_active:
            return jsonify({'error': 'Account is disabled'}), 401

        # Update last login
        user.last_login = datetime.utcnow()
        db.session.commit()

        # Create access token
        access_token = create_access_token(identity=user.id)

        return jsonify({
            'message': 'Login successful',
            'user': user.to_dict(),
            'access_token': access_token
        }), 200

    except Exception as e:
        return jsonify({'error': 'Login failed', 'details': str(e)}), 500


@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        return jsonify({'user': user.to_dict()}), 200

    except Exception as e:
        return jsonify({'error': 'Failed to fetch profile', 'details': str(e)}), 500


@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.get_json()

        # Update allowed fields
        if 'first_name' in data:
            user.first_name = data['first_name'].title()
        if 'last_name' in data:
            user.last_name = data['last_name'].title()
        if 'email' in data:
            if not validate_email(data['email']):
                return jsonify({'error': 'Invalid email format'}), 400
            # Check if email is already taken by another user
            existing_user = User.query.filter_by(email=data['email'].lower()).first()
            if existing_user and existing_user.id != user.id:
                return jsonify({'error': 'Email already taken'}), 400
            user.email = data['email'].lower()
            user.email_verified = False  # Require re-verification

        user.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'message': 'Profile updated successfully',
            'user': user.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update profile', 'details': str(e)}), 500


@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.get_json()

        if not data.get('current_password') or not data.get('new_password'):
            return jsonify({'error': 'Current password and new password are required'}), 400

        # Verify current password
        if not user.check_password(data['current_password']):
            return jsonify({'error': 'Current password is incorrect'}), 400

        # Validate new password
        if len(data['new_password']) < 6:
            return jsonify({'error': 'New password must be at least 6 characters long'}), 400

        # Update password
        from flask_bcrypt import generate_password_hash
        user.password_hash = generate_password_hash(data['new_password']).decode('utf-8')
        user.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({'message': 'Password changed successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to change password', 'details': str(e)}), 500