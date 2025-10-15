from datetime import datetime, date
from extensions import db
from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID
import uuid

class Tender(db.Model):
    __tablename__ = 'tenders'
    
    id = db.Column(String(36), primary_key=True, default=uuid.uuid4)
    tender_id = db.Column(db.String(20), unique=True, nullable=False)
    
    # Tender details
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    tender_type = db.Column(db.String(50), nullable=False)  # Works, Goods, Services
    category = db.Column(db.String(50), nullable=False)
    
    # Financial details
    estimated_cost = db.Column(db.Float, nullable=False)
    emd_amount = db.Column(db.Float)  # Earnest Money Deposit
    
    # Timeline
    publication_date = db.Column(db.Date, nullable=False)
    bid_submission_start = db.Column(db.Date, nullable=False)
    bid_submission_end = db.Column(db.Date, nullable=False)
    bid_opening_date = db.Column(db.Date)
    technical_evaluation_date = db.Column(db.Date)
    
    # Status
    status = db.Column(db.String(20), default='Published')  # Published, Closed, Under Evaluation, Awarded, Cancelled
    
    # Award details
    awarded_to = db.Column(String(36), db.ForeignKey('vendors.id'))
    awarded_amount = db.Column(db.Float)
    awarded_date = db.Column(db.Date)
    
    # Documents
    tender_document_path = db.Column(db.String(255))
    corrigendum_path = db.Column(db.String(255))
    
    # Status and timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    awarded_vendor = db.relationship('Vendor', backref='awarded_tenders')
    
    def __init__(self, tender_id, title, description, tender_type, category, 
                 estimated_cost, publication_date, bid_submission_start, 
                 bid_submission_end, emd_amount=None, bid_opening_date=None,
                 technical_evaluation_date=None, status='Published',
                 tender_document_path=None, corrigendum_path=None):
        self.tender_id = tender_id
        self.title = title
        self.description = description
        self.tender_type = tender_type
        self.category = category
        self.estimated_cost = estimated_cost
        self.publication_date = publication_date
        self.bid_submission_start = bid_submission_start
        self.bid_submission_end = bid_submission_end
        self.emd_amount = emd_amount
        self.bid_opening_date = bid_opening_date
        self.technical_evaluation_date = technical_evaluation_date
        self.status = status
        self.tender_document_path = tender_document_path
        self.corrigendum_path = corrigendum_path
    
    def is_open_for_bidding(self):
        """Check if tender is open for bidding"""
        today = date.today()
        return (self.status == 'Published' and 
                self.bid_submission_start <= today <= self.bid_submission_end)
    
    def days_to_bid_closing(self):
        """Calculate days until bid closing"""
        if self.status != 'Published':
            return None
        
        today = date.today()
        if today > self.bid_submission_end:
            return 0
        
        return (self.bid_submission_end - today).days
    
    def close_bidding(self):
        """Close the bidding process"""
        self.status = 'Closed'
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def start_evaluation(self):
        """Start the evaluation process"""
        self.status = 'Under Evaluation'
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def award_tender(self, vendor_id, amount):
        """Award the tender to a vendor"""
        self.status = 'Awarded'
        self.awarded_to = vendor_id
        self.awarded_amount = amount
        self.awarded_date = date.today()
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def cancel_tender(self, reason):
        """Cancel the tender"""
        self.status = 'Cancelled'
        self.updated_at = datetime.utcnow()
        db.session.commit()
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'tender_id': self.tender_id,
            'tender_details': {
                'title': self.title,
                'description': self.description,
                'tender_type': self.tender_type,
                'category': self.category
            },
            'financial_details': {
                'estimated_cost': self.estimated_cost,
                'emd_amount': self.emd_amount
            },
            'timeline': {
                'publication_date': self.publication_date.isoformat() if self.publication_date else None,
                'bid_submission_start': self.bid_submission_start.isoformat() if self.bid_submission_start else None,
                'bid_submission_end': self.bid_submission_end.isoformat() if self.bid_submission_end else None,
                'bid_opening_date': self.bid_opening_date.isoformat() if self.bid_opening_date else None,
                'technical_evaluation_date': self.technical_evaluation_date.isoformat() if self.technical_evaluation_date else None,
                'is_open_for_bidding': self.is_open_for_bidding(),
                'days_to_bid_closing': self.days_to_bid_closing()
            },
            'status': self.status,
            'award_details': {
                'awarded_to': self.awarded_to,
                'awarded_amount': self.awarded_amount,
                'awarded_date': self.awarded_date.isoformat() if self.awarded_date else None
            },
            'documents': {
                'tender_document_path': self.tender_document_path,
                'corrigendum_path': self.corrigendum_path
            },
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }
    
    def __repr__(self):
        return f'<Tender {self.tender_id}>'