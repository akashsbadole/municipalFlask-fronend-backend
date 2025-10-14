from flask import Blueprint, request, jsonify, current_app
from datetime import datetime, timedelta
import uuid
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import requests
from models.user import User
from models.citizen import Citizen
from models.disaster_alert import DisasterAlert
from models.emergency_team import EmergencyTeam
from app import db
from utils.auth import token_required, check_permission

disaster_bp = Blueprint('disaster', __name__, url_prefix='/disaster')

# Helper function to send SMS
def send_sms(phone_number, message):
    try:
        # This is a placeholder for SMS integration
        # In a real implementation, you would integrate with an SMS gateway like Twilio, AWS SNS, etc.
        # For now, we'll just log the message
        current_app.logger.info(f"SMS to {phone_number}: {message}")
        return True
    except Exception as e:
        current_app.logger.error(f"Failed to send SMS: {str(e)}")
        return False

# Helper function to send Email
def send_email(to_email, subject, message):
    try:
        # This is a placeholder for email integration
        # In a real implementation, you would configure SMTP settings
        # For now, we'll just log the message
        current_app.logger.info(f"Email to {to_email}: {subject} - {message}")
        return True
    except Exception as e:
        current_app.logger.error(f"Failed to send email: {str(e)}")
        return False

# Disaster Alerts Routes
@disaster_bp.route('/alerts', methods=['GET'])
@token_required
@check_permission('disaster.read')
def get_alerts(current_user):
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        alert_type = request.args.get('alert_type')
        severity = request.args.get('severity')
        status = request.args.get('status', 'Active')
        
        query = DisasterAlert.query
        
        if alert_type:
            query = query.filter(DisasterAlert.alert_type == alert_type)
        if severity:
            query = query.filter(DisasterAlert.severity == severity)
        if status:
            query = query.filter(DisasterAlert.status == status)
        
        alerts = query.order_by(DisasterAlert.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'alerts': [alert.to_dict() for alert in alerts.items],
            'pagination': {
                'page': alerts.page,
                'per_page': alerts.per_page,
                'total': alerts.total,
                'pages': alerts.pages,
                'has_next': alerts.has_next,
                'has_prev': alerts.has_prev
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@disaster_bp.route('/alerts', methods=['POST'])
@token_required
@check_permission('disaster.create')
def create_alert(current_user):
    try:
        data = request.get_json()
        
        alert = DisasterAlert(
            title=data['title'],
            message=data['message'],
            alert_type=data['alert_type'],
            severity=data['severity'],
            affected_areas=data['affected_areas'],
            latitude=data.get('latitude'),
            longitude=data.get('longitude'),
            radius_km=data.get('radius_km'),
            start_time=datetime.strptime(data['start_time'], '%Y-%m-%d %H:%M:%S') if data.get('start_time') else datetime.utcnow(),
            end_time=datetime.strptime(data['end_time'], '%Y-%m-%d %H:%M:%S') if data.get('end_time') else None,
            evacuation_required=data.get('evacuation_required', False),
            evacuation_centers=data.get('evacuation_centers', []),
            contact_numbers=data.get('contact_numbers', []),
            additional_info=data.get('additional_info'),
            created_by=current_user.id
        )
        
        db.session.add(alert)
        db.session.commit()
        
        # Send notifications if requested
        if data.get('send_notifications', False):
            send_alert_notifications(alert.id)
        
        return jsonify({'message': 'Alert created successfully', 'alert': alert.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@disaster_bp.route('/alerts/<alert_id>', methods=['GET'])
@token_required
@check_permission('disaster.read')
def get_alert(current_user, alert_id):
    try:
        alert = DisasterAlert.query.get(alert_id)
        if not alert:
            return jsonify({'error': 'Alert not found'}), 404
        
        return jsonify({'alert': alert.to_dict()}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@disaster_bp.route('/alerts/<alert_id>', methods=['PUT'])
@token_required
@check_permission('disaster.update')
def update_alert(current_user, alert_id):
    try:
        alert = DisasterAlert.query.get(alert_id)
        if not alert:
            return jsonify({'error': 'Alert not found'}), 404
        
        data = request.get_json()
        
        alert.title = data.get('title', alert.title)
        alert.message = data.get('message', alert.message)
        alert.alert_type = data.get('alert_type', alert.alert_type)
        alert.severity = data.get('severity', alert.severity)
        alert.affected_areas = data.get('affected_areas', alert.affected_areas)
        alert.latitude = data.get('latitude', alert.latitude)
        alert.longitude = data.get('longitude', alert.longitude)
        alert.radius_km = data.get('radius_km', alert.radius_km)
        alert.end_time = datetime.strptime(data['end_time'], '%Y-%m-%d %H:%M:%S') if data.get('end_time') else alert.end_time
        alert.status = data.get('status', alert.status)
        alert.evacuation_required = data.get('evacuation_required', alert.evacuation_required)
        alert.evacuation_centers = data.get('evacuation_centers', alert.evacuation_centers)
        alert.contact_numbers = data.get('contact_numbers', alert.contact_numbers)
        alert.additional_info = data.get('additional_info', alert.additional_info)
        
        db.session.commit()
        
        return jsonify({'message': 'Alert updated successfully', 'alert': alert.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@disaster_bp.route('/alerts/<alert_id>/send-notifications', methods=['POST'])
@token_required
@check_permission('disaster.update')
def send_alert_notifications_route(current_user, alert_id):
    try:
        alert = DisasterAlert.query.get(alert_id)
        if not alert:
            return jsonify({'error': 'Alert not found'}), 404
        
        success = send_alert_notifications(alert_id)
        
        if success:
            return jsonify({'message': 'Notifications sent successfully'}), 200
        else:
            return jsonify({'error': 'Failed to send notifications'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@disaster_bp.route('/alerts/<alert_id>', methods=['DELETE'])
@token_required
@check_permission('disaster.delete')
def delete_alert(current_user, alert_id):
    try:
        alert = DisasterAlert.query.get(alert_id)
        if not alert:
            return jsonify({'error': 'Alert not found'}), 404
        
        db.session.delete(alert)
        db.session.commit()
        
        return jsonify({'message': 'Alert deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Emergency Teams Routes
@disaster_bp.route('/teams', methods=['GET'])
@token_required
@check_permission('disaster.read')
def get_teams(current_user):
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        team_type = request.args.get('team_type')
        status = request.args.get('status', 'Active')
        
        query = EmergencyTeam.query
        
        if team_type:
            query = query.filter(EmergencyTeam.team_type == team_type)
        if status:
            query = query.filter(EmergencyTeam.status == status)
        
        teams = query.order_by(EmergencyTeam.team_name).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'teams': [team.to_dict() for team in teams.items],
            'pagination': {
                'page': teams.page,
                'per_page': teams.per_page,
                'total': teams.total,
                'pages': teams.pages,
                'has_next': teams.has_next,
                'has_prev': teams.has_prev
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@disaster_bp.route('/teams', methods=['POST'])
@token_required
@check_permission('disaster.create')
def create_team(current_user):
    try:
        data = request.get_json()
        
        team = EmergencyTeam(
            team_name=data['team_name'],
            team_type=data['team_type'],
            description=data.get('description'),
            leader_name=data['leader_name'],
            leader_contact=data['leader_contact'],
            members=data.get('members', []),
            equipment=data.get('equipment', []),
            status=data.get('status', 'Active')
        )
        
        db.session.add(team)
        db.session.commit()
        
        return jsonify({'message': 'Team created successfully', 'team': team.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@disaster_bp.route('/teams/<team_id>', methods=['GET'])
@token_required
@check_permission('disaster.read')
def get_team(current_user, team_id):
    try:
        team = EmergencyTeam.query.get(team_id)
        if not team:
            return jsonify({'error': 'Team not found'}), 404
        
        return jsonify({'team': team.to_dict()}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@disaster_bp.route('/teams/<team_id>', methods=['PUT'])
@token_required
@check_permission('disaster.update')
def update_team(current_user, team_id):
    try:
        team = EmergencyTeam.query.get(team_id)
        if not team:
            return jsonify({'error': 'Team not found'}), 404
        
        data = request.get_json()
        
        team.team_name = data.get('team_name', team.team_name)
        team.team_type = data.get('team_type', team.team_type)
        team.description = data.get('description', team.description)
        team.leader_name = data.get('leader_name', team.leader_name)
        team.leader_contact = data.get('leader_contact', team.leader_contact)
        team.members = data.get('members', team.members)
        team.equipment = data.get('equipment', team.equipment)
        team.status = data.get('status', team.status)
        
        db.session.commit()
        
        return jsonify({'message': 'Team updated successfully', 'team': team.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@disaster_bp.route('/teams/<team_id>', methods=['DELETE'])
@token_required
@check_permission('disaster.delete')
def delete_team(current_user, team_id):
    try:
        team = EmergencyTeam.query.get(team_id)
        if not team:
            return jsonify({'error': 'Team not found'}), 404
        
        db.session.delete(team)
        db.session.commit()
        
        return jsonify({'message': 'Team deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@disaster_bp.route('/teams/<team_id>/deploy', methods=['POST'])
@token_required
@check_permission('disaster.update')
def deploy_team(current_user, team_id):
    try:
        team = EmergencyTeam.query.get(team_id)
        if not team:
            return jsonify({'error': 'Team not found'}), 404
        
        data = request.get_json()
        
        team.status = 'Deployed'
        team.current_location = data.get('location')
        team.deployment_time = datetime.utcnow()
        team.assigned_alert_id = data.get('alert_id')
        
        db.session.commit()
        
        # Send notification to team leader
        if team.leader_contact:
            message = f"Emergency Alert: Your team ({team.team_name}) has been deployed to {data.get('location')}. Please respond immediately."
            send_sms(team.leader_contact, message)
        
        return jsonify({'message': 'Team deployed successfully', 'team': team.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Helper function to send alert notifications
def send_alert_notifications(alert_id):
    try:
        alert = DisasterAlert.query.get(alert_id)
        if not alert:
            return False
        
        # Get affected citizens based on location
        affected_citizens = []
        
        if alert.latitude and alert.longitude and alert.radius_km:
            # Get citizens within the radius
            # This is a simplified approach - in a real implementation, you would use proper geospatial queries
            citizens = Citizen.query.all()
            for citizen in citizens:
                # Simple distance calculation (in reality, you'd use proper geospatial functions)
                distance = calculate_distance(
                    alert.latitude, alert.longitude,
                    citizen.latitude, citizen.longitude
                )
                if distance <= alert.radius_km:
                    affected_citizens.append(citizen)
        else:
            # If no specific location, get all citizens from affected areas
            for area in alert.affected_areas:
                citizens = Citizen.query.filter_by(area=area).all()
                affected_citizens.extend(citizens)
        
        # Send SMS notifications
        for citizen in affected_citizens:
            if citizen.phone:
                message = f"EMERGENCY ALERT: {alert.title}. {alert.message}"
                send_sms(citizen.phone, message)
            
            if citizen.email:
                send_email(
                    citizen.email,
                    f"Emergency Alert: {alert.title}",
                    alert.message
                )
        
        # Send email notifications to all registered users
        users = User.query.all()
        for user in users:
            if user.email:
                send_email(
                    user.email,
                    f"Emergency Alert: {alert.title}",
                    alert.message
                )
        
        return True
    except Exception as e:
        current_app.logger.error(f"Failed to send notifications: {str(e)}")
        return False

# Helper function to calculate distance between two coordinates (simplified)
def calculate_distance(lat1, lon1, lat2, lon2):
    # This is a simplified distance calculation
    # In a real implementation, you would use the Haversine formula or a proper geospatial library
    from math import radians, cos, sin, asin, sqrt
    
    # Convert decimal degrees to radians
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    
    # Haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    
    # Radius of earth in kilometers
    r = 6371
    return c * r

# Statistics
@disaster_bp.route('/stats', methods=['GET'])
@token_required
@check_permission('disaster.read')
def get_disaster_stats(current_user):
    try:
        active_alerts_count = DisasterAlert.query.filter_by(status='Active').count()
        high_severity_alerts_count = DisasterAlert.query.filter_by(severity='High', status='Active').count()
        active_teams_count = EmergencyTeam.query.filter_by(status='Active').count()
        deployed_teams_count = EmergencyTeam.query.filter_by(status='Deployed').count()
        
        return jsonify({
            'active_alerts_count': active_alerts_count,
            'high_severity_alerts_count': high_severity_alerts_count,
            'active_teams_count': active_teams_count,
            'deployed_teams_count': deployed_teams_count
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500