'use client';

import React, { useState, useEffect } from 'react';
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

import { purchaseCreditsAction } from '../_actions/purchase-credits';

interface CreditPricing {
  audience: number;
  enrichment: number;
  pixel: number;
  custom_model: number;
}

interface AddCreditsPanelProps {
  clientId: string;
  agencyId: string;
}

export default function AddCreditsPanel({ clientId, agencyId }: AddCreditsPanelProps) {
  const [pricing, setPricing] = useState<CreditPricing>({
    audience: 0,
    enrichment: 0,
    pixel: 0,
    custom_model: 0,
  });
  const [quantities, setQuantities] = useState({
    audience: 0,
    enrichment: 0,
    pixel: 0,
    custom_model: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPricing, setIsLoadingPricing] = useState(true);

  // Load pricing from agency
  useEffect(() => {
    loadAgencyPricing();
  }, [agencyId]);

  const loadAgencyPricing = async () => {
    try {
      // Fetch real pricing from agency_credit_pricing table
      const response = await fetch(`/api/agency-pricing?agencyId=${agencyId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch pricing');
      }
      
      const pricingData = await response.json();
      setPricing(pricingData);
    } catch (error) {
      console.error('Failed to load pricing:', error);
      toast.error('Failed to load credit pricing');
      
      // Fallback to default pricing if API fails
      const defaultPricing = {
        audience: 2500, // $25.00 per credit
        enrichment: 1500, // $15.00 per credit
        pixel: 1000, // $10.00 per credit
        custom_model: 5000, // $50.00 per credit
      };
      setPricing(defaultPricing);
    } finally {
      setIsLoadingPricing(false);
    }
  };

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
    try {
      // Create purchase records for each credit type with quantity > 0
      const purchases = Object.entries(quantities)
        .filter(([_, qty]) => qty > 0)
        .map(([creditType, qty]) => ({
          creditType: creditType as keyof CreditPricing,
          credits: qty,
          pricePerCreditCents: pricing[creditType as keyof CreditPricing],
          costPerCreditCents: pricing[creditType as keyof CreditPricing], // Assuming cost = price for now
        }));

      const result = await purchaseCreditsAction({
        clientId,
        agencyId,
        purchases,
      });

      toast.success(result.message);

      // Reset form
      setQuantities({
        audience: 0,
        enrichment: 0,
        pixel: 0,
        custom_model: 0,
      });

    } catch (error) {
      console.error('Purchase failed:', error);
      toast.error('Failed to process your credit purchase. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (isLoadingPricing) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2 text-muted-foreground">Loading pricing...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
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
  );
} 