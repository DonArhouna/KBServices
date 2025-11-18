import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Service = Tables<"services">;
export type Quote = Tables<"quotes">;
export type QuoteItem = Tables<"quote_items">;

// Types pour les services et devis
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'converted';

export interface Service {
  id: string;
  name: string;
  description: string | null;
  unit_price: number;
  unit: string;
  category: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  service_id: string | null;
  service_name: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
}

export interface Quote {
  id: string;
  quote_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_address: string | null;
  customer_company: string | null;
  status: QuoteStatus;
  total_amount: number;
  validity_date: string | null;
  notes: string | null;
  terms_conditions: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuoteWithItems extends Quote {
  quote_items: QuoteItem[];
}

export interface CreateQuoteData {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_address?: string;
  customer_company?: string;
  validity_date?: string;
  notes?: string;
  terms_conditions?: string;
  items: {
    service_id?: string;
    service_name: string;
    description?: string;
    quantity: number;
    unit_price: number;
  }[];
}

// Base URL pour les appels API
// Changer l'URL de base pour pointer vers le port 3001
const API_BASE = 'http://localhost:3001/api';

// Generate quote number
export const generateQuoteNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const time = String(now.getTime()).slice(-6);
  return `DEV-${year}${month}${day}-${time}`;
};

// Services functions
export const getServices = async (): Promise<Service[]> => {
  const response = await fetch(`${API_BASE}/services?active=true`);
  if (!response.ok) {
    throw new Error(`Erreur lors de la récupération des services: ${response.statusText}`);
  }
  return response.json();
};

export const createService = async (service: Omit<Service, 'id' | 'created_at' | 'updated_at' | 'is_active'>) => {
  const response = await fetch(`${API_BASE}/services`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(service),
  });
  
  if (!response.ok) {
    throw new Error(`Erreur lors de la création du service: ${response.statusText}`);
  }
  
  return response.json();
};

export const updateService = async (id: string, service: Partial<Service>) => {
  const response = await fetch(`${API_BASE}/services/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(service),
  });
  
  if (!response.ok) {
    throw new Error(`Erreur lors de la mise à jour du service: ${response.statusText}`);
  }
  
  return response.json();
};

export const deleteService = async (id: string) => {
  const response = await fetch(`${API_BASE}/services/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error(`Erreur lors de la suppression du service: ${response.statusText}`);
  }
  
  return response.json();
};

// Quotes functions
export const getQuotes = async (): Promise<QuoteWithItems[]> => {
  const response = await fetch(`${API_BASE}/quotes`);
  
  if (!response.ok) {
    throw new Error(`Erreur lors de la récupération des devis: ${response.statusText}`);
  }
  
  return response.json();
};

export const getQuote = async (id: string): Promise<QuoteWithItems> => {
  const response = await fetch(`${API_BASE}/quotes/${id}`);
  
  if (!response.ok) {
    throw new Error(`Erreur lors de la récupération du devis: ${response.statusText}`);
  }
  
  return response.json();
};

export const createQuote = async (quoteData: CreateQuoteData) => {
  // Calculer le montant total
  const total_amount = quoteData.items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );

  const payload = {
    ...quoteData,
    quote_number: generateQuoteNumber(),
    total_amount,
    status: 'draft' as QuoteStatus,
  };

  const response = await fetch(`${API_BASE}/quotes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    throw new Error(`Erreur lors de la création du devis: ${response.statusText}`);
  }
  
  return response.json();
};

export const updateQuote = async (id: string, quoteData: Partial<Quote>) => {
  const response = await fetch(`${API_BASE}/quotes/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(quoteData),
  });
  
  if (!response.ok) {
    throw new Error(`Erreur lors de la mise à jour du devis: ${response.statusText}`);
  }
  
  return response.json();
};

export const deleteQuote = async (id: string) => {
  const response = await fetch(`${API_BASE}/quotes/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error(`Erreur lors de la suppression du devis: ${response.statusText}`);
  }
  
  return response.json();
};

export const convertQuoteToInvoice = async (id: string) => {
  const response = await fetch(`${API_BASE}/quotes/${id}/convert`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    throw new Error(`Erreur lors de la conversion du devis en facture: ${response.statusText}`);
  }
  
  return response.json();
};