const API_BASE_URL = 'http://localhost:3001/api';

import { CartItem } from '@/context/CartContext';
import * as XLSX from 'xlsx';
import { createStockMovement } from './stockService';

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  delivery_mode: string;
  notes: string | null;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
}

export interface CreateOrderData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  deliveryMode: string;
  orderDate: string;
  orderTime: string;
  notes: string;
  products: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  total: number;
}

export const createOrder = async (orderData: CreateOrderData): Promise<boolean> => {
  try {
    console.log('Création de la commande:', orderData);

    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erreur lors de la création de la commande:', errorData);
      return false;
    }

    console.log('Commande créée avec succès');
    return true;

  } catch (error) {
    console.error('Erreur inattendue lors de la création de la commande:', error);
    return false;
  }
};

// Renommer getOrders en getAllOrders pour correspondre à l'usage
export const getAllOrders = async (): Promise<Order[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders`);
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des commandes');
    }
    const orders = await response.json();

    // Transformer les données pour maintenir la compatibilité avec l'ancien format
    return orders.map((order: unknown) => {
      const o = order as any;
      return {
        id: o.id,
        order_number: o.orderNumber,
        customer_name: o.customerName,
        customer_email: o.customerEmail,
        customer_phone: o.customerPhone,
        customer_address: o.customerAddress,
        delivery_mode: o.deliveryMode,
        notes: o.notes,
        total_amount: Number(o.totalAmount),
        status: o.status,
        created_at: o.createdAt,
        updated_at: o.updatedAt,
        items: o.orderItems?.map((item: any) => ({
          id: item.id,
          order_id: item.orderId,
          product_name: item.productName,
          quantity: item.quantity,
          unit_price: Number(item.unitPrice),
          subtotal: Number(item.subtotal),
          created_at: item.createdAt,
        })),
      };
    });
  } catch (error) {
    console.error('Erreur inattendue lors de la récupération des commandes:', error);
    return [];
  }
};

// Garder l'ancienne fonction pour la compatibilité
export const getOrders = getAllOrders;

export const getOrderItems = async (orderId: string): Promise<OrderItem[]> => {
  try {
    // Pour l'instant, récupérer toutes les commandes et filtrer les items
    const orders = await getAllOrders();
    const order = orders.find(o => o.id === orderId);
    return order ? order.items : [];
  } catch (error) {
    console.error('Erreur inattendue lors de la récupération des articles:', error);
    return [];
  }
};

export const updateOrderStatus = async (orderId: string, newStatus: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la mise à jour du statut');
    }

    return true;
  } catch (error) {
    console.error('Erreur inattendue lors de la mise à jour du statut:', error);
    return false;
  }
};

// Fonction helper pour gérer les mouvements de stock
// Note: Cette fonction utilise Prisma côté client, ce qui n'est pas recommandé.
// Elle devrait être déplacée côté serveur si nécessaire.
const handleStockMovementsForStatusChange = async (
  oldStatus: string,
  newStatus: string,
  orderItems: Array<{ productName: string; quantity: number }>,
  orderNumber: string
) => {
  try {
    // Cette fonction est actuellement désactivée car elle utilise Prisma côté client
    // Elle devrait être implémentée côté serveur si nécessaire
    console.log('Gestion des mouvements de stock désactivée côté client');
  } catch (error) {
    console.error('Erreur lors de la gestion des mouvements de stock:', error);
  }
};

// Nouvelle fonction pour exporter les commandes en Excel
export const exportOrdersToExcel = async (orders: Order[]): Promise<void> => {
  try {
    // Préparer les données pour l'export
    const exportData = orders.map(order => ({
      'N° Commande': order.order_number,
      'Date': new Date(order.created_at).toLocaleDateString('fr-FR'),
      'Client': order.customer_name,
      'Email': order.customer_email,
      'Téléphone': order.customer_phone,
      'Adresse': order.customer_address,
      'Mode de livraison': order.delivery_mode,
      'Montant Total (FCFA)': order.total_amount,
      'Statut': order.status,
      'Notes': order.notes || ''
    }));

    // Créer le workbook et la worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Ajouter la worksheet au workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Commandes');

    // Générer le nom du fichier avec la date
    const fileName = `commandes_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Télécharger le fichier
    XLSX.writeFile(wb, fileName);
  } catch (error) {
    console.error('Erreur lors de l\'export Excel:', error);
    throw error;
  }
};
