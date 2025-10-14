import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { licensesAPI } from '@/lib/api';
import { toast } from 'react-toastify';
import {
  ArrowLeftIcon,
  BuildingOfficeIcon,
  UserIcon,
  MapPinIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowDownTrayIcon,
  PencilIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface License {
  id: string;
  license_number: string;
  business_name: string;
  business_type: string;
  owner_name: string;
  status: string;
  application_date: string;
  issue_date?: string;
  expiry_date?: string;
  fee: number;
  premises_address: string;
  ward: string;
  contact_number: string;
  email: string;
  pan_number: string;
  gst_number?: string;
  documents?: string[];
  remarks?: string;
  inspected_by?: string;
  inspected_date?: string;
}

const LicenseDetailPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  
  const [license, setLicense] = useState<License | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);

  useEffect(() => {
    const fetchLicenseDetails = async () => {
      if (!id) return;
      
      try {
        const response = await licensesAPI.getById(id as string);
        setLicense(response.data);
        setIsLoading(false);
      } catch (error: any) {
        const message = error.response?.data?.error || 'Failed to load license details';
        toast.error(message);
        router.push('/licenses');
      }
    };

    fetchLicenseDetails();
  }, [id, router]);

  const viewDocument = (documentUrl: string) => {
    setSelectedDocument(documentUrl);
    setShowDocumentModal(true);
  };

  const downloadDocument = (documentUrl: string, documentName: string) => {
    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = documentName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      case 'issued':
        return 'bg-purple-100 text-purple-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5" />;
      case 'rejected':
        return <XCircleIcon className="h-5 w-5" />;
      default:
        return <ClockIcon className="h-5 w-5" />;
    }
  };

  const isEligibleForRenewal = () => {
    if (!license || license.status !== 'approved') return false;
    
    const today = new Date();
    const expiryDate = license.expiry_date ? new Date(license.expiry_date) : null;
    if (!expiryDate) return false;
    
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 90 && daysUntilExpiry >= -30;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!license) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">License Not Found</h3>
        <p className="mt-2 text-sm text-gray-500">
          The license you're looking for doesn't exist or has been removed.
        </p>
        <div className="mt-6">
          <Link
            href="/licenses"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Back to Licenses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/licenses" className="flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeftIcon className="mr-1 h-4 w-4" />
          Back to Licenses
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Trade License Details</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                License number: {license.license_number}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(license.status)}`}>
                {getStatusIcon(license.status)}
                <span className="ml-1">{license.status.replace('_', ' ')}</span>
              </span>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            {/* Business Information */}
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <BuildingOfficeIcon className="h-5 w-5 mr-2 text-gray-400" />
                Business Name
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {license.business_name}
              </dd>
            </div>
            
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Business Type</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {license.business_type}
              </dd>
            </div>
            
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <UserIcon className="h-5 w-5 mr-2 text-gray-400" />
                Owner Name
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {license.owner_name}
              </dd>
            </div>
            
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Contact Information</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <p>Phone: {license.contact_number}</p>
                <p>Email: {license.email}</p>
              </dd>
            </div>
            
            {/* Address Information */}
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <MapPinIcon className="h-5 w-5 mr-2 text-gray-400" />
                Address
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <p>{license.premises_address}</p>
                <p>Ward: {license.ward}</p>
              </dd>
            </div>
            
            {/* Financial Information */}
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <CurrencyDollarIcon className="h-5 w-5 mr-2 text-gray-400" />
                Financial Details
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <p>License Fee: ₹{license.fee.toLocaleString()}</p>
                <p>PAN Number: {license.pan_number}</p>
                {license.gst_number && <p>GST Number: {license.gst_number}</p>}
              </dd>
            </div>
            
            {/* Date Information */}
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2 text-gray-400" />
                Important Dates
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <p>Application Date: {new Date(license.application_date).toLocaleDateString('en-IN')}</p>
                {license.issue_date && (
                  <p>Issue Date: {new Date(license.issue_date).toLocaleDateString('en-IN')}</p>
                )}
                {license.expiry_date && (
                  <p>Expiry Date: {new Date(license.expiry_date).toLocaleDateString('en-IN')}</p>
                )}
              </dd>
            </div>
            
            {/* Inspection Information */}
            {(license.inspected_by || license.inspected_date) && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Inspection Details</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {license.inspected_by && <p>Inspected By: {license.inspected_by}</p>}
                  {license.inspected_date && (
                    <p>Inspection Date: {new Date(license.inspected_date).toLocaleDateString('en-IN')}</p>
                  )}
                </dd>
              </div>
            )}
            
            {/* Remarks */}
            {license.remarks && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Remarks</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {license.remarks}
                </dd>
              </div>
            )}
            
            {/* Documents */}
            {license.documents && license.documents.length > 0 && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <DocumentTextIcon className="h-5 w-5 mr-2 text-gray-400" />
                  Documents
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                    {license.documents.map((doc, index) => (
                      <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between">
                        <div className="flex items-center">
                          <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm">{doc}</span>
                        </div>
                        <div className="ml-2 flex-shrink-0 flex space-x-2">
                          <button
                            type="button"
                            className="text-primary-600 hover:text-primary-900"
                            onClick={() => viewDocument(doc)}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="text-primary-600 hover:text-primary-900"
                            onClick={() => downloadDocument(doc, doc)}
                          >
                            <ArrowDownTrayIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex space-x-3">
        {license.status === 'approved' && isEligibleForRenewal() && (
          <Link
            href={`/licenses/${id}/renew`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <CreditCardIcon className="mr-2 h-4 w-4" />
            Renew License
          </Link>
        )}
        
        {user?.role === 'admin' && license.status === 'pending' && (
          <Link
            href={`/licenses/${id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <PencilIcon className="mr-2 h-4 w-4" />
            Edit Application
          </Link>
        )}
      </div>

      {/* Document Modal */}
      {showDocumentModal && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Document Preview
                  </h3>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={() => setShowDocumentModal(false)}
                  >
                    <span className="sr-only">Close</span>
                    <XCircleIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                
                <div className="mt-4">
                  <div className="border border-gray-300 rounded-md p-4 h-96 overflow-auto">
                    <iframe
                      src={selectedDocument || ''}
                      title="Document Preview"
                      className="w-full h-full"
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => downloadDocument(selectedDocument || '', 'document')}
                >
                  Download
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowDocumentModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LicenseDetailPage;