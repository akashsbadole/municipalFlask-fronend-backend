from datetime import datetime
from app import db
from sqlalchemy.dialects.postgresql import UUID
import uuid

class Budget(db.Model):
    __tablename__ = 'budgets'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    budget_id = db.Column(db.String(20), unique=True, nullable=False)
    
    # Budget details
    financial_year = db.Column(db.String(10), nullable=False)  # e.g., 2023-24
    department = db.Column(db.String(50), nullable=False)
    budget_category = db.Column(db.String(50), nullable=False)
    budget_head = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    
    # Financial details
    allocated_amount = db.Column(db.Float, nullable=False)
    utilized_amount = db.Column(db.Float, default=0.0)
    balance_amount = db.Column(db.Float, nullable=False)
    
    # Status
    status = db.Column(db.String(20), default='Approved')  # Draft, Approved, Rejected, Closed
    
    # Approval details
    approved_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    approval_date = db.Column(db.DateTime)
    
    # Status and timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    approver = db.relationship('User', backref='approved_budgets')
    expenses = db.relationship('Expense', backref='budget', lazy=True)
    
    def __init__(self, budget_id, financial_year, department, budget_category, 
                 budget_head, allocated_amount, description=None, status='Draft'):
        self.budget_id = budget_id
        self.financial_year = financial_year
        self.department = department
        self.budget_category = budget_category
        self.budget_head = budget_head
        self.allocated_amount = allocated_amount
        self.balance_amount = allocated_amount
        self.description = description
        self.status = status
    
    def approve_budget(self, user_id):
        """Approve the budget"""
        self.status = 'Approved'
        self.approved_by = user_id
        self.approval_date = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def reject_budget(self, user_id):
        """Reject the budget"""
        self.status = 'Rejected'
        self.approved_by = user_id
        self.approval_date = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def add_expense(self, amount):
        """Add expense to the budget"""
        if amount <= 0:
            return False, "Expense amount must be positive"
        
        if amount > self.balance_amount:
            return False, "Expense amount exceeds budget balance"
        
        self.utilized_amount += amount
        self.balance_amount -= amount
        self.updated_at = datetime.utcnow()
        db.session.commit()
        return True, "Expense added successfully"
    
    def utilization_percentage(self):
        """Calculate budget utilization percentage"""
        if self.allocated_amount == 0:
            return 0
        return (self.utilized_amount / self.allocated_amount) * 100
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'budget_id': self.budget_id,
            'budget_details': {
                'financial_year': self.financial_year,
                'department': self.department,
                'budget_category': self.budget_category,
                'budget_head': self.budget_head,
                'description': self.description
            },
            'financial_details': {
                'allocated_amount': self.allocated_amount,
                'utilized_amount': self.utilized_amount,
                'balance_amount': self.balance_amount,
                'utilization_percentage': self.utilization_percentage()
            },
            'status': {
                'current_status': self.status,
                'approved_by': self.approved_by,
                'approval_date': self.approval_date.isoformat() if self.approval_date else None
            },
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def __repr__(self):
        return f'<Budget {self.budget_id}>'