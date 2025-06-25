from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.service import Service, ServiceStatus, ServiceType
from app.models.category import Category
from app.models.user import User
from sqlalchemy import or_

services_bp = Blueprint('services', __name__)


@services_bp.route('/', methods=['GET'])
def get_services():
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        category_id = request.args.get('category_id', type=int)
        service_type = request.args.get('service_type')
        status = request.args.get('status', 'active')
        featured = request.args.get('featured', type=bool)
        search = request.args.get('search', '')

        # Build query
        query = Service.query

        # Filter by status
        if status:
            query = query.filter(Service.status == ServiceStatus(status))

        # Filter by category
        if category_id:
            query = query.filter(Service.category_id == category_id)

        # Filter by service type
        if service_type:
            query = query.filter(Service.service_type == ServiceType(service_type))

        # Filter by featured
        if featured is not None:
            query = query.filter(Service.is_featured == featured)

        # Search functionality
        if search:
            query = query.filter(or_(
                Service.name.ilike(f'%{search}%'),
                Service.description.ilike(f'%{search}%'),
                Service.short_description.ilike(f'%{search}%')
            ))

        # Order by created_at desc
        query = query.order_by(Service.created_at.desc())

        # Paginate
        pagination = query.paginate(
            page=page, per_page=per_page, error_out=False
        )

        services = [service.to_dict() for service in pagination.items]

        return jsonify({
            'services': services,
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
        return jsonify({'error': 'Failed to fetch services', 'details': str(e)}), 500


@services_bp.route('/<int:service_id>', methods=['GET'])
def get_service(service_id):
    try:
        service = Service.query.get(service_id)

        if not service:
            return jsonify({'error': 'Service not found'}), 404

        return jsonify({'service': service.to_dict()}), 200

    except Exception as e:
        return jsonify({'error': 'Failed to fetch service', 'details': str(e)}), 500


@services_bp.route('/', methods=['POST'])
@jwt_required()
def create_service():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user or not user.is_admin():
            return jsonify({'error': 'Admin access required'}), 403

        data = request.get_json()

        # Validate required fields
        required_fields = ['name', 'service_type', 'price', 'category_id']
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
        while Service.query.filter_by(slug=slug).first():
            slug = f"{original_slug}-{counter}"
            counter += 1

        # Create service
        service = Service(
            name=data['name'],
            slug=slug,
            description=data.get('description'),
            short_description=data.get('short_description'),
            service_type=ServiceType(data['service_type']),
            price=data['price'],
            duration_hours=data.get('duration_hours'),
            status=ServiceStatus(data.get('status', 'active')),
            image_url=data.get('image_url'),
            gallery_images=data.get('gallery_images', []),
            is_featured=data.get('is_featured', False),
            requires_consultation=data.get('requires_consultation', True),
            category_id=data['category_id'],
            specifications=data.get('specifications', {}),
            includes=data.get('includes', [])
        )

        db.session.add(service)
        db.session.commit()

        return jsonify({
            'message': 'Service created successfully',
            'service': service.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create service', 'details': str(e)}), 500