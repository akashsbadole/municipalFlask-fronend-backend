from datetime import datetime, date
from app import db
from sqlalchemy.dialects.postgresql import UUID
import uuid

class PropertyTax(db.Model):
    __tablename__ = 'property_taxes'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tax_id = db.Column(db.String(20), unique=True, nullable=False)
    year = db.Column(db.Integer, nullable=False)
    
    # Tax calculation components
    annual_value = db.Column(db.Float, nullable=False)  # Base value of property
    tax_rate = db.Column(db.Float, nullable=False)  # Tax rate percentage
    municipal_tax = db.Column(db.Float, nullable=False)  # Calculated municipal tax
    education_tax = db.Column(db.Float, nullable=False)  # Education cess
    water_tax = db.Column(db.Float, nullable=False)  # Water tax
    sanitation_tax = db.Column(db.Float, nullable=False)  # Sanitation tax
    fire_tax = db.Column(db.Float, nullable=False)  # Fire service tax
    
    # Penalty and interest
    penalty_amount = db.Column(db.Float, default=0.0)
    interest_amount = db.Column(db.Float, default=0.0)
    
    # Payment details
    total_amount = db.Column(db.Float, nullable=False)
    amount_paid = db.Column(db.Float, default=0.0)
    balance_amount = db.Column(db.Float, nullable=False)
    due_date = db.Column(db.Date, nullable=False)
    payment_date = db.Column(db.Date)
    payment_method = db.Column(db.String(30))  # Online, Cash, Cheque, DD
    payment_reference = db.Column(db.String(50))  # Transaction ID, cheque number, etc.
    payment_status = db.Column(db.String(20), default='Pending')  # Pending, Paid, Partial, Defaulted
    
    # Status and timestamps
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Foreign keys
    property_id = db.Column(UUID(as_uuid=True), db.ForeignKey('properties.id'), nullable=False)
    
    def __init__(self, tax_id, year, annual_value, tax_rate, due_date, property_id,
                 municipal_tax=None, education_tax=None, water_tax=None, 
                 sanitation_tax=None, fire_tax=None, penalty_amount=0.0, interest_amount=0.0):
        self.tax_id = tax_id
        self.year = year
        self.annual_value = annual_value
        self.tax_rate = tax_rate
        self.due_date = due_date
        self.property_id = property_id
        
        # Calculate taxes if not provided
        if municipal_tax is None:
            self.municipal_tax = annual_value * (tax_rate / 100)
        else:
            self.municipal_tax = municipal_tax
            
        if education_tax is None:
            self.education_tax = self.municipal_tax * 0.1  # 10% of municipal tax
        else:
            self.education_tax = education_tax
            
        if water_tax is None:
            self.water_tax = annual_value * 0.005  # 0.5% of annual value
        else:
            self.water_tax = water_tax
            
        if sanitation_tax is None:
            self.sanitation_tax = annual_value * 0.005  # 0.5% of annual value
        else:
            self.sanitation_tax = sanitation_tax
            
        if fire_tax is None:
            self.fire_tax = annual_value * 0.002  # 0.2% of annual value
        else:
            self.fire_tax = fire_tax
            
        self.penalty_amount = penalty_amount
        self.interest_amount = interest_amount
        
        # Calculate total and balance
        self.calculate_total()
    
    def calculate_total(self):
        self.total_amount = (
            self.municipal_tax + 
            self.education_tax + 
            self.water_tax + 
            self.sanitation_tax + 
            self.fire_tax + 
            self.penalty_amount + 
            self.interest_amount
        )
        self.balance_amount = self.total_amount - self.amount_paid
    
    def calculate_penalty(self):
        """Calculate penalty for late payment"""
        if self.payment_status != 'Paid' and date.today() > self.due_date:
            days_overdue = (date.today() - self.due_date).days
            penalty_rate = 0.02  # 2% penalty
            self.penalty_amount = self.total_amount * penalty_rate * (days_overdue / 30)
            self.calculate_total()
            return True
        return False
    
    def calculate_interest(self):
        """Calculate interest for late payment"""
        if self.payment_status != 'Paid' and date.today() > self.due_date:
            days_overdue = (date.today() - self.due_date).days
            interest_rate = 0.01  # 1% interest per month
            self.interest_amount = self.total_amount * interest_rate * (days_overdue / 30)
            self.calculate_total()
            return True
        return False
    
    def make_payment(self, amount, payment_method, payment_reference=None):
        """Process a payment"""
        if amount <= 0:
            return False, "Payment amount must be positive"
            
        if amount > self.balance_amount:
            return False, "Payment amount exceeds balance due"
            
        self.amount_paid += amount
        self.payment_method = payment_method
        self.payment_reference = payment_reference
        self.payment_date = date.today()
        
        self.calculate_total()
        
        if self.balance_amount <= 0:
            self.payment_status = 'Paid'
        elif self.amount_paid > 0:
            self.payment_status = 'Partial'
        
        db.session.commit()
        return True, "Payment processed successfully"
    
    def is_overdue(self):
        """Check if tax payment is overdue"""
        return date.today() > self.due_date and self.payment_status != 'Paid'
    
    def days_overdue(self):
        """Calculate days overdue"""
        if self.is_overdue():
            return (date.today() - self.due_date).days
        return 0
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'tax_id': self.tax_id,
            'year': self.year,
            'tax_components': {
                'annual_value': self.annual_value,
                'tax_rate': self.tax_rate,
                'municipal_tax': self.municipal_tax,
                'education_tax': self.education_tax,
                'water_tax': self.water_tax,
                'sanitation_tax': self.sanitation_tax,
                'fire_tax': self.fire_tax,
                'penalty_amount': self.penalty_amount,
                'interest_amount': self.interest_amount
            },
            'payment': {
                'total_amount': self.total_amount,
                'amount_paid': self.amount_paid,
                'balance_amount': self.balance_amount,
                'due_date': self.due_date.isoformat() if self.due_date else None,
                'payment_date': self.payment_date.isoformat() if self.payment_date else None,
                'payment_method': self.payment_method,
                'payment_reference': self.payment_reference,
                'payment_status': self.payment_status,
                'is_overdue': self.is_overdue(),
                'days_overdue': self.days_overdue()
            },
            'property': {
                'id': str(self.property_id),
                'property_id': self.property.property_id if self.property else None,
                'address': self.property.full_address() if self.property else None
            },
            'created_at': self.created_at.isoformat()
        }
    
    def __repr__(self):
        return f'<PropertyTax {self.tax_id} - {self.year}>'