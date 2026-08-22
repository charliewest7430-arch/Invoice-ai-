import { Invoice, Client, Payment, Activity } from '../types';

/**
 * Escapes a single CSV value to prevent injection and format breaking.
 */
function escapeCsvValue(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  // If contains double quotes, commas, or newlines, wrap in quotes and escape internal quotes
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Converts headers and rows array into a downloadable CSV blob and triggers download.
 */
export function downloadCsv(filename: string, headers: string[], rows: (string | number | boolean | null | undefined)[][]): boolean {
  try {
    const csvContent = [
      headers.map(escapeCsvValue).join(','),
      ...rows.map((row) => row.map(escapeCsvValue).join(',')),
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Failed to export CSV:', error);
    return false;
  }
}

/**
 * Exports user's invoices to a structured CSV.
 */
export function exportInvoicesToCsv(invoices: Invoice[], filename = `invoices-export-${new Date().toISOString().split('T')[0]}.csv`): boolean {
  const headers = [
    'Invoice Number',
    'Client Name',
    'Client Email',
    'Client Company',
    'Status',
    'Issue Date',
    'Due Date',
    'Currency',
    'Subtotal',
    'Tax Rate (%)',
    'Tax Amount',
    'Discount',
    'Total Amount',
    'Notes',
    'Terms',
    'Created At',
    'Paid At',
  ];

  const rows = invoices.map((inv) => [
    inv.number,
    inv.client?.name || '',
    inv.client?.email || '',
    inv.client?.company || '',
    inv.status.toUpperCase(),
    inv.issue_date,
    inv.due_date,
    inv.currency,
    (Number(inv.subtotal) || 0).toFixed(2),
    inv.tax_rate,
    (Number(inv.tax_amount) || 0).toFixed(2),
    (Number(inv.discount) || 0).toFixed(2),
    (Number(inv.total) || 0).toFixed(2),
    inv.notes || '',
    inv.terms || '',
    inv.created_at ? new Date(inv.created_at).toLocaleString() : '',
    inv.paid_at ? new Date(inv.paid_at).toLocaleString() : '',
  ]);

  return downloadCsv(filename, headers, rows);
}

/**
 * Exports user's client list to a structured CSV.
 */
export function exportClientsToCsv(
  clients: Client[],
  invoices: Invoice[] = [],
  filename = `clients-export-${new Date().toISOString().split('T')[0]}.csv`
): boolean {
  const headers = [
    'Client Name',
    'Email Address',
    'Company',
    'Phone Number',
    'Address',
    'City',
    'Country',
    'Tax ID / VAT',
    'Total Invoices',
    'Total Billed Amount',
    'Date Added',
  ];

  const rows = clients.map((client) => {
    const clientInvoices = invoices.filter((i) => i.client_id === client.id);
    const totalBilled = clientInvoices.reduce((sum, i) => sum + (i.total || 0), 0);

    return [
      client.name,
      client.email,
      client.company || '',
      client.phone || '',
      client.address || '',
      client.city || '',
      client.country || '',
      client.tax_id || '',
      clientInvoices.length,
      (Number(totalBilled) || 0).toFixed(2),
      client.created_at ? new Date(client.created_at).toLocaleDateString() : '',
    ];
  });

  return downloadCsv(filename, headers, rows);
}

/**
 * Exports user's payments history to CSV.
 */
export function exportPaymentsToCsv(
  payments: Payment[],
  filename = `payments-export-${new Date().toISOString().split('T')[0]}.csv`
): boolean {
  const headers = [
    'Reference',
    'Invoice Number',
    'Amount',
    'Currency',
    'Status',
    'Channel',
    'Payment Date',
    'Created At',
  ];

  const rows = payments.map((p) => [
    p.paystack_reference,
    p.invoice_number || '',
    (Number(p.amount) || 0).toFixed(2),
    p.currency,
    p.status.toUpperCase(),
    p.channel || 'Card',
    p.paid_at ? new Date(p.paid_at).toLocaleString() : '',
    p.created_at ? new Date(p.created_at).toLocaleString() : '',
  ]);

  return downloadCsv(filename, headers, rows);
}

/**
 * Exports user's activity log to CSV.
 */
export function exportActivitiesToCsv(
  activities: Activity[],
  filename = `activities-export-${new Date().toISOString().split('T')[0]}.csv`
): boolean {
  const headers = [
    'Action Type',
    'Description',
    'Date & Time',
  ];

  const rows = activities.map((a) => [
    a.type,
    a.description,
    a.created_at ? new Date(a.created_at).toLocaleString() : '',
  ]);

  return downloadCsv(filename, headers, rows);
}
