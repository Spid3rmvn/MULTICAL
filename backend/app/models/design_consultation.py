from app import db
from datetime import datetime
from enum import Enum


class ConsultationStatus(Enum):
    REQUESTED = "requested"
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class DesignConsultation(db.Model):
    __tablename__ = 'design_consultations'

    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    service_id = db.Column(db.Integer, db.ForeignKey('services.id'), nullable=True)
    status = db.Column(db.Enum(ConsultationStatus), default=ConsultationStatus.REQUESTED)

    # Consultation details
    project_title = db.Column(db.String(200), nullable=False)
    project_description = db.Column(db.Text, nullable=False)
    budget_range = db.Column(db.String(50))
    timeline = db.Column(db.String(100))

    # Scheduling
    preferred_date = db.Column(db.DateTime)
    scheduled_date = db.Column(db.DateTime)
    duration_minutes = db.Column(db.Integer, default=60)

    # Files and assets
    reference_files = db.Column(db.JSON)  # Array of uploaded reference files
    design_brief = db.Column(db.Text)

    # Contact preferences
    contact_method = db.Column(db.String(50))  # 'phone', 'whatsapp', 'email'
    contact_value = db.Column(db.String(100))

    # Admin notes
    admin_notes = db.Column(db.Text)
    estimated_cost = db.Column(db.Decimal(10, 2))

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = db.Column(db.DateTime)

    def to_dict(self):
        return {
            'id': self.id,
            'customer_id': self.customer_id,
            'service_id': self.service_id,
            'status': self.status.value,
            'project_title': self.project_title,
            'project_description': self.project_description,
            'budget_range': self.budget_range,
            'timeline': self.timeline,
            'preferred_date': self.preferred_date.isoformat() if self.preferred_date else None,
            'scheduled_date': self.scheduled_date.isoformat() if self.scheduled_date else None,
            'duration_minutes': self.duration_minutes,
            'reference_files': self.reference_files or [],
            'design_brief': self.design_brief,
            'contact_method': self.contact_method,
            'contact_value': self.contact_value,
            'admin_notes': self.admin_notes,
            'estimated_cost': float(self.estimated_cost) if self.estimated_cost else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }

    def __repr__(self):
        return f'<DesignConsultation {self.project_title}>'