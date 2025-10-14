from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.base import db
from models.finance import Budget, BudgetItem, Expense, FinancialReport, BudgetStatus, ExpenseStatus
from models.user import User
from utils.permissions import require_permission
from utils.validators import validate_required_fields
from datetime import datetime, timedelta
import math

finance_bp = Blueprint('finance', __name__, url_prefix='/finance')

# Budget endpoints
@finance_bp.route('/budgets', methods=['GET'])
@jwt_required()
@require_permission('finance.read')
def get_budgets():
    """Get all budgets with filtering and pagination"""
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('limit', 10, type=int)
        status = request.args.get('status')
        department = request.args.get('department')
        fiscal_year = request.args.get('fiscal_year')
        budget_type = request.args.get('budget_type')
        search = request.args.get('search')
        
        # Build query
        query = Budget.query
        
        # Apply filters
        if status:
            query = query.filter(Budget.status == status)
        
        if department:
            query = query.filter(Budget.department == department)
        
        if fiscal_year:
            query = query.filter(Budget.fiscal_year == fiscal_year)
        
        if budget_type:
            query = query.filter(Budget.budget_type == budget_type)
        
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                db.or_(
                    Budget.title.ilike(search_term),
                    Budget.description.ilike(search_term)
                )
            )
        
        # Order by created date (newest first)
        query = query.order_by(Budget.created_at.desc())
        
        # Paginate
        total = query.count()
        budgets = query.offset((page - 1) * per_page).limit(per_page).all()
        
        return jsonify({
            'budgets': [budget.to_dict() for budget in budgets],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': math.ceil(total / per_page)
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching budgets: {str(e)}")
        return jsonify({'error': 'Failed to fetch budgets'}), 500

@finance_bp.route('/budgets/<budget_id>', methods=['GET'])
@jwt_required()
@require_permission('finance.read')
def get_budget(budget_id):
    """Get a specific budget by ID"""
    try:
        budget = Budget.query.get(budget_id)
        if not budget:
            return jsonify({'error': 'Budget not found'}), 404
        
        return jsonify(budget.to_dict()), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching budget {budget_id}: {str(e)}")
        return jsonify({'error': 'Failed to fetch budget'}), 500

@finance_bp.route('/budgets', methods=['POST'])
@jwt_required()
@require_permission('finance.create')
def create_budget():
    """Create a new budget"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['fiscal_year', 'department', 'budget_type', 'total_allocated', 'title']
        validation_error = validate_required_fields(data, required_fields)
        if validation_error:
            return jsonify({'error': validation_error}), 400
        
        # Create new budget
        budget = Budget(
            fiscal_year=data['fiscal_year'],
            department=data['department'],
            budget_type=data['budget_type'],
            total_allocated=data['total_allocated'],
            remaining_budget=data['total_allocated'],
            title=data['title'],
            description=data.get('description', ''),
            justification=data.get('justification', '')
        )
        
        db.session.add(budget)
        db.session.commit()
        
        return jsonify(budget.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating budget: {str(e)}")
        return jsonify({'error': 'Failed to create budget'}), 500

@finance_bp.route('/budgets/<budget_id>', methods=['PUT'])
@jwt_required()
@require_permission('finance.update')
def update_budget(budget_id):
    """Update a budget"""
    try:
        budget = Budget.query.get(budget_id)
        if not budget:
            return jsonify({'error': 'Budget not found'}), 404
        
        data = request.get_json()
        
        # Update fields
        if 'fiscal_year' in data:
            budget.fiscal_year = data['fiscal_year']
        
        if 'department' in data:
            budget.department = data['department']
        
        if 'budget_type' in data:
            budget.budget_type = data['budget_type']
        
        if 'total_allocated' in data:
            budget.total_allocated = data['total_allocated']
            budget.calculate_remaining()
        
        if 'title' in data:
            budget.title = data['title']
        
        if 'description' in data:
            budget.description = data['description']
        
        if 'justification' in data:
            budget.justification = data['justification']
        
        if 'implementation_start_date' in data:
            if data['implementation_start_date']:
                budget.implementation_start_date = datetime.strptime(data['implementation_start_date'], '%Y-%m-%d')
            else:
                budget.implementation_start_date = None
        
        if 'implementation_end_date' in data:
            if data['implementation_end_date']:
                budget.implementation_end_date = datetime.strptime(data['implementation_end_date'], '%Y-%m-%d')
            else:
                budget.implementation_end_date = None
        
        if 'implementation_notes' in data:
            budget.implementation_notes = data['implementation_notes']
        
        db.session.commit()
        
        return jsonify(budget.to_dict()), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating budget {budget_id}: {str(e)}")
        return jsonify({'error': 'Failed to update budget'}), 500

@finance_bp.route('/budgets/<budget_id>/submit', methods=['POST'])
@jwt_required()
@require_permission('finance.submit')
def submit_budget(budget_id):
    """Submit a budget for review"""
    try:
        budget = Budget.query.get(budget_id)
        if not budget:
            return jsonify({'error': 'Budget not found'}), 404
        
        if budget.status != BudgetStatus.DRAFT:
            return jsonify({'error': 'Only draft budgets can be submitted'}), 400
        
        current_user_id = get_jwt_identity()
        
        budget.status = BudgetStatus.SUBMITTED
        budget.submitted_by = current_user_id
        budget.submitted_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify(budget.to_dict()), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error submitting budget {budget_id}: {str(e)}")
        return jsonify({'error': 'Failed to submit budget'}), 500

@finance_bp.route('/budgets/<budget_id>/approve', methods=['POST'])
@jwt_required()
@require_permission('finance.approve')
def approve_budget(budget_id):
    """Approve a budget"""
    try:
        budget = Budget.query.get(budget_id)
        if not budget:
            return jsonify({'error': 'Budget not found'}), 404
        
        if budget.status not in [BudgetStatus.SUBMITTED, BudgetStatus.UNDER_REVIEW]:
            return jsonify({'error': 'Only submitted or under review budgets can be approved'}), 400
        
        current_user_id = get_jwt_identity()
        
        budget.status = BudgetStatus.APPROVED
        budget.approved_by = current_user_id
        budget.approved_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify(budget.to_dict()), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error approving budget {budget_id}: {str(e)}")
        return jsonify({'error': 'Failed to approve budget'}), 500

@finance_bp.route('/budgets/<budget_id>/reject', methods=['POST'])
@jwt_required()
@require_permission('finance.approve')
def reject_budget(budget_id):
    """Reject a budget"""
    try:
        budget = Budget.query.get(budget_id)
        if not budget:
            return jsonify({'error': 'Budget not found'}), 404
        
        if budget.status not in [BudgetStatus.SUBMITTED, BudgetStatus.UNDER_REVIEW]:
            return jsonify({'error': 'Only submitted or under review budgets can be rejected'}), 400
        
        data = request.get_json()
        rejection_reason = data.get('rejection_reason', '')
        
        if not rejection_reason:
            return jsonify({'error': 'Rejection reason is required'}), 400
        
        current_user_id = get_jwt_identity()
        
        budget.status = BudgetStatus.REJECTED
        budget.approved_by = current_user_id
        budget.approved_at = datetime.utcnow()
        budget.rejection_reason = rejection_reason
        
        db.session.commit()
        
        return jsonify(budget.to_dict()), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error rejecting budget {budget_id}: {str(e)}")
        return jsonify({'error': 'Failed to reject budget'}), 500

# Budget Item endpoints
@finance_bp.route('/budgets/<budget_id>/items', methods=['GET'])
@jwt_required()
@require_permission('finance.read')
def get_budget_items(budget_id):
    """Get budget items for a budget"""
    try:
        budget = Budget.query.get(budget_id)
        if not budget:
            return jsonify({'error': 'Budget not found'}), 404
        
        items = BudgetItem.query.filter_by(budget_id=budget_id).all()
        
        return jsonify([item.to_dict() for item in items]), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching budget items for {budget_id}: {str(e)}")
        return jsonify({'error': 'Failed to fetch budget items'}), 500

@finance_bp.route('/budgets/<budget_id>/items', methods=['POST'])
@jwt_required()
@require_permission('finance.update')
def add_budget_item(budget_id):
    """Add a budget item to a budget"""
    try:
        budget = Budget.query.get(budget_id)
        if not budget:
            return jsonify({'error': 'Budget not found'}), 404
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['category', 'item_name', 'allocated_amount']
        validation_error = validate_required_fields(data, required_fields)
        if validation_error:
            return jsonify({'error': validation_error}), 400
        
        # Create budget item
        item = BudgetItem(
            budget_id=budget_id,
            category=data['category'],
            item_name=data['item_name'],
            description=data.get('description', ''),
            allocated_amount=data['allocated_amount'],
            remaining_amount=data['allocated_amount'],
            priority=data.get('priority', 'medium'),
            quarter=data.get('quarter'),
            expected_completion_date=datetime.strptime(data['expected_completion_date'], '%Y-%m-%d') if data.get('expected_completion_date') else None,
            status=data.get('status', 'planned')
        )
        
        db.session.add(item)
        db.session.commit()
        
        return jsonify(item.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error adding budget item for {budget_id}: {str(e)}")
        return jsonify({'error': 'Failed to add budget item'}), 500

# Expense endpoints
@finance_bp.route('/expenses', methods=['GET'])
@jwt_required()
@require_permission('finance.read')
def get_expenses():
    """Get all expenses with filtering and pagination"""
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('limit', 10, type=int)
        status = request.args.get('status')
        budget_id = request.args.get('budget_id')
        expense_type = request.args.get('expense_type')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        search = request.args.get('search')
        
        # Build query
        query = Expense.query
        
        # Apply filters
        if status:
            query = query.filter(Expense.status == status)
        
        if budget_id:
            query = query.filter(Expense.budget_id == budget_id)
        
        if expense_type:
            query = query.filter(Expense.expense_type == expense_type)
        
        if date_from:
            try:
                date_from_obj = datetime.strptime(date_from, '%Y-%m-%d')
                query = query.filter(Expense.expense_date >= date_from_obj)
            except ValueError:
                return jsonify({'error': 'Invalid date_from format. Use YYYY-MM-DD'}), 400
        
        if date_to:
            try:
                date_to_obj = datetime.strptime(date_to, '%Y-%m-%d')
                query = query.filter(Expense.expense_date <= date_to_obj)
            except ValueError:
                return jsonify({'error': 'Invalid date_to format. Use YYYY-MM-DD'}), 400
        
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                db.or_(
                    Expense.description.ilike(search_term),
                    Expense.vendor_name.ilike(search_term)
                )
            )
        
        # Order by expense date (newest first)
        query = query.order_by(Expense.expense_date.desc())
        
        # Paginate
        total = query.count()
        expenses = query.offset((page - 1) * per_page).limit(per_page).all()
        
        return jsonify({
            'expenses': [expense.to_dict() for expense in expenses],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': math.ceil(total / per_page)
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching expenses: {str(e)}")
        return jsonify({'error': 'Failed to fetch expenses'}), 500

@finance_bp.route('/expenses', methods=['POST'])
@jwt_required()
@require_permission('finance.create')
def create_expense():
    """Create a new expense"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['budget_id', 'expense_type', 'description', 'amount', 'expense_date']
        validation_error = validate_required_fields(data, required_fields)
        if validation_error:
            return jsonify({'error': validation_error}), 400
        
        # Validate budget exists
        budget = Budget.query.get(data['budget_id'])
        if not budget:
            return jsonify({'error': 'Budget not found'}), 400
        
        # Validate expense date
        try:
            expense_date = datetime.strptime(data['expense_date'], '%Y-%m-%d')
        except ValueError:
            return jsonify({'error': 'Invalid expense date format. Use YYYY-MM-DD'}), 400
        
        current_user_id = get_jwt_identity()
        
        # Create expense
        expense = Expense(
            budget_id=data['budget_id'],
            budget_item_id=data.get('budget_item_id'),
            expense_type=data['expense_type'],
            description=data['description'],
            amount=data['amount'],
            vendor_name=data.get('vendor_name'),
            vendor_address=data.get('vendor_address'),
            vendor_contact=data.get('vendor_contact'),
            invoice_number=data.get('invoice_number'),
            invoice_date=datetime.strptime(data['invoice_date'], '%Y-%m-%d') if data.get('invoice_date') else None,
            expense_date=expense_date,
            payment_due_date=datetime.strptime(data['payment_due_date'], '%Y-%m-%d') if data.get('payment_due_date') else None,
            submitted_by=current_user_id,
            payment_method=data.get('payment_method'),
            notes=data.get('notes'),
            tags=data.get('tags')
        )
        
        db.session.add(expense)
        db.session.commit()
        
        return jsonify(expense.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating expense: {str(e)}")
        return jsonify({'error': 'Failed to create expense'}), 500

@finance_bp.route('/expenses/<expense_id>/approve', methods=['POST'])
@jwt_required()
@require_permission('finance.approve')
def approve_expense(expense_id):
    """Approve an expense"""
    try:
        expense = Expense.query.get(expense_id)
        if not expense:
            return jsonify({'error': 'Expense not found'}), 404
        
        if expense.status != ExpenseStatus.PENDING:
            return jsonify({'error': 'Only pending expenses can be approved'}), 400
        
        current_user_id = get_jwt_identity()
        
        expense.status = ExpenseStatus.APPROVED
        expense.approved_by = current_user_id
        expense.approved_at = datetime.utcnow()
        
        # Update budget spent amount
        budget = Budget.query.get(expense.budget_id)
        if budget:
            budget.total_spent += expense.amount
            budget.calculate_remaining()
            
            # Update budget item spent amount if specified
            if expense.budget_item_id:
                budget_item = BudgetItem.query.get(expense.budget_item_id)
                if budget_item:
                    budget_item.spent_amount += expense.amount
                    budget_item.calculate_remaining()
        
        db.session.commit()
        
        return jsonify(expense.to_dict()), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error approving expense {expense_id}: {str(e)}")
        return jsonify({'error': 'Failed to approve expense'}), 500

@finance_bp.route('/expenses/<expense_id>/reject', methods=['POST'])
@jwt_required()
@require_permission('finance.approve')
def reject_expense(expense_id):
    """Reject an expense"""
    try:
        expense = Expense.query.get(expense_id)
        if not expense:
            return jsonify({'error': 'Expense not found'}), 404
        
        if expense.status != ExpenseStatus.PENDING:
            return jsonify({'error': 'Only pending expenses can be rejected'}), 400
        
        data = request.get_json()
        rejection_reason = data.get('rejection_reason', '')
        
        if not rejection_reason:
            return jsonify({'error': 'Rejection reason is required'}), 400
        
        current_user_id = get_jwt_identity()
        
        expense.status = ExpenseStatus.REJECTED
        expense.approved_by = current_user_id
        expense.approved_at = datetime.utcnow()
        expense.rejection_reason = rejection_reason
        
        db.session.commit()
        
        return jsonify(expense.to_dict()), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error rejecting expense {expense_id}: {str(e)}")
        return jsonify({'error': 'Failed to reject expense'}), 500

# Financial Report endpoints
@finance_bp.route('/reports', methods=['GET'])
@jwt_required()
@require_permission('finance.read')
def get_reports():
    """Get all financial reports with filtering and pagination"""
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('limit', 10, type=int)
        report_type = request.args.get('report_type')
        fiscal_year = request.args.get('fiscal_year')
        status = request.args.get('status')
        
        # Build query
        query = FinancialReport.query
        
        # Apply filters
        if report_type:
            query = query.filter(FinancialReport.report_type == report_type)
        
        if fiscal_year:
            query = query.filter(FinancialReport.fiscal_year == fiscal_year)
        
        if status:
            query = query.filter(FinancialReport.status == status)
        
        # Order by generated date (newest first)
        query = query.order_by(FinancialReport.generated_at.desc())
        
        # Paginate
        total = query.count()
        reports = query.offset((page - 1) * per_page).limit(per_page).all()
        
        return jsonify({
            'reports': [report.to_dict() for report in reports],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': math.ceil(total / per_page)
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching financial reports: {str(e)}")
        return jsonify({'error': 'Failed to fetch financial reports'}), 500

@finance_bp.route('/reports', methods=['POST'])
@jwt_required()
@require_permission('finance.create')
def create_report():
    """Create a new financial report"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['report_type', 'title', 'fiscal_year', 'period_start', 'period_end']
        validation_error = validate_required_fields(data, required_fields)
        if validation_error:
            return jsonify({'error': validation_error}), 400
        
        # Validate dates
        try:
            period_start = datetime.strptime(data['period_start'], '%Y-%m-%d')
            period_end = datetime.strptime(data['period_end'], '%Y-%m-%d')
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        current_user_id = get_jwt_identity()
        
        # Create report
        report = FinancialReport(
            report_type=data['report_type'],
            title=data['title'],
            description=data.get('description', ''),
            fiscal_year=data['fiscal_year'],
            period_start=period_start,
            period_end=period_end,
            content=data.get('content', ''),
            summary=data.get('summary', ''),
            recommendations=data.get('recommendations', ''),
            generated_by=current_user_id,
            file_path=data.get('file_path'),
            file_name=data.get('file_name'),
            file_size=data.get('file_size')
        )
        
        db.session.add(report)
        db.session.commit()
        
        return jsonify(report.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating financial report: {str(e)}")
        return jsonify({'error': 'Failed to create financial report'}), 500

# Statistics endpoint
@finance_bp.route('/stats', methods=['GET'])
@jwt_required()
@require_permission('finance.read')
def get_finance_stats():
    """Get finance statistics"""
    try:
        # Get query parameters
        fiscal_year = request.args.get('fiscal_year')
        
        # Build date filter
        if not fiscal_year:
            fiscal_year = datetime.utcnow().year
        
        # Get budget statistics
        total_budgets = Budget.query.filter_by(fiscal_year=fiscal_year).count()
        approved_budgets = Budget.query.filter_by(fiscal_year=fiscal_year, status=BudgetStatus.APPROVED).count()
        
        total_allocated = db.session.query(db.func.sum(Budget.total_allocated)).filter_by(fiscal_year=fiscal_year).scalar() or 0
        total_spent = db.session.query(db.func.sum(Budget.total_spent)).filter_by(fiscal_year=fiscal_year).scalar() or 0
        
        # Get expense statistics
        total_expenses = Expense.join(Budget).filter(Budget.fiscal_year == fiscal_year).count()
        pending_expenses = Expense.join(Budget).filter(
            Budget.fiscal_year == fiscal_year,
            Expense.status == ExpenseStatus.PENDING
        ).count()
        
        total_expense_amount = db.session.query(db.func.sum(Expense.amount)).join(Budget).filter(
            Budget.fiscal_year == fiscal_year,
            Expense.status == ExpenseStatus.APPROVED
        ).scalar() or 0
        
        return jsonify({
            'fiscal_year': fiscal_year,
            'budgets': {
                'total': total_budgets,
                'approved': approved_budgets,
                'total_allocated': total_allocated,
                'total_spent': total_spent,
                'remaining': total_allocated - total_spent,
                'utilization_percent': round((total_spent / total_allocated * 100) if total_allocated > 0 else 0, 2)
            },
            'expenses': {
                'total': total_expenses,
                'pending': pending_expenses,
                'total_amount': total_expense_amount
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching finance statistics: {str(e)}")
        return jsonify({'error': 'Failed to fetch finance statistics'}), 500