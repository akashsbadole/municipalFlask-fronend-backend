from datetime import datetime
from app import db
from sqlalchemy.dialects.postgresql import UUID
import uuid

class Property(db.Model):
    __tablename__ = 'properties'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_id = db.Column(db.String(20), unique=True, nullable=False)
    
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
    
    # GIS data
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    
    # Property details
    property_type = db.Column(db.String(30), nullable=False)  # Residential, Commercial, Industrial, Mixed
    usage_type = db.Column(db.String(30), nullable=False)  # Self-occupied, Rented, Vacant
    building_type = db.Column(db.String(30), nullable=False)  # Apartment, Independent House, Villa, etc.
    construction_year = db.Column(db.Integer)
    
    # Physical details
    plot_area = db.Column(db.Float, nullable=False)  # in sq. meters
    built_up_area = db.Column(db.Float, nullable=False)  # in sq. meters
    carpet_area = db.Column(db.Float)  # in sq. meters
    number_of_floors = db.Column(db.Integer, default=1)
    number_of_rooms = db.Column(db.Integer)
    
    # Ownership details
    ownership_type = db.Column(db.String(30), nullable=False)  # Single, Joint, Company, Trust
    ownership_percentage = db.Column(db.Float)  # For joint ownership
    
    # Status and timestamps
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign keys
    owner_id = db.Column(UUID(as_uuid=True), db.ForeignKey('citizens.id'), nullable=False)
    
    # Relationships
    taxes = db.relationship('PropertyTax', backref='property', lazy=True)
    
    def __init__(self, property_id, address_line1, area, ward_number, zone, city, state, pincode,
                 property_type, usage_type, building_type, plot_area, built_up_area, owner_id,
                 address_line2=None, landmark=None, latitude=None, longitude=None,
                 construction_year=None, number_of_floors=1, number_of_rooms=None,
                 ownership_type='Single', ownership_percentage=None, carpet_area=None):
        self.property_id = property_id
        self.address_line1 = address_line1
        self.area = area
        self.ward_number = ward_number
        self.zone = zone
        self.city = city
        self.state = state
        self.pincode = pincode
        self.property_type = property_type
        self.usage_type = usage_type
        self.building_type = building_type
        self.plot_area = plot_area
        self.built_up_area = built_up_area
        self.owner_id = owner_id
        self.address_line2 = address_line2
        self.landmark = landmark
        self.latitude = latitude
        self.longitude = longitude
        self.construction_year = construction_year
        self.number_of_floors = number_of_floors
        self.number_of_rooms = number_of_rooms
        self.ownership_type = ownership_type
        self.ownership_percentage = ownership_percentage
        self.carpet_area = carpet_area
    
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
    
    def get_latest_tax(self):
        return PropertyTax.query.filter_by(property_id=self.id).order_by(PropertyTax.year.desc()).first()
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'property_id': self.property_id,
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
            'location': {
                'latitude': self.latitude,
                'longitude': self.longitude
            },
            'property_details': {
                'property_type': self.property_type,
                'usage_type': self.usage_type,
                'building_type': self.building_type,
                'construction_year': self.construction_year,
                'plot_area': self.plot_area,
                'built_up_area': self.built_up_area,
                'carpet_area': self.carpet_area,
                'number_of_floors': self.number_of_floors,
                'number_of_rooms': self.number_of_rooms
            },
            'ownership': {
                'ownership_type': self.ownership_type,
                'ownership_percentage': self.ownership_percentage,
                'owner': self.owner.full_name() if self.owner else None
            },
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'latest_tax': self.get_latest_tax().to_dict() if self.get_latest_tax() else None
        }
    
    def __repr__(self):
        return f'<Property {self.property_id}>'