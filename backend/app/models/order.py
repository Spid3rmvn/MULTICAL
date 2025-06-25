from app import db
from datetime import datetime
from enum import Enum


class OrderStatus(Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    READY = "ready"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class OrderType(Enum):
    PRODUCT = "product"
    SERVICE = "service"
    MIXED = "mixed"


class Order(db.Model):
    __tablename__ = 'orders'

    id = db.Column(db.Integer, primary_key=True)
    order_number = db.Column(db.String(50), unique=True, nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    order_type = db.Column(db.Enum(OrderType), nullable=False)
    status = db.Column(db.Enum(OrderStatus), default=OrderStatus.PENDING)

    # Pricing
    subtotal = db.Column(db.Decimal(10, 2), nullable=False)
    tax_amount = db.Column(db.Decimal(10, 2), default=0)
    shipping_amount = db.Column(db.Decimal(10, 2), default=0)
    discount_amount = db.Column(db.Decimal(10, 2), default=0)
    total_amount = db.Column(db.Decimal(10, 2), nullable=False)

    # Customer information
    customer_email = db.Column(db.String(120), nullable=False)
    customer_phone = db.Column(db.String(15), nullable=False)
    customer_name = db.Column(db.String(100), nullable=False)

    # Delivery information
    delivery_address = db.Column(db.Text)
    delivery_city = db.Column(db.String(100))
    delivery_notes = db.Column(db.Text)
    estimated_delivery_date = db.Column(db.DateTime)
    actual_delivery_date = db.Column(db.DateTime)

    # Payment status
    payment_status = db.Column(db.String(50), default='pending')
    payment_method = db.Column(db.String(50))

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    confirmed_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)

    # Relationships
    order_items = db.relationship('OrderItem', backref='order', lazy=True, cascade='all, delete-orphan')
    payments = db.relationship('Payment', backref='order', lazy=True)

    def __init__(self, customer_id, order_type, customer_email, customer_phone, customer_name):
        self.customer_id = customer_id
        self.order_type = order_type
        self.customer_email = customer_email
        self.customer_phone = customer_phone
        self.customer_name = customer_name
        self.order_number = self.generate_order_number()

    def generate_order_number(self):
        """Generate unique order number"""
        import uuid
        return f"MUL{datetime.now().strftime('%Y%m%d')}{str(uuid.uuid4())[:8].upper()}"

    def calculate_totals(self):
        """Calculate order totals from order items"""
        self.subtotal = sum(item.total_price for item in self.order_items)
        # Add tax calculation logic here if needed
        self.total_amount = self.subtotal + self.tax_amount + self.shipping_amount - self.discount_amount

    def to_dict(self):
        return {
            'id': self.id,
            'order_number': self.order_number,
            'customer_id': self.customer_id,
            'order_type': self.order_type.value,
            'status': self.status.value,
            'subtotal': float(self.subtotal),
            'tax_amount': float(self.tax_amount),
            'shipping_amount': float(self.shipping_amount),
            'discount_amount': float(self.discount_amount),
            'total_amount': float(self.total_amount),
            'customer_email': self.customer_email,
            'customer_phone': self.customer_phone,
            'customer_name': self.customer_name,
            'delivery_address': self.delivery_address,
            'delivery_city': self.delivery_city,
            'delivery_notes': self.delivery_notes,
            'payment_status': self.payment_status,
            'payment_method': self.payment_method,
            'estimated_delivery_date': self.estimated_delivery_date.isoformat() if self.estimated_delivery_date else None,
            'actual_delivery_date': self.actual_delivery_date.isoformat() if self.actual_delivery_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'order_items': [item.to_dict() for item in self.order_items],
            'payments': [payment.to_dict() for payment in self.payments]
        }

    def __repr__(self):
        return f'<Order {self.order_number}>'


class OrderItem(db.Model):
    __tablename__ = 'order_items'

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    item_type = db.Column(db.String(20), nullable=False)  # 'product' or 'service'
    item_id = db.Column(db.Integer, nullable=False)  # product_id or service_id
    item_name = db.Column(db.String(200), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    unit_price = db.Column(db.Decimal(10, 2), nullable=False)
    total_price = db.Column(db.Decimal(10, 2), nullable=False)

    # For custom specifications
    specifications = db.Column(db.JSON)
    design_notes = db.Column(db.Text)
    design_files = db.Column(db.JSON)  # Array of uploaded design file URLs

    def to_dict(self):
        return {
            'id': self.id,
            'order_id': self.order_id,
            'item_type': self.item_type,
            'item_id': self.item_id,
            'item_name': self.item_name,
            'quantity': self.quantity,
            'unit_price': float(self.unit_price),
            'total_price': float(self.total_price),
            'specifications': self.specifications or {},
            'design_notes': self.design_notes,
            'design_files': self.design_files or []
        }

    def __repr__(self):
        return f'<OrderItem {self.item_name} x{self.quantity}>'