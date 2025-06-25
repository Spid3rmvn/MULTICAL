from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.category import Category
from app.models.user import User
from app.utils.validators import validate_json, admin_required, Validator, ValidationError
from app.services.file_service import FileService
import logging

logger = logging.getLogger(__name__)

categories_bp = Blueprint('categories', __name__)
file_service = FileService()


@categories_bp.route('/', methods=['GET'])
def get_categories():
    """Get all categories"""
    try:
        # Get query parameters
        include_inactive = request.args.get('include_inactive', 'false').lower() == 'true'

        # Build query
        query = Category.query

        if not include_inactive:
            query = query.filter_by(is_active=True)

        categories = query.order_by(Category.sort_order.asc(), Category.name.asc()).all()

        return jsonify({
            'success': True,
            'categories': [category.to_dict() for category in categories],
            'total': len(categories)
        }), 200

    except Exception as e:
        logger.error(f"Error fetching categories: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch categories'
        }), 500


@categories_bp.route('/<int:category_id>', methods=['GET'])
def get_category(category_id):
    """Get single category by ID"""
    try:
        category = Category.query.get_or_404(category_id)

        return jsonify({
            'success': True,
            'category': category.to_dict()
        }), 200

    except Exception as e:
        logger.error(f"Error fetching category {category_id}: {e}")
        return jsonify({
            'success': False,
            'message': 'Category not found'
        }), 404


@categories_bp.route('/slug/<slug>', methods=['GET'])
def get_category_by_slug(slug):
    """Get category by slug"""
    try:
        category = Category.query.filter_by(slug=slug, is_active=True).first_or_404()

        return jsonify({
            'success': True,
            'category': category.to_dict()
        }), 200

    except Exception as e:
        logger.error(f"Error fetching category by slug {slug}: {e}")
        return jsonify({
            'success': False,
            'message': 'Category not found'
        }), 404


@categories_bp.route('/', methods=['POST'])
@jwt_required()
@admin_required
@validate_json('name')
def create_category():
    """Create new category"""
    try:
        data = request.get_json()

        # Validate required fields
        name = Validator.validate_required_string(data.get('name'), 'Name', max_length=100)

        # Validate optional fields
        description = data.get('description', '').strip()
        if description and len(description) > 500:
            raise ValidationError('Description must not exceed 500 characters', 'description')

        parent_id = data.get('parent_id')
        if parent_id:
            parent = Category.query.get(parent_id)
            if not parent:
                raise ValidationError('Parent category not found', 'parent_id')

        sort_order = Validator.validate_integer(
            data.get('sort_order', 0),
            'Sort order',
            min_value=0,
            max_value=9999
        )

        # Check if category name already exists
        existing = Category.query.filter_by(name=name).first()
        if existing:
            return jsonify({
                'success': False,
                'message': 'Category with this name already exists'
            }), 400

        # Create category
        category = Category(
            name=name,
            description=description or None,
            parent_id=parent_id,
            sort_order=sort_order,
            is_active=data.get('is_active', True)
        )

        db.session.add(category)
        db.session.commit()

        logger.info(f"Category created: {category.name} (ID: {category.id})")

        return jsonify({
            'success': True,
            'message': 'Category created successfully',
            'category': category.to_dict()
        }), 201

    except ValidationError as e:
        return jsonify({
            'success': False,
            'message': e.message,
            'field': e.field
        }), 400
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating category: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to create category'
        }), 500


@categories_bp.route('/<int:category_id>', methods=['PUT'])
@jwt_required()
@admin_required
@validate_json('name')
def update_category(category_id):
    """Update category"""
    try:
        category = Category.query.get_or_404(category_id)
        data = request.get_json()

        # Validate required fields
        name = Validator.validate_required_string(data.get('name'), 'Name', max_length=100)

        # Validate optional fields
        description = data.get('description', '').strip()
        if description and len(description) > 500:
            raise ValidationError('Description must not exceed 500 characters', 'description')

        parent_id = data.get('parent_id')
        if parent_id:
            if parent_id == category_id:
                raise ValidationError('Category cannot be its own parent', 'parent_id')

            parent = Category.query.get(parent_id)
            if not parent:
                raise ValidationError('Parent category not found', 'parent_id')

            # Check for circular reference
            if category.would_create_cycle(parent_id):
                raise ValidationError('This would create a circular reference', 'parent_id')

        sort_order = Validator.validate_integer(
            data.get('sort_order', category.sort_order),
            'Sort order',
            min_value=0,
            max_value=9999
        )

        # Check if name is taken by another category
        existing = Category.query.filter(
            Category.name == name,
            Category.id != category_id
        ).first()

        if existing:
            return jsonify({
                'success': False,
                'message': 'Category with this name already exists'
            }), 400

        # Update category
        category.name = name
        category.description = description or None
        category.parent_id = parent_id
        category.sort_order = sort_order
        category.is_active = data.get('is_active', category.is_active)

        db.session.commit()

        logger.info(f"Category updated: {category.name} (ID: {category.id})")

        return jsonify({
            'success': True,
            'message': 'Category updated successfully',
            'category': category.to_dict()
        }), 200

    except ValidationError as e:
        return jsonify({
            'success': False,
            'message': e.message,
            'field': e.field
        }), 400
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating category {category_id}: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to update category'
        }), 500


@categories_bp.route('/<int:category_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_category(category_id):
    """Delete category"""
    try:
        category = Category.query.get_or_404(category_id)

        # Check if category has children
        if category.children:
            return jsonify({
                'success': False,
                'message': 'Cannot delete category with subcategories. Delete or move subcategories first.'
            }), 400

        # Check if category has products/services
        if category.products or category.services:
            return jsonify({
                'success': False,
                'message': 'Cannot delete category with products or services. Move or delete them first.'
            }), 400

        # Delete category image if exists
        if category.image_url:
            file_service.delete_file(category.image_url)

        db.session.delete(category)
        db.session.commit()

        logger.info(f"Category deleted: {category.name} (ID: {category_id})")

        return jsonify({
            'success': True,
            'message': 'Category deleted successfully'
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting category {category_id}: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to delete category'
        }), 500


@categories_bp.route('/<int:category_id>/toggle-status', methods=['PATCH'])
@jwt_required()
@admin_required
def toggle_category_status(category_id):
    """Toggle category active status"""
    try:
        category = Category.query.get_or_404(category_id)

        category.is_active = not category.is_active
        db.session.commit()

        status = 'activated' if category.is_active else 'deactivated'
        logger.info(f"Category {status}: {category.name} (ID: {category_id})")

        return jsonify({
            'success': True,
            'message': f'Category {status} successfully',
            'category': category.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error toggling category status {category_id}: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to update category status'
        }), 500


@categories_bp.route('/<int:category_id>/upload-image', methods=['POST'])
@jwt_required()
@admin_required
def upload_category_image(category_id):
    """Upload category image"""
    try:
        category = Category.query.get_or_404(category_id)

        if 'image' not in request.files:
            return jsonify({
                'success': False,
                'message': 'No image file provided'
            }), 400

        file = request.files['image']

        # Upload image
        result = file_service.upload_file(file, file_type='images', resize_images=True)

        if not result['success']:
            return jsonify({
                'success': False,
                'message': result['message']
            }), 400

        # Delete old image if exists
        if category.image_url:
            file_service.delete_file(category.image_url)

        # Update category with new image
        category.image_url = result['file_url']
        db.session.commit()

        logger.info(f"Image uploaded for category: {category.name}")

        return jsonify({
            'success': True,
            'message': 'Image uploaded successfully',
            'image_url': category.image_url,
            'category': category.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error uploading category image: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to upload image'
        }), 500


@categories_bp.route('/tree', methods=['GET'])
def get_category_tree():
    """Get categories in tree structure"""
    try:
        include_inactive = request.args.get('include_inactive', 'false').lower() == 'true'

        # Get root categories (no parent)
        query = Category.query.filter_by(parent_id=None)

        if not include_inactive:
            query = query.filter_by(is_active=True)

        root_categories = query.order_by(Category.sort_order.asc(), Category.name.asc()).all()

        def build_tree(categories):
            result = []
            for category in categories:
                category_dict = category.to_dict()

                # Get children
                children_query = Category.query.filter_by(parent_id=category.id)
                if not include_inactive:
                    children_query = children_query.filter_by(is_active=True)

                children = children_query.order_by(Category.sort_order.asc(), Category.name.asc()).all()

                if children:
                    category_dict['children'] = build_tree(children)
                else:
                    category_dict['children'] = []

                result.append(category_dict)

            return result

        tree = build_tree(root_categories)

        return jsonify({
            'success': True,
            'categories': tree
        }), 200

    except Exception as e:
        logger.error(f"Error building category tree: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch category tree'
        }), 500


@categories_bp.route('/reorder', methods=['POST'])
@jwt_required()
@admin_required
@validate_json('categories')
def reorder_categories():
    """Reorder categories"""
    try:
        data = request.get_json()
        categories_data = data.get('categories', [])

        if not isinstance(categories_data, list):
            return jsonify({
                'success': False,
                'message': 'Categories must be an array'
            }), 400

        # Update sort orders
        for index, category_data in enumerate(categories_data):
            category_id = category_data.get('id')
            if not category_id:
                continue

            category = Category.query.get(category_id)
            if category:
                category.sort_order = index

        db.session.commit()

        logger.info("Categories reordered successfully")

        return jsonify({
            'success': True,
            'message': 'Categories reordered successfully'
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error reordering categories: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to reorder categories'
        }), 500