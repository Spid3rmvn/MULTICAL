from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User
from app.models.order import Order, OrderStatus
from app.models.payment import Payment, PaymentStatus
from app.models.product import Product
from app.models.service import Service
from app.models.design_consultation import DesignConsultation, ConsultationStatus
from sqlalchemy import func, extract
from datetime import datetime, timedelta

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        if user.is_admin():
            return get_admin_stats()
        else:
            return get_customer_stats(user_id)

    except Exception as e:
        return jsonify({'error': 'Failed to fetch dashboard stats', 'details': str(e)}), 500


def get_admin_stats():
    """Get admin dashboard statistics"""
    try:
        # Date ranges
        today = datetime.now().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)

        # Total counts
        total_orders = Order.query.count()
        total_customers = User.query.filter_by(role='customer').count()
        total_products = Product.query.count()
        total_services = Service.query.count()

        # Recent orders
        recent_orders = Order.query.filter(Order.created_at >= week_ago).count()

        # Revenue stats
        total_revenue = db.session.query(func.sum(Payment.amount)).filter(
            Payment.status == PaymentStatus.COMPLETED
        ).scalar() or 0

        monthly_revenue = db.session.query(func.sum(Payment.amount)).filter(
            Payment.status == PaymentStatus.COMPLETED,
            Payment.created_at >= month_ago
        ).scalar() or 0

        # Order status breakdown
        order_statuses = db.session.query(
            Order.status, func.count(Order.id)
        ).group_by(Order.status).all()

        order_status_counts = {status.value: count for status, count in order_statuses}

        # Payment status breakdown
        payment_statuses = db.session.query(
            Payment.status, func.count(Payment.id)
        ).group_by(Payment.status).all()

        payment_status_counts = {status.value: count for status, count in payment_statuses}

        # Pending consultations
        pending_consultations = DesignConsultation.query.filter_by(
            status=ConsultationStatus.REQUESTED
        ).count()

        # Monthly revenue trend (last 6 months)
        monthly_trend = []
        for i in range(6):
            month_start = today.replace(day=1) - timedelta(days=i * 30)
            month_end = month_start + timedelta(days=30)

            month_revenue = db.session.query(func.sum(Payment.amount)).filter(
                Payment.status == PaymentStatus.COMPLETED,
                Payment.created_at >= month_start,
                Payment.created_at < month_end
            ).scalar() or 0

            monthly_trend.append({
                'month': month_start.strftime('%Y-%m'),
                'revenue': float(month_revenue)
            })

        monthly_trend.reverse()  # Oldest to newest

        return jsonify({
            'total_orders': total_orders,
            'total_customers': total_customers,
            'total_products': total_products,
            'total_services': total_services,
            'recent_orders': recent_orders,
            'total_revenue': float(total_revenue),
            'monthly_revenue': float(monthly_revenue),
            'pending_consultations': pending_consultations,
            'order_status_breakdown': order_status_counts,
            'payment_status_breakdown': payment_status_counts,
            'monthly_revenue_trend': monthly_trend
        }), 200

    except Exception as e:
        return jsonify({'error': 'Failed to fetch admin stats', 'details': str(e)}), 500


def get_customer_stats(customer_id):
    """Get customer dashboard statistics"""
    try:
        # Customer orders
        total_orders = Order.query.filter_by(customer_id=customer_id).count()

        # Order status breakdown
        order_statuses = db.session.query(
            Order.status, func.count(Order.id)
        ).filter_by(customer_id=customer_id).group_by(Order.status).all()

        order_status_counts = {status.value: count for status, count in order_statuses}

        # Total spent
        total_spent = db.session.query(func.sum(Payment.amount)).filter(
            Payment.customer_id == customer_id,
            Payment.status == PaymentStatus.COMPLETED
        ).scalar() or 0

        # Recent orders
        recent_orders = Order.query.filter_by(customer_id=customer_id) \
            .order_by(Order.created_at.desc()).limit(5).all()

        # Consultations
        total_consultations = DesignConsultation.query.filter_by(customer_id=customer_id).count()
        pending_consultations = DesignConsultation.query.filter_by(
            customer_id=customer_id,
            status=ConsultationStatus.REQUESTED
        ).count()

        return jsonify({
            'total_orders': total_orders,
            'total_spent': float(total_spent),
            'total_consultations': total_consultations,
            'pending_consultations': pending_consultations,
            'order_status_breakdown': order_status_counts,
            'recent_orders': [order.to_dict() for order in recent_orders]
        }), 200

    except Exception as e:
        return jsonify({'error': 'Failed to fetch customer stats', 'details': str(e)}), 500


@dashboard_bp.route('/recent-activity', methods=['GET'])
@jwt_required()
def get_recent_activity():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user or not user.is_admin():
            return jsonify({'error': 'Admin access required'}), 403

        # Get recent orders
        recent_orders = Order.query.order_by(Order.created_at.desc()).limit(10).all()

        # Get recent payments
        recent_payments = Payment.query.order_by(Payment.created_at.desc()).limit(10).all()

        # Get recent consultations
        recent_consultations = DesignConsultation.query.order_by(
            DesignConsultation.created_at.desc()
        ).limit(10).all()

        return jsonify({
            'recent_orders': [order.to_dict() for order in recent_orders],
            'recent_payments': [payment.to_dict() for payment in recent_payments],
            'recent_consultations': [consultation.to_dict() for consultation in recent_consultations]
        }), 200

    except Exception as e:
        return jsonify({'error': 'Failed to fetch recent activity', 'details': str(e)}), 500