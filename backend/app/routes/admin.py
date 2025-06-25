from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models.user import User, UserRole
from app.models.order import Order, OrderStatus
from app.models.payment import Payment, PaymentStatus
from app.models.product import Product
from app.models.service import Service
from app.models.category import Category
from app.models.design_consultation import DesignConsultation, ConsultationStatus
from app.utils.validators import admin_required, super_admin_required, validate_json, Validator, ValidationError
from app.services.email_service import EmailService
from sqlalchemy import func, desc, and_
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

admin_bp = Blueprint('admin', __name__)
email_service = EmailService()


@admin_bp.route('/dashboard', methods=['GET'])
@jwt_required()
@admin_required
def get_dashboard_stats():
    """Get admin dashboard statistics"""
    try:
        # Date range for statistics
        today = datetime.utcnow().date()
        this_month_start = today.replace(day=1)
        last_month_start = (this_month_start - timedelta(days=1)).replace(day=1)
        this_year_start = today.replace(month=1, day=1)

        # Basic counts
        total_users = User.query.count()
        total_orders = Order.query.count()
        total_products = Product.query.count()
        total_services = Service.query.count()

        # Order statistics
        pending_orders = Order.query.filter_by(status=OrderStatus.PENDING).count()
        confirmed_orders = Order.query.filter_by(status=OrderStatus.CONFIRMED).count()
        completed_orders = Order.query.filter_by(status=OrderStatus.COMPLETED).count()

        # Revenue statistics
        total_revenue = db.session.query(func.sum(Payment.amount)).filter(
            Payment.status == PaymentStatus.COMPLETED
        ).scalar() or 0

        this_month_revenue = db.session.query(func.sum(Payment.amount)).filter(
            and_(
                Payment.status == PaymentStatus.COMPLETED,
                Payment.completed_at >= this_month_start
            )
        ).scalar() or 0

        last_month_revenue = db.session.query(func.sum(Payment.amount)).filter(
            and_(
                Payment.status == PaymentStatus.COMPLETED,
                Payment.completed_at >= last_month_start,
                Payment.completed_at < this_month_start
            )
        ).scalar() or 0

        # Calculate month-over-month growth
        revenue_growth = 0
        if last_month_revenue > 0:
            revenue_growth = ((this_month_revenue - last_month_revenue) / last_month_revenue) * 100

        # Recent orders
        recent_orders = Order.query.order_by(desc(Order.created_at)).limit(5).all()

        # Top products by orders
        top_products = db.session.query(
            Product.name,
            func.count(Order.id).label('order_count')
        ).join(Order, Order.product_id == Product.id).group_by(Product.id).order_by(
            desc('order_count')
        ).limit(5).all()

        # Monthly order trends (last 6 months)
        monthly_orders = []
        for i in range(6):
            month_start = (today.replace(day=1) - timedelta(days=30 * i)).replace(day=1)
            month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)

            orders_count = Order.query.filter(
                and_(
                    Order.created_at >= month_start,
                    Order.created_at <= month_end
                )
            ).count()

            revenue = db.session.query(func.sum(Payment.amount)).filter(
                and_(
                    Payment.status == PaymentStatus.COMPLETED,
                    Payment.completed_at >= month_start,
                    Payment.completed_at <= month_end
                )
            ).scalar() or 0

            monthly_orders.append({
                'month': month_start.strftime('%Y-%m'),
                'orders': orders_count,
                'revenue': float(revenue)
            })

        monthly_orders.reverse()  # Show oldest to newest

        # Consultation statistics
        total_consultations = DesignConsultation.query.count()
        pending_consultations = DesignConsultation.query.filter_by(
            status=ConsultationStatus.PENDING
        ).count()

        return jsonify({
            'success': True,
            'stats': {
                'overview': {
                    'total_users': total_users,
                    'total_orders': total_orders,
                    'total_products': total_products,
                    'total_services': total_services,
                    'total_consultations': total_consultations
                },
                'orders': {
                    'pending': pending_orders,
                    'confirmed': confirmed_orders,
                    'completed': completed_orders,
                    'recent': [order.to_dict() for order in recent_orders]
                },
                'revenue': {
                    'total': float(total_revenue),
                    'this_month': float(this_month_revenue),
                    'last_month': float(last_month_revenue),
                    'growth_percentage': round(revenue_growth, 2)
                },
                'trends': {
                    'monthly_orders': monthly_orders,
                    'top_products': [
                        {'name': p.name, 'orders': p.order_count} for p in top_products
                    ]
                },
                'consultations': {
                    'total': total_consultations,
                    'pending': pending_consultations
                }
            }
        }), 200

    except Exception as e:
        logger.error(f"Error fetching dashboard stats: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch dashboard statistics'
        }), 500


@admin_bp.route('/users', methods=['GET'])
@jwt_required()
@admin_required
def get_users():
    """Get all users with filtering and pagination"""
    try:
        # Query parameters
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 20)), 100)
        search = request.args.get('search', '').strip()
        role = request.args.get('role')
        is_active = request.args.get('is_active')

        # Build query
        query = User.query

        # Apply filters
        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                db.or_(
                    User.first_name.ilike(search_filter),
                    User.last_name.ilike(search_filter),
                    User.email.ilike(search_filter),
                    User.phone.ilike(search_filter)
                )
            )

        if role:
            try:
                role_enum = UserRole(role)
                query = query.filter_by(role=role_enum)
            except ValueError:
                return jsonify({
                    'success': False,
                    'message': 'Invalid role value'
                }), 400

        if is_active is not None:
            active = is_active.lower() == 'true'
            query = query.filter_by(is_active=active)

        # Paginate
        users = query.order_by(desc(User.created_at)).paginate(
            page=page, per_page=per_page, error_out=False
        )

        return jsonify({
            'success': True,
            'users': [user.to_dict() for user in users.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': users.total,
                'pages': users.pages,
                'has_next': users.has_next,
                'has_prev': users.has_prev
            }
        }), 200

    except Exception as e:
        logger.error(f"Error fetching users: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch users'
        }), 500


@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@jwt_required()
@admin_required
def get_user_details(user_id):
    """Get detailed user information"""
    try:
        user = User.query.get_or_404(user_id)

        # Get user's orders
        orders = Order.query.filter_by(customer_id=user_id).order_by(
            desc(Order.created_at)
        ).limit(10).all()

        # Get user's consultations
        consultations = DesignConsultation.query.filter_by(customer_id=user_id).order_by(
            desc(DesignConsultation.created_at)
        ).limit(5).all()

        # Calculate user statistics
        total_orders = Order.query.filter_by(customer_id=user_id).count()
        total_spent = db.session.query(func.sum(Payment.amount)).join(Order).filter(
            and_(
                Order.customer_id == user_id,
                Payment.status == PaymentStatus.COMPLETED
            )
        ).scalar() or 0

        user_data = user.to_dict()
        user_data.update({
            'statistics': {
                'total_orders': total_orders,
                'total_spent': float(total_spent),
                'total_consultations': len(consultations)
            },
            'recent_orders': [order.to_dict() for order in orders],
            'recent_consultations': [consultation.to_dict() for consultation in consultations]
        })

        return jsonify({
            'success': True,
            'user': user_data
        }), 200

    except Exception as e:
        logger.error(f"Error fetching user details {user_id}: {e}")
        return jsonify({
            'success': False,
            'message': 'User not found'
        }), 404


@admin_bp.route('/users/<int:user_id>/toggle-status', methods=['PATCH'])
@jwt_required()
@admin_required
def toggle_user_status(user_id):
    """Toggle user active status"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get_or_404(user_id)

        # Prevent self-deactivation
        if user_id == current_user_id:
            return jsonify({
                'success': False,
                'message': 'Cannot deactivate your own account'
            }), 400

        user.is_active = not user.is_active
        db.session.commit()

        status = 'activated' if user.is_active else 'deactivated'
        logger.info(f"User {status}: {user.email} (ID: {user_id})")

        return jsonify({
            'success': True,
            'message': f'User {status} successfully',
            'user': user.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error toggling user status {user_id}: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to update user status'
        }), 500


@admin_bp.route('/users/<int:user_id>/role', methods=['PATCH'])
@jwt_required()
@super_admin_required
@validate_json('role')
def update_user_role(user_id):
    """Update user role (super admin only)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get_or_404(user_id)
        data = request.get_json()

        # Prevent changing own role
        if user_id == current_user_id:
            return jsonify({
                'success': False,
                'message': 'Cannot change your own role'
            }), 400

        try:
            new_role = UserRole(data['role'])
        except ValueError:
            return jsonify({
                'success': False,
                'message': 'Invalid role value'
            }), 400

        old_role = user.role
        user.role = new_role
        db.session.commit()

        logger.info(f"User role updated: {user.email} from {old_role.value} to {new_role.value}")

        return jsonify({
            'success': True,
            'message': 'User role updated successfully',
            'user': user.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating user role {user_id}: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to update user role'
        }), 500


@admin_bp.route('/orders/bulk-update', methods=['POST'])
@jwt_required()
@admin_required
@validate_json('order_ids', 'action')
def bulk_update_orders(self):
    """Bulk update order status"""
    try:
        data = request.get_json()
        order_ids = data.get('order_ids', [])
        action = data.get('action')

        if not isinstance(order_ids, list) or not order_ids:
            return jsonify({
                'success': False,
                'message': 'Order IDs must be a non-empty array'
            }), 400

        # Validate action
        valid_actions = ['confirm', 'cancel', 'complete', 'mark_processing']
        if action not in valid_actions:
            return jsonify({
                'success': False,
                'message': f'Invalid action. Must be one of: {", ".join(valid_actions)}'
            }), 400

        # Get orders
        orders = Order.query.filter(Order.id.in_(order_ids)).all()

        if len(orders) != len(order_ids):
            return jsonify({
                'success': False,
                'message': 'Some orders not found'
            }), 404

        updated_count = 0

        for order in orders:
            if action == 'confirm' and order.status == OrderStatus.PENDING:
                order.status = OrderStatus.CONFIRMED
                order.confirmed_at = datetime.utcnow()
                updated_count += 1

            elif action == 'cancel' and order.status in [OrderStatus.PENDING, OrderStatus.CONFIRMED]:
                order.status = OrderStatus.CANCELLED
                order.cancelled_at = datetime.utcnow()
                updated_count += 1

            elif action == 'complete' and order.status in [OrderStatus.CONFIRMED, OrderStatus.PROCESSING]:
                order.status = OrderStatus.COMPLETED
                order.completed_at = datetime.utcnow()
                updated_count += 1

            elif action == 'mark_processing' and order.status == OrderStatus.CONFIRMED:
                order.status = OrderStatus.PROCESSING
                updated_count += 1

        db.session.commit()

        logger.info(f"Bulk order update: {updated_count} orders updated with action '{action}'")

        return jsonify({
            'success': True,
            'message': f'{updated_count} orders updated successfully',
            'updated_count': updated_count
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error in bulk order update: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to update orders'
        }), 500


@admin_bp.route('/reports/sales', methods=['GET'])
@jwt_required()
@admin_required
def get_sales_report():
    """Get sales report with date filtering"""
    try:
        # Get date range
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        group_by = request.args.get('group_by', 'day')  # day, week, month

        if not start_date or not end_date:
            return jsonify({
                'success': False,
                'message': 'start_date and end_date are required'
            }), 400

        try:
            start_dt = datetime.strptime(start_date, '%Y-%m-%d')
            end_dt = datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1)
        except ValueError:
            return jsonify({
                'success': False,
                'message': 'Invalid date format. Use YYYY-MM-DD'
            }), 400

        # Base query for payments in date range
        payment_query = db.session.query(Payment).filter(
            and_(
                Payment.status == PaymentStatus.COMPLETED,
                Payment.completed_at >= start_dt,
                Payment.completed_at < end_dt
            )
        )

        # Calculate totals
        total_revenue = payment_query.with_entities(func.sum(Payment.amount)).scalar() or 0
        total_transactions = payment_query.count()

        # Group by time period
        if group_by == 'day':
            date_format = '%Y-%m-%d'
            date_trunc = func.date(Payment.completed_at)
        elif group_by == 'week':
            date_format = '%Y-W%U'
            date_trunc = func.date_trunc('week', Payment.completed_at)
        else:  # month
            date_format = '%Y-%m'
            date_trunc = func.date_trunc('month', Payment.completed_at)

        time_series = db.session.query(
            date_trunc.label('period'),
            func.sum(Payment.amount).label('revenue'),
            func.count(Payment.id).label('transactions')
        ).filter(
            and_(
                Payment.status == PaymentStatus.COMPLETED,
                Payment.completed_at >= start_dt,
                Payment.completed_at < end_dt
            )
        ).group_by(date_trunc).order_by(date_trunc).all()

        # Payment method breakdown
        payment_methods = db.session.query(
            Payment.payment_method,
            func.sum(Payment.amount).label('revenue'),
            func.count(Payment.id).label('transactions')
        ).filter(
            and_(
                Payment.status == PaymentStatus.COMPLETED,
                Payment.completed_at >= start_dt,
                Payment.completed_at < end_dt
            )
        ).group_by(Payment.payment_method).all()

        # Top products by revenue
        top_products = db.session.query(
            Product.name,
            func.sum(Payment.amount).label('revenue'),
            func.count(Payment.id).label('orders')
        ).join(Order).join(Payment).filter(
            and_(
                Payment.status == PaymentStatus.COMPLETED,
                Payment.completed_at >= start_dt,
                Payment.completed_at < end_dt
            )
        ).group_by(Product.id).order_by(desc('revenue')).limit(10).all()

        return jsonify({
            'success': True,
            'report': {
                'period': {
                    'start_date': start_date,
                    'end_date': end_date,
                    'group_by': group_by
                },
                'summary': {
                    'total_revenue': float(total_revenue),
                    'total_transactions': total_transactions,
                    'average_transaction': float(total_revenue / total_transactions) if total_transactions > 0 else 0
                },
                'time_series': [
                    {
                        'period': item.period.strftime(date_format) if hasattr(item.period, 'strftime') else str(
                            item.period),
                        'revenue': float(item.revenue),
                        'transactions': item.transactions
                    } for item in time_series
                ],
                'payment_methods': [
                    {
                        'method': item.payment_method.value if item.payment_method else 'Unknown',
                        'revenue': float(item.revenue),
                        'transactions': item.transactions
                    } for item in payment_methods
                ],
                'top_products': [
                    {
                        'name': item.name,
                        'revenue': float(item.revenue),
                        'orders': item.orders
                    } for item in top_products
                ]
            }
        }), 200

    except Exception as e:
        logger.error(f"Error generating sales report: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to generate sales report'
        }), 500


@admin_bp.route('/system/health', methods=['GET'])
@jwt_required()
@admin_required
def system_health():
    """Get system health status"""
    try:
        # Database connectivity
        db_status = 'healthy'
        try:
            db.session.execute('SELECT 1')
        except Exception:
            db_status = 'unhealthy'

        # Recent error counts (you might want to implement error logging)
        recent_errors = 0  # Placeholder

        # System metrics
        total_users = User.query.count()
        active_users = User.query.filter_by(is_active=True).count()
        pending_orders = Order.query.filter_by(status=OrderStatus.PENDING).count()
        failed_payments = Payment.query.filter_by(status=PaymentStatus.FAILED).count()

        health_status = {
            'overall': 'healthy' if db_status == 'healthy' and recent_errors < 10 else 'warning',
            'database': db_status,
            'metrics': {
                'total_users': total_users,
                'active_users': active_users,
                'pending_orders': pending_orders,
                'failed_payments': failed_payments,
                'recent_errors': recent_errors
            },
            'timestamp': datetime.utcnow().isoformat()
        }

        return jsonify({
            'success': True,
            'health': health_status
        }), 200

    except Exception as e:
        logger.error(f"Error checking system health: {e}")
        return jsonify({
            'success': False,
            'health': {
                'overall': 'unhealthy',
                'error': str(e),
                'timestamp': datetime.utcnow().isoformat()
            }
        }), 500