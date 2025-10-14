import React, { useState, useEffect } from 'react';
import { paymentService, PaymentDetails, PaymentRequest, formatCurrency, getPaymentMethodDisplayName } from '@/lib/paymentService';
import { toast } from 'react-toastify';
import {
  CreditCardIcon,
  BanknotesIcon,
  DevicePhoneMobileIcon,
  BuildingLibraryIcon,
  WalletIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface PaymentProcessorProps {
  paymentDetails: PaymentDetails;
  onSuccess?: (transactionId: string) => void;
  onFailure?: (error: string) => void;
  onCancel?: () => void;
  showCancelButton?: boolean;
}

const PaymentProcessor: React.FC<PaymentProcessorProps> = ({
  paymentDetails,
  onSuccess,
  onFailure,
  onCancel,
  showCancelButton = true,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string>('credit_card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [error, setError] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');

  const paymentMethods = [
    {
      id: 'credit_card',
      name: 'Credit Card',
      icon: CreditCardIcon,
      description: 'Pay with Visa, Mastercard, Rupay',
    },
    {
      id: 'debit_card',
      name: 'Debit Card',
      icon: CreditCardIcon,
      description: 'Pay with your debit card',
    },
    {
      id: 'net_banking',
      name: 'Net Banking',
      icon: BuildingLibraryIcon,
      description: 'Pay through your bank account',
    },
    {
      id: 'upi',
      name: 'UPI',
      icon: DevicePhoneMobileIcon,
      description: 'Pay with UPI apps',
    },
    {
      id: 'wallet',
      name: 'Wallet',
      icon: WalletIcon,
      description: 'Pay with mobile wallets',
    },
  ];

  const handlePayment = async () => {
    setIsProcessing(true);
    setPaymentStatus('processing');
    setError('');

    try {
      const paymentRequest: PaymentRequest = {
        paymentDetails,
        paymentMethod: selectedMethod as any,
        returnUrl: `${window.location.origin}/payment/success`,
        cancelUrl: `${window.location.origin}/payment/cancel`,
      };

      const response = await paymentService.createPayment(paymentRequest);

      if (response.success) {
        if (response.redirectUrl) {
          // For payment methods that require redirect
          window.location.href = response.redirectUrl;
        } else {
          // For payment methods that complete immediately
          setTransactionId(response.transactionId || '');
          setPaymentStatus('success');
          onSuccess?.(response.transactionId || '');
          toast.success('Payment completed successfully!');
        }
      } else {
        throw new Error(response.error || 'Payment failed');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Payment failed. Please try again.';
      setError(errorMessage);
      setPaymentStatus('failed');
      onFailure?.(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setPaymentStatus('idle');
    setError('');
  };

  const handleCancel = () => {
    if (paymentStatus === 'processing') return;
    onCancel?.();
  };

  useEffect(() => {
    // Check if we're returning from a payment redirect
    const urlParams = new URLSearchParams(window.location.search);
    const paymentId = urlParams.get('payment_id');
    const status = urlParams.get('status');

    if (paymentId && (status === 'success' || status === 'failure')) {
      setIsProcessing(true);
      setPaymentStatus('processing');

      paymentService.verifyPayment(paymentId).then((response) => {
        if (response.success) {
          setTransactionId(response.transactionId || '');
          setPaymentStatus('success');
          onSuccess?.(response.transactionId || '');
          toast.success('Payment completed successfully!');
        } else {
          setError(response.error || 'Payment verification failed');
          setPaymentStatus('failed');
          onFailure?.(response.error || 'Payment verification failed');
          toast.error(response.error || 'Payment verification failed');
        }
        setIsProcessing(false);
      });

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  if (paymentStatus === 'success') {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-center">
          <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Payment Successful!</h3>
          <p className="mt-2 text-sm text-gray-500">
            Your payment of {formatCurrency(paymentDetails.amount)} has been processed successfully.
          </p>
          {transactionId && (
            <p className="mt-1 text-xs text-gray-500">
              Transaction ID: {transactionId}
            </p>
          )}
          <div className="mt-6">
            <button
              type="button"
              onClick={() => window.location.href = '/properties'}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-16 w-16 text-red-500" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Payment Failed</h3>
          <p className="mt-2 text-sm text-gray-500">
            {error || 'Your payment could not be processed. Please try again.'}
          </p>
          <div className="mt-6 flex justify-center space-x-3">
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Try Again
            </button>
            {showCancelButton && (
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900">Complete Payment</h3>
        <p className="mt-1 text-sm text-gray-500">
          Select a payment method to complete your transaction
        </p>
      </div>

      {/* Payment Details */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Payment for:</span>
          <span className="text-sm text-gray-900">{paymentDetails.description}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Reference ID:</span>
          <span className="text-sm text-gray-900">{paymentDetails.referenceId}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Due Date:</span>
          <span className="text-sm text-gray-900">
            {new Date(paymentDetails.dueDate).toLocaleDateString('en-IN')}
          </span>
        </div>
      </div>

      {/* Total Amount */}
      <div className="mb-6 p-4 bg-primary-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-lg font-medium text-gray-900">Total Amount:</span>
          <span className="text-2xl font-bold text-primary-600">
            {formatCurrency(paymentDetails.amount)}
          </span>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-900 mb-3">Select Payment Method</h4>
        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className={`relative flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedMethod === method.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onClick={() => setSelectedMethod(method.id)}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={method.id}
                checked={selectedMethod === method.id}
                onChange={() => setSelectedMethod(method.id)}
                className="sr-only"
              />
              <method.icon className="h-6 w-6 text-gray-600 mr-3" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{method.name}</p>
                <p className="text-xs text-gray-500">{method.description}</p>
              </div>
              <div className={`h-4 w-4 rounded-full border-2 ${
                selectedMethod === method.id
                  ? 'border-primary-500 bg-primary-500'
                  : 'border-gray-300'
              }`}>
                {selectedMethod === method.id && (
                  <div className="h-2 w-2 rounded-full bg-white mx-auto mt-0.5"></div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        {showCancelButton && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={isProcessing}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handlePayment}
          disabled={isProcessing || paymentStatus === 'processing'}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
        >
          {isProcessing || paymentStatus === 'processing' ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </>
          ) : (
            <>
              <BanknotesIcon className="h-4 w-4 mr-2" />
              Pay {formatCurrency(paymentDetails.amount)}
            </>
          )}
        </button>
      </div>

      {/* Security Note */}
      <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex">
          <svg className="h-5 w-5 text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <p className="text-xs text-blue-700">
            Your payment information is secure and encrypted. We do not store your card details.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentProcessor;