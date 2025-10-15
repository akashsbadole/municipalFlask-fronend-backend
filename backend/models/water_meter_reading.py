from datetime import datetime, date
from extensions import db
from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID
import uuid

class WaterMeterReading(db.Model):
    __tablename__ = 'water_meter_readings'
    
    id = db.Column(String(36), primary_key=True, default=uuid.uuid4)
    reading_id = db.Column(db.String(20), unique=True, nullable=False)
    
    # Reading details
    reading_date = db.Column(db.Date, nullable=False)
    reading_value = db.Column(db.Float, nullable=False)  # in kiloliters
    previous_reading = db.Column(db.Float, nullable=False)  # in kiloliters
    consumption = db.Column(db.Float, nullable=False)  # in kiloliters
    
    # Reading metadata
    reading_type = db.Column(db.String(20), default='Regular')  # Regular, Estimated, Final
    reader_name = db.Column(db.String(100))
    reader_remarks = db.Column(db.Text)
    
    # Validation
    is_valid = db.Column(db.Boolean, default=True)
    validation_remarks = db.Column(db.Text)
    validated_by = db.Column(String(36), db.ForeignKey('users.id'))
    validation_date = db.Column(db.DateTime)
    
    # Status and timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign keys
    connection_id = db.Column(String(36), db.ForeignKey('water_connections.id'), nullable=False)
    
    # Relationships
    validator = db.relationship('User', backref='validated_meter_readings')
    
    def __init__(self, reading_id, reading_date, reading_value, previous_reading, 
                 connection_id, reading_type='Regular', reader_name=None, 
                 reader_remarks=None):
        self.reading_id = reading_id
        self.reading_date = reading_date
        self.reading_value = reading_value
        self.previous_reading = previous_reading
        self.consumption = reading_value - previous_reading
        self.connection_id = connection_id
        self.reading_type = reading_type
        self.reader_name = reader_name
        self.reader_remarks = reader_remarks
    
    def validate_reading(self, is_valid, remarks=None, validator_id=None):
        """Validate the meter reading"""
        self.is_valid = is_valid
        self.validation_remarks = remarks
        self.validated_by = validator_id
        self.validation_date = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'reading_id': self.reading_id,
            'reading_details': {
                'reading_date': self.reading_date.isoformat() if self.reading_date else None,
                'reading_value': self.reading_value,
                'previous_reading': self.previous_reading,
                'consumption': self.consumption,
                'reading_type': self.reading_type
            },
            'metadata': {
                'reader_name': self.reader_name,
                'reader_remarks': self.reader_remarks
            },
            'validation': {
                'is_valid': self.is_valid,
                'validation_remarks': self.validation_remarks,
                'validated_by': self.validated_by,
                'validation_date': self.validation_date.isoformat() if self.validation_date else None
            },
            'connection': {
                'id': str(self.connection_id),
                'connection_number': self.connection.connection_number if self.connection else None
            },
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def __repr__(self):
        return f'<WaterMeterReading {self.reading_id}>'