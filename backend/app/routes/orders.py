from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.order import Order, OrderItem, OrderStatus, OrderType
from app.models.product import Product
from app.models.service import Service
from app.models.user import User
from datetime import datetime

orders_bp = Blueprint('orders', __name__)


@orders_bp.route('/', methods=['GET'])
@jwt_required()
def get_orders():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        status = request.args.get('status')

        # Build query - customers see only their orders, admins see all
        if user.is_admin():
            query = Order.query
        else:
            query = Order.query.filter_by(customer_id=user_id)

        # Filter by status
        if status:
            query = query.filter(Order.status == OrderStatus(status))

        # Order by created_at desc
        query = query.order_by(Order.created_at.desc())

        # Paginate
        pagination = query.paginate(
            page=page, per_page=per_page, error_out=False
        )

        orders = [order.to_dict() for order in pagination.items]

        return jsonify({
            'orders': orders,
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
        return jsonify({'error': 'Failed to fetch orders', 'details': str(e)}), 500


@orders_bp.route('/<int:order_id>', methods=['GET'])
@jwt_required()
def get_order(order_id):
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        order = Order.query.get(order_id)
        if not order:
            return jsonify({'error': 'Order not found'}), 404

        # Check permissions - customers can only see their orders
        if not user.is_admin() and order.customer_id != user_id:
            return jsonify({'error': 'Access denied'}), 403

        return jsonify({'order': order.to_dict()}), 200

    except Exception as e:
        return jsonify({'error': 'Failed to fetch order', 'details': str(e)}), 500


@orders_bp.route('/', methods=['POST'])
@jwt_required()
def create_order():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.get_json()

        # Validate required fields
        if not data.get('items') or len(data['items']) == 0:
            return jsonify({'error': 'Order items are required'}), 400

        # Determine order type
        has_products = any(item.get('item_type') == 'product' for item in data['items'])
        has_services = any(item.get('item_type') == 'service' for item in data['items'])

        if has_products and has_services:
            order_type = OrderType.MIXED
        elif has_products:
            order_type = OrderType.PRODUCT
        else:
            order_type = OrderType.SERVICE

        # Create order
        order = Order(
            customer_id=user_id,
            order_type=order_type,
            customer_email=user.email,
            customer_phone=user.phone,
            customer_name=user.full_name
        )

        # Add delivery information if provided
        if data.get('delivery_address'):
            order.delivery_address = data['delivery_address']
        if data.get('delivery_city'):
            order.delivery_city = data['delivery_city']
        if data.get('delivery_notes'):
            order.delivery_notes = data['delivery_notes']

        db.session.add(order)
        db.session.flush()  # Get order ID

        # Add order items
        subtotal = 0
        for item_data in data['items']:
            if item_data.get('item_type') == 'product':
                product = Product.query.get(item_data.get('item_id'))
                if not product:
                    return jsonify({'error': f'Product {item_data.get("item_id")} not found'}), 404

                # Check stock
                quantity = item_data.get('quantity', 1)
                if product.stock_quantity < quantity:
                    return jsonify({'error': f'Insufficient stock for {product.name}'}), 400

                unit_price = product.price
                item_name = product.name

                # Update stock
                product.stock_quantity -= quantity

            elif item_data.get('item_type') == 'service':
                service = Service.query.get(item_data.get('item_id'))
                if not service:
                    return jsonify({'error': f'Service {item_data.get("item_id")} not found'}), 404

                quantity = 1  # Services are typically quantity 1
                unit_price = service.price
                item_name = service.name
            else:
                return jsonify({'error': 'Invalid item type'}), 400

            total_price = unit_price * quantity
            subtotal += total_price

            # Create order item
            order_item = OrderItem(
                order_id=order.id,
                item_type=item_data.get('item_type'),
                item_id=item_data.get('item_id'),
                item_name=item_name,
                quantity=quantity,
                unit_price=unit_price,
                total_price=total_price,
                specifications=item_data.get('specifications', {}),
                design_notes=item_data.get('design_notes'),
                design_files=item_data.get('design_files', [])
            )

            db.session.add(order_item)

        # Calculate totals
        order.subtotal = subtotal
        order.tax_amount = data.get('tax_amount', 0)
        order.shipping_amount = data.get('shipping_amount', 0)
        order.discount_amount = data.get('discount_amount', 0)
        order.total_amount = subtotal + order.tax_amount + order.shipping_amount - order.discount_amount

        db.session.commit()

        return jsonify({
            'message': 'Order created successfully',
            'order': order.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create order', 'details': str(e)}), 500


@orders_bp.route('/<int:order_id>/status', methods=['PUT'])
@jwt_required()
def update_order_status(order_id):
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user or not user.is_admin():
            return jsonify({'error': 'Admin access required'}), 403

        order = Order.query.get(order_id)
        if not order:
            return jsonify({'error': 'Order not found'}), 404

        data = request.get_json()
        new_status = data.get('status')

        if not new_status:
            return jsonify({'error': 'Status is required'}), 400

        try:
            order.status = OrderStatus(new_status)
        except ValueError:
            return jsonify({'error': 'Invalid status'}), 400

        # Update timestamps based on status
        if new_status == 'confirmed':
            order.confirmed_at = datetime.utcnow()
        elif new_status == 'completed':
            order.completed_at = datetime.utcnow()
            order.actual_delivery_date = datetime.utcnow()

        order.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'message': 'Order status updated successfully',
            'order': order.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update order status', 'details': str(e)}), 500