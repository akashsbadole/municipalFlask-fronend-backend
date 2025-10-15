from datetime import datetime
import uuid
from extensions import db

class Project(db.Model):
    __tablename__ = 'public_works_projects'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_code = db.Column(db.String(20), unique=True, nullable=False, index=True)
    
    # Basic Information
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    project_type = db.Column(db.String(50), nullable=False)  # Road, Bridge, Building, Park, etc.
    category = db.Column(db.String(50), nullable=False)  # New Construction, Maintenance, Renovation
    
    # Location Details
    ward = db.Column(db.String(50), nullable=False)
    zone = db.Column(db.String(50), nullable=False)
    address = db.Column(db.Text, nullable=False)
    latitude = db.Column(db.Numeric(10, 8))
    longitude = db.Column(db.Numeric(11, 8))
    
    # Project Details
    estimated_cost = db.Column(db.Numeric(15, 2), nullable=False)
    actual_cost = db.Column(db.Numeric(15, 2))
    start_date = db.Column(db.Date, nullable=False)
    planned_end_date = db.Column(db.Date, nullable=False)
    actual_end_date = db.Column(db.Date)
    
    # Status and Progress
    status = db.Column(db.String(20), nullable=False, default='Planning')  # Planning, Tender, In Progress, Completed, Delayed, Cancelled
    progress_percentage = db.Column(db.Numeric(5, 2), default=0)
    
    # Contractor Information
    contractor_name = db.Column(db.String(200))
    contractor_contact = db.Column(db.String(20))
    contractor_email = db.Column(db.String(120))
    
    # Department and Officials
    department = db.Column(db.String(100), nullable=False)
    project_manager = db.Column(db.String(100))
    engineer_in_charge = db.Column(db.String(100))
    
    # System Fields
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    
    # Relationships
    tenders = db.relationship('PublicWorksTender', backref='project', lazy='dynamic', cascade='all, delete-orphan')
    milestones = db.relationship('ProjectMilestone', backref='project', lazy='dynamic', cascade='all, delete-orphan')
    documents = db.relationship('ProjectDocument', backref='project', lazy='dynamic', cascade='all, delete-orphan')
    inspections = db.relationship('ProjectInspection', backref='project', lazy='dynamic', cascade='all, delete-orphan')
    expenses = db.relationship('ProjectExpense', backref='project', lazy='dynamic', cascade='all, delete-orphan')
    
    @property
    def is_delayed(self):
        if self.actual_end_date:
            return self.actual_end_date > self.planned_end_date
        elif self.status in ['In Progress']:
            return datetime.now().date() > self.planned_end_date
        return False
    
    @property
    def duration_days(self):
        start = self.start_date
        end = self.actual_end_date or self.planned_end_date
        return (end - start).days if start and end else 0
    
    def to_dict(self):
        return {
            'id': self.id,
            'project_code': self.project_code,
            'title': self.title,
            'description': self.description,
            'project_type': self.project_type,
            'category': self.category,
            'ward': self.ward,
            'zone': self.zone,
            'address': self.address,
            'latitude': float(self.latitude) if self.latitude else None,
            'longitude': float(self.longitude) if self.longitude else None,
            'estimated_cost': float(self.estimated_cost) if self.estimated_cost else 0,
            'actual_cost': float(self.actual_cost) if self.actual_cost else 0,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'planned_end_date': self.planned_end_date.isoformat() if self.planned_end_date else None,
            'actual_end_date': self.actual_end_date.isoformat() if self.actual_end_date else None,
            'status': self.status,
            'progress_percentage': float(self.progress_percentage) if self.progress_percentage else 0,
            'contractor_name': self.contractor_name,
            'contractor_contact': self.contractor_contact,
            'contractor_email': self.contractor_email,
            'department': self.department,
            'project_manager': self.project_manager,
            'engineer_in_charge': self.engineer_in_charge,
            'is_delayed': self.is_delayed,
            'duration_days': self.duration_days,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class PublicWorksTender(db.Model):
    __tablename__ = 'public_works_tenders'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = db.Column(db.String(36), db.ForeignKey('public_works_projects.id'), nullable=False)
    
    # Tender Information
    tender_number = db.Column(db.String(50), unique=True, nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    
    # Dates
    publication_date = db.Column(db.Date, nullable=False)
    submission_start_date = db.Column(db.Date, nullable=False)
    submission_end_date = db.Column(db.Date, nullable=False)
    opening_date = db.Column(db.Date, nullable=False)
    
    # Financial Details
    estimated_cost = db.Column(db.Numeric(15, 2), nullable=False)
    earnest_money_deposit = db.Column(db.Numeric(15, 2), nullable=False)
    
    # Status
    status = db.Column(db.String(20), nullable=False, default='Published')  # Published, Closed, Awarded, Cancelled
    
    # Award Details
    awarded_to = db.Column(db.String(200))
    awarded_amount = db.Column(db.Numeric(15, 2))
    awarded_date = db.Column(db.Date)
    
    # System Fields
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    
    # Relationships
    bidders = db.relationship('TenderBidder', backref='tender', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'tender_number': self.tender_number,
            'title': self.title,
            'description': self.description,
            'publication_date': self.publication_date.isoformat() if self.publication_date else None,
            'submission_start_date': self.submission_start_date.isoformat() if self.submission_start_date else None,
            'submission_end_date': self.submission_end_date.isoformat() if self.submission_end_date else None,
            'opening_date': self.opening_date.isoformat() if self.opening_date else None,
            'estimated_cost': float(self.estimated_cost) if self.estimated_cost else 0,
            'earnest_money_deposit': float(self.earnest_money_deposit) if self.earnest_money_deposit else 0,
            'status': self.status,
            'awarded_to': self.awarded_to,
            'awarded_amount': float(self.awarded_amount) if self.awarded_amount else 0,
            'awarded_date': self.awarded_date.isoformat() if self.awarded_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class TenderBidder(db.Model):
    __tablename__ = 'public_works_tender_bidders'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tender_id = db.Column(db.String(36), db.ForeignKey('public_works_tenders.id'), nullable=False)
    
    # Bidder Information
    company_name = db.Column(db.String(200), nullable=False)
    contact_person = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    address = db.Column(db.Text, nullable=False)
    
    # Financial Details
    bid_amount = db.Column(db.Numeric(15, 2), nullable=False)
    
    # Status
    status = db.Column(db.String(20), nullable=False, default='Submitted')  # Submitted, Qualified, Disqualified, Selected, Rejected
    
    # Documents
    technical_bid = db.Column(db.String(255))  # File path
    financial_bid = db.Column(db.String(255))  # File path
    
    # System Fields
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'tender_id': self.tender_id,
            'company_name': self.company_name,
            'contact_person': self.contact_person,
            'email': self.email,
            'phone': self.phone,
            'address': self.address,
            'bid_amount': float(self.bid_amount) if self.bid_amount else 0,
            'status': self.status,
            'technical_bid': self.technical_bid,
            'financial_bid': self.financial_bid,
            'submitted_at': self.submitted_at.isoformat() if self.submitted_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class ProjectMilestone(db.Model):
    __tablename__ = 'public_works_milestones'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = db.Column(db.String(36), db.ForeignKey('public_works_projects.id'), nullable=False)
    
    # Milestone Information
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    
    # Dates
    planned_date = db.Column(db.Date, nullable=False)
    actual_date = db.Column(db.Date)
    
    # Status
    status = db.Column(db.String(20), nullable=False, default='Pending')  # Pending, In Progress, Completed, Delayed
    
    # Progress
    progress_percentage = db.Column(db.Numeric(5, 2), default=0)
    
    # System Fields
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'title': self.title,
            'description': self.description,
            'planned_date': self.planned_date.isoformat() if self.planned_date else None,
            'actual_date': self.actual_date.isoformat() if self.actual_date else None,
            'status': self.status,
            'progress_percentage': float(self.progress_percentage) if self.progress_percentage else 0,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class ProjectDocument(db.Model):
    __tablename__ = 'public_works_documents'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = db.Column(db.String(36), db.ForeignKey('public_works_projects.id'), nullable=False)
    
    # Document Information
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    document_type = db.Column(db.String(50), nullable=False)  # Plan, Approval, Agreement, Photo, Report, etc.
    
    # File Information
    file_name = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(255), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)
    file_type = db.Column(db.String(100), nullable=False)
    
    # System Fields
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'title': self.title,
            'description': self.description,
            'document_type': self.document_type,
            'file_name': self.file_name,
            'file_path': self.file_path,
            'file_size': self.file_size,
            'file_type': self.file_type,
            'uploaded_at': self.uploaded_at.isoformat() if self.uploaded_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class ProjectInspection(db.Model):
    __tablename__ = 'public_works_inspections'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = db.Column(db.String(36), db.ForeignKey('public_works_projects.id'), nullable=False)
    
    # Inspection Information
    title = db.Column(db.String(200), nullable=False)
    inspection_date = db.Column(db.Date, nullable=False)
    inspector_name = db.Column(db.String(100), nullable=False)
    inspector_designation = db.Column(db.String(100), nullable=False)
    
    # Findings
    findings = db.Column(db.Text, nullable=False)
    compliance_status = db.Column(db.String(20), nullable=False)  # Compliant, Non-Compliant, Partially Compliant
    
    # Actions Required
    actions_required = db.Column(db.Text)
    follow_up_date = db.Column(db.Date)
    
    # System Fields
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'title': self.title,
            'inspection_date': self.inspection_date.isoformat() if self.inspection_date else None,
            'inspector_name': self.inspector_name,
            'inspector_designation': self.inspector_designation,
            'findings': self.findings,
            'compliance_status': self.compliance_status,
            'actions_required': self.actions_required,
            'follow_up_date': self.follow_up_date.isoformat() if self.follow_up_date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class ProjectExpense(db.Model):
    __tablename__ = 'public_works_expenses'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = db.Column(db.String(36), db.ForeignKey('public_works_projects.id'), nullable=False)
    
    # Expense Information
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(50), nullable=False)  # Labor, Materials, Equipment, etc.
    amount = db.Column(db.Numeric(15, 2), nullable=False)
    expense_date = db.Column(db.Date, nullable=False)
    
    # Vendor Information
    vendor_name = db.Column(db.String(200), nullable=False)
    invoice_number = db.Column(db.String(100))
    receipt_url = db.Column(db.String(255))
    
    # Approval
    approved_by = db.Column(db.String(36), db.ForeignKey('users.id'))
    approved_date = db.Column(db.DateTime)
    status = db.Column(db.String(20), nullable=False, default='Pending')  # Pending, Approved, Rejected
    
    # System Fields
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'title': self.title,
            'description': self.description,
            'category': self.category,
            'amount': float(self.amount) if self.amount else 0,
            'expense_date': self.expense_date.isoformat() if self.expense_date else None,
            'vendor_name': self.vendor_name,
            'invoice_number': self.invoice_number,
            'receipt_url': self.receipt_url,
            'approved_by': self.approved_by,
            'approved_date': self.approved_date.isoformat() if self.approved_date else None,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }