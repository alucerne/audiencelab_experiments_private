'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@kit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@kit/ui/form';
import { Input } from '@kit/ui/input';
import { Loader2, Shield, CreditCard } from 'lucide-react';

// Step 1: Account Setup Schema
const AccountSetupSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Step 2: Payment Schema
const PaymentSchema = z.object({
  // Stripe will handle the payment details
});

type AccountSetupData = z.infer<typeof AccountSetupSchema>;
type PaymentData = z.infer<typeof PaymentSchema>;

export default function MagicSignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [accountData, setAccountData] = useState<AccountSetupData | null>(null);
  
  // Get URL parameters
  const agencyId = searchParams.get('agency_id');
  const amountCents = searchParams.get('amount_cents');
  const planId = searchParams.get('plan_id');
  
  // Convert amount_cents to dollars for display
  const amountDollars = amountCents ? (parseInt(amountCents) / 100).toFixed(2) : '0.00';
  
  const accountForm = useForm<AccountSetupData>({
    resolver: zodResolver(AccountSetupSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const paymentForm = useForm<PaymentData>({
    resolver: zodResolver(PaymentSchema),
  });

  // Validate URL parameters
  useEffect(() => {
    if (!agencyId || !amountCents || !planId) {
      toast.error('Invalid signup link. Please contact your agency for a valid link.');
      router.push('/auth/sign-in');
    }
  }, [agencyId, amountCents, planId, router]);

  const handleAccountSetup = async (data: AccountSetupData) => {
    setIsLoading(true);
    
    try {
      // Create the user account
      const response = await fetch('/api/magic-signup/create-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          agencyId,
          planId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create account');
      }

      const result = await response.json();
      
      // Store account data for payment step
      setAccountData(data);
      
      // Move to payment step
      setCurrentStep(2);
      toast.success('Account created successfully! Please add your payment method.');
      
    } catch (error) {
      console.error('Account creation error:', error);
      toast.error('Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async (data: PaymentData) => {
    setIsLoading(true);
    
    try {
      // Create Stripe checkout session
      const response = await fetch('/api/magic-signup/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amountCents: parseInt(amountCents!),
          agencyId,
          planId,
          accountData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment session');
      }

      const { checkoutToken } = await response.json();
      
      // Redirect to Stripe checkout
      // This will be handled by the Stripe embedded checkout component
      window.location.href = `/signup-magic/payment?checkout_token=${checkoutToken}`;
      
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to process payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!agencyId || !amountCents || !planId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {currentStep === 1 ? 'Create Your Account' : 'Complete Payment'}
          </CardTitle>
          <p className="text-muted-foreground">
            {currentStep === 1 
              ? 'Set up your account to get started' 
              : `Total due today: $${amountDollars}`
            }
          </p>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-gray-200 text-gray-500'
              }`}>
                1
              </div>
              <div className="w-8 h-1 bg-gray-200"></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-gray-200 text-gray-500'
              }`}>
                2
              </div>
            </div>
          </div>

          {/* Step 1: Account Setup */}
          {currentStep === 1 && (
            <Form {...accountForm}>
              <form onSubmit={accountForm.handleSubmit(handleAccountSetup)} className="space-y-4">
                <FormField
                  control={accountForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="Enter your email"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={accountForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Create a password"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </form>
            </Form>
          )}

          {/* Step 2: Payment */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">Secure Checkout</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your payment information is encrypted and secure.
                </p>
              </div>
              
              <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total Due Today:</span>
                  <span className="text-2xl font-bold text-primary">${amountDollars}</span>
                </div>
              </div>
              
              <Form {...paymentForm}>
                <form onSubmit={paymentForm.handleSubmit(handlePayment)} className="space-y-4">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <CreditCard className="h-4 w-4" />
                    <span>Payment will be processed securely via Stripe</span>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing Payment...
                      </>
                    ) : (
                      'Pay & Complete Setup'
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 