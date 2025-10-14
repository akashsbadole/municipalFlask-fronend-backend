import axios from 'axios';
import Cookies from 'js-cookie';

// Create axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = Cookies.get('refresh_token');
        if (refreshToken) {
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
            {},
            {
              headers: {
                Authorization: `Bearer ${refreshToken}`,
              },
            }
          );
          
          const { access_token } = response.data;
          Cookies.set('access_token', access_token);
          
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token failed, redirect to login
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: { username: string; password: string }) =>
    api.post('/auth/login', credentials),
  
  register: (userData: any) =>
    api.post('/auth/register', userData),
  
  logout: () =>
    api.delete('/auth/logout'),
  
  refreshToken: () =>
    api.post('/auth/refresh'),
  
  changePassword: (data: { current_password: string; new_password: string }) =>
    api.post('/auth/change-password', data),
  
  getProfile: () =>
    api.get('/auth/profile'),
  
  updateProfile: (userData: any) =>
    api.put('/auth/profile', userData),
  
  getRoles: () =>
    api.get('/auth/roles'),
  
  initRoles: () =>
    api.post('/auth/init-roles'),
};

// Citizens API
export const citizensAPI = {
  getAll: (params?: any) =>
    api.get('/citizens', { params }),
  
  getById: (id: string) =>
    api.get(`/citizens/${id}`),
  
  create: (citizenData: any) =>
    api.post('/citizens', citizenData),
  
  update: (id: string, citizenData: any) =>
    api.put(`/citizens/${id}`, citizenData),
  
  verify: (id: string, data: { method: string }) =>
    api.post(`/citizens/${id}/verify`, data),
};

// Properties API
export const propertiesAPI = {
  getAll: (params?: any) =>
    api.get('/properties', { params }),
  
  getById: (id: string) =>
    api.get(`/properties/${id}`),
  
  create: (propertyData: any) =>
    api.post('/properties', propertyData),
  
  update: (id: string, propertyData: any) =>
    api.put(`/properties/${id}`, propertyData),
  
  createTax: (id: string, taxData: any) =>
    api.post(`/properties/${id}/tax`, taxData),
  
  getTaxes: (id: string) =>
    api.get(`/properties/${id}/taxes`),
  
  payTax: (taxId: string, paymentData: any) =>
    api.post(`/properties/tax/${taxId}/pay`, paymentData),
};

// Complaints API
export const complaintsAPI = {
  getCategories: () =>
    api.get('/complaints/categories'),
  
  createCategory: (categoryData: any) =>
    api.post('/complaints/categories', categoryData),
  
  getAll: (params?: any) =>
    api.get('/complaints', { params }),
  
  getById: (id: string) =>
    api.get(`/complaints/${id}`),
  
  create: (complaintData: any) =>
    api.post('/complaints', complaintData),
  
  assign: (id: string, data: { assigned_to: string }) =>
    api.post(`/complaints/${id}/assign`, data),
  
  updateStatus: (id: string, data: { status: string; notes?: string }) =>
    api.post(`/complaints/${id}/status`, data),
  
  escalate: (id: string, data: { escalate_to: string; level?: number }) =>
    api.post(`/complaints/${id}/escalate`, data),
  
  addFeedback: (id: string, data: { feedback: string; rating: number }) =>
    api.post(`/complaints/${id}/feedback`, data),
  
  getDashboardStats: () =>
    api.get('/complaints/dashboard/stats'),
};

// Licenses API
export const licensesAPI = {
  getAll: (params?: any) =>
    api.get('/licenses', { params }),
  
  getById: (id: string) =>
    api.get(`/licenses/${id}`),
  
  create: (licenseData: FormData) =>
    api.post('/licenses', licenseData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  update: (id: string, licenseData: any) =>
    api.put(`/licenses/${id}`, licenseData),
  
  delete: (id: string) =>
    api.delete(`/licenses/${id}`),
  
  approve: (id: string) =>
    api.post(`/licenses/${id}/approve`),
  
  reject: (id: string, data: { reason: string }) =>
    api.post(`/licenses/${id}/reject`, data),
  
  renew: (id: string, data: FormData) =>
    api.post(`/licenses/${id}/renew`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
};

// Buildings API
export const buildingsAPI = {
  getAll: (params?: any) =>
    api.get('/buildings', { params }),
  
  getById: (id: string) =>
    api.get(`/buildings/${id}`),
  
  create: (buildingData: FormData) =>
    api.post('/buildings', buildingData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  update: (id: string, buildingData: any) =>
    api.put(`/buildings/${id}`, buildingData),
  
  delete: (id: string) =>
    api.delete(`/buildings/${id}`),
  
  approve: (id: string) =>
    api.post(`/buildings/${id}/approve`),
  
  reject: (id: string, data: { reason: string }) =>
    api.post(`/buildings/${id}/reject`, data),
  
  requestChanges: (id: string, data: { changes: string }) =>
    api.post(`/buildings/${id}/request-changes`, data),
  
  scheduleInspection: (id: string, data: { date: string; time: string; inspector: string }) =>
    api.post(`/buildings/${id}/schedule-inspection`, data),
};

// Waste API
export const wasteAPI = {
  // Routes
  getRoutes: (params?: any) =>
    api.get('/waste/routes', { params }),
  
  getRouteById: (id: string) =>
    api.get(`/waste/routes/${id}`),
  
  createRoute: (routeData: any) =>
    api.post('/waste/routes', routeData),
  
  updateRoute: (id: string, routeData: any) =>
    api.put(`/waste/routes/${id}`, routeData),
  
  deleteRoute: (id: string) =>
    api.delete(`/waste/routes/${id}`),
  
  optimizeRoute: (id: string) =>
    api.post(`/waste/routes/${id}/optimize`),
  
  // Collections
  getCollections: (params?: any) =>
    api.get('/waste/collections', { params }),
  
  getCollectionById: (id: string) =>
    api.get(`/waste/collections/${id}`),
  
  createCollection: (collectionData: any) =>
    api.post('/waste/collections', collectionData),
  
  updateCollection: (id: string, collectionData: any) =>
    api.put(`/waste/collections/${id}`, collectionData),
  
  // General waste management
  getAll: (params?: any) =>
    api.get('/waste', { params }),
  
  create: (wasteData: any) =>
    api.post('/waste', wasteData),
};

// Water API
export const waterAPI = {
  // Connections
  getConnections: (params?: any) =>
    api.get('/water/connections', { params }),
  
  getConnectionById: (id: string) =>
    api.get(`/water/connections/${id}`),
  
  createConnection: (connectionData: FormData) =>
    api.post('/water/connections', connectionData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  updateConnection: (id: string, connectionData: any) =>
    api.put(`/water/connections/${id}`, connectionData),
  
  approveConnection: (id: string) =>
    api.post(`/water/connections/${id}/approve`),
  
  rejectConnection: (id: string, data: { reason: string }) =>
    api.post(`/water/connections/${id}/reject`, data),
  
  // Meter Readings
  getMeterReadings: (connectionId: string, params?: any) =>
    api.get(`/water/connections/${connectionId}/readings`, { params }),
  
  createMeterReading: (connectionId: string, readingData: any) =>
    api.post(`/water/connections/${connectionId}/readings`, readingData),
  
  // Bills
  getBills: (connectionId: string, params?: any) =>
    api.get(`/water/connections/${connectionId}/bills`, { params }),
  
  getBillById: (connectionId: string, billId: string) =>
    api.get(`/water/connections/${connectionId}/bills/${billId}`),
  
  generateBill: (connectionId: string, billData: any) =>
    api.post(`/water/connections/${connectionId}/bills`, billData),
  
  payBill: (connectionId: string, billId: string, paymentData: any) =>
    api.post(`/water/connections/${connectionId}/bills/${billId}/pay`, paymentData),
  
  // General water management
  getAll: (params?: any) =>
    api.get('/water', { params }),
  
  create: (waterData: any) =>
    api.post('/water', waterData),
};

// Streetlights API
export const streetlightsAPI = {
  getAll: (params?: any) =>
    api.get('/streetlights', { params }),
  
  getById: (id: string) =>
    api.get(`/streetlights/${id}`),
  
  create: (streetlightData: any) =>
    api.post('/streetlights', streetlightData),
  
  update: (id: string, streetlightData: any) =>
    api.put(`/streetlights/${id}`, streetlightData),
  
  delete: (id: string) =>
    api.delete(`/streetlights/${id}`),
  
  getMaintenanceRecords: (id: string) =>
    api.get(`/streetlights/${id}/maintenance`),
  
  addMaintenanceRecord: (id: string, maintenanceData: any) =>
    api.post(`/streetlights/${id}/maintenance`, maintenanceData),
  
  updateMaintenanceRecord: (id: string, maintenanceId: string, maintenanceData: any) =>
    api.put(`/streetlights/${id}/maintenance/${maintenanceId}`, maintenanceData),
  
  deleteMaintenanceRecord: (id: string, maintenanceId: string) =>
    api.delete(`/streetlights/${id}/maintenance/${maintenanceId}`),
  
  getIssues: (id: string) =>
    api.get(`/streetlights/${id}/issues`),
  
  reportIssue: (id: string, issueData: any) =>
    api.post(`/streetlights/${id}/issues`, issueData),
  
  updateIssue: (id: string, issueId: string, issueData: any) =>
    api.put(`/streetlights/${id}/issues/${issueId}`, issueData),
  
  resolveIssue: (id: string, issueId: string, resolutionData: any) =>
    api.post(`/streetlights/${id}/issues/${issueId}/resolve`, resolutionData),
  
  getMaintenanceSchedule: (params?: any) =>
    api.get('/streetlights/maintenance/schedule', { params }),
  
  getMaintenanceStats: (params?: any) =>
    api.get('/streetlights/maintenance/stats', { params }),
};

// Health API
export const healthAPI = {
  // Inspections
  getInpections: (params?: any) =>
    api.get('/health/inspections', { params }),
  
  getInspectionById: (id: string) =>
    api.get(`/health/inspections/${id}`),
  
  createInspection: (inspectionData: any) =>
    api.post('/health/inspections', inspectionData),
  
  updateInspection: (id: string, inspectionData: any) =>
    api.put(`/health/inspections/${id}`, inspectionData),
  
  deleteInspection: (id: string) =>
    api.delete(`/health/inspections/${id}`),
  
  // Violations
  getViolations: (inspectionId: string) =>
    api.get(`/health/inspections/${inspectionId}/violations`),
  
  addViolation: (inspectionId: string, violationData: any) =>
    api.post(`/health/inspections/${inspectionId}/violations`, violationData),
  
  // Reports
  getReports: (inspectionId: string) =>
    api.get(`/health/inspections/${inspectionId}/reports`),
  
  addReport: (inspectionId: string, reportData: any) =>
    api.post(`/health/inspections/${inspectionId}/reports`, reportData),
  
  // Schedule
  getSchedule: (params?: any) =>
    api.get('/health/schedule', { params }),
  
  addToSchedule: (scheduleData: any) =>
    api.post('/health/schedule', scheduleData),
  
  // Statistics
  getStats: (params?: any) =>
    api.get('/health/stats', { params }),
  
  // General health management
  getAll: (params?: any) =>
    api.get('/health', { params }),
  
  create: (healthData: any) =>
    api.post('/health', healthData),
};

// Finance API
export const financeAPI = {
  // Budgets
  getBudgets: (params?: any) =>
    api.get('/finance/budgets', { params }),
  
  getBudgetById: (id: string) =>
    api.get(`/finance/budgets/${id}`),
  
  createBudget: (budgetData: any) =>
    api.post('/finance/budgets', budgetData),
  
  updateBudget: (id: string, budgetData: any) =>
    api.put(`/finance/budgets/${id}`, budgetData),
  
  deleteBudget: (id: string) =>
    api.delete(`/finance/budgets/${id}`),
  
  submitBudget: (id: string) =>
    api.post(`/finance/budgets/${id}/submit`),
  
  approveBudget: (id: string) =>
    api.post(`/finance/budgets/${id}/approve`),
  
  rejectBudget: (id: string) =>
    api.post(`/finance/budgets/${id}/reject`),
  
  addBudgetComment: (id: string, data: any) =>
    api.post(`/finance/budgets/${id}/comments`, data),
  
  // Budget Items
  getBudgetItems: (budgetId: string) =>
    api.get(`/finance/budgets/${budgetId}/items`),
  
  createBudgetItem: (budgetId: string, itemData: any) =>
    api.post(`/finance/budgets/${budgetId}/items`, itemData),
  
  updateBudgetItem: (budgetId: string, itemId: string, itemData: any) =>
    api.put(`/finance/budgets/${budgetId}/items/${itemId}`, itemData),
  
  deleteBudgetItem: (budgetId: string, itemId: string) =>
    api.delete(`/finance/budgets/${budgetId}/items/${itemId}`),
  
  // Expenses
  getExpenses: (params?: any) =>
    api.get('/finance/expenses', { params }),
  
  getExpenseById: (id: string) =>
    api.get(`/finance/expenses/${id}`),
  
  createExpense: (expenseData: any) =>
    api.post('/finance/expenses', expenseData),
  
  updateExpense: (id: string, expenseData: any) =>
    api.put(`/finance/expenses/${id}`, expenseData),
  
  deleteExpense: (id: string) =>
    api.delete(`/finance/expenses/${id}`),
  
  approveExpense: (id: string) =>
    api.post(`/finance/expenses/${id}/approve`),
  
  rejectExpense: (id: string) =>
    api.post(`/finance/expenses/${id}/reject`),
  
  uploadReceipt: (data: FormData) =>
    api.post('/finance/expenses/upload-receipt', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  
  // Financial Reports
  getFinancialReports: (params?: any) =>
    api.get('/finance/reports', { params }),
  
  getFinancialReportById: (id: string) =>
    api.get(`/finance/reports/${id}`),
  
  generateFinancialReport: (reportData: any) =>
    api.post('/finance/reports', reportData),
  
  downloadFinancialReport: (id: string) =>
    api.get(`/finance/reports/${id}/download`, {
      responseType: 'blob',
    }),
  
  getBudgetSummary: () =>
    api.get('/finance/budgets/summary'),
  
  // Statistics
  getStats: (params?: any) =>
    api.get('/finance/stats', { params }),
  
  // General finance management
  getAll: (params?: any) =>
    api.get('/finance', { params }),
  
  create: (financeData: any) =>
    api.post('/finance', financeData),
};

// HR API
export const hrAPI = {
  // Employees
  getEmployees: (params?: any) =>
    api.get('/hr/employees', { params }),
  
  getEmployeeById: (id: string) =>
    api.get(`/hr/employees/${id}`),
  
  createEmployee: (employeeData: any) =>
    api.post('/hr/employees', employeeData),
  
  updateEmployee: (id: string, employeeData: any) =>
    api.put(`/hr/employees/${id}`, employeeData),
  
  deleteEmployee: (id: string) =>
    api.delete(`/hr/employees/${id}`),
  
  // Salary Components
  getSalaryComponents: (employeeId: string) =>
    api.get(`/hr/employees/${employeeId}/salary-components`),
  
  createSalaryComponent: (employeeId: string, componentData: any) =>
    api.post(`/hr/employees/${employeeId}/salary-components`, componentData),
  
  // Attendance
  getAttendance: (params?: any) =>
    api.get('/hr/attendance', { params }),
  
  markAttendance: (attendanceData: any) =>
    api.post('/hr/attendance', attendanceData),
  
  // Leaves
  getLeaves: (params?: any) =>
    api.get('/hr/leaves', { params }),
  
  applyLeave: (leaveData: any) =>
    api.post('/hr/leaves', leaveData),
  
  approveLeave: (leaveId: string) =>
    api.post(`/hr/leaves/${leaveId}/approve`),
  
  rejectLeave: (leaveId: string, data: any) =>
    api.post(`/hr/leaves/${leaveId}/reject`, data),
  
  // Payroll
  getPayrolls: (params?: any) =>
    api.get('/hr/payroll', { params }),
  
  calculatePayroll: (payrollData: any) =>
    api.post('/hr/payroll/calculate', payrollData),
  
  processPayroll: (payrollId: string, data: any) =>
    api.post(`/hr/payroll/${payrollId}/process`, data),
  
  // Statistics
  getStats: (params?: any) =>
    api.get('/hr/stats', { params }),
  
  // General HR management
  getAll: (params?: any) =>
    api.get('/hr', { params }),
  
  create: (hrData: any) =>
    api.post('/hr', hrData),
};

// Public Works API
export const publicWorksAPI = {
  // Projects
  getProjects: (params?: any) =>
    api.get('/public-works/projects', { params }),
  
  getProject: (id: string) =>
    api.get(`/public-works/projects/${id}`),
  
  createProject: (projectData: any) =>
    api.post('/public-works/projects', projectData),
  
  updateProject: (id: string, projectData: any) =>
    api.put(`/public-works/projects/${id}`, projectData),
  
  deleteProject: (id: string) =>
    api.delete(`/public-works/projects/${id}`),
  
  // Project Milestones
  getProjectMilestones: (projectId: string) =>
    api.get(`/public-works/projects/${projectId}/milestones`),
  
  createProjectMilestone: (projectId: string, milestoneData: any) =>
    api.post(`/public-works/projects/${projectId}/milestones`, milestoneData),
  
  updateProjectMilestone: (projectId: string, milestoneId: string, milestoneData: any) =>
    api.put(`/public-works/projects/${projectId}/milestones/${milestoneId}`, milestoneData),
  
  deleteProjectMilestone: (projectId: string, milestoneId: string) =>
    api.delete(`/public-works/projects/${projectId}/milestones/${milestoneId}`),
  
  // Project Documents
  getProjectDocuments: (projectId: string) =>
    api.get(`/public-works/projects/${projectId}/documents`),
  
  uploadProjectDocument: (projectId: string, documentData: FormData) =>
    api.post(`/public-works/projects/${projectId}/documents`, documentData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  deleteProjectDocument: (projectId: string, documentId: string) =>
    api.delete(`/public-works/projects/${projectId}/documents/${documentId}`),
  
  // Project Inspections
  getProjectInspections: (projectId: string) =>
    api.get(`/public-works/projects/${projectId}/inspections`),
  
  createProjectInspection: (projectId: string, inspectionData: any) =>
    api.post(`/public-works/projects/${projectId}/inspections`, inspectionData),
  
  updateProjectInspection: (projectId: string, inspectionId: string, inspectionData: any) =>
    api.put(`/public-works/projects/${projectId}/inspections/${inspectionId}`, inspectionData),
  
  deleteProjectInspection: (projectId: string, inspectionId: string) =>
    api.delete(`/public-works/projects/${projectId}/inspections/${inspectionId}`),
  
  // Project Expenses
  getProjectExpenses: (projectId: string) =>
    api.get(`/public-works/projects/${projectId}/expenses`),
  
  createProjectExpense: (projectId: string, expenseData: any) =>
    api.post(`/public-works/projects/${projectId}/expenses`, expenseData),
  
  updateProjectExpense: (projectId: string, expenseId: string, expenseData: any) =>
    api.put(`/public-works/projects/${projectId}/expenses/${expenseId}`, expenseData),
  
  deleteProjectExpense: (projectId: string, expenseId: string) =>
    api.delete(`/public-works/projects/${projectId}/expenses/${expenseId}`),
  
  // Tenders
  getTenders: (params?: any) =>
    api.get('/public-works/tenders', { params }),
  
  getTender: (id: string) =>
    api.get(`/public-works/tenders/${id}`),
  
  createTender: (tenderData: any) =>
    api.post('/public-works/tenders', tenderData),
  
  updateTender: (id: string, tenderData: any) =>
    api.put(`/public-works/tenders/${id}`, tenderData),
  
  deleteTender: (id: string) =>
    api.delete(`/public-works/tenders/${id}`),
  
  // Tender Bidders
  getTenderBidders: (tenderId: string) =>
    api.get(`/public-works/tenders/${tenderId}/bidders`),
  
  createTenderBidder: (tenderId: string, bidderData: any) =>
    api.post(`/public-works/tenders/${tenderId}/bidders`, bidderData),
  
  updateTenderBidder: (tenderId: string, bidderId: string, bidderData: any) =>
    api.put(`/public-works/tenders/${tenderId}/bidders/${bidderId}`, bidderData),
  
  deleteTenderBidder: (tenderId: string, bidderId: string) =>
    api.delete(`/public-works/tenders/${tenderId}/bidders/${bidderId}`),
  
  // Tender Documents
  getTenderDocuments: (tenderId: string) =>
    api.get(`/public-works/tenders/${tenderId}/documents`),
  
  uploadTenderDocument: (tenderId: string, documentData: FormData) =>
    api.post(`/public-works/tenders/${tenderId}/documents`, documentData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  deleteTenderDocument: (tenderId: string, documentId: string) =>
    api.delete(`/public-works/tenders/${tenderId}/documents/${documentId}`),
  
  // Statistics
  getStats: () =>
    api.get('/public-works/stats'),
  
  // General public works management
  getAll: (params?: any) =>
    api.get('/public-works', { params }),
  
  create: (publicWorksData: any) =>
    api.post('/public-works', publicWorksData),
};

// E-Governance API
export const egovAPI = {
  // Public Notices
  getNotices: (params?: any) =>
    api.get('/egov/notices', { params }),
  
  getNotice: (id: string) =>
    api.get(`/egov/notices/${id}`),
  
  createNotice: (noticeData: any) =>
    api.post('/egov/notices', noticeData),
  
  updateNotice: (id: string, noticeData: any) =>
    api.put(`/egov/notices/${id}`, noticeData),
  
  deleteNotice: (id: string) =>
    api.delete(`/egov/notices/${id}`),
  
  // RTI Requests
  getRTIRequests: (params?: any) =>
    api.get('/egov/rti', { params }),
  
  getRTIRequest: (id: string) =>
    api.get(`/egov/rti/${id}`),
  
  createRTIRequest: (rtiData: any) =>
    api.post('/egov/rti', rtiData),
  
  assignRTIRequest: (id: string, data: any) =>
    api.post(`/egov/rti/${id}/assign`, data),
  
  respondRTIRequest: (id: string, data: any) =>
    api.post(`/egov/rti/${id}/respond`, data),
  
  rejectRTIRequest: (id: string, data: any) =>
    api.post(`/egov/rti/${id}/reject`, data),
  
  // Documents
  getDocuments: (params?: any) =>
    api.get('/egov/documents', { params }),
  
  getDocument: (id: string) =>
    api.get(`/egov/documents/${id}`),
  
  uploadDocument: (formData: FormData) =>
    api.post('/egov/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
  
  downloadDocument: (id: string) =>
    api.get(`/egov/documents/${id}/download`, {
      responseType: 'blob',
    }),
  
  grantDocumentAccess: (id: string, data: any) =>
    api.post(`/egov/documents/${id}/access`, data),
  
  revokeDocumentAccess: (id: string, accessId: string) =>
    api.delete(`/egov/documents/${id}/access/${accessId}`),
  
  // Statistics
  getStats: () =>
    api.get('/egov/stats'),
  
  // General e-governance management
  getAll: (params?: any) =>
    api.get('/egov', { params }),
  
  create: (egovData: any) =>
    api.post('/egov', egovData),
};

// Disaster API
export const disasterAPI = {
  // Disaster Alerts
  getAlerts: (params?: any) =>
    api.get('/disaster/alerts', { params }),
  
  getAlert: (id: string) =>
    api.get(`/disaster/alerts/${id}`),
  
  createAlert: (alertData: any) =>
    api.post('/disaster/alerts', alertData),
  
  updateAlert: (id: string, alertData: any) =>
    api.put(`/disaster/alerts/${id}`, alertData),
  
  deleteAlert: (id: string) =>
    api.delete(`/disaster/alerts/${id}`),
  
  sendAlertNotifications: (id: string) =>
    api.post(`/disaster/alerts/${id}/send-notifications`),
  
  // Emergency Teams
  getTeams: (params?: any) =>
    api.get('/disaster/teams', { params }),
  
  getTeam: (id: string) =>
    api.get(`/disaster/teams/${id}`),
  
  createTeam: (teamData: any) =>
    api.post('/disaster/teams', teamData),
  
  updateTeam: (id: string, teamData: any) =>
    api.put(`/disaster/teams/${id}`, teamData),
  
  deleteTeam: (id: string) =>
    api.delete(`/disaster/teams/${id}`),
  
  deployTeam: (id: string, data: any) =>
    api.post(`/disaster/teams/${id}/deploy`, data),
  
  // Statistics
  getStats: () =>
    api.get('/disaster/stats'),
  
  // General disaster management
  getAll: (params?: any) =>
    api.get('/disaster', { params }),
  
  create: (disasterData: any) =>
    api.post('/disaster', disasterData),
};

// Reports API
export const reportsAPI = {
  getAll: (params?: any) =>
    api.get('/reports', { params }),
  
  generate: (reportData: any) =>
    api.post('/reports', reportData),
};

export default api;