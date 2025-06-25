from functools import wraps
from flask import request, jsonify, current_app
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt
from app.models.user import User
import time
import logging

logger = logging.getLogger(__name__)


def rate_limit(max_requests=60, window=60):
    """
    Rate limiting decorator
    max_requests: maximum number of requests allowed
    window: time window in seconds
    """

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Simple in-memory rate limiting (use Redis in production)
            if not hasattr(current_app, '_rate_limit_storage'):
                current_app._rate_limit_storage = {}

            # Get client identifier
            client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)

            # Try to get user ID if authenticated
            try:
                verify_jwt_in_request(optional=True)
                user_id = get_jwt_identity()
                if user_id:
                    client_ip = f"user_{user_id}"
            except:
                pass

            current_time = time.time()
            key = f"{f.__name__}_{client_ip}"

            # Clean old entries
            if key in current_app._rate_limit_storage:
                current_app._rate_limit_storage[key] = [
                    timestamp for timestamp in current_app._rate_limit_storage[key]
                    if current_time - timestamp < window
                ]
            else:
                current_app._rate_limit_storage[key] = []

            # Check rate limit
            if len(current_app._rate_limit_storage[key]) >= max_requests:
                return jsonify({
                    'success': False,
                    'message': 'Rate limit exceeded. Please try again later.',
                    'error_code': 'RATE_LIMIT_EXCEEDED'
                }), 429

            # Add current request
            current_app._rate_limit_storage[key].append(current_time)

            return f(*args, **kwargs)

        return decorated_function

    return decorator


def log_activity(activity_type, include_request_data=False):
    """Decorator to log user activities"""

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            start_time = time.time()

            try:
                # Get user info if authenticated
                user_id = None
                user_email = None
                try:
                    verify_jwt_in_request(optional=True)
                    user_id = get_jwt_identity()
                    if user_id:
                        user = User.query.get(user_id)
                        user_email = user.email if user else None
                except:
                    pass

                # Execute function
                result = f(*args, **kwargs)

                # Calculate execution time
                execution_time = time.time() - start_time

                # Log activity
                log_data = {
                    'activity_type': activity_type,
                    'user_id': user_id,
                    'user_email': user_email,
                    'endpoint': request.endpoint,
                    'method': request.method,
                    'ip_address': request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr),
                    'user_agent': request.headers.get('User-Agent'),
                    'execution_time': round(execution_time, 3),
                    'status': 'success' if isinstance(result, tuple) and result[1] < 400 else 'error'
                }

                if include_request_data and request.is_json:
                    # Remove sensitive data
                    request_data = request.get_json() or {}
                    sensitive_fields = ['password', 'token', 'secret', 'key']
                    filtered_data = {
                        k: v for k, v in request_data.items()
                        if not any(field in k.lower() for field in sensitive_fields)
                    }
                    log_data['request_data'] = filtered_data

                logger.info(f"Activity logged: {activity_type}", extra=log_data)

                return result

            except Exception as e:
                execution_time = time.time() - start_time
                logger.error(f"Error in {activity_type}: {str(e)}", extra={
                    'activity_type': activity_type,
                    'user_id': user_id,
                    'endpoint': request.endpoint,
                    'execution_time': round(execution_time, 3),
                    'error': str(e)
                })
                raise

        return decorated_function

    return decorator


def cache_response(timeout=300):
    """Simple response caching decorator"""

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Simple in-memory caching (use Redis in production)
            if not hasattr(current_app, '_cache_storage'):
                current_app._cache_storage = {}

            # Create cache key
            cache_key = f"{f.__name__}_{request.endpoint}_{str(sorted(request.args.items()))}"
            current_time = time.time()

            # Check if cached response exists and is valid
            if cache_key in current_app._cache_storage:
                cached_data, timestamp = current_app._cache_storage[cache_key]
                if current_time - timestamp < timeout:
                    logger.debug(f"Cache hit for {cache_key}")
                    return cached_data

            # Execute function and cache result
            result = f(*args, **kwargs)
            current_app._cache_storage[cache_key] = (result, current_time)

            logger.debug(f"Cache miss for {cache_key}, result cached")
            return result

        return decorated_function

    return decorator


def validate_content_type(*allowed_types):
    """Validate request content type"""

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            content_type = request.content_type or ''

            # Check if content type is allowed
            if not any(allowed_type in content_type for allowed_type in allowed_types):
                return jsonify({
                    'success': False,
                    'message': f'Invalid content type. Allowed: {", ".join(allowed_types)}',
                    'error_code': 'INVALID_CONTENT_TYPE'
                }), 415

            return f(*args, **kwargs)

        return decorated_function

    return decorator


def require_api_key(f):
    """Require API key for certain endpoints"""

    @wraps(f)
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get('X-API-Key')
        expected_key = current_app.config.get('API_KEY')

        if not expected_key:
            # API key not configured, skip validation
            return f(*args, **kwargs)

        if not api_key or api_key != expected_key:
            return jsonify({
                'success': False,
                'message': 'Invalid or missing API key',
                'error_code': 'INVALID_API_KEY'
            }), 401

        return f(*args, **kwargs)

    return decorated_function


def handle_errors(f):
    """Generic error handler decorator"""

    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except ValueError as e:
            logger.warning(f"ValueError in {f.__name__}: {str(e)}")
            return jsonify({
                'success': False,
                'message': 'Invalid input data',
                'error_code': 'INVALID_INPUT'
            }), 400
        except KeyError as e:
            logger.warning(f"KeyError in {f.__name__}: {str(e)}")
            return jsonify({
                'success': False,
                'message': f'Missing required field: {str(e)}',
                'error_code': 'MISSING_FIELD'
            }), 400
        except Exception as e:
            logger.error(f"Unexpected error in {f.__name__}: {str(e)}")
            return jsonify({
                'success': False,
                'message': 'An unexpected error occurred',
                'error_code': 'INTERNAL_ERROR'
            }), 500

    return decorated_function


def require_fresh_token(f):
    """Require a fresh JWT token (recently logged in)"""

    @wraps(f)
    def decorated_function(*args, **kwargs):
        verify_jwt_in_request(fresh=True)
        return f(*args, **kwargs)

    return decorated_function


def track_endpoint_usage(f):
    """Track endpoint usage statistics"""

    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not hasattr(current_app, '_endpoint_stats'):
            current_app._endpoint_stats = {}

        endpoint = request.endpoint
        current_time = time.time()

        if endpoint not in current_app._endpoint_stats:
            current_app._endpoint_stats[endpoint] = {
                'total_calls': 0,
                'total_time': 0,
                'last_called': None
            }

        start_time = time.time()
        result = f(*args, **kwargs)
        execution_time = time.time() - start_time

        # Update stats
        stats = current_app._endpoint_stats[endpoint]
        stats['total_calls'] += 1
        stats['total_time'] += execution_time
        stats['last_called'] = current_time

        return result

    return decorated_function