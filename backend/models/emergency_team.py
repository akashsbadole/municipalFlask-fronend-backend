from datetime import datetime
from extensions import db
from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID
import uuid

class EmergencyTeam(db.Model):
    __tablename__ = 'emergency_teams'
    
    id = db.Column(String(36), primary_key=True, default=uuid.uuid4)
    team_id = db.Column(db.String(20), unique=True, nullable=False)
    
    # Team details
    team_name = db.Column(db.String(100), nullable=False)
    team_type = db.Column(db.String(30), nullable=False)  # Medical, Fire, Rescue, etc.
    specialization = db.Column(db.String(50))  # Specific area of expertise
    
    # Contact details
    contact_person = db.Column(db.String(100), nullable=False)
    contact_phone = db.Column(db.String(20), nullable=False)
    contact_email = db.Column(db.String(120))
    
    # Location details
    base_location = db.Column(db.String(255), nullable=False)
    coverage_area = db.Column(db.String(255))  # Areas this team covers
    ward_numbers = db.Column(db.String(100))  # Comma-separated ward numbers
    
    # Team composition
    team_size = db.Column(db.Integer, default=0)
    team_members = db.Column(db.Text)  # JSON string with team member details
    
    # Equipment
    equipment_available = db.Column(db.Text)  # JSON string with equipment details
    vehicle_details = db.Column(db.Text)  # JSON string with vehicle details
    
    # Availability
    is_active = db.Column(db.Boolean, default=True)
    is_on_duty = db.Column(db.Boolean, default=False)
    duty_start_time = db.Column(db.DateTime)
    duty_end_time = db.Column(db.DateTime)
    
    # Status and timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __init__(self, team_id, team_name, team_type, contact_person, 
                 contact_phone, base_location, specialization=None,
                 contact_email=None, coverage_area=None, ward_numbers=None,
                 team_size=0, team_members=None, equipment_available=None,
                 vehicle_details=None, is_active=True, is_on_duty=False):
        self.team_id = team_id
        self.team_name = team_name
        self.team_type = team_type
        self.specialization = specialization
        self.contact_person = contact_person
        self.contact_phone = contact_phone
        self.contact_email = contact_email
        self.base_location = base_location
        self.coverage_area = coverage_area
        self.ward_numbers = ward_numbers
        self.team_size = team_size
        self.team_members = team_members
        self.equipment_available = equipment_available
        self.vehicle_details = vehicle_details
        self.is_active = is_active
        self.is_on_duty = is_on_duty
    
    def get_ward_list(self):
        """Get list of ward numbers"""
        if not self.ward_numbers:
            return []
        return [ward.strip() for ward in self.ward_numbers.split(',')]
    
    def start_duty(self):
        """Mark team as on duty"""
        self.is_on_duty = True
        self.duty_start_time = datetime.utcnow()
        self.duty_end_time = None
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def end_duty(self):
        """Mark team as off duty"""
        self.is_on_duty = False
        self.duty_end_time = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def update_team_size(self, new_size):
        """Update team size"""
        self.team_size = new_size
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def update_team_members(self, members_json):
        """Update team members"""
        self.team_members = members_json
        self.team_size = len(members_json) if members_json else 0
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def activate_team(self):
        """Activate team for emergency response"""
        self.is_active = True
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def deactivate_team(self):
        """Deactivate team"""
        self.is_active = False
        self.is_on_duty = False
        self.duty_end_time = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def is_available_for_deployment(self):
        """Check if team is available for deployment"""
        return self.is_active and not self.is_on_duty
    
    def duty_duration(self):
        """Calculate current duty duration in hours"""
        if not self.is_on_duty or not self.duty_start_time:
            return 0
        
        end_time = self.duty_end_time or datetime.utcnow()
        duration = end_time - self.duty_start_time
        return duration.total_seconds() / 3600  # Convert to hours
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'team_id': self.team_id,
            'team_details': {
                'team_name': self.team_name,
                'team_type': self.team_type,
                'specialization': self.specialization
            },
            'contact': {
                'contact_person': self.contact_person,
                'contact_phone': self.contact_phone,
                'contact_email': self.contact_email
            },
            'location': {
                'base_location': self.base_location,
                'coverage_area': self.coverage_area,
                'ward_numbers': self.get_ward_list()
            },
            'team_composition': {
                'team_size': self.team_size,
                'team_members': self.team_members
            },
            'equipment': {
                'equipment_available': self.equipment_available,
                'vehicle_details': self.vehicle_details
            },
            'availability': {
                'is_active': self.is_active,
                'is_on_duty': self.is_on_duty,
                'is_available_for_deployment': self.is_available_for_deployment(),
                'duty_start_time': self.duty_start_time.isoformat() if self.duty_start_time else None,
                'duty_end_time': self.duty_end_time.isoformat() if self.duty_end_time else None,
                'duty_duration_hours': self.duty_duration()
            },
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def __repr__(self):
        return f'<EmergencyTeam {self.team_id}>'