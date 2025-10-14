from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import User
from models.employee import Employee, SalaryComponent, Attendance, Leave, LeaveBalance
from models.payroll import Payroll
from models.role import Role
from app import db
from datetime import datetime, date
import calendar
import uuid

hr_bp = Blueprint('hr', __name__, url_prefix='/api/hr')

# Helper function to check permissions
def check_permission(permission_name):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return False
    
    # Super Admin has all permissions
    if user.role.name == 'Super Admin':
        return True
    
    # Check user's role permissions
    for perm in user.role.permissions:
        if perm.name == permission_name:
            return True
    
    return False

# Error handler
def handle_error(message, status_code=400):
    return jsonify({'error': message}), status_code

# Generate employee ID
def generate_employee_id():
    year = datetime.now().year
    count = Employee.query.filter(Employee.employee_id.like(f'EMP{year}%')).count()
    return f'EMP{year}{str(count + 1).zfill(4)}'

# Employee Management Routes
@hr_bp.route('/employees', methods=['GET'])
@jwt_required()
def get_employees():
    if not check_permission('hr.read'):
        return handle_error('You do not have permission to view employees', 403)
    
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        department = request.args.get('department')
        status = request.args.get('status')
        search = request.args.get('search')
        
        query = Employee.query
        
        if department:
            query = query.filter(Employee.department == department)
        
        if status:
            query = query.filter(Employee.employment_status == status)
        
        if search:
            query = query.filter(
                db.or_(
                    Employee.first_name.ilike(f'%{search}%'),
                    Employee.last_name.ilike(f'%{search}%'),
                    Employee.employee_id.ilike(f'%{search}%'),
                    Employee.email.ilike(f'%{search}%')
                )
            )
        
        employees = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'employees': [emp.to_dict() for emp in employees.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': employees.total,
                'pages': employees.pages,
                'has_next': employees.has_next,
                'has_prev': employees.has_prev
            }
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching employees: {str(e)}")
        return handle_error('Failed to fetch employees', 500)

@hr_bp.route('/employees/<employee_id>', methods=['GET'])
@jwt_required()
def get_employee(employee_id):
    if not check_permission('hr.read'):
        return handle_error('You do not have permission to view employee details', 403)
    
    try:
        employee = Employee.query.filter_by(id=employee_id).first()
        if not employee:
            return handle_error('Employee not found', 404)
        
        return jsonify(employee.to_dict()), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching employee: {str(e)}")
        return handle_error('Failed to fetch employee', 500)

@hr_bp.route('/employees', methods=['POST'])
@jwt_required()
def create_employee():
    if not check_permission('hr.create'):
        return handle_error('You do not have permission to create employees', 403)
    
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['first_name', 'last_name', 'date_of_birth', 'gender', 'marital_status',
                          'email', 'phone', 'address', 'city', 'state', 'postal_code',
                          'department', 'designation', 'employment_type', 'date_of_joining',
                          'grade', 'basic_salary', 'bank_name', 'bank_account_number', 
                          'bank_ifsc', 'pan_number', 'aadhaar_number']
        
        for field in required_fields:
            if field not in data:
                return handle_error(f'{field} is required')
        
        # Check if email already exists
        if Employee.query.filter_by(email=data['email']).first():
            return handle_error('Email already exists')
        
        # Create employee
        employee = Employee(
            employee_id=generate_employee_id(),
            user_id=data.get('user_id'),
            first_name=data['first_name'],
            last_name=data['last_name'],
            date_of_birth=datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date(),
            gender=data['gender'],
            blood_group=data.get('blood_group'),
            marital_status=data['marital_status'],
            email=data['email'],
            phone=data['phone'],
            address=data['address'],
            city=data['city'],
            state=data['state'],
            postal_code=data['postal_code'],
            department=data['department'],
            designation=data['designation'],
            employment_type=data['employment_type'],
            employment_status=data.get('employment_status', 'Active'),
            date_of_joining=datetime.strptime(data['date_of_joining'], '%Y-%m-%d').date(),
            date_of_leaving=datetime.strptime(data['date_of_leaving'], '%Y-%m-%d').date() if data.get('date_of_leaving') else None,
            grade=data['grade'],
            basic_salary=data['basic_salary'],
            bank_name=data['bank_name'],
            bank_account_number=data['bank_account_number'],
            bank_ifsc=data['bank_ifsc'],
            pan_number=data['pan_number'],
            aadhaar_number=data['aadhaar_number'],
            reporting_to=data.get('reporting_to'),
            created_by=get_jwt_identity()
        )
        
        db.session.add(employee)
        db.session.commit()
        
        # Initialize leave balances for the current year
        current_year = datetime.now().year
        leave_types = [
            {'type': 'Sick Leave', 'days': 12},
            {'type': 'Casual Leave', 'days': 12},
            {'type': 'Earned Leave', 'days': 15}
        ]
        
        for leave_type in leave_types:
            leave_balance = LeaveBalance(
                employee_id=employee.id,
                leave_type=leave_type['type'],
                year=current_year,
                total_allocated=leave_type['days'],
                balance=leave_type['days'],
                created_by=get_jwt_identity()
            )
            db.session.add(leave_balance)
        
        db.session.commit()
        
        return jsonify(employee.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating employee: {str(e)}")
        return handle_error('Failed to create employee', 500)

@hr_bp.route('/employees/<employee_id>', methods=['PUT'])
@jwt_required()
def update_employee(employee_id):
    if not check_permission('hr.update'):
        return handle_error('You do not have permission to update employees', 403)
    
    try:
        employee = Employee.query.filter_by(id=employee_id).first()
        if not employee:
            return handle_error('Employee not found', 404)
        
        data = request.get_json()
        
        # Update employee fields
        updatable_fields = ['first_name', 'last_name', 'date_of_birth', 'gender', 'blood_group',
                           'marital_status', 'email', 'phone', 'address', 'city', 'state',
                           'postal_code', 'department', 'designation', 'employment_type',
                           'employment_status', 'date_of_leaving', 'grade', 'basic_salary',
                           'bank_name', 'bank_account_number', 'bank_ifsc', 'pan_number',
                           'aadhaar_number', 'reporting_to']
        
        for field in updatable_fields:
            if field in data:
                if field in ['date_of_birth', 'date_of_leaving'] and data[field]:
                    setattr(employee, field, datetime.strptime(data[field], '%Y-%m-%d').date())
                else:
                    setattr(employee, field, data[field])
        
        employee.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify(employee.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating employee: {str(e)}")
        return handle_error('Failed to update employee', 500)

@hr_bp.route('/employees/<employee_id>', methods=['DELETE'])
@jwt_required()
def delete_employee(employee_id):
    if not check_permission('hr.delete'):
        return handle_error('You do not have permission to delete employees', 403)
    
    try:
        employee = Employee.query.filter_by(id=employee_id).first()
        if not employee:
            return handle_error('Employee not found', 404)
        
        # Soft delete by updating status
        employee.employment_status = 'Terminated'
        employee.date_of_leaving = datetime.now().date()
        employee.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({'message': 'Employee terminated successfully'}), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting employee: {str(e)}")
        return handle_error('Failed to delete employee', 500)

# Salary Component Routes
@hr_bp.route('/employees/<employee_id>/salary-components', methods=['GET'])
@jwt_required()
def get_salary_components(employee_id):
    if not check_permission('hr.read'):
        return handle_error('You do not have permission to view salary components', 403)
    
    try:
        employee = Employee.query.filter_by(id=employee_id).first()
        if not employee:
            return handle_error('Employee not found', 404)
        
        components = SalaryComponent.query.filter_by(employee_id=employee_id, is_active=True).all()
        
        return jsonify([comp.to_dict() for comp in components]), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching salary components: {str(e)}")
        return handle_error('Failed to fetch salary components', 500)

@hr_bp.route('/employees/<employee_id>/salary-components', methods=['POST'])
@jwt_required()
def create_salary_component(employee_id):
    if not check_permission('hr.update'):
        return handle_error('You do not have permission to create salary components', 403)
    
    try:
        employee = Employee.query.filter_by(id=employee_id).first()
        if not employee:
            return handle_error('Employee not found', 404)
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['component_type', 'component_name', 'component_code', 'amount', 'amount_type']
        for field in required_fields:
            if field not in data:
                return handle_error(f'{field} is required')
        
        component = SalaryComponent(
            employee_id=employee_id,
            component_type=data['component_type'],
            component_name=data['component_name'],
            component_code=data['component_code'],
            amount=data['amount'],
            amount_type=data['amount_type'],
            percentage_of=data.get('percentage_of'),
            is_taxable=data.get('is_taxable', True),
            created_by=get_jwt_identity()
        )
        
        db.session.add(component)
        db.session.commit()
        
        return jsonify(component.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating salary component: {str(e)}")
        return handle_error('Failed to create salary component', 500)

# Attendance Routes
@hr_bp.route('/attendance', methods=['GET'])
@jwt_required()
def get_attendance():
    if not check_permission('hr.read'):
        return handle_error('You do not have permission to view attendance', 403)
    
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        employee_id = request.args.get('employee_id')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        query = Attendance.query
        
        if employee_id:
            query = query.filter(Attendance.employee_id == employee_id)
        
        if date_from:
            query = query.filter(Attendance.date >= datetime.strptime(date_from, '%Y-%m-%d').date())
        
        if date_to:
            query = query.filter(Attendance.date <= datetime.strptime(date_to, '%Y-%m-%d').date())
        
        attendances = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'attendances': [att.to_dict() for att in attendances.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': attendances.total,
                'pages': attendances.pages,
                'has_next': attendances.has_next,
                'has_prev': attendances.has_prev
            }
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching attendance: {str(e)}")
        return handle_error('Failed to fetch attendance', 500)

@hr_bp.route('/attendance', methods=['POST'])
@jwt_required()
def mark_attendance():
    if not check_permission('hr.update'):
        return handle_error('You do not have permission to mark attendance', 403)
    
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['employee_id', 'date', 'status']
        for field in required_fields:
            if field not in data:
                return handle_error(f'{field} is required')
        
        # Check if attendance already exists
        existing = Attendance.query.filter_by(
            employee_id=data['employee_id'],
            date=datetime.strptime(data['date'], '%Y-%m-%d').date()
        ).first()
        
        if existing:
            return handle_error('Attendance already marked for this date', 400)
        
        attendance = Attendance(
            employee_id=data['employee_id'],
            date=datetime.strptime(data['date'], '%Y-%m-%d').date(),
            check_in=datetime.strptime(data['check_in'], '%H:%M').time() if data.get('check_in') else None,
            check_out=datetime.strptime(data['check_out'], '%H:%M').time() if data.get('check_out') else None,
            status=data['status'],
            work_hours=data.get('work_hours'),
            overtime_hours=data.get('overtime_hours', 0),
            location=data.get('location'),
            notes=data.get('notes'),
            created_by=get_jwt_identity()
        )
        
        db.session.add(attendance)
        db.session.commit()
        
        return jsonify(attendance.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error marking attendance: {str(e)}")
        return handle_error('Failed to mark attendance', 500)

# Leave Routes
@hr_bp.route('/leaves', methods=['GET'])
@jwt_required()
def get_leaves():
    if not check_permission('hr.read'):
        return handle_error('You do not have permission to view leaves', 403)
    
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        employee_id = request.args.get('employee_id')
        status = request.args.get('status')
        leave_type = request.args.get('leave_type')
        
        query = Leave.query
        
        if employee_id:
            query = query.filter(Leave.employee_id == employee_id)
        
        if status:
            query = query.filter(Leave.status == status)
        
        if leave_type:
            query = query.filter(Leave.leave_type == leave_type)
        
        leaves = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'leaves': [leave.to_dict() for leave in leaves.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': leaves.total,
                'pages': leaves.pages,
                'has_next': leaves.has_next,
                'has_prev': leaves.has_prev
            }
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching leaves: {str(e)}")
        return handle_error('Failed to fetch leaves', 500)

@hr_bp.route('/leaves', methods=['POST'])
@jwt_required()
def apply_leave():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['employee_id', 'leave_type', 'from_date', 'to_date', 'reason']
        for field in required_fields:
            if field not in data:
                return handle_error(f'{field} is required')
        
        # Calculate total days
        from_date = datetime.strptime(data['from_date'], '%Y-%m-%d').date()
        to_date = datetime.strptime(data['to_date'], '%Y-%m-%d').date()
        total_days = (to_date - from_date).days + 1
        
        # Check leave balance
        current_year = datetime.now().year
        leave_balance = LeaveBalance.query.filter_by(
            employee_id=data['employee_id'],
            leave_type=data['leave_type'],
            year=current_year
        ).first()
        
        if not leave_balance or leave_balance.balance < total_days:
            return handle_error('Insufficient leave balance', 400)
        
        leave = Leave(
            employee_id=data['employee_id'],
            leave_type=data['leave_type'],
            from_date=from_date,
            to_date=to_date,
            total_days=total_days,
            reason=data['reason'],
            created_by=get_jwt_identity()
        )
        
        db.session.add(leave)
        db.session.commit()
        
        return jsonify(leave.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error applying leave: {str(e)}")
        return handle_error('Failed to apply leave', 500)

@hr_bp.route('/leaves/<leave_id>/approve', methods=['POST'])
@jwt_required()
def approve_leave(leave_id):
    if not check_permission('hr.approve'):
        return handle_error('You do not have permission to approve leaves', 403)
    
    try:
        leave = Leave.query.filter_by(id=leave_id).first()
        if not leave:
            return handle_error('Leave not found', 404)
        
        if leave.status != 'Pending':
            return handle_error('Leave is not in pending status', 400)
        
        # Update leave status
        leave.status = 'Approved'
        leave.approved_by = get_jwt_identity()
        leave.approved_date = datetime.utcnow()
        
        # Update leave balance
        current_year = datetime.now().year
        leave_balance = LeaveBalance.query.filter_by(
            employee_id=leave.employee_id,
            leave_type=leave.leave_type,
            year=current_year
        ).first()
        
        if leave_balance:
            leave_balance.used += leave.total_days
            leave_balance.balance -= leave.total_days
        
        db.session.commit()
        
        return jsonify(leave.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error approving leave: {str(e)}")
        return handle_error('Failed to approve leave', 500)

@hr_bp.route('/leaves/<leave_id>/reject', methods=['POST'])
@jwt_required()
def reject_leave(leave_id):
    if not check_permission('hr.approve'):
        return handle_error('You do not have permission to reject leaves', 403)
    
    try:
        leave = Leave.query.filter_by(id=leave_id).first()
        if not leave:
            return handle_error('Leave not found', 404)
        
        if leave.status != 'Pending':
            return handle_error('Leave is not in pending status', 400)
        
        data = request.get_json()
        
        # Update leave status
        leave.status = 'Rejected'
        leave.approved_by = get_jwt_identity()
        leave.approved_date = datetime.utcnow()
        leave.rejection_reason = data.get('rejection_reason')
        
        db.session.commit()
        
        return jsonify(leave.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error rejecting leave: {str(e)}")
        return handle_error('Failed to reject leave', 500)

# Payroll Routes
@hr_bp.route('/payroll/calculate', methods=['POST'])
@jwt_required()
def calculate_payroll():
    if not check_permission('hr.payroll'):
        return handle_error('You do not have permission to calculate payroll', 403)
    
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['employee_id', 'month', 'year']
        for field in required_fields:
            if field not in data:
                return handle_error(f'{field} is required')
        
        employee = Employee.query.filter_by(id=data['employee_id']).first()
        if not employee:
            return handle_error('Employee not found', 404)
        
        month = data['month']
        year = data['year']
        
        # Check if payroll already exists
        existing = Payroll.query.filter_by(
            employee_id=data['employee_id'],
            month=month,
            year=year
        ).first()
        
        if existing:
            return handle_error('Payroll already generated for this period', 400)
        
        # Get working days in the month
        _, days_in_month = calendar.monthrange(year, month)
        working_days = 0
        for day in range(1, days_in_month + 1):
            weekday = datetime(year, month, day).weekday()
            if weekday < 5:  # Monday to Friday
                working_days += 1
        
        # Get attendance for the month
        attendances = Attendance.query.filter(
            Attendance.employee_id == data['employee_id'],
            db.extract('month', Attendance.date) == month,
            db.extract('year', Attendance.date) == year
        ).all()
        
        present_days = sum(1 for att in attendances if att.status == 'Present')
        leave_days = sum(1 for att in attendances if att.status == 'Leave')
        absent_days = working_days - present_days - leave_days
        
        # Calculate basic salary for the month
        basic_salary = float(employee.basic_salary)
        monthly_basic = basic_salary
        
        # Calculate HRA (40% of basic)
        hra = monthly_basic * 0.4
        
        # Calculate DA (10% of basic)
        da = monthly_basic * 0.1
        
        # Get salary components
        allowances = SalaryComponent.query.filter_by(
            employee_id=data['employee_id'],
            component_type='Allowance',
            is_active=True
        ).all()
        
        special_allowance = sum(float(comp.amount) for comp in allowances)
        
        # Calculate gross salary
        gross_salary = monthly_basic + hra + da + special_allowance
        
        # Calculate deductions
        # PF (12% of basic)
        provident_fund = monthly_basic * 0.12
        
        # Professional Tax (fixed amount)
        professional_tax = 200
        
        # Get deduction components
        deductions = SalaryComponent.query.filter_by(
            employee_id=data['employee_id'],
            component_type='Deduction',
            is_active=True
        ).all()
        
        other_deductions = sum(float(comp.amount) for comp in deductions)
        
        # Income tax (simplified calculation)
        annual_income = gross_salary * 12
        income_tax = calculate_income_tax(annual_income) / 12
        
        # Total deductions
        total_deductions = provident_fund + professional_tax + income_tax + other_deductions
        
        # Net salary
        net_salary = gross_salary - total_deductions
        
        # Create payroll record
        payroll = Payroll(
            employee_id=data['employee_id'],
            month=month,
            year=year,
            pay_date=datetime.now().date(),
            basic_salary=monthly_basic,
            hra=hra,
            da=da,
            special_allowance=special_allowance,
            gross_salary=gross_salary,
            provident_fund=provident_fund,
            professional_tax=professional_tax,
            income_tax=income_tax,
            other_deductions=other_deductions,
            total_deductions=total_deductions,
            net_salary=net_salary,
            working_days=working_days,
            present_days=present_days,
            leave_days=leave_days,
            absent_days=absent_days,
            payment_mode='Bank Transfer',
            status='Pending',
            created_by=get_jwt_identity()
        )
        
        db.session.add(payroll)
        db.session.commit()
        
        return jsonify(payroll.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error calculating payroll: {str(e)}")
        return handle_error('Failed to calculate payroll', 500)

@hr_bp.route('/payroll', methods=['GET'])
@jwt_required()
def get_payrolls():
    if not check_permission('hr.read'):
        return handle_error('You do not have permission to view payrolls', 403)
    
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        employee_id = request.args.get('employee_id')
        month = request.args.get('month', type=int)
        year = request.args.get('year', type=int)
        status = request.args.get('status')
        
        query = Payroll.query
        
        if employee_id:
            query = query.filter(Payroll.employee_id == employee_id)
        
        if month:
            query = query.filter(Payroll.month == month)
        
        if year:
            query = query.filter(Payroll.year == year)
        
        if status:
            query = query.filter(Payroll.status == status)
        
        payrolls = query.paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'payrolls': [payroll.to_dict() for payroll in payrolls.items],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': payrolls.total,
                'pages': payrolls.pages,
                'has_next': payrolls.has_next,
                'has_prev': payrolls.has_prev
            }
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching payrolls: {str(e)}")
        return handle_error('Failed to fetch payrolls', 500)

@hr_bp.route('/payroll/<payroll_id>/process', methods=['POST'])
@jwt_required()
def process_payroll(payroll_id):
    if not check_permission('hr.payroll'):
        return handle_error('You do not have permission to process payroll', 403)
    
    try:
        payroll = Payroll.query.filter_by(id=payroll_id).first()
        if not payroll:
            return handle_error('Payroll not found', 404)
        
        if payroll.status != 'Pending':
            return handle_error('Payroll is not in pending status', 400)
        
        data = request.get_json()
        
        # Update payroll status
        payroll.status = 'Processed'
        payroll.transaction_id = data.get('transaction_id')
        payroll.payment_mode = data.get('payment_mode', 'Bank Transfer')
        
        db.session.commit()
        
        return jsonify(payroll.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error processing payroll: {str(e)}")
        return handle_error('Failed to process payroll', 500)

# Helper function to calculate income tax (simplified)
def calculate_income_tax(annual_income):
    # Simplified tax calculation for demonstration
    # In a real application, this would follow the actual tax slabs and regulations
    
    if annual_income <= 250000:
        return 0
    elif annual_income <= 500000:
        return (annual_income - 250000) * 0.05
    elif annual_income <= 1000000:
        return 12500 + (annual_income - 500000) * 0.2
    else:
        return 112500 + (annual_income - 1000000) * 0.3

# HR Statistics
@hr_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_hr_stats():
    if not check_permission('hr.read'):
        return handle_error('You do not have permission to view HR statistics', 403)
    
    try:
        # Employee statistics
        total_employees = Employee.query.filter_by(employment_status='Active').count()
        department_stats = db.session.query(
            Employee.department, db.func.count(Employee.id)
        ).filter_by(employment_status='Active').group_by(Employee.department).all()
        
        # Attendance statistics
        today = date.today()
        present_today = Attendance.query.filter_by(date=today, status='Present').count()
        absent_today = Attendance.query.filter_by(date=today, status='Absent').count()
        leave_today = Attendance.query.filter_by(date=today, status='Leave').count()
        
        # Leave statistics
        pending_leaves = Leave.query.filter_by(status='Pending').count()
        
        # Payroll statistics
        current_month = datetime.now().month
        current_year = datetime.now().year
        pending_payrolls = Payroll.query.filter_by(
            month=current_month,
            year=current_year,
            status='Pending'
        ).count()
        
        return jsonify({
            'employees': {
                'total': total_employees,
                'by_department': dict(department_stats)
            },
            'attendance': {
                'present_today': present_today,
                'absent_today': absent_today,
                'leave_today': leave_today
            },
            'leaves': {
                'pending': pending_leaves
            },
            'payroll': {
                'pending': pending_payrolls
            }
        }), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching HR statistics: {str(e)}")
        return handle_error('Failed to fetch HR statistics', 500)