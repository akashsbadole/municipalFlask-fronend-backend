from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.base import db
from models.health import HealthInspection, HealthViolation, HealthReport, HealthSchedule, InspectionType, InspectionStatus, ViolationSeverity
from models.user import User
from utils.permissions import require_permission
from utils.validators import validate_required_fields
from datetime import datetime, timedelta
import math

health_bp = Blueprint('health', __name__, url_prefix='/health')

@health_bp.route('/inspections', methods=['GET'])
@jwt_required()
@require_permission('health.read')
def get_inspections():
    """Get all health inspections with filtering and pagination"""
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('limit', 10, type=int)
        status = request.args.get('status')
        establishment_type = request.args.get('establishment_type')
        inspector_id = request.args.get('inspector_id')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        search = request.args.get('search')
        
        # Build query
        query = HealthInspection.query
        
        # Apply filters
        if status:
            query = query.filter(HealthInspection.status == status)
        
        if establishment_type:
            query = query.filter(HealthInspection.establishment_type == establishment_type)
        
        if inspector_id:
            query = query.filter(HealthInspection.inspector_id == inspector_id)
        
        if date_from:
            try:
                date_from_obj = datetime.strptime(date_from, '%Y-%m-%d')
                query = query.filter(HealthInspection.inspection_date >= date_from_obj)
            except ValueError:
                return jsonify({'error': 'Invalid date_from format. Use YYYY-MM-DD'}), 400
        
        if date_to:
            try:
                date_to_obj = datetime.strptime(date_to, '%Y-%m-%d')
                query = query.filter(HealthInspection.inspection_date <= date_to_obj)
            except ValueError:
                return jsonify({'error': 'Invalid date_to format. Use YYYY-MM-DD'}), 400
        
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                db.or_(
                    HealthInspection.establishment_name.ilike(search_term),
                    HealthInspection.inspector_name.ilike(search_term)
                )
            )
        
        # Order by inspection date
        query = query.order_by(HealthInspection.inspection_date.desc())
        
        # Paginate
        total = query.count()
        inspections = query.offset((page - 1) * per_page).limit(per_page).all()
        
        return jsonify({
            'inspections': [inspection.to_dict() for inspection in inspections],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': math.ceil(total / per_page)
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching health inspections: {str(e)}")
        return jsonify({'error': 'Failed to fetch health inspections'}), 500

@health_bp.route('/inspections/<inspection_id>', methods=['GET'])
@jwt_required()
@require_permission('health.read')
def get_inspection(inspection_id):
    """Get a specific health inspection by ID"""
    try:
        inspection = HealthInspection.query.get(inspection_id)
        if not inspection:
            return jsonify({'error': 'Health inspection not found'}), 404
        
        return jsonify(inspection.to_dict()), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching health inspection {inspection_id}: {str(e)}")
        return jsonify({'error': 'Failed to fetch health inspection'}), 500

@health_bp.route('/inspections', methods=['POST'])
@jwt_required()
@require_permission('health.create')
def create_inspection():
    """Create a new health inspection"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['establishment_id', 'establishment_name', 'establishment_type', 'inspection_date', 'inspector_id']
        validation_error = validate_required_fields(data, required_fields)
        if validation_error:
            return jsonify({'error': validation_error}), 400
        
        # Validate establishment type
        try:
            establishment_type = InspectionType(data['establishment_type'])
        except ValueError:
            return jsonify({'error': 'Invalid establishment type'}), 400
        
        # Validate inspection date
        try:
            inspection_date = datetime.strptime(data['inspection_date'], '%Y-%m-%d')
        except ValueError:
            return jsonify({'error': 'Invalid inspection date format. Use YYYY-MM-DD'}), 400
        
        # Get inspector information
        inspector = User.query.get(data['inspector_id'])
        if not inspector:
            return jsonify({'error': 'Inspector not found'}), 400
        
        # Create new inspection
        inspection = HealthInspection(
            establishment_id=data['establishment_id'],
            establishment_name=data['establishment_name'],
            establishment_type=establishment_type,
            establishment_address=data.get('establishment_address'),
            contact_person=data.get('contact_person'),
            contact_phone=data.get('contact_phone'),
            inspection_type=data.get('inspection_type', 'routine'),
            inspection_date=inspection_date,
            inspection_time=data.get('inspection_time'),
            duration_hours=data.get('duration_hours', 2.0),
            inspector_id=data['inspector_id'],
            inspector_name=f"{inspector.first_name} {inspector.last_name}",
            notes=data.get('notes'),
            weather_conditions=data.get('weather_conditions')
        )
        
        db.session.add(inspection)
        db.session.commit()
        
        return jsonify(inspection.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating health inspection: {str(e)}")
        return jsonify({'error': 'Failed to create health inspection'}), 500

@health_bp.route('/inspections/<inspection_id>', methods=['PUT'])
@jwt_required()
@require_permission('health.update')
def update_inspection(inspection_id):
    """Update a health inspection"""
    try:
        inspection = HealthInspection.query.get(inspection_id)
        if not inspection:
            return jsonify({'error': 'Health inspection not found'}), 404
        
        data = request.get_json()
        
        # Update fields
        if 'establishment_name' in data:
            inspection.establishment_name = data['establishment_name']
        
        if 'establishment_address' in data:
            inspection.establishment_address = data['establishment_address']
        
        if 'contact_person' in data:
            inspection.contact_person = data['contact_person']
        
        if 'contact_phone' in data:
            inspection.contact_phone = data['contact_phone']
        
        if 'inspection_type' in data:
            inspection.inspection_type = data['inspection_type']
        
        if 'inspection_date' in data:
            try:
                inspection.inspection_date = datetime.strptime(data['inspection_date'], '%Y-%m-%d')
            except ValueError:
                return jsonify({'error': 'Invalid inspection date format. Use YYYY-MM-DD'}), 400
        
        if 'inspection_time' in data:
            inspection.inspection_time = data['inspection_time']
        
        if 'duration_hours' in data:
            inspection.duration_hours = data['duration_hours']
        
        if 'status' in data:
            try:
                inspection.status = InspectionStatus(data['status'])
            except ValueError:
                return jsonify({'error': 'Invalid status'}), 400
        
        if 'overall_score' in data:
            inspection.overall_score = data['overall_score']
        
        if 'passed' in data:
            inspection.passed = data['passed']
        
        if 'total_violations' in data:
            inspection.total_violations = data['total_violations']
        
        if 'follow_up_required' in data:
            inspection.follow_up_required = data['follow_up_required']
        
        if 'follow_up_date' in data:
            if data['follow_up_date']:
                try:
                    inspection.follow_up_date = datetime.strptime(data['follow_up_date'], '%Y-%m-%d')
                except ValueError:
                    return jsonify({'error': 'Invalid follow-up date format. Use YYYY-MM-DD'}), 400
            else:
                inspection.follow_up_date = None
        
        if 'follow_up_notes' in data:
            inspection.follow_up_notes = data['follow_up_notes']
        
        if 'notes' in data:
            inspection.notes = data['notes']
        
        if 'weather_conditions' in data:
            inspection.weather_conditions = data['weather_conditions']
        
        db.session.commit()
        
        return jsonify(inspection.to_dict()), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating health inspection {inspection_id}: {str(e)}")
        return jsonify({'error': 'Failed to update health inspection'}), 500

@health_bp.route('/inspections/<inspection_id>', methods=['DELETE'])
@jwt_required()
@require_permission('health.delete')
def delete_inspection(inspection_id):
    """Delete a health inspection"""
    try:
        inspection = HealthInspection.query.get(inspection_id)
        if not inspection:
            return jsonify({'error': 'Health inspection not found'}), 404
        
        db.session.delete(inspection)
        db.session.commit()
        
        return jsonify({'message': 'Health inspection deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting health inspection {inspection_id}: {str(e)}")
        return jsonify({'error': 'Failed to delete health inspection'}), 500

# Violation endpoints
@health_bp.route('/inspections/<inspection_id>/violations', methods=['GET'])
@jwt_required()
@require_permission('health.read')
def get_violations(inspection_id):
    """Get violations for a health inspection"""
    try:
        inspection = HealthInspection.query.get(inspection_id)
        if not inspection:
            return jsonify({'error': 'Health inspection not found'}), 404
        
        violations = HealthViolation.query.filter_by(inspection_id=inspection_id).all()
        
        return jsonify([violation.to_dict() for violation in violations]), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching violations for {inspection_id}: {str(e)}")
        return jsonify({'error': 'Failed to fetch violations'}), 500

@health_bp.route('/inspections/<inspection_id>/violations', methods=['POST'])
@jwt_required()
@require_permission('health.violation.create')
def add_violation(inspection_id):
    """Add a violation to a health inspection"""
    try:
        inspection = HealthInspection.query.get(inspection_id)
        if not inspection:
            return jsonify({'error': 'Health inspection not found'}), 404
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['category', 'description', 'severity']
        validation_error = validate_required_fields(data, required_fields)
        if validation_error:
            return jsonify({'error': validation_error}), 400
        
        # Validate severity
        try:
            severity = ViolationSeverity(data['severity'])
        except ValueError:
            return jsonify({'error': 'Invalid severity'}), 400
        
        # Create violation
        violation = HealthViolation(
            inspection_id=inspection_id,
            category=data['category'],
            description=data['description'],
            severity=severity,
            points_deducted=data.get('points_deducted', 0),
            photo_path=data.get('photo_path')
        )
        
        # Update inspection total violations
        inspection.total_violations = (inspection.total_violations or 0) + 1
        
        db.session.add(violation)
        db.session.commit()
        
        return jsonify(violation.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error adding violation for {inspection_id}: {str(e)}")
        return jsonify({'error': 'Failed to add violation'}), 500

# Report endpoints
@health_bp.route('/inspections/<inspection_id>/reports', methods=['GET'])
@jwt_required()
@require_permission('health.read')
def get_reports(inspection_id):
    """Get reports for a health inspection"""
    try:
        inspection = HealthInspection.query.get(inspection_id)
        if not inspection:
            return jsonify({'error': 'Health inspection not found'}), 404
        
        reports = HealthReport.query.filter_by(inspection_id=inspection_id).all()
        
        return jsonify([report.to_dict() for report in reports]), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching reports for {inspection_id}: {str(e)}")
        return jsonify({'error': 'Failed to fetch reports'}), 500

@health_bp.route('/inspections/<inspection_id>/reports', methods=['POST'])
@jwt_required()
@require_permission('health.report.create')
def add_report(inspection_id):
    """Add a report to a health inspection"""
    try:
        inspection = HealthInspection.query.get(inspection_id)
        if not inspection:
            return jsonify({'error': 'Health inspection not found'}), 404
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['report_type', 'summary', 'findings', 'recommendations']
        validation_error = validate_required_fields(data, required_fields)
        if validation_error:
            return jsonify({'error': validation_error}), 400
        
        # Get current user
        current_user_id = get_jwt_identity()
        
        # Create report
        report = HealthReport(
            inspection_id=inspection_id,
            report_type=data['report_type'],
            summary=data['summary'],
            findings=data['findings'],
            recommendations=data['recommendations'],
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
        current_app.logger.error(f"Error adding report for {inspection_id}: {str(e)}")
        return jsonify({'error': 'Failed to add report'}), 500

# Schedule endpoints
@health_bp.route('/schedule', methods=['GET'])
@jwt_required()
@require_permission('health.read')
def get_schedule():
    """Get health inspection schedule"""
    try:
        # Get query parameters
        days_ahead = request.args.get('days_ahead', 30, type=int)
        inspector_id = request.args.get('inspector_id')
        establishment_type = request.args.get('establishment_type')
        
        # Calculate date range
        today = datetime.utcnow().date()
        end_date = today + timedelta(days=days_ahead)
        
        # Build query
        query = HealthSchedule.query.filter(
            HealthSchedule.next_inspection_date >= today,
            HealthSchedule.next_inspection_date <= end_date,
            HealthSchedule.active == True
        )
        
        if inspector_id:
            query = query.filter(HealthSchedule.assigned_inspector_id == inspector_id)
        
        if establishment_type:
            query = query.filter(HealthSchedule.establishment_type == establishment_type)
        
        # Order by next inspection date
        schedules = query.order_by(HealthSchedule.next_inspection_date).all()
        
        return jsonify([schedule.to_dict() for schedule in schedules]), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching health inspection schedule: {str(e)}")
        return jsonify({'error': 'Failed to fetch health inspection schedule'}), 500

@health_bp.route('/schedule', methods=['POST'])
@jwt_required()
@require_permission('health.schedule.create')
def add_to_schedule():
    """Add an establishment to the health inspection schedule"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['establishment_id', 'establishment_name', 'establishment_type', 'inspection_frequency', 'next_inspection_date']
        validation_error = validate_required_fields(data, required_fields)
        if validation_error:
            return jsonify({'error': validation_error}), 400
        
        # Validate establishment type
        try:
            establishment_type = InspectionType(data['establishment_type'])
        except ValueError:
            return jsonify({'error': 'Invalid establishment type'}), 400
        
        # Validate next inspection date
        try:
            next_inspection_date = datetime.strptime(data['next_inspection_date'], '%Y-%m-%d')
        except ValueError:
            return jsonify({'error': 'Invalid next inspection date format. Use YYYY-MM-DD'}), 400
        
        # Get inspector information if provided
        inspector_name = None
        if data.get('assigned_inspector_id'):
            inspector = User.query.get(data['assigned_inspector_id'])
            if inspector:
                inspector_name = f"{inspector.first_name} {inspector.last_name}"
        
        # Create schedule
        schedule = HealthSchedule(
            establishment_id=data['establishment_id'],
            establishment_name=data['establishment_name'],
            establishment_type=establishment_type,
            establishment_address=data.get('establishment_address'),
            inspection_frequency=data['inspection_frequency'],
            next_inspection_date=next_inspection_date,
            last_inspection_date=datetime.strptime(data['last_inspection_date'], '%Y-%m-%d') if data.get('last_inspection_date') else None,
            risk_level=data.get('risk_level', 'medium'),
            priority_score=data.get('priority_score', 50),
            assigned_inspector_id=data.get('assigned_inspector_id'),
            assigned_inspector_name=inspector_name,
            notes=data.get('notes')
        )
        
        db.session.add(schedule)
        db.session.commit()
        
        return jsonify(schedule.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error adding to health inspection schedule: {str(e)}")
        return jsonify({'error': 'Failed to add to health inspection schedule'}), 500

# Statistics endpoint
@health_bp.route('/stats', methods=['GET'])
@jwt_required()
@require_permission('health.read')
def get_health_stats():
    """Get health inspection statistics"""
    try:
        # Get query parameters
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        # Build date filter
        date_filter = True
        if date_from:
            try:
                date_from_obj = datetime.strptime(date_from, '%Y-%m-%d')
            except ValueError:
                return jsonify({'error': 'Invalid date_from format. Use YYYY-MM-DD'}), 400
        else:
            date_from_obj = datetime.utcnow() - timedelta(days=30)  # Default to last 30 days
        
        if date_to:
            try:
                date_to_obj = datetime.strptime(date_to, '%Y-%m-%d')
            except ValueError:
                return jsonify({'error': 'Invalid date_to format. Use YYYY-MM-DD'}), 400
        else:
            date_to_obj = datetime.utcnow()
        
        # Get inspection statistics
        total_inspections = HealthInspection.query.filter(
            HealthInspection.inspection_date >= date_from_obj,
            HealthInspection.inspection_date <= date_to_obj
        ).count()
        
        completed_inspections = HealthInspection.query.filter(
            HealthInspection.inspection_date >= date_from_obj,
            HealthInspection.inspection_date <= date_to_obj,
            HealthInspection.status == InspectionStatus.COMPLETED
        ).count()
        
        passed_inspections = HealthInspection.query.filter(
            HealthInspection.inspection_date >= date_from_obj,
            HealthInspection.inspection_date <= date_to_obj,
            HealthInspection.passed == True
        ).count()
        
        # Get violations statistics
        total_violations = db.session.query(db.func.count(HealthViolation.id)).join(HealthInspection).filter(
            HealthInspection.inspection_date >= date_from_obj,
            HealthInspection.inspection_date <= date_to_obj
        ).scalar() or 0
        
        # Get upcoming inspections
        upcoming_inspections = HealthInspection.query.filter(
            HealthInspection.inspection_date >= datetime.utcnow().date(),
            HealthInspection.inspection_date <= datetime.utcnow().date() + timedelta(days=7),
            HealthInspection.status == InspectionStatus.SCHEDULED
        ).count()
        
        # Get overdue inspections
        overdue_inspections = HealthInspection.query.filter(
            HealthInspection.inspection_date < datetime.utcnow().date(),
            HealthInspection.status == InspectionStatus.SCHEDULED
        ).count()
        
        return jsonify({
            'period': {
                'from': date_from_obj.isoformat(),
                'to': date_to_obj.isoformat()
            },
            'inspections': {
                'total': total_inspections,
                'completed': completed_inspections,
                'passed': passed_inspections,
                'pass_rate': round((passed_inspections / completed_inspections * 100) if completed_inspections > 0 else 0, 2)
            },
            'violations': {
                'total': total_violations
            },
            'schedule': {
                'upcoming': upcoming_inspections,
                'overdue': overdue_inspections
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching health statistics: {str(e)}")
        return jsonify({'error': 'Failed to fetch health statistics'}), 500