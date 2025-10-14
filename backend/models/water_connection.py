from datetime import datetime, date
from app import db
from sqlalchemy.dialects.postgresql import UUID
import uuid

class WaterConnection(db.Model):
    __tablename__ = 'water_connections'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    connection_number = db.Column(db.String(20), unique=True, nullable=False)
    
    # Consumer details
    consumer_name = db.Column(db.String(100), nullable=False)
    consumer_type = db.Column(db.String(30), default='Domestic')  # Domestic, Commercial, Industrial
    
    # Connection details
    connection_type = db.Column(db.String(30), default='Tap')  # Tap, Borewell, Tank
    pipe_size = db.Column(db.String(10))  # in mm
    connection_date = db.Column(db.Date)
    
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
    
    # Meter details
    meter_number = db.Column(db.String(20))
    meter_installed_date = db.Column(db.Date)
    meter_type = db.Column(db.String(30))  # Analog, Digital, Smart
    meter_status = db.Column(db.String(20), default='Active')  # Active, Inactive, Damaged
    
    # Billing details
    billing_cycle = db.Column(db.String(20), default='Monthly')  # Monthly, Bi-monthly
    tariff_category = db.Column(db.String(30))  # Based on consumer type and usage
    security_deposit = db.Column(db.Float, default=0.0)
    connection_fee = db.Column(db.Float, default=0.0)
    
    # Status
    status = db.Column(db.String(20), default='Active')  # Active, Inactive, Disconnected
    
    # Status and timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign keys
    consumer_id = db.Column(UUID(as_uuid=True), db.ForeignKey('citizens.id'), nullable=False)
    
    # Relationships
    consumer = db.relationship('Citizen', backref='water_connections')
    meter_readings = db.relationship('WaterMeterReading', backref='connection', lazy=True)
    
    def __init__(self, connection_number, consumer_name, address_line1, area, ward_number, 
                 zone, city, state, pincode, consumer_id, consumer_type='Domestic',
                 connection_type='Tap', address_line2=None, landmark=None, pipe_size=None,
                 connection_date=None, meter_number=None, meter_installed_date=None,
                 meter_type=None, billing_cycle='Monthly', tariff_category=None,
                 security_deposit=0.0, connection_fee=0.0):
        self.connection_number = connection_number
        self.consumer_name = consumer_name
        self.address_line1 = address_line1
        self.area = area
        self.ward_number = ward_number
        self.zone = zone
        self.city = city
        self.state = state
        self.pincode = pincode
        self.consumer_id = consumer_id
        self.consumer_type = consumer_type
        self.connection_type = connection_type
        self.address_line2 = address_line2
        self.landmark = landmark
        self.pipe_size = pipe_size
        self.connection_date = connection_date
        self.meter_number = meter_number
        self.meter_installed_date = meter_installed_date
        self.meter_type = meter_type
        self.billing_cycle = billing_cycle
        self.tariff_category = tariff_category
        self.security_deposit = security_deposit
        self.connection_fee = connection_fee
    
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
    
    def get_latest_meter_reading(self):
        """Get the latest meter reading"""
        return WaterMeterReading.query.filter_by(
            connection_id=self.id
        ).order_by(WaterMeterReading.reading_date.desc()).first()
    
    def calculate_bill(self, start_date, end_date):
        """Calculate water bill for a period"""
        # Get meter readings for the period
        start_reading = WaterMeterReading.query.filter(
            WaterMeterReading.connection_id == self.id,
            WaterMeterReading.reading_date <= start_date
        ).order_by(WaterMeterReading.reading_date.desc()).first()
        
        end_reading = WaterMeterReading.query.filter(
            WaterMeterReading.connection_id == self.id,
            WaterMeterReading.reading_date >= start_date,
            WaterMeterReading.reading_date <= end_date
        ).order_by(WaterMeterReading.reading_date.desc()).first()
        
        if not start_reading or not end_reading:
            return None
        
        # Calculate consumption
        consumption = end_reading.reading_value - start_reading.reading_value
        
        # Calculate bill based on tariff (simplified)
        # In a real system, this would be more complex with slabs
        if self.tariff_category == 'Domestic':
            rate_per_unit = 4.0  # Rs. 4 per unit (1000 liters)
        elif self.tariff_category == 'Commercial':
            rate_per_unit = 15.0  # Rs. 15 per unit
        else:  # Industrial
            rate_per_unit = 25.0  # Rs. 25 per unit
        
        bill_amount = consumption * rate_per_unit
        
        return {
            'start_reading': start_reading.reading_value,
            'end_reading': end_reading.reading_value,
            'consumption': consumption,
            'rate_per_unit': rate_per_unit,
            'bill_amount': bill_amount
        }
    
    def update_status(self, status):
        """Update connection status"""
        self.status = status
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'connection_number': self.connection_number,
            'consumer_details': {
                'consumer_name': self.consumer_name,
                'consumer_type': self.consumer_type,
                'consumer_id': str(self.consumer_id),
                'consumer_name': self.consumer.full_name() if self.consumer else None
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
            'connection_details': {
                'connection_type': self.connection_type,
                'pipe_size': self.pipe_size,
                'connection_date': self.connection_date.isoformat() if self.connection_date else None
            },
            'meter_details': {
                'meter_number': self.meter_number,
                'meter_installed_date': self.meter_installed_date.isoformat() if self.meter_installed_date else None,
                'meter_type': self.meter_type,
                'meter_status': self.meter_status
            },
            'billing_details': {
                'billing_cycle': self.billing_cycle,
                'tariff_category': self.tariff_category,
                'security_deposit': self.security_deposit,
                'connection_fee': self.connection_fee
            },
            'status': self.status,
            'latest_reading': self.get_latest_meter_reading().to_dict() if self.get_latest_meter_reading() else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def __repr__(self):
        return f'<WaterConnection {self.connection_number}>'