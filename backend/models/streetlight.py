from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from models.base import BaseModel

class Streetlight(BaseModel):
    __tablename__ = 'streetlights'
    
    pole_number = Column(String(50), unique=True, nullable=False, index=True)
    location = Column(String(255), nullable=False)
    ward = Column(String(50), nullable=False, index=True)
    street = Column(String(255), nullable=False)
    latitude = Column(Float)
    longitude = Column(Float)
    light_type = Column(String(50), nullable=False)  # led, sodium_vapor, metal_halide, etc.
    wattage = Column(Integer, nullable=False)
    status = Column(String(50), nullable=False, default='working', index=True)  # working, not_working, maintenance_required, under_repair
    installation_date = Column(DateTime, nullable=False)
    last_maintenance_date = Column(DateTime)
    next_maintenance_date = Column(DateTime)
    maintenance_interval = Column(Integer, default=180)  # days
    energy_consumption = Column(Float)  # kWh per month
    reported_issues = Column(Integer, default=0)
    
    # Relationships
    maintenance_records = relationship("StreetlightMaintenance", back_populates="streetlight", cascade="all, delete-orphan")
    issues = relationship("StreetlightIssue", back_populates="streetlight", cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            'id': self.id,
            'pole_number': self.pole_number,
            'location': self.location,
            'ward': self.ward,
            'street': self.street,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'light_type': self.light_type,
            'wattage': self.wattage,
            'status': self.status,
            'installation_date': self.installation_date.isoformat() if self.installation_date else None,
            'last_maintenance_date': self.last_maintenance_date.isoformat() if self.last_maintenance_date else None,
            'next_maintenance_date': self.next_maintenance_date.isoformat() if self.next_maintenance_date else None,
            'maintenance_interval': self.maintenance_interval,
            'energy_consumption': self.energy_consumption,
            'reported_issues': self.reported_issues,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def calculate_next_maintenance(self):
        """Calculate the next maintenance date based on the last maintenance date and interval"""
        if self.last_maintenance_date:
            from datetime import timedelta
            self.next_maintenance_date = self.last_maintenance_date + timedelta(days=self.maintenance_interval)
        return self.next_maintenance_date


class StreetlightMaintenance(BaseModel):
    __tablename__ = 'streetlight_maintenance'
    
    streetlight_id = Column(String, ForeignKey('streetlights.id'), nullable=False)
    maintenance_type = Column(String(50), nullable=False)  # routine, repair, replacement, inspection, cleaning
    description = Column(Text)
    performed_by = Column(String(255), nullable=False)
    performed_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    cost = Column(Float, default=0.0)
    parts_used = Column(Text)
    next_maintenance_date = Column(DateTime)
    
    # Relationships
    streetlight = relationship("Streetlight", back_populates="maintenance_records")
    
    def to_dict(self):
        return {
            'id': self.id,
            'streetlight_id': self.streetlight_id,
            'maintenance_type': self.maintenance_type,
            'description': self.description,
            'performed_by': self.performed_by,
            'performed_at': self.performed_at.isoformat() if self.performed_at else None,
            'cost': self.cost,
            'parts_used': self.parts_used,
            'next_maintenance_date': self.next_maintenance_date.isoformat() if self.next_maintenance_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class StreetlightIssue(BaseModel):
    __tablename__ = 'streetlight_issues'
    
    streetlight_id = Column(String, ForeignKey('streetlights.id'), nullable=False)
    reported_by = Column(String(255), nullable=False)
    issue_type = Column(String(50), nullable=False)  # not_working, flickering, dim_light, physical_damage, wiring_issue, other
    description = Column(Text, nullable=False)
    status = Column(String(50), nullable=False, default='reported', index=True)  # reported, in_progress, resolved, closed
    reported_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    resolved_at = Column(DateTime)
    resolution_notes = Column(Text)
    
    # Relationships
    streetlight = relationship("Streetlight", back_populates="issues")
    
    def to_dict(self):
        return {
            'id': self.id,
            'streetlight_id': self.streetlight_id,
            'reported_by': self.reported_by,
            'issue_type': self.issue_type,
            'description': self.description,
            'status': self.status,
            'reported_at': self.reported_at.isoformat() if self.reported_at else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'resolution_notes': self.resolution_notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }