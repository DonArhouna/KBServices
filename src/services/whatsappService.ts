import { QuoteWithItems } from './quoteService';

const WHATSAPP_PHONE = '221770299821';
const WHATSAPP_API_KEY = '4114913';

export const sendWhatsAppMessage = async (message: string): Promise<void> => {
  // Nettoyer et valider le numéro de téléphone
  const cleanPhone = WHATSAPP_PHONE.replace(/\s+/g, '').replace(/^\+/, '');
  console.log('Numéro WhatsApp nettoyé:', cleanPhone);

  // Encoder le message
  const encodedMessage = encodeURIComponent(message);
  console.log('Message encodé:', encodedMessage.substring(0, 100) + '...');

  // Construire l'URL
  const url = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodedMessage}&apikey=${WHATSAPP_API_KEY}`;
  console.log('URL complète générée:', url);

  try {
    console.log('🚀 Début envoi message WhatsApp...');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'KB&S-App/1.0'
      }
    });

    console.log('📡 Statut HTTP:', response.status, response.statusText);
    console.log('📡 Headers de réponse:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('📄 Contenu complet de la réponse:', responseText);

    if (!response.ok) {
      console.error('❌ Erreur HTTP détectée');
      throw new Error(`Erreur HTTP ${response.status}: ${responseText}`);
    }

    // Vérifier différentes réponses de succès possibles
    const lowerResponse = responseText.toLowerCase();
    const successIndicators = ['success', 'sent', 'message sent', 'ok', 'delivered'];

    const isSuccess = successIndicators.some(indicator => lowerResponse.includes(indicator));

    if (isSuccess) {
      console.log('✅ Message WhatsApp envoyé avec succès');
    } else {
      console.warn('⚠️ Réponse inattendue de CallMeBot, mais pas d\'erreur HTTP:', responseText);
      // Ne pas throw d'erreur ici car CallMeBot peut renvoyer du texte même en cas de succès
    }

  } catch (error) {
    console.error('❌ Erreur détaillée lors de l\'envoi WhatsApp:', error);

    // Log des informations de debug
    console.error('🔍 Informations de debug:');
    console.error('- Numéro:', cleanPhone);
    console.error('- Clé API:', WHATSAPP_API_KEY ? 'Définie' : 'Non définie');
    console.error('- Longueur message:', message.length);
    console.error('- URL (tronquée):', url.substring(0, 100) + '...');

    throw error;
  }
};

interface OrderData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  deliveryMode: string;
  orderDate: string;
  orderTime: string;
  products: Array<{
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  total: number;
  notes?: string;
}

export const sendOrderWhatsApp = async (orderData: OrderData): Promise<void> => {
  console.log('🚀 Début envoi commande WhatsApp...');

  try {
    // Formater la commande pour WhatsApp
    const orderMessage = formatOrderForWhatsApp(orderData);
    await sendWhatsAppMessage(orderMessage);
    console.log('✅ Commande WhatsApp envoyée avec succès');

  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi commande WhatsApp:', error);
    throw error;
  }
};

export const formatQuoteForWhatsApp = (quote: QuoteWithItems): string => {
  const validityText = quote.validity_date 
    ? `\n📅 Valide jusqu'au: ${new Date(quote.validity_date).toLocaleDateString('fr-FR')}`
    : '';

  const itemsText = quote.quote_items.map(item => {
    const description = item.description ? `\n   ${item.description}` : '';
    return `• ${item.service_name}${description}\n   Qté: ${item.quantity} | Prix: ${item.unit_price.toLocaleString()} FCFA | Total: ${item.subtotal.toLocaleString()} FCFA`;
  }).join('\n');

  const notesText = quote.notes ? `\n📝 Notes:\n${quote.notes}` : '';

  return `
🏢 *KB&S - DEVIS ${quote.quote_number}*

👤 *Client:* ${quote.customer_name}
${quote.customer_company ? `🏢 *Entreprise:* ${quote.customer_company}` : ''}
📧 *Email:* ${quote.customer_email}
📞 *Téléphone:* ${quote.customer_phone || 'Non renseigné'}
${quote.customer_address ? `📍 *Adresse:* ${quote.customer_address}` : ''}${validityText}

🛍️ *Services proposés:*
${itemsText}

💰 *TOTAL: ${quote.total_amount.toLocaleString()} FCFA*${notesText}

📞 Contact: +221 77 029 98 21
✉️ Email: kewekane@yahoo.fr

Merci de votre confiance !
`.trim();
};

interface OrderProduct {
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface WhatsAppOrder {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  deliveryMode: string;
  orderDate: string;
  orderTime: string;
  products: OrderProduct[];
  total: number;
  notes?: string;
}

export const formatOrderForWhatsApp = (order: WhatsAppOrder): string => {
  const itemsText = order.products.map((product: OrderProduct) => {
    return `• ${product.name}\n   Qté: ${product.quantity} | Prix: ${product.price.toLocaleString()} FCFA | Total: ${product.subtotal.toLocaleString()} FCFA`;
  }).join('\n');

  const notesText = order.notes ? `\n📝 Notes:\n${order.notes}` : '';

  return `
🏢 *KB&S - COMMANDE ${order.orderNumber}*

👤 *Client:* ${order.customerName}
📧 *Email:* ${order.customerEmail}
📞 *Téléphone:* ${order.customerPhone}
📍 *Adresse:* ${order.customerAddress}
🚚 *Mode de livraison:* ${order.deliveryMode}
📅 *Date:* ${order.orderDate}
🕒 *Heure:* ${order.orderTime}

🛍️ *Produits commandés:*
${itemsText}

💰 *TOTAL: ${order.total.toLocaleString()} FCFA*${notesText}

📞 Contact: +221 77 029 98 21
✉️ Email: kewekane@yahoo.fr

Merci de votre confiance !
`.trim();
};