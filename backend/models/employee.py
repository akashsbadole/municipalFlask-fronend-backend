from datetime import datetime
import uuid
from extensions import db
from flask_login import UserMixin

class Employee(UserMixin, db.Model):
    __tablename__ = 'employees'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id = db.Column(db.String(20), unique=True, nullable=False, index=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    
    # Personal Information
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    date_of_birth = db.Column(db.Date, nullable=False)
    gender = db.Column(db.String(10), nullable=False)
    blood_group = db.Column(db.String(5))
    marital_status = db.Column(db.String(20), nullable=False)
    
    # Contact Information
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(20), nullable=False)
    address = db.Column(db.Text, nullable=False)
    city = db.Column(db.String(50), nullable=False)
    state = db.Column(db.String(50), nullable=False)
    postal_code = db.Column(db.String(10), nullable=False)
    
    # Employment Details
    department = db.Column(db.String(100), nullable=False)
    designation = db.Column(db.String(100), nullable=False)
    employment_type = db.Column(db.String(20), nullable=False)  # Permanent, Contract, Temporary
    employment_status = db.Column(db.String(20), nullable=False, default='Active')  # Active, Inactive, Terminated
    date_of_joining = db.Column(db.Date, nullable=False)
    date_of_leaving = db.Column(db.Date)
    
    # Job Details
    grade = db.Column(db.String(20), nullable=False)
    basic_salary = db.Column(db.Numeric(10, 2), nullable=False)
    bank_name = db.Column(db.String(100), nullable=False)
    bank_account_number = db.Column(db.String(50), nullable=False)
    bank_ifsc = db.Column(db.String(20), nullable=False)
    pan_number = db.Column(db.String(20), nullable=False)
    aadhaar_number = db.Column(db.String(20), nullable=False)
    
    # Reporting Structure
    reporting_to = db.Column(db.String(36), db.ForeignKey('employees.id'))
    
    # System Fields
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    
    # Relationships
    user = db.relationship('User', backref='employee', foreign_keys=[user_id])
    manager = db.relationship('Employee', remote_side=[id], backref='subordinates')
    salary_components = db.relationship('SalaryComponent', backref='employee', lazy='dynamic', cascade='all, delete-orphan')
    attendances = db.relationship('Attendance', backref='employee', lazy='dynamic', cascade='all, delete-orphan')
    leaves = db.relationship('Leave', backref='employee', lazy='dynamic', cascade='all, delete-orphan')
    payrolls = db.relationship('Payroll', backref='employee', lazy='dynamic', cascade='all, delete-orphan')
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    @property
    def years_of_service(self):
        if self.date_of_leaving:
            end_date = self.date_of_leaving
        else:
            end_date = datetime.now().date()
        
        return (end_date - self.date_of_joining).days // 365
    
    def to_dict(self):
        return {
            'id': self.id,
            'employee_id': self.employee_id,
            'user_id': self.user_id,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': self.full_name,
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'gender': self.gender,
            'blood_group': self.blood_group,
            'marital_status': self.marital_status,
            'email': self.email,
            'phone': self.phone,
            'address': self.address,
            'city': self.city,
            'state': self.state,
            'postal_code': self.postal_code,
            'department': self.department,
            'designation': self.designation,
            'employment_type': self.employment_type,
            'employment_status': self.employment_status,
            'date_of_joining': self.date_of_joining.isoformat() if self.date_of_joining else None,
            'date_of_leaving': self.date_of_leaving.isoformat() if self.date_of_leaving else None,
            'grade': self.grade,
            'basic_salary': float(self.basic_salary) if self.basic_salary else 0,
            'bank_name': self.bank_name,
            'bank_account_number': self.bank_account_number,
            'bank_ifsc': self.bank_ifsc,
            'pan_number': self.pan_number,
            'aadhaar_number': self.aadhaar_number,
            'reporting_to': self.reporting_to,
            'years_of_service': self.years_of_service,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class SalaryComponent(db.Model):
    __tablename__ = 'salary_components'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id = db.Column(db.String(36), db.ForeignKey('employees.id'), nullable=False)
    
    component_type = db.Column(db.String(20), nullable=False)  # Allowance, Deduction
    component_name = db.Column(db.String(100), nullable=False)
    component_code = db.Column(db.String(20), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    amount_type = db.Column(db.String(20), nullable=False)  # Fixed, Percentage
    percentage_of = db.Column(db.String(50))  # Basic, Gross, etc.
    is_taxable = db.Column(db.Boolean, default=True)
    is_active = db.Column(db.Boolean, default=True)
    
    # System Fields
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'employee_id': self.employee_id,
            'component_type': self.component_type,
            'component_name': self.component_name,
            'component_code': self.component_code,
            'amount': float(self.amount) if self.amount else 0,
            'amount_type': self.amount_type,
            'percentage_of': self.percentage_of,
            'is_taxable': self.is_taxable,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class Attendance(db.Model):
    __tablename__ = 'attendances'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id = db.Column(db.String(36), db.ForeignKey('employees.id'), nullable=False)
    
    date = db.Column(db.Date, nullable=False)
    check_in = db.Column(db.Time)
    check_out = db.Column(db.Time)
    status = db.Column(db.String(20), nullable=False)  # Present, Absent, Late, Half Day, Leave
    work_hours = db.Column(db.Numeric(5, 2))  # Calculated from check_in and check_out
    overtime_hours = db.Column(db.Numeric(5, 2), default=0)
    location = db.Column(db.String(100))
    notes = db.Column(db.Text)
    
    # System Fields
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    
    __table_args__ = (
        db.UniqueConstraint('employee_id', 'date', name='uq_employee_attendance_date'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'employee_id': self.employee_id,
            'date': self.date.isoformat() if self.date else None,
            'check_in': self.check_in.isoformat() if self.check_in else None,
            'check_out': self.check_out.isoformat() if self.check_out else None,
            'status': self.status,
            'work_hours': float(self.work_hours) if self.work_hours else 0,
            'overtime_hours': float(self.overtime_hours) if self.overtime_hours else 0,
            'location': self.location,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class Leave(db.Model):
    __tablename__ = 'leaves'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id = db.Column(db.String(36), db.ForeignKey('employees.id'), nullable=False)
    
    leave_type = db.Column(db.String(50), nullable=False)  # Sick, Casual, Earned, Maternity, etc.
    from_date = db.Column(db.Date, nullable=False)
    to_date = db.Column(db.Date, nullable=False)
    total_days = db.Column(db.Numeric(5, 2), nullable=False)
    reason = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='Pending')  # Pending, Approved, Rejected
    approved_by = db.Column(db.String(36), db.ForeignKey('users.id'))
    approved_date = db.Column(db.DateTime)
    rejection_reason = db.Column(db.Text)
    
    # System Fields
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'employee_id': self.employee_id,
            'leave_type': self.leave_type,
            'from_date': self.from_date.isoformat() if self.from_date else None,
            'to_date': self.to_date.isoformat() if self.to_date else None,
            'total_days': float(self.total_days) if self.total_days else 0,
            'reason': self.reason,
            'status': self.status,
            'approved_by': self.approved_by,
            'approved_date': self.approved_date.isoformat() if self.approved_date else None,
            'rejection_reason': self.rejection_reason,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class LeaveBalance(db.Model):
    __tablename__ = 'leave_balances'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id = db.Column(db.String(36), db.ForeignKey('employees.id'), nullable=False)
    
    leave_type = db.Column(db.String(50), nullable=False)
    year = db.Column(db.Integer, nullable=False)
    total_allocated = db.Column(db.Numeric(5, 2), nullable=False)
    used = db.Column(db.Numeric(5, 2), default=0)
    balance = db.Column(db.Numeric(5, 2), nullable=False)
    
    # System Fields
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    
    __table_args__ = (
        db.UniqueConstraint('employee_id', 'leave_type', 'year', name='uq_employee_leave_type_year'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'employee_id': self.employee_id,
            'leave_type': self.leave_type,
            'year': self.year,
            'total_allocated': float(self.total_allocated) if self.total_allocated else 0,
            'used': float(self.used) if self.used else 0,
            'balance': float(self.balance) if self.balance else 0,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


# Payroll model is now defined in models/payroll.py