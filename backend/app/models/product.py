from app import db
from datetime import datetime
from enum import Enum


class ProductStatus(Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    OUT_OF_STOCK = "out_of_stock"


class Product(db.Model):
    __tablename__ = 'products'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(200), unique=True, nullable=False)
    description = db.Column(db.Text)
    short_description = db.Column(db.String(500))
    price = db.Column(db.Decimal(10, 2), nullable=False)
    compare_price = db.Column(db.Decimal(10, 2))  # Original price for discounts
    sku = db.Column(db.String(100), unique=True)
    status = db.Column(db.Enum(ProductStatus), default=ProductStatus.ACTIVE)
    stock_quantity = db.Column(db.Integer, default=0)
    low_stock_threshold = db.Column(db.Integer, default=10)
    weight = db.Column(db.Decimal(8, 2))  # in grams
    dimensions = db.Column(db.String(100))  # "L x W x H"
    image_url = db.Column(db.String(255))
    gallery_images = db.Column(db.JSON)  # Array of image URLs
    is_featured = db.Column(db.Boolean, default=False)
    requires_design = db.Column(db.Boolean, default=False)  # Needs design consultation
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Product specifications (JSON field for flexible attributes)
    specifications = db.Column(db.JSON)

    # SEO fields
    meta_title = db.Column(db.String(200))
    meta_description = db.Column(db.String(500))

    @property
    def is_in_stock(self):
        return self.stock_quantity > 0

    @property
    def is_low_stock(self):
        return self.stock_quantity <= self.low_stock_threshold

    @property
    def discount_percentage(self):
        if self.compare_price and self.compare_price > self.price:
            return round(((self.compare_price - self.price) / self.compare_price) * 100, 2)
        return 0

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'description': self.description,
            'short_description': self.short_description,
            'price': float(self.price),
            'compare_price': float(self.compare_price) if self.compare_price else None,
            'sku': self.sku,
            'status': self.status.value,
            'stock_quantity': self.stock_quantity,
            'is_in_stock': self.is_in_stock,
            'is_low_stock': self.is_low_stock,
            'weight': float(self.weight) if self.weight else None,
            'dimensions': self.dimensions,
            'image_url': self.image_url,
            'gallery_images': self.gallery_images or [],
            'is_featured': self.is_featured,
            'requires_design': self.requires_design,
            'category_id': self.category_id,
            'category': self.category.to_dict() if self.category else None,
            'specifications': self.specifications or {},
            'discount_percentage': self.discount_percentage,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

    def __repr__(self):
        return f'<Product {self.name}>'