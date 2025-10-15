from datetime import datetime
from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID
import uuid
from extensions import db

class BaseModel(db.Model):
    """Base model class that provides common fields and functionality"""
    __abstract__ = True
    
    id = db.Column(String(36), primary_key=True, default=uuid.uuid4)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)