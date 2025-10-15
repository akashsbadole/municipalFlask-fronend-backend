from datetime import datetime
from extensions import db
from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID
import uuid

class WasteRoute(db.Model):
    __tablename__ = 'waste_routes'
    
    id = db.Column(String(36), primary_key=True, default=uuid.uuid4)
    route_number = db.Column(db.String(10), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    
    # Route details
    area = db.Column(db.String(50), nullable=False)
    ward_numbers = db.Column(db.String(100))  # Comma-separated ward numbers
    description = db.Column(db.Text)
    
    # Schedule
    collection_frequency = db.Column(db.String(20), default='Daily')  # Daily, Weekly, Bi-weekly
    collection_days = db.Column(db.String(20))  # Comma-separated days (Mon, Tue, etc.)
    start_time = db.Column(db.Time, nullable=False)
    estimated_duration = db.Column(db.Integer)  # in hours
    
    # Route data
    total_distance = db.Column(db.Float)  # in km
    number_of_stops = db.Column(db.Integer, default=0)
    estimated_waste = db.Column(db.Float)  # in kg
    
    # Status
    is_active = db.Column(db.Boolean, default=True)
    
    # Status and timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __init__(self, route_number, name, area, start_time, ward_numbers=None,
                 collection_frequency='Daily', collection_days=None, description=None,
                 estimated_duration=None, total_distance=None, number_of_stops=0,
                 estimated_waste=None):
        self.route_number = route_number
        self.name = name
        self.area = area
        self.start_time = start_time
        self.ward_numbers = ward_numbers
        self.collection_frequency = collection_frequency
        self.collection_days = collection_days
        self.description = description
        self.estimated_duration = estimated_duration
        self.total_distance = total_distance
        self.number_of_stops = number_of_stops
        self.estimated_waste = estimated_waste
    
    def get_ward_list(self):
        """Get list of ward numbers"""
        if not self.ward_numbers:
            return []
        return [ward.strip() for ward in self.ward_numbers.split(',')]
    
    def get_collection_days_list(self):
        """Get list of collection days"""
        if not self.collection_days:
            return []
        return [day.strip() for day in self.collection_days.split(',')]
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'route_number': self.route_number,
            'name': self.name,
            'area': self.area,
            'ward_numbers': self.get_ward_list(),
            'description': self.description,
            'schedule': {
                'collection_frequency': self.collection_frequency,
                'collection_days': self.get_collection_days_list(),
                'start_time': self.start_time.isoformat() if self.start_time else None,
                'estimated_duration': self.estimated_duration
            },
            'route_data': {
                'total_distance': self.total_distance,
                'number_of_stops': self.number_of_stops,
                'estimated_waste': self.estimated_waste
            },
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def __repr__(self):
        return f'<WasteRoute {self.route_number}>'