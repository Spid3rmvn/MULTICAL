from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.product import Product, ProductStatus
from app.models.category import Category
from app.models.user import User
from sqlalchemy import or_

products_bp = Blueprint('products', __name__)


@products_bp.route('/', methods=['GET'])
def get_products():
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        category_id = request.args.get('category_id', type=int)
        status = request.args.get('status', 'active')
        featured = request.args.get('featured', type=bool)
        search = request.args.get('search', '')
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'desc')

        # Build query
        query = Product.query

        # Filter by status
        if status:
            query = query.filter(Product.status == ProductStatus(status))

        # Filter by category
        if category_id:
            query = query.filter(Product.category_id == category_id)

        # Filter by featured
        if featured is not None:
            query = query.filter(Product.is_featured == featured)

        # Search functionality
        if search:
            query = query.filter(or_(
                Product.name.ilike(f'%{search}%'),
                Product.description.ilike(f'%{search}%'),
                Product.short_description.ilike(f'%{search}%')
            ))

        # Sorting
        if sort_by == 'name':
            query = query.order_by(Product.name.asc() if sort_order == 'asc' else Product.name.desc())
        elif sort_by == 'price':
            query = query.order_by(Product.price.asc() if sort_order == 'asc' else Product.price.desc())
        elif sort_by == 'created_at':
            query = query.order_by(Product.created_at.asc() if sort_order == 'asc' else Product.created_at.desc())

        # Paginate
        pagination = query.paginate(
            page=page, per_page=per_page, error_out=False
        )

        products = [product.to_dict() for product in pagination.items]

        return jsonify({
            'products': products,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': pagination.total,
                'pages': pagination.pages,
                'has_next': pagination.has_next,
                'has_prev': pagination.has_prev
            }
        }), 200

    except Exception as e:
        return jsonify({'error': 'Failed to fetch products', 'details': str(e)}), 500


@products_bp.route('/<int:product_id>', methods=['GET'])
def get_product(product_id):
    try:
        product = Product.query.get(product_id)

        if not product:
            return jsonify({'error': 'Product not found'}), 404

        return jsonify({'product': product.to_dict()}), 200

    except Exception as e:
        return jsonify({'error': 'Failed to fetch product', 'details': str(e)}), 500


@products_bp.route('/slug/<string:slug>', methods=['GET'])
def get_product_by_slug(slug):
    try:
        product = Product.query.filter_by(slug=slug).first()

        if not product:
            return jsonify({'error': 'Product not found'}), 404

        return jsonify({'product': product.to_dict()}), 200

    except Exception as e:
        return jsonify({'error': 'Failed to fetch product', 'details': str(e)}), 500


@products_bp.route('/', methods=['POST'])
@jwt_required()
def create_product():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user or not user.is_admin():
            return jsonify({'error': 'Admin access required'}), 403

        data = request.get_json()

        # Validate required fields
        required_fields = ['name', 'price', 'category_id']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400

        # Check if category exists
        category = Category.query.get(data['category_id'])
        if not category:
            return jsonify({'error': 'Category not found'}), 404

        # Generate slug from name
        import re
        slug = re.sub(r'[^a-zA-Z0-9]+', '-', data['name'].lower()).strip('-')

        # Ensure slug is unique
        counter = 1
        original_slug = slug
        while Product.query.filter_by(slug=slug).first():
            slug = f"{original_slug}-{counter}"
            counter += 1

        # Create product
        product = Product(
            name=data['name'],
            slug=slug,
            description=data.get('description'),
            short_description=data.get('short_description'),
            price=data['price'],
            compare_price=data.get('compare_price'),
            sku=data.get('sku'),
            status=ProductStatus(data.get('status', 'active')),
            stock_quantity=data.get('stock_quantity', 0),
            low_stock_threshold=data.get('low_stock_threshold', 10),
            weight=data.get('weight'),
            dimensions=data.get('dimensions'),
            image_url=data.get('image_url'),
            gallery_images=data.get('gallery_images', []),
            is_featured=data.get('is_featured', False),
            requires_design=data.get('requires_design', False),
            category_id=data['category_id'],
            specifications=data.get('specifications', {}),
            meta_title=data.get('meta_title'),
            meta_description=data.get('meta_description')
        )

        db.session.add(product)
        db.session.commit()

        return jsonify({
            'message': 'Product created successfully',
            'product': product.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create product', 'details': str(e)}), 500


@products_bp.route('/<int:product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id):
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user or not user.is_admin():
            return jsonify({'error': 'Admin access required'}), 403

        product = Product.query.get(product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404

        data = request.get_json()

        # Update fields
        if 'name' in data:
            product.name = data['name']
        if 'description' in data:
            product.description = data['description']
        if 'short_description' in data:
            product.short_description = data['short_description']
        if 'price' in data:
            product.price = data['price']
        if 'compare_price' in data:
            product.compare_price = data['compare_price']
        if 'sku' in data:
            product.sku = data['sku']
        if 'status' in data:
            product.status = ProductStatus(data['status'])
        if 'stock_quantity' in data:
            product.stock_quantity = data['stock_quantity']
        if 'category_id' in data:
            category = Category.query.get(data['category_id'])
            if not category:
                return jsonify({'error': 'Category not found'}), 404
            product.category_id = data['category_id']
        if 'is_featured' in data:
            product.is_featured = data['is_featured']
        if 'specifications' in data:
            product.specifications = data['specifications']

        product.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'message': 'Product updated successfully',
            'product': product.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update product', 'details': str(e)}), 500


@products_bp.route('/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user or not user.is_admin():
            return jsonify({'error': 'Admin access required'}), 403

        product = Product.query.get(product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404

        db.session.delete(product)
        db.session.commit()

        return jsonify({'message': 'Product deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to delete product', 'details': str(e)}), 500