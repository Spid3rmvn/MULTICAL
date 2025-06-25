import os
from app import create_app
from flask_migrate import upgrade

# Create application instance
app = create_app()

if __name__ == '__main__':
    with app.app_context():
        # Run database migrations if needed
        try:
            upgrade()
            print("Database migrations completed successfully")
        except Exception as e:
            print(f"Database migration error: {e}")

    # Get configuration from environment
    debug = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
    host = os.environ.get('FLASK_HOST', '0.0.0.0')
    port = int(os.environ.get('FLASK_PORT', 5000))

    print(f"Starting Multical Backend API on {host}:{port}")
    print(f"Debug mode: {debug}")
    print(f"Environment: {os.environ.get('FLASK_ENV', 'development')}")

    app.run(
        host=host,
        port=port,
        debug=debug,
        threaded=True
    )