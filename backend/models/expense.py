from datetime import datetime
from extensions import db
from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID
import uuid

class Expense(db.Model):
    __tablename__ = 'expenses'
    
    id = db.Column(String(36), primary_key=True, default=uuid.uuid4)
    expense_id = db.Column(db.String(20), unique=True, nullable=False)
    
    # Expense details
    expense_date = db.Column(db.Date, nullable=False)
    expense_type = db.Column(db.String(50), nullable=False)
    expense_category = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text, nullable=False)
    
    # Financial details
    amount = db.Column(db.Float, nullable=False)
    payment_method = db.Column(db.String(30))  # Cash, Cheque, Bank Transfer, etc.
    transaction_reference = db.Column(db.String(50))
    
    # Vendor details
    vendor_name = db.Column(db.String(100))
    vendor_id = db.Column(String(36), db.ForeignKey('vendors.id'))
    invoice_number = db.Column(db.String(50))
    invoice_date = db.Column(db.Date)
    
    # Approval workflow
    status = db.Column(db.String(20), default='Pending')  # Pending, Approved, Rejected
    submitted_by = db.Column(String(36), db.ForeignKey('users.id'))
    submitted_date = db.Column(db.DateTime, default=datetime.utcnow)
    approved_by = db.Column(String(36), db.ForeignKey('users.id'))
    approval_date = db.Column(db.DateTime)
    rejection_reason = db.Column(db.Text)
    
    # Document
    document_path = db.Column(db.String(255))  # Path to uploaded invoice/receipt
    
    # Status and timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign keys
    budget_id = db.Column(String(36), db.ForeignKey('budgets.id'), nullable=False)
    
    # Relationships
    vendor = db.relationship('Vendor', backref='expenses')
    submitter = db.relationship('User', foreign_keys=[submitted_by], backref='submitted_expenses')
    approver = db.relationship('User', foreign_keys=[approved_by], backref='approved_expenses')
    
    def __init__(self, expense_id, expense_date, expense_type, expense_category, 
                 description, amount, budget_id, payment_method=None, transaction_reference=None,
                 vendor_name=None, vendor_id=None, invoice_number=None, invoice_date=None,
                 submitted_by=None, document_path=None):
        self.expense_id = expense_id
        self.expense_date = expense_date
        self.expense_type = expense_type
        self.expense_category = expense_category
        self.description = description
        self.amount = amount
        self.budget_id = budget_id
        self.payment_method = payment_method
        self.transaction_reference = transaction_reference
        self.vendor_name = vendor_name
        self.vendor_id = vendor_id
        self.invoice_number = invoice_number
        self.invoice_date = invoice_date
        self.submitted_by = submitted_by
        self.document_path = document_path
    
    def approve_expense(self, user_id):
        """Approve the expense"""
        self.status = 'Approved'
        self.approved_by = user_id
        self.approval_date = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        
        # Update budget utilization
        if self.budget:
            self.budget.add_expense(self.amount)
        
        db.session.commit()
    
    def reject_expense(self, user_id, reason):
        """Reject the expense"""
        self.status = 'Rejected'
        self.approved_by = user_id
        self.approval_date = datetime.utcnow()
        self.rejection_reason = reason
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'expense_id': self.expense_id,
            'expense_details': {
                'expense_date': self.expense_date.isoformat() if self.expense_date else None,
                'expense_type': self.expense_type,
                'expense_category': self.expense_category,
                'description': self.description
            },
            'financial_details': {
                'amount': self.amount,
                'payment_method': self.payment_method,
                'transaction_reference': self.transaction_reference
            },
            'vendor_details': {
                'vendor_name': self.vendor_name,
                'vendor_id': self.vendor_id,
                'invoice_number': self.invoice_number,
                'invoice_date': self.invoice_date.isoformat() if self.invoice_date else None
            },
            'workflow': {
                'status': self.status,
                'submitted_by': self.submitted_by,
                'submitted_date': self.submitted_date.isoformat() if self.submitted_date else None,
                'approved_by': self.approved_by,
                'approval_date': self.approval_date.isoformat() if self.approval_date else None,
                'rejection_reason': self.rejection_reason
            },
            'document_path': self.document_path,
            'budget': {
                'id': str(self.budget_id),
                'budget_id': self.budget.budget_id if self.budget else None,
                'department': self.budget.department if self.budget else None
            },
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def __repr__(self):
        return f'<Expense {self.expense_id}>'