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
  address: string;
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
  jobDate?: string;
  jobTitle?: string;
  status: string;
  customer: Customer;
  items: LineItem[];
  notes?: string;
  total: number;
  profile: BusinessProfile | null;
  invoiceId?: string;
  invoiceNumber?: string;
}

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  estimateId: string;
  estimateNumber: string;
  date: string;
  dueDate: string;
  status: "unpaid" | "paid";
  jobTitle?: string;
  customer: Customer;
  items: LineItem[];
  total: number;
  profile: BusinessProfile | null;
  stripeSessionId?: string | null;
  stripePaidAt?: string | null;
}

export interface ClientData {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  estimateCount?: number;
}

export interface TemplateData {
  id: string;
  name: string;
  jobTitle?: string;
  items: LineItem[];
  clientMessage?: string;
  disclaimer?: string;
}
