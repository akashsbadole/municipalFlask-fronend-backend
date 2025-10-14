import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { disasterAPI } from '@/lib/api';
import { toast } from 'react-toastify';
import {
  ExclamationTriangleIcon,
  BellIcon,
  UserGroupIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { format } from 'date-fns';

interface DisasterAlert {
  id: string;
  title: string;
  message: string;
  alert_type: string;
  severity: string;
  affected_areas: string[];
  latitude: number;
  longitude: number;
  radius_km: number;
  start_time: string;
  end_time: string;
  evacuation_required: boolean;
  evacuation_centers: string[];
  contact_numbers: string[];
  status: string;
  created_at: string;
  created_by: string;
}

interface EmergencyTeam {
  id: string;
  team_name: string;
  team_type: string;
  description: string;
  leader_name: string;
  leader_contact: string;
  members: string[];
  equipment: string[];
  status: string;
  current_location: string;
  deployment_time: string;
  assigned_alert_id: string;
}

interface DisasterStats {
  active_alerts_count: number;
  high_severity_alerts_count: number;
  active_teams_count: number;
  deployed_teams_count: number;
}

const DisasterPage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  
  const [alerts, setAlerts] = useState<DisasterAlert[]>([]);
  const [teams, setTeams] = useState<EmergencyTeam[]>([]);
  const [stats, setStats] = useState<DisasterStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'teams'>('overview');
  
  // Filters for alerts
  const [alertSearchTerm, setAlertSearchTerm] = useState('');
  const [alertTypeFilter, setAlertTypeFilter] = useState('');
  const [alertSeverityFilter, setAlertSeverityFilter] = useState('');
  const [showAlertFilters, setShowAlertFilters] = useState(false);
  
  // Filters for teams
  const [teamSearchTerm, setTeamSearchTerm] = useState('');
  const [teamTypeFilter, setTeamTypeFilter] = useState('');
  const [teamStatusFilter, setTeamStatusFilter] = useState('');
  const [showTeamFilters, setShowTeamFilters] = useState(false);
  
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    pages: 0,
  });

  const alertTypes = [
    'Flood',
    'Fire',
    'Earthquake',
    'Cyclone',
    'Accident',
    'Health Emergency',
    'Other',
  ];

  const alertSeverities = [
    'Low',
    'Medium',
    'High',
    'Critical',
  ];

  const teamTypes = [
    'Medical',
    'Firefighting',
    'Rescue',
    'Police',
    'Administrative',
    'Technical',
  ];

  const teamStatuses = [
    'Active',
    'Deployed',
    'Standby',
    'Unavailable',
  ];

  useEffect(() => {
    if (hasPermission('disaster.read')) {
      fetchStats();
      if (activeTab === 'alerts') {
        fetchAlerts();
      } else if (activeTab === 'teams') {
        fetchTeams();
      }
    }
  }, [hasPermission, activeTab, pagination.page, alertSearchTerm, alertTypeFilter, alertSeverityFilter, teamSearchTerm, teamTypeFilter, teamStatusFilter]);

  const fetchStats = async () => {
    try {
      const response = await disasterAPI.getStats();
      setStats(response.data);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to fetch disaster management statistics';
      toast.error(message);
    }
  };

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        per_page: pagination.per_page,
      };
      
      if (alertSearchTerm) params.search = alertSearchTerm;
      if (alertTypeFilter) params.alert_type = alertTypeFilter;
      if (alertSeverityFilter) params.severity = alertSeverityFilter;
      
      const response = await disasterAPI.getAlerts(params);
      setAlerts(response.data.alerts);
      setPagination(response.data.pagination);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to fetch disaster alerts';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        per_page: pagination.per_page,
      };
      
      if (teamSearchTerm) params.search = teamSearchTerm;
      if (teamTypeFilter) params.team_type = teamTypeFilter;
      if (teamStatusFilter) params.status = teamStatusFilter;
      
      const response = await disasterAPI.getTeams(params);
      setTeams(response.data.teams);
      setPagination(response.data.pagination);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to fetch emergency teams';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const sendNotifications = async (alertId: string) => {
    try {
      await disasterAPI.sendAlertNotifications(alertId);
      toast.success('Notifications sent successfully');
      fetchAlerts();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to send notifications';
      toast.error(message);
    }
  };

  const deployTeam = async (teamId: string) => {
    try {
      const location = prompt('Enter deployment location:');
      if (!location) return;
      
      const alertId = prompt('Enter alert ID (optional):');
      
      await disasterAPI.deployTeam(teamId, {
        location,
        alert_id: alertId
      });
      toast.success('Team deployed successfully');
      fetchTeams();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to deploy team';
      toast.error(message);
    }
  };

  const getAlertSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'Low':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Low
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Medium
          </span>
        );
      case 'High':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
            High
          </span>
        );
      case 'Critical':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
            Critical
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {severity}
          </span>
        );
    }
  };

  const getAlertStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
            Active
          </span>
        );
      case 'Resolved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            Resolved
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <XMarkIcon className="w-4 h-4 mr-1" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const getTeamStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            Active
          </span>
        );
      case 'Deployed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <PaperAirplaneIcon className="w-4 h-4 mr-1" />
            Deployed
          </span>
        );
      case 'Standby':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon className="w-4 h-4 mr-1" />
            Standby
          </span>
        );
      case 'Unavailable':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XMarkIcon className="w-4 h-4 mr-1" />
            Unavailable
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const clearAlertFilters = () => {
    setAlertSearchTerm('');
    setAlertTypeFilter('');
    setAlertSeverityFilter('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearTeamFilters = () => {
    setTeamSearchTerm('');
    setTeamTypeFilter('');
    setTeamStatusFilter('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  if (!hasPermission('disaster.read')) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
        <p className="mt-2 text-sm text-gray-500">
          You don't have permission to access disaster management module.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Disaster Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage disaster alerts and emergency response teams
            </p>
          </div>
          {hasPermission('disaster.create') && (
            <div className="flex space-x-3">
              {activeTab === 'alerts' && (
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                  New Alert
                </button>
              )}
              {activeTab === 'teams' && (
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  New Team
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: ExclamationTriangleIcon },
            { id: 'alerts', name: 'Disaster Alerts', icon: BellIcon },
            { id: 'teams', name: 'Emergency Teams', icon: UserGroupIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
                  <ExclamationTriangleIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Alerts</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.active_alerts_count}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                  <ExclamationTriangleIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">High Severity Alerts</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.high_severity_alerts_count}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <UserGroupIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Teams</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.active_teams_count}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <PaperAirplaneIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Deployed Teams</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.deployed_teams_count}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Recent Alerts */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Recent Disaster Alerts</h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('alerts')}
                  className="text-sm text-primary-600 hover:text-primary-900"
                >
                  View All
                </button>
              </div>
              <div className="space-y-3">
                {alerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between border-b border-gray-200 pb-3 last:border-b-0">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{alert.title}</h4>
                      <div className="flex items-center mt-1 space-x-4">
                        <span className="text-xs text-gray-500">{alert.alert_type}</span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(alert.start_time), 'MMM d, yyyy HH:mm')}
                        </span>
                        {alert.affected_areas.length > 0 && (
                          <span className="text-xs text-gray-500 flex items-center">
                            <MapPinIcon className="h-3 w-3 mr-1" />
                            {alert.affected_areas.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getAlertSeverityBadge(alert.severity)}
                      {getAlertStatusBadge(alert.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Recent Teams */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Emergency Teams Status</h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('teams')}
                  className="text-sm text-primary-600 hover:text-primary-900"
                >
                  View All
                </button>
              </div>
              <div className="space-y-3">
                {teams.slice(0, 5).map((team) => (
                  <div key={team.id} className="flex items-center justify-between border-b border-gray-200 pb-3 last:border-b-0">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{team.team_name}</h4>
                      <div className="flex items-center mt-1 space-x-4">
                        <span className="text-xs text-gray-500">{team.team_type}</span>
                        <span className="text-xs text-gray-500">Leader: {team.leader_name}</span>
                        {team.current_location && (
                          <span className="text-xs text-gray-500 flex items-center">
                            <MapPinIcon className="h-3 w-3 mr-1" />
                            {team.current_location}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getTeamStatusBadge(team.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div>
          {/* Filters */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="Search alerts..."
                      value={alertSearchTerm}
                      onChange={(e) => setAlertSearchTerm(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAlertFilters(!showAlertFilters)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <FunnelIcon className="h-4 w-4 mr-1" />
                    Filters
                  </button>
                  {(alertSearchTerm || alertTypeFilter || alertSeverityFilter) && (
                    <button
                      type="button"
                      onClick={clearAlertFilters}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
              
              {showAlertFilters && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="alert-type-filter" className="block text-sm font-medium text-gray-700">
                      Alert Type
                    </label>
                    <select
                      id="alert-type-filter"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      value={alertTypeFilter}
                      onChange={(e) => setAlertTypeFilter(e.target.value)}
                    >
                      <option value="">All Types</option>
                      {alertTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="alert-severity-filter" className="block text-sm font-medium text-gray-700">
                      Severity
                    </label>
                    <select
                      id="alert-severity-filter"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      value={alertSeverityFilter}
                      onChange={(e) => setAlertSeverityFilter(e.target.value)}
                    >
                      <option value="">All Severities</option>
                      {alertSeverities.map(severity => (
                        <option key={severity} value={severity}>{severity}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Alerts Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {alerts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Alert
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Severity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Affected Areas
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {alerts.map((alert) => (
                      <tr key={alert.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{alert.title}</div>
                            <div className="text-sm text-gray-500">
                              {format(new Date(alert.start_time), 'MMM d, yyyy HH:mm')}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{alert.alert_type}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getAlertSeverityBadge(alert.severity)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {alert.affected_areas.length > 0 ? alert.affected_areas.join(', ') : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getAlertStatusBadge(alert.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              type="button"
                              className="text-primary-600 hover:text-primary-900"
                              title="View Details"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </button>
                            {hasPermission('disaster.update') && alert.status === 'Active' && (
                              <button
                                type="button"
                                onClick={() => sendNotifications(alert.id)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Send Notifications"
                              >
                                <PaperAirplaneIcon className="h-5 w-5" />
                              </button>
                            )}
                            {hasPermission('disaster.update') && (
                              <button
                                type="button"
                                className="text-yellow-600 hover:text-yellow-900"
                                title="Edit"
                              >
                                <PencilIcon className="h-5 w-5" />
                              </button>
                            )}
                            {hasPermission('disaster.delete') && (
                              <button
                                type="button"
                                className="text-red-600 hover:text-red-900"
                                title="Delete"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No alerts found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {alertSearchTerm || alertTypeFilter || alertSeverityFilter
                    ? 'Try adjusting your search or filters'
                    : 'No disaster alerts have been created yet'}
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{(pagination.page - 1) * pagination.per_page + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.per_page, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span> results
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Teams Tab */}
      {activeTab === 'teams' && (
        <div>
          {/* Filters */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="Search teams..."
                      value={teamSearchTerm}
                      onChange={(e) => setTeamSearchTerm(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTeamFilters(!showTeamFilters)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <FunnelIcon className="h-4 w-4 mr-1" />
                    Filters
                  </button>
                  {(teamSearchTerm || teamTypeFilter || teamStatusFilter) && (
                    <button
                      type="button"
                      onClick={clearTeamFilters}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
              
              {showTeamFilters && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="team-type-filter" className="block text-sm font-medium text-gray-700">
                      Team Type
                    </label>
                    <select
                      id="team-type-filter"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      value={teamTypeFilter}
                      onChange={(e) => setTeamTypeFilter(e.target.value)}
                    >
                      <option value="">All Types</option>
                      {teamTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="team-status-filter" className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      id="team-status-filter"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      value={teamStatusFilter}
                      onChange={(e) => setTeamStatusFilter(e.target.value)}
                    >
                      <option value="">All Statuses</option>
                      {teamStatuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Teams Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {teams.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Team
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Leader
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {teams.map((team) => (
                      <tr key={team.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{team.team_name}</div>
                            <div className="text-sm text-gray-500">{team.members.length} members</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{team.team_type}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{team.leader_name}</div>
                          <div className="text-sm text-gray-500">{team.leader_contact}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getTeamStatusBadge(team.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {team.current_location || 'Not deployed'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              type="button"
                              className="text-primary-600 hover:text-primary-900"
                              title="View Details"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </button>
                            {hasPermission('disaster.update') && team.status === 'Active' && (
                              <button
                                type="button"
                                onClick={() => deployTeam(team.id)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Deploy Team"
                              >
                                <PaperAirplaneIcon className="h-5 w-5" />
                              </button>
                            )}
                            {hasPermission('disaster.update') && (
                              <button
                                type="button"
                                className="text-yellow-600 hover:text-yellow-900"
                                title="Edit"
                              >
                                <PencilIcon className="h-5 w-5" />
                              </button>
                            )}
                            {hasPermission('disaster.delete') && (
                              <button
                                type="button"
                                className="text-red-600 hover:text-red-900"
                                title="Delete"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No teams found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {teamSearchTerm || teamTypeFilter || teamStatusFilter
                    ? 'Try adjusting your search or filters'
                    : 'No emergency teams have been created yet'}
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{(pagination.page - 1) * pagination.per_page + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.per_page, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span> results
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DisasterPage;