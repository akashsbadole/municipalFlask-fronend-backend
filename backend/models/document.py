from datetime import datetime
import uuid
from app import db
from models.user import User

class Document(db.Model):
    __tablename__ = 'documents'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(100), nullable=False)  # Circular, Meeting Minute, Report, Policy, etc.
    document_type = db.Column(db.String(50), nullable=False)  # PDF, DOC, DOCX, XLS, XLSX, etc.
    file_name = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.Integer)  # in bytes
    department = db.Column(db.String(100), nullable=False)
    tags = db.Column(db.Text)  # Comma-separated tags
    is_public = db.Column(db.Boolean, default=False)  # Whether document is publicly accessible
    version = db.Column(db.Integer, default=1)
    parent_document_id = db.Column(db.String(36), db.ForeignKey('documents.id'))  # For versioning
    effective_date = db.Column(db.Date)
    expiry_date = db.Column(db.Date)
    status = db.Column(db.String(20), default='Active')  # Active, Archived, Deleted
    uploaded_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    approved_by = db.Column(db.String(36), db.ForeignKey('users.id'))
    approved_at = db.Column(db.DateTime)
    download_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    uploader = db.relationship('User', foreign_keys=[uploaded_by], backref='uploaded_documents')
    approver = db.relationship('User', foreign_keys=[approved_by], backref='approved_documents')
    parent_document = db.relationship('Document', remote_side=[id], backref='versions')
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'category': self.category,
            'document_type': self.document_type,
            'file_name': self.file_name,
            'file_path': self.file_path,
            'file_size': self.file_size,
            'department': self.department,
            'tags': self.tags.split(',') if self.tags else [],
            'is_public': self.is_public,
            'version': self.version,
            'parent_document_id': self.parent_document_id,
            'effective_date': self.effective_date.isoformat() if self.effective_date else None,
            'expiry_date': self.expiry_date.isoformat() if self.expiry_date else None,
            'status': self.status,
            'uploaded_by': self.uploaded_by,
            'approved_by': self.approved_by,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'download_count': self.download_count,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'uploader_name': self.uploader.first_name + ' ' + self.uploader.last_name if self.uploader else None,
            'approver_name': self.approver.first_name + ' ' + self.approver.last_name if self.approver else None
        }
    
    def increment_download_count(self):
        self.download_count += 1
        db.session.commit()
    
    def __repr__(self):
        return f'<Document {self.title}>'

class DocumentAccess(db.Model):
    __tablename__ = 'document_access'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = db.Column(db.String(36), db.ForeignKey('documents.id'), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    access_type = db.Column(db.String(20), default='View')  # View, Download, Edit
    granted_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    granted_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime)
    
    # Relationships
    document = db.relationship('Document', backref='access_permissions')
    user = db.relationship('User', foreign_keys=[user_id], backref='document_permissions')
    granter = db.relationship('User', foreign_keys=[granted_by], backref='granted_permissions')
    
    def to_dict(self):
        return {
            'id': self.id,
            'document_id': self.document_id,
            'user_id': self.user_id,
            'access_type': self.access_type,
            'granted_by': self.granted_by,
            'granted_at': self.granted_at.isoformat() if self.granted_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'document_title': self.document.title if self.document else None,
            'user_name': self.user.first_name + ' ' + self.user.last_name if self.user else None,
            'granter_name': self.granter.first_name + ' ' + self.granter.last_name if self.granter else None
        }
    
    def __repr__(self):
        return f'<DocumentAccess {self.document_id}:{self.user_id}>'