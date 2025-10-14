from datetime import datetime
from app import db
from sqlalchemy.dialects.postgresql import UUID
import uuid

class BuildingPlan(db.Model):
    __tablename__ = 'building_plans'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_number = db.Column(db.String(20), unique=True, nullable=False)
    
    # Property details
    property_id = db.Column(UUID(as_uuid=True), db.ForeignKey('properties.id'))
    plot_number = db.Column(db.String(20))
    area = db.Column(db.String(50), nullable=False)
    ward_number = db.Column(db.String(10), nullable=False)
    
    # Plan details
    building_type = db.Column(db.String(50), nullable=False)
    number_of_floors = db.Column(db.Integer, nullable=False)
    total_built_up_area = db.Column(db.Float, nullable=False)
    ground_floor_area = db.Column(db.Float)
    first_floor_area = db.Column(db.Float)
    second_floor_area = db.Column(db.Float)
    
    # Technical details
    architect_name = db.Column(db.String(100))
    architect_license = db.Column(db.String(20))
    engineer_name = db.Column(db.String(100))
    engineer_license = db.Column(db.String(20))
    
    # Documents
    plan_document_path = db.Column(db.String(255))
    ownership_document_path = db.Column(db.String(255))
    other_documents_path = db.Column(db.String(255))
    
    # Compliance checks
    fsi_compliance = db.Column(db.String(20), default='Pending')  # Pending, Compliant, Non-compliant
    setback_compliance = db.Column(db.String(20), default='Pending')
    parking_compliance = db.Column(db.String(20), default='Pending')
    height_compliance = db.Column(db.String(20), default='Pending')
    
    # Workflow and status
    status = db.Column(db.String(20), default='Submitted')  # Submitted, Under Review, Approved, Rejected
    current_approval_level = db.Column(db.Integer, default=1)  # 1: Junior Engineer, 2: Assistant Engineer, etc.
    fee_paid = db.Column(db.Float, default=0.0)
    fee_amount = db.Column(db.Float, nullable=False)
    payment_status = db.Column(db.String(20), default='Pending')
    
    # Approval details
    je_approved = db.Column(db.Boolean, default=False)
    je_approval_date = db.Column(db.DateTime)
    je_approved_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    je_remarks = db.Column(db.Text)
    
    ae_approved = db.Column(db.Boolean, default=False)
    ae_approval_date = db.Column(db.DateTime)
    ae_approved_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    ae_remarks = db.Column(db.Text)
    
    tp_approved = db.Column(db.Boolean, default=False)
    tp_approval_date = db.Column(db.DateTime)
    tp_approved_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    tp_remarks = db.Column(db.Text)
    
    commissioner_approved = db.Column(db.Boolean, default=False)
    commissioner_approval_date = db.Column(db.DateTime)
    commissioner_approved_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    commissioner_remarks = db.Column(db.Text)
    
    # Rejection details
    rejection_reason = db.Column(db.Text)
    rejected_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    rejection_date = db.Column(db.DateTime)
    
    # Status and timestamps
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign keys
    applicant_id = db.Column(UUID(as_uuid=True), db.ForeignKey('citizens.id'), nullable=False)
    
    # Relationships
    property = db.relationship('Property', backref='building_plans')
    applicant = db.relationship('Citizen', backref='building_plans')
    je_approver = db.relationship('User', foreign_keys=[je_approved_by], backref='je_approved_plans')
    ae_approver = db.relationship('User', foreign_keys=[ae_approved_by], backref='ae_approved_plans')
    tp_approver = db.relationship('User', foreign_keys=[tp_approved_by], backref='tp_approved_plans')
    commissioner_approver = db.relationship('User', foreign_keys=[commissioner_approved_by], backref='commissioner_approved_plans')
    rejecter = db.relationship('User', foreign_keys=[rejected_by], backref='rejected_plans')
    
    def __init__(self, application_number, area, ward_number, building_type, number_of_floors, 
                 total_built_up_area, fee_amount, applicant_id, property_id=None, plot_number=None,
                 ground_floor_area=None, first_floor_area=None, second_floor_area=None,
                 architect_name=None, architect_license=None, engineer_name=None, engineer_license=None,
                 plan_document_path=None, ownership_document_path=None, other_documents_path=None):
        self.application_number = application_number
        self.area = area
        self.ward_number = ward_number
        self.building_type = building_type
        self.number_of_floors = number_of_floors
        self.total_built_up_area = total_built_up_area
        self.fee_amount = fee_amount
        self.applicant_id = applicant_id
        self.property_id = property_id
        self.plot_number = plot_number
        self.ground_floor_area = ground_floor_area
        self.first_floor_area = first_floor_area
        self.second_floor_area = second_floor_area
        self.architect_name = architect_name
        self.architect_license = architect_license
        self.engineer_name = engineer_name
        self.engineer_license = engineer_license
        self.plan_document_path = plan_document_path
        self.ownership_document_path = ownership_document_path
        self.other_documents_path = other_documents_path
    
    def make_payment(self, amount):
        """Process application fee payment"""
        if amount <= 0:
            return False, "Payment amount must be positive"
        
        if amount > (self.fee_amount - self.fee_paid):
            return False, "Payment amount exceeds due amount"
        
        self.fee_paid += amount
        
        if self.fee_paid >= self.fee_amount:
            self.payment_status = 'Paid'
        else:
            self.payment_status = 'Partial'
        
        self.updated_at = datetime.utcnow()
        db.session.commit()
        return True, "Payment processed successfully"
    
    def approve_at_level(self, level, user_id, remarks=None):
        """Approve building plan at a specific level"""
        if level == 1:  # Junior Engineer
            self.je_approved = True
            self.je_approval_date = datetime.utcnow()
            self.je_approved_by = user_id
            self.je_remarks = remarks
            self.current_approval_level = 2
        elif level == 2:  # Assistant Engineer
            self.ae_approved = True
            self.ae_approval_date = datetime.utcnow()
            self.ae_approved_by = user_id
            self.ae_remarks = remarks
            self.current_approval_level = 3
        elif level == 3:  # Town Planner
            self.tp_approved = True
            self.tp_approval_date = datetime.utcnow()
            self.tp_approved_by = user_id
            self.tp_remarks = remarks
            self.current_approval_level = 4
        elif level == 4:  # Commissioner
            self.commissioner_approved = True
            self.commissioner_approval_date = datetime.utcnow()
            self.commissioner_approved_by = user_id
            self.commissioner_remarks = remarks
            self.status = 'Approved'
        
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def reject(self, user_id, reason):
        """Reject building plan application"""
        self.status = 'Rejected'
        self.rejection_reason = reason
        self.rejected_by = user_id
        self.rejection_date = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def update_compliance(self, fsi, setback, parking, height):
        """Update compliance checks"""
        self.fsi_compliance = fsi
        self.setback_compliance = setback
        self.parking_compliance = parking
        self.height_compliance = height
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'application_number': self.application_number,
            'property_details': {
                'property_id': str(self.property_id) if self.property_id else None,
                'plot_number': self.plot_number,
                'area': self.area,
                'ward_number': self.ward_number
            },
            'building_details': {
                'building_type': self.building_type,
                'number_of_floors': self.number_of_floors,
                'total_built_up_area': self.total_built_up_area,
                'ground_floor_area': self.ground_floor_area,
                'first_floor_area': self.first_floor_area,
                'second_floor_area': self.second_floor_area
            },
            'technical_details': {
                'architect_name': self.architect_name,
                'architect_license': self.architect_license,
                'engineer_name': self.engineer_name,
                'engineer_license': self.engineer_license
            },
            'documents': {
                'plan_document_path': self.plan_document_path,
                'ownership_document_path': self.ownership_document_path,
                'other_documents_path': self.other_documents_path
            },
            'compliance': {
                'fsi_compliance': self.fsi_compliance,
                'setback_compliance': self.setback_compliance,
                'parking_compliance': self.parking_compliance,
                'height_compliance': self.height_compliance
            },
            'workflow': {
                'status': self.status,
                'current_approval_level': self.current_approval_level,
                'fee_amount': self.fee_amount,
                'fee_paid': self.fee_paid,
                'payment_status': self.payment_status
            },
            'approvals': {
                'je_approved': self.je_approved,
                'je_approval_date': self.je_approval_date.isoformat() if self.je_approval_date else None,
                'je_approved_by': self.je_approved_by,
                'je_remarks': self.je_remarks,
                'ae_approved': self.ae_approved,
                'ae_approval_date': self.ae_approval_date.isoformat() if self.ae_approval_date else None,
                'ae_approved_by': self.ae_approved_by,
                'ae_remarks': self.ae_remarks,
                'tp_approved': self.tp_approved,
                'tp_approval_date': self.tp_approval_date.isoformat() if self.tp_approval_date else None,
                'tp_approved_by': self.tp_approved_by,
                'tp_remarks': self.tp_remarks,
                'commissioner_approved': self.commissioner_approved,
                'commissioner_approval_date': self.commissioner_approval_date.isoformat() if self.commissioner_approval_date else None,
                'commissioner_approved_by': self.commissioner_approved_by,
                'commissioner_remarks': self.commissioner_remarks
            },
            'rejection': {
                'rejection_reason': self.rejection_reason,
                'rejected_by': self.rejected_by,
                'rejection_date': self.rejection_date.isoformat() if self.rejection_date else None
            },
            'applicant': {
                'id': str(self.applicant_id),
                'name': self.applicant.full_name() if self.applicant else None
            },
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def __repr__(self):
        return f'<BuildingPlan {self.application_number}>'