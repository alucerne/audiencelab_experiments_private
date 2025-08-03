'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, ArrowRight } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';

export default function MagicSignupSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [sessionData, setSessionData] = useState<any>(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      // Verify the payment session
      verifyPaymentSession(sessionId);
    } else {
      setIsLoading(false);
    }
  }, [sessionId]);

  const verifyPaymentSession = async (sessionId: string) => {
    try {
      const response = await fetch('/api/magic-signup/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      if (response.ok) {
        const data = await response.json();
        setSessionData(data);
      } else {
        console.error('Failed to verify payment session');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    // Redirect to the client dashboard
    router.push('/home');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Verifying your payment...</p>
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
          <div className="mx-auto mb-4">
            <CheckCircle className="h-16 w-16 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-600">
            Welcome to AudienceLab!
          </CardTitle>
          <p className="text-muted-foreground">
            Your account has been created and payment processed successfully.
          </p>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <h3 className="font-medium text-green-800 mb-2">Setup Complete</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>✅ Account created successfully</li>
                <li>✅ Payment processed</li>
                <li>✅ Card saved for future billing</li>
                <li>✅ Plan activated</li>
              </ul>
            </div>

            {sessionData && (
              <div className="bg-muted rounded-lg p-4">
                <h4 className="font-medium mb-2">Payment Details</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Amount: ${(sessionData.amount / 100).toFixed(2)}</div>
                  <div>Transaction ID: {sessionData.payment_intent}</div>
                  <div>Date: {new Date(sessionData.created * 1000).toLocaleDateString()}</div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2">Next Steps</h4>
              <p className="text-sm text-blue-700">
                You can now access your dashboard and start using AudienceLab. 
                Your monthly billing will be processed automatically.
              </p>
            </div>

            <Button 
              onClick={handleContinue}
              className="w-full"
              size="lg"
            >
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 