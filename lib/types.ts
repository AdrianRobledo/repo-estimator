export interface LineItem {
  id: number;
  description: string;
  quantity: string;
  price: string;
}

export interface BusinessProfile {
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  logo: string | null;
}

export interface Customer {
  name: string;
  address: string;
  phone: string;
  email: string;
}

export interface EstimateData {
  id: string;
  estimateNumber: string;
  date: string;
  status: string;
  customer: Customer;
  items: LineItem[];
  total: number;
  profile: BusinessProfile | null;
  invoiceId?: string;
}

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  estimateId: string;
  estimateNumber: string;
  date: string;
  dueDate: string;
  status: "unpaid" | "paid";
  customer: Customer;
  items: LineItem[];
  total: number;
  profile: BusinessProfile | null;
  stripeSessionId?: string | null;
  stripePaidAt?: string | null;
}

export interface TemplateData {
  id: string;
  name: string;
  items: LineItem[];
}
