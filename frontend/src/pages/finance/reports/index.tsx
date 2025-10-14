import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { financeAPI } from '@/lib/api';
import { toast } from 'react-toastify';
import {
  DocumentArrowDownIcon,
  FunnelIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface FinancialReport {
  id: string;
  title: string;
  report_type: string;
  period_start: string;
  period_end: string;
  generated_at: string;
  generated_by_user: {
    id: string;
    name: string;
    email: string;
  };
  file_url: string;
}

interface BudgetSummary {
  total_allocated: number;
  total_spent: number;
  total_remaining: number;
  utilization_percentage: number;
  department_breakdown: {
    department: string;
    allocated: number;
    spent: number;
    remaining: number;
    utilization_percentage: number;
  }[];
  monthly_trend: {
    month: string;
    allocated: number;
    spent: number;
  }[];
  category_breakdown: {
    category: string;
    amount: number;
    percentage: number;
  }[];
}

const ReportsPage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  
  const [reports, setReports] = useState<FinancialReport[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [reportTypeFilter, setReportTypeFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // New report form
  const [showNewReportForm, setShowNewReportForm] = useState(false);
  const [newReportType, setNewReportType] = useState('budget_summary');
  const [newReportPeriod, setNewReportPeriod] = useState('current_month');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

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

  const reportTypes = [
    { value: 'budget_summary', label: 'Budget Summary' },
    { value: 'expense_report', label: 'Expense Report' },
    { value: 'department_wise', label: 'Department-wise Report' },
    { value: 'monthly_financial', label: 'Monthly Financial Statement' },
    { value: 'annual_financial', label: 'Annual Financial Statement' },
    { value: 'audit_report', label: 'Audit Report' },
  ];

  const reportPeriods = [
    { value: 'current_month', label: 'Current Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'current_quarter', label: 'Current Quarter' },
    { value: 'last_quarter', label: 'Last Quarter' },
    { value: 'current_year', label: 'Current Year' },
    { value: 'last_year', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' },
  ];

  useEffect(() => {
    fetchReports();
    fetchBudgetSummary();
  }, [reportTypeFilter, dateFromFilter, dateToFilter]);

  useEffect(() => {
    // Set default date range for current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    if (newReportPeriod === 'current_month') {
      setCustomDateFrom(firstDay.toISOString().split('T')[0]);
      setCustomDateTo(lastDay.toISOString().split('T')[0]);
    }
  }, [newReportPeriod]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (reportTypeFilter) params.report_type = reportTypeFilter;
      if (dateFromFilter) params.date_from = dateFromFilter;
      if (dateToFilter) params.date_to = dateToFilter;
      
      const response = await financeAPI.getFinancialReports(params);
      setReports(response.data.reports);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to fetch reports';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBudgetSummary = async () => {
    try {
      const response = await financeAPI.getBudgetSummary();
      setBudgetSummary(response.data);
    } catch (error: any) {
      console.error('Failed to fetch budget summary:', error);
    }
  };

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsGeneratingReport(true);
    
    try {
      let period_start = '';
      let period_end = '';
      
      if (newReportPeriod === 'custom') {
        period_start = customDateFrom;
        period_end = customDateTo;
      } else {
        // Calculate date range based on period
        const now = new Date();
        let startDate = new Date();
        let endDate = new Date();
        
        switch (newReportPeriod) {
          case 'current_month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            break;
          case 'last_month':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), 0);
            break;
          case 'current_quarter':
            const quarter = Math.floor(now.getMonth() / 3);
            startDate = new Date(now.getFullYear(), quarter * 3, 1);
            endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0);
            break;
          case 'last_quarter':
            const lastQuarter = Math.floor(now.getMonth() / 3) - 1;
            startDate = new Date(now.getFullYear(), lastQuarter * 3, 1);
            endDate = new Date(now.getFullYear(), lastQuarter * 3 + 3, 0);
            break;
          case 'current_year':
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear(), 11, 31);
            break;
          case 'last_year':
            startDate = new Date(now.getFullYear() - 1, 0, 1);
            endDate = new Date(now.getFullYear() - 1, 11, 31);
            break;
        }
        
        period_start = startDate.toISOString().split('T')[0];
        period_end = endDate.toISOString().split('T')[0];
      }
      
      const reportData = {
        report_type: newReportType,
        period_start,
        period_end,
        departments: selectedDepartments.length > 0 ? selectedDepartments : undefined,
      };
      
      const response = await financeAPI.generateFinancialReport(reportData);
      toast.success('Report generated successfully');
      setShowNewReportForm(false);
      fetchReports();
      
      // Download the report
      if (response.data.file_url) {
        window.open(response.data.file_url, '_blank');
      }
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to generate report';
      toast.error(message);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleDownloadReport = async (reportId: string) => {
    try {
      const response = await financeAPI.downloadFinancialReport(reportId);
      // Create a blob from the response
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financial-report-${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to download report';
      toast.error(message);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const clearFilters = () => {
    setReportTypeFilter('');
    setDateFromFilter('');
    setDateToFilter('');
  };

  // Chart data
  const departmentChartData = budgetSummary ? {
    labels: budgetSummary.department_breakdown.map(d => d.department),
    datasets: [
      {
        label: 'Allocated',
        data: budgetSummary.department_breakdown.map(d => d.allocated),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
      {
        label: 'Spent',
        data: budgetSummary.department_breakdown.map(d => d.spent),
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
      },
    ],
  } : null;

  const categoryChartData = budgetSummary ? {
    labels: budgetSummary.category_breakdown.map(c => c.category),
    datasets: [
      {
        data: budgetSummary.category_breakdown.map(c => c.amount),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(244, 63, 94, 0.8)',
          'rgba(147, 51, 234, 0.8)',
          'rgba(250, 204, 21, 0.8)',
          'rgba(14, 165, 233, 0.8)',
          'rgba(168, 85, 247, 0.8)',
        ],
        borderWidth: 1,
      },
    ],
  } : null;

  const monthlyTrendData = budgetSummary ? {
    labels: budgetSummary.monthly_trend.map(m => m.month),
    datasets: [
      {
        label: 'Allocated',
        data: budgetSummary.monthly_trend.map(m => m.allocated),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Spent',
        data: budgetSummary.monthly_trend.map(m => m.spent),
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      },
    ],
  } : null;

  if (loading && reports.length === 0 && !budgetSummary) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Financial Reports</h1>
            <p className="mt-1 text-sm text-gray-500">
              Generate and download comprehensive financial reports
            </p>
          </div>
          {hasPermission('finance.reports') && (
            <button
              type="button"
              onClick={() => setShowNewReportForm(!showNewReportForm)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
              Generate Report
            </button>
          )}
        </div>
      </div>

      {/* New Report Form */}
      {showNewReportForm && (
        <div className="bg-white shadow rounded-lg mb-6 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Generate New Report</h2>
          <form onSubmit={handleGenerateReport}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label htmlFor="report-type" className="block text-sm font-medium text-gray-700">
                  Report Type
                </label>
                <select
                  id="report-type"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={newReportType}
                  onChange={(e) => setNewReportType(e.target.value)}
                >
                  {reportTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="report-period" className="block text-sm font-medium text-gray-700">
                  Period
                </label>
                <select
                  id="report-period"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={newReportPeriod}
                  onChange={(e) => setNewReportPeriod(e.target.value)}
                >
                  {reportPeriods.map(period => (
                    <option key={period.value} value={period.value}>{period.label}</option>
                  ))}
                </select>
              </div>
              
              {newReportPeriod === 'custom' && (
                <>
                  <div>
                    <label htmlFor="date-from" className="block text-sm font-medium text-gray-700">
                      From Date
                    </label>
                    <input
                      type="date"
                      id="date-from"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      value={customDateFrom}
                      onChange={(e) => setCustomDateFrom(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="date-to" className="block text-sm font-medium text-gray-700">
                      To Date
                    </label>
                    <input
                      type="date"
                      id="date-to"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      value={customDateTo}
                      onChange={(e) => setCustomDateTo(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Departments (Optional)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {departments.map(dept => (
                  <label key={dept} className="flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      checked={selectedDepartments.includes(dept)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDepartments(prev => [...prev, dept]);
                        } else {
                          setSelectedDepartments(prev => prev.filter(d => d !== dept));
                        }
                      }}
                    />
                    <span className="ml-2 text-sm text-gray-700">{dept}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowNewReportForm(false)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isGeneratingReport}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {isGeneratingReport ? 'Generating...' : 'Generate Report'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Budget Summary Dashboard */}
      {budgetSummary && (
        <div className="space-y-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <CurrencyDollarIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Allocated</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(budgetSummary.total_allocated)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <ArrowDownTrayIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(budgetSummary.total_spent)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                  <ChartBarIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Remaining</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(budgetSummary.total_remaining)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                  <BuildingOfficeIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Utilization</p>
                  <p className="text-2xl font-bold text-gray-900">{budgetSummary.utilization_percentage.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Department-wise Budget</h3>
              {departmentChartData && <Bar data={departmentChartData} />}
            </div>
            
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Expense Categories</h3>
              {categoryChartData && <Pie data={categoryChartData} />}
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Trend</h3>
            {monthlyTrendData && <Line data={monthlyTrendData} />}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <FunnelIcon className="h-4 w-4 mr-1" />
                Filters
              </button>
              {(reportTypeFilter || dateFromFilter || dateToFilter) && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
          
          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="report-type-filter" className="block text-sm font-medium text-gray-700">
                  Report Type
                </label>
                <select
                  id="report-type-filter"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={reportTypeFilter}
                  onChange={(e) => setReportTypeFilter(e.target.value)}
                >
                  <option value="">All Types</option>
                  {reportTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="date-from-filter" className="block text-sm font-medium text-gray-700">
                  Date From
                </label>
                <input
                  type="date"
                  id="date-from-filter"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={dateFromFilter}
                  onChange={(e) => setDateFromFilter(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="date-to-filter" className="block text-sm font-medium text-gray-700">
                  Date To
                </label>
                <input
                  type="date"
                  id="date-to-filter"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={dateToFilter}
                  onChange={(e) => setDateToFilter(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {reports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Generated On
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Generated By
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{report.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {reportTypes.find(t => t.value === report.report_type)?.label || report.report_type}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(report.period_start), 'MMM d, yyyy')} - {format(new Date(report.period_end), 'MMM d, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(report.generated_at), 'MMM d, yyyy h:mm a')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{report.generated_by_user.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => handleDownloadReport(report.id)}
                          className="text-primary-600 hover:text-primary-900"
                          title="Download"
                        >
                          <ArrowDownTrayIcon className="h-5 w-5" />
                        </button>
                        {report.file_url && (
                          <button
                            type="button"
                            onClick={() => window.open(report.file_url, '_blank')}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="View"
                          >
                            <MagnifyingGlassIcon className="h-5 w-5" />
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
            <DocumentArrowDownIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No reports found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {reportTypeFilter || dateFromFilter || dateToFilter
                ? 'Try adjusting your search or filters'
                : 'Generate your first financial report'}
            </p>
            {hasPermission('finance.reports') && !reportTypeFilter && !dateFromFilter && !dateToFilter && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setShowNewReportForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                  Generate Report
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;