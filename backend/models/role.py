from datetime import datetime
from extensions import db
from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID, ARRAY
import uuid

class Role(db.Model):
    __tablename__ = 'roles'
    
    id = db.Column(String(36), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.Text)
    permissions = db.Column(db.JSON, default=[])
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __init__(self, name, description=None, permissions=None):
        self.name = name
        self.description = description
        if permissions:
            self.permissions = permissions
        else:
            self.permissions = []
    
    def add_permission(self, permission):
        if permission not in self.permissions:
            self.permissions.append(permission)
    
    def remove_permission(self, permission):
        if permission in self.permissions:
            self.permissions.remove(permission)
    
    def has_permission(self, permission):
        return permission in self.permissions
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'name': self.name,
            'description': self.description,
            'permissions': self.permissions,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat()
        }
    
    @staticmethod
    def get_default_roles():
        return [
            {
                'name': 'Super Admin',
                'description': 'Full system access with all permissions',
                'permissions': [
                    'user.create', 'user.read', 'user.update', 'user.delete',
                    'citizen.create', 'citizen.read', 'citizen.update', 'citizen.delete',
                    'property.create', 'property.read', 'property.update', 'property.delete',
                    'complaint.create', 'complaint.read', 'complaint.update', 'complaint.delete',
                    'license.create', 'license.read', 'license.update', 'license.delete',
                    'building.create', 'building.read', 'building.update', 'building.delete',
                    'waste.create', 'waste.read', 'waste.update', 'waste.delete',
                    'water.create', 'water.read', 'water.update', 'water.delete',
                    'streetlight.create', 'streetlight.read', 'streetlight.update', 'streetlight.delete',
                    'health.create', 'health.read', 'health.update', 'health.delete',
                    'finance.create', 'finance.read', 'finance.update', 'finance.delete',
                    'hr.create', 'hr.read', 'hr.update', 'hr.delete',
                    'public_works.create', 'public_works.read', 'public_works.update', 'public_works.delete',
                    'egov.create', 'egov.read', 'egov.update', 'egov.delete',
                    'disaster.create', 'disaster.read', 'disaster.update', 'disaster.delete',
                    'reports.create', 'reports.read', 'reports.update', 'reports.delete'
                ]
            },
            {
                'name': 'Municipal Commissioner',
                'description': 'Head of municipal corporation with oversight on all departments',
                'permissions': [
                    'user.read', 'user.update',
                    'citizen.read', 'citizen.update',
                    'property.read', 'property.update',
                    'complaint.read', 'complaint.update',
                    'license.read', 'license.update',
                    'building.read', 'building.update',
                    'waste.read', 'waste.update',
                    'water.read', 'water.update',
                    'streetlight.read', 'streetlight.update',
                    'health.read', 'health.update',
                    'finance.read', 'finance.update',
                    'hr.read', 'hr.update',
                    'public_works.read', 'public_works.update',
                    'egov.read', 'egov.update',
                    'disaster.read', 'disaster.update',
                    'reports.read', 'reports.create'
                ]
            },
            {
                'name': 'Department Head',
                'description': 'Head of a specific department with department-specific permissions',
                'permissions': [
                    'user.read',
                    'citizen.read', 'citizen.update',
                    'complaint.read', 'complaint.update',
                    'reports.read', 'reports.create'
                ]
            },
            {
                'name': 'Field Officer',
                'description': 'Officer responsible for field operations and inspections',
                'permissions': [
                    'citizen.read',
                    'complaint.create', 'complaint.read', 'complaint.update',
                    'property.read',
                    'license.read',
                    'building.read',
                    'waste.read', 'waste.update',
                    'water.read', 'water.update',
                    'streetlight.read', 'streetlight.update',
                    'health.read', 'health.update',
                    'public_works.read'
                ]
            },
            {
                'name': 'Citizen',
                'description': 'Regular citizen with access to citizen services',
                'permissions': [
                    'complaint.create', 'complaint.read',
                    'property.read',
                    'license.create', 'license.read',
                    'building.create', 'building.read',
                    'water.read',
                    'egov.read',
                    'reports.read'
                ]
            }
        ]
    
    def __repr__(self):
        return f'<Role {self.name}>'