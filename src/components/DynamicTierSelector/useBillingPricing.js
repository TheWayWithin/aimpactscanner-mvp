// useBillingPricing.js - Custom hook for pricing calculations with billing frequency
import { useMemo } from 'react';

const PRICING = {
  free: { monthly: 0, annual: null },
  coffee: { monthly: 5.95, annual: 49.50 },      // Annual = $4.13/mo
  growth: { monthly: 17.95, annual: 149.50 },    // Annual = $12.46/mo
  scale: { monthly: 34.95, annual: 299.50 }      // Annual = $24.96/mo
};

/**
 * Custom hook for calculating tier pricing based on billing frequency
 * @param {string} tier - Tier ID (free, coffee, growth, scale)
 * @param {string} billingFrequency - Billing frequency (annual, monthly)
 * @returns {object} Pricing details for display
 */
export const useBillingPricing = (tier, billingFrequency) => {
  return useMemo(() => {
    const tierPricing = PRICING[tier];

    if (!tierPricing) {
      console.error(`Invalid tier: ${tier}`);
      return null;
    }

    const monthlyPrice = tierPricing.monthly;
    const annualPrice = tierPricing.annual;

    // Calculate annual monthly equivalent (annual / 12)
    const annualMonthlyEquivalent = annualPrice ? parseFloat((annualPrice / 12).toFixed(2)) : null;

    // Calculate savings (monthly * 12 - annual)
    const savings = annualPrice ? parseFloat((monthlyPrice * 12 - annualPrice).toFixed(2)) : null;

    // Determine display values based on billing frequency
    const isAnnual = billingFrequency === 'annual';
    const displayPrice = isAnnual && annualMonthlyEquivalent
      ? `$${annualMonthlyEquivalent.toFixed(2)}/mo`
      : `$${monthlyPrice.toFixed(2)}/mo`;

    const displayBilling = isAnnual && annualPrice
      ? `billed $${annualPrice.toFixed(2)} annually`
      : 'billed monthly';

    const displaySavings = isAnnual && savings
      ? `Save $${savings.toFixed(2)}/year`
      : null;

    return {
      monthlyPrice,
      annualPrice,
      annualMonthlyEquivalent,
      savings,
      displayPrice,
      displayBilling,
      displaySavings,
      isAnnual
    };
  }, [tier, billingFrequency]);
};
