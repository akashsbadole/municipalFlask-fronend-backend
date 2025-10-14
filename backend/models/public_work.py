from datetime import datetime, date
from app import db
from sqlalchemy.dialects.postgresql import UUID
import uuid

class PublicWork(db.Model):
    __tablename__ = 'public_works'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    work_id = db.Column(db.String(20), unique=True, nullable=False)
    
    # Work details
    work_name = db.Column(db.String(200), nullable=False)
    work_type = db.Column(db.String(50), nullable=False)  # Road, Bridge, Park, Building, etc.
    work_category = db.Column(db.String(50), nullable=False)  # New Construction, Repair, Maintenance
    description = db.Column(db.Text, nullable=False)
    
    # Location details
    address_line1 = db.Column(db.String(100), nullable=False)
    address_line2 = db.Column(db.String(100))
    landmark = db.Column(db.String(100))
    area = db.Column(db.String(50), nullable=False)
    ward_number = db.Column(db.String(10), nullable=False)
    
    # Financial details
    estimated_cost = db.Column(db.Float, nullable=False)
    sanctioned_amount = db.Column(db.Float)
    expenditure = db.Column(db.Float, default=0.0)
    
    # Timeline
    start_date = db.Column(db.Date)
    planned_end_date = db.Column(db.Date)
    actual_end_date = db.Column(db.Date)
    
    # Status
    status = db.Column(db.String(20), default='Planned')  # Planned, In Progress, Completed, Delayed, Halted
    completion_percentage = db.Column(db.Float, default=0.0)
    
    # Contractor details
    contractor_name = db.Column(db.String(100))
    contractor_id = db.Column(UUID(as_uuid=True), db.ForeignKey('vendors.id'))
    
    # Technical details
    engineer_in_charge = db.Column(db.String(100))
    supervisor_name = db.Column(db.String(100))
    
    # Images and documents
    before_image_path = db.Column(db.String(255))
    after_image_path = db.Column(db.String(255))
    document_path = db.Column(db.String(255))
    
    # Status and timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    contractor = db.relationship('Vendor', backref='public_works')
    
    def __init__(self, work_id, work_name, work_type, work_category, description, 
                 address_line1, area, ward_number, estimated_cost, 
                 address_line2=None, landmark=None, sanctioned_amount=None,
                 start_date=None, planned_end_date=None, status='Planned',
                 contractor_name=None, contractor_id=None, engineer_in_charge=None,
                 supervisor_name=None, before_image_path=None, after_image_path=None,
                 document_path=None):
        self.work_id = work_id
        self.work_name = work_name
        self.work_type = work_type
        self.work_category = work_category
        self.description = description
        self.address_line1 = address_line1
        self.area = area
        self.ward_number = ward_number
        self.estimated_cost = estimated_cost
        self.address_line2 = address_line2
        self.landmark = landmark
        self.sanctioned_amount = sanctioned_amount
        self.start_date = start_date
        self.planned_end_date = planned_end_date
        self.status = status
        self.contractor_name = contractor_name
        self.contractor_id = contractor_id
        self.engineer_in_charge = engineer_in_charge
        self.supervisor_name = supervisor_name
        self.before_image_path = before_image_path
        self.after_image_path = after_image_path
        self.document_path = document_path
    
    def full_address(self):
        address_parts = [
            self.address_line1,
            self.address_line2,
            self.landmark,
            self.area,
            f"Ward {self.ward_number}"
        ]
        return ", ".join(filter(None, address_parts))
    
    def start_work(self):
        """Start the public work"""
        self.status = 'In Progress'
        self.start_date = date.today()
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def update_progress(self, completion_percentage, additional_expenditure=0.0):
        """Update work progress"""
        self.completion_percentage = completion_percentage
        self.expenditure += additional_expenditure
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def complete_work(self):
        """Mark work as completed"""
        self.status = 'Completed'
        self.completion_percentage = 100.0
        self.actual_end_date = date.today()
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def delay_work(self):
        """Mark work as delayed"""
        self.status = 'Delayed'
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def halt_work(self):
        """Halt the work"""
        self.status = 'Halted'
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def days_delayed(self):
        """Calculate days delayed"""
        if not self.planned_end_date or self.status not in ['In Progress', 'Delayed']:
            return 0
        
        today = date.today()
        if today > self.planned_end_date:
            return (today - self.planned_end_date).days
        return 0
    
    def remaining_budget(self):
        """Calculate remaining budget"""
        if not self.sanctioned_amount:
            return None
        return self.sanctioned_amount - self.expenditure
    
    def budget_utilization_percentage(self):
        """Calculate budget utilization percentage"""
        if not self.sanctioned_amount or self.sanctioned_amount == 0:
            return 0
        return (self.expenditure / self.sanctioned_amount) * 100
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'work_id': self.work_id,
            'work_details': {
                'work_name': self.work_name,
                'work_type': self.work_type,
                'work_category': self.work_category,
                'description': self.description
            },
            'location': {
                'address_line1': self.address_line1,
                'address_line2': self.address_line2,
                'landmark': self.landmark,
                'area': self.area,
                'ward_number': self.ward_number,
                'full_address': self.full_address()
            },
            'financial_details': {
                'estimated_cost': self.estimated_cost,
                'sanctioned_amount': self.sanctioned_amount,
                'expenditure': self.expenditure,
                'remaining_budget': self.remaining_budget(),
                'budget_utilization_percentage': self.budget_utilization_percentage()
            },
            'timeline': {
                'start_date': self.start_date.isoformat() if self.start_date else None,
                'planned_end_date': self.planned_end_date.isoformat() if self.planned_end_date else None,
                'actual_end_date': self.actual_end_date.isoformat() if self.actual_end_date else None,
                'days_delayed': self.days_delayed()
            },
            'status': {
                'current_status': self.status,
                'completion_percentage': self.completion_percentage
            },
            'contractor_details': {
                'contractor_name': self.contractor_name,
                'contractor_id': self.contractor_id
            },
            'technical_details': {
                'engineer_in_charge': self.engineer_in_charge,
                'supervisor_name': self.supervisor_name
            },
            'documents': {
                'before_image_path': self.before_image_path,
                'after_image_path': self.after_image_path,
                'document_path': self.document_path
            },
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def __repr__(self):
        return f'<PublicWork {self.work_id}>'