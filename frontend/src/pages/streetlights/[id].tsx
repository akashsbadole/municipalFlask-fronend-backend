import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { streetlightsAPI } from '@/lib/api';
import { toast } from 'react-toastify';
import {
  ArrowLeftIcon,
  LightBulbIcon,
  MapPinIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  EyeIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Streetlight {
  id: string;
  pole_number: string;
  location: string;
  ward: string;
  street: string;
  latitude: number;
  longitude: number;
  light_type: string;
  wattage: number;
  status: string;
  installation_date: string;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  maintenance_interval: number;
  reported_issues?: number;
  energy_consumption?: number;
  created_at: string;
  updated_at: string;
}

interface MaintenanceRecord {
  id: string;
  streetlight_id: string;
  maintenance_type: string;
  description: string;
  performed_by: string;
  performed_at: string;
  cost: number;
  parts_used: string;
  next_maintenance_date: string;
  created_at: string;
}

interface StreetlightIssue {
  id: string;
  streetlight_id: string;
  reported_by: string;
  issue_type: string;
  description: string;
  status: string;
  reported_at: string;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
}

const StreetlightDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user, hasPermission } = useAuth();
  
  const [streetlight, setStreetlight] = useState<Streetlight | null>(null);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [issues, setIssues] = useState<StreetlightIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'maintenance' | 'issues'>('details');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const maintenanceTypes = [
    { value: 'routine', label: 'Routine Maintenance' },
    { value: 'repair', label: 'Repair' },
    { value: 'replacement', label: 'Replacement' },
    { value: 'inspection', label: 'Inspection' },
    { value: 'cleaning', label: 'Cleaning' },
  ];

  const issueTypes = [
    { value: 'not_working', label: 'Not Working' },
    { value: 'flickering', label: 'Flickering' },
    { value: 'dim_light', label: 'Dim Light' },
    { value: 'physical_damage', label: 'Physical Damage' },
    { value: 'wiring_issue', label: 'Wiring Issue' },
    { value: 'other', label: 'Other' },
  ];

  const issueStatuses = [
    { value: 'reported', label: 'Reported' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' },
  ];

  useEffect(() => {
    if (id) {
      fetchStreetlight();
      fetchMaintenanceRecords();
      fetchIssues();
    }
  }, [id]);

  const fetchStreetlight = async () => {
    try {
      const response = await streetlightsAPI.getById(id as string);
      setStreetlight(response.data);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to fetch streetlight';
      toast.error(message);
      router.push('/streetlights');
    }
  };

  const fetchMaintenanceRecords = async () => {
    try {
      const response = await streetlightsAPI.getMaintenanceRecords(id as string);
      setMaintenanceRecords(response.data);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to fetch maintenance records';
      toast.error(message);
    }
  };

  const fetchIssues = async () => {
    try {
      const response = await streetlightsAPI.getIssues(id as string);
      setIssues(response.data);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to fetch issues';
      toast.error(message);
    }
  };

  const handleDeleteStreetlight = async () => {
    try {
      await streetlightsAPI.delete(id as string);
      toast.success('Streetlight deleted successfully');
      router.push('/streetlights');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to delete streetlight';
      toast.error(message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working':
        return 'bg-green-100 text-green-800';
      case 'not_working':
        return 'bg-red-100 text-red-800';
      case 'maintenance_required':
        return 'bg-yellow-100 text-yellow-800';
      case 'under_repair':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'working':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'not_working':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'maintenance_required':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'under_repair':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <LightBulbIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const getMaintenanceStatus = (streetlight: Streetlight) => {
    if (!streetlight.next_maintenance_date) return null;
    
    const today = new Date();
    const nextMaintenance = new Date(streetlight.next_maintenance_date);
    const daysUntilMaintenance = Math.ceil((nextMaintenance.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilMaintenance < 0) {
      return { status: 'overdue', text: 'Overdue', color: 'text-red-600 font-medium' };
    } else if (daysUntilMaintenance <= 7) {
      return { status: 'due_soon', text: `Due in ${daysUntilMaintenance} days`, color: 'text-yellow-600 font-medium' };
    } else {
      return { status: 'scheduled', text: `Due in ${daysUntilMaintenance} days`, color: 'text-gray-600' };
    }
  };

  const getIssueStatusColor = (status: string) => {
    switch (status) {
      case 'reported':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!streetlight) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Streetlight not found</h3>
        <p className="mt-2 text-sm text-gray-500">
          The streetlight you're looking for doesn't exist or has been deleted.
        </p>
        <Link href="/streetlights" className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700">
          Back to Streetlights
        </Link>
      </div>
    );
  }

  const maintenanceStatus = getMaintenanceStatus(streetlight);

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/streetlights" className="mr-3">
              <button
                type="button"
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Back
              </button>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Streetlight Details</h1>
              <p className="mt-1 text-sm text-gray-500">
                {streetlight.pole_number} • {streetlight.location}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            {hasPermission('streetlight.update') && (
              <Link href={`/streetlights/${streetlight.id}/edit`}>
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
              </Link>
            )}
            
            {hasPermission('streetlight.delete') && (
              <button
                type="button"
                className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                onClick={() => setShowDeleteModal(true)}
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'details'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
          <button
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'maintenance'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('maintenance')}
          >
            Maintenance ({maintenanceRecords.length})
          </button>
          <button
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'issues'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('issues')}
          >
            Issues ({issues.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'details' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Streetlight Information</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Basic details and status of the streetlight
              </p>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Pole Number</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{streetlight.pole_number}</dd>
                </div>
                
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Location</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{streetlight.location}</dd>
                </div>
                
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Address</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {streetlight.street}, {streetlight.ward}
                  </dd>
                </div>
                
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Coordinates</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {streetlight.latitude}, {streetlight.longitude}
                  </dd>
                </div>
                
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Light Type</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {streetlight.light_type} • {streetlight.wattage}W
                  </dd>
                </div>
                
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <div className="flex items-center">
                      {getStatusIcon(streetlight.status)}
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(streetlight.status)}`}>
                        {streetlight.status.replace('_', ' ')}
                      </span>
                    </div>
                  </dd>
                </div>
                
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Installation Date</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {formatDate(streetlight.installation_date)}
                  </dd>
                </div>
                
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Maintenance</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <div className="space-y-1">
                      <p>
                        Interval: {streetlight.maintenance_interval} days
                      </p>
                      {streetlight.last_maintenance_date && (
                        <p>
                          Last Maintenance: {formatDate(streetlight.last_maintenance_date)}
                        </p>
                      )}
                      {maintenanceStatus && (
                        <p className={maintenanceStatus.color}>
                          Next Maintenance: {maintenanceStatus.text}
                        </p>
                      )}
                    </div>
                  </dd>
                </div>
                
                {streetlight.energy_consumption && (
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Energy Consumption</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {streetlight.energy_consumption} kWh/month
                    </dd>
                  </div>
                )}
                
                {streetlight.reported_issues && streetlight.reported_issues > 0 && (
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Reported Issues</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <span className="text-red-600 font-medium">{streetlight.reported_issues} issues</span>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Maintenance Records</h3>
              {hasPermission('streetlight.maintenance.create') && (
                <Link href={`/streetlights/${streetlight.id}/maintenance/new`}>
                  <button
                    type="button"
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Record
                  </button>
                </Link>
              )}
            </div>
            
            {maintenanceRecords.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {maintenanceRecords.map((record) => (
                  <li key={record.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-primary-600 truncate">
                            {record.maintenance_type.replace('_', ' ')}
                          </p>
                          <p className="text-sm text-gray-500">
                            {record.description}
                          </p>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              <p className="flex items-center text-sm text-gray-500">
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                {formatDate(record.performed_at)}
                              </p>
                              <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                Performed by: {record.performed_by}
                              </p>
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              <p>
                                Cost: ₹{record.cost.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-5">
                          <Link
                            href={`/streetlights/${streetlight.id}/maintenance/${record.id}`}
                            className="inline-flex items-center p-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-12">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No maintenance records</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No maintenance has been recorded for this streetlight yet.
                </p>
                {hasPermission('streetlight.maintenance.create') && (
                  <div className="mt-6">
                    <Link href={`/streetlights/${streetlight.id}/maintenance/new`}>
                      <button
                        type="button"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                        Add Maintenance Record
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'issues' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Reported Issues</h3>
              {hasPermission('streetlight.issue.create') && (
                <Link href={`/streetlights/${streetlight.id}/issues/new`}>
                  <button
                    type="button"
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Report Issue
                  </button>
                </Link>
              )}
            </div>
            
            {issues.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {issues.map((issue) => (
                  <li key={issue.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-primary-600 truncate">
                            {issue.issue_type.replace('_', ' ')}
                          </p>
                          <p className="text-sm text-gray-500">
                            {issue.description}
                          </p>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              <p className="flex items-center text-sm text-gray-500">
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                Reported: {formatDate(issue.reported_at)}
                              </p>
                              <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                By: {issue.reported_by}
                              </p>
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getIssueStatusColor(issue.status)}`}>
                                {issue.status.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                          {issue.resolution_notes && (
                            <div className="mt-2 text-sm text-gray-600">
                              <p className="font-medium">Resolution:</p>
                              <p>{issue.resolution_notes}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex-shrink-0 ml-5">
                          <Link
                            href={`/streetlights/${streetlight.id}/issues/${issue.id}`}
                            className="inline-flex items-center p-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-12">
                <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No issues reported</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No issues have been reported for this streetlight yet.
                </p>
                {hasPermission('streetlight.issue.create') && (
                  <div className="mt-6">
                    <Link href={`/streetlights/${streetlight.id}/issues/new`}>
                      <button
                        type="button"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                        Report Issue
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delete Streetlight
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this streetlight? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleDeleteStreetlight}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StreetlightDetailPage;