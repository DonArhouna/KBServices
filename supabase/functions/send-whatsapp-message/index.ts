// import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// interface WhatsAppMessage {
//   phone: string;
//   message: string;
//   provider?: 'callmebot' | 'twilio' | '360dialog';
// }

// interface OrderData {
//   orderNumber: string;
//   customerName: string;
//   customerEmail: string;
//   customerPhone: string;
//   customerAddress: string;
//   deliveryMode: string;
//   orderDate: string;
//   orderTime: string;
//   products: Array<{
//     name: string;
//     quantity: number;
//     price: number;
//     subtotal: number;
//   }>;
//   total: number;
//   notes?: string;
// }

// const WHATSAPP_CONFIG = {
//   callmebot: {
//     phone: '221770299821',
//     apikey: '4114913',
//     baseUrl: 'https://api.callmebot.com/whatsapp.php'
//   }
// };

// async function sendWhatsAppCallMeBot(phone: string, message: string): Promise<{ success: boolean; response: string }> {
//   const cleanPhone = phone.replace(/\s+/g, '').replace(/^\+/, '');
//   const encodedMessage = encodeURIComponent(message);

//   const url = `${WHATSAPP_CONFIG.callmebot.baseUrl}?phone=${cleanPhone}&text=${encodedMessage}&apikey=${WHATSAPP_CONFIG.callmebot.apikey}`;

//   console.log('Envoi WhatsApp CallMeBot vers:', cleanPhone);

//   try {
//     const response = await fetch(url, {
//       method: 'GET',
//       headers: {
//         'Content-Type': 'application/x-www-form-urlencoded',
//         'User-Agent': 'KB&S-EdgeFunction/1.0'
//       }
//     });

//     const responseText = await response.text();
//     console.log('Réponse CallMeBot:', responseText);

//     const lowerResponse = responseText.toLowerCase();
//     const successIndicators = ['success', 'sent', 'message sent', 'ok', 'delivered'];

//     const isSuccess = successIndicators.some(indicator => lowerResponse.includes(indicator));

//     return {
//       success: isSuccess,
//       response: responseText
//     };

//   } catch (error) {
//     console.error('Erreur CallMeBot:', error);
//     return {
//       success: false,
//       response: error.message
//     };
//   }
// }

// function formatOrderMessage(order: OrderData): string {
//   const itemsText = order.products.map(product =>
//     `• ${product.name}\n   Qté: ${product.quantity} | Prix: ${product.price.toLocaleString()} FCFA | Total: ${product.subtotal.toLocaleString()} FCFA`
//   ).join('\n');

//   const notesText = order.notes ? `\n📝 Notes:\n${order.notes}` : '';

//   return `
// 🏢 *KB&S - COMMANDE ${order.orderNumber}*

// 👤 *Client:* ${order.customerName}
// 📧 *Email:* ${order.customerEmail}
// 📞 *Téléphone:* ${order.customerPhone}
// 📍 *Adresse:* ${order.customerAddress}
// 🚚 *Mode de livraison:* ${order.deliveryMode}
// 📅 *Date:* ${order.orderDate}
// 🕒 *Heure:* ${order.orderTime}

// 🛍️ *Produits commandés:*
// ${itemsText}

// 💰 *TOTAL: ${order.total.toLocaleString()} FCFA*${notesText}

// 📞 Contact: +221 77 029 98 21
// ✉️ Email: kewekane@yahoo.fr

// Merci de votre confiance !
// `.trim();
// }

// serve(async (req) => {
//   try {
//     // Gérer les requêtes CORS
//     if (req.method === 'OPTIONS') {
//       return new Response('ok', {
//         headers: {
//           'Access-Control-Allow-Origin': '*',
//           'Access-Control-Allow-Methods': 'POST, OPTIONS',
//           'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
//         }
//       });
//     }

//     if (req.method !== 'POST') {
//       return new Response(JSON.stringify({ error: 'Method not allowed' }), {
//         status: 405,
//         headers: { 'Content-Type': 'application/json' }
//       });
//     }

//     const body = await req.json();
//     console.log('Requête reçue:', body);

//     // Vérifier si c'est une commande ou un message direct
//     if (body.orderData) {
//       // Formatage automatique pour une commande
//       const message = formatOrderMessage(body.orderData);
//       const phone = WHATSAPP_CONFIG.callmebot.phone;

//       console.log('Envoi de commande WhatsApp...');
//       const result = await sendWhatsAppCallMeBot(phone, message);

//       return new Response(JSON.stringify({
//         success: result.success,
//         message: result.success ? 'Commande WhatsApp envoyée avec succès' : 'Échec envoi WhatsApp',
//         details: result.response
//       }), {
//         status: result.success ? 200 : 500,
//         headers: {
//           'Content-Type': 'application/json',
//           'Access-Control-Allow-Origin': '*'
//         }
//       });

//     } else if (body.message && body.phone) {
//       // Message direct
//       const { message, phone, provider = 'callmebot' } = body as WhatsAppMessage;

//       console.log('Envoi de message WhatsApp direct...');
//       const result = await sendWhatsAppCallMeBot(phone, message);

//       return new Response(JSON.stringify({
//         success: result.success,
//         message: result.success ? 'Message WhatsApp envoyé avec succès' : 'Échec envoi WhatsApp',
//         details: result.response
//       }), {
//         status: result.success ? 200 : 500,
//         headers: {
//           'Content-Type': 'application/json',
//           'Access-Control-Allow-Origin': '*'
//         }
//       });

//     } else {
//       return new Response(JSON.stringify({
//         error: 'Données manquantes. Fournissez soit orderData soit message + phone'
//       }), {
//         status: 400,
//         headers: { 'Content-Type': 'application/json' }
//       });
//     }

//   } catch (error) {
//     console.error('Erreur dans la fonction Edge:', error);
//     return new Response(JSON.stringify({
//       error: 'Erreur interne du serveur',
//       details: error.message
//     }), {
//       status: 500,
//       headers: { 'Content-Type': 'application/json' }
//     });
//   }
// });

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Types d'entrée
interface WhatsAppMessage {
  phone: string
  message: string
  provider?: "callmebot" | "twilio" | "360dialog"
}

interface OrderData {
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  customerAddress: string
  deliveryMode: string
  orderDate: string
  orderTime: string
  products: Array<{
    name: string
    quantity: number
    price: number
    subtotal: number
  }>
  total: number
  notes?: string
}

// Variables d'environnement
const PORT = Number(Deno.env.get("PORT") ?? "8080")
const CALLMEBOT_PHONE = Deno.env.get("CALLMEBOT_PHONE") ?? "" // ex: 221770299821 (sans +)
const CALLMEBOT_APIKEY = Deno.env.get("CALLMEBOT_APIKEY") ?? ""
const CALLMEBOT_BASE_URL = Deno.env.get("CALLMEBOT_BASE_URL") ?? "https://api.callmebot.com/whatsapp.php"

// En-têtes CORS communs
const baseHeaders: Record<string, string> = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: baseHeaders })
}

// Normalisation stricte du numéro: enlève espaces et +
function normalizePhone(phone: string): string {
  return phone.replace(/\s+/g, "").replace(/^\+/, "")
}

// Validation basique: longueur 8-15 chiffres
function isValidPhone(phone: string): boolean {
  return /^[0-9]{8,15}$/.test(phone)
}

function ensureConfig(): { ok: true } | { ok: false; errors: string[] } {
  const errors: string[] = []
  if (!CALLMEBOT_APIKEY) errors.push("CALLMEBOT_APIKEY is required")
  if (!CALLMEBOT_PHONE) errors.push("CALLMEBOT_PHONE is required")
  if (CALLMEBOT_PHONE && !isValidPhone(normalizePhone(CALLMEBOT_PHONE))) {
    errors.push("CALLMEBOT_PHONE is invalid (digits only, 8-15, no +)")
  }
  return errors.length ? { ok: false, errors } : { ok: true }
}

function formatOrderMessage(order: OrderData): string {
  const itemsText = order.products
    .map(
      (product) =>
        `• ${product.name}
   Qté: ${product.quantity} | Prix: ${product.price.toLocaleString()} FCFA | Total: ${product.subtotal.toLocaleString()} FCFA`,
    )
    .join("\n")

  const notesText = order.notes ? `\n📝 Notes:\n${order.notes}` : ""

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
`.trim()
}

async function sendWhatsAppCallMeBot(
  phone: string,
  message: string,
): Promise<{ success: boolean; response: string; status: number }> {
  const cleanPhone = normalizePhone(phone)
  const encodedMessage = encodeURIComponent(message)

  const url = `${CALLMEBOT_BASE_URL}?phone=${cleanPhone}&text=${encodedMessage}&apikey=${encodeURIComponent(CALLMEBOT_APIKEY)}`
  console.log("[CallMeBot] Sending to:", cleanPhone)

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "KBS-WhatsAppService/1.0",
      },
    })

    const responseText = await response.text()
    console.log("[CallMeBot] HTTP", response.status, "-", response.ok ? "OK" : "NOT OK")

    const lowerResponse = responseText.toLowerCase()
    const successIndicators = ["success", "sent", "message sent", "ok", "delivered"]
    const heuristicSuccess = successIndicators.some((w) => lowerResponse.includes(w))
    const isSuccess = response.ok || heuristicSuccess

    return { success: isSuccess, response: responseText, status: response.status }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error("[CallMeBot] Error:", msg)
    return { success: false, response: msg, status: 0 }
  }
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: baseHeaders })
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405)
  }

  // Vérifier configuration serveur
  const cfg = ensureConfig()
  if (!cfg.ok) {
    return jsonResponse({ error: "Server misconfiguration", details: cfg.errors }, 500)
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400)
  }

  console.log("[Request] payload received")

  const payload = body as Partial<{ orderData: OrderData } & WhatsAppMessage>

  // Mode commande: orderData présent
  if (payload.orderData) {
    const order = payload.orderData

    // Validation minimale
    const minimalOk =
      typeof order.orderNumber === "string" &&
      typeof order.customerName === "string" &&
      Array.isArray(order.products) &&
      typeof order.total === "number"

    if (!minimalOk) {
      return jsonResponse({ error: "Invalid orderData structure" }, 400)
    }

    const message = formatOrderMessage(order)
    const defaultPhone = normalizePhone(CALLMEBOT_PHONE)
    if (!isValidPhone(defaultPhone)) {
      return jsonResponse({ error: "Configured CALLMEBOT_PHONE is invalid" }, 500)
    }

    console.log("[Action] Sending order message...")
    const result = await sendWhatsAppCallMeBot(defaultPhone, message)

    return jsonResponse(
      {
        success: result.success,
        message: result.success ? "Commande WhatsApp envoyée avec succès" : "Échec envoi WhatsApp",
        details: result.response,
        providerStatus: result.status,
      },
      result.success ? 200 : 502,
    )
  }

  // Mode message direct
  if (payload.message && payload.phone) {
    const provider = payload.provider ?? "callmebot"
    if (provider !== "callmebot") {
      return jsonResponse({ error: "Provider not implemented", provider }, 400)
    }

    const phone = normalizePhone(payload.phone)
    if (!isValidPhone(phone)) {
      return jsonResponse({ error: "Numéro de téléphone invalide. Utilisez un format international sans + ni espaces." }, 400)
    }
    if (typeof payload.message !== "string" || !payload.message.trim()) {
      return jsonResponse({ error: "Message invalide" }, 400)
    }

    console.log("[Action] Sending direct message...")
    const result = await sendWhatsAppCallMeBot(phone, payload.message.trim())

    return jsonResponse(
      {
        success: result.success,
        message: result.success ? "Message WhatsApp envoyé avec succès" : "Échec envoi WhatsApp",
        details: result.response,
        providerStatus: result.status,
      },
      result.success ? 200 : 502,
    )
  }

  return jsonResponse({ error: "Données manquantes. Fournissez soit orderData soit message + phone" }, 400)
})

// Log de démarrage (utile si vous exécutez hors Supabase)
console.log(`WhatsApp service ready on :${PORT} (Edge Function handler registered)`)