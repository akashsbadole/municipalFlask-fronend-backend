from datetime import datetime
from app import db
from sqlalchemy.dialects.postgresql import UUID
import uuid

class HealthInspection(db.Model):
    __tablename__ = 'health_inspections'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    inspection_id = db.Column(db.String(20), unique=True, nullable=False)
    
    # Inspection details
    inspection_date = db.Column(db.Date, nullable=False)
    inspection_type = db.Column(db.String(30), nullable=False)  # Restaurant, Food Stall, Water Tank, etc.
    establishment_name = db.Column(db.String(100), nullable=False)
    establishment_type = db.Column(db.String(30), nullable=False)
    
    # Location details
    address_line1 = db.Column(db.String(100), nullable=False)
    address_line2 = db.Column(db.String(100))
    landmark = db.Column(db.String(100))
    area = db.Column(db.String(50), nullable=False)
    ward_number = db.Column(db.String(10), nullable=False)
    
    # Owner details
    owner_name = db.Column(db.String(100), nullable=False)
    owner_contact = db.Column(db.String(20))
    
    # Inspection results
    inspection_result = db.Column(db.String(20), default='Pending')  # Pass, Fail, Pending
    hygiene_rating = db.Column(db.Integer)  # 1-5 scale
    food_safety_rating = db.Column(db.Integer)  # 1-5 scale
    overall_rating = db.Column(db.Integer)  # 1-5 scale
    
    # Violations and recommendations
    violations_found = db.Column(db.Text)
    recommendations = db.Column(db.Text)
    follow_up_required = db.Column(db.Boolean, default=False)
    follow_up_date = db.Column(db.Date)
    
    # Inspector details
    inspector_name = db.Column(db.String(100), nullable=False)
    inspector_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    inspector_signature = db.Column(db.String(255))  # Path to signature image
    
    # License details
    license_number = db.Column(db.String(20))
    license_valid_from = db.Column(db.Date)
    license_valid_to = db.Column(db.Date)
    
    # Status and timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    inspector = db.relationship('User', backref='health_inspections')
    
    def __init__(self, inspection_id, inspection_date, inspection_type, establishment_name,
                 establishment_type, address_line1, area, ward_number, owner_name,
                 inspector_name, inspector_id, address_line2=None, landmark=None,
                 owner_contact=None, inspection_result='Pending', hygiene_rating=None,
                 food_safety_rating=None, overall_rating=None, violations_found=None,
                 recommendations=None, follow_up_required=False, follow_up_date=None,
                 inspector_signature=None, license_number=None, license_valid_from=None,
                 license_valid_to=None):
        self.inspection_id = inspection_id
        self.inspection_date = inspection_date
        self.inspection_type = inspection_type
        self.establishment_name = establishment_name
        self.establishment_type = establishment_type
        self.address_line1 = address_line1
        self.area = area
        self.ward_number = ward_number
        self.owner_name = owner_name
        self.inspector_name = inspector_name
        self.inspector_id = inspector_id
        self.address_line2 = address_line2
        self.landmark = landmark
        self.owner_contact = owner_contact
        self.inspection_result = inspection_result
        self.hygiene_rating = hygiene_rating
        self.food_safety_rating = food_safety_rating
        self.overall_rating = overall_rating
        self.violations_found = violations_found
        self.recommendations = recommendations
        self.follow_up_required = follow_up_required
        self.follow_up_date = follow_up_date
        self.inspector_signature = inspector_signature
        self.license_number = license_number
        self.license_valid_from = license_valid_from
        self.license_valid_to = license_valid_to
    
    def full_address(self):
        address_parts = [
            self.address_line1,
            self.address_line2,
            self.landmark,
            self.area,
            f"Ward {self.ward_number}"
        ]
        return ", ".join(filter(None, address_parts))
    
    def complete_inspection(self, result, hygiene_rating, food_safety_rating, 
                           overall_rating, violations=None, recommendations=None,
                           follow_up_required=False, follow_up_date=None):
        """Complete the inspection with results"""
        self.inspection_result = result
        self.hygiene_rating = hygiene_rating
        self.food_safety_rating = food_safety_rating
        self.overall_rating = overall_rating
        self.violations_found = violations
        self.recommendations = recommendations
        self.follow_up_required = follow_up_required
        self.follow_up_date = follow_up_date
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def is_license_valid(self):
        """Check if establishment license is valid"""
        if not self.license_valid_from or not self.license_valid_to:
            return False
        
        from datetime import date
        today = date.today()
        return self.license_valid_from <= today <= self.license_valid_to
    
    def days_to_license_expiry(self):
        """Calculate days until license expiry"""
        if not self.license_valid_to:
            return None
        
        from datetime import date
        today = date.today()
        if today > self.license_valid_to:
            return 0
        
        return (self.license_valid_to - today).days
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'inspection_id': self.inspection_id,
            'inspection_details': {
                'inspection_date': self.inspection_date.isoformat() if self.inspection_date else None,
                'inspection_type': self.inspection_type,
                'establishment_name': self.establishment_name,
                'establishment_type': self.establishment_type
            },
            'location': {
                'address_line1': self.address_line1,
                'address_line2': self.address_line2,
                'landmark': self.landmark,
                'area': self.area,
                'ward_number': self.ward_number,
                'full_address': self.full_address()
            },
            'owner_details': {
                'owner_name': self.owner_name,
                'owner_contact': self.owner_contact
            },
            'results': {
                'inspection_result': self.inspection_result,
                'hygiene_rating': self.hygiene_rating,
                'food_safety_rating': self.food_safety_rating,
                'overall_rating': self.overall_rating
            },
            'violations_recommendations': {
                'violations_found': self.violations_found,
                'recommendations': self.recommendations,
                'follow_up_required': self.follow_up_required,
                'follow_up_date': self.follow_up_date.isoformat() if self.follow_up_date else None
            },
            'inspector': {
                'inspector_name': self.inspector_name,
                'inspector_id': self.inspector_id,
                'inspector_signature': self.inspector_signature
            },
            'license': {
                'license_number': self.license_number,
                'license_valid_from': self.license_valid_from.isoformat() if self.license_valid_from else None,
                'license_valid_to': self.license_valid_to.isoformat() if self.license_valid_to else None,
                'is_valid': self.is_license_valid(),
                'days_to_expiry': self.days_to_license_expiry()
            },
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def __repr__(self):
        return f'<HealthInspection {self.inspection_id}>'