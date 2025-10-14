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
  UploadIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface ExpenseFormData {
  title: string;
  description: string;
  amount: number;
  expense_date: string;
  category: string;
  budget_id: string;
  vendor_name: string;
  invoice_number: string;
  receipt_url: string;
}

const NewExpensePage: React.FC = () => {
  const router = useRouter();
  const { user, hasPermission } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [budgets, setBudgets] = useState<any[]>([]);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<ExpenseFormData>({
    title: '',
    description: '',
    amount: 0,
    expense_date: new Date().toISOString().split('T')[0],
    category: '',
    budget_id: '',
    vendor_name: '',
    invoice_number: '',
    receipt_url: '',
  });

  const categories = [
    'Salaries',
    'Utilities',
    'Maintenance',
    'Supplies',
    'Equipment',
    'Travel',
    'Training',
    'Consulting',
    'Insurance',
    'Taxes',
    'Rent',
    'Other',
  ];

  useEffect(() => {
    if (!hasPermission('finance.create')) {
      router.push('/finance/expenses');
    }
    fetchBudgets();
  }, [hasPermission, router]);

  const fetchBudgets = async () => {
    try {
      const response = await financeAPI.getBudgets({ 
        status: 'approved,active',
        limit: 100 
      });
      setBudgets(response.data.budgets);
    } catch (error: any) {
      console.error('Failed to fetch budgets:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle numeric fields
    if (name === 'amount') {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      
      // Check file type
      if (!file.type.match(/image\/(jpeg|jpg|png|gif)|application\/pdf/)) {
        toast.error('Only image and PDF files are allowed');
        return;
      }
      
      setReceiptFile(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setReceiptPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setReceiptPreview(null);
      }
    }
  };

  const handleRemoveFile = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    setFormData(prev => ({ ...prev, receipt_url: '' }));
  };

  const uploadReceipt = async () => {
    if (!receiptFile) return null;
    
    const formData = new FormData();
    formData.append('file', receiptFile);
    
    try {
      const response = await financeAPI.uploadReceipt(formData);
      return response.data.url;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to upload receipt';
      toast.error(message);
      return null;
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Expense title is required';
    }
    
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    
    if (!formData.expense_date) {
      newErrors.expense_date = 'Expense date is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    if (!formData.vendor_name.trim()) {
      newErrors.vendor_name = 'Vendor name is required';
    }
    
    if (!formData.invoice_number.trim()) {
      newErrors.invoice_number = 'Invoice number is required';
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
      // Upload receipt if provided
      let receiptUrl = '';
      if (receiptFile) {
        receiptUrl = await uploadReceipt();
        if (!receiptUrl) {
          setIsSubmitting(false);
          return;
        }
      }
      
      // Create expense with receipt URL
      const expenseData = {
        ...formData,
        receipt_url: receiptUrl,
      };
      
      const response = await financeAPI.createExpense(expenseData);
      toast.success('Expense created successfully');
      router.push(`/finance/expenses/${response.data.id}`);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to create expense';
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
          You don't have permission to create expenses.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center">
          <Link href="/finance/expenses" className="mr-3">
            <button
              type="button"
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Create New Expense</h1>
            <p className="mt-1 text-sm text-gray-500">
              Record a new expense for tracking and approval
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Expense Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.title ? 'border-red-500' : ''}`}
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Office Supplies Purchase"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="amount"
                name="amount"
                min="0"
                step="0.01"
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.amount ? 'border-red-500' : ''}`}
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="0.00"
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
              )}
            </div>

            {/* Expense Date */}
            <div>
              <label htmlFor="expense_date" className="block text-sm font-medium text-gray-700">
                Expense Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="expense_date"
                name="expense_date"
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.expense_date ? 'border-red-500' : ''}`}
                value={formData.expense_date}
                onChange={handleInputChange}
              />
              {errors.expense_date && (
                <p className="mt-1 text-sm text-red-600">{errors.expense_date}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                name="category"
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.category ? 'border-red-500' : ''}`}
                value={formData.category}
                onChange={handleInputChange}
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category}</p>
              )}
            </div>

            {/* Budget */}
            <div>
              <label htmlFor="budget_id" className="block text-sm font-medium text-gray-700">
                Budget (Optional)
              </label>
              <select
                id="budget_id"
                name="budget_id"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={formData.budget_id}
                onChange={handleInputChange}
              >
                <option value="">No Budget</option>
                {budgets.map(budget => (
                  <option key={budget.id} value={budget.id}>
                    {budget.title} ({budget.fiscal_year})
                  </option>
                ))}
              </select>
            </div>

            {/* Vendor Name */}
            <div>
              <label htmlFor="vendor_name" className="block text-sm font-medium text-gray-700">
                Vendor Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="vendor_name"
                name="vendor_name"
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.vendor_name ? 'border-red-500' : ''}`}
                value={formData.vendor_name}
                onChange={handleInputChange}
                placeholder="e.g., ABC Supplies Ltd."
              />
              {errors.vendor_name && (
                <p className="mt-1 text-sm text-red-600">{errors.vendor_name}</p>
              )}
            </div>

            {/* Invoice Number */}
            <div>
              <label htmlFor="invoice_number" className="block text-sm font-medium text-gray-700">
                Invoice Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="invoice_number"
                name="invoice_number"
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${errors.invoice_number ? 'border-red-500' : ''}`}
                value={formData.invoice_number}
                onChange={handleInputChange}
                placeholder="e.g., INV-2024-001"
              />
              {errors.invoice_number && (
                <p className="mt-1 text-sm text-red-600">{errors.invoice_number}</p>
              )}
            </div>
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
              placeholder="Provide details about this expense..."
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          {/* Receipt Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Receipt (Optional)
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
              <div className="space-y-1 text-center">
                {receiptPreview ? (
                  <div className="relative">
                    {receiptFile?.type.startsWith('image/') ? (
                      <img
                        src={receiptPreview}
                        alt="Receipt preview"
                        className="mx-auto h-32 w-auto object-cover rounded"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-32 w-32 bg-gray-100 rounded">
                        <DocumentTextIcon className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="receipt-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="receipt-upload"
                          name="receipt-upload"
                          type="file"
                          className="sr-only"
                          accept="image/*,.pdf"
                          onChange={handleFileChange}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF, PDF up to 5MB
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Link href="/finance/expenses">
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
              {isSubmitting ? 'Creating...' : 'Create Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewExpensePage;