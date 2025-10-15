from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey, Boolean, Enum
from sqlalchemy.orm import relationship
from models.base import BaseModel
import enum

class BudgetStatus(enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    IMPLEMENTED = "implemented"

class ExpenseStatus(enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    PAID = "paid"

class Budget(BaseModel):
    __tablename__ = 'budgets'
    
    fiscal_year = Column(String(20), nullable=False, index=True)
    department = Column(String(100), nullable=False, index=True)
    budget_type = Column(String(50), nullable=False)  # operational, capital, project, etc.
    total_allocated = Column(Float, nullable=False)
    total_spent = Column(Float, default=0.0)
    remaining_budget = Column(Float, nullable=False)
    
    # Budget details
    title = Column(String(255), nullable=False)
    description = Column(Text)
    justification = Column(Text)
    
    # Approval workflow
    status = Column(Enum(BudgetStatus), default=BudgetStatus.DRAFT, nullable=False, index=True)
    submitted_by = Column(String, ForeignKey('users.id'))
    submitted_at = Column(DateTime)
    reviewed_by = Column(String, ForeignKey('users.id'))
    reviewed_at = Column(DateTime)
    approved_by = Column(String, ForeignKey('users.id'))
    approved_at = Column(DateTime)
    rejection_reason = Column(Text)
    
    # Implementation tracking
    implementation_start_date = Column(DateTime)
    implementation_end_date = Column(DateTime)
    implementation_notes = Column(Text)
    
    # Relationships
    submitter = relationship("User", foreign_keys=[submitted_by], backref="submitted_budgets")
    reviewer = relationship("User", foreign_keys=[reviewed_by], backref="reviewed_budgets")
    approver = relationship("User", foreign_keys=[approved_by], backref="approved_budgets")
    budget_items = relationship("BudgetItem", back_populates="budget", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="budget", cascade="all, delete-orphan")
    
    def to_dict(self):
        return {
            'id': self.id,
            'fiscal_year': self.fiscal_year,
            'department': self.department,
            'budget_type': self.budget_type,
            'total_allocated': self.total_allocated,
            'total_spent': self.total_spent,
            'remaining_budget': self.remaining_budget,
            'title': self.title,
            'description': self.description,
            'justification': self.justification,
            'status': self.status.value if self.status else None,
            'submitted_by': self.submitted_by,
            'submitted_at': self.submitted_at.isoformat() if self.submitted_at else None,
            'reviewed_by': self.reviewed_by,
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None,
            'approved_by': self.approved_by,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'rejection_reason': self.rejection_reason,
            'implementation_start_date': self.implementation_start_date.isoformat() if self.implementation_start_date else None,
            'implementation_end_date': self.implementation_end_date.isoformat() if self.implementation_end_date else None,
            'implementation_notes': self.implementation_notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def calculate_remaining(self):
        """Calculate remaining budget"""
        self.remaining_budget = self.total_allocated - self.total_spent
        return self.remaining_budget


class BudgetItem(BaseModel):
    __tablename__ = 'budget_items'
    
    budget_id = Column(String, ForeignKey('budgets.id'), nullable=False)
    category = Column(String(100), nullable=False)
    item_name = Column(String(255), nullable=False)
    description = Column(Text)
    
    # Financial details
    allocated_amount = Column(Float, nullable=False)
    spent_amount = Column(Float, default=0.0)
    remaining_amount = Column(Float, nullable=False)
    
    # Priority and timeline
    priority = Column(String(20), default='medium')  # low, medium, high, critical
    quarter = Column(String(20))  # Q1, Q2, Q3, Q4
    expected_completion_date = Column(DateTime)
    
    # Status
    status = Column(String(50), default='planned')  # planned, in_progress, completed, cancelled
    
    # Relationships
    budget = relationship("Budget", back_populates="budget_items")
    
    def to_dict(self):
        return {
            'id': self.id,
            'budget_id': self.budget_id,
            'category': self.category,
            'item_name': self.item_name,
            'description': self.description,
            'allocated_amount': self.allocated_amount,
            'spent_amount': self.spent_amount,
            'remaining_amount': self.remaining_amount,
            'priority': self.priority,
            'quarter': self.quarter,
            'expected_completion_date': self.expected_completion_date.isoformat() if self.expected_completion_date else None,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def calculate_remaining(self):
        """Calculate remaining amount for this budget item"""
        self.remaining_amount = self.allocated_amount - self.spent_amount
        return self.remaining_amount


class Expense(BaseModel):
    __tablename__ = 'expenses'
    
    budget_id = Column(String, ForeignKey('budgets.id'), nullable=False)
    budget_item_id = Column(String, ForeignKey('budget_items.id'))
    
    # Expense details
    expense_type = Column(String(100), nullable=False)  # salary, equipment, supplies, services, etc.
    description = Column(Text, nullable=False)
    amount = Column(Float, nullable=False)
    
    # Vendor information
    vendor_name = Column(String(255))
    vendor_address = Column(Text)
    vendor_contact = Column(String(255))
    invoice_number = Column(String(100))
    invoice_date = Column(DateTime)
    
    # Dates
    expense_date = Column(DateTime, nullable=False)
    payment_due_date = Column(DateTime)
    payment_date = Column(DateTime)
    
    # Approval workflow
    status = Column(Enum(ExpenseStatus), default=ExpenseStatus.PENDING, nullable=False, index=True)
    submitted_by = Column(String, ForeignKey('users.id'), nullable=False)
    approved_by = Column(String, ForeignKey('users.id'))
    approved_at = Column(DateTime)
    rejection_reason = Column(Text)
    
    # Payment information
    payment_method = Column(String(50))  # cash, check, bank_transfer, credit_card
    payment_reference = Column(String(255))
    receipt_path = Column(String(500))
    
    # Additional information
    notes = Column(Text)
    tags = Column(String(500))  # Comma-separated tags for categorization
    
    # Relationships
    budget = relationship("Budget", back_populates="expenses")
    budget_item = relationship("BudgetItem")
    submitter = relationship("User", foreign_keys=[submitted_by], backref="submitted_expenses")
    approver = relationship("User", foreign_keys=[approved_by], backref="approved_expenses")
    
    def to_dict(self):
        return {
            'id': self.id,
            'budget_id': self.budget_id,
            'budget_item_id': self.budget_item_id,
            'expense_type': self.expense_type,
            'description': self.description,
            'amount': self.amount,
            'vendor_name': self.vendor_name,
            'vendor_address': self.vendor_address,
            'vendor_contact': self.vendor_contact,
            'invoice_number': self.invoice_number,
            'invoice_date': self.invoice_date.isoformat() if self.invoice_date else None,
            'expense_date': self.expense_date.isoformat() if self.expense_date else None,
            'payment_due_date': self.payment_due_date.isoformat() if self.payment_due_date else None,
            'payment_date': self.payment_date.isoformat() if self.payment_date else None,
            'status': self.status.value if self.status else None,
            'submitted_by': self.submitted_by,
            'approved_by': self.approved_by,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'rejection_reason': self.rejection_reason,
            'payment_method': self.payment_method,
            'payment_reference': self.payment_reference,
            'receipt_path': self.receipt_path,
            'notes': self.notes,
            'tags': self.tags,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class FinancialReport(BaseModel):
    __tablename__ = 'financial_reports'
    
    report_type = Column(String(50), nullable=False)  # budget_summary, expense_report, variance_analysis, etc.
    title = Column(String(255), nullable=False)
    description = Column(Text)
    
    # Report period
    fiscal_year = Column(String(20), nullable=False)
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    
    # Report content
    content = Column(Text)  # JSON or structured text content
    summary = Column(Text)
    recommendations = Column(Text)
    
    # Generation details
    generated_by = Column(String, ForeignKey('users.id'), nullable=False)
    generated_at = Column(DateTime, default=datetime.utcnow)
    
    # File information
    file_path = Column(String(500))
    file_name = Column(String(255))
    file_size = Column(Integer)
    
    # Status
    status = Column(String(50), default='draft')  # draft, submitted, approved, published
    approved_by = Column(String, ForeignKey('users.id'))
    approved_at = Column(DateTime)
    
    # Relationships
    generator = relationship("User", foreign_keys=[generated_by], backref="generated_reports")
    approver = relationship("User", foreign_keys=[approved_by], backref="approved_reports")
    
    def to_dict(self):
        return {
            'id': self.id,
            'report_type': self.report_type,
            'title': self.title,
            'description': self.description,
            'fiscal_year': self.fiscal_year,
            'period_start': self.period_start.isoformat() if self.period_start else None,
            'period_end': self.period_end.isoformat() if self.period_end else None,
            'content': self.content,
            'summary': self.summary,
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