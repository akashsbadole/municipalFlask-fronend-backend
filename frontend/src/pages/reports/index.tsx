import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar, Download, BarChart3, PieChart, TrendingUp, Users, DollarSign, FileText } from 'lucide-react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

const Reports = () => {
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start_date: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });
  const [selectedWard, setSelectedWard] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [propertyTaxData, setPropertyTaxData] = useState<any>(null);
  const [complaintData, setComplaintData] = useState<any>(null);
  const [licenseData, setLicenseData] = useState<any>(null);
  const [wasteData, setWasteData] = useState<any>(null);
  const [projectData, setProjectData] = useState<any>(null);
  const [budgetData, setBudgetData] = useState<any>(null);
  const [citizenData, setCitizenData] = useState<any>(null);
  
  // Fetch dashboard data on component mount
  useEffect(() => {
    fetchDashboardData();
    fetchPropertyTaxReport();
    fetchComplaintReport();
    fetchLicenseReport();
    fetchWasteCollectionReport();
    fetchProjectReport();
    fetchBudgetReport();
    fetchCitizenReport();
  }, [dateRange]);
  
  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/reports/dashboard/municipal');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };
  
  const fetchPropertyTaxReport = async () => {
    try {
      const response = await api.get('/reports/revenue/property-tax', {
        params: { ...dateRange, ward: selectedWard, zone: selectedZone }
      });
      setPropertyTaxData(response.data);
    } catch (error) {
      console.error('Error fetching property tax report:', error);
    }
  };
  
  const fetchComplaintReport = async () => {
    try {
      const response = await api.get('/reports/service/complaints', {
        params: dateRange
      });
      setComplaintData(response.data);
    } catch (error) {
      console.error('Error fetching complaint report:', error);
    }
  };
  
  const fetchLicenseReport = async () => {
    try {
      const response = await api.get('/reports/revenue/licenses', {
        params: dateRange
      });
      setLicenseData(response.data);
    } catch (error) {
      console.error('Error fetching license report:', error);
    }
  };
  
  const fetchWasteCollectionReport = async () => {
    try {
      const response = await api.get('/reports/service/waste-collection', {
        params: dateRange
      });
      setWasteData(response.data);
    } catch (error) {
      console.error('Error fetching waste collection report:', error);
    }
  };
  
  const fetchProjectReport = async () => {
    try {
      const response = await api.get('/reports/projects/progress');
      setProjectData(response.data);
    } catch (error) {
      console.error('Error fetching project report:', error);
    }
  };
  
  const fetchBudgetReport = async () => {
    try {
      const response = await api.get('/reports/financial/budget-utilization', {
        params: { year: new Date().getFullYear() }
      });
      setBudgetData(response.data);
    } catch (error) {
      console.error('Error fetching budget report:', error);
    }
  };
  
  const fetchCitizenReport = async () => {
    try {
      const response = await api.get('/reports/citizen/engagement', {
        params: dateRange
      });
      setCitizenData(response.data);
    } catch (error) {
      console.error('Error fetching citizen report:', error);
    }
  };
  
  const exportReport = async (reportType: string) => {
    if (!hasPermission('reports.read')) {
      toast.error('You do not have permission to export reports');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.get(`/reports/export/${reportType}`, {
        params: dateRange,
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}_report_${dateRange.start_date}_to_${dateRange.end_date}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Report exported successfully');
    } catch (error) {
      toast.error('Failed to export report');
      console.error('Error exporting report:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Prepare chart data
  const propertyTaxChartData = propertyTaxData ? {
    labels: Object.keys(propertyTaxData.summary.ward_breakdown || {}),
    datasets: [
      {
        label: 'Property Tax Revenue',
        data: Object.values(propertyTaxData.summary.ward_breakdown || {}),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      }
    ]
  } : null;
  
  const complaintChartData = complaintData ? {
    labels: Object.keys(complaintData.summary.category_breakdown || {}),
    datasets: [
      {
        label: 'Complaints by Category',
        data: Object.values(complaintData.summary.category_breakdown || {}).map((item: any) => item.total),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      }
    ]
  } : null;
  
  const budgetChartData = budgetData ? {
    labels: budgetData.departments.map((dept: any) => dept.department),
    datasets: [
      {
        label: 'Allocated Budget',
        data: budgetData.departments.map((dept: any) => dept.approved_amount),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: 'Expenses',
        data: budgetData.departments.map((dept: any) => dept.expenses),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      }
    ]
  } : null;
  
  if (!hasPermission('reports.read')) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access the reports module.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => exportReport('property_tax')} disabled={loading}>
            <Download className="h-4 w-4 mr-2" />
            Export Property Tax Report
          </Button>
          <Button variant="outline" onClick={() => exportReport('complaints')} disabled={loading}>
            <Download className="h-4 w-4 mr-2" />
            Export Complaint Report
          </Button>
        </div>
      </div>
      
      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={dateRange.start_date}
                onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={dateRange.end_date}
                onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="ward">Ward</Label>
              <Select value={selectedWard} onValueChange={setSelectedWard}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Ward" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Wards</SelectItem>
                  <SelectItem value="1">Ward 1</SelectItem>
                  <SelectItem value="2">Ward 2</SelectItem>
                  <SelectItem value="3">Ward 3</SelectItem>
                  <SelectItem value="4">Ward 4</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="zone">Zone</Label>
              <Select value={selectedZone} onValueChange={setSelectedZone}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Zone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Zones</SelectItem>
                  <SelectItem value="North">North Zone</SelectItem>
                  <SelectItem value="South">South Zone</SelectItem>
                  <SelectItem value="East">East Zone</SelectItem>
                  <SelectItem value="West">West Zone</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Dashboard Overview */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Tax Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{dashboardData.revenue_metrics.current_month_tax.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardData.revenue_metrics.tax_growth > 0 ? '+' : ''}{dashboardData.revenue_metrics.tax_growth.toFixed(1)}% from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Complaints</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.service_metrics.pending_complaints}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardData.service_metrics.resolved_this_month} resolved this month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.project_metrics.active_projects}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardData.project_metrics.delayed_projects} delayed projects
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Citizens</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.citizen_metrics.total_citizens.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {dashboardData.citizen_metrics.new_citizens_this_month} new this month
              </p>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Detailed Reports */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="service">Service Delivery</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
        </TabsList>
        
        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Property Tax Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                {propertyTaxData ? (
                  <div>
                    <div className="mb-4">
                      <div className="text-2xl font-bold">₹{propertyTaxData.summary.total_revenue.toLocaleString()}</div>
                      <p className="text-sm text-gray-600">
                        {propertyTaxData.summary.total_transactions} transactions from {dateRange.start_date} to {dateRange.end_date}
                      </p>
                    </div>
                    {propertyTaxChartData && <Bar data={propertyTaxChartData} />}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <p>Loading property tax data...</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>License Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                {licenseData ? (
                  <div>
                    <div className="mb-4">
                      <div className="text-2xl font-bold">₹{licenseData.summary.total_revenue.toLocaleString()}</div>
                      <p className="text-sm text-gray-600">
                        {licenseData.summary.total_licenses} licenses from {dateRange.start_date} to {dateRange.end_date}
                      </p>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(licenseData.summary.type_breakdown || {}).map(([type, data]: [string, any]) => (
                        <div key={type} className="flex justify-between">
                          <span className="text-sm">{type}</span>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{data.count}</Badge>
                            <span className="text-sm font-medium">₹{data.revenue.toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <p>Loading license data...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="service" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Complaint Service Report</CardTitle>
              </CardHeader>
              <CardContent>
                {complaintData ? (
                  <div>
                    <div className="mb-4">
                      <div className="text-2xl font-bold">{complaintData.summary.total_complaints}</div>
                      <p className="text-sm text-gray-600">
                        Avg. resolution time: {complaintData.summary.avg_resolution_time.toFixed(1)} days
                      </p>
                    </div>
                    {complaintChartData && <Pie data={complaintChartData} />}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <p>Loading complaint data...</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Waste Collection Report</CardTitle>
              </CardHeader>
              <CardContent>
                {wasteData ? (
                  <div>
                    <div className="mb-4">
                      <div className="text-2xl font-bold">{wasteData.summary.total_waste_collected} kg</div>
                      <p className="text-sm text-gray-600">
                        {wasteData.summary.total_collections} collections from {dateRange.start_date} to {dateRange.end_date}
                      </p>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(wasteData.summary.route_breakdown || {}).map(([route, data]: [string, any]) => (
                        <div key={route} className="flex justify-between">
                          <span className="text-sm">Route {route}</span>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{data.collections}</Badge>
                            <span className="text-sm font-medium">{data.total_waste} kg</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <p>Loading waste collection data...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Progress Report</CardTitle>
            </CardHeader>
            <CardContent>
              {projectData ? (
                <div>
                  <div className="mb-4">
                    <div className="text-2xl font-bold">{projectData.summary.total_projects}</div>
                    <p className="text-sm text-gray-600">
                      {projectData.summary.delayed_projects} projects delayed
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">By Type</h4>
                      <div className="space-y-2">
                        {Object.entries(projectData.summary.type_breakdown || {}).map(([type, data]: [string, any]) => (
                          <div key={type} className="flex justify-between">
                            <span className="text-sm">{type}</span>
                            <Badge variant="outline">{data.total}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">By Status</h4>
                      <div className="space-y-2">
                        {Object.entries(projectData.summary.status_breakdown || {}).map(([status, count]: [string, number]) => (
                          <div key={status} className="flex justify-between">
                            <span className="text-sm">{status}</span>
                            <Badge variant="outline">{count}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <p>Loading project data...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Budget Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                {budgetData ? (
                  <div>
                    <div className="mb-4">
                      <div className="text-2xl font-bold">{budgetData.summary.overall_utilization.toFixed(1)}%</div>
                      <p className="text-sm text-gray-600">
                        ₹{budgetData.summary.total_expenses.toLocaleString()} of ₹{budgetData.summary.total_budget.toLocaleString()} utilized
                      </p>
                    </div>
                    {budgetChartData && <Bar data={budgetChartData} />}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <p>Loading budget data...</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Citizen Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                {citizenData ? (
                  <div>
                    <div className="mb-4">
                      <div className="text-2xl font-bold">{citizenData.summary.satisfaction_rate.toFixed(1)}%</div>
                      <p className="text-sm text-gray-600">
                        Citizen satisfaction rate
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">New Citizens</span>
                        <Badge variant="outline">{citizenData.summary.new_citizens}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Total Complaints</span>
                        <Badge variant="outline">{citizenData.summary.total_complaints}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Tax Payments</span>
                        <Badge variant="outline">{citizenData.summary.property_tax_paid}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">License Applications</span>
                        <Badge variant="outline">{citizenData.summary.license_applications}</Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <p>Loading citizen data...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;