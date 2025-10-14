import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { waterAPI } from '@/lib/api';
import { toast } from 'react-toastify';
import {
  ArrowLeftIcon,
  BeakerIcon,
  UserIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  InformationCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

const NewWaterConnectionPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    consumer_name: '',
    contact_number: '',
    email: '',
    property_address: '',
    ward: '',
    property_type: 'residential',
    connection_type: 'domestic',
    purpose: '',
    estimated_monthly_consumption: '',
    existing_connection: 'no',
    nearest_landmark: '',
    id_proof_type: 'aadhaar',
    id_proof_number: '',
    address_proof_type: 'aadhaar',
    address_proof_number: '',
    declaration: false,
  });
  
  const [documents, setDocuments] = useState<File[]>([]);
  const [documentPreviews, setDocumentPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const wards = [
    'Ward 1', 'Ward 2', 'Ward 3', 'Ward 4', 'Ward 5',
    'Ward 6', 'Ward 7', 'Ward 8', 'Ward 9', 'Ward 10',
  ];

  const propertyTypes = [
    { value: 'residential', label: 'Residential' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'industrial', label: 'Industrial' },
    { value: 'institutional', label: 'Institutional' },
  ];

  const connectionTypes = [
    { value: 'domestic', label: 'Domestic' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'industrial', label: 'Industrial' },
    { value: 'institutional', label: 'Institutional' },
  ];

  const idProofTypes = [
    { value: 'aadhaar', label: 'Aadhaar Card' },
    { value: 'pan', label: 'PAN Card' },
    { value: 'voter', label: 'Voter ID' },
    { value: 'passport', label: 'Passport' },
    { value: 'driving', label: 'Driving License' },
  ];

  const requiredDocuments = [
    { name: 'id_proof', label: 'ID Proof', required: true },
    { name: 'address_proof', label: 'Address Proof', required: true },
    { name: 'property_document', label: 'Property Document', required: true },
    { name: 'photo', label: 'Applicant Photo', required: true },
    { name: 'no_dues_certificate', label: 'No Dues Certificate (if existing connection)', required: false },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Required fields validation
    if (!formData.consumer_name.trim()) newErrors.consumer_name = 'Consumer name is required';
    if (!formData.contact_number.trim()) newErrors.contact_number = 'Contact number is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.property_address.trim()) newErrors.property_address = 'Property address is required';
    if (!formData.ward) newErrors.ward = 'Ward is required';
    if (!formData.purpose.trim()) newErrors.purpose = 'Purpose is required';
    if (!formData.estimated_monthly_consumption.trim()) newErrors.estimated_monthly_consumption = 'Estimated monthly consumption is required';
    if (!formData.id_proof_number.trim()) newErrors.id_proof_number = 'ID proof number is required';
    if (!formData.address_proof_number.trim()) newErrors.address_proof_number = 'Address proof number is required';
    
    // Email validation
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Phone validation
    if (formData.contact_number && !/^\d{10}$/.test(formData.contact_number.replace(/\D/g, ''))) {
      newErrors.contact_number = 'Please enter a valid 10-digit phone number';
    }
    
    // Documents validation
    const requiredDocTypes = requiredDocuments.filter(doc => doc.required).map(doc => doc.name);
    if (documents.length < requiredDocTypes.length) {
      newErrors.documents = `Please upload all required documents (${requiredDocTypes.length} required)`;
    }
    
    // Declaration validation
    if (!formData.declaration) {
      newErrors.declaration = 'You must accept the declaration to submit the application';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const formDataToSend = new FormData();
      
      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'declaration') {
          formDataToSend.append(key, value);
        }
      });
      
      // Add documents
      documents.forEach((doc) => {
        formDataToSend.append('documents', doc);
      });
      
      // Add applicant ID
      if (user?.id) {
        formDataToSend.append('applicant_id', user.id);
      }
      
      const response = await waterAPI.createConnection(formDataToSend);
      toast.success('Water connection application submitted successfully!');
      
      // Redirect to the application details page
      router.push(`/water/connections/${response.data.id}`);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to submit application';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link href="/water/connections" className="flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeftIcon className="mr-1 h-4 w-4" />
          Back to Water Connections
        </Link>
      </div>

      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900">New Water Connection Application</h3>
            <p className="mt-1 text-sm text-gray-600">
              Apply for a new water connection for your property. Please provide all required information and documents.
            </p>
            
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <InformationCircleIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Important Information</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc space-y-1">
                      <li>Processing time: 7-14 working days</li>
                      <li>Connection fee will be based on connection type and size</li>
                      <li>Documents should be in PDF or JPG format</li>
                      <li>Maximum file size: 5MB per document</li>
                    </ul>
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
                {/* Applicant Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Applicant Information</h3>
                  
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="consumer_name" className="block text-sm font-medium text-gray-700">
                        Consumer Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="consumer_name"
                        id="consumer_name"
                        className={`mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${errors.consumer_name ? 'border-red-500' : ''}`}
                        value={formData.consumer_name}
                        onChange={handleInputChange}
                        placeholder="Full name as per ID proof"
                      />
                      {errors.consumer_name && <p className="mt-1 text-sm text-red-500">{errors.consumer_name}</p>}
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="contact_number" className="block text-sm font-medium text-gray-700">
                        Contact Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="contact_number"
                        id="contact_number"
                        className={`mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${errors.contact_number ? 'border-red-500' : ''}`}
                        value={formData.contact_number}
                        onChange={handleInputChange}
                        placeholder="10-digit mobile number"
                      />
                      {errors.contact_number && <p className="mt-1 text-sm text-red-500">{errors.contact_number}</p>}
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        className={`mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${errors.email ? 'border-red-500' : ''}`}
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                      {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                    </div>
                  </div>
                </div>

                {/* Property Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Property Information</h3>
                  
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-6">
                      <label htmlFor="property_address" className="block text-sm font-medium text-gray-700">
                        Property Address <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="property_address"
                        name="property_address"
                        rows={2}
                        className={`mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${errors.property_address ? 'border-red-500' : ''}`}
                        value={formData.property_address}
                        onChange={handleInputChange}
                      />
                      {errors.property_address && <p className="mt-1 text-sm text-red-500">{errors.property_address}</p>}
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="ward" className="block text-sm font-medium text-gray-700">
                        Ward <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="ward"
                        name="ward"
                        className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md ${errors.ward ? 'border-red-500' : ''}`}
                        value={formData.ward}
                        onChange={handleInputChange}
                      >
                        <option value="">Select Ward</option>
                        {wards.map(ward => (
                          <option key={ward} value={ward}>{ward}</option>
                        ))}
                      </select>
                      {errors.ward && <p className="mt-1 text-sm text-red-500">{errors.ward}</p>}
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="nearest_landmark" className="block text-sm font-medium text-gray-700">
                        Nearest Landmark
                      </label>
                      <input
                        type="text"
                        name="nearest_landmark"
                        id="nearest_landmark"
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        value={formData.nearest_landmark}
                        onChange={handleInputChange}
                        placeholder="e.g., School, Temple, Market"
                      />
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="property_type" className="block text-sm font-medium text-gray-700">
                        Property Type
                      </label>
                      <select
                        id="property_type"
                        name="property_type"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                        value={formData.property_type}
                        onChange={handleInputChange}
                      >
                        {propertyTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="connection_type" className="block text-sm font-medium text-gray-700">
                        Connection Type
                      </label>
                      <select
                        id="connection_type"
                        name="connection_type"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                        value={formData.connection_type}
                        onChange={handleInputChange}
                      >
                        {connectionTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Connection Details */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Connection Details</h3>
                  
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-6">
                      <label htmlFor="purpose" className="block text-sm font-medium text-gray-700">
                        Purpose of Connection <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="purpose"
                        name="purpose"
                        rows={2}
                        className={`mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${errors.purpose ? 'border-red-500' : ''}`}
                        value={formData.purpose}
                        onChange={handleInputChange}
                        placeholder="Describe the purpose for which water connection is required"
                      />
                      {errors.purpose && <p className="mt-1 text-sm text-red-500">{errors.purpose}</p>}
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="estimated_monthly_consumption" className="block text-sm font-medium text-gray-700">
                        Estimated Monthly Consumption (Liters) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="estimated_monthly_consumption"
                        id="estimated_monthly_consumption"
                        className={`mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${errors.estimated_monthly_consumption ? 'border-red-500' : ''}`}
                        value={formData.estimated_monthly_consumption}
                        onChange={handleInputChange}
                        placeholder="e.g., 5000"
                      />
                      {errors.estimated_monthly_consumption && <p className="mt-1 text-sm text-red-500">{errors.estimated_monthly_consumption}</p>}
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="existing_connection" className="block text-sm font-medium text-gray-700">
                        Existing Water Connection
                      </label>
                      <select
                        id="existing_connection"
                        name="existing_connection"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                        value={formData.existing_connection}
                        onChange={handleInputChange}
                      >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Identity Verification */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Identity Verification</h3>
                  
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="id_proof_type" className="block text-sm font-medium text-gray-700">
                        ID Proof Type
                      </label>
                      <select
                        id="id_proof_type"
                        name="id_proof_type"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                        value={formData.id_proof_type}
                        onChange={handleInputChange}
                      >
                        {idProofTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="id_proof_number" className="block text-sm font-medium text-gray-700">
                        ID Proof Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="id_proof_number"
                        id="id_proof_number"
                        className={`mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${errors.id_proof_number ? 'border-red-500' : ''}`}
                        value={formData.id_proof_number}
                        onChange={handleInputChange}
                      />
                      {errors.id_proof_number && <p className="mt-1 text-sm text-red-500">{errors.id_proof_number}</p>}
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="address_proof_type" className="block text-sm font-medium text-gray-700">
                        Address Proof Type
                      </label>
                      <select
                        id="address_proof_type"
                        name="address_proof_type"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                        value={formData.address_proof_type}
                        onChange={handleInputChange}
                      >
                        {idProofTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="address_proof_number" className="block text-sm font-medium text-gray-700">
                        Address Proof Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="address_proof_number"
                        id="address_proof_number"
                        className={`mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${errors.address_proof_number ? 'border-red-500' : ''}`}
                        value={formData.address_proof_number}
                        onChange={handleInputChange}
                      />
                      {errors.address_proof_number && <p className="mt-1 text-sm text-red-500">{errors.address_proof_number}</p>}
                    </div>
                  </div>
                </div>

                {/* Document Upload */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Required Documents</h3>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <p>Please upload the following documents:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {requiredDocuments.map(doc => (
                        <li key={doc.name}>
                          {doc.label} {doc.required && <span className="text-red-500">*</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {errors.documents && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <InformationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-800">{errors.documents}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
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
                        PDF, JPG, PNG up to 5MB each
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
                        className={`focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded ${errors.declaration ? 'border-red-500' : ''}`}
                        checked={formData.declaration}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="declaration" className="font-medium text-gray-700">
                        Declaration
                      </label>
                      <p className="text-gray-500">
                        I hereby declare that the information and documents provided are true and correct to the best of my knowledge. 
                        I understand that providing false information may lead to rejection of my application and legal action.
                      </p>
                    </div>
                  </div>
                  {errors.declaration && <p className="mt-1 text-sm text-red-500">{errors.declaration}</p>}
                </div>
              </div>

              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="loading-spinner"></span>
                  ) : (
                    'Submit Application'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewWaterConnectionPage;