export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number; // in cents
  total: number; // quantity * unitPrice
}

export interface InvoiceData {
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  clientName: string;
  clientEmail: string;
  clientAddress?: string;
  lineItems: InvoiceLineItem[];
  subtotal: number; // in cents
  taxRate: number; // e.g., 0.08 for 8%
  taxAmount: number; // in cents
  total: number; // in cents
  notes?: string;
  status: "draft" | "sent" | "paid" | "overdue" | "void";
}

/**
 * Generate a unique invoice number.
 * Format: INV-YYYYMM-XXXX (e.g., INV-202603-0001)
 */
export function generateInvoiceNumber(sequenceNumber: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const seq = String(sequenceNumber).padStart(4, "0");
  return `INV-${year}${month}-${seq}`;
}

/**
 * Calculate invoice totals from line items.
 */
export function calculateInvoiceTotals(
  lineItems: Omit<InvoiceLineItem, "total">[],
  taxRate: number,
): {
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
} {
  const completedLineItems: InvoiceLineItem[] = lineItems.map((item) => ({
    ...item,
    total: item.quantity * item.unitPrice,
  }));

  const subtotal = completedLineItems.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = Math.round(subtotal * taxRate);
  const total = subtotal + taxAmount;

  return { lineItems: completedLineItems, subtotal, taxAmount, total };
}

/**
 * Format a money amount from cents to display string.
 */
export function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

/**
 * Check if an invoice is overdue.
 */
export function isOverdue(invoice: { dueDate: Date; status: string }): boolean {
  if (invoice.status === "paid" || invoice.status === "void") {
    return false;
  }
  return new Date() > invoice.dueDate;
}

/**
 * Get invoice status badge color for UI.
 */
export function getStatusColor(status: InvoiceData["status"]): string {
  switch (status) {
    case "draft":
      return "gray";
    case "sent":
      return "blue";
    case "paid":
      return "green";
    case "overdue":
      return "red";
    case "void":
      return "yellow";
    default:
      return "gray";
  }
}
