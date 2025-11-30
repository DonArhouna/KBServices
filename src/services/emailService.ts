
import { supabase } from '@/integrations/supabase/client';

export interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  deliveryMode: string;
  notes: string;
  products: Array<{
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  total: number;
  orderDate: string;
  orderTime: string;
}

export const sendOrderEmail = async (orderData: OrderEmailData): Promise<boolean> => {
  try {
    console.log('Tentative d\'envoi d\'email avec les données:', orderData);
    
    const { data, error } = await supabase.functions.invoke('send-order-email', {
      body: {
        to: 'kewekane@yahoo.fr',
        subject: `Nouvelle commande KB&S - ${orderData.orderNumber}`,
        orderData
      }
    });

    console.log('Réponse de la fonction edge:', { data, error });

    if (error) {
      console.error('Erreur lors de l\'invocation de la fonction edge:', error);
      console.error('Message d\'erreur détaillé:', error.message);
      console.error('Détails de l\'erreur:', error.details || 'Aucun détail disponible');
      return false;
    }

    console.log('Email envoyé avec succès:', data);
    return true;
  } catch (error) {
    console.error('Erreur inattendue lors de l\'envoi de l\'email:', error);
    console.error('Type d\'erreur:', typeof error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'Pas de stack trace');
    return false;
  }
};

export const openEmailClient = (clientType: 'gmail' | 'outlook' | 'default') => {
  const to = 'kewekane@yahoo.fr';
  const subject = 'Demande d\'information - KB&S';
  const body = 'Bonjour,\n\nJe souhaiterais avoir des informations sur vos produits.\n\nCordialement,';
  
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);
  
  let url = '';
  
  switch (clientType) {
    case 'gmail':
      url = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${encodedSubject}&body=${encodedBody}`;
      break;
    case 'outlook':
      url = `https://outlook.live.com/mail/0/deeplink/compose?to=${to}&subject=${encodedSubject}&body=${encodedBody}`;
      break;
    case 'default':
    default:
      url = `mailto:${to}?subject=${encodedSubject}&body=${encodedBody}`;
      break;
  }
  
  window.open(url, '_blank');
};
