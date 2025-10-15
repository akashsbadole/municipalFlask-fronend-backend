from datetime import datetime
from extensions import db
from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID
import uuid

class StreetlightMaintenance(db.Model):
    __tablename__ = 'streetlight_maintenance'
    
    id = db.Column(String(36), primary_key=True, default=uuid.uuid4)
    maintenance_id = db.Column(db.String(20), unique=True, nullable=False)
    
    # Maintenance details
    maintenance_date = db.Column(db.Date, nullable=False)
    maintenance_type = db.Column(db.String(30), nullable=False)  # Repair, Replacement, Cleaning, Inspection
    work_description = db.Column(db.Text, nullable=False)
    
    # Parts and materials
    parts_used = db.Column(db.Text)
    material_cost = db.Column(db.Float, default=0.0)
    labor_cost = db.Column(db.Float, default=0.0)
    total_cost = db.Column(db.Float, default=0.0)
    
    # Status
    status = db.Column(db.String(20), default='Completed')  # Scheduled, In Progress, Completed
    
    # Technician details
    technician_name = db.Column(db.String(100))
    technician_id = db.Column(String(36), db.ForeignKey('users.id'))
    
    # Status and timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign keys
    streetlight_id = db.Column(String(36), db.ForeignKey('streetlights.id'), nullable=False)
    
    # Relationships
    technician = db.relationship('User', backref='streetlight_maintenance')
    
    def __init__(self, maintenance_id, maintenance_date, maintenance_type, work_description,
                 streetlight_id, parts_used=None, material_cost=0.0, labor_cost=0.0,
                 status='Completed', technician_name=None, technician_id=None):
        self.maintenance_id = maintenance_id
        self.maintenance_date = maintenance_date
        self.maintenance_type = maintenance_type
        self.work_description = work_description
        self.streetlight_id = streetlight_id
        self.parts_used = parts_used
        self.material_cost = material_cost
        self.labor_cost = labor_cost
        self.total_cost = material_cost + labor_cost
        self.status = status
        self.technician_name = technician_name
        self.technician_id = technician_id
    
    def update_status(self, status):
        """Update maintenance status"""
        self.status = status
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def update_costs(self, material_cost, labor_cost):
        """Update maintenance costs"""
        self.material_cost = material_cost
        self.labor_cost = labor_cost
        self.total_cost = material_cost + labor_cost
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'maintenance_id': self.maintenance_id,
            'maintenance_details': {
                'maintenance_date': self.maintenance_date.isoformat() if self.maintenance_date else None,
                'maintenance_type': self.maintenance_type,
                'work_description': self.work_description
            },
            'costs': {
                'parts_used': self.parts_used,
                'material_cost': self.material_cost,
                'labor_cost': self.labor_cost,
                'total_cost': self.total_cost
            },
            'status': self.status,
            'technician': {
                'technician_name': self.technician_name,
                'technician_id': self.technician_id
            },
            'streetlight': {
                'id': str(self.streetlight_id),
                'light_id': self.streetlight.light_id if self.streetlight else None
            },
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def __repr__(self):
        return f'<StreetlightMaintenance {self.maintenance_id}>'