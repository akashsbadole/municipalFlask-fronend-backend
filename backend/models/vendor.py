from datetime import datetime
from app import db
from sqlalchemy.dialects.postgresql import UUID
import uuid

class Vendor(db.Model):
    __tablename__ = 'vendors'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vendor_id = db.Column(db.String(20), unique=True, nullable=False)
    
    # Company details
    company_name = db.Column(db.String(100), nullable=False)
    contact_person = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120))
    phone = db.Column(db.String(20), nullable=False)
    
    # Address details
    address_line1 = db.Column(db.String(100), nullable=False)
    address_line2 = db.Column(db.String(100))
    landmark = db.Column(db.String(100))
    area = db.Column(db.String(50), nullable=False)
    city = db.Column(db.String(50), nullable=False)
    state = db.Column(db.String(50), nullable=False)
    pincode = db.Column(db.String(6), nullable=False)
    
    # Business details
    business_type = db.Column(db.String(50), nullable=False)
    services_provided = db.Column(db.Text)
    gst_number = db.Column(db.String(15))
    pan_number = db.Column(db.String(10))
    
    # Banking details
    bank_name = db.Column(db.String(100))
    account_number = db.Column(db.String(30))
    ifsc_code = db.Column(db.String(15))
    
    # Registration and compliance
    registration_date = db.Column(db.Date)
    certificate_valid_from = db.Column(db.Date)
    certificate_valid_to = db.Column(db.Date)
    
    # Performance metrics
    total_contracts = db.Column(db.Integer, default=0)
    total_value = db.Column(db.Float, default=0.0)
    performance_rating = db.Column(db.Float)  # 1-5 scale
    
    # Status
    status = db.Column(db.String(20), default='Active')  # Active, Inactive, Blacklisted
    
    # Status and timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __init__(self, vendor_id, company_name, contact_person, phone, address_line1, 
                 area, city, state, pincode, business_type, email=None, address_line2=None,
                 landmark=None, services_provided=None, gst_number=None, pan_number=None,
                 bank_name=None, account_number=None, ifsc_code=None, registration_date=None,
                 certificate_valid_from=None, certificate_valid_to=None):
        self.vendor_id = vendor_id
        self.company_name = company_name
        self.contact_person = contact_person
        self.phone = phone
        self.address_line1 = address_line1
        self.area = area
        self.city = city
        self.state = state
        self.pincode = pincode
        self.business_type = business_type
        self.email = email
        self.address_line2 = address_line2
        self.landmark = landmark
        self.services_provided = services_provided
        self.gst_number = gst_number
        self.pan_number = pan_number
        self.bank_name = bank_name
        self.account_number = account_number
        self.ifsc_code = ifsc_code
        self.registration_date = registration_date
        self.certificate_valid_from = certificate_valid_from
        self.certificate_valid_to = certificate_valid_to
    
    def full_address(self):
        address_parts = [
            self.address_line1,
            self.address_line2,
            self.landmark,
            self.area,
            self.city,
            self.state,
            self.pincode
        ]
        return ", ".join(filter(None, address_parts))
    
    def is_certificate_valid(self):
        """Check if vendor certificate is valid"""
        if not self.certificate_valid_from or not self.certificate_valid_to:
            return False
        
        from datetime import date
        today = date.today()
        return self.certificate_valid_from <= today <= self.certificate_valid_to
    
    def days_to_certificate_expiry(self):
        """Calculate days until certificate expiry"""
        if not self.certificate_valid_to:
            return None
        
        from datetime import date
        today = date.today()
        if today > self.certificate_valid_to:
            return 0
        
        return (self.certificate_valid_to - today).days
    
    def update_performance_metrics(self, contracts_count, total_value, rating):
        """Update vendor performance metrics"""
        self.total_contracts = contracts_count
        self.total_value = total_value
        self.performance_rating = rating
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def update_status(self, status):
        """Update vendor status"""
        self.status = status
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'vendor_id': self.vendor_id,
            'company_details': {
                'company_name': self.company_name,
                'contact_person': self.contact_person,
                'email': self.email,
                'phone': self.phone
            },
            'address': {
                'address_line1': self.address_line1,
                'address_line2': self.address_line2,
                'landmark': self.landmark,
                'area': self.area,
                'city': self.city,
                'state': self.state,
                'pincode': self.pincode,
                'full_address': self.full_address()
            },
            'business_details': {
                'business_type': self.business_type,
                'services_provided': self.services_provided,
                'gst_number': self.gst_number,
                'pan_number': self.pan_number
            },
            'banking_details': {
                'bank_name': self.bank_name,
                'account_number': self.account_number,
                'ifsc_code': self.ifsc_code
            },
            'compliance': {
                'registration_date': self.registration_date.isoformat() if self.registration_date else None,
                'certificate_valid_from': self.certificate_valid_from.isoformat() if self.certificate_valid_from else None,
                'certificate_valid_to': self.certificate_valid_to.isoformat() if self.certificate_valid_to else None,
                'is_certificate_valid': self.is_certificate_valid(),
                'days_to_expiry': self.days_to_certificate_expiry()
            },
            'performance': {
                'total_contracts': self.total_contracts,
                'total_value': self.total_value,
                'performance_rating': self.performance_rating
            },
            'status': self.status,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def __repr__(self):
        return f'<Vendor {self.vendor_id}>'