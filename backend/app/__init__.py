from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
import os
import redis

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
cors = CORS()
redis_clients = None

def create_app(config_name=None):
    """Application factory pattern"""
    app = Flask(__name__)

    # Load configuration
    from app.config.config import config
    config_name = config_name or os.getenv('FLASK_ENV', 'default')
    app.config.from_object(config[config_name])

    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app,db)
    jwt.init_app(app)
    CORS(app, origins=['http://localhost:3000', 'http://localhost:5173'])  # Allow React dev server

    # Initialize Redis
    global redis_client
    try:
        redis_client = redis.from_url(app.config['REDIS_URL'], decode_responses=True)
        redis_client.ping()  # Test connection
    except redis.ConnectionError:
        print("Warning: Redis connection failed. Some features may not work.")
        redis_client = None

    # Create upload directory
    upload_dir = os.path.join(app.instance_path, app.config['UPLOAD_FOLDER'])
    os.makedirs(upload_dir, exist_ok=True)

    # Register blueprints
    register_blueprints(app)

    # Error handlers
    register_error_handlers(app)

    return app


def register_blueprints(app):
    """Register application blueprints"""
    from app.routes.auth import auth_bp
    from app.routes.products import products_bp
    from app.routes.services import services_bp
    from app.routes.orders import orders_bp
    from app.routes.payments import payments_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.mpesa_callbacks import mpesa_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(products_bp, url_prefix='/api/products')
    app.register_blueprint(services_bp, url_prefix='/api/services')
    app.register_blueprint(orders_bp, url_prefix='/api/orders')
    app.register_blueprint(payments_bp, url_prefix='/api/payments')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(mpesa_bp, url_prefix='/api/mpesa')


def register_error_handlers(app):
    """Register error handlers"""
    from flask import jsonify

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Resource not found'}), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal server error'}), 500

    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({'error': 'Bad request'}), 400
