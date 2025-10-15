from datetime import datetime, date
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
from models.base import BaseModel
from extensions import db

class Payroll(BaseModel):
    __tablename__ = 'payrolls'
    
    payroll_id = Column(String(20), unique=True, nullable=False)
    
    # Payroll period
    payroll_month = Column(Integer, nullable=False)  # 1-12
    payroll_year = Column(Integer, nullable=False)
    payroll_date = Column(DateTime, nullable=False)
    
    # Salary components
    basic_salary = Column(Float, nullable=False)
    hra = Column(Float, default=0.0)  # House Rent Allowance
    da = Column(Float, default=0.0)  # Dearness Allowance
    ta = Column(Float, default=0.0)  # Travel Allowance
    ma = Column(Float, default=0.0)  # Medical Allowance
    special_allowance = Column(Float, default=0.0)
    other_allowances = Column(Float, default=0.0)
    
    # Gross salary
    gross_salary = Column(Float, nullable=False)
    
    # Deductions
    provident_fund = Column(Float, default=0.0)
    professional_tax = Column(Float, default=0.0)
    income_tax = Column(Float, default=0.0)
    other_deductions = Column(Float, default=0.0)
    
    # Total deductions
    total_deductions = Column(Float, default=0.0)
    
    # Net salary
    net_salary = Column(Float, nullable=False)
    
    # Payment details
    payment_date = Column(DateTime)
    payment_method = Column(String(30))  # Bank Transfer, Cash, Cheque
    transaction_reference = Column(String(50))
    payment_status = Column(String(20), default='Pending')  # Pending, Processed, Failed
    
    # Foreign keys
    employee_id = Column(String(36), ForeignKey('employees.id'), nullable=False)
    
    def __init__(self, payroll_id, payroll_month, payroll_year, payroll_date, 
                 basic_salary, employee_id, hra=0.0, da=0.0, ta=0.0, ma=0.0, 
                 special_allowance=0.0, other_allowances=0.0, provident_fund=0.0,
                 professional_tax=0.0, income_tax=0.0, other_deductions=0.0):
        self.payroll_id = payroll_id
        self.payroll_month = payroll_month
        self.payroll_year = payroll_year
        self.payroll_date = payroll_date
        self.basic_salary = basic_salary
        self.employee_id = employee_id
        self.hra = hra
        self.da = da
        self.ta = ta
        self.ma = ma
        self.special_allowance = special_allowance
        self.other_allowances = other_allowances
        self.provident_fund = provident_fund
        self.professional_tax = professional_tax
        self.income_tax = income_tax
        self.other_deductions = other_deductions
        
        # Calculate gross salary
        self.gross_salary = (basic_salary + hra + da + ta + ma + 
                           special_allowance + other_allowances)
        
        # Calculate total deductions
        self.total_deductions = (provident_fund + professional_tax + 
                                income_tax + other_deductions)
        
        # Calculate net salary
        self.net_salary = self.gross_salary - self.total_deductions
    
    def process_payment(self, payment_date, payment_method, transaction_reference=None):
        """Process the payroll payment"""
        self.payment_date = payment_date
        self.payment_method = payment_method
        self.transaction_reference = transaction_reference
        self.payment_status = 'Processed'
        db.session.commit()
    
    def mark_payment_failed(self, reason=None):
        """Mark payment as failed"""
        self.payment_status = 'Failed'
        db.session.commit()
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'payroll_id': self.payroll_id,
            'payroll_period': {
                'payroll_month': self.payroll_month,
                'payroll_year': self.payroll_year,
                'payroll_date': self.payroll_date.isoformat() if self.payroll_date else None
            },
            'earnings': {
                'basic_salary': self.basic_salary,
                'hra': self.hra,
                'da': self.da,
                'ta': self.ta,
                'ma': self.ma,
                'special_allowance': self.special_allowance,
                'other_allowances': self.other_allowances,
                'gross_salary': self.gross_salary
            },
            'deductions': {
                'provident_fund': self.provident_fund,
                'professional_tax': self.professional_tax,
                'income_tax': self.income_tax,
                'other_deductions': self.other_deductions,
                'total_deductions': self.total_deductions
            },
            'net_salary': self.net_salary,
            'payment': {
                'payment_date': self.payment_date.isoformat() if self.payment_date else None,
                'payment_method': self.payment_method,
                'transaction_reference': self.transaction_reference,
                'payment_status': self.payment_status
            },
            'employee': {
                'id': str(self.employee_id),
                'employee_id': self.employee.employee_id if self.employee else None,
                'name': self.employee.full_name() if self.employee else None
            },
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def __repr__(self):
        return f'<Payroll {self.payroll_id}>'