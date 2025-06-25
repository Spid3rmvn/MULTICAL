from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.payment import Payment, PaymentStatus, PaymentMethod
from app.models.order import Order
from app.models.user import User
from app.services.payment_service import PaymentService

payments_bp = Blueprint('payments', __name__)


@payments_bp.route('/', methods=['GET'])
@jwt_required()
def get_payments():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)

        # Build query - customers see only their payments, admins see all
        if user.is_admin():
            query = Payment.query
        else:
            query = Payment.query.filter_by(customer_id=user_id)

        # Order by created_at desc
        query = query.order_by(Payment.created_at.desc())

        # Paginate
        pagination = query.paginate(
            page=page, per_page=per_page, error_out=False
        )

        payments = [payment.to_dict() for payment in pagination.items]

        return jsonify({
            'payments': payments,
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
        return jsonify({'error': 'Failed to fetch payments', 'details': str(e)}), 500


@payments_bp.route('/mpesa/stk-push', methods=['POST'])
@jwt_required()
def initiate_mpesa_payment():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.get_json()

        # Validate required fields
        required_fields = ['phone_number', 'amount']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400

        order_id = data.get('order_id')
        if order_id:
            order = Order.query.get(order_id)
            if not order:
                return jsonify({'error': 'Order not found'}), 404
            if order.customer_id != user_id:
                return jsonify({'error': 'Access denied'}), 403

        # Initialize payment service
        payment_service = PaymentService()

        # Initiate STK push
        result = payment_service.initiate_stk_push(
            phone_number=data['phone_number'],
            amount=data['amount'],
            order_id=order_id,
            customer_id=user_id,
            description=data.get('description', 'Multical Payment')
        )

        if result['success']:
            return jsonify({
                'message': 'Payment initiated successfully',
                'payment_id': result['payment_id'],
                'checkout_request_id': result['checkout_request_id']
            }), 200
        else:
            return jsonify({'error': result['message']}), 400

    except Exception as e:
        return jsonify({'error': 'Failed to initiate payment', 'details': str(e)}), 500


@payments_bp.route('/paybill', methods=['POST'])
def process_paybill_payment():
    try:
        data = request.get_json()

        # Validate required fields for paybill
        required_fields = ['phone_number', 'amount', 'account_number']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400

        # Initialize payment service
        payment_service = PaymentService()

        # Process paybill payment
        result = payment_service.process_paybill_payment(
            phone_number=data['phone_number'],
            amount=data['amount'],
            account_number=data['account_number'],
            transaction_id=data.get('transaction_id')
        )

        if result['success']:
            return jsonify({
                'message': 'Payment processed successfully',
                'payment_id': result['payment_id']
            }), 200
        else:
            return jsonify({'error': result['message']}), 400

    except Exception as e:
        return jsonify({'error': 'Failed to process payment', 'details': str(e)}), 500


@payments_bp.route('/<int:payment_id>/status', methods=['GET'])
@jwt_required()
def check_payment_status(payment_id):
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        payment = Payment.query.get(payment_id)
        if not payment:
            return jsonify({'error': 'Payment not found'}), 404

        # Check permissions
        if not user.is_admin() and payment.customer_id != user_id:
            return jsonify({'error': 'Access denied'}), 403

        return jsonify({'payment': payment.to_dict()}), 200

    except Exception as e:
        return jsonify({'error': 'Failed to check payment status', 'details': str(e)}), 500