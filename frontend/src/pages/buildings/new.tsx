import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { buildingsAPI } from '@/lib/api';
import { toast } from 'react-toastify';
import {
  ArrowLeftIcon,
  BuildingOfficeIcon,
  DocumentTextIcon,
  PhotoIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

const NewBuildingPlanPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    applicant_name: '',
    applicant_address: '',
    contact_number: '',
    email: '',
    property_address: '',
    ward: '',
    survey_number: '',
    building_type: 'residential',
    building_category: 'new',
    plot_area: '',
    existing_built_up_area: '',
    proposed_built_up_area: '',
    number_of_floors: '',
    height_of_building: '',
    setback_front: '',
    setback_rear: '',
    setback_left: '',
    setback_right: '',
    parking_spaces: '',
    water_connection_required: 'yes',
    electricity_connection_required: 'yes',
    architect_name: '',
    architect_license_number: '',
    engineer_name: '',
    engineer_license_number: '',
    estimated_cost: '',
    declaration: false,
  });
  
  const [documents, setDocuments] = useState<File[]>([]);
  const [documentPreviews, setDocumentPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const buildingTypes = [
    { value: 'residential', label: 'Residential' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'industrial', label: 'Industrial' },
    { value: 'institutional', label: 'Institutional' },
    { value: 'mixed', label: 'Mixed Use' },
  ];

  const buildingCategories = [
    { value: 'new', label: 'New Construction' },
    { value: 'addition_alteration', label: 'Addition/Alteration' },
    { value: 'reconstruction', label: 'Reconstruction' },
    { value: 'demolition', label: 'Demolition' },
  ];

  const wards = [
    'Ward 1', 'Ward 2', 'Ward 3', 'Ward 4', 'Ward 5',
    'Ward 6', 'Ward 7', 'Ward 8', 'Ward 9', 'Ward 10',
  ];

  const requiredDocuments = [
    { name: 'site_plan', label: 'Site Plan', required: true },
    { name: 'building_plan', label: 'Building Plan', required: true },
    { name: 'layout_plan', label: 'Layout Plan', required: true },
    { name: 'elevation_plan', label: 'Elevation Plan', required: true },
    { name: 'section_plan', label: 'Section Plan', required: true },
    { name: 'ownership_proof', label: 'Ownership Proof', required: true },
    { name: 'previous_sanction', label: 'Previous Sanction Plan (if any)', required: false },
    { name: 'noc', label: 'NOC from concerned department (if required)', required: false },
    { name: 'structural_certificate', label: 'Structural Stability Certificate', required: true },
    { name: 'architect_certificate', label: 'Architect Certificate', required: true },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
            const result = event.target.result as string;
            setDocumentPreviews(prev => [...prev, result]);
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
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.applicant_name.trim()) newErrors.applicant_name = 'Applicant name is required';
    if (!formData.applicant_address.trim()) newErrors.applicant_address = 'Applicant address is required';
    if (!formData.contact_number.trim()) newErrors.contact_number = 'Contact number is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.property_address.trim()) newErrors.property_address = 'Property address is required';
    if (!formData.ward) newErrors.ward = 'Ward is required';
    if (!formData.survey_number.trim()) newErrors.survey_number = 'Survey number is required';
    if (!formData.plot_area.trim()) newErrors.plot_area = 'Plot area is required';
    if (!formData.proposed_built_up_area.trim()) newErrors.proposed_built_up_area = 'Proposed built-up area is required';
    if (!formData.number_of_floors.trim()) newErrors.number_of_floors = 'Number of floors is required';
    if (!formData.height_of_building.trim()) newErrors.height_of_building = 'Building height is required';
    if (!formData.architect_name.trim()) newErrors.architect_name = 'Architect name is required';
    if (!formData.architect_license_number.trim()) newErrors.architect_license_number = 'Architect license number is required';
    if (!formData.estimated_cost.trim()) newErrors.estimated_cost = 'Estimated cost is required';
    
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
          formDataToSend.append(key, value.toString());
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
      
      const response = await buildingsAPI.create(formDataToSend);
      toast.success('Building plan application submitted successfully!');
      
      // Redirect to the application details page
      router.push(`/buildings/${response.data.id}`);
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
        <Link href="/buildings" className="flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeftIcon className="mr-1 h-4 w-4" />
          Back to Building Plans
        </Link>
      </div>

      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Building Plan Application</h3>
            <p className="mt-1 text-sm text-gray-600">
              Submit a new building plan for approval. Please provide all required information and documents.
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
                      <li>All dimensions should be in meters</li>
                      <li>Plans should be in PDF or DWG format</li>
                      <li>Maximum file size: 10MB per document</li>
                      <li>Processing time: 15-30 working days</li>
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
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                        Application Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="title"
                        id="title"
                        className={`mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${errors.title ? 'border-red-500' : ''}`}
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="e.g., Residential Building at XYZ Street"
                      />
                      {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="applicant_name" className="block text-sm font-medium text-gray-700">
                        Applicant Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="applicant_name"
                        id="applicant_name"
                        className={`mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${errors.applicant_name ? 'border-red-500' : ''}`}
                        value={formData.applicant_name}
                        onChange={handleInputChange}
                      />
                      {errors.applicant_name && <p className="mt-1 text-sm text-red-500">{errors.applicant_name}</p>}
                    </div>
                    
                    <div className="col-span-6">
                      <label htmlFor="applicant_address" className="block text-sm font-medium text-gray-700">
                        Applicant Address <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="applicant_address"
                        name="applicant_address"
                        rows={2}
                        className={`mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${errors.applicant_address ? 'border-red-500' : ''}`}
                        value={formData.applicant_address}
                        onChange={handleInputChange}
                      />
                      {errors.applicant_address && <p className="mt-1 text-sm text-red-500">{errors.applicant_address}</p>}
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
                      <label htmlFor="survey_number" className="block text-sm font-medium text-gray-700">
                        Survey Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="survey_number"
                        id="survey_number"
                        className={`mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${errors.survey_number ? 'border-red-500' : ''}`}
                        value={formData.survey_number}
                        onChange={handleInputChange}
                      />
                      {errors.survey_number && <p className="mt-1 text-sm text-red-500">{errors.survey_number}</p>}
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="building_type" className="block text-sm font-medium text-gray-700">
                        Building Type
                      </label>
                      <select
                        id="building_type"
                        name="building_type"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                        value={formData.building_type}
                        onChange={handleInputChange}
                      >
                        {buildingTypes.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="building_category" className="block text-sm font-medium text-gray-700">
                        Building Category
                      </label>
                      <select
                        id="building_category"
                        name="building_category"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                        value={formData.building_category}
                        onChange={handleInputChange}
                      >
                        {buildingCategories.map(category => (
                          <option key={category.value} value={category.value}>{category.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Building Details */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Building Details</h3>
                  
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="plot_area" className="block text-sm font-medium text-gray-700">
                        Plot Area (sq. meters) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="plot_area"
                        id="plot_area"
                        step="0.01"
                        className={`mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${errors.plot_area ? 'border-red-500' : ''}`}
                        value={formData.plot_area}
                        onChange={handleInputChange}
                      />
                      {errors.plot_area && <p className="mt-1 text-sm text-red-500">{errors.plot_area}</p>}
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="existing_built_up_area" className="block text-sm font-medium text-gray-700">
                        Existing Built-up Area (sq. meters)
                      </label>
                      <input
                        type="number"
                        name="existing_built_up_area"
                        id="existing_built_up_area"
                        step="0.01"
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        value={formData.existing_built_up_area}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="proposed_built_up_area" className="block text-sm font-medium text-gray-700">
                        Proposed Built-up Area (sq. meters) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="proposed_built_up_area"
                        id="proposed_built_up_area"
                        step="0.01"
                        className={`mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${errors.proposed_built_up_area ? 'border-red-500' : ''}`}
                        value={formData.proposed_built_up_area}
                        onChange={handleInputChange}
                      />
                      {errors.proposed_built_up_area && <p className="mt-1 text-sm text-red-500">{errors.proposed_built_up_area}</p>}
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="number_of_floors" className="block text-sm font-medium text-gray-700">
                        Number of Floors <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="number_of_floors"
                        id="number_of_floors"
                        min="1"
                        className={`mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${errors.number_of_floors ? 'border-red-500' : ''}`}
                        value={formData.number_of_floors}
                        onChange={handleInputChange}
                      />
                      {errors.number_of_floors && <p className="mt-1 text-sm text-red-500">{errors.number_of_floors}</p>}
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="height_of_building" className="block text-sm font-medium text-gray-700">
                        Building Height (meters) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="height_of_building"
                        id="height_of_building"
                        step="0.01"
                        className={`mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${errors.height_of_building ? 'border-red-500' : ''}`}
                        value={formData.height_of_building}
                        onChange={handleInputChange}
                      />
                      {errors.height_of_building && <p className="mt-1 text-sm text-red-500">{errors.height_of_building}</p>}
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="parking_spaces" className="block text-sm font-medium text-gray-700">
                        Parking Spaces
                      </label>
                      <input
                        type="number"
                        name="parking_spaces"
                        id="parking_spaces"
                        min="0"
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        value={formData.parking_spaces}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Setback Details */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Setback Details (meters)</h3>
                  
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="setback_front" className="block text-sm font-medium text-gray-700">
                        Front Setback
                      </label>
                      <input
                        type="number"
                        name="setback_front"
                        id="setback_front"
                        step="0.01"
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        value={formData.setback_front}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="setback_rear" className="block text-sm font-medium text-gray-700">
                        Rear Setback
                      </label>
                      <input
                        type="number"
                        name="setback_rear"
                        id="setback_rear"
                        step="0.01"
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        value={formData.setback_rear}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="setback_left" className="block text-sm font-medium text-gray-700">
                        Left Setback
                      </label>
                      <input
                        type="number"
                        name="setback_left"
                        id="setback_left"
                        step="0.01"
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        value={formData.setback_left}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="setback_right" className="block text-sm font-medium text-gray-700">
                        Right Setback
                      </label>
                      <input
                        type="number"
                        name="setback_right"
                        id="setback_right"
                        step="0.01"
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        value={formData.setback_right}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Professional Details */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Professional Details</h3>
                  
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="architect_name" className="block text-sm font-medium text-gray-700">
                        Architect Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="architect_name"
                        id="architect_name"
                        className={`mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${errors.architect_name ? 'border-red-500' : ''}`}
                        value={formData.architect_name}
                        onChange={handleInputChange}
                      />
                      {errors.architect_name && <p className="mt-1 text-sm text-red-500">{errors.architect_name}</p>}
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="architect_license_number" className="block text-sm font-medium text-gray-700">
                        Architect License Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="architect_license_number"
                        id="architect_license_number"
                        className={`mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${errors.architect_license_number ? 'border-red-500' : ''}`}
                        value={formData.architect_license_number}
                        onChange={handleInputChange}
                      />
                      {errors.architect_license_number && <p className="mt-1 text-sm text-red-500">{errors.architect_license_number}</p>}
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="engineer_name" className="block text-sm font-medium text-gray-700">
                        Engineer Name
                      </label>
                      <input
                        type="text"
                        name="engineer_name"
                        id="engineer_name"
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        value={formData.engineer_name}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="engineer_license_number" className="block text-sm font-medium text-gray-700">
                        Engineer License Number
                      </label>
                      <input
                        type="text"
                        name="engineer_license_number"
                        id="engineer_license_number"
                        className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        value={formData.engineer_license_number}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="estimated_cost" className="block text-sm font-medium text-gray-700">
                        Estimated Cost (₹) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="estimated_cost"
                        id="estimated_cost"
                        className={`mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${errors.estimated_cost ? 'border-red-500' : ''}`}
                        value={formData.estimated_cost}
                        onChange={handleInputChange}
                      />
                      {errors.estimated_cost && <p className="mt-1 text-sm text-red-500">{errors.estimated_cost}</p>}
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
                          <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
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
                            accept=".pdf,.dwg,.jpg,.jpeg,.png"
                            onChange={handleDocumentChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PDF, DWG, JPG, PNG up to 10MB each
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

export default NewBuildingPlanPage;