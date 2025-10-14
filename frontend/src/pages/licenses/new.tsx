import React, { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { licensesAPI } from '@/lib/api';
import { toast } from 'react-toastify';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  PhotoIcon,
  CurrencyDollarIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

const NewLicensePage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState<File[]>([]);
  const [documentPreviews, setDocumentPreviews] = useState<string[]>([]);
  const [agreed, setAgreed] = useState(false);
  
  const [formData, setFormData] = useState({
    business_name: '',
    business_type: '',
    owner_name: user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : '',
    premises_address: '',
    ward: '',
    area: '',
    contact_number: user?.phone || '',
    email: user?.email || '',
    pan_number: '',
    gst_number: '',
    business_start_date: '',
    number_of_employees: '',
    investment_amount: '',
  });

  const businessTypes = [
    'Restaurant / Food Service',
    'Retail Shop',
    'Manufacturing',
    'Service Provider',
    'Office / Professional Services',
    'Educational Institution',
    'Healthcare Facility',
    'Entertainment / Recreation',
    'Construction',
    'Transportation',
    'Other',
  ];

  const wards = Array.from({ length: 50 }, (_, i) => `Ward ${i + 1}`);
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

  const currentFee = feeStructure[formData.business_type] || 4000;

  useEffect(() => {
    if (user?.first_name && user?.last_name) {
      setFormData(prev => ({ 
        ...prev, 
        owner_name: `${user.first_name} ${user.last_name}` 
      }));
    }
    if (user?.phone) {
      setFormData(prev => ({ ...prev, contact_number: user.phone }));
    }
    if (user?.email) {
      setFormData(prev => ({ ...prev, email: user.email }));
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!agreed) {
      toast.error('Please agree to the terms and conditions');
      return;
    }
    
    // Validate required fields
    const requiredFields = [
      'business_name', 'business_type', 'owner_name', 'premises_address', 
      'ward', 'contact_number', 'email', 'pan_number'
    ];
    
    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        toast.error(`Please fill all required fields`);
        return;
      }
    }

    setIsLoading(true);
    
    try {
      const licenseData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        licenseData.append(key, value);
      });
      licenseData.append('fee', currentFee.toString());
      
      // Add documents
      documents.forEach((doc) => {
        licenseData.append('documents', doc);
      });
      
      const response = await licensesAPI.create(licenseData);
      toast.success(`License application submitted successfully! Application ID: ${response.data.application_id}`);
      router.push('/licenses');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to submit license application';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasPermission('license.create')) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
        <p className="mt-2 text-sm text-gray-500">
          You don't have permission to apply for trade licenses.
        </p>
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

      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Trade License Application</h3>
            <p className="mt-1 text-sm text-gray-600">
              Apply for a new trade license for your business. Please provide accurate information and upload necessary documents.
            </p>
            
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <InformationCircleIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Application Fee</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>The fee for this license type is <span className="font-bold">₹{currentFee.toLocaleString()}</span>.</p>
                    <p className="mt-1">Payment will be processed after your application is approved.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-5 md:mt-0 md:col-span-2">
          <form onSubmit={handleSubmit}>
            <div className="shadow sm:rounded-md sm:overflow-hidden">
              <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                {/* Business Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Business Information</h3>
                  
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="business_name" className="block text-sm font-medium text-gray-700">
                        Business Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="business_name"
                        id="business_name"
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        value={formData.business_name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="business_type" className="block text-sm font-medium text-gray-700">
                        Business Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="business_type"
                        name="business_type"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                        value={formData.business_type}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select business type</option>
                        {businessTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="col-span-6">
                      <label htmlFor="premises_address" className="block text-sm font-medium text-gray-700">
                        Business Address <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="premises_address"
                        name="premises_address"
                        rows={2}
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        value={formData.premises_address}
                        onChange={handleInputChange}
                        placeholder="Complete business address with landmark"
                        required
                      />
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="ward" className="block text-sm font-medium text-gray-700">
                        Ward <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="ward"
                        name="ward"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                        value={formData.ward}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select ward</option>
                        {wards.map((ward) => (
                          <option key={ward} value={ward}>
                            {ward}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="area" className="block text-sm font-medium text-gray-700">
                        Area/Locality
                      </label>
                      <input
                        type="text"
                        name="area"
                        id="area"
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        value={formData.area}
                        onChange={handleInputChange}
                        placeholder="Area or locality name"
                      />
                    </div>
                  </div>
                </div>

                {/* Owner Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Owner Information</h3>
                  
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="owner_name" className="block text-sm font-medium text-gray-700">
                        Owner Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="owner_name"
                        id="owner_name"
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        value={formData.owner_name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="contact_number" className="block text-sm font-medium text-gray-700">
                        Contact Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="contact_number"
                        id="contact_number"
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        value={formData.contact_number}
                        onChange={handleInputChange}
                        placeholder="10-digit mobile number"
                        required
                      />
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="pan_number" className="block text-sm font-medium text-gray-700">
                        PAN Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="pan_number"
                        id="pan_number"
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        value={formData.pan_number}
                        onChange={handleInputChange}
                        placeholder="10-digit PAN number"
                        pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                        required
                      />
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="gst_number" className="block text-sm font-medium text-gray-700">
                        GST Number (if applicable)
                      </label>
                      <input
                        type="text"
                        name="gst_number"
                        id="gst_number"
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        value={formData.gst_number}
                        onChange={handleInputChange}
                        placeholder="15-digit GST number"
                      />
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="business_start_date" className="block text-sm font-medium text-gray-700">
                        Business Start Date
                      </label>
                      <input
                        type="date"
                        name="business_start_date"
                        id="business_start_date"
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        value={formData.business_start_date}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="number_of_employees" className="block text-sm font-medium text-gray-700">
                        Number of Employees
                      </label>
                      <input
                        type="number"
                        name="number_of_employees"
                        id="number_of_employees"
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        value={formData.number_of_employees}
                        onChange={handleInputChange}
                        min="1"
                      />
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="investment_amount" className="block text-sm font-medium text-gray-700">
                        Investment Amount (₹)
                      </label>
                      <input
                        type="number"
                        name="investment_amount"
                        id="investment_amount"
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        value={formData.investment_amount}
                        onChange={handleInputChange}
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Document Upload */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Required Documents</h3>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <p>Please upload the following documents:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Identity Proof (Aadhaar/Voter ID/Passport)</li>
                      <li>Address Proof (Electricity Bill/Rent Agreement)</li>
                      <li>Business Registration Certificate</li>
                      <li>PAN Card</li>
                      <li>Property Tax Receipt (if owned)</li>
                      <li>NOC from Property Owner (if rented)</li>
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

                {/* Terms and Conditions */}
                <div>
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="agreed"
                        name="agreed"
                        type="checkbox"
                        className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="agreed" className="font-medium text-gray-700">
                        Terms and Conditions
                      </label>
                      <p className="text-gray-500">
                        I hereby declare that the information provided is true and correct to the best of my knowledge. 
                        I understand that providing false information may lead to rejection of my application and legal action.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Application Fee: <span className="font-bold text-gray-900">₹{currentFee.toLocaleString()}</span>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="loading-spinner"></span>
                    ) : (
                      'Submit Application'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewLicensePage;