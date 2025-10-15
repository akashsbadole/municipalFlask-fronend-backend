from datetime import datetime
import uuid
from extensions import db
from models.user import User

class PublicNotice(db.Model):
    __tablename__ = 'public_notices'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=False)
    notice_type = db.Column(db.String(50), nullable=False)  # General, Tender, Event, etc.
    priority = db.Column(db.String(20), default='Normal')  # High, Medium, Normal
    publication_date = db.Column(db.Date, nullable=False, default=datetime.utcnow().date)
    expiry_date = db.Column(db.Date)
    attachment_url = db.Column(db.String(500))
    status = db.Column(db.String(20), default='Active')  # Active, Expired, Archived
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    creator = db.relationship('User', backref='public_notices')
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'notice_type': self.notice_type,
            'priority': self.priority,
            'publication_date': self.publication_date.isoformat() if self.publication_date else None,
            'expiry_date': self.expiry_date.isoformat() if self.expiry_date else None,
            'attachment_url': self.attachment_url,
            'status': self.status,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'creator_name': self.creator.first_name + ' ' + self.creator.last_name if self.creator else None
        }
    
    def __repr__(self):
        return f'<PublicNotice {self.title}>'