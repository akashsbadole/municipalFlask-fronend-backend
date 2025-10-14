import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { propertiesAPI } from '@/lib/api';
import { toast } from 'react-toastify';
import {
  ArrowLeftIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  UserIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  DocumentTextIcon,
  CreditCardIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Property {
  id: string;
  property_id: string;
  owner_name: string;
  owner_id: string;
  address: string;
  ward: string;
  zone: string;
  property_type: string;
  area_sqft: number;
  usage_type: string;
  construction_year: number;
  latitude?: string;
  longitude?: string;
  current_tax_amount?: number;
  tax_status?: string;
  last_payment_date?: string;
  due_date?: string;
  assessment_year?: string;
}

interface TaxRecord {
  id: string;
  property_id: string;
  assessment_year: string;
  tax_amount: number;
  due_date: string;
  paid_date?: string;
  status: string;
  payment_method?: string;
  transaction_id?: string;
  penalty?: number;
  created_at: string;
}

const PropertyDetailPage: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [property, setProperty] = useState<Property | null>(null);
  const [taxRecords, setTaxRecords] = useState<TaxRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedTaxYear, setSelectedTaxYear] = useState('');

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      if (!id) return;
      
      try {
        const response = await propertiesAPI.getById(id as string);
        setProperty(response.data);
        
        // Fetch tax records for this property
        const taxResponse = await propertiesAPI.getTaxes(id as string);
        setTaxRecords(taxResponse.data.taxes || []);
      } catch (error: any) {
        const message = error.response?.data?.error || 'Failed to load property details';
        toast.error(message);
        router.push('/properties');
      } finally {
        setIsLoading(false);
      }
    };

    if (hasPermission('property.read') && id) {
      fetchPropertyDetails();
    }
  }, [id, hasPermission, router]);

  const getTaxStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTaxStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <CurrencyDollarIcon className="h-5 w-5 text-yellow-500" />;
      case 'overdue':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <CurrencyDollarIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const handlePayTax = async (taxId: string) => {
    if (!property) return;
    
    setIsProcessingPayment(true);
    
    try {
      // In a real application, this would integrate with a payment gateway
      // For now, we'll simulate a successful payment
      const paymentData = {
        payment_method: 'online',
        transaction_id: `TXN${Date.now()}`,
        amount: taxRecords.find(t => t.id === taxId)?.tax_amount || 0,
      };
      
      await propertiesAPI.payTax(taxId, paymentData);
      toast.success('Payment successful! Your tax has been paid.');
      
      // Refresh tax records
      const taxResponse = await propertiesAPI.getTaxes(id as string);
      setTaxRecords(taxResponse.data.taxes || []);
      
      // Refresh property details
      const response = await propertiesAPI.getById(id as string);
      setProperty(response.data);
    } catch (error: any) {
      const message = error.response?.data?.error || 'Payment failed';
      toast.error(message);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const canPayTax = (tax: TaxRecord) => {
    // Citizens can only pay for their own properties
    if (user?.role === 'Citizen' && property?.owner_id !== user.id) {
      return false;
    }
    
    // Tax must be pending or overdue
    return tax.status === 'pending' || tax.status === 'overdue';
  };

  if (!hasPermission('property.read')) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
        <p className="mt-2 text-sm text-gray-500">
          You don't have permission to view property details.
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

  if (!property) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Property Not Found</h3>
        <p className="mt-2 text-sm text-gray-500">
          The property you're looking for doesn't exist or has been removed.
        </p>
        <div className="mt-6">
          <Link
            href="/properties"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Back to Properties
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/properties" className="flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeftIcon className="mr-1 h-4 w-4" />
          Back to Properties
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BuildingOfficeIcon className="h-8 w-8 text-gray-400 mr-3" />
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Property Details
              </h3>
            </div>
            {property.tax_status && (
              <div className="flex items-center space-x-2">
                {getTaxStatusIcon(property.tax_status)}
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTaxStatusBadge(property.tax_status)}`}>
                  Tax {property.tax_status}
                </span>
              </div>
            )}
          </div>
          <div className="mt-2 max-w-2xl text-sm text-gray-500">
            Property ID: {property.property_id}
          </div>
        </div>
        
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Owner</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <div className="flex items-center">
                  <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                  {property.owner_name}
                </div>
              </dd>
            </div>
            
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Address</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <div className="flex items-center">
                  <MapPinIcon className="h-5 w-5 text-gray-400 mr-2" />
                  {property.address}
                </div>
                {property.latitude && property.longitude && (
                  <a
                    href={`https://maps.google.com/?q=${property.latitude},${property.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-500 text-sm mt-1 inline-block"
                  >
                    View on Map
                  </a>
                )}
              </dd>
            </div>
            
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Location Details</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                Ward {property.ward}, {property.zone}
              </dd>
            </div>
            
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Property Details</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Type:</span> {property.property_type}
                  </div>
                  <div>
                    <span className="font-medium">Usage:</span> {property.usage_type}
                  </div>
                  <div>
                    <span className="font-medium">Area:</span> {property.area_sqft.toLocaleString()} sq.ft
                  </div>
                  <div>
                    <span className="font-medium">Built:</span> {property.construction_year}
                  </div>
                </div>
              </dd>
            </div>
            
            {property.current_tax_amount && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Current Tax</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-lg font-semibold">₹{property.current_tax_amount.toLocaleString()}</span>
                    </div>
                    {property.due_date && (
                      <div className="flex items-center text-sm text-gray-500">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        Due: {new Date(property.due_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </dd>
              </div>
            )}
            
            {property.last_payment_date && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Last Payment</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {new Date(property.last_payment_date).toLocaleDateString()}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Tax Records */}
      <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Tax Records</h3>
        </div>
        <div className="border-t border-gray-200">
          {taxRecords.length === 0 ? (
            <div className="px-4 py-5 sm:p-6 text-center">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No tax records found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Tax records for this property will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assessment Year
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tax Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {taxRecords.map((tax) => (
                    <tr key={tax.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {tax.assessment_year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{tax.tax_amount.toLocaleString()}
                        {tax.penalty && (
                          <span className="text-red-500 ml-1">
                            + ₹{tax.penalty.toLocaleString()} (penalty)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(tax.due_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getTaxStatusIcon(tax.status)}
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTaxStatusBadge(tax.status)}`}>
                            {tax.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {canPayTax(tax) && (
                          <Link
                            href={`/properties/${id}/pay-tax`}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          >
                            <CreditCardIcon className="h-4 w-4 mr-1" />
                            Pay Now
                          </Link>
                        )}
                        {tax.status === 'paid' && tax.transaction_id && (
                          <span className="text-xs text-gray-500">
                            TXN: {tax.transaction_id}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailPage;