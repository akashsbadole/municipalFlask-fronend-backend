from datetime import datetime, date
from extensions import db
from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID
import uuid

class Leave(db.Model):
    __tablename__ = 'leaves'
    
    id = db.Column(String(36), primary_key=True, default=uuid.uuid4)
    leave_id = db.Column(db.String(20), unique=True, nullable=False)
    
    # Leave details
    leave_type = db.Column(db.String(20), nullable=False)  # Casual, Sick, Earned, Maternity, Paternity
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    number_of_days = db.Column(db.Float, nullable=False)
    
    # Leave reason
    reason = db.Column(db.Text, nullable=False)
    
    # Status and workflow
    status = db.Column(db.String(20), default='Pending')  # Pending, Approved, Rejected, Cancelled
    applied_date = db.Column(db.Date, default=date.today)
    
    # Approval details
    approved_by = db.Column(String(36), db.ForeignKey('employees.id'))
    approval_date = db.Column(db.DateTime)
    rejection_reason = db.Column(db.Text)
    
    # Documents
    document_path = db.Column(db.String(255))  # Path to medical certificate or other documents
    
    # Contact details during leave
    contact_address = db.Column(db.String(255))
    contact_phone = db.Column(db.String(20))
    
    # Status and timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign keys
    employee_id = db.Column(String(36), db.ForeignKey('employees.id'), nullable=False)
    
    # Relationships
    approver = db.relationship('Employee', foreign_keys=[approved_by], backref='approved_leaves')
    
    def __init__(self, leave_id, leave_type, start_date, end_date, reason, employee_id,
                 number_of_days=None, contact_address=None, contact_phone=None,
                 document_path=None):
        self.leave_id = leave_id
        self.leave_type = leave_type
        self.start_date = start_date
        self.end_date = end_date
        self.reason = reason
        self.employee_id = employee_id
        self.contact_address = contact_address
        self.contact_phone = contact_phone
        self.document_path = document_path
        
        # Calculate number of days if not provided
        if number_of_days is None:
            self.number_of_days = (end_date - start_date).days + 1
        else:
            self.number_of_days = number_of_days
    
    def approve_leave(self, approver_id):
        """Approve the leave application"""
        self.status = 'Approved'
        self.approved_by = approver_id
        self.approval_date = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def reject_leave(self, approver_id, reason):
        """Reject the leave application"""
        self.status = 'Rejected'
        self.approved_by = approver_id
        self.approval_date = datetime.utcnow()
        self.rejection_reason = reason
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def cancel_leave(self):
        """Cancel the leave application"""
        self.status = 'Cancelled'
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def is_leave_in_future(self):
        """Check if leave is in the future"""
        return self.start_date > date.today()
    
    def is_leave_ongoing(self):
        """Check if leave is currently ongoing"""
        today = date.today()
        return self.start_date <= today <= self.end_date
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'leave_id': self.leave_id,
            'leave_details': {
                'leave_type': self.leave_type,
                'start_date': self.start_date.isoformat() if self.start_date else None,
                'end_date': self.end_date.isoformat() if self.end_date else None,
                'number_of_days': self.number_of_days,
                'reason': self.reason
            },
            'status': {
                'current_status': self.status,
                'applied_date': self.applied_date.isoformat() if self.applied_date else None,
                'approved_by': self.approved_by,
                'approval_date': self.approval_date.isoformat() if self.approval_date else None,
                'rejection_reason': self.rejection_reason
            },
            'contact': {
                'contact_address': self.contact_address,
                'contact_phone': self.contact_phone
            },
            'document_path': self.document_path,
            'employee': {
                'id': str(self.employee_id),
                'employee_id': self.employee.employee_id if self.employee else None,
                'name': self.employee.full_name() if self.employee else None
            },
            'leave_timing': {
                'is_in_future': self.is_leave_in_future(),
                'is_ongoing': self.is_leave_ongoing()
            },
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def __repr__(self):
        return f'<Leave {self.leave_id}>'