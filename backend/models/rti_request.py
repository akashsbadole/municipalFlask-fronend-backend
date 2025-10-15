from datetime import datetime
import uuid
from extensions import db
from models.user import User

class RTIRequest(db.Model):
    __tablename__ = 'rti_requests'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    request_number = db.Column(db.String(50), unique=True, nullable=False)
    applicant_name = db.Column(db.String(100), nullable=False)
    applicant_address = db.Column(db.Text, nullable=False)
    applicant_email = db.Column(db.String(100))
    applicant_phone = db.Column(db.String(20))
    subject = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    department = db.Column(db.String(100), nullable=False)
    priority = db.Column(db.String(20), default='Normal')  # High, Medium, Normal
    status = db.Column(db.String(20), default='Pending')  # Pending, Under Review, Approved, Rejected, Closed
    assigned_to = db.Column(db.String(36), db.ForeignKey('users.id'))
    fee_paid = db.Column(db.Boolean, default=False)
    fee_amount = db.Column(db.Float, default=0.0)
    fee_paid_date = db.Column(db.Date)
    response_date = db.Column(db.Date)
    response_content = db.Column(db.Text)
    rejection_reason = db.Column(db.Text)
    attachment_url = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    assigned_officer = db.relationship('User', foreign_keys=[assigned_to], backref='assigned_rti_requests')
    
    def to_dict(self):
        return {
            'id': self.id,
            'request_number': self.request_number,
            'applicant_name': self.applicant_name,
            'applicant_address': self.applicant_address,
            'applicant_email': self.applicant_email,
            'applicant_phone': self.applicant_phone,
            'subject': self.subject,
            'description': self.description,
            'department': self.department,
            'priority': self.priority,
            'status': self.status,
            'assigned_to': self.assigned_to,
            'fee_paid': self.fee_paid,
            'fee_amount': self.fee_amount,
            'fee_paid_date': self.fee_paid_date.isoformat() if self.fee_paid_date else None,
            'response_date': self.response_date.isoformat() if self.response_date else None,
            'response_content': self.response_content,
            'rejection_reason': self.rejection_reason,
            'attachment_url': self.attachment_url,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'assigned_officer_name': self.assigned_officer.first_name + ' ' + self.assigned_officer.last_name if self.assigned_officer else None
        }
    
    def __repr__(self):
        return f'<RTIRequest {self.request_number}>'