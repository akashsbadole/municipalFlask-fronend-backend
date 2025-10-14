import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { buildingsAPI } from '@/lib/api';
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
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface BuildingPlan {
  id: string;
  application_number: string;
  title: string;
  description: string;
  applicant_name: string;
  applicant_address: string;
  contact_number: string;
  email: string;
  property_address: string;
  ward: string;
  survey_number: string;
  building_type: string;
  building_category: string;
  plot_area: number;
  existing_built_up_area: number;
  proposed_built_up_area: number;
  number_of_floors: number;
  height_of_building: number;
  setback_front: number;
  setback_rear: number;
  setback_left: number;
  setback_right: number;
  parking_spaces: number;
  water_connection_required: string;
  electricity_connection_required: string;
  architect_name: string;
  architect_license_number: string;
  engineer_name: string;
  engineer_license_number: string;
  estimated_cost: number;
  status: string;
  application_date: string;
  documents?: string[];
  remarks?: string;
  inspected_by?: string;
  inspected_date?: string;
  approved_by?: string;
  approved_date?: string;
  rejection_reason?: string;
  approval_workflow?: Array<{
    level: number;
    role: string;
    status: string;
    processed_by?: string;
    processed_date?: string;
    remarks?: string;
  }>;
}

const BuildingPlanDetailPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  
  const [buildingPlan, setBuildingPlan] = useState<BuildingPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);

  useEffect(() => {
    const fetchBuildingPlanDetails = async () => {
      if (!id) return;
      
      try {
        const response = await buildingsAPI.getById(id as string);
        setBuildingPlan(response.data);
        setIsLoading(false);
      } catch (error: any) {
        const message = error.response?.data?.error || 'Failed to load building plan details';
        toast.error(message);
        router.push('/buildings');
      }
    };

    fetchBuildingPlanDetails();
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
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'requires_changes':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-5 w-5" />;
      case 'under_review':
        return <ClockIcon className="h-5 w-5" />;
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5" />;
      case 'rejected':
        return <XCircleIcon className="h-5 w-5" />;
      case 'requires_changes':
        return <ExclamationTriangleIcon className="h-5 w-5" />;
      default:
        return <ClockIcon className="h-5 w-5" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!buildingPlan) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Building Plan Not Found</h3>
        <p className="mt-2 text-sm text-gray-500">
          The building plan you're looking for doesn't exist or has been removed.
        </p>
        <div className="mt-6">
          <Link
            href="/buildings"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Back to Building Plans
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/buildings" className="flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeftIcon className="mr-1 h-4 w-4" />
          Back to Building Plans
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">Building Plan Details</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Application number: {buildingPlan.application_number}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(buildingPlan.status)}`}>
                {getStatusIcon(buildingPlan.status)}
                <span className="ml-1">{buildingPlan.status.replace('_', ' ')}</span>
              </span>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            {/* Application Information */}
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Application Title</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {buildingPlan.title}
              </dd>
            </div>
            
            {buildingPlan.description && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {buildingPlan.description}
                </dd>
              </div>
            )}
            
            {/* Applicant Information */}
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <UserIcon className="h-5 w-5 mr-2 text-gray-400" />
                Applicant Name
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {buildingPlan.applicant_name}
              </dd>
            </div>
            
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Applicant Address</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {buildingPlan.applicant_address}
              </dd>
            </div>
            
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Contact Information</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <p>Phone: {buildingPlan.contact_number}</p>
                <p>Email: {buildingPlan.email}</p>
              </dd>
            </div>
            
            {/* Property Information */}
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <MapPinIcon className="h-5 w-5 mr-2 text-gray-400" />
                Property Address
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <p>{buildingPlan.property_address}</p>
                <p>Ward: {buildingPlan.ward}</p>
                <p>Survey Number: {buildingPlan.survey_number}</p>
              </dd>
            </div>
            
            {/* Building Details */}
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <BuildingOfficeIcon className="h-5 w-5 mr-2 text-gray-400" />
                Building Details
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <p>Type: {buildingPlan.building_type}</p>
                <p>Category: {buildingPlan.building_category}</p>
                <p>Number of Floors: {buildingPlan.number_of_floors}</p>
                <p>Building Height: {buildingPlan.height_of_building} meters</p>
              </dd>
            </div>
            
            {/* Area Details */}
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Area Details</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <p>Plot Area: {buildingPlan.plot_area} sq. meters</p>
                {buildingPlan.existing_built_up_area > 0 && (
                  <p>Existing Built-up Area: {buildingPlan.existing_built_up_area} sq. meters</p>
                )}
                <p>Proposed Built-up Area: {buildingPlan.proposed_built_up_area} sq. meters</p>
                <p>Parking Spaces: {buildingPlan.parking_spaces || 0}</p>
              </dd>
            </div>
            
            {/* Setback Details */}
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Setback Details (meters)</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <p>Front: {buildingPlan.setback_front || 0}m</p>
                <p>Rear: {buildingPlan.setback_rear || 0}m</p>
                <p>Left: {buildingPlan.setback_left || 0}m</p>
                <p>Right: {buildingPlan.setback_right || 0}m</p>
              </dd>
            </div>
            
            {/* Professional Details */}
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Professional Details</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <p>Architect: {buildingPlan.architect_name} ({buildingPlan.architect_license_number})</p>
                {buildingPlan.engineer_name && (
                  <p>Engineer: {buildingPlan.engineer_name} ({buildingPlan.engineer_license_number})</p>
                )}
              </dd>
            </div>
            
            {/* Cost and Connections */}
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <CurrencyDollarIcon className="h-5 w-5 mr-2 text-gray-400" />
                Cost & Connections
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <p>Estimated Cost: ₹{buildingPlan.estimated_cost.toLocaleString()}</p>
                <p>Water Connection Required: {buildingPlan.water_connection_required === 'yes' ? 'Yes' : 'No'}</p>
                <p>Electricity Connection Required: {buildingPlan.electricity_connection_required === 'yes' ? 'Yes' : 'No'}</p>
              </dd>
            </div>
            
            {/* Date Information */}
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <CalendarIcon className="h-5 w-5 mr-2 text-gray-400" />
                Important Dates
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <p>Application Date: {formatDate(buildingPlan.application_date)}</p>
                {buildingPlan.inspected_date && (
                  <p>Inspection Date: {formatDate(buildingPlan.inspected_date)}</p>
                )}
                {buildingPlan.approved_date && (
                  <p>Approval Date: {formatDate(buildingPlan.approved_date)}</p>
                )}
              </dd>
            </div>
            
            {/* Inspection Information */}
            {buildingPlan.inspected_by && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Inspection Details</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <p>Inspected By: {buildingPlan.inspected_by}</p>
                  {buildingPlan.inspected_date && (
                    <p>Inspection Date: {formatDate(buildingPlan.inspected_date)}</p>
                  )}
                </dd>
              </div>
            )}
            
            {/* Approval Information */}
            {buildingPlan.approved_by && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Approval Details</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <p>Approved By: {buildingPlan.approved_by}</p>
                  {buildingPlan.approved_date && (
                    <p>Approval Date: {formatDate(buildingPlan.approved_date)}</p>
                  )}
                </dd>
              </div>
            )}
            
            {/* Remarks */}
            {buildingPlan.remarks && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Remarks</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {buildingPlan.remarks}
                </dd>
              </div>
            )}
            
            {/* Rejection Reason */}
            {buildingPlan.rejection_reason && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Rejection Reason</dt>
                <dd className="mt-1 text-sm text-red-900 sm:mt-0 sm:col-span-2">
                  {buildingPlan.rejection_reason}
                </dd>
              </div>
            )}
            
            {/* Documents */}
            {buildingPlan.documents && buildingPlan.documents.length > 0 && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <DocumentTextIcon className="h-5 w-5 mr-2 text-gray-400" />
                  Documents
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                    {buildingPlan.documents.map((doc, index) => (
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
                            <EyeIcon className="h-4 w-4" />
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
            
            {/* Approval Workflow */}
            {buildingPlan.approval_workflow && buildingPlan.approval_workflow.length > 0 && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Approval Workflow</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="space-y-4">
                    {buildingPlan.approval_workflow.map((step, index) => (
                      <div key={index} className="flex items-start">
                        <div className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center ${
                          step.status === 'completed' ? 'bg-green-100' : 
                          step.status === 'pending' ? 'bg-yellow-100' : 
                          step.status === 'rejected' ? 'bg-red-100' : 'bg-gray-100'
                        }`}>
                          {step.status === 'completed' ? (
                            <CheckCircleIcon className="h-4 w-4 text-green-600" />
                          ) : step.status === 'pending' ? (
                            <ClockIcon className="h-4 w-4 text-yellow-600" />
                          ) : step.status === 'rejected' ? (
                            <XCircleIcon className="h-4 w-4 text-red-600" />
                          ) : (
                            <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                          )}
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">
                              Level {step.level}: {step.role}
                            </p>
                            {step.processed_date && (
                              <p className="text-xs text-gray-500">
                                {formatDate(step.processed_date)}
                              </p>
                            )}
                          </div>
                          {step.processed_by && (
                            <p className="text-xs text-gray-500">
                              Processed by: {step.processed_by}
                            </p>
                          )}
                          {step.remarks && (
                            <p className="text-xs text-gray-600 mt-1">
                              {step.remarks}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex space-x-3">
        {user?.role === 'admin' && buildingPlan.status === 'pending' && (
          <Link
            href={`/buildings/${id}/edit`}
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

export default BuildingPlanDetailPage;