``` markdown
# Multical Ventures Backend API

A comprehensive Flask-based REST API for Multical Ventures - Kenya's premier digital printing, design, and branding company. This backend powers the complete business operations including customer management, product catalog, order processing, M-Pesa payments, and design consultations.

##  Features

### Core Functionality
- **User Management**: Registration, authentication, profile management with role-based access
- **Product Catalog**: Digital printing products with specifications, pricing, and variants
- **Service Management**: Design services, consultations, and custom solutions
- **Order Processing**: Complete order lifecycle from creation to delivery
- **Payment Integration**: M-Pesa STK Push, Paybill, and payment tracking
- **Design Consultations**: Professional design consultation booking system
- **File Management**: Secure upload/download for images, documents, and design files
- **Admin Dashboard**: Comprehensive business analytics and management tools

### Integrations
- **M-Pesa Daraja API**: Complete payment processing for Kenyan customers
- **WhatsApp Business API**: Automated customer notifications via Twilio
- **Email Notifications**: Order confirmations, status updates, and marketing
- **File Storage**: Local storage with AWS S3/Google Cloud Storage support
- **SMS Notifications**: Order and payment confirmations

### Security & Performance
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Admin, staff, and customer permissions
- **Rate Limiting**: API protection against abuse
- **Input Validation**: Comprehensive data validation and sanitization
- **File Upload Security**: Type validation and secure storage
- **Audit Logging**: Activity tracking and security monitoring

##  Tech Stack

- **Framework**: Flask 2.3+ with Blueprint architecture
- **Database**: PostgreSQL 15+ with SQLAlchemy ORM
- **Caching**: Redis for session management and caching
- **Authentication**: JWT tokens with refresh mechanism
- **Payments**: M-Pesa Daraja API v1.0
- **Background Tasks**: Celery with Redis broker
- **File Storage**: Local/AWS S3/Google Cloud Storage
- **Email**: Flask-Mail with SMTP support
- **Documentation**: Automated API documentation
- **Testing**: Pytest with comprehensive test coverage
- **Deployment**: Docker, Gunicorn, and cloud-ready

##  Prerequisites

- Python 3.9+
- PostgreSQL 12+
- Redis 6+
- M-Pesa Developer Account (Safaricom)
- Twilio Account (for WhatsApp)
- SMTP Email Account

##  Quick Start

### 1. Clone and Setup
```bash
# Clone repository
git clone https://github.com/yourusername/multical-backend.git
cd multical-backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```
```
### 2. Environment Configuration
``` bash
# Copy environment template
cp .env.example .env

# Edit configuration (see Configuration section below)
nano .env
```
### 3. Database Setup
``` bash
# Create PostgreSQL database
createdb multical_db

# Initialize Flask-Migrate
flask db init

# Create initial migration
flask db migrate -m "Initial database schema"

# Apply migrations
flask db upgrade

# Create admin user (optional)
python -c "
from app import create_app, db
from app.models.user import User, UserRole
app = create_app()
with app.app_context():
    admin = User(
        email='admin@multical.co.ke',
        first_name='Admin',
        last_name='User',
        phone='+254700000000',
        role=UserRole.SUPER_ADMIN,
        is_active=True,
        email_verified=True
    )
    admin.set_password('admin123')
    db.session.add(admin)
    db.session.commit()
    print('Admin user created')
"
```
### 4. Start Services
``` bash
# Start Redis (if not running)
redis-server

# Start Flask development server
python run.py

# In separate terminals:
# Start Celery worker
celery -A app.celery worker --loglevel=info

# Start Celery beat scheduler
celery -A app.celery beat --loglevel=info
```
### 5. Test Installation
``` bash
# Health check
curl http://localhost:5000/api/health

# Test authentication
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@multical.co.ke", "password": "admin123"}'
```
## Docker Setup
### Development Environment
``` bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Run database migrations
docker-compose exec backend flask db upgrade

# Create admin user
docker-compose exec backend python -c "
from app import create_app, db
from app.models.user import User, UserRole
app = create_app()
with app.app_context():
    admin = User(
        email='admin@multical.co.ke',
        first_name='Admin',
        last_name='User',
        phone='+254700000000',
        role=UserRole.SUPER_ADMIN,
        is_active=True,
        email_verified=True
    )
    admin.set_password('admin123')
    db.session.add(admin)
    db.session.commit()
    print('Admin user created')
"
```
### Production Deployment
``` bash
# Build production image
docker build -t multical-backend:latest .

# Run with production compose
docker-compose -f docker-compose.prod.yml up -d
```
## ⚙️ Configuration
### Essential Environment Variables
``` bash
# Flask Configuration
FLASK_ENV=development|production
SECRET_KEY=your-super-secret-key-min-32-characters
JWT_SECRET_KEY=your-jwt-secret-key-different-from-above

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/multical_db

# Redis
REDIS_URL=redis://localhost:6379/0

# M-Pesa Daraja API
MPESA_ENVIRONMENT=sandbox|production
MPESA_CONSUMER_KEY=your_consumer_key_from_safaricom
MPESA_CONSUMER_SECRET=your_consumer_secret_from_safaricom
MPESA_SHORTCODE=174379  # Your business shortcode
MPESA_PASSKEY=your_passkey_from_safaricom
MPESA_INITIATOR_NAME=testapi  # Your initiator name
MPESA_SECURITY_CREDENTIAL=your_security_credential

# Email Configuration
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-business-email@gmail.com
MAIL_PASSWORD=your-app-specific-password
MAIL_DEFAULT_SENDER=noreply@multical.co.ke

# WhatsApp via Twilio
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Business Settings
BUSINESS_NAME=Multical Ventures
BUSINESS_EMAIL=info@multical.co.ke
BUSINESS_PHONE=+254700000000
FREE_DELIVERY_THRESHOLD=5000
DEFAULT_TAX_RATE=0.16
```
### M-Pesa Integration Setup
1. **Register at Safaricom Developer Portal**
    - Visit [developer.safaricom.co.ke](https://developer.safaricom.co.ke)
    - Create account and new app
    - Get Consumer Key and Consumer Secret

2. **Configure Callback URLs**
``` 
   Validation URL: https://yourdomain.com/api/mpesa/callbacks/validation
   Confirmation URL: https://yourdomain.com/api/mpesa/callbacks/confirmation
   Result URL: https://yourdomain.com/api/mpesa/callbacks/result
```
1. **Test in Sandbox**
    - Use provided test credentials
    - Test phone: 254708374149
    - Test amount: Any amount

2. **Go Live**
    - Submit app for approval
    - Get production credentials
    - Update environment variables

## API Documentation
### Base URL
``` 
Development: http://localhost:5000/api
Production: https://api.multical.co.ke/api
```
### Authentication
All protected endpoints require JWT token:
``` bash
# Get token
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password"
}

# Use token
Authorization: Bearer <your_jwt_token>
```
### Core Endpoints
#### Authentication & Users
``` bash
POST   /api/auth/register           # Register new user
POST   /api/auth/login              # User login
POST   /api/auth/logout             # User logout
POST   /api/auth/refresh            # Refresh token
GET    /api/auth/profile            # Get user profile
PUT    /api/auth/profile            # Update profile
POST   /api/auth/change-password    # Change password
POST   /api/auth/forgot-password    # Request password reset
POST   /api/auth/reset-password     # Reset password
```
#### Products & Services
``` bash
GET    /api/products                # List products
POST   /api/products                # Create product (admin)
GET    /api/products/{id}           # Get product details
PUT    /api/products/{id}           # Update product (admin)
DELETE /api/products/{id}           # Delete product (admin)
GET    /api/products/categories     # Get product categories

GET    /api/services                # List services
POST   /api/services                # Create service (admin)
GET    /api/services/{id}           # Get service details
PUT    /api/services/{id}           # Update service (admin)
DELETE /api/services/{id}           # Delete service (admin)
```
#### Orders & Cart
``` bash
GET    /api/orders                  # List user orders
POST   /api/orders                  # Create new order
GET    /api/orders/{id}             # Get order details
PUT    /api/orders/{id}/cancel      # Cancel order
GET    /api/orders/{id}/tracking    # Track order

# Admin order management
GET    /api/admin/orders            # List all orders
PUT    /api/admin/orders/{id}/status # Update order status
```
#### Payments
``` bash
POST   /api/payments/mpesa/stk-push # Initiate M-Pesa STK Push
GET    /api/payments/{id}/status    # Check payment status
GET    /api/payments/history        # Payment history
POST   /api/payments/verify         # Verify payment
```
#### Design Consultations
``` bash
GET    /api/consultations           # List consultations
POST   /api/consultations           # Book consultation
GET    /api/consultations/{id}      # Get consultation details
PUT    /api/consultations/{id}      # Update consultation
POST   /api/consultations/{id}/cancel # Cancel consultation
```
#### File Uploads
``` bash
POST   /api/uploads/image           # Upload image
POST   /api/uploads/document        # Upload document
POST   /api/uploads/design          # Upload design file
DELETE /api/uploads/delete          # Delete file (admin)
```
#### Admin Dashboard
``` bash
GET    /api/admin/dashboard         # Dashboard statistics
GET    /api/admin/users             # User management
GET    /api/admin/reports/sales     # Sales reports
GET    /api/admin/system/health     # System health
```
### Example API Calls
#### Create Order
``` bash
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "product_id": 1,
        "quantity": 100,
        "specifications": {
          "paper_type": "glossy",
          "color_mode": "full_color"
        }
      }
    ],
    "delivery_address": "123 Main St, Nairobi",
    "delivery_phone": "+254700000000",
    "notes": "Rush order"
  }'
```
#### Initiate M-Pesa Payment
``` bash
curl -X POST http://localhost:5000/api/payments/mpesa/stk-push \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": 123,
    "phone_number": "254700000000",
    "amount": 1500
  }'
```
## ️ Database Schema
### Key Models & Relationships
``` sql
-- Users (customers, staff, admins)
User {
  id, email, phone, first_name, last_name, 
  role, is_active, created_at
}

-- Product categories
Category {
  id, name, slug, description, parent_id, 
  image_url, sort_order, is_active
}

-- Printable products
Product {
  id, name, slug, description, category_id,
  base_price, sku, specifications, images,
  is_active, created_at
}

-- Design services
Service {
  id, name, slug, description, category_id,
  base_price, duration_hours, requirements,
  is_active, created_at
}

-- Customer orders
Order {
  id, order_number, customer_id, status,
  total_amount, delivery_info, items,
  created_at, confirmed_at, completed_at
}

-- Payment transactions
Payment {
  id, order_id, amount, method, status,
  mpesa_transaction_id, reference_number,
  created_at, completed_at
}

-- Design consultations
DesignConsultation {
  id, customer_id, project_title, description,
  budget_range, status, scheduled_date,
  created_at, confirmed_at
}
```
### Relationships
- User → Orders (1:many)
- User → Payments (1:many)
- User → DesignConsultations (1:many)
- Category → Products (1:many)
- Category → Services (1:many)
- Order → Payments (1:many)
- Product/Service → OrderItems (1:many)

## Testing
### Run Tests
``` bash
# Install test dependencies
pip install pytest pytest-flask pytest-cov

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_auth.py

# Run with verbose output
pytest -v
```
### Test Structure
``` 
tests/
├── conftest.py              # Test configuration
├── test_auth.py             # Authentication tests
├── test_products.py         # Product API tests
├── test_orders.py           # Order processing tests
├── test_payments.py         # Payment integration tests
├── test_mpesa.py            # M-Pesa specific tests
└── test_admin.py            # Admin functionality tests
```
### Sample Test
``` python
def test_create_order(client, auth_headers):
    """Test order creation"""
    response = client.post('/api/orders', 
        headers=auth_headers,
        json={
            'items': [{'product_id': 1, 'quantity': 10}],
            'delivery_address': 'Test Address'
        }
    )
    assert response.status_code == 201
    assert 'order_number' in response.json['order']
```
## Deployment
### Production Checklist
#### Security
- [ ] Set strong SECRET_KEY and JWT_SECRET_KEY
- [ ] Use HTTPS in production
- [ ] Configure CORS for frontend domain only
- [ ] Set up rate limiting
- [ ] Enable SQL injection protection
- [ ] Validate file uploads
- [ ] Set up firewall rules

#### Performance
- [ ] Use Gunicorn with multiple workers
- [ ] Set up Redis for caching
- [ ] Configure CDN for static files
- [ ] Enable gzip compression
- [ ] Optimize database queries
- [ ] Set up database connection pooling

#### Monitoring
- [ ] Configure structured logging
- [ ] Set up error tracking (Sentry)
- [ ] Monitor database performance
- [ ] Set up health checks
- [ ] Configure alerts for critical errors
- [ ] Monitor M-Pesa callback delivery

#### Backup
- [ ] Automated database backups
- [ ] File storage backups
- [ ] Test backup restoration
- [ ] Backup encryption

### Heroku Deployment
``` bash
# Create Heroku app
heroku create multical-api

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev

# Add Redis addon
heroku addons:create heroku-redis:hobby-dev

# Set environment variables
heroku config:set FLASK_ENV=production
heroku config:set SECRET_KEY=your-secret-key
# ... set other variables

# Deploy
git push heroku main

# Run migrations
heroku run flask db upgrade

# Create admin user
heroku run python -c "from scripts.create_admin import create_admin; create_admin()"
```
### DigitalOcean/AWS Deployment
``` bash
# Build and push Docker image
docker build -t multical-backend .
docker tag multical-backend registry.digitalocean.com/your-registry/multical-backend
docker push registry.digitalocean.com/your-registry/multical-backend

# Deploy with docker-compose
docker-compose -f docker-compose.prod.yml up -d
```
## Development
### Code Standards
``` bash
# Format code
black app/ tests/

# Lint code
flake8 app/ tests/

# Sort imports
isort app/ tests/

# Type checking
mypy app/
```
### Database Migrations
``` bash
# Create migration after model changes
flask db migrate -m "Add new field to Product model"

# Review migration file in migrations/versions/
# Edit if necessary

# Apply migration
flask db upgrade

# Rollback if needed
flask db downgrade
```
### Adding New Features
1. Create feature branch
2. Add models if needed
3. Create/update routes
4. Add business logic to services
5. Write tests
6. Update documentation
7. Create pull request

### Debugging
``` bash
# Enable debug mode
export FLASK_DEBUG=1

# View detailed logs
tail -f logs/multical.log

# Database debugging
flask shell
>>> from app import db
>>> db.session.execute('SELECT version()').fetchone()
```
## Monitoring & Logging
### Application Logs
``` bash
# View real-time logs
tail -f logs/multical.log

# Search logs
grep "ERROR" logs/multical.log

# Filter by date
grep "2024-01-15" logs/multical.log
```
### Performance Monitoring
``` python
# Add to routes for timing
import time
start_time = time.time()
# ... route logic
logger.info(f"Route executed in {time.time() - start_time:.3f}s")
```
### Health Checks
``` bash
# Application health
curl http://localhost:5000/api/health

# Database connectivity
curl http://localhost:5000/api/admin/system/health
```
## Troubleshooting
### Common Issues
#### Database Connection Error
``` bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -h localhost -U username -d multical_db

# Reset database (development only)
flask db stamp head
flask db migrate
flask db upgrade
```
#### M-Pesa Integration Issues
``` bash
# Check credentials
curl -X POST https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials \
  -H "Authorization: Basic <base64(consumer_key:consumer_secret)>"

# Verify callback URLs are accessible
curl -X POST https://yourdomain.com/api/mpesa/callbacks/validation

# Check M-Pesa logs
grep "mpesa" logs/multical.log
```
#### File Upload Problems
``` bash
# Check upload directory permissions
ls -la uploads/

# Check disk space
df -h

# Verify file size limits
grep "MAX_FILE_SIZE" .env
```
#### Redis Connection Issues
``` bash
# Check Redis status
redis-cli ping

# Check Redis configuration
redis-cli CONFIG GET "*"

# Clear Redis cache
redis-cli FLUSHALL
```
## Support & Contributing
### Getting Help
- **Email**: dev@multical.co.ke
- **Documentation**: [Full API Documentation](https://docs.multical.co.ke)
- **Issues**: [GitHub Issues](https://github.com/multical/backend/issues)

### Contributing
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Review Guidelines
- Write tests for new features
- Follow existing code style
- Update documentation
- Add type hints
- Keep functions small and focused

## License
Copyright © 2024 Multical Ventures Ltd. All rights reserved.
This software is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.
**Built with ❤️ in Nairobi, Kenya for the creative community**
For technical support or business inquiries, contact us at info@multical.co.ke
``` 

This comprehensive README provides:

✅ **Complete setup instructions** with step-by-step guides
✅ **Docker deployment** for both development and production  
✅ **M-Pesa integration guide** with Safaricom Developer Portal setup
✅ **Full API documentation** with example requests
✅ **Database schema** overview with relationships
✅ **Testing guidelines** with coverage reports
✅ **Production deployment** checklist and procedures
✅ **Troubleshooting guide** for common issues
✅ **Development workflow** and contribution guidelines
✅ **Monitoring and logging** setup
✅ **Security considerations** and best practices
```
