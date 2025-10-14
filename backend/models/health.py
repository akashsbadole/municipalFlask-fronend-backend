from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey, Boolean, Enum
from sqlalchemy.orm import relationship
from models.base import BaseModel
import enum

class InspectionType(enum.Enum):
    RESTAURANT = "restaurant"
    FOOD_STALL = "food_stall"
    HOSPITAL = "hospital"
    CLINIC = "clinic"
    SCHOOL = "school"
    WATER_SOURCE = "water_source"
    PUBLIC_POOL = "public_pool"
    GYM = "gym"
    BEAUTY_SALON = "beauty_salon"
    GENERAL = "general"

class InspectionStatus(enum.Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class ViolationSeverity(enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class HealthInspection(BaseModel):
    __tablename__ = 'health_inspections'
    
    establishment_id = Column(String, nullable=False, index=True)  # ID of the establishment being inspected
    establishment_name = Column(String(255), nullable=False)
    establishment_type = Column(Enum(InspectionType), nullable=False)
    establishment_address = Column(Text)
    contact_person = Column(String(255))
    contact_phone = Column(String(50))
    
    inspection_type = Column(String(100), nullable=False)  # routine, complaint_based, follow_up, special
    inspection_date = Column(DateTime, nullable=False)
    inspection_time = Column(String(50))  # e.g., "10:00 AM"
    duration_hours = Column(Float, default=2.0)
    
    inspector_id = Column(String, ForeignKey('users.id'), nullable=False)
    inspector_name = Column(String(255), nullable=False)
    
    status = Column(Enum(InspectionStatus), default=InspectionStatus.SCHEDULED, nullable=False, index=True)
    
    # Inspection results
    overall_score = Column(Integer)  # 0-100
    passed = Column(Boolean)
    total_violations = Column(Integer, default=0)
    
    # Follow-up information
    follow_up_required = Column(Boolean, default=False)
    follow_up_date = Column(DateTime)
    follow_up_notes = Column(Text)
    
    # Additional information
    notes = Column(Text)
    weather_conditions = Column(String(100))
    
    # Relationships
    inspector = relationship("User", backref="health_inspections")
    violations = relationship("HealthViolation", back_populates="inspection", cascade="all, delete-orphan")
    reports = relationship("HealthReport", back_populates="inspection", cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            'id': self.id,
            'establishment_id': self.establishment_id,
            'establishment_name': self.establishment_name,
            'establishment_type': self.establishment_type.value if self.establishment_type else None,
            'establishment_address': self.establishment_address,
            'contact_person': self.contact_person,
            'contact_phone': self.contact_phone,
            'inspection_type': self.inspection_type,
            'inspection_date': self.inspection_date.isoformat() if self.inspection_date else None,
            'inspection_time': self.inspection_time,
            'duration_hours': self.duration_hours,
            'inspector_id': self.inspector_id,
            'inspector_name': self.inspector_name,
            'status': self.status.value if self.status else None,
            'overall_score': self.overall_score,
            'passed': self.passed,
            'total_violations': self.total_violations,
            'follow_up_required': self.follow_up_required,
            'follow_up_date': self.follow_up_date.isoformat() if self.follow_up_date else None,
            'follow_up_notes': self.follow_up_notes,
            'notes': self.notes,
            'weather_conditions': self.weather_conditions,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class HealthViolation(BaseModel):
    __tablename__ = 'health_violations'
    
    inspection_id = Column(String, ForeignKey('health_inspections.id'), nullable=False)
    category = Column(String(100), nullable=False)  # hygiene, safety, documentation, structural, etc.
    description = Column(Text, nullable=False)
    severity = Column(Enum(ViolationSeverity), nullable=False)
    points_deducted = Column(Integer, default=0)
    
    # Violation status
    corrected = Column(Boolean, default=False)
    correction_date = Column(DateTime)
    correction_notes = Column(Text)
    
    # Photo evidence
    photo_path = Column(String(500))
    
    # Relationships
    inspection = relationship("HealthInspection", back_populates="violations")
    
    def to_dict(self):
        return {
            'id': self.id,
            'inspection_id': self.inspection_id,
            'category': self.category,
            'description': self.description,
            'severity': self.severity.value if self.severity else None,
            'points_deducted': self.points_deducted,
            'corrected': self.corrected,
            'correction_date': self.correction_date.isoformat() if self.correction_date else None,
            'correction_notes': self.correction_notes,
            'photo_path': self.photo_path,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class HealthReport(BaseModel):
    __tablename__ = 'health_reports'
    
    inspection_id = Column(String, ForeignKey('health_inspections.id'), nullable=False)
    report_type = Column(String(50), nullable=False)  # preliminary, final, follow_up
    
    # Report content
    summary = Column(Text)
    findings = Column(Text)
    recommendations = Column(Text)
    
    # Report details
    generated_by = Column(String, ForeignKey('users.id'), nullable=False)
    generated_at = Column(DateTime, default=datetime.utcnow)
    
    # File information
    file_path = Column(String(500))
    file_name = Column(String(255))
    file_size = Column(Integer)
    
    # Status
    status = Column(String(50), default='draft')  # draft, submitted, approved, rejected
    approved_by = Column(String, ForeignKey('users.id'))
    approved_at = Column(DateTime)
    
    # Relationships
    inspection = relationship("HealthInspection", back_populates="reports")
    generator = relationship("User", foreign_keys=[generated_by], backref="generated_health_reports")
    approver = relationship("User", foreign_keys=[approved_by], backref="approved_health_reports")
    
    def to_dict(self):
        return {
            'id': self.id,
            'inspection_id': self.inspection_id,
            'report_type': self.report_type,
            'summary': self.summary,
            'findings': self.findings,
            'recommendations': self.recommendations,
            'generated_by': self.generated_by,
            'generated_at': self.generated_at.isoformat() if self.generated_at else None,
            'file_path': self.file_path,
            'file_name': self.file_name,
            'file_size': self.file_size,
            'status': self.status,
            'approved_by': self.approved_by,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class HealthSchedule(BaseModel):
    __tablename__ = 'health_schedules'
    
    establishment_id = Column(String, nullable=False, index=True)
    establishment_name = Column(String(255), nullable=False)
    establishment_type = Column(Enum(InspectionType), nullable=False)
    establishment_address = Column(Text)
    
    # Schedule details
    inspection_frequency = Column(String(50), nullable=False)  # monthly, quarterly, semi_annual, annual
    next_inspection_date = Column(DateTime, nullable=False)
    last_inspection_date = Column(DateTime)
    
    # Risk assessment
    risk_level = Column(String(20), default='medium')  # low, medium, high
    priority_score = Column(Integer, default=50)  # 0-100
    
    # Assignment
    assigned_inspector_id = Column(String, ForeignKey('users.id'))
    assigned_inspector_name = Column(String(255))
    
    # Additional information
    notes = Column(Text)
    active = Column(Boolean, default=True)
    
    # Relationships
    inspector = relationship("User", backref="health_schedules")
    
    def to_dict(self):
        return {
            'id': self.id,
            'establishment_id': self.establishment_id,
            'establishment_name': self.establishment_name,
            'establishment_type': self.establishment_type.value if self.establishment_type else None,
            'establishment_address': self.establishment_address,
            'inspection_frequency': self.inspection_frequency,
            'next_inspection_date': self.next_inspection_date.isoformat() if self.next_inspection_date else None,
            'last_inspection_date': self.last_inspection_date.isoformat() if self.last_inspection_date else None,
            'risk_level': self.risk_level,
            'priority_score': self.priority_score,
            'assigned_inspector_id': self.assigned_inspector_id,
            'assigned_inspector_name': self.assigned_inspector_name,
            'notes': self.notes,
            'active': self.active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }