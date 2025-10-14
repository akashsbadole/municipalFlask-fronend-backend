import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { publicWorksAPI } from '@/lib/api';
import { toast } from 'react-toastify';
import {
  DocumentTextIcon,
  ArrowLeftIcon,
  SaveIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface NewTender {
  project_id: string;
  title: string;
  description: string;
  publication_date: string;
  submission_end_date: string;
  opening_date: string;
  estimated_cost: number;
  tender_type: string;
  pre_bid_meeting_date: string;
  bid_security_amount: number;
  performance_security_amount: number;
  completion_period: number;
  eligibility_criteria: string;
  terms_and_conditions: string;
}

const NewTenderPage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState<NewTender>({
    project_id: '',
    title: '',
    description: '',
    publication_date: '',
    submission_end_date: '',
    opening_date: '',
    estimated_cost: 0,
    tender_type: '',
    pre_bid_meeting_date: '',
    bid_security_amount: 0,
    performance_security_amount: 0,
    completion_period: 0,
    eligibility_criteria: '',
    terms_and_conditions: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<any[]>([]);

  const tenderTypes = [
    'Open Tender',
    'Limited Tender',
    'Single Tender',
    'Two-Stage Tender',
    'E-Tender',
  ];

  useEffect(() => {
    if (hasPermission('public_works.create')) {
      fetchProjects();
    }
  }, [hasPermission]);

  const fetchProjects = async () => {
    try {
      const response = await publicWorksAPI.getProjects({ status: 'Planning' });
      setProjects(response.data.projects);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to fetch projects';
      toast.error(message);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.project_id || !formData.title || !formData.publication_date || 
        !formData.submission_end_date || !formData.opening_date || !formData.tender_type) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (new Date(formData.submission_end_date) <= new Date(formData.publication_date)) {
      toast.error('Submission end date must be after publication date');
      return;
    }

    if (new Date(formData.opening_date) <= new Date(formData.submission_end_date)) {
      toast.error('Opening date must be after submission end date');
      return;
    }

    if (formData.pre_bid_meeting_date && 
        (new Date(formData.pre_bid_meeting_date) <= new Date(formData.publication_date) ||
         new Date(formData.pre_bid_meeting_date) >= new Date(formData.submission_end_date))) {
      toast.error('Pre-bid meeting date must be between publication and submission end dates');
      return;
    }

    try {
      setLoading(true);
      await publicWorksAPI.createTender(formData);
      toast.success('Tender created successfully');
      router.push('/public-works');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to create tender';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!hasPermission('public_works.create')) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
        <p className="mt-2 text-sm text-gray-500">
          You don't have permission to create new tenders.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center">
          <Link href="/public-works">
            <button
              type="button"
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 mr-4"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Create New Tender</h1>
            <p className="mt-1 text-sm text-gray-500">
              Create a new tender for project bidding
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Project Selection */}
              <div>
                <label htmlFor="project_id" className="block text-sm font-medium text-gray-700">
                  Project *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="project_id"
                    name="project_id"
                    value={formData.project_id}
                    onChange={handleInputChange}
                    required
                    className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    <option value="">Select Project</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.title} ({project.project_code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Tender Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>

              {/* Tender Type */}
              <div>
                <label htmlFor="tender_type" className="block text-sm font-medium text-gray-700">
                  Tender Type *
                </label>
                <select
                  id="tender_type"
                  name="tender_type"
                  value={formData.tender_type}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">Select Tender Type</option>
                  {tenderTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Estimated Cost */}
              <div>
                <label htmlFor="estimated_cost" className="block text-sm font-medium text-gray-700">
                  Estimated Cost (₹) *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="estimated_cost"
                    name="estimated_cost"
                    value={formData.estimated_cost}
                    onChange={handleNumberChange}
                    min="0"
                    required
                    className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Publication Date */}
              <div>
                <label htmlFor="publication_date" className="block text-sm font-medium text-gray-700">
                  Publication Date *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="publication_date"
                    name="publication_date"
                    value={formData.publication_date}
                    onChange={handleInputChange}
                    required
                    className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Submission End Date */}
              <div>
                <label htmlFor="submission_end_date" className="block text-sm font-medium text-gray-700">
                  Submission End Date *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="submission_end_date"
                    name="submission_end_date"
                    value={formData.submission_end_date}
                    onChange={handleInputChange}
                    required
                    min={formData.publication_date}
                    className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Opening Date */}
              <div>
                <label htmlFor="opening_date" className="block text-sm font-medium text-gray-700">
                  Opening Date *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="opening_date"
                    name="opening_date"
                    value={formData.opening_date}
                    onChange={handleInputChange}
                    required
                    min={formData.submission_end_date}
                    className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Pre-Bid Meeting Date */}
              <div>
                <label htmlFor="pre_bid_meeting_date" className="block text-sm font-medium text-gray-700">
                  Pre-Bid Meeting Date
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="pre_bid_meeting_date"
                    name="pre_bid_meeting_date"
                    value={formData.pre_bid_meeting_date}
                    onChange={handleInputChange}
                    min={formData.publication_date}
                    max={formData.submission_end_date}
                    className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Bid Security Amount */}
              <div>
                <label htmlFor="bid_security_amount" className="block text-sm font-medium text-gray-700">
                  Bid Security Amount (₹)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="bid_security_amount"
                    name="bid_security_amount"
                    value={formData.bid_security_amount}
                    onChange={handleNumberChange}
                    min="0"
                    className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Performance Security Amount */}
              <div>
                <label htmlFor="performance_security_amount" className="block text-sm font-medium text-gray-700">
                  Performance Security Amount (₹)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    id="performance_security_amount"
                    name="performance_security_amount"
                    value={formData.performance_security_amount}
                    onChange={handleNumberChange}
                    min="0"
                    className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Completion Period */}
              <div>
                <label htmlFor="completion_period" className="block text-sm font-medium text-gray-700">
                  Completion Period (days)
                </label>
                <input
                  type="number"
                  id="completion_period"
                  name="completion_period"
                  value={formData.completion_period}
                  onChange={handleNumberChange}
                  min="0"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>

              {/* Eligibility Criteria */}
              <div className="md:col-span-2">
                <label htmlFor="eligibility_criteria" className="block text-sm font-medium text-gray-700">
                  Eligibility Criteria
                </label>
                <textarea
                  id="eligibility_criteria"
                  name="eligibility_criteria"
                  rows={6}
                  value={formData.eligibility_criteria}
                  onChange={handleInputChange}
                  placeholder="Enter the eligibility criteria for bidders..."
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>

              {/* Terms and Conditions */}
              <div className="md:col-span-2">
                <label htmlFor="terms_and_conditions" className="block text-sm font-medium text-gray-700">
                  Terms and Conditions
                </label>
                <textarea
                  id="terms_and_conditions"
                  name="terms_and_conditions"
                  rows={6}
                  value={formData.terms_and_conditions}
                  onChange={handleInputChange}
                  placeholder="Enter the terms and conditions for the tender..."
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
            <Link href="/public-works">
              <button
                type="button"
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 mr-3"
              >
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </div>
              ) : (
                <div className="flex items-center">
                  <SaveIcon className="h-4 w-4 mr-2" />
                  Create Tender
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewTenderPage;