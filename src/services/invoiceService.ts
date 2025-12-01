import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

// Types
export type Invoice = Tables<"invoices">;
export type InvoiceItem = Tables<"invoice_items">;
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceWithItems extends Invoice {
  invoice_items: InvoiceItem[];
}

export interface CreateInvoiceData {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_address?: string;
  due_date: string;
  status?: InvoiceStatus;
  notes?: string;
  total_amount: number;
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }>;
}

// Générer un numéro de facture unique
export const generateInvoiceNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const timestamp = now.getTime();
  return `FACT-${year}${month}-${timestamp.toString().slice(-6)}`;
};

// Base URL pour les appels API
const API_BASE = '/api';

// Récupérer toutes les factures avec leurs articles
export const getInvoices = async (): Promise<InvoiceWithItems[]> => {
  try {
    const response = await fetch(`${API_BASE}/invoices`);
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error("Erreur lors de la récupération des factures:", error);
    throw error;
  }
};

// Récupérer une facture spécifique avec ses articles
export const getInvoice = async (id: string): Promise<InvoiceWithItems> => {
  try {
    const response = await fetch(`${API_BASE}/invoices/${id}`);
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erreur lors de la récupération de la facture:", error);
    throw error;
  }
};

// Créer une nouvelle facture
export const createInvoice = async (invoiceData: CreateInvoiceData): Promise<Invoice> => {
  try {
    const response = await fetch(`${API_BASE}/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoiceData),
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const invoice = await response.json();
    return invoice;
  } catch (error) {
    console.error("Erreur lors de la création de la facture:", error);
    throw error;
  }
};

// Mettre à jour une facture
export const updateInvoice = async (id: string, updates: Partial<Invoice>): Promise<Invoice> => {
  try {
    const response = await fetch(`${API_BASE}/invoices/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la facture:", error);
    throw error;
  }
};

// Mettre à jour le statut d'une facture
export const updateInvoiceStatus = async (id: string, status: InvoiceStatus): Promise<Invoice> => {
  try {
    const response = await fetch(`${API_BASE}/invoices/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut de la facture:", error);
    throw error;
  }
};

// Supprimer une facture
export const deleteInvoice = async (id: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE}/invoices/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
  } catch (error) {
    console.error("Erreur lors de la suppression de la facture:", error);
    throw error;
  }
};