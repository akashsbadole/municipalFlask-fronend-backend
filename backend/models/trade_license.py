from datetime import datetime, date
from extensions import db
from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID
import uuid

class TradeLicense(db.Model):
    __tablename__ = 'trade_licenses'
    
    id = db.Column(String(36), primary_key=True, default=uuid.uuid4)
    license_number = db.Column(db.String(20), unique=True, nullable=False)
    
    # Business details
    business_name = db.Column(db.String(100), nullable=False)
    business_type = db.Column(db.String(50), nullable=False)
    business_description = db.Column(db.Text)
    
    # Location details
    address_line1 = db.Column(db.String(100), nullable=False)
    address_line2 = db.Column(db.String(100))
    landmark = db.Column(db.String(100))
    area = db.Column(db.String(50), nullable=False)
    ward_number = db.Column(db.String(10), nullable=False)
    zone = db.Column(db.String(50), nullable=False)
    city = db.Column(db.String(50), nullable=False)
    state = db.Column(db.String(50), nullable=False)
    pincode = db.Column(db.String(6), nullable=False)
    
    # License details
    license_type = db.Column(db.String(50), nullable=False)
    issue_date = db.Column(db.Date, nullable=False)
    expiry_date = db.Column(db.Date, nullable=False)
    license_fee = db.Column(db.Float, nullable=False)
    fee_paid = db.Column(db.Float, default=0.0)
    payment_status = db.Column(db.String(20), default='Pending')  # Pending, Paid, Partial
    
    # Document details
    pan_number = db.Column(db.String(10))
    gst_number = db.Column(db.String(15))
    document_path = db.Column(db.String(255))  # Path to uploaded documents
    
    # Status and workflow
    status = db.Column(db.String(20), default='Applied')  # Applied, Under Review, Approved, Rejected, Issued, Expired
    approved_by = db.Column(String(36), db.ForeignKey('users.id'))
    approval_date = db.Column(db.DateTime)
    rejection_reason = db.Column(db.Text)
    
    # Inspection details
    inspection_required = db.Column(db.Boolean, default=True)
    inspection_date = db.Column(db.DateTime)
    inspection_by = db.Column(String(36), db.ForeignKey('users.id'))
    inspection_report = db.Column(db.Text)
    inspection_status = db.Column(db.String(20))  # Pending, Passed, Failed
    
    # Status and timestamps
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign keys
    license_holder_id = db.Column(String(36), db.ForeignKey('citizens.id'), nullable=False)
    
    # Relationships
    approver = db.relationship('User', foreign_keys=[approved_by], backref='approved_licenses')
    inspector = db.relationship('User', foreign_keys=[inspection_by], backref='inspected_licenses')
    
    def __init__(self, license_number, business_name, business_type, address_line1, area, 
                 ward_number, zone, city, state, pincode, license_type, issue_date, 
                 expiry_date, license_fee, license_holder_id, business_description=None,
                 address_line2=None, landmark=None, pan_number=None, gst_number=None,
                 document_path=None, inspection_required=True):
        self.license_number = license_number
        self.business_name = business_name
        self.business_type = business_type
        self.address_line1 = address_line1
        self.area = area
        self.ward_number = ward_number
        self.zone = zone
        self.city = city
        self.state = state
        self.pincode = pincode
        self.license_type = license_type
        self.issue_date = issue_date
        self.expiry_date = expiry_date
        self.license_fee = license_fee
        self.license_holder_id = license_holder_id
        self.business_description = business_description
        self.address_line2 = address_line2
        self.landmark = landmark
        self.pan_number = pan_number
        self.gst_number = gst_number
        self.document_path = document_path
        self.inspection_required = inspection_required
    
    def full_address(self):
        address_parts = [
            self.address_line1,
            self.address_line2,
            self.landmark,
            self.area,
            f"Ward {self.ward_number}",
            self.zone,
            self.city,
            self.state,
            self.pincode
        ]
        return ", ".join(filter(None, address_parts))
    
    def is_expired(self):
        """Check if license is expired"""
        return date.today() > self.expiry_date
    
    def days_to_expiry(self):
        """Calculate days until expiry"""
        if self.is_expired():
            return 0
        return (self.expiry_date - date.today()).days
    
    def update_status(self, status, user_id=None, reason=None):
        """Update license status"""
        self.status = status
        self.updated_at = datetime.utcnow()
        
        if status == 'Approved':
            self.approved_by = user_id
            self.approval_date = datetime.utcnow()
        elif status == 'Rejected' and reason:
            self.rejection_reason = reason
        
        db.session.commit()
    
    def make_payment(self, amount):
        """Process license fee payment"""
        if amount <= 0:
            return False, "Payment amount must be positive"
        
        if amount > (self.license_fee - self.fee_paid):
            return False, "Payment amount exceeds due amount"
        
        self.fee_paid += amount
        
        if self.fee_paid >= self.license_fee:
            self.payment_status = 'Paid'
        else:
            self.payment_status = 'Partial'
        
        self.updated_at = datetime.utcnow()
        db.session.commit()
        return True, "Payment processed successfully"
    
    def schedule_inspection(self, inspection_date, inspector_id):
        """Schedule license inspection"""
        self.inspection_date = inspection_date
        self.inspection_by = inspector_id
        self.inspection_status = 'Pending'
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def submit_inspection_report(self, report, status, inspector_id):
        """Submit inspection report"""
        self.inspection_report = report
        self.inspection_status = status  # Passed or Failed
        self.inspection_by = inspector_id
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'license_number': self.license_number,
            'business_details': {
                'business_name': self.business_name,
                'business_type': self.business_type,
                'business_description': self.business_description
            },
            'address': {
                'address_line1': self.address_line1,
                'address_line2': self.address_line2,
                'landmark': self.landmark,
                'area': self.area,
                'ward_number': self.ward_number,
                'zone': self.zone,
                'city': self.city,
                'state': self.state,
                'pincode': self.pincode,
                'full_address': self.full_address()
            },
            'license_details': {
                'license_type': self.license_type,
                'issue_date': self.issue_date.isoformat() if self.issue_date else None,
                'expiry_date': self.expiry_date.isoformat() if self.expiry_date else None,
                'license_fee': self.license_fee,
                'fee_paid': self.fee_paid,
                'payment_status': self.payment_status,
                'is_expired': self.is_expired(),
                'days_to_expiry': self.days_to_expiry()
            },
            'documents': {
                'pan_number': self.pan_number,
                'gst_number': self.gst_number,
                'document_path': self.document_path
            },
            'status': {
                'current_status': self.status,
                'approved_by': self.approved_by,
                'approval_date': self.approval_date.isoformat() if self.approval_date else None,
                'rejection_reason': self.rejection_reason
            },
            'inspection': {
                'inspection_required': self.inspection_required,
                'inspection_date': self.inspection_date.isoformat() if self.inspection_date else None,
                'inspection_by': self.inspection_by,
                'inspection_report': self.inspection_report,
                'inspection_status': self.inspection_status
            },
            'license_holder': {
                'id': str(self.license_holder_id),
                'name': self.license_holder.full_name() if self.license_holder else None
            },
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def __repr__(self):
        return f'<TradeLicense {self.license_number}>'