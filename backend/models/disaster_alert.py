from datetime import datetime
from extensions import db
from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID
import uuid

class DisasterAlert(db.Model):
    __tablename__ = 'disaster_alerts'
    
    id = db.Column(String(36), primary_key=True, default=uuid.uuid4)
    alert_id = db.Column(db.String(20), unique=True, nullable=False)
    
    # Alert details
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    alert_type = db.Column(db.String(30), nullable=False)  # Flood, Fire, Pollution, Epidemic, etc.
    severity = db.Column(db.String(20), nullable=False)  # Low, Medium, High, Critical
    
    # Location details
    affected_areas = db.Column(db.Text)  # Description of affected areas
    ward_numbers = db.Column(db.String(100))  # Comma-separated ward numbers
    coordinates = db.Column(db.Text)  # JSON string with coordinates
    
    # Timeline
    issued_date = db.Column(db.DateTime, default=datetime.utcnow)
    start_date = db.Column(db.DateTime)
    end_date = db.Column(db.DateTime)
    
    # Status
    status = db.Column(db.String(20), default='Active')  # Active, Resolved, Cancelled
    
    # Response actions
    response_actions = db.Column(db.Text)
    evacuation_required = db.Column(db.Boolean, default=False)
    evacuation_zones = db.Column(db.Text)
    
    # Contact information
    emergency_contacts = db.Column(db.Text)
    help_line_numbers = db.Column(db.Text)
    
    # Additional information
    weather_data = db.Column(db.Text)  # JSON string with weather data
    sensor_data = db.Column(db.Text)  # JSON string with IoT sensor data
    
    # Issued by
    issued_by = db.Column(String(36), db.ForeignKey('users.id'))
    
    # Status and timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    issuer = db.relationship('User', backref='disaster_alerts')
    
    def __init__(self, alert_id, title, description, alert_type, severity, 
                 affected_areas=None, ward_numbers=None, coordinates=None,
                 start_date=None, end_date=None, status='Active',
                 response_actions=None, evacuation_required=False,
                 evacuation_zones=None, emergency_contacts=None,
                 help_line_numbers=None, weather_data=None,
                 sensor_data=None, issued_by=None):
        self.alert_id = alert_id
        self.title = title
        self.description = description
        self.alert_type = alert_type
        self.severity = severity
        self.affected_areas = affected_areas
        self.ward_numbers = ward_numbers
        self.coordinates = coordinates
        self.start_date = start_date
        self.end_date = end_date
        self.status = status
        self.response_actions = response_actions
        self.evacuation_required = evacuation_required
        self.evacuation_zones = evacuation_zones
        self.emergency_contacts = emergency_contacts
        self.help_line_numbers = help_line_numbers
        self.weather_data = weather_data
        self.sensor_data = sensor_data
        self.issued_by = issued_by
    
    def get_ward_list(self):
        """Get list of ward numbers"""
        if not self.ward_numbers:
            return []
        return [ward.strip() for ward in self.ward_numbers.split(',')]
    
    def is_active(self):
        """Check if alert is still active"""
        if self.status != 'Active':
            return False
        
        now = datetime.utcnow()
        
        if self.start_date and now < self.start_date:
            return False
        
        if self.end_date and now > self.end_date:
            return False
        
        return True
    
    def resolve_alert(self):
        """Resolve the alert"""
        self.status = 'Resolved'
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def cancel_alert(self):
        """Cancel the alert"""
        self.status = 'Cancelled'
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def reactivate_alert(self):
        """Reactivate a cancelled or resolved alert"""
        self.status = 'Active'
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def update_alert(self, description=None, affected_areas=None, 
                     response_actions=None, emergency_contacts=None):
        """Update alert details"""
        if description:
            self.description = description
        if affected_areas:
            self.affected_areas = affected_areas
        if response_actions:
            self.response_actions = response_actions
        if emergency_contacts:
            self.emergency_contacts = emergency_contacts
        
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'alert_id': self.alert_id,
            'alert_details': {
                'title': self.title,
                'description': self.description,
                'alert_type': self.alert_type,
                'severity': self.severity
            },
            'location': {
                'affected_areas': self.affected_areas,
                'ward_numbers': self.get_ward_list(),
                'coordinates': self.coordinates
            },
            'timeline': {
                'issued_date': self.issued_date.isoformat() if self.issued_date else None,
                'start_date': self.start_date.isoformat() if self.start_date else None,
                'end_date': self.end_date.isoformat() if self.end_date else None,
                'is_active': self.is_active()
            },
            'status': self.status,
            'response': {
                'response_actions': self.response_actions,
                'evacuation_required': self.evacuation_required,
                'evacuation_zones': self.evacuation_zones
            },
            'contact': {
                'emergency_contacts': self.emergency_contacts,
                'help_line_numbers': self.help_line_numbers
            },
            'additional_data': {
                'weather_data': self.weather_data,
                'sensor_data': self.sensor_data
            },
            'issued_by': {
                'id': self.issued_by,
                'name': self.issuer.full_name() if self.issuer else None
            },
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def __repr__(self):
        return f'<DisasterAlert {self.alert_id}>'