from datetime import datetime
from extensions import db
from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID
import uuid

class WasteCollection(db.Model):
    __tablename__ = 'waste_collections'
    
    id = db.Column(String(36), primary_key=True, default=uuid.uuid4)
    collection_id = db.Column(db.String(20), unique=True, nullable=False)
    
    # Collection details
    collection_date = db.Column(db.Date, nullable=False)
    route_id = db.Column(String(36), db.ForeignKey('waste_routes.id'))
    vehicle_number = db.Column(db.String(20), nullable=False)
    driver_name = db.Column(db.String(100))
    helper_names = db.Column(db.String(255))
    
    # Collection data
    biodegradable_waste = db.Column(db.Float, default=0.0)  # in kg
    non_biodegradable_waste = db.Column(db.Float, default=0.0)  # in kg
    hazardous_waste = db.Column(db.Float, default=0.0)  # in kg
    total_waste = db.Column(db.Float, default=0.0)  # in kg
    
    # Status
    status = db.Column(db.String(20), default='Scheduled')  # Scheduled, In Progress, Completed, Failed
    start_time = db.Column(db.DateTime)
    end_time = db.Column(db.DateTime)
    completion_percentage = db.Column(db.Float, default=0.0)
    
    # Issues
    issues_encountered = db.Column(db.Text)
    missed_areas = db.Column(db.Text)
    
    # Status and timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    route = db.relationship('WasteRoute', backref='collections')
    
    def __init__(self, collection_id, collection_date, vehicle_number, route_id=None,
                 driver_name=None, helper_names=None):
        self.collection_id = collection_id
        self.collection_date = collection_date
        self.vehicle_number = vehicle_number
        self.route_id = route_id
        self.driver_name = driver_name
        self.helper_names = helper_names
    
    def start_collection(self):
        """Start waste collection"""
        self.status = 'In Progress'
        self.start_time = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def complete_collection(self, biodegradable=0.0, non_biodegradable=0.0, hazardous=0.0, 
                           completion_percentage=100.0, issues=None, missed_areas=None):
        """Complete waste collection"""
        self.status = 'Completed'
        self.end_time = datetime.utcnow()
        self.biodegradable_waste = biodegradable
        self.non_biodegradable_waste = non_biodegradable
        self.hazardous_waste = hazardous
        self.total_waste = biodegradable + non_biodegradable + hazardous
        self.completion_percentage = completion_percentage
        self.issues_encountered = issues
        self.missed_areas = missed_areas
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def fail_collection(self, reason):
        """Mark collection as failed"""
        self.status = 'Failed'
        self.end_time = datetime.utcnow()
        self.issues_encountered = reason
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'collection_id': self.collection_id,
            'collection_date': self.collection_date.isoformat() if self.collection_date else None,
            'route': {
                'id': str(self.route_id) if self.route_id else None,
                'name': self.route.name if self.route else None
            },
            'vehicle_details': {
                'vehicle_number': self.vehicle_number,
                'driver_name': self.driver_name,
                'helper_names': self.helper_names
            },
            'collection_data': {
                'biodegradable_waste': self.biodegradable_waste,
                'non_biodegradable_waste': self.non_biodegradable_waste,
                'hazardous_waste': self.hazardous_waste,
                'total_waste': self.total_waste
            },
            'status': {
                'current_status': self.status,
                'start_time': self.start_time.isoformat() if self.start_time else None,
                'end_time': self.end_time.isoformat() if self.end_time else None,
                'completion_percentage': self.completion_percentage
            },
            'issues': {
                'issues_encountered': self.issues_encountered,
                'missed_areas': self.missed_areas
            },
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def __repr__(self):
        return f'<WasteCollection {self.collection_id}>'