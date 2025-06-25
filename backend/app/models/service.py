from app import db
from datetime import datetime
from enum import Enum


class ServiceStatus(Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class ServiceType(Enum):
    DESIGN = "design"
    PRINTING = "printing"
    CONSULTATION = "consultation"
    INSTALLATION = "installation"


class Service(db.Model):
    __tablename__ = 'services'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(200), unique=True, nullable=False)
    description = db.Column(db.Text)
    short_description = db.Column(db.String(500))
    service_type = db.Column(db.Enum(ServiceType), nullable=False)
    price = db.Column(db.Decimal(10, 2), nullable=False)
    duration_hours = db.Column(db.Integer)  # Estimated service duration
    status = db.Column(db.Enum(ServiceStatus), default=ServiceStatus.ACTIVE)
    image_url = db.Column(db.String(255))
    gallery_images = db.Column(db.JSON)
    is_featured = db.Column(db.Boolean, default=False)
    requires_consultation = db.Column(db.Boolean, default=True)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Service specifications
    specifications = db.Column(db.JSON)

    # What's included in the service
    includes = db.Column(db.JSON)  # Array of what's included

    # SEO fields
    meta_title = db.Column(db.String(200))
    meta_description = db.Column(db.String(500))

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'description': self.description,
            'short_description': self.short_description,
            'service_type': self.service_type.value,
            'price': float(self.price),
            'duration_hours': self.duration_hours,
            'status': self.status.value,
            'image_url': self.image_url,
            'gallery_images': self.gallery_images or [],
            'is_featured': self.is_featured,
            'requires_consultation': self.requires_consultation,
            'category_id': self.category_id,
            'category': self.category.to_dict() if self.category else None,
            'specifications': self.specifications or {},
            'includes': self.includes or [],
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f'<Service {self.name}>'