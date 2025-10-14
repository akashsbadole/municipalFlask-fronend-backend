import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { egovAPI } from '@/lib/api';
import { toast } from 'react-toastify';
import {
  DocumentTextIcon,
  MegaphoneIcon,
  ClipboardDocumentListIcon,
  FolderIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  UserIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { format } from 'date-fns';

interface PublicNotice {
  id: string;
  title: string;
  content: string;
  notice_type: string;
  priority: string;
  publication_date: string;
  expiry_date: string;
  status: string;
  created_at: string;
  creator_name: string;
}

interface RTIRequest {
  id: string;
  request_number: string;
  applicant_name: string;
  subject: string;
  department: string;
  priority: string;
  status: string;
  created_at: string;
  assigned_officer_name: string;
}

interface Document {
  id: string;
  title: string;
  description: string;
  category: string;
  document_type: string;
  department: string;
  is_public: boolean;
  created_at: string;
  uploader_name: string;
  download_count: number;
}

interface EGovStats {
  notices_count: number;
  rti_pending_count: number;
  rti_under_review_count: number;
  documents_count: number;
}

const EGOVPage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  
  const [notices, setNotices] = useState<PublicNotice[]>([]);
  const [rtiRequests, setRTIRequests] = useState<RTIRequest[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<EGovStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'notices' | 'rti' | 'documents'>('overview');
  
  // Filters for notices
  const [noticeSearchTerm, setNoticeSearchTerm] = useState('');
  const [noticeTypeFilter, setNoticeTypeFilter] = useState('');
  const [noticePriorityFilter, setNoticePriorityFilter] = useState('');
  const [showNoticeFilters, setShowNoticeFilters] = useState(false);
  
  // Filters for RTI requests
  const [rtiSearchTerm, setRTISearchTerm] = useState('');
  const [rtiStatusFilter, setRTIStatusFilter] = useState('');
  const [rtiDepartmentFilter, setRTIDepartmentFilter] = useState('');
  const [showRTIFilters, setShowRTIFilters] = useState(false);
  
  // Filters for documents
  const [documentSearchTerm, setDocumentSearchTerm] = useState('');
  const [documentCategoryFilter, setDocumentCategoryFilter] = useState('');
  const [documentDepartmentFilter, setDocumentDepartmentFilter] = useState('');
  const [showDocumentFilters, setShowDocumentFilters] = useState(false);
  
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    pages: 0,
  });

  const noticeTypes = [
    'General',
    'Tender',
    'Event',
    'Holiday',
    'Public Interest',
    'Policy',
  ];

  const noticePriorities = [
    'High',
    'Medium',
    'Normal',
  ];

  const rtiStatuses = [
    'Pending',
    'Under Review',
    'Approved',
    'Rejected',
    'Closed',
  ];

  const rtiDepartments = [
    'Public Works',
    'Water Supply',
    'Health',
    'Finance',
    'Urban Development',
    'Administration',
  ];

  const documentCategories = [
    'Circular',
    'Meeting Minute',
    'Report',
    'Policy',
    'Form',
    'Guideline',
    'Other',
  ];

  const documentDepartments = [
    'Public Works',
    'Water Supply',
    'Health',
    'Finance',
    'Urban Development',
    'Administration',
  ];

  useEffect(() => {
    if (hasPermission('egov.read')) {
      fetchStats();
      if (activeTab === 'notices') {
        fetchNotices();
      } else if (activeTab === 'rti') {
        fetchRTIRequests();
      } else if (activeTab === 'documents') {
        fetchDocuments();
      }
    }
  }, [hasPermission, activeTab, pagination.page, noticeSearchTerm, noticeTypeFilter, noticePriorityFilter, rtiSearchTerm, rtiStatusFilter, rtiDepartmentFilter, documentSearchTerm, documentCategoryFilter, documentDepartmentFilter]);

  const fetchStats = async () => {
    try {
      const response = await egovAPI.getStats();
      setStats(response.data);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to fetch e-governance statistics';
      toast.error(message);
    }
  };

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        per_page: pagination.per_page,
      };
      
      if (noticeSearchTerm) params.search = noticeSearchTerm;
      if (noticeTypeFilter) params.notice_type = noticeTypeFilter;
      if (noticePriorityFilter) params.priority = noticePriorityFilter;
      
      const response = await egovAPI.getNotices(params);
      setNotices(response.data.notices);
      setPagination(response.data.pagination);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to fetch public notices';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRTIRequests = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        per_page: pagination.per_page,
      };
      
      if (rtiSearchTerm) params.search = rtiSearchTerm;
      if (rtiStatusFilter) params.status = rtiStatusFilter;
      if (rtiDepartmentFilter) params.department = rtiDepartmentFilter;
      
      const response = await egovAPI.getRTIRequests(params);
      setRTIRequests(response.data.rti_requests);
      setPagination(response.data.pagination);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to fetch RTI requests';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        per_page: pagination.per_page,
      };
      
      if (documentSearchTerm) params.search = documentSearchTerm;
      if (documentCategoryFilter) params.category = documentCategoryFilter;
      if (documentDepartmentFilter) params.department = documentDepartmentFilter;
      
      const response = await egovAPI.getDocuments(params);
      setDocuments(response.data.documents);
      setPagination(response.data.pagination);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to fetch documents';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const getNoticePriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
            High
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Medium
          </span>
        );
      case 'Normal':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Normal
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {priority}
          </span>
        );
    }
  };

  const getRTIStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <ClockIcon className="w-4 h-4 mr-1" />
            Pending
          </span>
        );
      case 'Under Review':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <ClockIcon className="w-4 h-4 mr-1" />
            Under Review
          </span>
        );
      case 'Approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            Approved
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Rejected
          </span>
        );
      case 'Closed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Closed
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

  const clearNoticeFilters = () => {
    setNoticeSearchTerm('');
    setNoticeTypeFilter('');
    setNoticePriorityFilter('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearRTIFilters = () => {
    setRTISearchTerm('');
    setRTIStatusFilter('');
    setRTIDepartmentFilter('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearDocumentFilters = () => {
    setDocumentSearchTerm('');
    setDocumentCategoryFilter('');
    setDocumentDepartmentFilter('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  if (!hasPermission('egov.read')) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
        <p className="mt-2 text-sm text-gray-500">
          You don't have permission to access e-governance module.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">E-Governance</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage public notices, RTI requests, and documents
            </p>
          </div>
          {hasPermission('egov.create') && (
            <div className="flex space-x-3">
              {activeTab === 'notices' && (
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  New Notice
                </button>
              )}
              {activeTab === 'rti' && (
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  New RTI Request
                </button>
              )}
              {activeTab === 'documents' && (
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Upload Document
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
            { id: 'overview', name: 'Overview', icon: DocumentTextIcon },
            { id: 'notices', name: 'Public Notices', icon: MegaphoneIcon },
            { id: 'rti', name: 'RTI Requests', icon: ClipboardDocumentListIcon },
            { id: 'documents', name: 'Documents', icon: FolderIcon },
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
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <MegaphoneIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Notices</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.notices_count}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                  <ClipboardDocumentListIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pending RTI</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.rti_pending_count}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <ClockIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">RTI Under Review</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.rti_under_review_count}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <FolderIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Documents</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.documents_count}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Recent Notices */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Recent Public Notices</h3>
                <Link href="/egov/notices">
                  <button
                    type="button"
                    className="text-sm text-primary-600 hover:text-primary-900"
                  >
                    View All
                  </button>
                </Link>
              </div>
              <div className="space-y-3">
                {notices.slice(0, 5).map((notice) => (
                  <div key={notice.id} className="flex items-center justify-between border-b border-gray-200 pb-3 last:border-b-0">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{notice.title}</h4>
                      <div className="flex items-center mt-1 space-x-4">
                        <span className="text-xs text-gray-500">{notice.notice_type}</span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(notice.publication_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getNoticePriorityBadge(notice.priority)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Recent RTI Requests */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Recent RTI Requests</h3>
                <Link href="/egov/rti">
                  <button
                    type="button"
                    className="text-sm text-primary-600 hover:text-primary-900"
                  >
                    View All
                  </button>
                </Link>
              </div>
              <div className="space-y-3">
                {rtiRequests.slice(0, 5).map((rti) => (
                  <div key={rti.id} className="flex items-center justify-between border-b border-gray-200 pb-3 last:border-b-0">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{rti.subject}</h4>
                      <div className="flex items-center mt-1 space-x-4">
                        <span className="text-xs text-gray-500">{rti.request_number}</span>
                        <span className="text-xs text-gray-500">{rti.applicant_name}</span>
                        <span className="text-xs text-gray-500">{rti.department}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getRTIStatusBadge(rti.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notices Tab */}
      {activeTab === 'notices' && (
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
                      placeholder="Search notices..."
                      value={noticeSearchTerm}
                      onChange={(e) => setNoticeSearchTerm(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNoticeFilters(!showNoticeFilters)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <FunnelIcon className="h-4 w-4 mr-1" />
                    Filters
                  </button>
                  {(noticeSearchTerm || noticeTypeFilter || noticePriorityFilter) && (
                    <button
                      type="button"
                      onClick={clearNoticeFilters}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
              
              {showNoticeFilters && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="notice-type-filter" className="block text-sm font-medium text-gray-700">
                      Notice Type
                    </label>
                    <select
                      id="notice-type-filter"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      value={noticeTypeFilter}
                      onChange={(e) => setNoticeTypeFilter(e.target.value)}
                    >
                      <option value="">All Types</option>
                      {noticeTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="notice-priority-filter" className="block text-sm font-medium text-gray-700">
                      Priority
                    </label>
                    <select
                      id="notice-priority-filter"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      value={noticePriorityFilter}
                      onChange={(e) => setNoticePriorityFilter(e.target.value)}
                    >
                      <option value="">All Priorities</option>
                      {noticePriorities.map(priority => (
                        <option key={priority} value={priority}>{priority}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notices Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {notices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notice
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Publication Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {notices.map((notice) => (
                      <tr key={notice.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{notice.title}</div>
                            <div className="text-sm text-gray-500">by {notice.creator_name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{notice.notice_type}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {format(new Date(notice.publication_date), 'MMM d, yyyy')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getNoticePriorityBadge(notice.priority)}
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
                            {hasPermission('egov.update') && (
                              <button
                                type="button"
                                className="text-blue-600 hover:text-blue-900"
                                title="Edit"
                              >
                                <PencilIcon className="h-5 w-5" />
                              </button>
                            )}
                            {hasPermission('egov.delete') && (
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
                <MegaphoneIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No notices found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {noticeSearchTerm || noticeTypeFilter || noticePriorityFilter
                    ? 'Try adjusting your search or filters'
                    : 'Get started by adding a new notice'}
                </p>
                {hasPermission('egov.create') && !noticeSearchTerm && !noticeTypeFilter && !noticePriorityFilter && (
                  <div className="mt-6">
                    <button
                      type="button"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Add Notice
                    </button>
                  </div>
                )}
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

      {/* RTI Requests Tab */}
      {activeTab === 'rti' && (
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
                      placeholder="Search RTI requests..."
                      value={rtiSearchTerm}
                      onChange={(e) => setRTISearchTerm(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowRTIFilters(!showRTIFilters)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <FunnelIcon className="h-4 w-4 mr-1" />
                    Filters
                  </button>
                  {(rtiSearchTerm || rtiStatusFilter || rtiDepartmentFilter) && (
                    <button
                      type="button"
                      onClick={clearRTIFilters}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
              
              {showRTIFilters && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="rti-status-filter" className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      id="rti-status-filter"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      value={rtiStatusFilter}
                      onChange={(e) => setRTIStatusFilter(e.target.value)}
                    >
                      <option value="">All Statuses</option>
                      {rtiStatuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="rti-department-filter" className="block text-sm font-medium text-gray-700">
                      Department
                    </label>
                    <select
                      id="rti-department-filter"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      value={rtiDepartmentFilter}
                      onChange={(e) => setRTIDepartmentFilter(e.target.value)}
                    >
                      <option value="">All Departments</option>
                      {rtiDepartments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RTI Requests Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {rtiRequests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Request
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Applicant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
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
                    {rtiRequests.map((rti) => (
                      <tr key={rti.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{rti.subject}</div>
                            <div className="text-sm text-gray-500">{rti.request_number}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{rti.applicant_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{rti.department}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getRTIStatusBadge(rti.status)}
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
                            {hasPermission('egov.update') && rti.status === 'Pending' && (
                              <button
                                type="button"
                                className="text-blue-600 hover:text-blue-900"
                                title="Assign"
                              >
                                <UserIcon className="h-5 w-5" />
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
                <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No RTI requests found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {rtiSearchTerm || rtiStatusFilter || rtiDepartmentFilter
                    ? 'Try adjusting your search or filters'
                    : 'No RTI requests have been submitted yet'}
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

      {/* Documents Tab */}
      {activeTab === 'documents' && (
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
                      placeholder="Search documents..."
                      value={documentSearchTerm}
                      onChange={(e) => setDocumentSearchTerm(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDocumentFilters(!showDocumentFilters)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <FunnelIcon className="h-4 w-4 mr-1" />
                    Filters
                  </button>
                  {(documentSearchTerm || documentCategoryFilter || documentDepartmentFilter) && (
                    <button
                      type="button"
                      onClick={clearDocumentFilters}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
              
              {showDocumentFilters && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="document-category-filter" className="block text-sm font-medium text-gray-700">
                      Category
                    </label>
                    <select
                      id="document-category-filter"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      value={documentCategoryFilter}
                      onChange={(e) => setDocumentCategoryFilter(e.target.value)}
                    >
                      <option value="">All Categories</option>
                      {documentCategories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="document-department-filter" className="block text-sm font-medium text-gray-700">
                      Department
                    </label>
                    <select
                      id="document-department-filter"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      value={documentDepartmentFilter}
                      onChange={(e) => setDocumentDepartmentFilter(e.target.value)}
                    >
                      <option value="">All Departments</option>
                      {documentDepartments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Documents Table */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            {documents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Document
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Uploaded By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Downloads
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {documents.map((document) => (
                      <tr key={document.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{document.title}</div>
                            <div className="text-sm text-gray-500">{document.document_type}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{document.category}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{document.department}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{document.uploader_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{document.download_count}</div>
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
                            <button
                              type="button"
                              className="text-green-600 hover:text-green-900"
                              title="Download"
                            >
                              <ArrowDownTrayIcon className="h-5 w-5" />
                            </button>
                            {hasPermission('egov.update') && (
                              <button
                                type="button"
                                className="text-blue-600 hover:text-blue-900"
                                title="Edit"
                              >
                                <PencilIcon className="h-5 w-5" />
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
                <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No documents found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {documentSearchTerm || documentCategoryFilter || documentDepartmentFilter
                    ? 'Try adjusting your search or filters'
                    : 'Get started by uploading documents'}
                </p>
                {hasPermission('egov.create') && !documentSearchTerm && !documentCategoryFilter && !documentDepartmentFilter && (
                  <div className="mt-6">
                    <button
                      type="button"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Upload Document
                    </button>
                  </div>
                )}
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

export default EGOVPage;