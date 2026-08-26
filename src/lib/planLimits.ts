import { PlanType, Subscription } from '../types';

export const PRO_PRICE = 9.99;
export const ENTERPRISE_PRICE = 15.99;
export const TRIAL_DURATION_DAYS = 7;

export interface PlanFeatureConfig {
  name: string;
  price: number;
  maxInvoicesPerMonth: number; // -1 for unlimited
  maxClients: number; // -1 for unlimited
  maxAiGenerationsPerMonth: number; // -1 for unlimited
  maxRecurringInvoices: number; // -1 for unlimited
  maxProducts: number; // -1 for unlimited
  maxExpenses: number; // -1 for unlimited
  allowCustomLogo: boolean;
  allowAutomatedReminders: boolean;
  allowFinancialAnalysis: boolean;
  allowProfitAndLoss: boolean;
}

export const PLAN_CONFIGS: Record<PlanType, PlanFeatureConfig> = {
  free: {
    name: 'Starter Free',
    price: 0,
    maxInvoicesPerMonth: 5,
    maxClients: 3,
    maxAiGenerationsPerMonth: 5,
    maxRecurringInvoices: 1,
    maxProducts: 5,
    maxExpenses: 15,
    allowCustomLogo: false,
    allowAutomatedReminders: false,
    allowFinancialAnalysis: false,
    allowProfitAndLoss: false,
  },
  pro: {
    name: 'Pro',
    price: PRO_PRICE,
    maxInvoicesPerMonth: 100,
    maxClients: 100,
    maxAiGenerationsPerMonth: 50,
    maxRecurringInvoices: 50,
    maxProducts: 1000,
    maxExpenses: 5000,
    allowCustomLogo: true,
    allowAutomatedReminders: true,
    allowFinancialAnalysis: false,
    allowProfitAndLoss: false,
  },
  enterprise: {
    name: 'Enterprise',
    price: ENTERPRISE_PRICE,
    maxInvoicesPerMonth: -1, // Unlimited
    maxClients: -1, // Unlimited
    maxAiGenerationsPerMonth: -1, // Unlimited
    maxRecurringInvoices: -1, // Unlimited
    maxProducts: -1, // Unlimited
    maxExpenses: -1, // Unlimited
    allowCustomLogo: true,
    allowAutomatedReminders: true,
    allowFinancialAnalysis: true,
    allowProfitAndLoss: true,
  },
};

/**
 * Checks if the user's trial is currently active and not expired.
 */
export function isTrialActive(subscription?: Subscription | null): boolean {
  if (!subscription) return false;
  if (subscription.status !== 'trialing') return false;
  if (!subscription.trial_ends_at) return false;
  return new Date(subscription.trial_ends_at).getTime() > Date.now();
}

/**
 * Calculates how many days remain in an active trial.
 */
export function getTrialDaysRemaining(subscription?: Subscription | null): number {
  if (!isTrialActive(subscription) || !subscription?.trial_ends_at) return 0;
  const diffMs = new Date(subscription.trial_ends_at).getTime() - Date.now();
  return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Returns the effective plan tier taking into account active subscriptions and active trials.
 * When a user is on an active Pro trial, their effective plan is 'pro'.
 * When a user is on an active Enterprise trial, their effective plan is 'enterprise'.
 * When a trial is expired and the subscription is not active, it falls back to 'free'.
 */
export function getEffectivePlan(subscription?: Subscription | null): PlanType {
  if (!subscription) return 'free';

  // Active paid subscription
  if (subscription.status === 'active') {
    return subscription.plan || 'free';
  }

  // Active trial
  if (isTrialActive(subscription)) {
    return subscription.plan || 'pro';
  }

  // Trial expired or canceled
  return 'free';
}

/**
 * Check if a specific Boolean feature is enabled on the user's effective plan.
 */
export function canUseFeature(
  subscription: Subscription | null | undefined,
  feature: 'custom_logo' | 'reminders' | 'financial_analysis' | 'profit_and_loss'
): boolean {
  const plan = getEffectivePlan(subscription);
  const config = PLAN_CONFIGS[plan];

  switch (feature) {
    case 'custom_logo':
      return config.allowCustomLogo;
    case 'reminders':
      return config.allowAutomatedReminders;
    case 'financial_analysis':
      return config.allowFinancialAnalysis;
    case 'profit_and_loss':
      return config.allowProfitAndLoss;
    default:
      return false;
  }
}

/**
 * Invoice creation quota check
 */
export function canCreateInvoice(
  subscription: Subscription | null | undefined,
  currentCount: number
): { allowed: boolean; max: number; message?: string } {
  const plan = getEffectivePlan(subscription);
  const max = PLAN_CONFIGS[plan].maxInvoicesPerMonth;

  if (max === -1) {
    return { allowed: true, max: -1 };
  }

  if (currentCount >= max) {
    const upgradeTarget = plan === 'free' ? 'Pro or Enterprise' : 'Enterprise for unlimited invoices';
    return {
      allowed: false,
      max,
      message: `You've reached your ${PLAN_CONFIGS[plan].name} limit of ${max} invoices this month. Upgrade to ${upgradeTarget}.`,
    };
  }

  return { allowed: true, max };
}

/**
 * Client creation quota check
 */
export function canCreateClient(
  subscription: Subscription | null | undefined,
  currentCount: number
): { allowed: boolean; max: number; message?: string } {
  const plan = getEffectivePlan(subscription);
  const max = PLAN_CONFIGS[plan].maxClients;

  if (max === -1) {
    return { allowed: true, max: -1 };
  }

  if (currentCount >= max) {
    const upgradeTarget = plan === 'free' ? 'Pro or Enterprise' : 'Enterprise for unlimited clients';
    return {
      allowed: false,
      max,
      message: `You've reached the ${PLAN_CONFIGS[plan].name} limit of ${max} clients. Upgrade to ${upgradeTarget}.`,
    };
  }

  return { allowed: true, max };
}

/**
 * AI invoice generation quota check
 */
export function canGenerateAiInvoice(
  subscription: Subscription | null | undefined,
  currentCount: number
): { allowed: boolean; max: number; message?: string } {
  const plan = getEffectivePlan(subscription);
  const max = PLAN_CONFIGS[plan].maxAiGenerationsPerMonth;

  if (max === -1) {
    return { allowed: true, max: -1 };
  }

  if (currentCount >= max) {
    const upgradeTarget = plan === 'free' ? 'Pro or Enterprise' : 'Enterprise for unlimited AI generations';
    return {
      allowed: false,
      max,
      message: `You've reached the ${PLAN_CONFIGS[plan].name} limit of ${max} AI generations this month. Upgrade to ${upgradeTarget}.`,
    };
  }

  return { allowed: true, max };
}

/**
 * Recurring invoice creation quota check
 */
export function canCreateRecurringInvoice(
  subscription: Subscription | null | undefined,
  currentCount: number
): { allowed: boolean; max: number; message?: string } {
  const plan = getEffectivePlan(subscription);
  const max = PLAN_CONFIGS[plan].maxRecurringInvoices;

  if (max === -1) {
    return { allowed: true, max: -1 };
  }

  if (currentCount >= max) {
    const upgradeTarget = plan === 'free' ? 'Pro or Enterprise' : 'Enterprise for unlimited recurring invoices';
    return {
      allowed: false,
      max,
      message: `You've reached the ${PLAN_CONFIGS[plan].name} limit of ${max} recurring invoices. Upgrade to ${upgradeTarget}.`,
    };
  }

  return { allowed: true, max };
}

/**
 * Product catalog quota check
 */
export function canCreateProduct(
  subscription: Subscription | null | undefined,
  currentCount: number
): { allowed: boolean; max: number; message?: string } {
  const plan = getEffectivePlan(subscription);
  const max = PLAN_CONFIGS[plan].maxProducts;

  if (max === -1) {
    return { allowed: true, max: -1 };
  }

  if (currentCount >= max) {
    return {
      allowed: false,
      max,
      message: `You've reached the ${PLAN_CONFIGS[plan].name} limit of ${max} products/services. Upgrade to Enterprise!`,
    };
  }

  return { allowed: true, max };
}

/**
 * Expense log quota check
 */
export function canCreateExpense(
  subscription: Subscription | null | undefined,
  currentCount: number
): { allowed: boolean; max: number; message?: string } {
  const plan = getEffectivePlan(subscription);
  const max = PLAN_CONFIGS[plan].maxExpenses;

  if (max === -1) {
    return { allowed: true, max: -1 };
  }

  if (currentCount >= max) {
    return {
      allowed: false,
      max,
      message: `You've reached the ${PLAN_CONFIGS[plan].name} limit of ${max} expenses. Upgrade to Enterprise!`,
    };
  }

  return { allowed: true, max };
}
