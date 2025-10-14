import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { propertiesAPI } from '@/lib/api';
import { calculatePropertyTax, generateTaxDemandNotice, PropertyDetails, TaxCalculationResult } from '@/lib/taxCalculator';
import { PaymentDetails } from '@/lib/paymentService';
import { toast } from 'react-toastify';
import {
  ArrowLeftIcon,
  CalculatorIcon,
  DocumentTextIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import PaymentProcessor from '@/components/Payment/PaymentProcessor';

const PropertyTaxPaymentPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  
  const [property, setProperty] = useState<any>(null);
  const [taxCalculation, setTaxCalculation] = useState<TaxCalculationResult | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [showPayment, setShowPayment] = useState(false);
  const [showCalculation, setShowCalculation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);

  // Generate assessment years (current year and previous 4 years)
  const currentYear = new Date().getFullYear();
  const assessmentYears = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      if (!id) return;
      
      try {
        const response = await propertiesAPI.getById(id as string);
        setProperty(response.data);
        setIsLoading(false);
      } catch (error: any) {
        const message = error.response?.data?.error || 'Failed to load property details';
        toast.error(message);
        router.push('/properties');
      }
    };

    fetchPropertyDetails();
  }, [id, router]);

  const calculateTax = async () => {
    if (!property) return;
    
    setIsCalculating(true);
    
    try {
      // Create property details object for calculation
      const propertyDetails: PropertyDetails = {
        id: property.id,
        area_sqft: property.area_sqft,
        property_type: property.property_type,
        usage_type: property.usage_type,
        construction_year: property.construction_year,
        ward: property.ward,
        zone: property.zone,
      };
      
      // Calculate tax using the tax calculator
      const result = calculatePropertyTax(propertyDetails, selectedYear);
      setTaxCalculation(result);
      setShowCalculation(true);
    } catch (error) {
      console.error('Tax calculation failed:', error);
      toast.error('Failed to calculate tax. Please try again.');
    } finally {
      setIsCalculating(false);
    }
  };

  const handlePayment = () => {
    if (!taxCalculation) return;
    
    setShowPayment(true);
  };

  const handlePaymentSuccess = (transactionId: string) => {
    toast.success('Tax payment completed successfully!');
    
    // In a real application, you would update the payment status in the backend
    // For now, we'll just redirect back to the property details page
    setTimeout(() => {
      router.push(`/properties/${id}`);
    }, 2000);
  };

  const handlePaymentFailure = (error: string) => {
    console.error('Payment failed:', error);
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
  };

  const downloadDemandNotice = () => {
    if (!property || !taxCalculation) return;
    
    // Create property details object for demand notice
    const propertyDetails: PropertyDetails = {
      id: property.id,
      area_sqft: property.area_sqft,
      property_type: property.property_type,
      usage_type: property.usage_type,
      construction_year: property.construction_year,
      ward: property.ward,
      zone: property.zone,
    };
    
    // Generate demand notice
    const demandNotice = generateTaxDemandNotice(propertyDetails, taxCalculation);
    
    // Create a blob and download the notice
    const blob = new Blob([demandNotice], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tax-demand-${selectedYear}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Demand notice downloaded successfully');
  };

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
        <Link href={`/properties/${id}`} className="flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeftIcon className="mr-1 h-4 w-4" />
          Back to Property Details
        </Link>
      </div>

      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Property Tax Payment</h3>
            <p className="mt-1 text-sm text-gray-600">
              Calculate and pay your property tax for the selected assessment year.
            </p>
            
            {/* Property Summary */}
            <div className="mt-6 bg-white p-4 rounded-lg shadow">
              <h4 className="text-md font-medium text-gray-900 mb-3">Property Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Property ID:</span>
                  <span className="font-medium">{property.property_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Address:</span>
                  <span className="font-medium text-right max-w-[150px]">{property.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Area:</span>
                  <span className="font-medium">{property.area_sqft.toLocaleString()} sq.ft</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Type:</span>
                  <span className="font-medium">{property.property_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Usage:</span>
                  <span className="font-medium">{property.usage_type}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-5 md:mt-0 md:col-span-2">
          {/* Tax Calculation Form */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="mb-4">
                <label htmlFor="assessmentYear" className="block text-sm font-medium text-gray-700 mb-2">
                  Assessment Year
                </label>
                <select
                  id="assessmentYear"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                >
                  {assessmentYears.map((year) => (
                    <option key={year} value={year}>
                      {year}-{parseInt(year) + 1}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={calculateTax}
                  disabled={isCalculating}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {isCalculating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Calculating...
                    </>
                  ) : (
                    <>
                      <CalculatorIcon className="h-4 w-4 mr-2" />
                      Calculate Tax
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Tax Calculation Result */}
          {showCalculation && taxCalculation && (
            <div className="mt-6 bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Tax Calculation Result</h3>
                  <button
                    type="button"
                    onClick={downloadDemandNotice}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <DocumentTextIcon className="h-4 w-4 mr-1" />
                    Download Notice
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Base Tax:</span>
                    <span className="font-medium">₹{taxCalculation.base_tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Education Cess (15%):</span>
                    <span className="font-medium">₹{taxCalculation.education_cess.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Health Cess (10%):</span>
                    <span className="font-medium">₹{taxCalculation.health_cess.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Water Cess (5%):</span>
                    <span className="font-medium">₹{taxCalculation.water_cess.toLocaleString()}</span>
                  </div>
                  {taxCalculation.penalty > 0 && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Penalty:</span>
                      <span className="font-medium text-red-600">₹{taxCalculation.penalty.toLocaleString()}</span>
                    </div>
                  )}
                  {taxCalculation.rebate > 0 && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Rebate:</span>
                      <span className="font-medium text-green-600">-₹{taxCalculation.rebate.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2">
                    <span className="text-lg font-medium text-gray-900">Total Amount:</span>
                    <span className="text-lg font-bold text-primary-600">₹{taxCalculation.total_tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Due Date:</span>
                    <span className="font-medium">{new Date(taxCalculation.due_date).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-center">
                  <button
                    type="button"
                    onClick={handlePayment}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Pay Now
                  </button>
                </div>
                
                {/* Information Note */}
                <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex">
                    <InformationCircleIcon className="h-5 w-5 text-blue-400 mr-2" />
                    <p className="text-xs text-blue-700">
                      Early payment rebate is available if paid before the due date. 
                      Penalty will be applicable for delayed payments as per municipal regulations.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Section */}
          {showPayment && taxCalculation && (
            <div className="mt-6">
              <PaymentProcessor
                paymentDetails={
                  {
                    id: `tax_${property.id}_${selectedYear}`,
                    type: 'property_tax',
                    amount: taxCalculation.total_tax,
                    description: `Property Tax - ${property.property_id} (${selectedYear}-${parseInt(selectedYear) + 1})`,
                    dueDate: taxCalculation.due_date,
                    referenceId: property.property_id,
                    userId: user?.id || '',
                    metadata: {
                      propertyId: property.id,
                      assessmentYear: selectedYear,
                      taxCalculation,
                    },
                  }
                }
                onSuccess={handlePaymentSuccess}
                onFailure={handlePaymentFailure}
                onCancel={handlePaymentCancel}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyTaxPaymentPage;