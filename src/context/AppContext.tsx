import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import {
  Business,
  Client,
  Invoice,
  Subscription,
  Payment,
  Usage,
  Activity,
  PlanType,
  PLAN_LIMITS,
  Receipt,
  Product,
  Expense,
  RecurringInvoice,
  ReminderSettings,
  ReminderLog,
  PRO_MONTHLY,
  ENTERPRISE_MONTHLY,
  TRIAL_DAYS,
} from '../types';
import { defaultEmailService } from '../services/emailService';

export type NavigationPage =
  | 'dashboard'
  | 'invoices'
  | 'invoice_detail'
  | 'receipts'
  | 'products'
  | 'expenses'
  | 'recurring_invoices'
  | 'clients'
  | 'ai_assistant'
  | 'activities'
  | 'analytics'
  | 'billing'
  | 'settings'
  | 'onboarding';

interface ToastState {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppContextType {
  activePage: NavigationPage;
  setActivePage: (page: NavigationPage) => void;
  selectedInvoiceId: string | null;
  setSelectedInvoiceId: (id: string | null) => void;
  editingInvoice: Invoice | null;
  setEditingInvoice: (invoice: Invoice | null) => void;
  business: Business;
  updateBusiness: (updates: Partial<Business>) => Promise<void>;
  clients: Client[];
  addClient: (client: Omit<Client, 'id' | 'user_id' | 'created_at'>) => Promise<Client | null>;
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  invoices: Invoice[];
  createInvoice: (invoiceData: Omit<Invoice, 'id' | 'user_id' | 'created_at'>) => Promise<{ success: boolean; invoice?: Invoice; error?: string }>;
  updateInvoice: (id: string, invoiceData: Partial<Invoice>) => Promise<{ success: boolean; invoice?: Invoice; error?: string }>;
  updateInvoiceStatus: (id: string, status: Invoice['status'], customSentAt?: string) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;

  // Receipts
  receipts: Receipt[];
  selectedReceiptId: string | null;
  setSelectedReceiptId: (id: string | null) => void;
  createReceipt: (receiptData: { invoice_id: string; amount: number; currency?: string; payment_method?: string; notes?: string; payment_date?: string }) => Promise<{ success: boolean; receipt?: Receipt; error?: string }>;
  deleteReceipt: (id: string) => Promise<void>;
  isReceiptModalOpen: boolean;
  setIsReceiptModalOpen: (open: boolean) => void;
  activeReceiptForModal: Receipt | null;
  openReceiptModal: (receipt: Receipt) => void;
  closeReceiptModal: () => void;

  // Products & Services
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Product | null>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  // Expenses
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Expense | null>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  // Recurring Invoices
  recurringInvoices: RecurringInvoice[];
  addRecurringInvoice: (recData: Omit<RecurringInvoice, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<RecurringInvoice | null>;
  updateRecurringInvoice: (id: string, updates: Partial<RecurringInvoice>) => Promise<void>;
  deleteRecurringInvoice: (id: string) => Promise<void>;
  triggerRecurringProcess: () => Promise<{ processed: number; generated: number }>;

  // Reminders
  reminderSettings: ReminderSettings;
  updateReminderSettings: (updates: Partial<ReminderSettings>) => Promise<void>;
  reminderLogs: ReminderLog[];
  sendManualReminder: (invoiceId: string, customMessage?: string) => Promise<{ success: boolean; message?: string }>;
  triggerRemindersProcess: () => Promise<{ processed: number; remindersSent: number }>;
  isReminderSettingsModalOpen: boolean;
  setIsReminderSettingsModalOpen: (open: boolean) => void;
  openReminderSettingsModal: () => void;
  closeReminderSettingsModal: () => void;
  isSendReminderModalOpen: boolean;
  setIsSendReminderModalOpen: (open: boolean) => void;
  activeInvoiceForReminder: Invoice | null;
  openSendReminderModal: (invoice: Invoice) => void;
  closeSendReminderModal: () => void;

  subscription: Subscription;
  upgradeSubscription: (plan: PlanType, paystackRef: string) => Promise<boolean>;
  cancelSubscription: () => Promise<void>;
  startTrial: () => Promise<boolean>;
  payments: Payment[];
  usage: Usage;
  incrementAiUsage: () => Promise<boolean>;
  activities: Activity[];
  logActivity: (type: Activity['type'], description: string, metadata?: any) => Promise<void>;
  toasts: ToastState[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  refreshData: () => Promise<void>;
  isDatabaseMissingTables: boolean;
  isUpgradeModalOpen: boolean;
  setIsUpgradeModalOpen: (open: boolean) => void;
  pendingUpgradePlan: 'pro' | 'enterprise';
  setPendingUpgradePlan: (plan: 'pro' | 'enterprise') => void;
  openUpgradeModal: (plan?: 'pro' | 'enterprise') => void;
  closeUpgradeModal: () => void;
  isSupportModalOpen: boolean;
  setIsSupportModalOpen: (open: boolean) => void;
  supportCategory: 'Bug' | 'Payment problem' | 'Invoice problem' | 'Account problem' | 'Feature request' | 'Other';
  openSupportModal: (category?: 'Bug' | 'Payment problem' | 'Invoice problem' | 'Account problem' | 'Feature request' | 'Other') => void;
  closeSupportModal: () => void;

  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
}

// Demo data - ONLY used when isDemoUser is true
const DEMO_BUSINESS: Business = {
  id: 'biz_demo_01',
  user_id: 'usr_demo_882910',
  name: 'Apex Design & Tech Studio',
  logo_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
  email: 'billing@apexstudio.co',
  phone: '+1 (555) 234-5678',
  address: '742 Evergreen Terrace, Suite 400',
  city: 'San Francisco, CA 94107',
  country: 'United States',
  tax_id: 'US-994821039',
  default_currency: 'USD',
  invoice_prefix: 'INV-',
  next_invoice_number: 1004,
  payment_terms: 'Due within 14 days',
  bank_details: 'Silicon Valley Bank | Routing: 121000358 | Account: 8820491029',
};

const DEMO_CLIENTS: Client[] = [
  {
    id: 'cli_01',
    user_id: 'usr_demo_882910',
    name: 'Sarah Jenkins',
    company: 'Starlight Media UK Ltd',
    email: 'sarah.j@starlightmedia.co.uk',
    phone: '+44 20 7946 0912',
    address: '25 Finsbury Circus',
    city: 'London EC2M 7EE',
    country: 'United Kingdom',
    tax_id: 'GB 123 4567 89',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'cli_02',
    user_id: 'usr_demo_882910',
    name: 'David Chen',
    company: 'Nexus Software Inc',
    email: 'dchen@nexussoft.com',
    phone: '+1 (415) 883-9102',
    address: '100 Montgomery St #2000',
    city: 'San Francisco, CA 94104',
    country: 'United States',
    tax_id: 'US 94-3321902',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'cli_03',
    user_id: 'usr_demo_882910',
    name: 'Tunde Adebayo',
    company: 'Kora Tech Solutions',
    email: 'tunde@koratech.ng',
    phone: '+234 803 123 4567',
    address: '12 Commercial Avenue, Yaba',
    city: 'Lagos',
    country: 'Nigeria',
    tax_id: 'NG-8830192',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

const DEMO_INVOICES: Invoice[] = [
  {
    id: 'inv_01',
    user_id: 'usr_demo_882910',
    client_id: 'cli_01',
    client: DEMO_CLIENTS[0],
    number: 'INV-1001',
    status: 'paid',
    issue_date: new Date(Date.now() - 25 * 86400000).toISOString().split('T')[0],
    due_date: new Date(Date.now() - 11 * 86400000).toISOString().split('T')[0],
    currency: 'USD',
    subtotal: 3500.0,
    tax_rate: 10,
    tax_amount: 350.0,
    discount: 0,
    total: 3850.0,
    notes: 'Website UI/UX Redesign & Figma Design System handover.',
    terms: 'Payment due within 14 days of invoice issue.',
    paid_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    items: [
      { id: 'item_1', description: 'Brand Identity & Figma Design System', quantity: 1, unit_price: 2000, amount: 2000 },
      { id: 'item_2', description: 'Responsive Web Application Frontend UI', quantity: 30, unit_price: 50, amount: 1500 },
    ],
  },
  {
    id: 'inv_02',
    user_id: 'usr_demo_882910',
    client_id: 'cli_02',
    client: DEMO_CLIENTS[1],
    number: 'INV-1002',
    status: 'sent',
    issue_date: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
    due_date: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
    currency: 'USD',
    subtotal: 4800.0,
    tax_rate: 0,
    tax_amount: 0,
    discount: 200,
    total: 4600.0,
    notes: 'Q3 Enterprise Architecture & Cloud Migration Audit.',
    terms: 'Please wire funds to our SVB account referenced above.',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    items: [
      { id: 'item_3', description: 'AWS Infrastructure Security & Compliance Audit', quantity: 1, unit_price: 2800, amount: 2800 },
      { id: 'item_4', description: 'Express API Server Optimization & Load Testing', quantity: 20, unit_price: 100, amount: 2000 },
    ],
  },
  {
    id: 'inv_03',
    user_id: 'usr_demo_882910',
    client_id: 'cli_03',
    client: DEMO_CLIENTS[2],
    number: 'INV-1003',
    status: 'overdue',
    issue_date: new Date(Date.now() - 35 * 86400000).toISOString().split('T')[0],
    due_date: new Date(Date.now() - 15 * 86400000).toISOString().split('T')[0],
    currency: 'USD',
    subtotal: 1200.0,
    tax_rate: 5,
    tax_amount: 60.0,
    discount: 0,
    total: 1260.0,
    notes: 'Custom Payment Gateway Integration & Webhook Handler.',
    terms: 'Overdue invoices incur 1.5% monthly interest fee.',
    created_at: new Date(Date.now() - 35 * 86400000).toISOString(),
    items: [
      { id: 'item_5', description: 'Paystack Payment Gateway Webhook Handler', quantity: 12, unit_price: 100, amount: 1200 },
    ],
  },
];

const DEMO_RECEIPTS: Receipt[] = [
  {
    id: 'rec_01',
    user_id: 'usr_demo_882910',
    client_id: 'cli_01',
    client: DEMO_CLIENTS[0],
    invoice_id: 'inv_01',
    invoice_number: 'INV-1001',
    receipt_number: 'REC-1001',
    amount: 3850.0,
    currency: 'USD',
    payment_date: new Date(Date.now() - 12 * 86400000).toISOString(),
    payment_method: 'Card',
    notes: 'Paid in full via Stripe / Paystack secure checkout.',
    status: 'paid',
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    items: [
      { id: 'item_1', description: 'Brand Identity & Figma Design System', quantity: 1, unit_price: 2000, amount: 2000 },
      { id: 'item_2', description: 'Responsive Web Application Frontend UI', quantity: 30, unit_price: 50, amount: 1500 },
    ],
  },
  {
    id: 'rec_02',
    user_id: 'usr_demo_882910',
    client_id: 'cli_03',
    client: DEMO_CLIENTS[2],
    invoice_id: 'inv_03',
    invoice_number: 'INV-1000',
    receipt_number: 'REC-1000',
    amount: 1500.0,
    currency: 'USD',
    payment_date: new Date(Date.now() - 40 * 86400000).toISOString(),
    payment_method: 'Bank Transfer',
    notes: 'Direct wire settlement received.',
    status: 'paid',
    created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
    items: [
      { id: 'item_prev', description: 'Initial Consultation & Architecture Sprint', quantity: 1, unit_price: 1500, amount: 1500 },
    ],
  },
];

const DEMO_PRODUCTS: Product[] = [
  {
    id: 'prod_01',
    user_id: 'usr_demo_882910',
    name: 'Brand & Identity Design System',
    description: 'Complete UI component library, color tokens, and typography system.',
    type: 'service',
    sku: 'SRV-DSGN-01',
    unit: 'project',
    unit_price: 2000.0,
    tax_rate: 0,
    currency: 'USD',
    is_active: true,
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 'prod_02',
    user_id: 'usr_demo_882910',
    name: 'Full-Stack Web App Engineering',
    description: 'Senior software engineering, API architecture, and database development.',
    type: 'service',
    sku: 'SRV-DEV-02',
    unit: 'hour',
    unit_price: 120.0,
    tax_rate: 0,
    currency: 'USD',
    is_active: true,
    created_at: new Date(Date.now() - 50 * 86400000).toISOString(),
  },
  {
    id: 'prod_03',
    user_id: 'usr_demo_882910',
    name: 'Enterprise Cloud Hosting & SSL Bundle',
    description: 'High-availability container runtime, global CDN, and automated SSL.',
    type: 'product',
    sku: 'PRD-HOST-03',
    unit: 'month',
    unit_price: 350.0,
    tax_rate: 0,
    currency: 'USD',
    is_active: true,
    created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
  {
    id: 'prod_04',
    user_id: 'usr_demo_882910',
    name: 'Security & Penetration Audit Sprint',
    description: 'Comprehensive code vulnerability scanning and compliance report.',
    type: 'service',
    sku: 'SRV-AUDIT-04',
    unit: 'audit',
    unit_price: 1800.0,
    tax_rate: 0,
    currency: 'USD',
    is_active: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
];

const DEMO_EXPENSES: Expense[] = [
  {
    id: 'exp_01',
    user_id: 'usr_demo_882910',
    description: 'Vercel Pro & Cloud Infrastructure Hosting',
    amount: 80.0,
    currency: 'USD',
    category: 'Software',
    date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
    vendor: 'Vercel Inc.',
    payment_method: 'Card',
    notes: 'Serverless functions and CDN edge deployments.',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'exp_02',
    user_id: 'usr_demo_882910',
    description: 'Figma Organization Annual Seats',
    amount: 180.0,
    currency: 'USD',
    category: 'Software',
    date: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0],
    vendor: 'Figma Design',
    payment_method: 'Card',
    notes: 'Team design collaboration software.',
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: 'exp_03',
    user_id: 'usr_demo_882910',
    description: 'Ergonomic Office Setup & 4K Monitor',
    amount: 450.0,
    currency: 'USD',
    category: 'Equipment',
    date: new Date(Date.now() - 22 * 86400000).toISOString().split('T')[0],
    vendor: 'Dell Technologies',
    payment_method: 'Bank Transfer',
    notes: 'Workspace workstation equipment upgrade.',
    created_at: new Date(Date.now() - 22 * 86400000).toISOString(),
  },
  {
    id: 'exp_04',
    user_id: 'usr_demo_882910',
    description: 'Google Workspace & Domain Registrations',
    amount: 42.0,
    currency: 'USD',
    category: 'Utilities',
    date: new Date(Date.now() - 28 * 86400000).toISOString().split('T')[0],
    vendor: 'Google LLC',
    payment_method: 'Card',
    notes: 'Corporate email routing and cloud drive.',
    created_at: new Date(Date.now() - 28 * 86400000).toISOString(),
  },
];

const DEMO_RECURRING_INVOICES: RecurringInvoice[] = [
  {
    id: 'rec_inv_01',
    user_id: 'usr_demo_882910',
    client_id: 'cli_01',
    client: DEMO_CLIENTS[0],
    frequency: 'monthly',
    start_date: new Date(Date.now() - 60 * 86400000).toISOString().split('T')[0],
    next_invoice_date: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    last_generated_date: new Date(Date.now() - 15 * 86400000).toISOString().split('T')[0],
    status: 'active',
    currency: 'USD',
    subtotal: 2000.0,
    tax_rate: 0,
    tax_amount: 0,
    discount: 0,
    total: 2000.0,
    notes: 'Monthly Retainer for ongoing Design System maintenance.',
    terms: 'Payment due on the 1st of each calendar month.',
    template: 'modern',
    send_email_on_creation: true,
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    items: [
      { id: 'rec_item_1', description: 'Design System & UI Component Maintenance Retainer', quantity: 1, unit_price: 2000, amount: 2000 },
    ],
  },
  {
    id: 'rec_inv_02',
    user_id: 'usr_demo_882910',
    client_id: 'cli_03',
    client: DEMO_CLIENTS[2],
    frequency: 'monthly',
    start_date: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
    next_invoice_date: new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0],
    last_generated_date: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
    status: 'active',
    currency: 'USD',
    subtotal: 1200.0,
    tax_rate: 5,
    tax_amount: 60.0,
    discount: 0,
    total: 1260.0,
    notes: 'Monthly Dedicated DevOps and Server Maintenance Retainer.',
    terms: 'Net 14 settlement terms apply.',
    template: 'corporate',
    send_email_on_creation: false,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    items: [
      { id: 'rec_item_2', description: 'Dedicated DevOps & API Gateway Maintenance', quantity: 12, unit_price: 100, amount: 1200 },
    ],
  },
];

const DEMO_REMINDER_SETTINGS: ReminderSettings = {
  id: 'rem_set_demo',
  user_id: 'usr_demo_882910',
  enabled: true,
  first_reminder_days: 1,
  second_reminder_days: 7,
  final_reminder_days: 14,
  max_reminders: 3,
  custom_message: 'Please settle this invoice promptly to maintain uninterrupted access to our services.',
  created_at: new Date().toISOString(),
};

const DEMO_REMINDER_LOGS: ReminderLog[] = [
  {
    id: 'rem_log_01',
    user_id: 'usr_demo_882910',
    invoice_id: 'inv_03',
    client_id: 'cli_03',
    reminder_stage: 'first',
    days_overdue: 15,
    recipient_email: 'tunde@koratech.ng',
    status: 'sent',
    sent_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

const EMPTY_BUSINESS = (userId: string, userName?: string, userEmail?: string): Business => ({
  id: '',
  user_id: userId,
  name: userName ? `${userName}'s Business` : 'My Business',
  email: userEmail || '',
  default_currency: 'USD',
  invoice_prefix: 'INV-',
  next_invoice_number: 1004,
  payment_terms: 'Due on receipt',
});

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isDemoUser } = useAuth();
  const [activePage, setActivePage] = useState<NavigationPage>('dashboard');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const [business, setBusiness] = useState<Business>(() => {
    if (isDemoUser) return DEMO_BUSINESS;
    return EMPTY_BUSINESS(user?.id || '', user?.user_metadata?.full_name, user?.email);
  });

  const [clients, setClients] = useState<Client[]>(() => {
    if (isDemoUser) return DEMO_CLIENTS;
    return [];
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    if (isDemoUser) return DEMO_INVOICES;
    return [];
  });

  // Receipts State
  const [receipts, setReceipts] = useState<Receipt[]>(() => {
    if (isDemoUser) return DEMO_RECEIPTS;
    return [];
  });
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);
  const [activeReceiptForModal, setActiveReceiptForModal] = useState<Receipt | null>(null);

  const openReceiptModal = (receipt: Receipt) => {
    setActiveReceiptForModal(receipt);
    setIsReceiptModalOpen(true);
  };

  const closeReceiptModal = () => {
    setIsReceiptModalOpen(false);
    setActiveReceiptForModal(null);
  };

  // Products State
  const [products, setProducts] = useState<Product[]>(() => {
    if (isDemoUser) return DEMO_PRODUCTS;
    return [];
  });

  // Expenses State
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    if (isDemoUser) return DEMO_EXPENSES;
    return [];
  });

  // Recurring Invoices State
  const [recurringInvoices, setRecurringInvoices] = useState<RecurringInvoice[]>(() => {
    if (isDemoUser) return DEMO_RECURRING_INVOICES;
    return [];
  });

  // Reminders State
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(() => {
    if (isDemoUser) return DEMO_REMINDER_SETTINGS;
    return {
      id: '',
      user_id: user?.id || '',
      enabled: true,
      first_reminder_days: 1,
      second_reminder_days: 7,
      final_reminder_days: 14,
      max_reminders: 3,
      custom_message: 'Please settle this invoice promptly.',
      created_at: new Date().toISOString(),
    };
  });
  const [reminderLogs, setReminderLogs] = useState<ReminderLog[]>(() => {
    if (isDemoUser) return DEMO_REMINDER_LOGS;
    return [];
  });
  const [isReminderSettingsModalOpen, setIsReminderSettingsModalOpen] = useState<boolean>(false);
  const [isSendReminderModalOpen, setIsSendReminderModalOpen] = useState<boolean>(false);
  const [activeInvoiceForReminder, setActiveInvoiceForReminder] = useState<Invoice | null>(null);

  const openReminderSettingsModal = () => setIsReminderSettingsModalOpen(true);
  const closeReminderSettingsModal = () => setIsReminderSettingsModalOpen(false);
  const openSendReminderModal = (invoice: Invoice) => {
    setActiveInvoiceForReminder(invoice);
    setIsSendReminderModalOpen(true);
  };
  const closeSendReminderModal = () => {
    setIsSendReminderModalOpen(false);
    setActiveInvoiceForReminder(null);
  };

  const [subscription, setSubscription] = useState<Subscription>(() => ({
    id: '',
    user_id: user?.id || '',
    plan: 'free',
    status: 'active',
    created_at: new Date().toISOString(),
  }));

  const [payments, setPayments] = useState<Payment[]>(() => {
    if (isDemoUser) {
      return [
        {
          id: 'pay_1001',
          user_id: 'usr_demo_882910',
          invoice_number: 'INV-1001',
          paystack_reference: 'PSTK-REF-992019',
          amount: 3850,
          currency: 'USD',
          status: 'success',
          channel: 'card',
          paid_at: new Date(Date.now() - 12 * 86400000).toISOString(),
          created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
        },
      ];
    }
    return [];
  });

  const [usage, setUsage] = useState<Usage>(() => ({
    id: '',
    user_id: user?.id || '',
    invoice_count_month: 0,
    ai_generations_month: 0,
    last_reset_month: new Date().toISOString().split('T')[0],
  }));

  const [activities, setActivities] = useState<Activity[]>(() => {
    if (isDemoUser) {
      return [
        {
          id: 'act_1',
          user_id: 'usr_demo_882910',
          type: 'invoice_created',
          description: 'Created invoice INV-1002 for Nexus Software Inc ($4,600.00)',
          created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
        },
      ];
    }
    return [];
  });

  const [toasts, setToasts] = useState<ToastState[]>([]);
  const [isDatabaseMissingTables, setIsDatabaseMissingTables] = useState<boolean>(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);
  const [pendingUpgradePlan, setPendingUpgradePlan] = useState<'pro' | 'enterprise'>('pro');
  const [isSupportModalOpen, setIsSupportModalOpen] = useState<boolean>(false);
  const [supportCategory, setSupportCategory] = useState<'Bug' | 'Payment problem' | 'Invoice problem' | 'Account problem' | 'Feature request' | 'Other'>('Bug');

  const openSupportModal = (category: 'Bug' | 'Payment problem' | 'Invoice problem' | 'Account problem' | 'Feature request' | 'Other' = 'Bug') => {
    setSupportCategory(category);
    setIsSupportModalOpen(true);
  };

  const closeSupportModal = () => {
    setIsSupportModalOpen(false);
  };

  const openUpgradeModal = (plan: 'pro' | 'enterprise' = 'pro') => {
    setPendingUpgradePlan(plan);
    try {
      sessionStorage.setItem('invoiceflow_pending_upgrade', plan);
      localStorage.setItem('invoiceflow_pending_upgrade', plan);
    } catch (e) {
      console.warn('Storage notice:', e);
    }
    setIsUpgradeModalOpen(true);
  };

  const closeUpgradeModal = () => {
    setIsUpgradeModalOpen(false);
  };

  // Check for pending upgrade flow when user becomes authenticated
  useEffect(() => {
    if (user && !isDemoUser) {
      try {
        const pendingPlan = sessionStorage.getItem('invoiceflow_pending_upgrade') || localStorage.getItem('invoiceflow_pending_upgrade');
        if (pendingPlan === 'pro' || pendingPlan === 'enterprise') {
          setActivePage('billing');
          setPendingUpgradePlan(pendingPlan as 'pro' | 'enterprise');
        }
      } catch (e) {
        console.warn('Storage notice:', e);
      }
    }
  }, [user, isDemoUser]);

  // Sidebar Collapsed State (Desktop)
  const [isSidebarCollapsed, setIsSidebarCollapsedState] = useState<boolean>(() => {
    try {
      return localStorage.getItem('invoiceflow_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const setIsSidebarCollapsed = (collapsed: boolean) => {
    setIsSidebarCollapsedState(collapsed);
    try {
      localStorage.setItem('invoiceflow_sidebar_collapsed', String(collapsed));
    } catch (e) {
      console.warn('Storage notice:', e);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsedState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('invoiceflow_sidebar_collapsed', String(next));
      } catch (e) {
        console.warn('Storage notice:', e);
      }
      return next;
    });
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Refresh and load user data strictly from Supabase with robust error handling
  const refreshData = useCallback(async () => {
    if (isDemoUser) {
      setBusiness(DEMO_BUSINESS);
      setClients(DEMO_CLIENTS);
      setInvoices(DEMO_INVOICES);
      setReceipts(DEMO_RECEIPTS);
      setProducts(DEMO_PRODUCTS);
      setExpenses(DEMO_EXPENSES);
      setRecurringInvoices(DEMO_RECURRING_INVOICES);
      setReminderSettings(DEMO_REMINDER_SETTINGS);
      setReminderLogs(DEMO_REMINDER_LOGS);
      setPayments([
        {
          id: 'pay_1001',
          user_id: 'usr_demo_882910',
          invoice_number: 'INV-1001',
          paystack_reference: 'PSTK-REF-992019',
          amount: 3850,
          currency: 'USD',
          status: 'success',
          channel: 'card',
          paid_at: new Date(Date.now() - 12 * 86400000).toISOString(),
          created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
        },
      ]);
      setActivities([
        {
          id: 'act_1',
          user_id: 'usr_demo_882910',
          type: 'invoice_created',
          description: 'Created invoice INV-1002 for Nexus Software Inc ($4,600.00)',
          created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
        },
      ]);
      setSubscription({
        id: 'sub_demo_123',
        user_id: 'usr_demo_882910',
        plan: 'free',
        status: 'active',
        created_at: new Date().toISOString(),
      });
      setUsage({
        id: 'usg_demo_123',
        user_id: 'usr_demo_882910',
        invoice_count_month: 3,
        ai_generations_month: 1,
        last_reset_month: new Date().toISOString().split('T')[0],
      });
      return;
    }

    if (!user) {
      // Clear all state when logged out
      setBusiness(EMPTY_BUSINESS(''));
      setClients([]);
      setInvoices([]);
      setReceipts([]);
      setProducts([]);
      setExpenses([]);
      setRecurringInvoices([]);
      setReminderLogs([]);
      setPayments([]);
      setActivities([]);
      setSubscription({ id: '', user_id: '', plan: 'free', status: 'active', created_at: new Date().toISOString() });
      setUsage({ id: '', user_id: '', invoice_count_month: 0, ai_generations_month: 0, last_reset_month: new Date().toISOString().split('T')[0] });
      return;
    }

    setBusiness(EMPTY_BUSINESS(user.id, user.user_metadata?.full_name, user.email));
    setClients([]);
    setInvoices([]);
    setReceipts([]);
    setProducts([]);
    setExpenses([]);
    setRecurringInvoices([]);
    setReminderLogs([]);
    setPayments([]);
    setActivities([]);
    setSubscription({ id: `sub_${user.id}`, user_id: user.id, plan: 'free', status: 'active', created_at: new Date().toISOString() });
    setUsage({ id: `usg_${user.id}`, user_id: user.id, invoice_count_month: 0, ai_generations_month: 0, last_reset_month: new Date().toISOString().split('T')[0] });

    if (isSupabaseConfigured && supabase) {
      // 1. Business Profile
      try {
        const { data: bizData, error: bizErr } = await supabase
          .from('businesses')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!bizErr && bizData) {
          setBusiness(bizData);
        } else if (!bizErr && !bizData) {
          const defaultBiz = {
            user_id: user.id,
            name: user.user_metadata?.full_name ? `${user.user_metadata.full_name}'s Business` : 'My Business',
            email: user.email || '',
            default_currency: 'USD',
            invoice_prefix: 'INV-',
            next_invoice_number: 1001,
            payment_terms: 'Due on receipt',
          };
          try {
            const { data: createdBiz } = await supabase.from('businesses').insert([defaultBiz]).select().maybeSingle();
            if (createdBiz) setBusiness(createdBiz);
          } catch (e) {
            console.warn('Business creation warning:', e);
          }
        }
      } catch (e) {
        console.warn('Error fetching business:', e);
      }

      // 2. Clients
      let fetchedClients: Client[] = [];
      try {
        const { data: clientsData, error: cliErr } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!cliErr && clientsData) {
          fetchedClients = clientsData;
          setClients(fetchedClients);
        }
      } catch (e) {
        console.warn('Error fetching clients:', e);
      }

      // 3. Invoices & Line Items
      let fetchedInvoicesList: Invoice[] = [];
      try {
        const { data: invData, error: invErr } = await supabase
          .from('invoices')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!invErr && invData) {
          const invoiceIds = invData.map((i: any) => i.id);
          let allItems: any[] = [];
          if (invoiceIds.length > 0) {
            try {
              const { data: itemsData } = await supabase
                .from('invoice_items')
                .select('*')
                .in('invoice_id', invoiceIds);
              if (itemsData) allItems = itemsData;
            } catch (itemErr) {
              console.warn('Invoice items fetch notice:', itemErr);
            }
          }

          fetchedInvoicesList = invData.map((inv: any) => ({
            ...inv,
            client: fetchedClients.find((c) => c.id === inv.client_id),
            items: allItems.filter((it) => it.invoice_id === inv.id),
          }));
          setInvoices(fetchedInvoicesList);
        }
      } catch (e) {
        console.warn('Error fetching invoices:', e);
      }

      // 4. Receipts
      try {
        const { data: receiptsData, error: recErr } = await supabase
          .from('receipts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!recErr && receiptsData) {
          const mappedReceipts: Receipt[] = receiptsData.map((r: any) => {
            const matchedInv = fetchedInvoicesList.find((i) => i.id === r.invoice_id);
            const matchedClient = fetchedClients.find((c) => c.id === r.client_id) || matchedInv?.client;
            return {
              ...r,
              client: matchedClient,
              items: matchedInv?.items || [],
            };
          });
          setReceipts(mappedReceipts);
        }
      } catch (e) {
        console.warn('Error fetching receipts:', e);
      }

      // 5. Products & Services Catalog
      try {
        const { data: prodsData, error: prodErr } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!prodErr && prodsData) {
          setProducts(prodsData);
        }
      } catch (e) {
        console.warn('Error fetching products:', e);
      }

      // 6. Expenses
      try {
        const { data: expData, error: expErr } = await supabase
          .from('expenses')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        if (!expErr && expData) {
          setExpenses(expData);
        }
      } catch (e) {
        console.warn('Error fetching expenses:', e);
      }

      // 7. Recurring Invoices
      try {
        const { data: recInvData, error: recInvErr } = await supabase
          .from('recurring_invoices')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!recInvErr && recInvData) {
          const recIds = recInvData.map((r: any) => r.id);
          let allRecItems: any[] = [];
          if (recIds.length > 0) {
            try {
              const { data: recItemsData } = await supabase
                .from('recurring_invoice_items')
                .select('*')
                .in('recurring_invoice_id', recIds);
              if (recItemsData) allRecItems = recItemsData;
            } catch (e) {
              console.warn('Recurring items fetch notice:', e);
            }
          }

          const mappedRecInvoices: RecurringInvoice[] = recInvData.map((r: any) => ({
            ...r,
            client: fetchedClients.find((c) => c.id === r.client_id),
            items: allRecItems.filter((it) => it.recurring_invoice_id === r.id),
          }));
          setRecurringInvoices(mappedRecInvoices);
        }
      } catch (e) {
        console.warn('Error fetching recurring invoices:', e);
      }

      // 8. Reminder Settings & Logs
      try {
        const { data: remSetData, error: remSetErr } = await supabase
          .from('reminder_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!remSetErr && remSetData) {
          setReminderSettings(remSetData);
        } else if (!remSetErr && !remSetData) {
          const defaultRemSet = {
            user_id: user.id,
            enabled: true,
            first_reminder_days: 1,
            second_reminder_days: 7,
            final_reminder_days: 14,
            max_reminders: 3,
            custom_message: 'Please settle this invoice promptly.',
          };
          try {
            const { data: createdRemSet } = await supabase.from('reminder_settings').insert([defaultRemSet]).select().maybeSingle();
            if (createdRemSet) setReminderSettings(createdRemSet);
          } catch (e) {
            console.warn('Reminder settings create notice:', e);
          }
        }

        const { data: remLogsData } = await supabase
          .from('reminder_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('sent_at', { ascending: false });

        if (remLogsData) {
          setReminderLogs(remLogsData);
        }
      } catch (e) {
        console.warn('Error fetching reminder settings & logs:', e);
      }

      // 9. Subscriptions
      try {
        const { data: subData, error: subErr } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!subErr && subData) {
          if (
            subData.status === 'trialing' &&
            subData.trial_ends_at &&
            new Date(subData.trial_ends_at).getTime() <= Date.now()
          ) {
            subData.status = 'trial_expired';
            try {
              await supabase
                .from('subscriptions')
                .update({ status: 'trial_expired' })
                .eq('user_id', user.id);
            } catch (e) {
              console.warn('Sync expired trial notice:', e);
            }
          }
          setSubscription(subData);
        } else if (!subErr && !subData) {
          const trialStart = new Date().toISOString();
          const trialEnd = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();
          const defaultSub = {
            user_id: user.id,
            plan: 'free',
            status: 'trialing',
            trial_started_at: trialStart,
            trial_ends_at: trialEnd,
          };
          try {
            const { data: createdSub } = await supabase.from('subscriptions').insert([defaultSub]).select().maybeSingle();
            if (createdSub) setSubscription(createdSub);
          } catch (e) {
            console.warn('Subscription creation notice:', e);
          }
        }
      } catch (e) {
        console.warn('Error fetching subscription:', e);
      }

      // 10. Usage
      try {
        const { data: usgData, error: usgErr } = await supabase
          .from('usage')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!usgErr && usgData) {
          setUsage(usgData);
        } else if (!usgErr && !usgData) {
          const defaultUsg = {
            user_id: user.id,
            invoice_count_month: 0,
            ai_generations_month: 0,
            last_reset_month: new Date().toISOString().split('T')[0],
          };
          try {
            const { data: createdUsg } = await supabase.from('usage').insert([defaultUsg]).select().maybeSingle();
            if (createdUsg) setUsage(createdUsg);
          } catch (e) {
            console.warn('Usage creation notice:', e);
          }
        }
      } catch (e) {
        console.warn('Error fetching usage:', e);
      }

      // 11. Payments
      try {
        const { data: paymentsData, error: payErr } = await supabase
          .from('payments')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!payErr && paymentsData) {
          setPayments(paymentsData);
        }
      } catch (e) {
        console.warn('Error fetching payments:', e);
      }

      // 12. Activities (checking activities and activity_logs)
      try {
        let actData: any[] | null = null;
        const { data: directActData, error: actErr } = await supabase
          .from('activities')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (!actErr && directActData) {
          actData = directActData;
        } else {
          const { data: altActData } = await supabase
            .from('activity_logs')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          if (altActData) actData = altActData;
        }

        if (actData) {
          setActivities(actData);
        }
      } catch (e) {
        console.warn('Error fetching activities:', e);
      }

      setIsDatabaseMissingTables(false);
    }
  }, [user, isDemoUser]);

  // Load data whenever user or demo status changes
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const logActivity = async (type: Activity['type'], description: string, metadata?: any) => {
    const newAct: Activity = {
      id: `act_${Date.now()}`,
      user_id: user?.id || (isDemoUser ? 'usr_demo_882910' : ''),
      type,
      description,
      metadata,
      created_at: new Date().toISOString(),
    };

    setActivities((prev) => [newAct, ...prev]);

    if (isSupabaseConfigured && supabase && user && !isDemoUser) {
      try {
        const { error: actError } = await supabase.from('activities').insert([{
          user_id: user.id,
          type,
          description,
          metadata,
        }]);

        if (actError) {
          // If activities table name differs, write to activity_logs
          await supabase.from('activity_logs').insert([{
            user_id: user.id,
            type,
            description,
            metadata,
          }]);
        }
      } catch (e) {
        console.warn('Log activity error notice:', e);
      }
    }
  };

  const updateBusiness = async (updates: Partial<Business>) => {
    const updated = { ...business, ...updates };

    if (isSupabaseConfigured && supabase && user && !isDemoUser) {
      try {
        const { id, ...bizFields } = updated;
        const isValidUuid = (idStr?: string) => Boolean(idStr && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idStr));
        
        let error: any = null;
        if (id && isValidUuid(id)) {
          const res = await supabase.from('businesses').update(bizFields).eq('id', id).eq('user_id', user.id);
          error = res.error;
        } else {
          const res = await supabase.from('businesses').upsert([{ ...bizFields, user_id: user.id }]).select().maybeSingle();
          error = res.error;
          if (res.data) {
            setBusiness(res.data);
            showToast('Business settings saved to Supabase', 'success');
            return;
          }
        }

        if (error) {
          console.warn('Update business Supabase error:', error);
          if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
            setIsDatabaseMissingTables(true);
          }
          showToast(error.message || 'Failed to save business settings to Supabase', 'error');
          return;
        }
      } catch (e: any) {
        console.warn('Update business exception:', e);
        showToast(e.message || 'Failed to save business settings', 'error');
        return;
      }
    }

    setBusiness(updated);
    logActivity('business_updated', `Updated business profile: ${updated.name}`);
    showToast('Business settings saved', 'success');
  };

  const addClient = async (clientData: Omit<Client, 'id' | 'user_id' | 'created_at'>): Promise<Client | null> => {
    if (!clientData.name?.trim() || !clientData.email?.trim()) {
      showToast('Client name and email are required.', 'error');
      return null;
    }

    if (isSupabaseConfigured && supabase && user && !isDemoUser) {
      try {
        const isValidUuid = (id?: string) => Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));
        const validBusinessId = isValidUuid(business.id) ? business.id : null;

        const { data: dbClient, error } = await supabase
          .from('clients')
          .insert([{
            user_id: user.id,
            business_id: validBusinessId,
            name: clientData.name.trim(),
            email: clientData.email.trim(),
            company: clientData.company?.trim() || null,
            phone: clientData.phone?.trim() || null,
            address: clientData.address?.trim() || null,
            city: clientData.city?.trim() || null,
            country: clientData.country?.trim() || null,
            tax_id: clientData.tax_id?.trim() || null,
          }])
          .select()
          .single();

        if (error) {
          console.warn('Supabase client insert error:', error);
          if (error.code === 'PGRST205' || error.message?.includes('schema cache') || error.message?.includes('does not exist')) {
            setIsDatabaseMissingTables(true);
          }
          showToast(error.message || 'Database error: Could not save client to Supabase', 'error');
          return null;
        }

        if (dbClient) {
          setClients((prev) => [dbClient, ...prev.filter((c) => c.id !== dbClient.id)]);
          logActivity('client_added', `Added new client: ${dbClient.name} (${dbClient.company || 'Individual'})`);
          showToast(`Client "${dbClient.name}" added successfully`, 'success');
          return dbClient;
        }
      } catch (err: any) {
        console.warn('Supabase client insert exception:', err);
        showToast(err.message || 'Failed to create client in Supabase', 'error');
        return null;
      }
    }

    // Demo user local creation
    const newClient: Client = {
      ...clientData,
      id: `cli_${Date.now()}`,
      user_id: user?.id || 'usr_demo_882910',
      business_id: business.id,
      created_at: new Date().toISOString(),
    };

    setClients((prev) => [newClient, ...prev]);
    logActivity('client_added', `Added new client: ${newClient.name} (${newClient.company || 'Individual'})`);
    showToast(`Client "${newClient.name}" added successfully`, 'success');

    return newClient;
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    if (isSupabaseConfigured && supabase && user && !isDemoUser) {
      try {
        const { error } = await supabase
          .from('clients')
          .update({
            name: updates.name !== undefined ? updates.name.trim() : undefined,
            email: updates.email !== undefined ? updates.email.trim() : undefined,
            company: updates.company !== undefined ? (updates.company?.trim() || null) : undefined,
            phone: updates.phone !== undefined ? (updates.phone?.trim() || null) : undefined,
            address: updates.address !== undefined ? (updates.address?.trim() || null) : undefined,
            city: updates.city !== undefined ? (updates.city?.trim() || null) : undefined,
            country: updates.country !== undefined ? (updates.country?.trim() || null) : undefined,
            tax_id: updates.tax_id !== undefined ? (updates.tax_id?.trim() || null) : undefined,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) {
          console.warn('Update client Supabase error:', error);
          if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
            setIsDatabaseMissingTables(true);
          }
          showToast(error.message || 'Failed to update client in Supabase', 'error');
          return;
        }
      } catch (e: any) {
        console.warn('Update client notice:', e);
        showToast(e.message || 'Failed to update client in Supabase', 'error');
        return;
      }
    }

    const existingClient = clients.find((c) => c.id === id);
    const updatedClientName = updates.name || existingClient?.name || 'Client';

    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.client_id === id
          ? {
              ...inv,
              client: {
                ...(inv.client || ({} as Client)),
                ...updates,
              } as Client,
            }
          : inv
      )
    );
    logActivity('client_updated', `Updated client details: ${updatedClientName}`);
    showToast('Client details updated', 'success');
  };

  const deleteClient = async (id: string) => {
    const targetClient = clients.find((c) => c.id === id);
    const clientName = targetClient?.name || 'Client';

    if (isSupabaseConfigured && supabase && user && !isDemoUser) {
      try {
        const { error } = await supabase.from('clients').delete().eq('id', id).eq('user_id', user.id);
        if (error) {
          console.warn('Delete client Supabase error:', error);
          if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
            setIsDatabaseMissingTables(true);
          }
          showToast(error.message || 'Failed to delete client from Supabase', 'error');
          return;
        }
      } catch (e: any) {
        console.warn('Delete client exception:', e);
        showToast(e.message || 'Failed to delete client', 'error');
        return;
      }
    }

    setClients((prev) => prev.filter((c) => c.id !== id));
    logActivity('client_deleted', `Deleted client: ${clientName}`);
    showToast('Client removed', 'info');
  };

  const createInvoice = async (
    invoiceData: Omit<Invoice, 'id' | 'user_id' | 'created_at'>
  ): Promise<{ success: boolean; invoice?: Invoice; error?: string }> => {
    if (isSupabaseConfigured && supabase && user && !isDemoUser) {
      try {
        const { items, client, ...invFields } = invoiceData;
        const isValidUuid = (id?: string) => Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));
        const validBusinessId = isValidUuid(business.id) ? business.id : null;
        const validClientId = isValidUuid(invoiceData.client_id) ? invoiceData.client_id : null;

        const { data: dbInvoice, error: invErr } = await supabase
          .from('invoices')
          .insert([{
            user_id: user.id,
            business_id: validBusinessId,
            client_id: validClientId,
            number: invoiceData.number,
            status: invoiceData.status || 'draft',
            issue_date: invoiceData.issue_date,
            due_date: invoiceData.due_date,
            currency: invoiceData.currency || business.default_currency || 'USD',
            subtotal: invoiceData.subtotal,
            tax_rate: invoiceData.tax_rate,
            tax_amount: invoiceData.tax_amount,
            discount: invoiceData.discount,
            total: invoiceData.total,
            notes: invoiceData.notes,
            terms: invoiceData.terms,
            template: invoiceData.template || 'modern',
          }])
          .select()
          .single();

        if (invErr) {
          console.warn('Create invoice Supabase error:', invErr);
          if (invErr.code === 'PGRST205' || invErr.message?.includes('schema cache') || invErr.message?.includes('does not exist')) {
            setIsDatabaseMissingTables(true);
          }
          showToast(invErr.message || 'Failed to save invoice to Supabase', 'error');
          return { success: false, error: invErr.message };
        }

        if (dbInvoice) {
          let createdItems: any[] = [];
          if (items && items.length > 0) {
            try {
              const { data: dbItems, error: itemErr } = await supabase.from('invoice_items').insert(
                items.map((it) => ({
                  invoice_id: dbInvoice.id,
                  description: it.description,
                  quantity: it.quantity,
                  unit_price: it.unit_price,
                  amount: it.amount,
                }))
              ).select();

              if (!itemErr && dbItems) {
                createdItems = dbItems;
              } else if (itemErr) {
                console.warn('Invoice items insert warning:', itemErr);
              }
            } catch (e) {
              console.warn('Invoice items insert notice:', e);
            }
          }

          const selectedClient = clients.find((c) => c.id === dbInvoice.client_id);
          const fullInvoice: Invoice = {
            ...dbInvoice,
            client: selectedClient,
            items: createdItems,
          };

          setInvoices((prev) => [fullInvoice, ...prev]);

          // Increment usage count in Supabase
          const newUsageCount = usage.invoice_count_month + 1;
          setUsage((prev) => ({ ...prev, invoice_count_month: newUsageCount }));
          try {
            await supabase.from('usage').upsert([{ user_id: user.id, invoice_count_month: newUsageCount }]);
          } catch (e) {
            console.warn('Usage update notice:', e);
          }

          // Increment business next_invoice_number
          const numPart = parseInt(business.invoice_prefix ? dbInvoice.number.replace(business.invoice_prefix, '') : dbInvoice.number, 10);
          if (!isNaN(numPart)) {
            const nextNum = Math.max(business.next_invoice_number || 1001, numPart + 1);
            setBusiness((prev) => ({ ...prev, next_invoice_number: nextNum }));
            try {
              if (validBusinessId) {
                await supabase.from('businesses').update({ next_invoice_number: nextNum }).eq('id', business.id).eq('user_id', user.id);
              }
            } catch (e) {
              console.warn('Business update notice:', e);
            }
          }

          logActivity(
            'invoice_created',
            `Created invoice ${dbInvoice.number} for ${selectedClient?.name || 'Client'} (${dbInvoice.currency} ${(Number(dbInvoice.total) || 0).toFixed(2)})`
          );

          showToast(`Invoice ${dbInvoice.number} created successfully`, 'success');
          return { success: true, invoice: fullInvoice };
        }
      } catch (err: any) {
        console.warn('Supabase create invoice notice:', err);
        showToast(err.message || 'Failed to create invoice in Supabase', 'error');
        return { success: false, error: err.message };
      }
    }

    // Demo mode local invoice creation
    const client = clients.find((c) => c.id === invoiceData.client_id);
    const newInvoice: Invoice = {
      ...invoiceData,
      id: `inv_${Date.now()}`,
      user_id: user?.id || 'usr_demo_882910',
      business_id: business.id,
      client,
      created_at: new Date().toISOString(),
    };

    setInvoices((prev) => [newInvoice, ...prev]);

    const numPart = parseInt(business.invoice_prefix ? newInvoice.number.replace(business.invoice_prefix, '') : newInvoice.number, 10);
    if (!isNaN(numPart)) {
      setBusiness((prev) => ({ ...prev, next_invoice_number: Math.max(prev.next_invoice_number || 1001, numPart + 1) }));
    }

    setUsage((prev) => ({ ...prev, invoice_count_month: prev.invoice_count_month + 1 }));

    logActivity(
      'invoice_created',
      `Created invoice ${newInvoice.number} for ${client?.name || 'Client'} (${newInvoice.currency} ${(Number(newInvoice.total) || 0).toFixed(2)})`
    );

    showToast(`Invoice ${newInvoice.number} created successfully`, 'success');
    return { success: true, invoice: newInvoice };
  };

  const updateInvoice = async (
    id: string,
    invoiceData: Partial<Invoice>
  ): Promise<{ success: boolean; invoice?: Invoice; error?: string }> => {
    if (isSupabaseConfigured && supabase && user && !isDemoUser) {
      try {
        const isValidUuid = (idStr?: string) => Boolean(idStr && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idStr));
        const validClientId = isValidUuid(invoiceData.client_id) ? invoiceData.client_id : (invoiceData.client_id === null ? null : undefined);

        const updatePayload: any = {
          updated_at: new Date().toISOString(),
        };
        if (validClientId !== undefined) updatePayload.client_id = validClientId;
        if (invoiceData.number !== undefined) updatePayload.number = invoiceData.number;
        if (invoiceData.status !== undefined) updatePayload.status = invoiceData.status;
        if (invoiceData.issue_date !== undefined) updatePayload.issue_date = invoiceData.issue_date;
        if (invoiceData.due_date !== undefined) updatePayload.due_date = invoiceData.due_date;
        if (invoiceData.currency !== undefined) updatePayload.currency = invoiceData.currency;
        if (invoiceData.subtotal !== undefined) updatePayload.subtotal = invoiceData.subtotal;
        if (invoiceData.tax_rate !== undefined) updatePayload.tax_rate = invoiceData.tax_rate;
        if (invoiceData.tax_amount !== undefined) updatePayload.tax_amount = invoiceData.tax_amount;
        if (invoiceData.discount !== undefined) updatePayload.discount = invoiceData.discount;
        if (invoiceData.total !== undefined) updatePayload.total = invoiceData.total;
        if (invoiceData.notes !== undefined) updatePayload.notes = invoiceData.notes;
        if (invoiceData.terms !== undefined) updatePayload.terms = invoiceData.terms;
        if (invoiceData.template !== undefined) updatePayload.template = invoiceData.template;

        const { error: invErr } = await supabase
          .from('invoices')
          .update(updatePayload)
          .eq('id', id)
          .eq('user_id', user.id);

        if (invErr) {
          console.warn('Update invoice Supabase error:', invErr);
          if (invErr.code === 'PGRST205' || invErr.message?.includes('schema cache')) {
            setIsDatabaseMissingTables(true);
          }
          showToast(invErr.message || 'Failed to update invoice in Supabase', 'error');
          return { success: false, error: invErr.message };
        }

        // Update items if provided
        if (invoiceData.items) {
          try {
            await supabase.from('invoice_items').delete().eq('invoice_id', id);
            if (invoiceData.items.length > 0) {
              await supabase.from('invoice_items').insert(
                invoiceData.items.map((it) => ({
                  invoice_id: id,
                  description: it.description,
                  quantity: it.quantity,
                  unit_price: it.unit_price,
                  amount: it.amount,
                }))
              );
            }
          } catch (e) {
            console.warn('Invoice items update notice:', e);
          }
        }
      } catch (err: any) {
        console.warn('Supabase update invoice exception:', err);
        showToast(err.message || 'Failed to update invoice in Supabase', 'error');
        return { success: false, error: err.message };
      }
    }

    const currentInv = invoices.find((i) => i.id === id);
    const updatedClientId = invoiceData.client_id !== undefined ? invoiceData.client_id : currentInv?.client_id;
    const updatedClient = clients.find((c) => c.id === updatedClientId) || currentInv?.client;

    const updatedInvoice: Invoice = {
      ...(currentInv || ({} as Invoice)),
      ...invoiceData,
      id,
      client_id: updatedClientId || '',
      client: updatedClient,
      items: invoiceData.items || currentInv?.items || [],
    };

    setInvoices((prev) => prev.map((inv) => (inv.id === id ? updatedInvoice : inv)));
    logActivity(
      'invoice_updated',
      `Updated invoice ${updatedInvoice.number} for ${updatedClient?.name || 'Client'} (${updatedInvoice.currency} ${(Number(updatedInvoice.total) || 0).toFixed(2)})`
    );
    showToast(`Invoice ${updatedInvoice.number} updated successfully`, 'success');
    return { success: true, invoice: updatedInvoice };
  };

  const updateInvoiceStatus = async (id: string, status: Invoice['status'], customSentAt?: string) => {
    let paidTime: string | undefined;
    let sentTime: string | undefined = customSentAt;
    if (status === 'paid') {
      paidTime = new Date().toISOString();
    }
    if (status === 'sent' && !sentTime) {
      sentTime = new Date().toISOString();
    }

    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === id) {
          const updatedInv = {
            ...inv,
            status,
            paid_at: paidTime || inv.paid_at,
            sent_at: sentTime || inv.sent_at,
          };
          if (status === 'paid') {
            logActivity(
              'invoice_paid',
              `Marked ${inv.number} as PAID (${inv.currency} ${(Number(inv.total) || 0).toFixed(2)})`
            );
          } else if (status === 'sent') {
            logActivity(
              'email_sent',
              `Sent invoice ${inv.number} to ${inv.client?.name || 'Client'}`
            );
          }
          return updatedInv;
        }
        return inv;
      })
    );

    showToast(`Invoice status updated to ${status.toUpperCase()}`, 'success');

    if (isSupabaseConfigured && supabase && user && !isDemoUser) {
      try {
        const updatePayload: any = { status };
        if (paidTime) updatePayload.paid_at = paidTime;
        if (sentTime) updatePayload.sent_at = sentTime;
        await supabase.from('invoices').update(updatePayload).eq('id', id).eq('user_id', user.id);
      } catch (e) {
        console.warn('Update invoice status notice:', e);
      }
    }

    if (status === 'paid') {
      // Automatically generate a receipt for this paid invoice if one does not already exist
      const existingReceipt = receipts.find((r) => r.invoice_id === id);
      if (!existingReceipt) {
        const targetInv = invoices.find((i) => i.id === id);
        createReceipt({
          invoice_id: id,
          amount: targetInv?.total || 0,
          currency: targetInv?.currency || 'USD',
          payment_method: 'Card / Electronic',
          payment_date: paidTime || new Date().toISOString(),
          notes: `Settlement for invoice ${targetInv?.number || ''}`,
        }).catch((err) => {
          console.warn('Auto receipt creation notice:', err);
        });
      }
    }
  };

  const deleteInvoice = async (id: string) => {
    const inv = invoices.find((i) => i.id === id);
    const invNumber = inv?.number || 'Invoice';

    if (isSupabaseConfigured && supabase && user && !isDemoUser) {
      try {
        const { error } = await supabase.from('invoices').delete().eq('id', id).eq('user_id', user.id);
        if (error) {
          console.warn('Delete invoice Supabase error:', error);
          if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
            setIsDatabaseMissingTables(true);
          }
          showToast(error.message || 'Failed to delete invoice from Supabase', 'error');
          return;
        }
      } catch (e: any) {
        console.warn('Delete invoice exception:', e);
        showToast(e.message || 'Failed to delete invoice', 'error');
        return;
      }
    }

    setInvoices((prev) => prev.filter((i) => i.id !== id));
    logActivity('invoice_deleted', `Deleted invoice: ${invNumber}`);
    showToast(`Invoice ${invNumber} deleted`, 'info');
  };

  const incrementAiUsage = async (): Promise<boolean> => {
    const currentPlan = subscription.plan;
    const limit = PLAN_LIMITS[currentPlan].maxAiGenerations;

    if (usage.ai_generations_month >= limit) {
      showToast(`You have reached your ${currentPlan.toUpperCase()} plan limit of ${limit} AI generations/month. Upgrade to Pro!`, 'error');
      return false;
    }

    const newAiCount = usage.ai_generations_month + 1;
    setUsage((prev) => ({ ...prev, ai_generations_month: newAiCount }));

    if (isSupabaseConfigured && supabase && user && !isDemoUser) {
      try {
        await supabase.from('usage').upsert([{ user_id: user.id, ai_generations_month: newAiCount }]);
      } catch (e) {
        console.warn('Increment AI usage notice:', e);
      }
    }

    return true;
  };

  const upgradeSubscription = async (plan: PlanType, paystackRef: string): Promise<boolean> => {
    const newSub: Subscription = {
      id: `sub_${Date.now()}`,
      user_id: user?.id || 'usr_demo_882910',
      plan,
      status: 'active',
      paystack_customer_code: `CUST_${paystackRef.slice(-6)}`,
      paystack_subscription_code: `SUB_${paystackRef.slice(-6)}`,
      current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setSubscription(newSub);

    const newPayment: Payment = {
      id: `pay_${Date.now()}`,
      user_id: user?.id || 'usr_demo_882910',
      paystack_reference: paystackRef,
      amount: plan === 'pro' ? PRO_MONTHLY : ENTERPRISE_MONTHLY,
      currency: 'USD',
      status: 'success',
      channel: 'card',
      paid_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    setPayments((prev) => [newPayment, ...prev]);

    logActivity('subscription_upgraded', `Upgraded subscription to ${plan.toUpperCase()} Plan (Ref: ${paystackRef})`);
    showToast(`🎉 Subscription successfully upgraded to ${plan.toUpperCase()} Plan! Pro features unlocked.`, 'success');

    if (isSupabaseConfigured && supabase && user && !isDemoUser) {
      try {
        await supabase.from('subscriptions').upsert({
          user_id: user.id,
          plan,
          status: 'active',
          paystack_customer_code: newSub.paystack_customer_code,
          paystack_subscription_code: newSub.paystack_subscription_code,
          current_period_end: newSub.current_period_end,
        });

        await supabase.from('payments').insert([{
          user_id: user.id,
          paystack_reference: paystackRef,
          amount: newPayment.amount,
          currency: 'USD',
          status: 'success',
          channel: 'card',
          paid_at: newPayment.paid_at,
        }]);
      } catch (e) {
        console.warn('Upgrade subscription notice:', e);
      }
    }

    return true;
  };

  const startTrial = async (): Promise<boolean> => {
    if (subscription.trial_started_at) {
      showToast('A 7-day free trial has already been used on this account.', 'info');
      return false;
    }
    const trialStart = new Date().toISOString();
    const trialEnd = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const updatedSub: Subscription = {
      ...subscription,
      status: 'trialing',
      trial_started_at: trialStart,
      trial_ends_at: trialEnd,
      updated_at: new Date().toISOString(),
    };
    setSubscription(updatedSub);

    if (isSupabaseConfigured && supabase && user && !isDemoUser) {
      try {
        await supabase.from('subscriptions').upsert({
          user_id: user.id,
          plan: subscription.plan,
          status: 'trialing',
          trial_started_at: trialStart,
          trial_ends_at: trialEnd,
        });
      } catch (e) {
        console.warn('Start trial notice:', e);
      }
    }
    showToast('🎉 Your 7-day free trial is now active! All Pro features unlocked.', 'success');
    return true;
  };

  const cancelSubscription = async () => {
    const updated: Subscription = {
      ...subscription,
      status: 'canceled',
      plan: 'free',
      updated_at: new Date().toISOString(),
    };
    setSubscription(updated);
    showToast('Subscription canceled. You have been downgraded to Free Plan.', 'info');

    if (isSupabaseConfigured && supabase && user && !isDemoUser) {
      try {
        await supabase.from('subscriptions').update({ status: 'canceled', plan: 'free' }).eq('user_id', user.id);
      } catch (e) {
        console.warn('Cancel subscription notice:', e);
      }
    }
  };

  // Receipts CRUD
  const createReceipt = async (receiptData: {
    invoice_id: string;
    amount: number;
    currency?: string;
    payment_method?: string;
    notes?: string;
    payment_date?: string;
  }): Promise<{ success: boolean; receipt?: Receipt; error?: string }> => {
    // 1. Check if a receipt for this invoice already exists to avoid accidental duplicates
    const existingReceipt = receipts.find((r) => r.invoice_id === receiptData.invoice_id);
    if (existingReceipt) {
      return { success: true, receipt: existingReceipt };
    }

    const matchedInvoice = invoices.find((i) => i.id === receiptData.invoice_id);
    const matchedClient = matchedInvoice?.client || clients.find((c) => c.id === matchedInvoice?.client_id);
    const currency = receiptData.currency || matchedInvoice?.currency || business.default_currency || 'USD';
    const nextNum = receipts.length + 1001;
    const receiptNumber = `REC-${nextNum}`;
    const paymentDate = receiptData.payment_date || new Date().toISOString();

    const newReceipt: Receipt = {
      id: `rec_${Date.now()}`,
      user_id: user?.id || (isDemoUser ? 'usr_demo_882910' : ''),
      client_id: matchedInvoice?.client_id || '',
      client: matchedClient,
      invoice_id: receiptData.invoice_id,
      invoice_number: matchedInvoice?.number || '',
      receipt_number: receiptNumber,
      amount: receiptData.amount,
      currency,
      payment_date: paymentDate,
      payment_method: receiptData.payment_method || 'Card / Electronic',
      notes: receiptData.notes || `Settlement for invoice ${matchedInvoice?.number || ''}`,
      status: 'paid',
      created_at: new Date().toISOString(),
      items: matchedInvoice?.items || [],
    };

    if (isSupabaseConfigured && supabase && user && !isDemoUser) {
      try {
        const { data, error } = await supabase
          .from('receipts')
          .insert([{
            user_id: user.id,
            business_id: business?.id || null,
            invoice_id: receiptData.invoice_id,
            client_id: matchedInvoice?.client_id || null,
            receipt_number: receiptNumber,
            invoice_number: matchedInvoice?.number || '',
            amount: receiptData.amount,
            currency,
            payment_date: paymentDate,
            payment_method: receiptData.payment_method || 'Card / Electronic',
            notes: receiptData.notes || `Settlement for invoice ${matchedInvoice?.number || ''}`,
            status: 'paid',
            items: matchedInvoice?.items || [],
          }])
          .select()
          .maybeSingle();

        if (error) {
          console.warn('Supabase create receipt notice/error:', error);
          if (error.code === 'PGRST205' || error.message?.includes('schema cache') || error.message?.includes('receipts')) {
            console.info('Receipt persisted locally while awaiting Supabase schema sync');
          }
        } else if (data) {
          newReceipt.id = data.id;
        }
      } catch (e: any) {
        console.warn('Receipt creation network/supabase notice:', e);
      }
    }

    setReceipts((prev) => [newReceipt, ...prev]);
    logActivity('receipt_created', `Generated payment receipt ${receiptNumber} for ${matchedClient?.name || 'Client'} (${currency} ${(Number(receiptData.amount) || 0).toFixed(2)})`);
    showToast(`Receipt ${receiptNumber} generated successfully`, 'success');
    return { success: true, receipt: newReceipt };
  };

  const deleteReceipt = async (id: string) => {
    const rec = receipts.find((r) => r.id === id);
    if (isSupabaseConfigured && supabase && user && !isDemoUser) {
      try {
        await supabase.from('receipts').delete().eq('id', id).eq('user_id', user.id);
      } catch (e) {
        console.warn('Delete receipt error:', e);
      }
    }
    setReceipts((prev) => prev.filter((r) => r.id !== id));
    logActivity('receipt_created', `Deleted receipt ${rec?.receipt_number || id}`);
    showToast('Receipt deleted', 'info');
  };

  // Products CRUD
  const addProduct = async (prodData: Omit<Product, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Product | null> => {
    const currentPlan = subscription.plan;
    const maxProds = PLAN_LIMITS[currentPlan].maxProducts;
    if (products.length >= maxProds) {
      openUpgradeModal('pro');
      showToast(`You have reached the ${currentPlan.toUpperCase()} plan limit of ${maxProds} products/services. Upgrade to Pro!`, 'error');
      return null;
    }

    const newProd: Product = {
      id: `prod_${Date.now()}`,
      user_id: user?.id || (isDemoUser ? 'usr_demo_882910' : ''),
      ...prodData,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase && user && !isDemoUser) {
      try {
        const { data, error } = await supabase.from('products').insert([{
          user_id: user.id,
          ...prodData,
        }]).select().maybeSingle();

        if (error) {
          showToast(error.message || 'Failed to add product to database', 'error');
          return null;
        }
        if (data) newProd.id = data.id;
      } catch (e: any) {
        showToast(e.message || 'Failed to save product', 'error');
        return null;
      }
    }

    setProducts((prev) => [newProd, ...prev]);
    logActivity('product_created', `Added product/service: ${prodData.name}`);
    showToast(`Added "${prodData.name}" to catalog`, 'success');
    return newProd;
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    if (isSupabaseConfigured && supabase && user && !isDemoUser) {
      try {
        const { id: _ignored, user_id: _uid, created_at: _cat, ...fields } = updates;
        await supabase.from('products').update(fields).eq('id', id).eq('user_id', user.id);
      } catch (e) {
        console.warn('Update product notice:', e);
      }
    }
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p)));
    logActivity('product_updated', `Updated product: ${updates.name || 'Catalog Item'}`);
    showToast('Product updated successfully', 'success');
  };

  const deleteProduct = async (id: string) => {
    const prod = products.find((p) => p.id === id);
    if (isSupabaseConfigured && supabase && user && !isDemoUser) {
      try {
        await supabase.from('products').delete().eq('id', id).eq('user_id', user.id);
      } catch (e) {
        console.warn('Delete product notice:', e);
      }
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
    logActivity('product_deleted', `Deleted product: ${prod?.name || id}`);
    showToast('Product removed from catalog', 'info');
  };

  // Expenses CRUD
  const addExpense = async (expData: Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Expense | null> => {
    const currentPlan = subscription.plan;
    const maxExpenses = PLAN_LIMITS[currentPlan].maxExpenses;
    if (expenses.length >= maxExpenses) {
      openUpgradeModal('pro');
      showToast(`You have reached the ${currentPlan.toUpperCase()} plan limit of ${maxExpenses} expenses. Upgrade to Pro!`, 'error');
      return null;
    }

    const newExp: Expense = {
      id: `exp_${Date.now()}`,
      user_id: user?.id || (isDemoUser ? 'usr_demo_882910' : ''),
      ...expData,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase && user && !isDemoUser) {
      try {
        const { data, error } = await supabase.from('expenses').insert([{
          user_id: user.id,
          ...expData,
        }]).select().maybeSingle();

        if (error) {
          showToast(error.message || 'Failed to save expense', 'error');
          return null;
        }
        if (data) newExp.id = data.id;
      } catch (e: any) {
        showToast(e.message || 'Failed to save expense', 'error');
        return null;
      }
    }

    setExpenses((prev) => [newExp, ...prev]);
    logActivity('expense_created', `Recorded expense: ${expData.description} (${expData.currency} ${(Number(expData.amount) || 0).toFixed(2)})`);
    showToast(`Recorded expense: ${expData.description}`, 'success');
    return newExp;
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    if (isSupabaseConfigured && supabase && user && !isDemoUser) {
      try {
        const { id: _ignored, user_id: _uid, created_at: _cat, ...fields } = updates;
        await supabase.from('expenses').update(fields).eq('id', id).eq('user_id', user.id);
      } catch (e) {
        console.warn('Update expense notice:', e);
      }
    }
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates, updated_at: new Date().toISOString() } : e)));
    logActivity('expense_updated', `Updated expense: ${updates.description || 'Expense'}`);
    showToast('Expense updated successfully', 'success');
  };

  const deleteExpense = async (id: string) => {
    const exp = expenses.find((e) => e.id === id);
    if (isSupabaseConfigured && supabase && user && !isDemoUser) {
      try {
        await supabase.from('expenses').delete().eq('id', id).eq('user_id', user.id);
      } catch (e) {
        console.warn('Delete expense notice:', e);
      }
    }
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    logActivity('expense_deleted', `Deleted expense: ${exp?.description || id}`);
    showToast('Expense removed', 'info');
  };

  // Recurring Invoices CRUD
  const addRecurringInvoice = async (recData: Omit<RecurringInvoice, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<RecurringInvoice | null> => {
    const currentPlan = subscription.plan;
    if (!PLAN_LIMITS[currentPlan].canUseRecurringInvoices) {
      openUpgradeModal('pro');
      showToast('Recurring invoices are available exclusively on Pro & Enterprise plans. Please upgrade!', 'error');
      return null;
    }

    const maxRec = PLAN_LIMITS[currentPlan].maxRecurringInvoices;
    if (recurringInvoices.length >= maxRec) {
      openUpgradeModal('enterprise');
      showToast(`You have reached the ${currentPlan.toUpperCase()} plan limit of ${maxRec} recurring invoice profiles. Upgrade!`, 'error');
      return null;
    }

    const matchedClient = clients.find((c) => c.id === recData.client_id);
    const newRec: RecurringInvoice = {
      id: `rec_inv_${Date.now()}`,
      user_id: user?.id || (isDemoUser ? 'usr_demo_882910' : ''),
      ...recData,
      client: matchedClient,
      items: recData.items || [],
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase && user && !isDemoUser) {
      try {
        const { items, client, ...recFields } = newRec;
        const { data, error } = await supabase.from('recurring_invoices').insert([{
          user_id: user.id,
          ...recFields,
        }]).select().maybeSingle();

        if (error) {
          showToast(error.message || 'Failed to save recurring invoice schedule', 'error');
          return null;
        }
        if (data) {
          newRec.id = data.id;
          if (items && items.length > 0) {
            await supabase.from('recurring_invoice_items').insert(
              items.map((it) => ({
                recurring_invoice_id: data.id,
                description: it.description,
                quantity: it.quantity,
                unit_price: it.unit_price,
                amount: it.amount,
              }))
            );
          }
        }
      } catch (e: any) {
        showToast(e.message || 'Failed to create recurring profile', 'error');
        return null;
      }
    }

    setRecurringInvoices((prev) => [newRec, ...prev]);
    logActivity('recurring_created', `Scheduled recurring invoice for ${matchedClient?.name || 'Client'} (${newRec.frequency}, ${newRec.currency} ${(Number(newRec.total) || 0).toFixed(2)})`);
    showToast(`Recurring invoice schedule created (${newRec.frequency})`, 'success');
    return newRec;
  };

  const updateRecurringInvoice = async (id: string, updates: Partial<RecurringInvoice>) => {
    if (isSupabaseConfigured && supabase && user && !isDemoUser) {
      try {
        const { id: _ignored, user_id: _uid, created_at: _cat, client: _c, items: _it, ...fields } = updates;
        await supabase.from('recurring_invoices').update(fields).eq('id', id).eq('user_id', user.id);
        if (updates.items) {
          await supabase.from('recurring_invoice_items').delete().eq('recurring_invoice_id', id);
          if (updates.items.length > 0) {
            await supabase.from('recurring_invoice_items').insert(
              updates.items.map((it) => ({
                recurring_invoice_id: id,
                description: it.description,
                quantity: it.quantity,
                unit_price: it.unit_price,
                amount: it.amount,
              }))
            );
          }
        }
      } catch (e) {
        console.warn('Update recurring invoice notice:', e);
      }
    }
    setRecurringInvoices((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates, updated_at: new Date().toISOString() } : r)));
    logActivity('recurring_updated', `Updated recurring profile`);
    showToast('Recurring invoice schedule updated', 'success');
  };

  const deleteRecurringInvoice = async (id: string) => {
    if (isSupabaseConfigured && supabase && user && !isDemoUser) {
      try {
        await supabase.from('recurring_invoices').delete().eq('id', id).eq('user_id', user.id);
      } catch (e) {
        console.warn('Delete recurring notice:', e);
      }
    }
    setRecurringInvoices((prev) => prev.filter((r) => r.id !== id));
    logActivity('recurring_deleted', `Deleted recurring schedule`);
    showToast('Recurring invoice schedule removed', 'info');
  };

  const triggerRecurringProcess = async (): Promise<{ processed: number; generated: number }> => {
    try {
      const res = await fetch('/api/recurring/process', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Recurring engine processed: ${data.generated} invoice(s) generated`, 'success');
        await refreshData();
        return { processed: data.processed || 0, generated: data.generated || 0 };
      }
    } catch (e) {
      console.warn('Trigger recurring process notice:', e);
    }
    showToast('Recurring schedules processed', 'info');
    return { processed: 0, generated: 0 };
  };

  // Reminders CRUD
  const updateReminderSettings = async (updates: Partial<ReminderSettings>) => {
    const updated = { ...reminderSettings, ...updates };
    if (isSupabaseConfigured && supabase && user && !isDemoUser) {
      try {
        const { id: _ignored, ...fields } = updated;
        await supabase.from('reminder_settings').upsert({ user_id: user.id, ...fields });
      } catch (e) {
        console.warn('Update reminder settings notice:', e);
      }
    }
    setReminderSettings(updated);
    logActivity('reminder_sent', 'Updated automated overdue reminder rules');
    showToast('Reminder rules updated successfully', 'success');
  };

  const sendManualReminder = async (invoiceId: string, customMessage?: string): Promise<{ success: boolean; message?: string }> => {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv) return { success: false, message: 'Invoice not found' };
    const clientEmail = inv.client?.email || '';
    if (!clientEmail) {
      showToast('Client does not have an email address.', 'error');
      return { success: false, message: 'Missing client email' };
    }

    const today = new Date();
    const dueDate = new Date(inv.due_date);
    const diffDays = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));

    const res = await defaultEmailService.sendReminderEmail({
      to: { name: inv.client?.name || 'Client', email: clientEmail },
      clientName: inv.client?.name || 'Valued Client',
      invoiceNumber: inv.number,
      invoiceId: inv.id,
      amount: inv.total,
      currency: inv.currency,
      dueDate: inv.due_date,
      daysOverdue: diffDays,
      businessName: business.name,
      customMessage: customMessage || reminderSettings.custom_message,
    });

    if (res.success) {
      const newLog: ReminderLog = {
        id: `rem_log_${Date.now()}`,
        user_id: user?.id || (isDemoUser ? 'usr_demo_882910' : ''),
        invoice_id: inv.id,
        client_id: inv.client_id,
        reminder_stage: diffDays >= 14 ? 'final' : diffDays >= 7 ? 'second' : 'first',
        days_overdue: diffDays,
        recipient_email: clientEmail,
        status: 'sent',
        sent_at: new Date().toISOString(),
      };
      setReminderLogs((prev) => [newLog, ...prev]);
      logActivity('reminder_sent', `Sent overdue reminder for ${inv.number} to ${clientEmail} (${diffDays} days overdue)`);
      showToast(`Overdue reminder sent to ${clientEmail}`, 'success');
      return { success: true, message: 'Reminder sent successfully' };
    } else {
      showToast(res.message || 'Failed to send reminder', 'error');
      return { success: false, message: res.message };
    }
  };

  const triggerRemindersProcess = async (): Promise<{ processed: number; remindersSent: number }> => {
    try {
      const res = await fetch('/api/reminders/process', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Reminder processor finished: ${data.remindersSent} reminder(s) sent`, 'success');
        await refreshData();
        return { processed: data.processed || 0, remindersSent: data.remindersSent || 0 };
      }
    } catch (e) {
      console.warn('Trigger reminders process notice:', e);
    }
    showToast('Overdue reminder checks processed', 'info');
    return { processed: 0, remindersSent: 0 };
  };

  return (
    <AppContext.Provider
      value={{
        activePage,
        setActivePage,
        selectedInvoiceId,
        setSelectedInvoiceId,
        editingInvoice,
        setEditingInvoice,
        business,
        updateBusiness,
        clients,
        addClient,
        updateClient,
        deleteClient,
        invoices,
        createInvoice,
        updateInvoice,
        updateInvoiceStatus,
        deleteInvoice,

        // Receipts
        receipts,
        selectedReceiptId,
        setSelectedReceiptId,
        createReceipt,
        deleteReceipt,
        isReceiptModalOpen,
        setIsReceiptModalOpen,
        activeReceiptForModal,
        openReceiptModal,
        closeReceiptModal,

        // Products
        products,
        addProduct,
        updateProduct,
        deleteProduct,

        // Expenses
        expenses,
        addExpense,
        updateExpense,
        deleteExpense,

        // Recurring Invoices
        recurringInvoices,
        addRecurringInvoice,
        updateRecurringInvoice,
        deleteRecurringInvoice,
        triggerRecurringProcess,

        // Reminders
        reminderSettings,
        updateReminderSettings,
        reminderLogs,
        sendManualReminder,
        triggerRemindersProcess,
        isReminderSettingsModalOpen,
        setIsReminderSettingsModalOpen,
        openReminderSettingsModal,
        closeReminderSettingsModal,
        isSendReminderModalOpen,
        setIsSendReminderModalOpen,
        activeInvoiceForReminder,
        openSendReminderModal,
        closeSendReminderModal,

        subscription,
        upgradeSubscription,
        cancelSubscription,
        startTrial,
        payments,
        usage,
        incrementAiUsage,
        activities,
        logActivity,
        toasts,
        showToast,
        removeToast,
        refreshData,
        isDatabaseMissingTables,
        isUpgradeModalOpen,
        setIsUpgradeModalOpen,
        pendingUpgradePlan,
        setPendingUpgradePlan,
        openUpgradeModal,
        closeUpgradeModal,
        isSupportModalOpen,
        setIsSupportModalOpen,
        supportCategory,
        openSupportModal,
        closeSupportModal,

        isSidebarCollapsed,
        setIsSidebarCollapsed,
        toggleSidebar,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
