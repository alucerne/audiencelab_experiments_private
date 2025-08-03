'use client';

import React, { useState } from 'react';
import { Plus, ShoppingCart, DollarSign } from 'lucide-react';

import { Button } from '@kit/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';
import { Input } from '@kit/ui/input';
import { toast } from '@kit/ui/sonner';

interface CreditPricing {
  audience: number;
  enrichment: number;
  pixel: number;
  custom_model: number;
}

export default function TestCreditsPage() {
  const [pricing, setPricing] = useState<CreditPricing>({
    audience: 2500, // $25.00 per credit
    enrichment: 1500, // $15.00 per credit
    pixel: 1000, // $10.00 per credit
    custom_model: 5000, // $50.00 per credit
  });
  const [quantities, setQuantities] = useState({
    audience: 0,
    enrichment: 0,
    pixel: 0,
    custom_model: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  const updateQuantity = (creditType: keyof typeof quantities, value: number) => {
    setQuantities(prev => ({
      ...prev,
      [creditType]: Math.max(0, value),
    }));
  };

  const calculateSubtotal = (creditType: keyof typeof quantities) => {
    return quantities[creditType] * pricing[creditType];
  };

  const calculateGrandTotal = () => {
    return Object.keys(quantities).reduce((total, creditType) => {
      return total + calculateSubtotal(creditType as keyof typeof quantities);
    }, 0);
  };

  const hasAnyQuantity = () => {
    return Object.values(quantities).some(qty => qty > 0);
  };

  const handlePurchase = async () => {
    if (!hasAnyQuantity()) {
      toast.error('Please select at least one credit type to purchase');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const purchases = Object.entries(quantities)
        .filter(([_, qty]) => qty > 0)
        .map(([creditType, qty]) => ({
          creditType,
          credits: qty,
          pricePerCreditCents: pricing[creditType as keyof CreditPricing],
        }));

      console.log('Credit purchase:', {
        purchases,
        totalCredits: purchases.reduce((sum, p) => sum + p.credits, 0),
        totalCost: purchases.reduce((sum, p) => sum + (p.credits * p.pricePerCreditCents), 0),
      });

      toast.success(`Successfully added ${purchases.reduce((sum, p) => sum + p.credits, 0)} credits to your account.`);

      // Reset form
      setQuantities({
        audience: 0,
        enrichment: 0,
        pixel: 0,
        custom_model: 0,
      });

      setIsLoading(false);
    }, 1000);
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Test: Client Self-Serve Overage Credit Purchase
          </h1>
          <p className="text-gray-600">
            This is a standalone test page for the credits purchase feature. No authentication required.
          </p>
        </div>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                <span>Buy Additional Credits</span>
              </div>
            </CardTitle>
            <CardDescription>
              Purchase additional credits to use immediately. You'll be charged at the end of your billing cycle.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Credit Types Table */}
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4 text-sm font-medium text-muted-foreground">
                  <div>Credit Type</div>
                  <div>Price per Credit</div>
                  <div>Quantity</div>
                  <div>Subtotal</div>
                </div>

                {/* Audience Credits */}
                <div className="grid grid-cols-4 gap-4 items-center">
                  <div className="font-medium">Audience</div>
                  <div>{formatPrice(pricing.audience)}</div>
                  <div>
                    <Input
                      type="number"
                      min="0"
                      value={quantities.audience}
                      onChange={(e) => updateQuantity('audience', parseInt(e.target.value) || 0)}
                      className="w-20"
                    />
                  </div>
                  <div className="font-medium">{formatPrice(calculateSubtotal('audience'))}</div>
                </div>

                {/* Enrichment Credits */}
                <div className="grid grid-cols-4 gap-4 items-center">
                  <div className="font-medium">Enrichment</div>
                  <div>{formatPrice(pricing.enrichment)}</div>
                  <div>
                    <Input
                      type="number"
                      min="0"
                      value={quantities.enrichment}
                      onChange={(e) => updateQuantity('enrichment', parseInt(e.target.value) || 0)}
                      className="w-20"
                    />
                  </div>
                  <div className="font-medium">{formatPrice(calculateSubtotal('enrichment'))}</div>
                </div>

                {/* Pixel Credits */}
                <div className="grid grid-cols-4 gap-4 items-center">
                  <div className="font-medium">Pixel</div>
                  <div>{formatPrice(pricing.pixel)}</div>
                  <div>
                    <Input
                      type="number"
                      min="0"
                      value={quantities.pixel}
                      onChange={(e) => updateQuantity('pixel', parseInt(e.target.value) || 0)}
                      className="w-20"
                    />
                  </div>
                  <div className="font-medium">{formatPrice(calculateSubtotal('pixel'))}</div>
                </div>

                {/* Custom Model Credits */}
                <div className="grid grid-cols-4 gap-4 items-center">
                  <div className="font-medium">Custom Model</div>
                  <div>{formatPrice(pricing.custom_model)}</div>
                  <div>
                    <Input
                      type="number"
                      min="0"
                      value={quantities.custom_model}
                      onChange={(e) => updateQuantity('custom_model', parseInt(e.target.value) || 0)}
                      className="w-20"
                    />
                  </div>
                  <div className="font-medium">{formatPrice(calculateSubtotal('custom_model'))}</div>
                </div>
              </div>

              {/* Grand Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <div className="text-lg font-semibold">Grand Total</div>
                  <div className="text-lg font-semibold text-primary">
                    {formatPrice(calculateGrandTotal())}
                  </div>
                </div>
              </div>

              {/* Purchase Button */}
              <div className="flex justify-end">
                <Button
                  onClick={handlePurchase}
                  disabled={!hasAnyQuantity() || isLoading}
                  size="lg"
                  className="min-w-[200px]"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Confirm Purchase (Pay Later)
                    </>
                  )}
                </Button>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-start gap-2">
                  <DollarSign className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">How it works:</p>
                    <ul className="space-y-1">
                      <li>• Credits are added to your account immediately</li>
                      <li>• You'll be charged at the end of your billing cycle</li>
                      <li>• No upfront payment required</li>
                      <li>• Credits never expire</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 