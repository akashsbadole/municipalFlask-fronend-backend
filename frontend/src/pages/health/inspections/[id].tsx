import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { healthAPI } from '@/lib/api';
import { toast } from 'react-toastify';
import {
  ArrowLeftIcon,
  ClipboardDocumentListIcon,
  BuildingOfficeIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  EyeIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface HealthInspection {
  id: string;
  establishment_id: string;
  establishment_name: string;
  establishment_type: string;
  establishment_address?: string;
  contact_person?: string;
  contact_phone?: string;
  inspection_type: string;
  inspection_date: string;
  inspection_time?: string;
  duration_hours: number;
  inspector_id: string;
  inspector_name: string;
  status: string;
  overall_score?: number;
  passed?: boolean;
  total_violations?: number;
  follow_up_required?: boolean;
  follow_up_date?: string;
  follow_up_notes?: string;
  notes?: string;
  weather_conditions?: string;
  created_at: string;
  updated_at: string;
}

interface HealthViolation {
  id: string;
  inspection_id: string;
  category: string;
  description: string;
  severity: string;
  points_deducted: number;
  corrected: boolean;
  correction_date?: string;
  correction_notes?: string;
  photo_path?: string;
  created_at: string;
}

interface HealthReport {
  id: string;
  inspection_id: string;
  report_type: string;
  summary: string;
  findings: string;
  recommendations: string;
  generated_by: string;
  generated_at: string;
  file_path?: string;
  file_name?: string;
  file_size?: number;
  status: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
}

const InspectionDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user, hasPermission } = useAuth();
  
  const [inspection, setInspection] = useState<HealthInspection | null>(null);
  const [violations, setViolations] = useState<HealthViolation[]>([]);
  const [reports, setReports] = useState<HealthReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'violations' | 'reports'>('details');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const establishmentTypes = {
    'restaurant': 'Restaurant',
    'food_stall': 'Food Stall',
    'hospital': 'Hospital',
    'clinic': 'Clinic',
    'school': 'School',
    'water_source': 'Water Source',
    'public_pool': 'Public Pool',
    'gym': 'Gym',
    'beauty_salon': 'Beauty Salon',
    'general': 'General',
  };

  const inspectionTypes = {
    'routine': 'Routine Inspection',
    'complaint_based': 'Complaint-Based Inspection',
    'follow_up': 'Follow-Up Inspection',
    'special': 'Special Inspection',
  };

  const severityColors = {
    'low': 'bg-green-100 text-green-800',
    'medium': 'bg-yellow-100 text-yellow-800',
    'high': 'bg-orange-100 text-orange-800',
    'critical': 'bg-red-100 text-red-800',
  };

  useEffect(() => {
    if (id) {
      fetchInspection();
      fetchViolations();
      fetchReports();
    }
  }, [id]);

  const fetchInspection = async () => {
    try {
      const response = await healthAPI.getInspectionById(id as string);
      setInspection(response.data);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to fetch inspection';
      toast.error(message);
      router.push('/health');
    }
  };

  const fetchViolations = async () => {
    try {
      const response = await healthAPI.getViolations(id as string);
      setViolations(response.data);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to fetch violations';
      toast.error(message);
    }
  };

  const fetchReports = async () => {
    try {
      const response = await healthAPI.getReports(id as string);
      setReports(response.data);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to fetch reports';
      toast.error(message);
    }
  };

  const handleDeleteInspection = async () => {
    try {
      await healthAPI.deleteInspection(id as string);
      toast.success('Health inspection deleted successfully');
      router.push('/health');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to delete inspection';
      toast.error(message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <CalendarIcon className="h-5 w-5 text-blue-500" />;
      case 'in_progress':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'cancelled':
        return <XCircleIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <ClipboardDocumentListIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN');
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-600';
    if (score >= 90) return 'text-green-600 font-medium';
    if (score >= 70) return 'text-yellow-600 font-medium';
    return 'text-red-600 font-medium';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Health inspection not found</h3>
        <p className="mt-2 text-sm text-gray-500">
          The health inspection you're looking for doesn't exist or has been deleted.
        </p>
        <Link href="/health" className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700">
          Back to Health Inspections
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/health" className="mr-3">
              <button
                type="button"
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Back
              </button>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Health Inspection Details</h1>
              <p className="mt-1 text-sm text-gray-500">
                {inspection.establishment_name} • {formatDate(inspection.inspection_date)}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            {hasPermission('health.update') && (
              <Link href={`/health/inspections/${inspection.id}/edit`}>
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
              </Link>
            )}
            
            {hasPermission('health.delete') && (
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
              activeTab === 'violations'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('violations')}
          >
            Violations ({violations.length})
          </button>
          <button
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reports'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('reports')}
          >
            Reports ({reports.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'details' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Inspection Information</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Basic details and status of the health inspection
              </p>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Establishment Name</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{inspection.establishment_name}</dd>
                </div>
                
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Establishment Type</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {establishmentTypes[inspection.establishment_type as keyof typeof establishmentTypes]}
                  </dd>
                </div>
                
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Address</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {inspection.establishment_address || 'Not provided'}
                  </dd>
                </div>
                
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Contact Information</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <div className="space-y-1">
                      {inspection.contact_person && (
                        <p>Person: {inspection.contact_person}</p>
                      )}
                      {inspection.contact_phone && (
                        <p>Phone: {inspection.contact_phone}</p>
                      )}
                      {!inspection.contact_person && !inspection.contact_phone && (
                        <p className="text-gray-500">No contact information provided</p>
                      )}
                    </div>
                  </dd>
                </div>
                
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Inspection Details</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <div className="space-y-1">
                      <p>Type: {inspectionTypes[inspection.inspection_type as keyof typeof inspectionTypes]}</p>
                      <p>Date: {formatDate(inspection.inspection_date)} {inspection.inspection_time && `at ${inspection.inspection_time}`}</p>
                      <p>Duration: {inspection.duration_hours} hours</p>
                      {inspection.weather_conditions && (
                        <p>Weather: {inspection.weather_conditions}</p>
                      )}
                    </div>
                  </dd>
                </div>
                
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Inspector</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{inspection.inspector_name}</dd>
                </div>
                
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <div className="flex items-center">
                      {getStatusIcon(inspection.status)}
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(inspection.status)}`}>
                        {inspection.status.replace('_', ' ')}
                      </span>
                    </div>
                  </dd>
                </div>
                
                {inspection.overall_score !== undefined && (
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Inspection Results</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <div className="space-y-1">
                        <p className={getScoreColor(inspection.overall_score)}>
                          Overall Score: {inspection.overall_score}/100
                        </p>
                        {inspection.passed !== undefined && (
                          <p className={inspection.passed ? 'text-green-600' : 'text-red-600'}>
                            Result: {inspection.passed ? 'Passed' : 'Failed'}
                          </p>
                        )}
                        {inspection.total_violations !== undefined && (
                          <p className={inspection.total_violations > 0 ? 'text-red-600' : 'text-green-600'}>
                            Violations: {inspection.total_violations}
                          </p>
                        )}
                      </div>
                    </dd>
                  </div>
                )}
                
                {inspection.follow_up_required && (
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Follow-up Required</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <div className="space-y-1">
                        <p className="text-red-600 font-medium">Yes</p>
                        {inspection.follow_up_date && (
                          <p>Date: {formatDate(inspection.follow_up_date)}</p>
                        )}
                        {inspection.follow_up_notes && (
                          <p>Notes: {inspection.follow_up_notes}</p>
                        )}
                      </div>
                    </dd>
                  </div>
                )}
                
                {inspection.notes && (
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Additional Notes</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{inspection.notes}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        )}

        {activeTab === 'violations' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Violations</h3>
              {hasPermission('health.violation.create') && (
                <Link href={`/health/inspections/${inspection.id}/violations/new`}>
                  <button
                    type="button"
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Violation
                  </button>
                </Link>
              )}
            </div>
            
            {violations.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {violations.map((violation) => (
                  <li key={violation.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-primary-600 truncate">
                            {violation.category}
                          </p>
                          <p className="text-sm text-gray-500">
                            {violation.description}
                          </p>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              <p className="flex items-center text-sm text-gray-500">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${severityColors[violation.severity as keyof typeof severityColors]}`}>
                                  {violation.severity}
                                </span>
                              </p>
                              {violation.points_deducted > 0 && (
                                <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                  Points deducted: {violation.points_deducted}
                                </p>
                              )}
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              {violation.corrected ? (
                                <span className="text-green-600">Corrected on {formatDate(violation.correction_date!)}</span>
                              ) : (
                                <span className="text-red-600">Not corrected</span>
                              )}
                            </div>
                          </div>
                          {violation.correction_notes && (
                            <div className="mt-2 text-sm text-gray-600">
                              <p className="font-medium">Correction notes:</p>
                              <p>{violation.correction_notes}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex-shrink-0 ml-5">
                          <Link
                            href={`/health/inspections/${inspection.id}/violations/${violation.id}`}
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
                <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No violations found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This inspection has no violations recorded.
                </p>
                {hasPermission('health.violation.create') && (
                  <div className="mt-6">
                    <Link href={`/health/inspections/${inspection.id}/violations/new`}>
                      <button
                        type="button"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                        Add Violation
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Reports</h3>
              {hasPermission('health.report.create') && (
                <Link href={`/health/inspections/${inspection.id}/reports/new`}>
                  <button
                    type="button"
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Report
                  </button>
                </Link>
              )}
            </div>
            
            {reports.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {reports.map((report) => (
                  <li key={report.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-primary-600 truncate">
                            {report.report_type.replace('_', ' ').toUpperCase()} Report
                          </p>
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {report.summary}
                          </p>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              <p className="flex items-center text-sm text-gray-500">
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                Generated: {formatDate(report.generated_at)}
                              </p>
                              <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                Status: <span className={`ml-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  report.status === 'approved' ? 'bg-green-100 text-green-800' :
                                  report.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {report.status}
                                </span>
                              </p>
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              {report.file_name && (
                                <button className="text-primary-600 hover:text-primary-900">
                                  Download Report
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0 ml-5">
                          <Link
                            href={`/health/inspections/${inspection.id}/reports/${report.id}`}
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
                <h3 className="mt-2 text-sm font-medium text-gray-900">No reports found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No reports have been generated for this inspection yet.
                </p>
                {hasPermission('health.report.create') && (
                  <div className="mt-6">
                    <Link href={`/health/inspections/${inspection.id}/reports/new`}>
                      <button
                        type="button"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                        Generate Report
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
                      Delete Health Inspection
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this health inspection? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleDeleteInspection}
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

export default InspectionDetailPage;