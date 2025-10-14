// Payment Integration Service
export interface PaymentDetails {
  id: string;
  type: 'property_tax' | 'trade_license' | 'water_bill' | 'other';
  amount: number;
  description: string;
  dueDate: string;
  referenceId: string;
  userId: string;
  metadata?: Record<string, any>;
}

export interface PaymentRequest {
  paymentDetails: PaymentDetails;
  paymentMethod: 'credit_card' | 'debit_card' | 'net_banking' | 'upi' | 'wallet';
  returnUrl?: string;
  cancelUrl?: string;
}

export interface PaymentResponse {
  success: boolean;
  paymentId?: string;
  transactionId?: string;
  status?: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
  amount?: number;
  currency?: string;
  message?: string;
  error?: string;
  redirectUrl?: string;
}

export interface PaymentGateway {
  name: string;
  createPayment: (request: PaymentRequest) => Promise<PaymentResponse>;
  verifyPayment: (paymentId: string) => Promise<PaymentResponse>;
  refundPayment: (paymentId: string, amount?: number) => Promise<PaymentResponse>;
}

// Mock Payment Gateway Implementation
export class MockPaymentGateway implements PaymentGateway {
  name = 'Mock Payment Gateway';

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    // Simulate API call to payment gateway
    return new Promise((resolve) => {
      setTimeout(() => {
        // Generate a mock payment ID
        const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Simulate different payment methods
        if (request.paymentMethod === 'upi' || request.paymentMethod === 'wallet') {
          // For UPI and wallet, simulate direct success
          resolve({
            success: true,
            paymentId,
            transactionId: `txn_${Date.now()}`,
            status: 'captured',
            amount: request.paymentDetails.amount,
            currency: 'INR',
            message: 'Payment successful',
          });
        } else {
          // For card and net banking, simulate redirect to payment page
          resolve({
            success: true,
            paymentId,
            status: 'created',
            amount: request.paymentDetails.amount,
            currency: 'INR',
            redirectUrl: `/payment/checkout?payment_id=${paymentId}`,
            message: 'Payment initiated. Please complete the payment.',
          });
        }
      }, 1000);
    });
  }

  async verifyPayment(paymentId: string): Promise<PaymentResponse> {
    // Simulate API call to verify payment status
    return new Promise((resolve) => {
      setTimeout(() => {
        // In a real implementation, you would call the payment gateway API
        // For demo purposes, we'll simulate a successful payment
        resolve({
          success: true,
          paymentId,
          transactionId: `txn_${Date.now()}`,
          status: 'captured',
          amount: 1000, // This would come from the payment gateway
          currency: 'INR',
          message: 'Payment verified successfully',
        });
      }, 500);
    });
  }

  async refundPayment(paymentId: string, amount?: number): Promise<PaymentResponse> {
    // Simulate API call to process refund
    return new Promise((resolve) => {
      setTimeout(() => {
        // In a real implementation, you would call the payment gateway API
        resolve({
          success: true,
          paymentId,
          transactionId: `refund_${Date.now()}`,
          status: 'refunded',
          amount: amount || 1000, // This would come from the payment gateway
          currency: 'INR',
          message: 'Refund processed successfully',
        });
      }, 1000);
    });
  }
}

// Razorpay Integration (Mock Implementation)
export class RazorpayGateway implements PaymentGateway {
  name = 'Razorpay';

  async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
    // In a real implementation, you would integrate with Razorpay SDK
    return new Promise((resolve) => {
      setTimeout(() => {
        const paymentId = `razorpay_${Date.now()}`;
        
        resolve({
          success: true,
          paymentId,
          status: 'created',
          amount: request.paymentDetails.amount * 100, // Razorpay uses amount in paise
          currency: 'INR',
          redirectUrl: `/payment/razorpay?payment_id=${paymentId}`,
          message: 'Payment initiated. Please complete the payment.',
        });
      }, 1000);
    });
  }

  async verifyPayment(paymentId: string): Promise<PaymentResponse> {
    // In a real implementation, you would verify the payment signature
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          paymentId,
          transactionId: `razorpay_txn_${Date.now()}`,
          status: 'captured',
          amount: 100000, // This would come from the payment gateway
          currency: 'INR',
          message: 'Payment verified successfully',
        });
      }, 500);
    });
  }

  async refundPayment(paymentId: string, amount?: number): Promise<PaymentResponse> {
    // In a real implementation, you would call Razorpay refund API
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          paymentId,
          transactionId: `razorpay_refund_${Date.now()}`,
          status: 'refunded',
          amount: amount || 100000,
          currency: 'INR',
          message: 'Refund processed successfully',
        });
      }, 1000);
    });
  }
}

// Payment Service Class
export class PaymentService {
  private gateways: Map<string, PaymentGateway> = new Map();
  private defaultGateway: string = 'mock';

  constructor() {
    // Initialize payment gateways
    this.gateways.set('mock', new MockPaymentGateway());
    this.gateways.set('razorpay', new RazorpayGateway());
  }

  /**
   * Create a new payment
   */
  async createPayment(request: PaymentRequest, gateway?: string): Promise<PaymentResponse> {
    const selectedGateway = this.gateways.get(gateway || this.defaultGateway);
    if (!selectedGateway) {
      return {
        success: false,
        error: `Payment gateway '${gateway}' not found`,
      };
    }

    try {
      // Log payment attempt
      console.log(`Creating payment with ${selectedGateway.name}:`, request);
      
      // Create payment with the selected gateway
      const response = await selectedGateway.createPayment(request);
      
      // Store payment details in local storage for demo purposes
      if (response.success) {
        this.storePaymentDetails(request.paymentDetails, response);
      }
      
      return response;
    } catch (error) {
      console.error('Payment creation failed:', error);
      return {
        success: false,
        error: 'Failed to create payment. Please try again.',
      };
    }
  }

  /**
   * Verify a payment
   */
  async verifyPayment(paymentId: string, gateway?: string): Promise<PaymentResponse> {
    const selectedGateway = this.gateways.get(gateway || this.defaultGateway);
    if (!selectedGateway) {
      return {
        success: false,
        error: `Payment gateway '${gateway}' not found`,
      };
    }

    try {
      const response = await selectedGateway.verifyPayment(paymentId);
      
      // Update payment status in local storage
      if (response.success) {
        this.updatePaymentStatus(paymentId, response.status || 'verified');
      }
      
      return response;
    } catch (error) {
      console.error('Payment verification failed:', error);
      return {
        success: false,
        error: 'Failed to verify payment. Please contact support.',
      };
    }
  }

  /**
   * Process a refund
   */
  async refundPayment(paymentId: string, amount?: number, gateway?: string): Promise<PaymentResponse> {
    const selectedGateway = this.gateways.get(gateway || this.defaultGateway);
    if (!selectedGateway) {
      return {
        success: false,
        error: `Payment gateway '${gateway}' not found`,
      };
    }

    try {
      const response = await selectedGateway.refundPayment(paymentId, amount);
      
      // Update payment status in local storage
      if (response.success) {
        this.updatePaymentStatus(paymentId, 'refunded');
      }
      
      return response;
    } catch (error) {
      console.error('Refund processing failed:', error);
      return {
        success: false,
        error: 'Failed to process refund. Please contact support.',
      };
    }
  }

  /**
   * Store payment details in local storage (for demo purposes)
   */
  private storePaymentDetails(details: PaymentDetails, response: PaymentResponse): void {
    const payments = this.getStoredPayments();
    payments[response.paymentId || ''] = {
      details,
      response,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    localStorage.setItem('payments', JSON.stringify(payments));
  }

  /**
   * Update payment status in local storage
   */
  private updatePaymentStatus(paymentId: string, status: string): void {
    const payments = this.getStoredPayments();
    if (payments[paymentId]) {
      payments[paymentId].status = status;
      payments[paymentId].updatedAt = new Date().toISOString();
      localStorage.setItem('payments', JSON.stringify(payments));
    }
  }

  /**
   * Get stored payments from local storage
   */
  private getStoredPayments(): Record<string, any> {
    if (typeof window === 'undefined') return {};
    
    const stored = localStorage.getItem('payments');
    return stored ? JSON.parse(stored) : {};
  }

  /**
   * Get payment history for a user
   */
  getPaymentHistory(userId: string): Array<{
    paymentId: string;
    details: PaymentDetails;
    status: string;
    createdAt: string;
    updatedAt?: string;
  }> {
    const payments = this.getStoredPayments();
    const userPayments = Object.entries(payments)
      .filter(([_, payment]) => payment.details.userId === userId)
      .map(([paymentId, payment]) => ({
        paymentId,
        details: payment.details,
        status: payment.status,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return userPayments;
  }

  /**
   * Get payment details by ID
   */
  getPaymentDetails(paymentId: string): {
    details: PaymentDetails;
    status: string;
    createdAt: string;
    updatedAt?: string;
  } | null {
    const payments = this.getStoredPayments();
    return payments[paymentId] || null;
  }

  /**
   * Set default payment gateway
   */
  setDefaultGateway(gateway: string): void {
    if (this.gateways.has(gateway)) {
      this.defaultGateway = gateway;
    }
  }

  /**
   * Get available payment gateways
   */
  getAvailableGateways(): string[] {
    return Array.from(this.gateways.keys());
  }
}

// Create a singleton instance
export const paymentService = new PaymentService();

// Utility functions for payment processing
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const getPaymentMethodDisplayName = (method: string): string => {
  const methodNames: Record<string, string> = {
    'credit_card': 'Credit Card',
    'debit_card': 'Debit Card',
    'net_banking': 'Net Banking',
    'upi': 'UPI',
    'wallet': 'Wallet',
  };
  return methodNames[method] || method;
};

export const getPaymentStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    'pending': 'text-yellow-600 bg-yellow-100',
    'created': 'text-blue-600 bg-blue-100',
    'authorized': 'text-blue-600 bg-blue-100',
    'captured': 'text-green-600 bg-green-100',
    'refunded': 'text-gray-600 bg-gray-100',
    'failed': 'text-red-600 bg-red-100',
    'verified': 'text-green-600 bg-green-100',
  };
  return statusColors[status] || 'text-gray-600 bg-gray-100';
};