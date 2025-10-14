import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { publicWorksAPI } from '@/lib/api';
import { toast } from 'react-toastify';
import {
  DocumentTextIcon,
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UserIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { format } from 'date-fns';

interface Tender {
  id: string;
  project_id: string;
  tender_number: string;
  title: string;
  description: string;
  publication_date: string;
  submission_end_date: string;
  opening_date: string;
  estimated_cost: number;
  status: string;
  tender_type: string;
  pre_bid_meeting_date: string;
  bid_security_amount: number;
  performance_security_amount: number;
  completion_period: number;
  eligibility_criteria: string;
  terms_and_conditions: string;
  created_at: string;
  updated_at: string;
}

interface Bidder {
  id: string;
  tender_id: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  pan_number: string;
  gst_number: string;
  bid_amount: number;
  bid_submission_date: string;
  status: string;
  documents: any[];
}

interface Document {
  id: string;
  name: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
  uploaded_by: string;
}

const TenderDetailPage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  
  const [tender, setTender] = useState<Tender | null>(null);
  const [bidders, setBidders] = useState<Bidder[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'bidders' | 'documents'>('overview');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (id && hasPermission('public_works.read')) {
      fetchTenderDetails();
      fetchTenderBidders();
      fetchTenderDocuments();
    }
  }, [id, hasPermission]);

  const fetchTenderDetails = async () => {
    try {
      const response = await publicWorksAPI.getTender(id as string);
      setTender(response.data);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to fetch tender details';
      setError(message);
      toast.error(message);
    }
  };

  const fetchTenderBidders = async () => {
    try {
      const response = await publicWorksAPI.getTenderBidders(id as string);
      setBidders(response.data);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to fetch tender bidders';
      toast.error(message);
    }
  };

  const fetchTenderDocuments = async () => {
    try {
      const response = await publicWorksAPI.getTenderDocuments(id as string);
      setDocuments(response.data);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to fetch tender documents';
      toast.error(message);
    }
  };

  const handleDeleteTender = async () => {
    try {
      await publicWorksAPI.deleteTender(id as string);
      toast.success('Tender deleted successfully');
      router.push('/public-works');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to delete tender';
      toast.error(message);
    } finally {
      setShowDeleteModal(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Published':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Published
          </span>
        );
      case 'Closed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Closed
          </span>
        );
      case 'Awarded':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            Awarded
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
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

  const getBidderStatusBadge = (status: string) => {
    switch (status) {
      case 'Submitted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Submitted
          </span>
        );
      case 'Qualified':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Qualified
          </span>
        );
      case 'Disqualified':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Disqualified
          </span>
        );
      case 'Selected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            Selected
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!hasPermission('public_works.read')) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
        <p className="mt-2 text-sm text-gray-500">
          You don't have permission to access tender details.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !tender) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Error</h3>
        <p className="mt-2 text-sm text-gray-500">{error || 'Tender not found'}</p>
        <div className="mt-6">
          <Link href="/public-works">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Back to Tenders
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/public-works">
              <button
                type="button"
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Back
              </button>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{tender.title}</h1>
              <p className="mt-1 text-sm text-gray-500">{tender.tender_number}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {getStatusBadge(tender.status)}
            {hasPermission('public_works.update') && (
              <Link href={`/public-works/tenders/${tender.id}/edit`}>
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
              </Link>
            )}
            {hasPermission('public_works.delete') && (
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: DocumentTextIcon },
            { id: 'bidders', name: 'Bidders', icon: UserIcon },
            { id: 'documents', name: 'Documents', icon: DocumentTextIcon },
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
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Tender Details */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Tender Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900">{tender.description}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Tender Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">{tender.tender_type}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Publication Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {format(new Date(tender.publication_date), 'MMM d, yyyy')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Submission End Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {format(new Date(tender.submission_end_date), 'MMM d, yyyy')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Opening Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {format(new Date(tender.opening_date), 'MMM d, yyyy')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Completion Period</dt>
                  <dd className="mt-1 text-sm text-gray-900">{tender.completion_period} days</dd>
                </div>
                {tender.pre_bid_meeting_date && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Pre-Bid Meeting Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {format(new Date(tender.pre_bid_meeting_date), 'MMM d, yyyy')}
                    </dd>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Estimated Cost</dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900">
                    {formatCurrency(tender.estimated_cost)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Bid Security Amount</dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900">
                    {formatCurrency(tender.bid_security_amount)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Performance Security Amount</dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900">
                    {formatCurrency(tender.performance_security_amount)}
                  </dd>
                </div>
              </div>
            </div>
          </div>

          {/* Eligibility Criteria */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Eligibility Criteria</h3>
              <div className="text-sm text-gray-900 whitespace-pre-wrap">
                {tender.eligibility_criteria}
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Terms and Conditions</h3>
              <div className="text-sm text-gray-900 whitespace-pre-wrap">
                {tender.terms_and_conditions}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bidders Tab */}
      {activeTab === 'bidders' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Tender Bidders</h3>
              {hasPermission('public_works.update') && tender.status === 'Published' && (
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Bidder
                </button>
              )}
            </div>
            {bidders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bidder
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bid Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Submission Date
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
                    {bidders.map((bidder) => (
                      <tr key={bidder.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{bidder.name}</div>
                            <div className="text-sm text-gray-500">{bidder.contact_person}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{bidder.phone}</div>
                          <div className="text-sm text-gray-500">{bidder.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatCurrency(bidder.bid_amount)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {format(new Date(bidder.bid_submission_date), 'MMM d, yyyy')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getBidderStatusBadge(bidder.status)}
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
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No bidders found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {tender.status === 'Published' 
                    ? 'Bidders have not submitted their bids yet.'
                    : 'No bids were submitted for this tender.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Tender Documents</h3>
              {hasPermission('public_works.update') && (
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Upload Document
                </button>
              )}
            </div>
            {documents.length > 0 ? (
              <div className="space-y-4">
                {documents.map((document) => (
                  <div key={document.id} className="flex items-center justify-between border-b border-gray-200 pb-4 last:border-b-0">
                    <div className="flex items-center">
                      <DocumentTextIcon className="h-8 w-8 text-gray-400 mr-3" />
                      <div>
                        <h4 className="text-md font-medium text-gray-900">{document.name}</h4>
                        <div className="flex items-center mt-1 space-x-4">
                          <span className="text-sm text-gray-500">{document.file_type}</span>
                          <span className="text-sm text-gray-500">{formatFileSize(document.file_size)}</span>
                          <span className="text-sm text-gray-500">
                            Uploaded by {document.uploaded_by} on {format(new Date(document.uploaded_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No documents found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Upload tender documents to get started.
                </p>
                {hasPermission('public_works.update') && (
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
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delete Tender
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this tender? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDeleteTender}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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

export default TenderDetailPage;