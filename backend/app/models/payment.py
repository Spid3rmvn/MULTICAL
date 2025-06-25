from app import db
from datetime import datetime
from enum import Enum


class PaymentStatus(Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class PaymentMethod(Enum):
    MPESA_STK = "mpesa_stk"
    MPESA_PAYBILL = "mpesa_paybill"
    CASH = "cash"
    BANK_TRANSFER = "bank_transfer"


class Payment(db.Model):
    __tablename__ = 'payments'

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=True)  # Can be null for paybill
    customer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    payment_method = db.Column(db.Enum(PaymentMethod), nullable=False)
    amount = db.Column(db.Decimal(10, 2), nullable=False)
    status = db.Column(db.Enum(PaymentStatus), default=PaymentStatus.PENDING)

    # M-Pesa specific fields
    mpesa_transaction_id = db.Column(db.String(100), unique=True)
    mpesa_receipt_number = db.Column(db.String(100))
    mpesa_phone_number = db.Column(db.String(15))
    checkout_request_id = db.Column(db.String(255))
    merchant_request_id = db.Column(db.String(255))

    # Transaction details
    transaction_reference = db.Column(db.String(100))
    description = db.Column(db.String(500))
    result_code = db.Column(db.String(10))
    result_description = db.Column(db.String(500))

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = db.Column(db.DateTime)

    def to_dict(self):
        return {
            'id': self.id,
            'order_id': self.order_id,
            'customer_id': self.customer_id,
            'payment_method': self.payment_method.value,
            'amount': float(self.amount),
            'status': self.status.value,
            'mpesa_transaction_id': self.mpesa_transaction_id,
            'mpesa_receipt_number': self.mpesa_receipt_number,
            'mpesa_phone_number': self.mpesa_phone_number,
            'transaction_reference': self.transaction_reference,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }

    def __repr__(self):
        return f'<Payment {self.id} - {self.amount}>'