export type PlanType = 'free' | 'pro' | 'enterprise';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export type InvoiceTemplateId = 'modern' | 'professional' | 'minimal' | 'corporate';

export interface InvoiceTemplateOption {
  id: InvoiceTemplateId;
  name: string;
  description: string;
  accent: string;
}

export const INVOICE_TEMPLATES: InvoiceTemplateOption[] = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Indigo gradient banner with clean, high-contrast modern typography.',
    accent: '#6366f1',
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Deep navy header bar with structured borders and corporate layout.',
    accent: '#1e293b',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean monochrome styling with generous whitespace and understated elegance.',
    accent: '#0f172a',
  },
  {
    id: 'corporate',
    name: 'Corporate',
    description: 'Emerald and slate headers with formal company ledger styling.',
    accent: '#059669',
  },
];

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: 'owner' | 'member';
  created_at: string;
}

export interface Business {
  id: string;
  user_id: string;
  name: string;
  logo_url?: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  tax_id?: string; // VAT or EIN
  default_currency: string;
  invoice_prefix: string;
  next_invoice_number: number;
  payment_terms: string;
  bank_details?: string;
  created_at?: string;
}

export interface Client {
  id: string;
  user_id: string;
  business_id?: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  tax_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  product_id?: string;
  unit?: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  business_id?: string;
  client_id: string;
  client?: Client;
  number: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  currency: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount: number;
  total: number;
  notes?: string;
  terms?: string;
  template?: InvoiceTemplateId;
  sent_at?: string;
  paid_at?: string;
  pdf_url?: string;
  created_at: string;
  items: InvoiceItem[];
}

export type PaymentMethodType = 'Paystack' | 'Bank Transfer' | 'Cash' | 'Card' | 'Other';

export interface Receipt {
  id: string;
  user_id: string;
  business_id?: string;
  client_id: string;
  client?: Client;
  invoice_id: string;
  invoice?: Invoice;
  invoice_number: string;
  payment_id?: string;
  receipt_number: string;
  amount: number;
  currency: string;
  payment_date: string;
  payment_method: PaymentMethodType | string;
  notes?: string;
  status: 'paid' | 'settled';
  items?: InvoiceItem[];
  created_at: string;
}

export type ProductType = 'product' | 'service';

export interface Product {
  id: string;
  user_id: string;
  business_id?: string;
  name: string;
  description?: string;
  type: ProductType;
  category?: string;
  sku?: string;
  unit: string;
  unit_price: number;
  tax_rate: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export type ExpenseCategory =
  | 'Advertising'
  | 'Software'
  | 'Equipment'
  | 'Transport'
  | 'Office'
  | 'Salaries'
  | 'Utilities'
  | 'Taxes'
  | 'Other';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Advertising',
  'Software',
  'Equipment',
  'Transport',
  'Office',
  'Salaries',
  'Utilities',
  'Taxes',
  'Other',
];

export interface Expense {
  id: string;
  user_id: string;
  business_id?: string;
  description: string;
  amount: number;
  currency: string;
  category: ExpenseCategory | string;
  date: string;
  vendor?: string;
  payment_method?: PaymentMethodType | string;
  notes?: string;
  receipt_url?: string;
  created_at: string;
  updated_at?: string;
}

export type RecurringFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface RecurringInvoice {
  id: string;
  user_id: string;
  business_id?: string;
  client_id: string;
  client?: Client;
  frequency: RecurringFrequency;
  start_date: string;
  end_date?: string;
  next_invoice_date: string;
  last_generated_date?: string;
  status: 'active' | 'paused' | 'cancelled' | 'completed';
  currency: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount: number;
  total: number;
  notes?: string;
  terms?: string;
  template?: InvoiceTemplateId;
  send_email_on_creation?: boolean;
  items: InvoiceItem[];
  created_at: string;
  updated_at?: string;
}

export interface ReminderSettings {
  id: string;
  user_id: string;
  enabled: boolean;
  first_reminder_days: number;
  second_reminder_days: number;
  final_reminder_days: number;
  max_reminders: number;
  custom_message?: string;
  created_at: string;
  updated_at?: string;
}

export interface ReminderLog {
  id: string;
  user_id: string;
  invoice_id: string;
  client_id?: string;
  reminder_stage: 'first' | 'second' | 'final' | 'manual';
  days_overdue: number;
  recipient_email: string;
  status: 'sent' | 'failed';
  error_message?: string;
  sent_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: PlanType;
  status: 'active' | 'past_due' | 'canceled';
  paystack_customer_code?: string;
  paystack_subscription_code?: string;
  paystack_email_token?: string;
  current_period_end?: string;
  created_at: string;
  updated_at?: string;
}

export interface Payment {
  id: string;
  user_id: string;
  invoice_id?: string;
  invoice_number?: string;
  paystack_reference: string;
  amount: number;
  currency: string;
  status: 'success' | 'failed' | 'pending';
  channel?: string;
  paid_at: string;
  created_at: string;
}

export interface Usage {
  id: string;
  user_id: string;
  invoice_count_month: number;
  ai_generations_month: number;
  last_reset_month: string;
}

export interface Activity {
  id: string;
  user_id: string;
  type:
    | 'invoice_created'
    | 'invoice_updated'
    | 'invoice_deleted'
    | 'invoice_paid'
    | 'receipt_created'
    | 'receipt_downloaded'
    | 'receipt_emailed'
    | 'product_created'
    | 'product_updated'
    | 'product_deleted'
    | 'expense_created'
    | 'expense_updated'
    | 'expense_deleted'
    | 'recurring_created'
    | 'recurring_updated'
    | 'recurring_generated'
    | 'reminder_sent'
    | 'client_added'
    | 'client_updated'
    | 'client_deleted'
    | 'subscription_upgraded'
    | 'email_sent'
    | 'pdf_downloaded'
    | 'business_updated'
    | string;
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
];

export interface PlanLimits {
  maxInvoicesPerMonth: number;
  maxClients: number;
  maxAiGenerations: number;
  maxProducts: number;
  maxExpenses: number;
  maxRecurringInvoices: number;
  allowCustomLogo: boolean;
  allowPdfDownload: boolean;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    maxInvoicesPerMonth: 5,
    maxClients: 3,
    maxAiGenerations: 5,
    maxProducts: 5,
    maxExpenses: 15,
    maxRecurringInvoices: 1,
    allowCustomLogo: false,
    allowPdfDownload: true,
  },
  pro: {
    maxInvoicesPerMonth: 1000,
    maxClients: 1000,
    maxAiGenerations: 200,
    maxProducts: 1000,
    maxExpenses: 5000,
    maxRecurringInvoices: 100,
    allowCustomLogo: true,
    allowPdfDownload: true,
  },
  enterprise: {
    maxInvoicesPerMonth: 999999,
    maxClients: 999999,
    maxAiGenerations: 999999,
    maxProducts: 999999,
    maxExpenses: 999999,
    maxRecurringInvoices: 999999,
    allowCustomLogo: true,
    allowPdfDownload: true,
  },
};
