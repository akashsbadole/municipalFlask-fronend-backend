from flask import Blueprint, request, jsonify, send_file
from datetime import datetime, timedelta
import pandas as pd
import io
import uuid
from models.user import User
from models.citizen import Citizen
from models.property import Property
from models.property_tax import PropertyTax
from models.complaint import Complaint
from models.trade_license import TradeLicense
from models.building_plan import BuildingPlan
from models.waste_collection import WasteCollection
from models.water_connection import WaterConnection
from models.streetlight import Streetlight
from models.health import HealthInspection, HealthViolation, HealthReport, HealthSchedule
from models.finance import Budget, Expense
from models.employee import Employee
from models.payroll import Payroll
from models.public_work import PublicWork
from models.tender import Tender
from models.disaster_alert import DisasterAlert
from extensions import db
from utils.auth import token_required, check_permission

reports_bp = Blueprint('reports', __name__, url_prefix='/reports')

# Helper function to generate date range filters
def get_date_range_filter():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    if start_date:
        start_date = datetime.strptime(start_date, '%Y-%m-%d')
    else:
        start_date = datetime.utcnow() - timedelta(days=30)  # Default to last 30 days
    
    if end_date:
        end_date = datetime.strptime(end_date, '%Y-%m-%d')
    else:
        end_date = datetime.utcnow()
    
    return start_date, end_date

# Revenue Reports
@reports_bp.route('/revenue/property-tax', methods=['GET'])
@token_required
@check_permission('reports.read')
def get_property_tax_revenue_report(current_user):
    try:
        start_date, end_date = get_date_range_filter()
        ward = request.args.get('ward')
        zone = request.args.get('zone')
        
        # Query property taxes paid within the date range
        query = db.session.query(
            PropertyTax.property_id,
            Property.ward,
            Property.zone,
            PropertyTax.amount,
            PropertyTax.paid_date,
            PropertyTax.payment_method
        ).join(Property, PropertyTax.property_id == Property.id
        ).filter(
            PropertyTax.paid_date.between(start_date, end_date),
            PropertyTax.status == 'Paid'
        )
        
        if ward:
            query = query.filter(Property.ward == ward)
        if zone:
            query = query.filter(Property.zone == zone)
        
        results = query.all()
        
        # Process data for report
        data = []
        total_revenue = 0
        
        for result in results:
            total_revenue += result.amount
            data.append({
                'property_id': result.property_id,
                'ward': result.ward,
                'zone': result.zone,
                'amount': float(result.amount),
                'paid_date': result.paid_date.strftime('%Y-%m-%d'),
                'payment_method': result.payment_method
            })
        
        # Group by ward/zone for summary
        ward_summary = {}
        zone_summary = {}
        
        for item in data:
            ward = item['ward']
            zone = item['zone']
            amount = item['amount']
            
            if ward not in ward_summary:
                ward_summary[ward] = 0
            ward_summary[ward] += amount
            
            if zone not in zone_summary:
                zone_summary[zone] = 0
            zone_summary[zone] += amount
        
        return jsonify({
            'summary': {
                'total_revenue': total_revenue,
                'total_transactions': len(data),
                'period_start': start_date.strftime('%Y-%m-%d'),
                'period_end': end_date.strftime('%Y-%m-%d'),
                'ward_breakdown': ward_summary,
                'zone_breakdown': zone_summary
            },
            'transactions': data
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/revenue/licenses', methods=['GET'])
@token_required
@check_permission('reports.read')
def get_license_revenue_report(current_user):
    try:
        start_date, end_date = get_date_range_filter()
        license_type = request.args.get('license_type')
        
        # Query license fees paid within the date range
        query = db.session.query(
            TradeLicense.id,
            TradeLicense.license_number,
            TradeLicense.license_type,
            TradeLicense.business_name,
            TradeLicense.fee_amount,
            TradeLicense.payment_date,
            TradeLicense.status
        ).filter(
            TradeLicense.payment_date.between(start_date, end_date),
            TradeLicense.status == 'Active'
        )
        
        if license_type:
            query = query.filter(TradeLicense.license_type == license_type)
        
        results = query.all()
        
        # Process data for report
        data = []
        total_revenue = 0
        
        for result in results:
            total_revenue += result.fee_amount
            data.append({
                'license_id': result.id,
                'license_number': result.license_number,
                'license_type': result.license_type,
                'business_name': result.business_name,
                'amount': float(result.fee_amount),
                'payment_date': result.payment_date.strftime('%Y-%m-%d'),
                'status': result.status
            })
        
        # Group by license type for summary
        type_summary = {}
        for item in data:
            license_type = item['license_type']
            amount = item['amount']
            
            if license_type not in type_summary:
                type_summary[license_type] = {'count': 0, 'revenue': 0}
            type_summary[license_type]['count'] += 1
            type_summary[license_type]['revenue'] += amount
        
        return jsonify({
            'summary': {
                'total_revenue': total_revenue,
                'total_licenses': len(data),
                'period_start': start_date.strftime('%Y-%m-%d'),
                'period_end': end_date.strftime('%Y-%m-%d'),
                'type_breakdown': type_summary
            },
            'licenses': data
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Service Delivery Reports
@reports_bp.route('/service/complaints', methods=['GET'])
@token_required
@check_permission('reports.read')
def get_complaint_service_report(current_user):
    try:
        start_date, end_date = get_date_range_filter()
        category = request.args.get('category')
        status = request.args.get('status')
        
        # Query complaints within the date range
        query = Complaint.query.filter(
            Complaint.created_at.between(start_date, end_date)
        )
        
        if category:
            query = query.filter(Complaint.category_id == category)
        if status:
            query = query.filter(Complaint.status == status)
        
        complaints = query.all()
        
        # Process data for report
        data = []
        category_stats = {}
        resolution_times = []
        
        for complaint in complaints:
            resolution_time = None
            if complaint.resolved_at:
                resolution_time = (complaint.resolved_at - complaint.created_at).days
                resolution_times.append(resolution_time)
            
            category_name = complaint.category.name if complaint.category else 'Unknown'
            
            if category_name not in category_stats:
                category_stats[category_name] = {
                    'total': 0,
                    'pending': 0,
                    'in_progress': 0,
                    'resolved': 0,
                    'closed': 0
                }
            
            category_stats[category_name]['total'] += 1
            category_stats[category_name][complaint.status.lower().replace(' ', '_')] += 1
            
            data.append({
                'id': complaint.id,
                'title': complaint.title,
                'category': category_name,
                'status': complaint.status,
                'priority': complaint.priority,
                'created_at': complaint.created_at.strftime('%Y-%m-%d'),
                'resolved_at': complaint.resolved_at.strftime('%Y-%m-%d') if complaint.resolved_at else None,
                'resolution_time': resolution_time
            })
        
        # Calculate average resolution time
        avg_resolution_time = sum(resolution_times) / len(resolution_times) if resolution_times else 0
        
        return jsonify({
            'summary': {
                'total_complaints': len(complaints),
                'avg_resolution_time': avg_resolution_time,
                'period_start': start_date.strftime('%Y-%m-%d'),
                'period_end': end_date.strftime('%Y-%m-%d'),
                'category_breakdown': category_stats
            },
            'complaints': data
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@reports_bp.route('/service/waste-collection', methods=['GET'])
@token_required
@check_permission('reports.read')
def get_waste_collection_report(current_user):
    try:
        start_date, end_date = get_date_range_filter()
        route_id = request.args.get('route_id')
        
        # Query waste collections within the date range
        query = db.session.query(
            WasteCollection.id,
            WasteCollection.route_id,
            WasteCollection.date,
            WasteCollection.status,
            WasteCollection.waste_collected,
            WasteCollection.vehicles_used,
            WasteCollection.staff_count,
            WasteCollection.start_time,
            WasteCollection.end_time
        ).filter(
            WasteCollection.date.between(start_date, end_date)
        )
        
        if route_id:
            query = query.filter(WasteCollection.route_id == route_id)
        
        results = query.all()
        
        # Process data for report
        data = []
        total_waste = 0
        route_stats = {}
        
        for result in results:
            duration = None
            if result.start_time and result.end_time:
                start = datetime.strptime(result.start_time, '%H:%M:%S')
                end = datetime.strptime(result.end_time, '%H:%M:%S')
                duration = (end - start).seconds / 3600  # Convert to hours
            
            total_waste += result.waste_collected or 0
            
            if result.route_id not in route_stats:
                route_stats[result.route_id] = {
                    'collections': 0,
                    'total_waste': 0,
                    'completed': 0
                }
            
            route_stats[result.route_id]['collections'] += 1
            route_stats[result.route_id]['total_waste'] += result.waste_collected or 0
            if result.status == 'Completed':
                route_stats[result.route_id]['completed'] += 1
            
            data.append({
                'id': result.id,
                'route_id': result.route_id,
                'date': result.date.strftime('%Y-%m-%d'),
                'status': result.status,
                'waste_collected': result.waste_collected,
                'vehicles_used': result.vehicles_used,
                'staff_count': result.staff_count,
                'duration_hours': duration
            })
        
        return jsonify({
            'summary': {
                'total_collections': len(results),
                'total_waste_collected': total_waste,
                'period_start': start_date.strftime('%Y-%m-%d'),
                'period_end': end_date.strftime('%Y-%m-%d'),
                'route_breakdown': route_stats
            },
            'collections': data
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# HR Reports
@reports_bp.route('/hr/attendance', methods=['GET'])
@token_required
@check_permission('reports.read')
def get_attendance_report(current_user):
    try:
        start_date, end_date = get_date_range_filter()
        department = request.args.get('department')
        
        # Query employee attendance within the date range
        query = db.session.query(
            Employee.id,
            Employee.first_name,
            Employee.last_name,
            Employee.employee_id,
            Employee.department,
            Employee.designation
        ).filter(
            Employee.status == 'Active'
        )
        
        if department:
            query = query.filter(Employee.department == department)
        
        employees = query.all()
        
        # Process data for report
        data = []
        department_stats = {}
        
        for employee in employees:
            # Get attendance records for this employee
            attendance_records = db.session.query(
                'date', 'status', 'check_in', 'check_out'
            ).filter(
                db.text("employee_id = :emp_id AND date BETWEEN :start_date AND :end_date"),
                emp_id=employee.id,
                start_date=start_date.strftime('%Y-%m-%d'),
                end_date=end_date.strftime('%Y-%m-%d')
            ).all()
            
            present_days = sum(1 for record in attendance_records if record.status == 'Present')
            absent_days = sum(1 for record in attendance_records if record.status == 'Absent')
            late_days = sum(1 for record in attendance_records if record.status == 'Late')
            
            dept = employee.department
            if dept not in department_stats:
                department_stats[dept] = {
                    'total_employees': 0,
                    'present_days': 0,
                    'absent_days': 0,
                    'late_days': 0
                }
            
            department_stats[dept]['total_employees'] += 1
            department_stats[dept]['present_days'] += present_days
            department_stats[dept]['absent_days'] += absent_days
            department_stats[dept]['late_days'] += late_days
            
            data.append({
                'employee_id': employee.id,
                'employee_number': employee.employee_id,
                'name': f"{employee.first_name} {employee.last_name}",
                'department': employee.department,
                'designation': employee.designation,
                'present_days': present_days,
                'absent_days': absent_days,
                'late_days': late_days,
                'total_working_days': len(attendance_records)
            })
        
        return jsonify({
            'summary': {
                'total_employees': len(employees),
                'period_start': start_date.strftime('%Y-%m-%d'),
                'period_end': end_date.strftime('%Y-%m-%d'),
                'department_breakdown': department_stats
            },
            'employees': data
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Project Progress Reports
@reports_bp.route('/projects/progress', methods=['GET'])
@token_required
@check_permission('reports.read')
def get_project_progress_report(current_user):
    try:
        project_type = request.args.get('project_type')
        status = request.args.get('status')
        
        # Query projects
        query = PublicWork.query
        
        if project_type:
            query = query.filter(PublicWork.project_type == project_type)
        if status:
            query = query.filter(PublicWork.status == status)
        
        projects = query.all()
        
        # Process data for report
        data = []
        type_stats = {}
        status_stats = {}
        delayed_projects = 0
        
        for project in projects:
            proj_type = project.project_type
            proj_status = project.status
            
            if proj_type not in type_stats:
                type_stats[proj_type] = {
                    'total': 0,
                    'estimated_cost': 0,
                    'actual_cost': 0,
                    'avg_progress': 0
                }
            
            if proj_status not in status_stats:
                status_stats[proj_status] = 0
            
            type_stats[proj_type]['total'] += 1
            type_stats[proj_type]['estimated_cost'] += project.estimated_cost
            type_stats[proj_type]['actual_cost'] += project.actual_cost
            type_stats[proj_type]['avg_progress'] += project.progress_percentage
            status_stats[proj_status] += 1
            
            if project.is_delayed:
                delayed_projects += 1
            
            data.append({
                'id': project.id,
                'project_code': project.project_code,
                'title': project.title,
                'type': project.project_type,
                'status': project.status,
                'progress_percentage': project.progress_percentage,
                'estimated_cost': float(project.estimated_cost),
                'actual_cost': float(project.actual_cost),
                'start_date': project.start_date.strftime('%Y-%m-%d'),
                'planned_end_date': project.planned_end_date.strftime('%Y-%m-%d'),
                'is_delayed': project.is_delayed,
                'duration_days': project.duration_days
            })
        
        # Calculate averages for each type
        for type_name in type_stats:
            if type_stats[type_name]['total'] > 0:
                type_stats[type_name]['avg_progress'] /= type_stats[type_name]['total']
        
        return jsonify({
            'summary': {
                'total_projects': len(projects),
                'delayed_projects': delayed_projects,
                'type_breakdown': type_stats,
                'status_breakdown': status_stats
            },
            'projects': data
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Financial Reports
@reports_bp.route('/financial/budget-utilization', methods=['GET'])
@token_required
@check_permission('reports.read')
def get_budget_utilization_report(current_user):
    try:
        year = request.args.get('year', datetime.utcnow().year)
        department = request.args.get('department')
        
        # Query budgets for the year
        start_date = datetime(year, 4, 1)  # Assuming fiscal year starts in April
        end_date = datetime(year + 1, 3, 31)
        
        query = db.session.query(
            Budget.id,
            Budget.department,
            Budget.total_amount,
            Budget.approved_amount,
            Budget.status
        ).filter(
            Budget.fiscal_year == year
        )
        
        if department:
            query = query.filter(Budget.department == department)
        
        budgets = query.all()
        
        # Process data for report
        data = []
        total_budget = 0
        total_expenses = 0
        
        for budget in budgets:
            # Get expenses for this budget
            expenses = db.session.query(
                'SUM(amount)'
            ).filter(
                db.text("budget_id = :budget_id AND date BETWEEN :start_date AND :end_date"),
                budget_id=budget.id,
                start_date=start_date.strftime('%Y-%m-%d'),
                end_date=end_date.strftime('%Y-%m-%d')
            ).scalar() or 0
            
            total_budget += budget.approved_amount
            total_expenses += expenses
            
            utilization_percentage = (expenses / budget.approved_amount * 100) if budget.approved_amount > 0 else 0
            
            data.append({
                'budget_id': budget.id,
                'department': budget.department,
                'total_amount': float(budget.total_amount),
                'approved_amount': float(budget.approved_amount),
                'expenses': float(expenses),
                'remaining': float(budget.approved_amount - expenses),
                'utilization_percentage': utilization_percentage,
                'status': budget.status
            })
        
        overall_utilization = (total_expenses / total_budget * 100) if total_budget > 0 else 0
        
        return jsonify({
            'summary': {
                'fiscal_year': year,
                'total_budget': total_budget,
                'total_expenses': total_expenses,
                'overall_utilization': overall_utilization,
                'remaining_budget': total_budget - total_expenses
            },
            'departments': data
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Citizen Engagement Reports
@reports_bp.route('/citizen/engagement', methods=['GET'])
@token_required
@check_permission('reports.read')
def get_citizen_engagement_report(current_user):
    try:
        start_date, end_date = get_date_range_filter()
        
        # Get citizen registration trends
        new_citizens = Citizen.query.filter(
            Citizen.created_at.between(start_date, end_date)
        ).count()
        
        # Get service usage statistics
        total_complaints = Complaint.query.filter(
            Complaint.created_at.between(start_date, end_date)
        ).count()
        
        total_property_tax_paid = PropertyTax.query.filter(
            PropertyTax.paid_date.between(start_date, end_date),
            PropertyTax.status == 'Paid'
        ).count()
        
        total_license_applications = TradeLicense.query.filter(
            TradeLicense.created_at.between(start_date, end_date)
        ).count()
        
        # Get ward-wise breakdown
        wards = db.session.query(
            Property.ward,
            db.func.count(Property.id).label('count')
        ).join(Citizen, Property.citizen_id == Citizen.id
        ).group_by(Property.ward
        ).all()
        
        ward_breakdown = {ward: count for ward, count in wards}
        
        # Get satisfaction ratings from resolved complaints
        satisfied_complaints = Complaint.query.filter(
            Complaint.created_at.between(start_date, end_date),
            Complaint.status == 'Closed',
            Complaint.rating >= 4
        ).count()
        
        total_closed_complaints = Complaint.query.filter(
            Complaint.created_at.between(start_date, end_date),
            Complaint.status == 'Closed'
        ).count()
        
        satisfaction_rate = (satisfied_complaints / total_closed_complaints * 100) if total_closed_complaints > 0 else 0
        
        return jsonify({
            'summary': {
                'period_start': start_date.strftime('%Y-%m-%d'),
                'period_end': end_date.strftime('%Y-%m-%d'),
                'new_citizens': new_citizens,
                'total_complaints': total_complaints,
                'property_tax_paid': total_property_tax_paid,
                'license_applications': total_license_applications,
                'satisfaction_rate': satisfaction_rate,
                'ward_breakdown': ward_breakdown
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Dashboard Analytics
@reports_bp.route('/dashboard/municipal', methods=['GET'])
@token_required
@check_permission('reports.read')
def get_municipal_dashboard(current_user):
    try:
        # Get current date and previous month
        today = datetime.utcnow()
        last_month = today - timedelta(days=30)
        
        # Revenue metrics
        current_month_tax = db.session.query(
            db.func.sum(PropertyTax.amount)
        ).filter(
            PropertyTax.paid_date >= last_month,
            PropertyTax.status == 'Paid'
        ).scalar() or 0
        
        last_month_tax = db.session.query(
            db.func.sum(PropertyTax.amount)
        ).filter(
            PropertyTax.paid_date >= last_month - timedelta(days=30),
            PropertyTax.paid_date < last_month,
            PropertyTax.status == 'Paid'
        ).scalar() or 0
        
        tax_growth = ((current_month_tax - last_month_tax) / last_month_tax * 100) if last_month_tax > 0 else 0
        
        # Service metrics
        pending_complaints = Complaint.query.filter_by(status='Pending').count()
        resolved_this_month = Complaint.query.filter(
            Complaint.resolved_at >= last_month,
            Complaint.status == 'Closed'
        ).count()
        
        # Project metrics
        active_projects = PublicWork.query.filter_by(status='In Progress').count()
        delayed_projects = PublicWork.query.filter_by(is_delayed=True).count()
        
        # Citizen metrics
        total_citizens = Citizen.query.count()
        new_citizens_this_month = Citizen.query.filter(
            Citizen.created_at >= last_month
        ).count()
        
        # Financial metrics
        current_year_budget = Budget.query.filter_by(fiscal_year=today.year, status='Approved').all()
        total_budget = sum(budget.approved_amount for budget in current_year_budget)
        
        current_year_expenses = db.session.query(
            db.func.sum(Expense.amount)
        ).filter(
            Expense.date >= datetime(today.year, 4, 1),  # Fiscal year start
            Expense.date <= datetime(today.year + 1, 3, 31)  # Fiscal year end
        ).scalar() or 0
        
        budget_utilization = (current_year_expenses / total_budget * 100) if total_budget > 0 else 0
        
        return jsonify({
            'revenue_metrics': {
                'current_month_tax': float(current_month_tax),
                'tax_growth': tax_growth
            },
            'service_metrics': {
                'pending_complaints': pending_complaints,
                'resolved_this_month': resolved_this_month
            },
            'project_metrics': {
                'active_projects': active_projects,
                'delayed_projects': delayed_projects
            },
            'citizen_metrics': {
                'total_citizens': total_citizens,
                'new_citizens_this_month': new_citizens_this_month
            },
            'financial_metrics': {
                'total_budget': float(total_budget),
                'current_year_expenses': float(current_year_expenses),
                'budget_utilization': budget_utilization
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Export Reports
@reports_bp.route('/export/<report_type>', methods=['GET'])
@token_required
@check_permission('reports.read')
def export_report(current_user, report_type):
    try:
        start_date, end_date = get_date_range_filter()
        
        # Get data based on report type
        if report_type == 'property_tax':
            data = get_property_tax_revenue_report_data(start_date, end_date)
            filename = f"property_tax_report_{start_date.strftime('%Y%m%d')}_to_{end_date.strftime('%Y%m%d')}.csv"
        elif report_type == 'complaints':
            data = get_complaint_service_report_data(start_date, end_date)
            filename = f"complaint_report_{start_date.strftime('%Y%m%d')}_to_{end_date.strftime('%Y%m%d')}.csv"
        else:
            return jsonify({'error': 'Invalid report type'}), 400
        
        # Create CSV file
        df = pd.DataFrame(data)
        csv_buffer = io.StringIO()
        df.to_csv(csv_buffer, index=False)
        csv_buffer.seek(0)
        
        return send_file(
            io.BytesIO(csv_buffer.getvalue().encode('utf-8')),
            mimetype='text/csv',
            as_attachment=True,
            download_name=filename
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Helper functions for data extraction (to be used by export function)
def get_property_tax_revenue_report_data(start_date, end_date):
    query = db.session.query(
        Property.id,
        Property.property_number,
        Property.ward,
        Property.zone,
        PropertyTax.amount,
        PropertyTax.paid_date,
        PropertyTax.payment_method
    ).join(PropertyTax, Property.id == PropertyTax.property_id
    ).filter(
        PropertyTax.paid_date.between(start_date, end_date),
        PropertyTax.status == 'Paid'
    ).all()
    
    data = []
    for result in query:
        data.append({
            'Property ID': result.property_number,
            'Ward': result.ward,
            'Zone': result.zone,
            'Amount': result.amount,
            'Payment Date': result.paid_date.strftime('%Y-%m-%d'),
            'Payment Method': result.payment_method
        })
    
    return data

def get_complaint_service_report_data(start_date, end_date):
    query = db.session.query(
        Complaint.id,
        Complaint.title,
        Complaint.description,
        Complaint.status,
        Complaint.priority,
        Complaint.created_at,
        Complaint.resolved_at
    ).filter(
        Complaint.created_at.between(start_date, end_date)
    ).all()
    
    data = []
    for complaint in query:
        data.append({
            'Complaint ID': complaint.id,
            'Title': complaint.title,
            'Description': complaint.description,
            'Status': complaint.status,
            'Priority': complaint.priority,
            'Created Date': complaint.created_at.strftime('%Y-%m-%d'),
            'Resolved Date': complaint.resolved_at.strftime('%Y-%m-%d') if complaint.resolved_at else ''
        })
    
    return data