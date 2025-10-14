import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { hrAPI } from '@/lib/api';
import { toast } from 'react-toastify';
import {
  ArrowLeftIcon,
  UserIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  CreditCardIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { format } from 'date-fns';

interface Employee {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  blood_group: string;
  marital_status: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  department: string;
  designation: string;
  employment_type: string;
  employment_status: string;
  date_of_joining: string;
  date_of_leaving: string;
  grade: string;
  basic_salary: number;
  bank_name: string;
  bank_account_number: string;
  bank_ifsc: string;
  pan_number: string;
  aadhaar_number: string;
  reporting_to: string;
  years_of_service: number;
  created_at: string;
  updated_at: string;
}

interface SalaryComponent {
  id: string;
  component_type: string;
  component_name: string;
  component_code: string;
  amount: number;
  amount_type: string;
  percentage_of: string;
  is_taxable: boolean;
  is_active: boolean;
}

const EmployeeDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user, hasPermission } = useAuth();
  
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [salaryComponents, setSalaryComponents] = useState<SalaryComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'salary' | 'attendance' | 'leaves' | 'payroll'>('details');

  useEffect(() => {
    if (id) {
      fetchEmployee();
      fetchSalaryComponents();
    }
  }, [id]);

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      const response = await hrAPI.getEmployeeById(id as string);
      setEmployee(response.data);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to fetch employee details';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalaryComponents = async () => {
    try {
      const response = await hrAPI.getSalaryComponents(id as string);
      setSalaryComponents(response.data);
    } catch (error: any) {
      console.error('Failed to fetch salary components:', error);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!confirm('Are you sure you want to terminate this employee? This action cannot be undone.')) {
      return;
    }
    
    try {
      await hrAPI.deleteEmployee(id as string);
      toast.success('Employee terminated successfully');
      router.push('/hr');
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to terminate employee';
      toast.error(message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            Active
          </span>
        );
      case 'Inactive':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <ClockIcon className="w-4 h-4 mr-1" />
            Inactive
          </span>
        );
      case 'Terminated':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="w-4 h-4 mr-1" />
            Terminated
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Error</h3>
        <p className="mt-2 text-sm text-gray-500">{error || 'Employee not found'}</p>
        <Link href="/hr">
          <button className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700">
            Back to HR
          </button>
        </Link>
      </div>
    );
  }

  const canEdit = hasPermission('hr.update');
  const canDelete = hasPermission('hr.delete');

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/hr" className="mr-3">
              <button
                type="button"
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Back
              </button>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{employee.full_name}</h1>
              <p className="mt-1 text-sm text-gray-500">
                Employee ID: {employee.employee_id} • Joined on {format(new Date(employee.date_of_joining), 'MMMM d, yyyy')}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {getStatusBadge(employee.employment_status)}
            {canEdit && (
              <Link href={`/hr/employees/${employee.id}/edit`}>
                <button
                  type="button"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </button>
              </Link>
            )}
            {canDelete && employee.employment_status === 'Active' && (
              <button
                type="button"
                onClick={handleDeleteEmployee}
                className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Terminate
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'details', name: 'Details', icon: UserIcon },
            { id: 'salary', name: 'Salary', icon: CurrencyDollarIcon },
            { id: 'attendance', name: 'Attendance', icon: CalendarIcon },
            { id: 'leaves', name: 'Leaves', icon: DocumentTextIcon },
            { id: 'payroll', name: 'Payroll', icon: CreditCardIcon },
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

      {/* Details Tab */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Full Name</p>
                  <p className="mt-1 text-sm text-gray-900">{employee.full_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Employee ID</p>
                  <p className="mt-1 text-sm text-gray-900">{employee.employee_id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                  <p className="mt-1 text-sm text-gray-900">{format(new Date(employee.date_of_birth), 'MMMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Gender</p>
                  <p className="mt-1 text-sm text-gray-900">{employee.gender}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Blood Group</p>
                  <p className="mt-1 text-sm text-gray-900">{employee.blood_group || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Marital Status</p>
                  <p className="mt-1 text-sm text-gray-900">{employee.marital_status}</p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="mt-1 text-sm text-gray-900 flex items-center">
                    <EnvelopeIcon className="h-4 w-4 mr-1 text-gray-400" />
                    {employee.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="mt-1 text-sm text-gray-900 flex items-center">
                    <PhoneIcon className="h-4 w-4 mr-1 text-gray-400" />
                    {employee.phone}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-gray-500">Address</p>
                  <p className="mt-1 text-sm text-gray-900 flex items-start">
                    <MapPinIcon className="h-4 w-4 mr-1 text-gray-400 mt-0.5" />
                    {employee.address}, {employee.city}, {employee.state} - {employee.postal_code}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Employment Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Department</p>
                  <p className="mt-1 text-sm text-gray-900 flex items-center">
                    <BuildingOfficeIcon className="h-4 w-4 mr-1 text-gray-400" />
                    {employee.department}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Designation</p>
                  <p className="mt-1 text-sm text-gray-900">{employee.designation}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Employment Type</p>
                  <p className="mt-1 text-sm text-gray-900">{employee.employment_type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Grade</p>
                  <p className="mt-1 text-sm text-gray-900">{employee.grade}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Date of Joining</p>
                  <p className="mt-1 text-sm text-gray-900 flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                    {format(new Date(employee.date_of_joining), 'MMMM d, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Years of Service</p>
                  <p className="mt-1 text-sm text-gray-900">{employee.years_of_service} years</p>
                </div>
                {employee.date_of_leaving && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Date of Leaving</p>
                    <p className="mt-1 text-sm text-gray-900">{format(new Date(employee.date_of_leaving), 'MMMM d, yyyy')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Basic Salary</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(employee.basic_salary)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Employment Status</p>
                  <div className="mt-1">
                    {getStatusBadge(employee.employment_status)}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Years of Service</p>
                  <p className="text-xl font-bold text-gray-900">{employee.years_of_service}</p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Bank Details</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Bank Name</p>
                  <p className="mt-1 text-sm text-gray-900">{employee.bank_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Account Number</p>
                  <p className="mt-1 text-sm text-gray-900">****{employee.bank_account_number.slice(-4)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">IFSC Code</p>
                  <p className="mt-1 text-sm text-gray-900">{employee.bank_ifsc}</p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Government IDs</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">PAN Number</p>
                  <p className="mt-1 text-sm text-gray-900">{employee.pan_number}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Aadhaar Number</p>
                  <p className="mt-1 text-sm text-gray-900">****{employee.aadhaar_number.slice(-4)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Salary Tab */}
      {activeTab === 'salary' && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Salary Components</h2>
            {hasPermission('hr.update') && (
              <button
                type="button"
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Add Component
              </button>
            )}
          </div>
          
          {salaryComponents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Component Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Taxable
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {salaryComponents.map((component) => (
                    <tr key={component.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{component.component_name}</div>
                        <div className="text-sm text-gray-500">{component.component_code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          component.component_type === 'Allowance' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {component.component_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(component.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          component.is_taxable 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {component.is_taxable ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          {hasPermission('hr.update') && (
                            <button
                              type="button"
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Edit"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No salary components</h3>
              <p className="mt-1 text-sm text-gray-500">
                Add salary components to this employee.
              </p>
              {hasPermission('hr.update') && (
                <div className="mt-6">
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Add Component
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Other tabs (Attendance, Leaves, Payroll) - Placeholder for now */}
      {activeTab !== 'details' && activeTab !== 'salary' && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              {activeTab === 'attendance' && <CalendarIcon />}
              {activeTab === 'leaves' && <DocumentTextIcon />}
              {activeTab === 'payroll' && <CreditCardIcon />}
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Coming Soon</h3>
            <p className="mt-1 text-sm text-gray-500">
              {activeTab === 'attendance' && 'Attendance management features will be available soon.'}
              {activeTab === 'leaves' && 'Leave management features will be available soon.'}
              {activeTab === 'payroll' && 'Payroll management features will be available soon.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDetailPage;