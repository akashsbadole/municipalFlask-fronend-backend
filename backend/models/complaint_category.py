from datetime import datetime
from extensions import db
from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID, ARRAY
import uuid

class ComplaintCategory(db.Model):
    __tablename__ = 'complaint_categories'
    
    id = db.Column(String(36), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    department = db.Column(db.String(50), nullable=False)
    priority = db.Column(db.String(20), default='Medium')  # Low, Medium, High, Critical
    resolution_time_hours = db.Column(db.Integer, default=48)  # Expected resolution time in hours
    
    # Escalation matrix
    escalation_matrix = db.Column(db.JSON)  # Roles to escalate to
    
    # Status and timestamps
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __init__(self, name, department, description=None, priority='Medium', 
                 resolution_time_hours=48, escalation_matrix=None):
        self.name = name
        self.department = department
        self.description = description
        self.priority = priority
        self.resolution_time_hours = resolution_time_hours
        if escalation_matrix:
            self.escalation_matrix = escalation_matrix
        else:
            self.escalation_matrix = []
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'name': self.name,
            'description': self.description,
            'department': self.department,
            'priority': self.priority,
            'resolution_time_hours': self.resolution_time_hours,
            'escalation_matrix': self.escalation_matrix,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat()
        }
    
    @staticmethod
    def get_default_categories():
        return [
            {
                'name': 'Street Light Issue',
                'department': 'Electrical',
                'priority': 'Medium',
                'resolution_time_hours': 48,
                'escalation_matrix': ['Field Officer', 'Department Head', 'Municipal Commissioner']
            },
            {
                'name': 'Water Supply Issue',
                'department': 'Water Supply',
                'priority': 'High',
                'resolution_time_hours': 24,
                'escalation_matrix': ['Field Officer', 'Department Head', 'Municipal Commissioner']
            },
            {
                'name': 'Garbage Collection',
                'department': 'Solid Waste Management',
                'priority': 'Medium',
                'resolution_time_hours': 24,
                'escalation_matrix': ['Field Officer', 'Department Head', 'Municipal Commissioner']
            },
            {
                'name': 'Drainage Blockage',
                'department': 'Water Supply',
                'priority': 'High',
                'resolution_time_hours': 12,
                'escalation_matrix': ['Field Officer', 'Department Head', 'Municipal Commissioner']
            },
            {
                'name': 'Road Damage',
                'department': 'Public Works',
                'priority': 'Medium',
                'resolution_time_hours': 72,
                'escalation_matrix': ['Field Officer', 'Department Head', 'Municipal Commissioner']
            },
            {
                'name': 'Illegal Construction',
                'department': 'Building Plan Approval',
                'priority': 'Critical',
                'resolution_time_hours': 48,
                'escalation_matrix': ['Field Officer', 'Department Head', 'Municipal Commissioner']
            },
            {
                'name': 'Noise Pollution',
                'department': 'Health & Sanitation',
                'priority': 'Medium',
                'resolution_time_hours': 24,
                'escalation_matrix': ['Field Officer', 'Department Head', 'Municipal Commissioner']
            },
            {
                'name': 'Mosquito Nuisance',
                'department': 'Health & Sanitation',
                'priority': 'High',
                'resolution_time_hours': 24,
                'escalation_matrix': ['Field Officer', 'Department Head', 'Municipal Commissioner']
            },
            {
                'name': 'Tree Removal',
                'department': 'Public Works',
                'priority': 'Low',
                'resolution_time_hours': 168,
                'escalation_matrix': ['Field Officer', 'Department Head', 'Municipal Commissioner']
            },
            {
                'name': 'Public Toilet Maintenance',
                'department': 'Health & Sanitation',
                'priority': 'Medium',
                'resolution_time_hours': 24,
                'escalation_matrix': ['Field Officer', 'Department Head', 'Municipal Commissioner']
            }
        ]
    
    def __repr__(self):
        return f'<ComplaintCategory {self.name}>'