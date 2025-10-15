from datetime import datetime
from extensions import db
from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID
import uuid

class Citizen(db.Model):
    __tablename__ = 'citizens'
    
    id = db.Column(String(36), primary_key=True, default=uuid.uuid4)
    aadhaar_number = db.Column(db.String(12), unique=True, nullable=True)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=True)
    phone = db.Column(db.String(20), nullable=False)
    date_of_birth = db.Column(db.Date, nullable=False)
    gender = db.Column(db.String(10), nullable=False)  # Male, Female, Other
    
    # Address details
    address_line1 = db.Column(db.String(100), nullable=False)
    address_line2 = db.Column(db.String(100))
    landmark = db.Column(db.String(100))
    area = db.Column(db.String(50), nullable=False)
    ward_number = db.Column(db.String(10), nullable=False)
    zone = db.Column(db.String(50), nullable=False)
    city = db.Column(db.String(50), nullable=False)
    state = db.Column(db.String(50), nullable=False)
    pincode = db.Column(db.String(6), nullable=False)
    
    # Verification status
    is_verified = db.Column(db.Boolean, default=False)
    verification_method = db.Column(db.String(20))  # aadhaar, email, phone, manual
    verification_date = db.Column(db.DateTime)
    
    # Status and timestamps
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    properties = db.relationship('Property', backref='owner', lazy=True)
    complaints = db.relationship('Complaint', backref='complainant', lazy=True)
    trade_licenses = db.relationship('TradeLicense', backref='license_holder', lazy=True)
    building_plans = db.relationship('BuildingPlan', back_populates='applicant', lazy=True)
    water_connections = db.relationship('WaterConnection', back_populates='consumer', lazy=True)
    
    def __init__(self, first_name, last_name, phone, date_of_birth, gender, 
                 address_line1, area, ward_number, zone, city, state, pincode,
                 aadhaar_number=None, email=None, address_line2=None, landmark=None):
        self.first_name = first_name
        self.last_name = last_name
        self.phone = phone
        self.date_of_birth = date_of_birth
        self.gender = gender
        self.address_line1 = address_line1
        self.area = area
        self.ward_number = ward_number
        self.zone = zone
        self.city = city
        self.state = state
        self.pincode = pincode
        self.aadhaar_number = aadhaar_number
        self.email = email
        self.address_line2 = address_line2
        self.landmark = landmark
    
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
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
    
    def verify(self, method):
        self.is_verified = True
        self.verification_method = method
        self.verification_date = datetime.utcnow()
        db.session.commit()
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'aadhaar_number': self.aadhaar_number,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': self.full_name(),
            'email': self.email,
            'phone': self.phone,
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'gender': self.gender,
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
            'is_verified': self.is_verified,
            'verification_method': self.verification_method,
            'verification_date': self.verification_date.isoformat() if self.verification_date else None,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat()
        }
    
    def __repr__(self):
        return f'<Citizen {self.full_name()}>'