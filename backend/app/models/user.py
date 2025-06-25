from email.policy import default

from app import db
from flask_bcrypt import generate_password_hash, check_password_hash
from datetime import datetime
from enum import Enum

class UserRole(Enum):
    CUSTOMER = 'customer'
    ADMIN = 'admin'
    SUPER_ADMIN = 'super_admin'

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(15), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(120), nullable=False)
    last_name = db.Column(db.String(120), nullable=False)
    role = db.Column(db.Enum(UserRole), default=UserRole.CUSTOMER,nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    email_verified = db.Column(db.Boolean, default=False)
    phone_verified = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = db.Column(db.DateTime)


    # Relationships

    orders = db.relationship('Order', backref='user', lazy=True)
    payment_methods = db.relationship('PaymentMethod', backref='user', lazy=True)
    consultations = db.relationship('Consultation', backref='user', lazy=True)

    def __init__(self, email, phone, password, first_name, last_name, role=UserRole.CUSTOMER):
        self.email = email
        self.phone = phone
        self.password_hash = generate_password_hash(password).decode('utf-8')
        self.first_name = first_name
        self.last_name = last_name
        self.role = role

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def is_admin(self):
        return self.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN]

    def is_super_admin(self):
        return self.role == UserRole.SUPER_ADMIN

    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name}'

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'phone': self.phone,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': self.full_name,
            'role': self.role.value,
            'is_active': self.is_active,
            'email_verified': self.email_verified,
            'phone_verified': self.phone_verified,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }

    def __repr__(self):
        return f'<User {self.full_name}>'
