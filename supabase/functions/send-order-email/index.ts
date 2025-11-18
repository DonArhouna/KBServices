
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

interface OrderData {
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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, orderData }: { to: string; subject: string; orderData: OrderData } = await req.json()

    const productsHtml = orderData.products.map(product => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: 500;">${product.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${product.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${product.price.toLocaleString()} CFA</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: 500;">${product.subtotal.toLocaleString()} CFA</td>
      </tr>
    `).join('');

    const emailHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 700px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
        <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          
          <!-- En-tête -->
          <div style="text-align: center; border-bottom: 3px solid #008751; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="color: #008751; margin: 0; font-size: 28px;">KB&S</h1>
            <h2 style="color: #333; margin: 10px 0 0 0; font-size: 20px;">Nouvelle Commande</h2>
          </div>

          <!-- Informations de commande -->
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #008751; margin-top: 0;">📋 Détails de la commande</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <p style="margin: 5px 0;"><strong>N° de commande:</strong> ${orderData.orderNumber}</p>
              <p style="margin: 5px 0;"><strong>Date:</strong> ${orderData.orderDate}</p>
              <p style="margin: 5px 0;"><strong>Heure:</strong> ${orderData.orderTime}</p>
              <p style="margin: 5px 0;"><strong>Mode:</strong> ${orderData.deliveryMode}</p>
            </div>
          </div>

          <!-- Informations client -->
          <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="color: #008751; margin-top: 0;">👤 Informations du client</h3>
            <p style="margin: 8px 0;"><strong>Nom complet:</strong> ${orderData.customerName}</p>
            <p style="margin: 8px 0;"><strong>Email:</strong> <a href="mailto:${orderData.customerEmail}" style="color: #008751;">${orderData.customerEmail}</a></p>
            <p style="margin: 8px 0;"><strong>Téléphone:</strong> <a href="tel:${orderData.customerPhone}" style="color: #008751;">${orderData.customerPhone}</a></p>
            <p style="margin: 8px 0;"><strong>Adresse:</strong> ${orderData.customerAddress}</p>
          </div>

          <!-- Produits commandés -->
          <div style="margin-bottom: 25px;">
            <h3 style="color: #008751;">🛍️ Produits commandés</h3>
            <table style="width: 100%; border-collapse: collapse; margin: 15px 0; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <thead>
                <tr style="background-color: #008751; color: white;">
                  <th style="padding: 15px; text-align: left;">Produit</th>
                  <th style="padding: 15px; text-align: center;">Quantité</th>
                  <th style="padding: 15px; text-align: right;">Prix unitaire</th>
                  <th style="padding: 15px; text-align: right;">Sous-total</th>
                </tr>
              </thead>
              <tbody>
                ${productsHtml}
              </tbody>
            </table>
          </div>

          <!-- Total -->
          <div style="text-align: right; margin: 25px 0; padding: 20px; background-color: #008751; color: white; border-radius: 8px;">
            <h2 style="margin: 0; font-size: 24px;">💰 TOTAL: ${orderData.total.toLocaleString()} CFA</h2>
          </div>

          <!-- Notes -->
          ${orderData.notes ? `
          <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #ffc107;">
            <h3 style="color: #856404; margin-top: 0;">📝 Notes supplémentaires</h3>
            <p style="margin: 0; color: #856404;">${orderData.notes}</p>
          </div>
          ` : ''}

          <!-- Footer -->
          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666;">
            <p style="margin: 0;">Cette commande a été passée via le site web KB&S</p>
            <p style="margin: 5px 0 0 0; font-size: 14px;">Pour plus d'informations, contactez directement le client</p>
          </div>
        </div>
      </div>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'KB&S <noreply@kbs-senegal.com>',
        to: [to],
        subject: subject,
        html: emailHtml,
      }),
    })

    if (res.ok) {
      const data = await res.json()
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } else {
      const error = await res.text()
      return new Response(JSON.stringify({ error }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
