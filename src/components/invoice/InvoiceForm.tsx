import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { SUPPORTED_CURRENCIES, InvoiceItem, Client, InvoiceTemplateId, INVOICE_TEMPLATES } from '../../types';
import { Plus, Trash2, Eye, Edit3, Sparkles, UserPlus, Search, Check, ChevronDown, LayoutTemplate, Palette, X, Package } from 'lucide-react';
import { InvoiceTemplate } from './InvoiceTemplate';

interface InvoiceFormProps {
  onCancel: () => void;
  onSuccess: (invoiceId: string) => void;
  onOpenAiModal?: () => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({ onCancel, onSuccess, onOpenAiModal }) => {
  const { clients, products, business, createInvoice, updateInvoice, addClient, editingInvoice, setEditingInvoice, showToast } = useApp();

  const isEditMode = Boolean(editingInvoice);

  // Initialize selected client
  const [selectedClientId, setSelectedClientId] = useState<string>(() => {
    if (editingInvoice?.client_id) return editingInvoice.client_id;
    return clients[0]?.id || '';
  });

  // Client search & dropdown UI state
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [showNewClientForm, setShowNewClientForm] = useState(false);

  // New Client Fields
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientCompany, setNewClientCompany] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');
  const [newClientCity, setNewClientCity] = useState('');
  const [newClientCountry, setNewClientCountry] = useState('');
  const [newClientTaxId, setNewClientTaxId] = useState('');

  // Invoice Fields
  const [currency, setCurrency] = useState<string>(
    editingInvoice?.currency || business.default_currency || 'USD'
  );
  const [number, setNumber] = useState<string>(
    editingInvoice?.number || `${business.invoice_prefix || 'INV-'}${business.next_invoice_number || 1001}`
  );
  const [issueDate, setIssueDate] = useState<string>(
    editingInvoice?.issue_date || new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState<string>(
    editingInvoice?.due_date || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );

  const [items, setItems] = useState<InvoiceItem[]>(() => {
    if (editingInvoice?.items && editingInvoice.items.length > 0) {
      return editingInvoice.items;
    }
    return [
      { id: 'item_1', description: 'Professional Design & Development Services', quantity: 1, unit_price: 1200, amount: 1200 },
    ];
  });

  const [taxRate, setTaxRate] = useState<number>(editingInvoice?.tax_rate || 0);
  const [discount, setDiscount] = useState<number>(editingInvoice?.discount || 0);
  const [notes, setNotes] = useState<string>(editingInvoice?.notes || 'Thank you for choosing our business!');
  const [terms, setTerms] = useState<string>(editingInvoice?.terms || business.payment_terms || 'Payment due within 14 days.');
  const [template, setTemplate] = useState<InvoiceTemplateId>(editingInvoice?.template || 'modern');
  const [status, setStatus] = useState<'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'>(
    editingInvoice?.status || 'sent'
  );

  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync if clients change
  useEffect(() => {
    if (!selectedClientId && clients.length > 0) {
      setSelectedClientId(clients[0].id);
    }
  }, [clients, selectedClientId]);

  // Filter clients by search query
  const filteredClients = useMemo(() => {
    if (!clientSearchQuery.trim()) return clients;
    const q = clientSearchQuery.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.company && c.company.toLowerCase().includes(q))
    );
  }, [clients, clientSearchQuery]);

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  // Calculations
  const subtotal = items.reduce((acc, item) => acc + (item.amount || 0), 0);
  const taxAmount = (subtotal - discount) * (taxRate / 100);
  const total = Math.max(0, subtotal - discount + taxAmount);

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...items];
    let parsedValue = value;
    if (field === 'quantity') {
      parsedValue = value === '' ? '' : Number(value);
    } else if (field === 'unit_price') {
      parsedValue = value === '' ? '' : Number(value);
    }

    const current = { ...updated[index], [field]: parsedValue };

    if (field === 'quantity' || field === 'unit_price') {
      const q = Number(current.quantity) || 0;
      const u = Number(current.unit_price) || 0;
      current.amount = q * u;
    }

    updated[index] = current;
    setItems(updated);
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { id: `item_${Date.now()}`, description: '', quantity: 1, unit_price: 0, amount: 0 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateNewClient = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newClientName.trim() || !newClientEmail.trim()) {
      showToast('Client Name and Email are required.', 'error');
      return;
    }

    const created = await addClient({
      name: newClientName.trim(),
      email: newClientEmail.trim(),
      company: newClientCompany.trim() || undefined,
      phone: newClientPhone.trim() || undefined,
      address: newClientAddress.trim() || undefined,
      city: newClientCity.trim() || undefined,
      country: newClientCountry.trim() || undefined,
      tax_id: newClientTaxId.trim() || undefined,
    });

    if (created) {
      setSelectedClientId(created.id);
      setShowNewClientForm(false);
      setIsClientDropdownOpen(false);
      setNewClientName('');
      setNewClientEmail('');
      setNewClientCompany('');
      setNewClientPhone('');
      setNewClientAddress('');
      setNewClientCity('');
      setNewClientCountry('');
      setNewClientTaxId('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let clientIdToUse = selectedClientId;

    if (showNewClientForm && newClientName.trim() && newClientEmail.trim()) {
      const created = await addClient({
        name: newClientName.trim(),
        email: newClientEmail.trim(),
        company: newClientCompany.trim() || undefined,
        phone: newClientPhone.trim() || undefined,
        address: newClientAddress.trim() || undefined,
        city: newClientCity.trim() || undefined,
        country: newClientCountry.trim() || undefined,
        tax_id: newClientTaxId.trim() || undefined,
      });
      if (created) {
        clientIdToUse = created.id;
      } else {
        return;
      }
    }

    if (!clientIdToUse) {
      showToast('Please select or add a client.', 'error');
      return;
    }

    setIsSubmitting(true);

    if (isEditMode && editingInvoice) {
      const res = await updateInvoice(editingInvoice.id, {
        client_id: clientIdToUse,
        number,
        status,
        issue_date: issueDate,
        due_date: dueDate,
        currency,
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        discount,
        total,
        notes,
        terms,
        template,
        items,
      });

      setIsSubmitting(false);

      if (res.success && res.invoice) {
        setEditingInvoice(null);
        onSuccess(res.invoice.id);
      }
    } else {
      const res = await createInvoice({
        client_id: clientIdToUse,
        number,
        status,
        issue_date: issueDate,
        due_date: dueDate,
        currency,
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        discount,
        total,
        notes,
        terms,
        template,
        items,
      });

      setIsSubmitting(false);

      if (res.success && res.invoice) {
        onSuccess(res.invoice.id);
      }
    }
  };

  const activeClient: Client = selectedClient || {
    id: 'temp',
    user_id: '',
    name: newClientName || 'Recipient Client',
    email: newClientEmail || 'client@example.com',
    company: newClientCompany || 'Company',
    phone: newClientPhone || '',
    address: newClientAddress || '',
    created_at: '',
  };

  const currentInvoiceDraftObj = {
    id: editingInvoice?.id || 'draft',
    user_id: 'draft',
    client_id: selectedClientId,
    client: activeClient,
    number,
    status,
    issue_date: issueDate,
    due_date: dueDate,
    currency,
    subtotal,
    tax_rate: taxRate,
    tax_amount: taxAmount,
    discount,
    total,
    notes,
    terms,
    template,
    created_at: editingInvoice?.created_at || new Date().toISOString(),
    items,
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            {isEditMode ? `Edit Invoice (${editingInvoice?.number})` : 'Create New Invoice'}
          </h2>
          <p className="text-xs text-slate-500">
            {isEditMode
              ? 'Update recipient, line items, rates, and terms'
              : 'Fill in details or generate automatically with Gemini AI'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isEditMode && onOpenAiModal && (
            <button
              type="button"
              onClick={onOpenAiModal}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 rounded-xl text-xs font-bold transition-all shadow-2xs"
            >
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Prompt AI</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200"
          >
            {previewMode ? (
              <>
                <Edit3 className="w-4 h-4 text-blue-600" />
                <span>Edit Form</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 text-blue-600" />
                <span>Preview PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {previewMode ? (
        <div className="space-y-4">
          {/* Template Switcher Bar in Preview */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-800">Choose Template Style:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full sm:w-auto">
              {INVOICE_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => setTemplate(tmpl.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                    template === tmpl.id
                      ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${template === tmpl.id ? 'bg-blue-600' : 'bg-slate-300'}`} />
                  <span>{tmpl.name}</span>
                </button>
              ))}
            </div>
          </div>

          <InvoiceTemplate invoice={currentInvoiceDraftObj} business={business} forcedTemplate={template} />

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setPreviewMode(false)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              Back to Editing
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/20 transition-all"
            >
              {isSubmitting
                ? 'Saving Invoice...'
                : isEditMode
                ? 'Save Changes'
                : 'Save & Issue Invoice'}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Client Selection & Metadata */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                Recipient & Invoice Details
              </h3>
              {clients.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowNewClientForm(!showNewClientForm)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{showNewClientForm ? 'Choose Existing Client' : '+ Add New Client'}</span>
                </button>
              )}
            </div>

            {/* Client Section */}
            {showNewClientForm || clients.length === 0 ? (
              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-blue-800 uppercase tracking-wider">
                    {clients.length === 0 ? 'Add Your First Client' : 'New Client Details'}
                  </span>
                  {clients.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowNewClientForm(false)}
                      className="text-xs text-slate-500 hover:text-slate-700"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Sarah Connor"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Email Address *</label>
                    <input
                      type="email"
                      placeholder="sarah@example.com"
                      value={newClientEmail}
                      onChange={(e) => setNewClientEmail(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Company</label>
                    <input
                      type="text"
                      placeholder="Cyberdyne Systems"
                      value={newClientCompany}
                      onChange={(e) => setNewClientCompany(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Phone</label>
                    <input
                      type="text"
                      placeholder="+1 (555) 019-2831"
                      value={newClientPhone}
                      onChange={(e) => setNewClientPhone(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Street Address</label>
                    <input
                      type="text"
                      placeholder="123 Tech Blvd"
                      value={newClientAddress}
                      onChange={(e) => setNewClientAddress(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Tax / VAT ID</label>
                    <input
                      type="text"
                      placeholder="US-9918231"
                      value={newClientTaxId}
                      onChange={(e) => setNewClientTaxId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => handleCreateNewClient()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs"
                  >
                    Save & Select Client
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Searchable / Selectable Client Dropdown */}
                <div className="relative">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Select Client *</label>
                  <button
                    type="button"
                    onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-2xl px-4 py-3 text-left flex items-center justify-between text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {selectedClient ? (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                          {selectedClient.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">
                            {selectedClient.name} {selectedClient.company ? `(${selectedClient.company})` : ''}
                          </div>
                          <div className="text-xs text-slate-400">
                            {selectedClient.email} {selectedClient.phone ? `• ${selectedClient.phone}` : ''}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400">Choose a client...</span>
                    )}
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>

                  {isClientDropdownOpen && (
                    <div className="absolute z-30 left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-slide-up">
                      <div className="p-2.5 border-b border-slate-100">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Search clients by name, email, or company..."
                            value={clientSearchQuery}
                            onChange={(e) => setClientSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                            autoFocus
                          />
                        </div>
                      </div>

                      <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
                        {filteredClients.length > 0 ? (
                          filteredClients.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setSelectedClientId(c.id);
                                setIsClientDropdownOpen(false);
                                setClientSearchQuery('');
                              }}
                              className={`w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-slate-50 transition-colors ${
                                selectedClientId === c.id ? 'bg-blue-50/60' : ''
                              }`}
                            >
                              <div>
                                <div className="text-xs font-bold text-slate-800">
                                  {c.name} {c.company ? `(${c.company})` : ''}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  {c.email} {c.phone ? `• ${c.phone}` : ''}
                                </div>
                              </div>
                              {selectedClientId === c.id && (
                                <Check className="w-4 h-4 text-blue-600 shrink-0" />
                              )}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-xs text-slate-400 text-center">
                            No clients match "{clientSearchQuery}"
                          </div>
                        )}
                      </div>

                      <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                        <span className="text-[11px] text-slate-500">{clients.length} total client(s)</span>
                        <button
                          type="button"
                          onClick={() => {
                            setShowNewClientForm(true);
                            setIsClientDropdownOpen(false);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add New Client</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Invoice Number</label>
                <input
                  type="text"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {SUPPORTED_CURRENCIES.map((curr) => (
                    <option key={curr.code} value={curr.code}>
                      {curr.code} ({curr.symbol}) - {curr.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Issue Date</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 1.5: Invoice Template Selection */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LayoutTemplate className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                  Invoice Style & Template
                </h3>
              </div>
              <span className="text-xs text-blue-600 font-bold capitalize">
                Selected: {INVOICE_TEMPLATES.find((t) => t.id === template)?.name}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {INVOICE_TEMPLATES.map((tmpl) => {
                const isSelected = template === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => setTemplate(tmpl.id)}
                    className={`relative p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-50/60 border-blue-500 shadow-2xs ring-1 ring-blue-500/50'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-xs font-bold ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}>
                          {tmpl.name}
                        </span>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        {tmpl.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {tmpl.id === 'modern' && 'Clean Blue Accent'}
                        {tmpl.id === 'professional' && 'Deep Navy • Formal'}
                        {tmpl.id === 'minimal' && 'Monochrome • Spacious'}
                        {tmpl.id === 'corporate' && 'Emerald & Slate'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Line Items */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Line Items</h3>
                {products.length > 0 && (
                  <span className="text-[11px] text-blue-600 font-semibold flex items-center gap-1">
                    <Package className="w-3 h-3" /> {products.length} catalog items available
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {products.length > 0 && (
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      if (!e.target.value) return;
                      const selectedProd = products.find((p) => p.id === e.target.value);
                      if (selectedProd) {
                        setItems((prev) => [
                          ...prev,
                          {
                            id: `item_${Date.now()}`,
                            description: selectedProd.name + (selectedProd.description ? ` - ${selectedProd.description}` : ''),
                            quantity: 1,
                            unit_price: selectedProd.unit_price,
                            amount: selectedProd.unit_price,
                          },
                        ]);
                      }
                      e.target.value = '';
                    }}
                    className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl border border-slate-200 cursor-pointer"
                  >
                    <option value="" disabled>
                      + Insert from Catalog
                    </option>
                    {products.map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.name} ({currency} {(Number(prod.unit_price) || 0).toFixed(2)})
                      </option>
                    ))}
                  </select>
                )}
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Item</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.id || index}
                  className="grid grid-cols-12 gap-2.5 items-center bg-slate-50 p-3 rounded-2xl border border-slate-200"
                >
                  <div className="col-span-12 sm:col-span-6 space-y-1">
                    <input
                      type="text"
                      placeholder="Item description or service..."
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div className="col-span-4 sm:col-span-2 space-y-1">
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div className="col-span-4 sm:col-span-2 space-y-1">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Price"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 text-right focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div className="col-span-3 sm:col-span-1 text-right font-black text-xs text-slate-900">
                    {currency} {(Number(item.amount) || 0).toFixed(2)}
                  </div>

                  <div className="col-span-1 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors"
                      disabled={items.length <= 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Notes, Terms & Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-2xs">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Notes to Client</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Additional instructions, project details..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Terms & Conditions</label>
                <textarea
                  rows={2}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Payment due in 14 days..."
                />
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-600 font-medium">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-900">
                    {currency} {subtotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center gap-4 text-xs">
                  <span className="text-slate-600 font-medium">Discount ({currency})</span>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-24 bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-right text-slate-800 font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-between items-center gap-4 text-xs">
                  <span className="text-slate-600 font-medium">Tax Rate (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="w-24 bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-right text-slate-800 font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                {taxAmount > 0 && (
                  <div className="flex justify-between items-center text-xs text-slate-600 font-medium">
                    <span>Tax Amount</span>
                    <span className="font-bold text-slate-900">
                      {currency} {taxAmount.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-base font-extrabold text-slate-900">
                <span>Total Due</span>
                <span className="text-xl text-blue-600">
                  {currency} {total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                if (isEditMode) setEditingInvoice(null);
                onCancel();
              }}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/20 transition-all"
            >
              {isSubmitting
                ? 'Saving...'
                : isEditMode
                ? 'Save Changes'
                : 'Save & Issue Invoice'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
