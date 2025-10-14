from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models.streetlight import Streetlight, StreetlightMaintenance, StreetlightIssue
from models.user import User
from utils.permissions import require_permission
from utils.validators import validate_required_fields
from datetime import datetime, timedelta
import math

streetlights_bp = Blueprint('streetlights', __name__, url_prefix='/streetlights')

@streetlights_bp.route('', methods=['GET'])
@jwt_required()
@require_permission('streetlight.read')
def get_streetlights():
    """Get all streetlights with filtering and pagination"""
    try:
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('limit', 10, type=int)
        status = request.args.get('status')
        light_type = request.args.get('light_type')
        ward = request.args.get('ward')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        search = request.args.get('search')
        
        # Build query
        query = Streetlight.query
        
        # Apply filters
        if status:
            query = query.filter(Streetlight.status == status)
        
        if light_type:
            query = query.filter(Streetlight.light_type == light_type)
        
        if ward:
            query = query.filter(Streetlight.ward == ward)
        
        if date_from:
            try:
                date_from_obj = datetime.strptime(date_from, '%Y-%m-%d')
                query = query.filter(Streetlight.installation_date >= date_from_obj)
            except ValueError:
                return jsonify({'error': 'Invalid date_from format. Use YYYY-MM-DD'}), 400
        
        if date_to:
            try:
                date_to_obj = datetime.strptime(date_to, '%Y-%m-%d')
                query = query.filter(Streetlight.installation_date <= date_to_obj)
            except ValueError:
                return jsonify({'error': 'Invalid date_to format. Use YYYY-MM-DD'}), 400
        
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                db.or_(
                    Streetlight.pole_number.ilike(search_term),
                    Streetlight.location.ilike(search_term),
                    Streetlight.street.ilike(search_term)
                )
            )
        
        # Order by installation date (newest first)
        query = query.order_by(Streetlight.installation_date.desc())
        
        # Paginate
        total = query.count()
        streetlights = query.offset((page - 1) * per_page).limit(per_page).all()
        
        return jsonify({
            'streetlights': [streetlight.to_dict() for streetlight in streetlights],
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': total,
                'pages': math.ceil(total / per_page)
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching streetlights: {str(e)}")
        return jsonify({'error': 'Failed to fetch streetlights'}), 500

@streetlights_bp.route('/<streetlight_id>', methods=['GET'])
@jwt_required()
@require_permission('streetlight.read')
def get_streetlight(streetlight_id):
    """Get a specific streetlight by ID"""
    try:
        streetlight = Streetlight.query.get(streetlight_id)
        if not streetlight:
            return jsonify({'error': 'Streetlight not found'}), 404
        
        return jsonify(streetlight.to_dict()), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching streetlight {streetlight_id}: {str(e)}")
        return jsonify({'error': 'Failed to fetch streetlight'}), 500

@streetlights_bp.route('', methods=['POST'])
@jwt_required()
@require_permission('streetlight.create')
def create_streetlight():
    """Create a new streetlight"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['pole_number', 'location', 'ward', 'street', 'light_type', 'wattage', 'installation_date']
        validation_error = validate_required_fields(data, required_fields)
        if validation_error:
            return jsonify({'error': validation_error}), 400
        
        # Check if pole number already exists
        existing_streetlight = Streetlight.query.filter_by(pole_number=data['pole_number']).first()
        if existing_streetlight:
            return jsonify({'error': 'Pole number already exists'}), 400
        
        # Validate installation date
        try:
            installation_date = datetime.strptime(data['installation_date'], '%Y-%m-%d')
        except ValueError:
            return jsonify({'error': 'Invalid installation date format. Use YYYY-MM-DD'}), 400
        
        # Create new streetlight
        streetlight = Streetlight(
            pole_number=data['pole_number'],
            location=data['location'],
            ward=data['ward'],
            street=data['street'],
            latitude=data.get('latitude'),
            longitude=data.get('longitude'),
            light_type=data['light_type'],
            wattage=data['wattage'],
            status=data.get('status', 'working'),
            installation_date=installation_date,
            maintenance_interval=data.get('maintenance_interval', 180),
            energy_consumption=data.get('energy_consumption', 0)
        )
        
        # Calculate next maintenance date
        streetlight.calculate_next_maintenance()
        
        db.session.add(streetlight)
        db.session.commit()
        
        return jsonify(streetlight.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error creating streetlight: {str(e)}")
        return jsonify({'error': 'Failed to create streetlight'}), 500

@streetlights_bp.route('/<streetlight_id>', methods=['PUT'])
@jwt_required()
@require_permission('streetlight.update')
def update_streetlight(streetlight_id):
    """Update a streetlight"""
    try:
        streetlight = Streetlight.query.get(streetlight_id)
        if not streetlight:
            return jsonify({'error': 'Streetlight not found'}), 404
        
        data = request.get_json()
        
        # Update fields
        if 'pole_number' in data:
            # Check if pole number already exists (excluding current streetlight)
            existing_streetlight = Streetlight.query.filter(
                Streetlight.pole_number == data['pole_number'],
                Streetlight.id != streetlight_id
            ).first()
            if existing_streetlight:
                return jsonify({'error': 'Pole number already exists'}), 400
            streetlight.pole_number = data['pole_number']
        
        if 'location' in data:
            streetlight.location = data['location']
        
        if 'ward' in data:
            streetlight.ward = data['ward']
        
        if 'street' in data:
            streetlight.street = data['street']
        
        if 'latitude' in data:
            streetlight.latitude = data['latitude']
        
        if 'longitude' in data:
            streetlight.longitude = data['longitude']
        
        if 'light_type' in data:
            streetlight.light_type = data['light_type']
        
        if 'wattage' in data:
            streetlight.wattage = data['wattage']
        
        if 'status' in data:
            streetlight.status = data['status']
        
        if 'installation_date' in data:
            try:
                streetlight.installation_date = datetime.strptime(data['installation_date'], '%Y-%m-%d')
            except ValueError:
                return jsonify({'error': 'Invalid installation date format. Use YYYY-MM-DD'}), 400
        
        if 'maintenance_interval' in data:
            streetlight.maintenance_interval = data['maintenance_interval']
            # Recalculate next maintenance date
            streetlight.calculate_next_maintenance()
        
        if 'energy_consumption' in data:
            streetlight.energy_consumption = data['energy_consumption']
        
        db.session.commit()
        
        return jsonify(streetlight.to_dict()), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating streetlight {streetlight_id}: {str(e)}")
        return jsonify({'error': 'Failed to update streetlight'}), 500

@streetlights_bp.route('/<streetlight_id>', methods=['DELETE'])
@jwt_required()
@require_permission('streetlight.delete')
def delete_streetlight(streetlight_id):
    """Delete a streetlight"""
    try:
        streetlight = Streetlight.query.get(streetlight_id)
        if not streetlight:
            return jsonify({'error': 'Streetlight not found'}), 404
        
        db.session.delete(streetlight)
        db.session.commit()
        
        return jsonify({'message': 'Streetlight deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting streetlight {streetlight_id}: {str(e)}")
        return jsonify({'error': 'Failed to delete streetlight'}), 500

# Maintenance endpoints
@streetlights_bp.route('/<streetlight_id>/maintenance', methods=['GET'])
@jwt_required()
@require_permission('streetlight.read')
def get_maintenance_records(streetlight_id):
    """Get maintenance records for a streetlight"""
    try:
        streetlight = Streetlight.query.get(streetlight_id)
        if not streetlight:
            return jsonify({'error': 'Streetlight not found'}), 404
        
        maintenance_records = StreetlightMaintenance.query.filter_by(
            streetlight_id=streetlight_id
        ).order_by(StreetlightMaintenance.performed_at.desc()).all()
        
        return jsonify([record.to_dict() for record in maintenance_records]), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching maintenance records for {streetlight_id}: {str(e)}")
        return jsonify({'error': 'Failed to fetch maintenance records'}), 500

@streetlights_bp.route('/<streetlight_id>/maintenance', methods=['POST'])
@jwt_required()
@require_permission('streetlight.maintenance.create')
def add_maintenance_record(streetlight_id):
    """Add a maintenance record for a streetlight"""
    try:
        streetlight = Streetlight.query.get(streetlight_id)
        if not streetlight:
            return jsonify({'error': 'Streetlight not found'}), 404
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['maintenance_type', 'performed_by']
        validation_error = validate_required_fields(data, required_fields)
        if validation_error:
            return jsonify({'error': validation_error}), 400
        
        # Parse performed_at date if provided
        performed_at = datetime.utcnow()
        if 'performed_at' in data:
            try:
                performed_at = datetime.strptime(data['performed_at'], '%Y-%m-%d')
            except ValueError:
                return jsonify({'error': 'Invalid performed_at format. Use YYYY-MM-DD'}), 400
        
        # Parse next_maintenance_date if provided
        next_maintenance_date = None
        if 'next_maintenance_date' in data:
            try:
                next_maintenance_date = datetime.strptime(data['next_maintenance_date'], '%Y-%m-%d')
            except ValueError:
                return jsonify({'error': 'Invalid next_maintenance_date format. Use YYYY-MM-DD'}), 400
        
        # Create maintenance record
        maintenance = StreetlightMaintenance(
            streetlight_id=streetlight_id,
            maintenance_type=data['maintenance_type'],
            description=data.get('description', ''),
            performed_by=data['performed_by'],
            performed_at=performed_at,
            cost=data.get('cost', 0),
            parts_used=data.get('parts_used', ''),
            next_maintenance_date=next_maintenance_date
        )
        
        # Update streetlight last maintenance date
        streetlight.last_maintenance_date = performed_at
        
        # Update next maintenance date if provided
        if next_maintenance_date:
            streetlight.next_maintenance_date = next_maintenance_date
        else:
            streetlight.calculate_next_maintenance()
        
        # Update status if maintenance was repair
        if data['maintenance_type'] == 'repair' and streetlight.status == 'not_working':
            streetlight.status = 'working'
        
        db.session.add(maintenance)
        db.session.commit()
        
        return jsonify(maintenance.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error adding maintenance record for {streetlight_id}: {str(e)}")
        return jsonify({'error': 'Failed to add maintenance record'}), 500

# Issue endpoints
@streetlights_bp.route('/<streetlight_id>/issues', methods=['GET'])
@jwt_required()
@require_permission('streetlight.read')
def get_issues(streetlight_id):
    """Get issues for a streetlight"""
    try:
        streetlight = Streetlight.query.get(streetlight_id)
        if not streetlight:
            return jsonify({'error': 'Streetlight not found'}), 404
        
        issues = StreetlightIssue.query.filter_by(
            streetlight_id=streetlight_id
        ).order_by(StreetlightIssue.reported_at.desc()).all()
        
        return jsonify([issue.to_dict() for issue in issues]), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching issues for {streetlight_id}: {str(e)}")
        return jsonify({'error': 'Failed to fetch issues'}), 500

@streetlights_bp.route('/<streetlight_id>/issues', methods=['POST'])
@jwt_required()
@require_permission('streetlight.issue.create')
def report_issue(streetlight_id):
    """Report an issue for a streetlight"""
    try:
        streetlight = Streetlight.query.get(streetlight_id)
        if not streetlight:
            return jsonify({'error': 'Streetlight not found'}), 404
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['reported_by', 'issue_type', 'description']
        validation_error = validate_required_fields(data, required_fields)
        if validation_error:
            return jsonify({'error': validation_error}), 400
        
        # Create issue
        issue = StreetlightIssue(
            streetlight_id=streetlight_id,
            reported_by=data['reported_by'],
            issue_type=data['issue_type'],
            description=data['description'],
            status='reported'
        )
        
        # Update streetlight reported issues count
        streetlight.reported_issues = (streetlight.reported_issues or 0) + 1
        
        # Update streetlight status if necessary
        if data['issue_type'] == 'not_working' and streetlight.status == 'working':
            streetlight.status = 'not_working'
        
        db.session.add(issue)
        db.session.commit()
        
        return jsonify(issue.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error reporting issue for {streetlight_id}: {str(e)}")
        return jsonify({'error': 'Failed to report issue'}), 500

@streetlights_bp.route('/<streetlight_id>/issues/<issue_id>/resolve', methods=['POST'])
@jwt_required()
@require_permission('streetlight.issue.update')
def resolve_issue(streetlight_id, issue_id):
    """Resolve an issue for a streetlight"""
    try:
        streetlight = Streetlight.query.get(streetlight_id)
        if not streetlight:
            return jsonify({'error': 'Streetlight not found'}), 404
        
        issue = StreetlightIssue.query.filter_by(id=issue_id, streetlight_id=streetlight_id).first()
        if not issue:
            return jsonify({'error': 'Issue not found'}), 404
        
        data = request.get_json()
        
        # Update issue
        issue.status = 'resolved'
        issue.resolved_at = datetime.utcnow()
        issue.resolution_notes = data.get('resolution_notes', '')
        
        # Update streetlight status if necessary
        if issue.issue_type == 'not_working' and streetlight.status == 'not_working':
            streetlight.status = 'working'
        
        db.session.commit()
        
        return jsonify(issue.to_dict()), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error resolving issue {issue_id} for {streetlight_id}: {str(e)}")
        return jsonify({'error': 'Failed to resolve issue'}), 500

# Maintenance schedule endpoint
@streetlights_bp.route('/maintenance/schedule', methods=['GET'])
@jwt_required()
@require_permission('streetlight.read')
def get_maintenance_schedule():
    """Get streetlights scheduled for maintenance"""
    try:
        # Get query parameters
        days_ahead = request.args.get('days_ahead', 30, type=int)
        ward = request.args.get('ward')
        
        # Calculate date range
        today = datetime.utcnow().date()
        end_date = today + timedelta(days=days_ahead)
        
        # Build query
        query = Streetlight.query.filter(
            Streetlight.next_maintenance_date >= today,
            Streetlight.next_maintenance_date <= end_date
        )
        
        if ward:
            query = query.filter(Streetlight.ward == ward)
        
        # Order by next maintenance date
        streetlights = query.order_by(Streetlight.next_maintenance_date).all()
        
        return jsonify([streetlight.to_dict() for streetlight in streetlights]), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching maintenance schedule: {str(e)}")
        return jsonify({'error': 'Failed to fetch maintenance schedule'}), 500

# Maintenance statistics endpoint
@streetlights_bp.route('/maintenance/stats', methods=['GET'])
@jwt_required()
@require_permission('streetlight.read')
def get_maintenance_stats():
    """Get maintenance statistics"""
    try:
        # Get query parameters
        ward = request.args.get('ward')
        
        # Build base query
        query = Streetlight.query
        if ward:
            query = query.filter(Streetlight.ward == ward)
        
        total = query.count()
        working = query.filter(Streetlight.status == 'working').count()
        not_working = query.filter(Streetlight.status == 'not_working').count()
        maintenance_required = query.filter(Streetlight.status == 'maintenance_required').count()
        under_repair = query.filter(Streetlight.status == 'under_repair').count()
        
        # Overdue maintenance
        today = datetime.utcnow().date()
        overdue = query.filter(
            Streetlight.next_maintenance_date < today
        ).count()
        
        # Due in next 7 days
        next_week = today + timedelta(days=7)
        due_soon = query.filter(
            Streetlight.next_maintenance_date >= today,
            Streetlight.next_maintenance_date <= next_week
        ).count()
        
        return jsonify({
            'total': total,
            'by_status': {
                'working': working,
                'not_working': not_working,
                'maintenance_required': maintenance_required,
                'under_repair': under_repair
            },
            'maintenance': {
                'overdue': overdue,
                'due_soon': due_soon
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching maintenance stats: {str(e)}")
        return jsonify({'error': 'Failed to fetch maintenance statistics'}), 500