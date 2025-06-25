from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models.design_consultation import DesignConsultation, ConsultationStatus
from app.models.user import User
from app.utils.validators import validate_json, admin_required, Validator, ValidationError
from app.services.whatsapp_service import WhatsAppService
from app.services.email_service import EmailService
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

consultations_bp = Blueprint('consultations', __name__)
whatsapp_service = WhatsAppService()
email_service = EmailService()


@consultations_bp.route('/', methods=['GET'])
@jwt_required()
def get_consultations():
    """Get consultations (admin gets all, user gets their own)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)

        # Build query
        query = DesignConsultation.query

        if not user.is_admin():
            # Regular users only see their own consultations
            query = query.filter_by(customer_id=current_user_id)
        else:
            # Admin can filter by customer
            customer_id = request.args.get('customer_id')
            if customer_id:
                query = query.filter_by(customer_id=customer_id)

        # Apply filters
        status = request.args.get('status')
        if status:
            try:
                status_enum = ConsultationStatus(status)
                query = query.filter_by(status=status_enum)
            except ValueError:
                return jsonify({
                    'success': False,
                    'message': 'Invalid status value'
                }), 400

        # Date range filter
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')

        if start_date:
            try:
                start_dt = datetime.strptime(start_date, '%Y-%m-%d')
                query = query.filter(DesignConsultation.created_at >= start_dt)
            except ValueError:
                return jsonify({
                    'success': False,
                    'message': 'Invalid start_date format. Use YYYY-MM-DD'
                }), 400

        if end_date:
            try:
                end_dt = datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1)
                query = query.filter(DesignConsultation.created_at < end_dt)
            except ValueError:
                return jsonify({
                    'success': False,
                    'message': 'Invalid end_date format. Use YYYY-MM-DD'
                }), 400

        # Pagination
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 20)), 100)

        consultations = query.order_by(DesignConsultation.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )

        return jsonify({
            'success': True,
            'consultations': [consultation.to_dict() for consultation in consultations.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': consultations.total,
                'pages': consultations.pages,
                'has_next': consultations.has_next,
                'has_prev': consultations.has_prev
            }
        }), 200

    except Exception as e:
        logger.error(f"Error fetching consultations: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch consultations'
        }), 500


@consultations_bp.route('/<int:consultation_id>', methods=['GET'])
@jwt_required()
def get_consultation(consultation_id):
    """Get single consultation"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)

        consultation = DesignConsultation.query.get_or_404(consultation_id)

        # Check permission
        if not user.is_admin() and consultation.customer_id != current_user_id:
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403

        return jsonify({
            'success': True,
            'consultation': consultation.to_dict()
        }), 200

    except Exception as e:
        logger.error(f"Error fetching consultation {consultation_id}: {e}")
        return jsonify({
            'success': False,
            'message': 'Consultation not found'
        }), 404


@consultations_bp.route('/', methods=['POST'])
@jwt_required()
@validate_json('project_title', 'project_description', 'project_type')
def create_consultation():
    """Book a design consultation"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()

        # Validate required fields
        project_title = Validator.validate_required_string(
            data.get('project_title'), 'Project title', max_length=200
        )
        project_description = Validator.validate_required_string(
            data.get('project_description'), 'Project description', max_length=2000
        )
        project_type = Validator.validate_required_string(
            data.get('project_type'), 'Project type', max_length=100
        )

        # Validate optional fields
        budget_range = data.get('budget_range', '').strip()
        if budget_range and len(budget_range) > 100:
            raise ValidationError('Budget range must not exceed 100 characters', 'budget_range')

        timeline = data.get('timeline', '').strip()
        if timeline and len(timeline) > 100:
            raise ValidationError('Timeline must not exceed 100 characters', 'timeline')

        special_requirements = data.get('special_requirements', '').strip()
        if special_requirements and len(special_requirements) > 1000:
            raise ValidationError('Special requirements must not exceed 1000 characters', 'special_requirements')

        preferred_contact_method = data.get('preferred_contact_method', 'phone')
        if preferred_contact_method not in ['phone', 'email', 'whatsapp']:
            raise ValidationError('Invalid contact method', 'preferred_contact_method')

        # Handle scheduled date
        scheduled_date = None
        if data.get('preferred_date'):
            try:
                scheduled_date = datetime.strptime(data['preferred_date'], '%Y-%m-%d %H:%M')

                # Check if date is in the future
                if scheduled_date <= datetime.utcnow():
                    raise ValidationError('Scheduled date must be in the future', 'preferred_date')

            except ValueError:
                raise ValidationError('Invalid date format. Use YYYY-MM-DD HH:MM', 'preferred_date')

        # Validate duration
        duration_minutes = 60  # Default
        if data.get('duration_minutes'):
            duration_minutes = Validator.validate_integer(
                data['duration_minutes'], 'Duration', min_value=30, max_value=240
            )

        # Check if user has pending consultations
        pending_count = DesignConsultation.query.filter_by(
            customer_id=current_user_id,
            status=ConsultationStatus.PENDING
        ).count()

        if pending_count >= 3:
            return jsonify({
                'success': False,
                'message': 'You have too many pending consultations. Please wait for current ones to be processed.'
            }), 400

        # Create consultation
        consultation = DesignConsultation(
            customer_id=current_user_id,
            project_title=project_title,
            project_description=project_description,
            project_type=project_type,
            budget_range=budget_range or None,
            timeline=timeline or None,
            special_requirements=special_requirements or None,
            preferred_contact_method=preferred_contact_method,
            scheduled_date=scheduled_date,
            duration_minutes=duration_minutes,
            status=ConsultationStatus.PENDING
        )

        db.session.add(consultation)
        db.session.commit()

        # Send notifications
        try:
            whatsapp_service.send_consultation_confirmation(consultation)
        except Exception as e:
            logger.error(f"Failed to send WhatsApp notification: {e}")

        logger.info(f"Design consultation created: {consultation.id} by user {current_user_id}")

        return jsonify({
            'success': True,
            'message': 'Consultation booked successfully',
            'consultation': consultation.to_dict()
        }), 201

    except ValidationError as e:
        return jsonify({
            'success': False,
            'message': e.message,
            'field': e.field
        }), 400
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating consultation: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to book consultation'
        }), 500


@consultations_bp.route('/<int:consultation_id>', methods=['PUT'])
@jwt_required()
def update_consultation(consultation_id):
    """Update consultation (customer can update before confirmed, admin can update anytime)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)

        consultation = DesignConsultation.query.get_or_404(consultation_id)

        # Check permission
        if not user.is_admin() and consultation.customer_id != current_user_id:
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403

        # Check if consultation can be updated
        if not user.is_admin() and consultation.status not in [ConsultationStatus.PENDING,
                                                               ConsultationStatus.SCHEDULED]:
            return jsonify({
                'success': False,
                'message': 'Cannot update consultation in current status'
            }), 400

        data = request.get_json()

        # Update allowed fields based on user role
        if user.is_admin():
            # Admin can update any field
            if 'status' in data:
                try:
                    new_status = ConsultationStatus(data['status'])
                    consultation.status = new_status

                    # Update timestamps based on status
                    if new_status == ConsultationStatus.CONFIRMED:
                        consultation.confirmed_at = datetime.utcnow()
                    elif new_status == ConsultationStatus.COMPLETED:
                        consultation.completed_at = datetime.utcnow()
                    elif new_status == ConsultationStatus.CANCELLED:
                        consultation.cancelled_at = datetime.utcnow()

                except ValueError:
                    raise ValidationError('Invalid status value', 'status')

            if 'scheduled_date' in data:
                if data['scheduled_date']:
                    try:
                        consultation.scheduled_date = datetime.strptime(
                            data['scheduled_date'], '%Y-%m-%d %H:%M'
                        )
                    except ValueError:
                        raise ValidationError('Invalid date format. Use YYYY-MM-DD HH:MM', 'scheduled_date')
                else:
                    consultation.scheduled_date = None

            if 'estimated_cost' in data:
                if data['estimated_cost']:
                    consultation.estimated_cost = Validator.validate_positive_number(
                        data['estimated_cost'], 'Estimated cost'
                    )
                else:
                    consultation.estimated_cost = None

            if 'admin_notes' in data:
                consultation.admin_notes = data.get('admin_notes', '').strip() or None

        # Fields both admin and customer can update
        if 'project_title' in data:
            consultation.project_title = Validator.validate_required_string(
                data['project_title'], 'Project title', max_length=200
            )

        if 'project_description' in data:
            consultation.project_description = Validator.validate_required_string(
                data['project_description'], 'Project description', max_length=2000
            )

        if 'project_type' in data:
            consultation.project_type = Validator.validate_required_string(
                data['project_type'], 'Project type', max_length=100
            )

        if 'budget_range' in data:
            budget_range = data.get('budget_range', '').strip()
            consultation.budget_range = budget_range or None

        if 'timeline' in data:
            timeline = data.get('timeline', '').strip()
            consultation.timeline = timeline or None

        if 'special_requirements' in data:
            special_requirements = data.get('special_requirements', '').strip()
            consultation.special_requirements = special_requirements or None

        if 'preferred_contact_method' in data:
            consultation.preferred_contact_method = Validator.validate_choice(
                data['preferred_contact_method'],
                ['phone', 'email', 'whatsapp'],
                'Preferred contact method'
            )

        consultation.updated_at = datetime.utcnow()
        db.session.commit()

        logger.info(f"Consultation updated: {consultation_id} by user {current_user_id}")

        return jsonify({
            'success': True,
            'message': 'Consultation updated successfully',
            'consultation': consultation.to_dict()
        }), 200

    except ValidationError as e:
        return jsonify({
            'success': False,
            'message': e.message,
            'field': e.field
        }), 400
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating consultation {consultation_id}: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to update consultation'
        }), 500


@consultations_bp.route('/<int:consultation_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_consultation(consultation_id):
    """Cancel consultation"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)

        consultation = DesignConsultation.query.get_or_404(consultation_id)

        # Check permission
        if not user.is_admin() and consultation.customer_id != current_user_id:
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403

        # Check if consultation can be cancelled
        if consultation.status in [ConsultationStatus.COMPLETED, ConsultationStatus.CANCELLED]:
            return jsonify({
                'success': False,
                'message': 'Cannot cancel consultation in current status'
            }), 400

        data = request.get_json() or {}
        cancellation_reason = data.get('reason', '').strip()

        consultation.status = ConsultationStatus.CANCELLED
        consultation.cancelled_at = datetime.utcnow()
        consultation.cancellation_reason = cancellation_reason or None
        consultation.updated_at = datetime.utcnow()

        db.session.commit()

        logger.info(f"Consultation cancelled: {consultation_id} by user {current_user_id}")

        return jsonify({
            'success': True,
            'message': 'Consultation cancelled successfully',
            'consultation': consultation.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error cancelling consultation {consultation_id}: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to cancel consultation'
        }), 500


@consultations_bp.route('/<int:consultation_id>/reschedule', methods=['POST'])
@jwt_required()
@validate_json('new_date')
def reschedule_consultation(consultation_id):
    """Reschedule consultation"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)

        consultation = DesignConsultation.query.get_or_404(consultation_id)

        # Check permission
        if not user.is_admin() and consultation.customer_id != current_user_id:
            return jsonify({
                'success': False,
                'message': 'Access denied'
            }), 403

        # Check if consultation can be rescheduled
        if consultation.status not in [ConsultationStatus.PENDING, ConsultationStatus.SCHEDULED,
                                       ConsultationStatus.CONFIRMED]:
            return jsonify({
                'success': False,
                'message': 'Cannot reschedule consultation in current status'
            }), 400

        data = request.get_json()

        try:
            new_date = datetime.strptime(data['new_date'], '%Y-%m-%d %H:%M')

            # Check if date is in the future
            if new_date <= datetime.utcnow():
                raise ValidationError('New date must be in the future', 'new_date')

        except ValueError:
            raise ValidationError('Invalid date format. Use YYYY-MM-DD HH:MM', 'new_date')

        consultation.scheduled_date = new_date
        consultation.status = ConsultationStatus.SCHEDULED
        consultation.updated_at = datetime.utcnow()

        db.session.commit()

        logger.info(f"Consultation rescheduled: {consultation_id} to {new_date}")

        return jsonify({
            'success': True,
            'message': 'Consultation rescheduled successfully',
            'consultation': consultation.to_dict()
        }), 200

    except ValidationError as e:
        return jsonify({
            'success': False,
            'message': e.message,
            'field': e.field
        }), 400
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error rescheduling consultation {consultation_id}: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to reschedule consultation'
        }), 500


@consultations_bp.route('/stats', methods=['GET'])
@jwt_required()
@admin_required
def get_consultation_stats():
    """Get consultation statistics (admin only)"""
    try:
        # Get date range
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')

        query = DesignConsultation.query

        if start_date:
            start_dt = datetime.strptime(start_date, '%Y-%m-%d')
            query = query.filter(DesignConsultation.created_at >= start_dt)

        if end_date:
            end_dt = datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1)
            query = query.filter(DesignConsultation.created_at < end_dt)

        # Calculate stats
        total_consultations = query.count()

        stats_by_status = {}
        for status in ConsultationStatus:
            count = query.filter_by(status=status).count()
            stats_by_status[status.value] = count

        # Project type distribution
        project_types = db.session.query(
            DesignConsultation.project_type,
            db.func.count(DesignConsultation.id).label('count')
        ).group_by(DesignConsultation.project_type).all()

        project_type_stats = {pt.project_type: pt.count for pt in project_types}

        # Recent consultations
        recent_consultations = query.order_by(
            DesignConsultation.created_at.desc()
        ).limit(5).all()

        return jsonify({
            'success': True,
            'stats': {
                'total_consultations': total_consultations,
                'status_breakdown': stats_by_status,
                'project_type_breakdown': project_type_stats,
                'recent_consultations': [c.to_dict() for c in recent_consultations]
            }
        }), 200

    except Exception as e:
        logger.error(f"Error fetching consultation stats: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to fetch statistics'
        }), 500