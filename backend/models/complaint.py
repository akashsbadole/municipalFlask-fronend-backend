from datetime import datetime, date
from extensions import db
from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID
import uuid

class Complaint(db.Model):
    __tablename__ = 'complaints'
    
    id = db.Column(String(36), primary_key=True, default=uuid.uuid4)
    complaint_number = db.Column(db.String(20), unique=True, nullable=False)
    
    # Complaint details
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    
    # Location details
    address_line1 = db.Column(db.String(100), nullable=False)
    address_line2 = db.Column(db.String(100))
    landmark = db.Column(db.String(100))
    area = db.Column(db.String(50), nullable=False)
    ward_number = db.Column(db.String(10), nullable=False)
    zone = db.Column(db.String(50), nullable=False)
    
    # GIS data
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    
    # Media attachments
    image_path = db.Column(db.String(255))
    video_path = db.Column(db.String(255))
    
    # Status and priority
    status = db.Column(db.String(20), default='Submitted')  # Submitted, In Progress, Resolved, Rejected, Closed
    priority = db.Column(db.String(20), default='Medium')  # Low, Medium, High, Critical
    
    # Resolution details
    resolution_notes = db.Column(db.Text)
    resolution_date = db.Column(db.DateTime)
    resolved_by = db.Column(String(36), db.ForeignKey('users.id'))
    
    # Escalation details
    is_escalated = db.Column(db.Boolean, default=False)
    escalation_level = db.Column(db.Integer, default=0)  # 0: Not escalated, 1: Level 1, 2: Level 2, etc.
    escalation_date = db.Column(db.DateTime)
    escalated_to = db.Column(String(36), db.ForeignKey('users.id'))
    
    # Feedback
    citizen_feedback = db.Column(db.Text)
    satisfaction_rating = db.Column(db.Integer)  # 1-5 scale
    feedback_date = db.Column(db.DateTime)
    
    # Status and timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign keys
    complainant_id = db.Column(String(36), db.ForeignKey('citizens.id'), nullable=False)
    category_id = db.Column(String(36), db.ForeignKey('complaint_categories.id'), nullable=False)
    assigned_to = db.Column(String(36), db.ForeignKey('users.id'))
    
    # Relationships
    category = db.relationship('ComplaintCategory', backref='complaints')
    assignee = db.relationship('User', foreign_keys=[assigned_to], backref='assigned_complaints')
    resolver = db.relationship('User', foreign_keys=[resolved_by], backref='resolved_complaints')
    escalation_user = db.relationship('User', foreign_keys=[escalated_to], backref='escalated_complaints')
    
    def __init__(self, complaint_number, title, description, address_line1, area, ward_number, zone,
                 complainant_id, category_id, address_line2=None, landmark=None, latitude=None, 
                 longitude=None, image_path=None, video_path=None, priority='Medium'):
        self.complaint_number = complaint_number
        self.title = title
        self.description = description
        self.address_line1 = address_line1
        self.area = area
        self.ward_number = ward_number
        self.zone = zone
        self.complainant_id = complainant_id
        self.category_id = category_id
        self.address_line2 = address_line2
        self.landmark = landmark
        self.latitude = latitude
        self.longitude = longitude
        self.image_path = image_path
        self.video_path = video_path
        self.priority = priority
    
    def full_address(self):
        address_parts = [
            self.address_line1,
            self.address_line2,
            self.landmark,
            self.area,
            f"Ward {self.ward_number}",
            self.zone
        ]
        return ", ".join(filter(None, address_parts))
    
    def update_status(self, status, notes=None, user_id=None):
        """Update complaint status"""
        self.status = status
        if notes:
            self.resolution_notes = notes
        if user_id and status == 'Resolved':
            self.resolved_by = user_id
            self.resolution_date = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def assign_to(self, user_id):
        """Assign complaint to a user"""
        self.assigned_to = user_id
        if self.status == 'Submitted':
            self.status = 'In Progress'
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def escalate(self, to_user_id, level=1):
        """Escalate complaint to higher authority"""
        self.is_escalated = True
        self.escalation_level = level
        self.escalated_to = to_user_id
        self.escalation_date = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def add_feedback(self, feedback, rating):
        """Add citizen feedback and rating"""
        self.citizen_feedback = feedback
        self.satisfaction_rating = rating
        self.feedback_date = datetime.utcnow()
        if self.status == 'Resolved':
            self.status = 'Closed'
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def days_open(self):
        """Calculate how many days the complaint has been open"""
        return (datetime.utcnow() - self.created_at).days
    
    def is_overdue(self):
        """Check if complaint resolution is overdue based on category resolution time"""
        if self.status in ['Resolved', 'Rejected', 'Closed']:
            return False
        
        if self.category:
            expected_hours = self.category.resolution_time_hours
            expected_days = expected_hours / 24
            return self.days_open() > expected_days
        return False
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'complaint_number': self.complaint_number,
            'title': self.title,
            'description': self.description,
            'location': {
                'address_line1': self.address_line1,
                'address_line2': self.address_line2,
                'landmark': self.landmark,
                'area': self.area,
                'ward_number': self.ward_number,
                'zone': self.zone,
                'full_address': self.full_address(),
                'latitude': self.latitude,
                'longitude': self.longitude
            },
            'media': {
                'image_path': self.image_path,
                'video_path': self.video_path
            },
            'status': {
                'current_status': self.status,
                'priority': self.priority,
                'is_overdue': self.is_overdue(),
                'days_open': self.days_open()
            },
            'resolution': {
                'resolution_notes': self.resolution_notes,
                'resolution_date': self.resolution_date.isoformat() if self.resolution_date else None,
                'resolved_by': self.resolved_by
            },
            'escalation': {
                'is_escalated': self.is_escalated,
                'escalation_level': self.escalation_level,
                'escalation_date': self.escalation_date.isoformat() if self.escalation_date else None,
                'escalated_to': self.escalated_to
            },
            'feedback': {
                'citizen_feedback': self.citizen_feedback,
                'satisfaction_rating': self.satisfaction_rating,
                'feedback_date': self.feedback_date.isoformat() if self.feedback_date else None
            },
            'category': {
                'id': str(self.category_id),
                'name': self.category.name if self.category else None,
                'department': self.category.department if self.category else None
            },
            'people': {
                'complainant': {
                    'id': str(self.complainant_id),
                    'name': self.complainant.full_name() if self.complainant else None
                },
                'assigned_to': {
                    'id': str(self.assigned_to) if self.assigned_to else None,
                    'name': self.assignee.full_name() if self.assignee else None
                }
            },
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def __repr__(self):
        return f'<Complaint {self.complaint_number}>'