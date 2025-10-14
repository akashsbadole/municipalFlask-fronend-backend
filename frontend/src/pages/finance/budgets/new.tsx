import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { financeAPI } from '@/lib/api';
import { toast } from 'react-toastify';
import {
  ArrowLeftIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  DocumentTextIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface BudgetFormData {
  fiscal_year: string;
  department: string;
  budget_type: string;
  total_allocated: number;
  title: string;
  description: string;
  justification: string;
}

const NewBudgetPage: React.FC = () => {
  const router = useRouter();
  const { user, hasPermission } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<BudgetFormData>({
    fiscal_year: new Date().getFullYear().toString(),
    department: '',
    budget_type: 'operational',
    total_allocated: 0,
    title: '',
    description: '',
    justification: '',
  });

  const departments = [
    'Administration',
    'Public Works',
    'Health & Sanitation',
    'Water Supply',
    'Street Lighting',
    'Waste Management',
    'Finance',
    'HR',
    'Education',
    'Planning',
  ];

  const budgetTypes = [
    { value: 'operational', label: 'Operational Budget' },
    { value: 'capital', label: 'Capital Budget' },
    { value: 'project', label: 'Project Budget' },
    { value: 'maintenance', label: 'Maintenance Budget' },
    { value: 'emergency', label: 'Emergency Fund' },
  ];

  const fiscalYears = [
    { value: '2023', label: '2023-24' },
    { value: '2024', label: '2024-25' },
    { value: '2025', label: '2025-26' },
    { value: '2026', label: '2026-27' },
  ];

  useEffect(() => {
    if (!hasPermission('finance.create')) {
      router.push('/finance');
    }
  }, [hasPermission, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle numeric fields
    if (name === 'total_allocated') {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.fiscal_year) {
      newErrors.fiscal_year = 'Fiscal year is required';
    }
    
    if (!formData.department) {
      newErrors.department = 'Department is required';
    }
    
    if (!formData.budget_type) {
      newErrors.budget_type = 'Budget type is required';
    }
    
    if (!formData.title.trim()) {
      newErrors.title = 'Budget title is required';
    }
    
    if (formData.total_allocated <= 0) {
      newErrors.total_allocated = 'Allocated amount must be greater than 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await financeAPI.createBudget(formData);
      toast.success('Budget created successfully');
      router.push(`/finance/budgets/${response.data.id}`);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to create budget';
      toast.error(message);
      
      // Handle validation errors
      if (error.response?.status === 400 && error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hasPermission('finance.create')) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
        <p className="mt-2 text-sm text-gray-500">
          You don't have permission to create budgets.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center">
          <Link href="/finance" className="mr-3">
            <button
              type="button"
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Create New Budget</h1>
            <p className="mt-1 text-sm text-gray-500">
              Set up a new budget for a department or project
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fiscal Year */}
            <div>
              <label htmlFor="fiscal_year" className="block text-sm font-medium text-gray-700">
                Fiscal Year <span className="text-red-500">*</span>
              </label>
              <select
                id="fiscal_year"
                name="fiscal_year"
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.fiscal_year ? 'border-red-500' : ''}`}
                value={formData.fiscal_year}
                onChange={handleInputChange}
              >
                {fiscalYears.map(year => (
                  <option key={year.value} value={year.value}>{year.label}</option>
                ))}
              </select>
              {errors.fiscal_year && (
                <p className="mt-1 text-sm text-red-600">{errors.fiscal_year}</p>
              )}
            </div>

            {/* Department */}
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                Department <span className="text-red-500">*</span>
              </label>
              <select
                id="department"
                name="department"
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.department ? 'border-red-500' : ''}`}
                value={formData.department}
                onChange={handleInputChange}
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              {errors.department && (
                <p className="mt-1 text-sm text-red-600">{errors.department}</p>
              )}
            </div>

            {/* Budget Type */}
            <div>
              <label htmlFor="budget_type" className="block text-sm font-medium text-gray-700">
                Budget Type <span className="text-red-500">*</span>
              </label>
              <select
                id="budget_type"
                name="budget_type"
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.budget_type ? 'border-red-500' : ''}`}
                value={formData.budget_type}
                onChange={handleInputChange}
              >
                {budgetTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              {errors.budget_type && (
                <p className="mt-1 text-sm text-red-600">{errors.budget_type}</p>
              )}
            </div>

            {/* Total Allocated */}
            <div>
              <label htmlFor="total_allocated" className="block text-sm font-medium text-gray-700">
                Total Allocated Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="total_allocated"
                name="total_allocated"
                min="0"
                step="0.01"
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.total_allocated ? 'border-red-500' : ''}`}
                value={formData.total_allocated}
                onChange={handleInputChange}
                placeholder="0.00"
              />
              {errors.total_allocated && (
                <p className="mt-1 text-sm text-red-600">{errors.total_allocated}</p>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Budget Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.title ? 'border-red-500' : ''}`}
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., 2024-25 Public Works Department Budget"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.description ? 'border-red-500' : ''}`}
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Provide a brief description of the budget..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Justification */}
          <div>
            <label htmlFor="justification" className="block text-sm font-medium text-gray-700">
              Justification
            </label>
            <textarea
              id="justification"
              name="justification"
              rows={4}
              className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.justification ? 'border-red-500' : ''}`}
              value={formData.justification}
              onChange={handleInputChange}
              placeholder="Explain why this budget is necessary and how it will be used..."
            />
            {errors.justification && (
              <p className="mt-1 text-sm text-red-600">{errors.justification}</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Link href="/finance">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewBudgetPage;