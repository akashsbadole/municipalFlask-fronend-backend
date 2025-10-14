import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Home, 
  FileText, 
  CreditCard, 
  MapPin, 
  AlertCircle, 
  Phone, 
  Menu,
  User,
  Bell,
  Plus,
  Camera,
  Search
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

const CitizenApp = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentComplaints, setRecentComplaints] = useState<any[]>([]);
  const [pendingBills, setPendingBills] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);
  
  // Fetch data on component mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchRecentComplaints();
      fetchPendingBills();
      fetchServices();
      fetchNotifications();
    }
  }, [isAuthenticated]);
  
  const fetchRecentComplaints = async () => {
    try {
      const response = await api.get('/complaints/my-complaints');
      setRecentComplaints(response.data.slice(0, 5)); // Show only 5 most recent
    } catch (error) {
      console.error('Error fetching complaints:', error);
    }
  };
  
  const fetchPendingBills = async () => {
    try {
      const response = await api.get('/properties/my-properties');
      const properties = response.data;
      
      // Get tax bills for each property
      const billsPromises = properties.map(async (property: any) => {
        try {
          const taxResponse = await api.get(`/properties/${property.id}/tax`);
          return taxResponse.data.filter((bill: any) => bill.status === 'Pending');
        } catch (error) {
          return [];
        }
      });
      
      const billsResults = await Promise.all(billsPromises);
      const allBills = billsResults.flat();
      setPendingBills(allBills.slice(0, 5)); // Show only 5 most recent
    } catch (error) {
      console.error('Error fetching bills:', error);
    }
  };
  
  const fetchServices = async () => {
    try {
      // Mock data for services
      setServices([
        { id: 1, name: 'Water Connection', icon: '💧', description: 'Apply for new water connection' },
        { id: 2, name: 'Trade License', icon: '📋', description: 'Apply for business license' },
        { id: 3, name: 'Property Tax', icon: '💰', description: 'Pay property tax online' },
        { id: 4, name: 'Birth Certificate', icon: '👶', description: 'Request birth certificate' },
        { id: 5, name: 'Waste Collection', icon: '🗑️', description: 'Schedule waste pickup' },
        { id: 6, name: 'Street Light Issue', icon: '💡', description: 'Report street light problems' },
      ]);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };
  
  const fetchNotifications = async () => {
    try {
      // Mock data for notifications
      setNotifications([
        { id: 1, title: 'Water Supply Notice', message: 'Water supply will be interrupted tomorrow from 10 AM to 2 PM', date: '2 hours ago', type: 'info' },
        { id: 2, title: 'Tax Payment Reminder', message: 'Your property tax is due on 15th of this month', date: '1 day ago', type: 'warning' },
        { id: 3, title: 'Complaint Resolved', message: 'Your street light complaint has been resolved', date: '3 days ago', type: 'success' },
      ]);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };
  
  const handleQuickComplaint = () => {
    router.push('/citizen/complaints/new');
  };
  
  const handlePayBill = (billId: string) => {
    router.push(`/citizen/bills/${billId}/pay`);
  };
  
  const handleServiceClick = (serviceId: number) => {
    // Navigate to appropriate service page based on service ID
    switch (serviceId) {
      case 1:
        router.push('/citizen/water/new');
        break;
      case 2:
        router.push('/citizen/licenses/new');
        break;
      case 3:
        router.push('/citizen/properties');
        break;
      case 4:
        router.push('/citizen/certificates/birth');
        break;
      case 5:
        router.push('/citizen/waste');
        break;
      case 6:
        router.push('/citizen/complaints/new?category=streetlight');
        break;
      default:
        toast.error('Service not available');
    }
  };
  
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md hover:bg-blue-700 focus:outline-none"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-bold">Municipal Services</h1>
          </div>
          <div className="flex items-center space-x-3">
            <Link href="/citizen/notifications">
              <button className="p-2 rounded-md hover:bg-blue-700 focus:outline-none relative">
                <Bell className="h-6 w-6" />
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full"></span>
                )}
              </button>
            </Link>
            <Link href="/citizen/profile">
              <button className="p-2 rounded-md hover:bg-blue-700 focus:outline-none">
                <User className="h-6 w-6" />
              </button>
            </Link>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search services, complaints, bills..."
            className="pl-10 bg-white text-gray-800"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="bg-white w-64 h-full shadow-lg">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Menu</h2>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-md hover:bg-gray-100"
                >
                  <span className="text-xl">&times;</span>
                </button>
              </div>
            </div>
            <nav className="p-4">
              <ul className="space-y-2">
                <li>
                  <Link href="/citizen">
                    <button className="w-full text-left p-2 rounded-md hover:bg-gray-100">Home</button>
                  </Link>
                </li>
                <li>
                  <Link href="/citizen/complaints">
                    <button className="w-full text-left p-2 rounded-md hover:bg-gray-100">My Complaints</button>
                  </Link>
                </li>
                <li>
                  <Link href="/citizen/bills">
                    <button className="w-full text-left p-2 rounded-md hover:bg-gray-100">Bills & Payments</button>
                  </Link>
                </li>
                <li>
                  <Link href="/citizen/properties">
                    <button className="w-full text-left p-2 rounded-md hover:bg-gray-100">My Properties</button>
                  </Link>
                </li>
                <li>
                  <Link href="/citizen/services">
                    <button className="w-full text-left p-2 rounded-md hover:bg-gray-100">All Services</button>
                  </Link>
                </li>
                <li>
                  <Link href="/citizen/notifications">
                    <button className="w-full text-left p-2 rounded-md hover:bg-gray-100">Notifications</button>
                  </Link>
                </li>
                <li>
                  <Link href="/citizen/profile">
                    <button className="w-full text-left p-2 rounded-md hover:bg-gray-100">Profile</button>
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <main className="pb-20">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm sticky top-0 z-10">
            <TabsTrigger value="home" className="flex flex-col items-center p-2">
              <Home className="h-5 w-5" />
              <span className="text-xs mt-1">Home</span>
            </TabsTrigger>
            <TabsTrigger value="services" className="flex flex-col items-center p-2">
              <Plus className="h-5 w-5" />
              <span className="text-xs mt-1">Services</span>
            </TabsTrigger>
            <TabsTrigger value="complaints" className="flex flex-col items-center p-2">
              <FileText className="h-5 w-5" />
              <span className="text-xs mt-1">Complaints</span>
            </TabsTrigger>
            <TabsTrigger value="bills" className="flex flex-col items-center p-2">
              <CreditCard className="h-5 w-5" />
              <span className="text-xs mt-1">Bills</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Home Tab */}
          <TabsContent value="home" className="p-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Welcome, {user?.first_name}!</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Access all municipal services at your fingertips
                </p>
              </CardContent>
            </Card>
            
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleQuickComplaint}>
                <CardContent className="p-4 text-center">
                  <div className="bg-red-100 rounded-full p-3 w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="font-medium text-sm">Report Issue</h3>
                  <p className="text-xs text-gray-500 mt-1">File a complaint</p>
                </CardContent>
              </Card>
              
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/citizen/bills')}>
                <CardContent className="p-4 text-center">
                  <div className="bg-green-100 rounded-full p-3 w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-medium text-sm">Pay Bills</h3>
                  <p className="text-xs text-gray-500 mt-1">View pending bills</p>
                </CardContent>
              </Card>
            </div>
            
            {/* Recent Notifications */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Recent Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                {notifications.length > 0 ? (
                  <div className="space-y-3">
                    {notifications.slice(0, 3).map((notification) => (
                      <div key={notification.id} className="border-l-4 border-blue-500 pl-3 py-2">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{notification.date}</p>
                      </div>
                    ))}
                    <Link href="/citizen/notifications">
                      <Button variant="outline" size="sm" className="w-full mt-2">
                        View All Notifications
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No notifications</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Services Tab */}
          <TabsContent value="services" className="p-4">
            <div className="grid grid-cols-2 gap-4">
              {services.map((service) => (
                <Card 
                  key={service.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleServiceClick(service.id)}
                >
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl mb-2">{service.icon}</div>
                    <h3 className="font-medium text-sm">{service.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">{service.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* Complaints Tab */}
          <TabsContent value="complaints" className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">My Complaints</h2>
              <Button size="sm" onClick={handleQuickComplaint}>
                <Plus className="h-4 w-4 mr-1" />
                New Complaint
              </Button>
            </div>
            
            {recentComplaints.length > 0 ? (
              <div className="space-y-3">
                {recentComplaints.map((complaint) => (
                  <Card key={complaint.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-sm">{complaint.title}</h3>
                          <p className="text-xs text-gray-600 mt-1">{complaint.description}</p>
                          <div className="flex items-center mt-2 space-x-2">
                            <Badge variant={complaint.status === 'Resolved' ? 'default' : 'secondary'}>
                              {complaint.status}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(complaint.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <MapPin className="h-4 w-4 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Link href="/citizen/complaints">
                  <Button variant="outline" size="sm" className="w-full">
                    View All Complaints
                  </Button>
                </Link>
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="font-medium text-sm mb-1">No complaints yet</h3>
                  <p className="text-xs text-gray-500 mb-3">Report issues in your area</p>
                  <Button size="sm" onClick={handleQuickComplaint}>
                    File a Complaint
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Bills Tab */}
          <TabsContent value="bills" className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Pending Bills</h2>
              <Link href="/citizen/bills">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
            
            {pendingBills.length > 0 ? (
              <div className="space-y-3">
                {pendingBills.map((bill) => (
                  <Card key={bill.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-sm">Property Tax</h3>
                          <p className="text-xs text-gray-600 mt-1">
                            Property ID: {bill.property_id}
                          </p>
                          <div className="flex items-center mt-2 space-x-2">
                            <span className="text-sm font-semibold">₹{bill.amount}</span>
                            <Badge variant="destructive">Due: {new Date(bill.due_date).toLocaleDateString()}</Badge>
                          </div>
                        </div>
                        <Button size="sm" onClick={() => handlePayBill(bill.id)}>
                          Pay Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="font-medium text-sm mb-1">No pending bills</h3>
                  <p className="text-xs text-gray-500">All your bills are paid</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
      
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-20">
        <div className="grid grid-cols-4">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center p-2 ${activeTab === 'home' ? 'text-blue-600' : 'text-gray-600'}`}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">Home</span>
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`flex flex-col items-center p-2 ${activeTab === 'services' ? 'text-blue-600' : 'text-gray-600'}`}
          >
            <Plus className="h-5 w-5" />
            <span className="text-xs mt-1">Services</span>
          </button>
          <button
            onClick={() => setActiveTab('complaints')}
            className={`flex flex-col items-center p-2 ${activeTab === 'complaints' ? 'text-blue-600' : 'text-gray-600'}`}
          >
            <FileText className="h-5 w-5" />
            <span className="text-xs mt-1">Complaints</span>
          </button>
          <button
            onClick={() => setActiveTab('bills')}
            className={`flex flex-col items-center p-2 ${activeTab === 'bills' ? 'text-blue-600' : 'text-gray-600'}`}
          >
            <CreditCard className="h-5 w-5" />
            <span className="text-xs mt-1">Bills</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CitizenApp;