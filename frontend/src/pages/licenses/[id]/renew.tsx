import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { licensesAPI } from '@/lib/api';
import { PaymentDetails } from '@/lib/paymentService';
import { toast } from 'react-toastify';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  PhotoIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import PaymentProcessor from '@/components/Payment/PaymentProcessor';

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
}

const LicenseRenewalPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  
  const [license, setLicense] = useState<License | null>(null);
  const [renewalData, setRenewalData] = useState({
    last_year_turnover: '',
    current_year_turnover: '',
    employees_count: '',
    any_changes: 'no',
    changes_description: '',
  });
  const [documents, setDocuments] = useState<File[]>([]);
  const [documentPreviews, setDocumentPreviews] = useState<string[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);
  const [renewalFee, setRenewalFee] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fee structure based on business type
  const feeStructure: { [key: string]: number } = {
    'Restaurant / Food Service': 5000,
    'Retail Shop': 3000,
    'Manufacturing': 10000,
    'Service Provider': 4000,
    'Office / Professional Services': 3500,
    'Educational Institution': 7000,
    'Healthcare Facility': 8000,
    'Entertainment / Recreation': 6000,
    'Construction': 12000,
    'Transportation': 9000,
    'Other': 4000,
  };

  useEffect(() => {
    const fetchLicenseDetails = async () => {
      if (!id) return;
      
      try {
        const response = await licensesAPI.getById(id as string);
        setLicense(response.data);
        
        // Calculate renewal fee (same as original fee)
        const fee = feeStructure[response.data.business_type] || 4000;
        setRenewalFee(fee);
        
        setIsLoading(false);
      } catch (error: any) {
        const message = error.response?.data?.error || 'Failed to load license details';
        toast.error(message);
        router.push('/licenses');
      }
    };

    fetchLicenseDetails();
  }, [id, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setRenewalData(prev => ({ ...prev, [name]: value }));
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newDocuments = Array.from(e.target.files);
      setDocuments(prev => [...prev, ...newDocuments]);
      
      // Create previews for new documents
      newDocuments.forEach(doc => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setDocumentPreviews(prev => [...prev, event.target.result as string]);
          }
        };
        reader.readAsDataURL(doc);
      });
    }
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
    setDocumentPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!license) return;
    
    // Validate required fields
    if (!renewalData.last_year_turnover || !renewalData.current_year_turnover || !renewalData.employees_count) {
      toast.error('Please fill all required fields');
      return;
    }

    if (renewalData.any_changes === 'yes' && !renewalData.changes_description) {
      toast.error('Please describe the changes in your business');
      return;
    }

    setIsRenewing(true);
    
    try {
      // Create renewal application
      const renewalFormData = new FormData();
      Object.entries(renewalData).forEach(([key, value]) => {
        renewalFormData.append(key, value);
      });
      renewalFormData.append('license_id', license.id);
      renewalFormData.append('renewal_fee', renewalFee.toString());
      
      // Add documents
      documents.forEach((doc) => {
        renewalFormData.append('documents', doc);
      });
      
      // In a real application, you would call the API to submit the renewal
      // For now, we'll simulate it
      setTimeout(() => {
        toast.success('Renewal application submitted successfully!');
        setShowPayment(true);
        setIsRenewing(false);
      }, 1000);
      
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to submit renewal application';
      toast.error(message);
      setIsRenewing(false);
    }
  };

  const handlePaymentSuccess = (transactionId: string) => {
    toast.success('License renewed successfully!');
    
    // In a real application, you would update the license status in the backend
    // For now, we'll just redirect back to the licenses page
    setTimeout(() => {
      router.push('/licenses');
    }, 2000);
  };

  const handlePaymentFailure = (error: string) => {
    console.error('Payment failed:', error);
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
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

  // Check if license is eligible for renewal
  const today = new Date();
  const expiryDate = license.expiry_date ? new Date(license.expiry_date) : null;
  const daysUntilExpiry = expiryDate ? Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0;
  
  const isEligibleForRenewal = license.status === 'approved' && daysUntilExpiry <= 90 && daysUntilExpiry >= -30;

  if (!isEligibleForRenewal) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Not Eligible for Renewal</h3>
        <p className="mt-1 text-sm text-gray-500">
          This license is not eligible for renewal at this time.
          {license.status !== 'approved' && ' Only approved licenses can be renewed.'}
          {daysUntilExpiry > 90 && ' Renewals can only be processed within 90 days of expiry.'}
          {daysUntilExpiry < -30 && ' This license has expired more than 30 days ago. Please apply for a new license.'}
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
        <Link href={`/licenses/${id}`} className="flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeftIcon className="mr-1 h-4 w-4" />
          Back to License Details
        </Link>
      </div>

      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900">License Renewal</h3>
            <p className="mt-1 text-sm text-gray-600">
              Renew your trade license for the next year. Please provide updated information about your business.
            </p>
            
            {/* License Summary */}
            <div className="mt-6 bg-white p-4 rounded-lg shadow">
              <h4 className="text-md font-medium text-gray-900 mb-3">Current License</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">License Number:</span>
                  <span className="font-medium">{license.license_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Business Name:</span>
                  <span className="font-medium">{license.business_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Business Type:</span>
                  <span className="font-medium">{license.business_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Expiry Date:</span>
                  <span className="font-medium">
                    {license.expiry_date ? new Date(license.expiry_date).toLocaleDateString('en-IN') : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    license.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {license.status}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Renewal Fee */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <InformationCircleIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Renewal Fee</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>The renewal fee is <span className="font-bold">₹{renewalFee.toLocaleString()}</span>.</p>
                    <p className="mt-1">Payment will be processed after your renewal application is approved.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-5 md:mt-0 md:col-span-2">
          <form onSubmit={handleRenewal}>
            <div className="shadow sm:rounded-md sm:overflow-hidden">
              <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                {/* Business Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Business Information</h3>
                  
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="last_year_turnover" className="block text-sm font-medium text-gray-700">
                        Last Year Turnover (₹) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="last_year_turnover"
                        id="last_year_turnover"
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        value={renewalData.last_year_turnover}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="current_year_turnover" className="block text-sm font-medium text-gray-700">
                        Current Year Turnover (₹) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="current_year_turnover"
                        id="current_year_turnover"
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        value={renewalData.current_year_turnover}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="employees_count" className="block text-sm font-medium text-gray-700">
                        Number of Employees <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="employees_count"
                        id="employees_count"
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        value={renewalData.employees_count}
                        onChange={handleInputChange}
                        min="1"
                        required
                      />
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="any_changes" className="block text-sm font-medium text-gray-700">
                        Any Changes in Business? <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="any_changes"
                        name="any_changes"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                        value={renewalData.any_changes}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </div>
                    
                    {renewalData.any_changes === 'yes' && (
                      <div className="col-span-6">
                        <label htmlFor="changes_description" className="block text-sm font-medium text-gray-700">
                          Describe Changes <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          id="changes_description"
                          name="changes_description"
                          rows={3}
                          className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          value={renewalData.changes_description}
                          onChange={handleInputChange}
                          placeholder="Please describe any changes in your business operations, address, ownership, etc."
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Document Upload */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Required Documents</h3>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <p>Please upload the following documents:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Previous year financial statement</li>
                      <li>Updated GST registration (if applicable)</li>
                      <li>No objection certificate from property owner (if rented)</li>
                      <li>Updated address proof</li>
                    </ul>
                  </div>
                  
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
                    <div className="space-y-1 text-center">
                      <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="documents"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                        >
                          <span>Upload documents</span>
                          <input
                            id="documents"
                            name="documents"
                            type="file"
                            className="sr-only"
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleDocumentChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PDF, JPG, PNG up to 10MB each
                      </p>
                    </div>
                  </div>
                  
                  {/* Document Previews */}
                  {documentPreviews.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium text-gray-700">Uploaded Documents:</p>
                      {documents.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center">
                            <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-700">{doc.name}</span>
                            <span className="ml-2 text-xs text-gray-500">
                              ({(doc.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          <button
                            type="button"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => removeDocument(index)}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Declaration */}
                <div>
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="declaration"
                        name="declaration"
                        type="checkbox"
                        className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                        required
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="declaration" className="font-medium text-gray-700">
                        Declaration
                      </label>
                      <p className="text-gray-500">
                        I hereby declare that the information provided is true and correct to the best of my knowledge. 
                        I understand that providing false information may lead to rejection of my renewal application and legal action.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Renewal Fee: <span className="font-bold text-gray-900">₹{renewalFee.toLocaleString()}</span>
                  </div>
                  <button
                    type="submit"
                    disabled={isRenewing}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    {isRenewing ? (
                      <span className="loading-spinner"></span>
                    ) : (
                      'Submit Renewal Application'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Payment Section */}
      {showPayment && (
        <div className="mt-6">
          <PaymentProcessor
            paymentDetails={
              {
                id: `license_renewal_${license.id}`,
                type: 'trade_license',
                amount: renewalFee,
                description: `Trade License Renewal - ${license.business_name} (${license.license_number})`,
                dueDate: new Date().toISOString().split('T')[0],
                referenceId: license.license_number,
                userId: user?.id || '',
                metadata: {
                  licenseId: license.id,
                  renewalData,
                  type: 'renewal',
                },
              }
            }
            onSuccess={handlePaymentSuccess}
            onFailure={handlePaymentFailure}
            onCancel={handlePaymentCancel}
          />
        </div>
      )}
    </div>
  );
};

export default LicenseRenewalPage;