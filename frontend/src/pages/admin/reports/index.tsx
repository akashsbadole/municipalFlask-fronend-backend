import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { complaintsAPI, propertiesAPI, licensesAPI, financeAPI } from '@/lib/api';
import { toast } from 'react-toastify';
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
import { Bar, Doughnut, Line, Pie } from 'react-chartjs-2';
import {
  DocumentArrowDownIcon,
  FunnelIcon,
  CalendarIcon,
  ChartBarIcon,
  TableCellsIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

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

interface ReportData {
  complaintsByCategory: { [key: string]: number };
  complaintsByWard: { [key: string]: number };
  complaintsByMonth: { [key: string]: number };
  revenueByDepartment: { [key: string]: number };
  propertyTaxCollection: { [key: string]: number };
  licenseApplications: { [key: string]: number };
}

const ReportsPage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days
  const [reportType, setReportType] = useState('overview');
  const [format, setFormat] = useState('web');

  useEffect(() => {
    const fetchReportData = async () => {
      if (!hasPermission('reports.read')) return;
      
      try {
        // In a real application, you would fetch report data from the API
        // For now, we'll simulate it
        setTimeout(() => {
          const mockData: ReportData = {
            complaintsByCategory: {
              'Sanitation': 45,
              'Water Supply': 32,
              'Street Lights': 28,
              'Roads': 25,
              'Drainage': 18,
              'Parks': 12,
              'Noise Pollution': 8,
            },
            complaintsByWard: {
              'Ward 1': 15,
              'Ward 2': 22,
              'Ward 3': 18,
              'Ward 4': 25,
              'Ward 5': 12,
              'Ward 6': 20,
              'Ward 7': 16,
              'Ward 8': 14,
            },
            complaintsByMonth: {
              'Jan': 65,
              'Feb': 72,
              'Mar': 58,
              'Apr': 85,
              'May': 92,
              'Jun': 78,
            },
            revenueByDepartment: {
              'Property Tax': 2500000,
              'Trade License': 850000,
              'Water Supply': 1200000,
              'Waste Management': 650000,
              'Other Fees': 450000,
            },
            propertyTaxCollection: {
              'Collected': 3200000,
              'Pending': 850000,
              'Overdue': 420000,
            },
            licenseApplications: {
              'Approved': 145,
              'Pending': 32,
              'Rejected': 12,
              'Expired': 8,
            },
          };
          
          setReportData(mockData);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Failed to fetch report data:', error);
        toast.error('Failed to load report data');
        setIsLoading(false);
      }
    };

    fetchReportData();
  }, [hasPermission, dateRange]);

  const complaintsByCategoryData = reportData ? {
    labels: Object.keys(reportData.complaintsByCategory),
    datasets: [
      {
        label: 'Complaints',
        data: Object.values(reportData.complaintsByCategory),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(14, 165, 233, 0.8)',
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(236, 72, 153, 1)',
          'rgba(14, 165, 233, 1)',
        ],
        borderWidth: 1,
      },
    ],
  } : null;

  const complaintsByWardData = reportData ? {
    labels: Object.keys(reportData.complaintsByWard),
    datasets: [
      {
        label: 'Complaints',
        data: Object.values(reportData.complaintsByWard),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  } : null;

  const complaintsByMonthData = reportData ? {
    labels: Object.keys(reportData.complaintsByMonth),
    datasets: [
      {
        label: 'Complaints',
        data: Object.values(reportData.complaintsByMonth),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        tension: 0.4,
      },
    ],
  } : null;

  const revenueByDepartmentData = reportData ? {
    labels: Object.keys(reportData.revenueByDepartment),
    datasets: [
      {
        label: 'Revenue (₹)',
        data: Object.values(reportData.revenueByDepartment),
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(236, 72, 153, 1)',
        ],
        borderWidth: 1,
      },
    ],
  } : null;

  const propertyTaxCollectionData = reportData ? {
    labels: Object.keys(reportData.propertyTaxCollection),
    datasets: [
      {
        data: Object.values(reportData.propertyTaxCollection),
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 1,
      },
    ],
  } : null;

  const licenseApplicationsData = reportData ? {
    labels: Object.keys(reportData.licenseApplications),
    datasets: [
      {
        data: Object.values(reportData.licenseApplications),
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(107, 114, 128, 0.8)',
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(107, 114, 128, 1)',
        ],
        borderWidth: 1,
      },
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  const handleExportReport = () => {
    // In a real application, you would call the API to export the report
    toast.success(`Report exported as ${format.toUpperCase()} format`);
  };

  if (!hasPermission('reports.read')) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
        <p className="mt-2 text-sm text-gray-500">
          You don't have permission to view reports.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Reports & Analytics
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Comprehensive insights into municipal operations
          </p>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0 space-x-3">
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          >
            <option value="web">Web View</option>
            <option value="pdf">PDF</option>
            <option value="excel">Excel</option>
            <option value="csv">CSV</option>
          </select>
          <button
            onClick={handleExportReport}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <DocumentArrowDownIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Export
          </button>
        </div>
      </div>

      {/* Report Filters */}
      <div className="bg-white shadow rounded-lg mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 mb-1">
              Report Type
            </label>
            <select
              id="reportType"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
            >
              <option value="overview">Overview</option>
              <option value="complaints">Complaints Analysis</option>
              <option value="revenue">Revenue Analysis</option>
              <option value="performance">Performance Metrics</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <select
              id="dateRange"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 3 months</option>
              <option value="365">Last year</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <select
              id="department"
              className="focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
            >
              <option value="all">All Departments</option>
              <option value="sanitation">Sanitation</option>
              <option value="water">Water Supply</option>
              <option value="streetlights">Street Lights</option>
              <option value="roads">Roads</option>
            </select>
          </div>
        </div>
      </div>

      {/* Report Content */}
      {reportType === 'overview' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                  <DocumentTextIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Complaints
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {Object.values(reportData?.complaintsByMonth || {}).reduce((a, b) => a + b, 0)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                  <CurrencyDollarIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Revenue
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      ₹{Object.values(reportData?.revenueByDepartment || {}).reduce((a, b) => a + b, 0).toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                  <TableCellsIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Tax Collection Rate
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {reportData ? 
                        Math.round((reportData.propertyTaxCollection.Collected / 
                        (reportData.propertyTaxCollection.Collected + reportData.propertyTaxCollection.Pending + reportData.propertyTaxCollection.Overdue)) * 100) 
                        : 0}%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                  <ChartBarIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      License Approvals
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {reportData?.licenseApplications.Approved || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Complaints by Category
              </h3>
              {complaintsByCategoryData && <Pie data={complaintsByCategoryData} options={chartOptions} />}
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Complaints by Ward
              </h3>
              {complaintsByWardData && <Bar data={complaintsByWardData} options={chartOptions} />}
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Monthly Complaint Trend
              </h3>
              {complaintsByMonthData && <Line data={complaintsByMonthData} options={chartOptions} />}
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Revenue by Department
              </h3>
              {revenueByDepartmentData && <Bar data={revenueByDepartmentData} options={chartOptions} />}
            </div>
          </div>

          {/* Charts Row 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Property Tax Collection
              </h3>
              {propertyTaxCollectionData && <Doughnut data={propertyTaxCollectionData} options={chartOptions} />}
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                License Applications Status
              </h3>
              {licenseApplicationsData && <Doughnut data={licenseApplicationsData} options={chartOptions} />}
            </div>
          </div>
        </div>
      )}

      {reportType === 'complaints' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Complaints Analysis</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {complaintsByCategoryData && <Pie data={complaintsByCategoryData} options={chartOptions} />}
              {complaintsByWardData && <Bar data={complaintsByWardData} options={chartOptions} />}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Complaint Trend</h3>
            {complaintsByMonthData && <Line data={complaintsByMonthData} options={chartOptions} />}
          </div>
        </div>
      )}

      {reportType === 'revenue' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Analysis</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {revenueByDepartmentData && <Bar data={revenueByDepartmentData} options={chartOptions} />}
              {propertyTaxCollectionData && <Doughnut data={propertyTaxCollectionData} options={chartOptions} />}
            </div>
          </div>
        </div>
      )}

      {reportType === 'performance' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
          <div className="text-center py-12">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Performance Metrics</h3>
            <p className="mt-1 text-sm text-gray-500">
              Performance metrics and KPIs will be displayed here.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;