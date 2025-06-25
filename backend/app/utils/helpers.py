import re
import uuid
import hashlib
import secrets
import string
from datetime import datetime, timedelta
from flask import current_app
import logging

logger = logging.getLogger(__name__)


def generate_unique_id(prefix='', length=8):
    """Generate a unique ID with optional prefix"""
    unique_id = secrets.token_hex(length)
    return f"{prefix}{unique_id}" if prefix else unique_id


def generate_order_number():
    """Generate unique order number"""
    timestamp = datetime.utcnow().strftime('%Y%m%d%H%M%S')
    random_suffix = secrets.token_hex(3).upper()
    return f"MUL{timestamp}{random_suffix}"


def generate_reference_number(prefix='REF'):
    """Generate reference number for payments/transactions"""
    timestamp = datetime.utcnow().strftime('%Y%m%d%H%M%S')
    random_suffix = secrets.token_hex(2).upper()
    return f"{prefix}{timestamp}{random_suffix}"


def format_currency(amount, currency='KSh'):
    """Format amount as currency"""
    try:
        amount = float(amount)
        return f"{currency} {amount:,.2f}"
    except (ValueError, TypeError):
        return f"{currency} 0.00"


def format_phone_number(phone):
    """Format phone number for display"""
    if not phone:
        return ''

    # Remove country code for display
    if phone.startswith('+254'):
        return f"0{phone[4:]}"
    elif phone.startswith('254'):
        return f"0{phone[3:]}"
    return phone


def sanitize_filename(filename):
    """Sanitize filename for safe storage"""
    if not filename:
        return 'untitled'

    # Remove or replace unsafe characters
    filename = re.sub(r'[^\w\-_\.]', '_', filename)
    # Remove multiple underscores
    filename = re.sub(r'_+', '_', filename)
    # Limit length
    name, ext = filename.rsplit('.', 1) if '.' in filename else (filename, '')
    name = name[:50]  # Limit to 50 characters

    return f"{name}.{ext}" if ext else name


def slugify(text, max_length=50):
    """Convert text to URL-friendly slug"""
    if not text:
        return ''

    # Convert to lowercase and replace spaces/special chars with hyphens
    slug = re.sub(r'[^\w\s-]', '', text.lower())
    slug = re.sub(r'[-\s]+', '-', slug)
    slug = slug.strip('-')

    # Limit length
    if len(slug) > max_length:
        slug = slug[:max_length].rstrip('-')

    return slug


def calculate_delivery_fee(delivery_location, order_total=0):
    """Calculate delivery fee based on location and order total"""
    delivery_rates = {
        'nairobi_cbd': 200,
        'nairobi_suburbs': 300,
        'kiambu': 400,
        'machakos': 500,
        'kajiado': 500,
        'nakuru': 800,
        'mombasa': 1000,
        'other': 1200
    }

    # Free delivery for orders above certain amount
    free_delivery_threshold = current_app.config.get('FREE_DELIVERY_THRESHOLD', 5000)

    if order_total >= free_delivery_threshold:
        return 0

    location_key = delivery_location.lower().replace(' ', '_')
    return delivery_rates.get(location_key, delivery_rates['other'])


def estimate_delivery_time(delivery_location):
    """Estimate delivery time based on location"""
    delivery_times = {
        'nairobi_cbd': '2-4 hours',
        'nairobi_suburbs': '4-6 hours',
        'kiambu': '1-2 days',
        'machakos': '1-2 days',
        'kajiado': '1-2 days',
        'nakuru': '2-3 days',
        'mombasa': '3-5 days',
        'other': '3-7 days'
    }

    location_key = delivery_location.lower().replace(' ', '_')
    return delivery_times.get(location_key, delivery_times['other'])


def hash_password(password):
    """Hash password with salt"""
    salt = secrets.token_hex(16)
    password_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
    return f"{salt}${password_hash.hex()}"


def verify_password(password, hashed_password):
    """Verify password against hash"""
    try:
        salt, hash_value = hashed_password.split('$')
        password_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
        return hash_value == password_hash.hex()
    except ValueError:
        return False


def generate_reset_token():
    """Generate password reset token"""
    return secrets.token_urlsafe(32)


def is_valid_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def is_valid_kenyan_phone(phone):
    """Validate Kenyan phone number"""
    # Remove spaces and special characters
    clean_phone = re.sub(r'[^\d+]', '', phone)

    # Check various formats
    patterns = [
        r'^\+254[17]\d{8}$',  # +254701234567 or +254101234567
        r'^254[17]\d{8}$',  # 254701234567
        r'^0[17]\d{8}$'  # 0701234567
    ]

    return any(re.match(pattern, clean_phone) for pattern in patterns)


def calculate_tax(amount, tax_rate=0.16):
    """Calculate tax (VAT) for given amount"""
    try:
        amount = float(amount)
        tax_rate = float(tax_rate)
        return round(amount * tax_rate, 2)
    except (ValueError, TypeError):
        return 0


def calculate_discount(original_price, discount_percentage):
    """Calculate discount amount"""
    try:
        original_price = float(original_price)
        discount_percentage = float(discount_percentage)
        discount_amount = original_price * (discount_percentage / 100)
        return round(discount_amount, 2)
    except (ValueError, TypeError):
        return 0


def paginate_query(query, page=1, per_page=20, max_per_page=100):
    """Helper function to paginate SQLAlchemy queries"""
    page = max(1, int(page))
    per_page = min(max_per_page, max(1, int(per_page)))

    pagination = query.paginate(
        page=page,
        per_page=per_page,
        error_out=False
    )

    return {
        'items': pagination.items,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': pagination.total,
            'pages': pagination.pages,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev,
            'next_page': pagination.next_num if pagination.has_next else None,
            'prev_page': pagination.prev_num if pagination.has_prev else None
        }
    }


def truncate_text(text, max_length=100, suffix='...'):
    """Truncate text to specified length"""
    if not text or len(text) <= max_length:
        return text

    return text[:max_length - len(suffix)] + suffix


def get_file_extension(filename):
    """Get file extension from filename"""
    if not filename or '.' not in filename:
        return ''
    return filename.rsplit('.', 1)[1].lower()


def is_image_file(filename):
    """Check if file is an image based on extension"""
    image_extensions = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'}
    return get_file_extension(filename) in image_extensions


def format_datetime(dt, format_string='%d/%m/%Y %H:%M'):
    """Format datetime for display"""
    if not dt:
        return ''

    if isinstance(dt, str):
        try:
            dt = datetime.fromisoformat(dt.replace('Z', '+00:00'))
        except ValueError:
            return dt

    return dt.strftime(format_string)


def time_ago(dt):
    """Get human-readable time difference"""
    if not dt:
        return ''

    if isinstance(dt, str):
        try:
            dt = datetime.fromisoformat(dt.replace('Z', '+00:00'))
        except ValueError:
            return dt

    now = datetime.utcnow()
    diff = now - dt

    if diff.days > 365:
        return f"{diff.days // 365} year{'s' if diff.days // 365 > 1 else ''} ago"
    elif diff.days > 30:
        return f"{diff.days // 30} month{'s' if diff.days // 30 > 1 else ''} ago"
    elif diff.days > 0:
        return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
    elif diff.seconds > 3600:
        hours = diff.seconds // 3600
        return f"{hours} hour{'s' if hours > 1 else ''} ago"
    elif diff.seconds > 60:
        minutes = diff.seconds // 60
        return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
    else:
        return "Just now"


def mask_sensitive_data(data, fields_to_mask=None):
    """Mask sensitive data in dictionary"""
    if fields_to_mask is None:
        fields_to_mask = ['password', 'token', 'secret', 'key', 'pin']

    if isinstance(data, dict):
        masked_data = {}
        for key, value in data.items():
            if any(field in key.lower() for field in fields_to_mask):
                masked_data[key] = '*' * 8
            elif isinstance(value, dict):
                masked_data[key] = mask_sensitive_data(value, fields_to_mask)
            elif isinstance(value, list):
                masked_data[key] = [
                    mask_sensitive_data(item, fields_to_mask) if isinstance(item, dict) else item
                    for item in value
                ]
            else:
                masked_data[key] = value
        return masked_data

    return data


def validate_and_format_coordinates(latitude, longitude):
    """Validate and format GPS coordinates"""
    try:
        lat = float(latitude)
        lng = float(longitude)

        # Validate ranges
        if not (-90 <= lat <= 90):
            raise ValueError("Latitude must be between -90 and 90")

        if not (-180 <= lng <= 180):
            raise ValueError("Longitude must be between -180 and 180")

        return round(lat, 6), round(lng, 6)

    except (ValueError, TypeError) as e:
        raise ValueError(f"Invalid coordinates: {str(e)}")


def get_client_ip(request):
    """Get client IP address from request"""
    # Check for forwarded IP first (load balancer/proxy)
    forwarded_ip = request.environ.get('HTTP_X_FORWARDED_FOR')
    if forwarded_ip:
        # Take the first IP if multiple are present
        return forwarded_ip.split(',')[0].strip()

    # Check other headers
    real_ip = request.environ.get('HTTP_X_REAL_IP')
    if real_ip:
        return real_ip

    # Fall back to direct IP
    return request.environ.get('REMOTE_ADDR', 'unknown')


def clean_html(text):
    """Remove HTML tags from text"""
    if not text:
        return ''

    # Simple HTML tag removal
    clean_text = re.sub(r'<[^>]+>', '', text)
    # Clean up extra whitespace
    clean_text = re.sub(r'\s+', ' ', clean_text).strip()

    return clean_text