import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface QuoteEmailRequest {
  quote: {
    quote_number: string;
    customer_name: string;
    customer_email: string;
    customer_company?: string;
    total_amount: number;
    validity_date?: string;
    notes?: string;
    quote_items: Array<{
      service_name: string;
      description?: string;
      quantity: number;
      unit_price: number;
      subtotal: number;
    }>;
  };
  pdfBuffer?: string; // Base64 encoded PDF
}

const generateEmailHTML = (quote: any) => {
  const validityText = quote.validity_date 
    ? `<p><strong>Valide jusqu'au:</strong> ${new Date(quote.validity_date).toLocaleDateString('fr-FR')}</p>`
    : '';

  const itemsHTML = quote.quote_items.map((item: any) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: 500;">
        <strong>${item.service_name}</strong>
        ${item.description ? `<br><small style="color: #666;">${item.description}</small>` : ''}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${item.unit_price.toLocaleString()} FCFA</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: 500;">${item.subtotal.toLocaleString()} FCFA</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Devis KB&S</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 700px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
      <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        
        <!-- En-tête -->
        <div style="text-align: center; border-bottom: 3px solid #008751; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="color: #008751; margin: 0; font-size: 28px;">KB&S</h1>
          <h2 style="color: #333; margin: 10px 0 0 0; font-size: 20px;">Devis ${quote.quote_number}</h2>
        </div>

        <!-- Informations du devis -->
        <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="color: #008751; margin-top: 0;">📋 Détails du devis</h3>
          <p style="margin: 8px 0;"><strong>Bonjour ${quote.customer_name},</strong></p>
          <p>Nous vous remercions de votre confiance et avons le plaisir de vous adresser notre devis pour les services demandés.</p>
          ${validityText}
        </div>

        <!-- Services proposés -->
        <div style="margin-bottom: 25px;">
          <h3 style="color: #008751;">🛍️ Services proposés</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <thead>
              <tr style="background-color: #008751; color: white;">
                <th style="padding: 15px; text-align: left;">Service</th>
                <th style="padding: 15px; text-align: center;">Quantité</th>
                <th style="padding: 15px; text-align: right;">Prix unitaire</th>
                <th style="padding: 15px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>
        </div>

        <!-- Total -->
        <div style="text-align: right; margin: 25px 0; padding: 20px; background-color: #008751; color: white; border-radius: 8px;">
          <h2 style="margin: 0; font-size: 24px;">💰 TOTAL: ${quote.total_amount.toLocaleString()} FCFA</h2>
        </div>

        ${quote.notes ? `
          <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #ffc107;">
            <h3 style="color: #856404; margin-top: 0;">📝 Notes</h3>
            <p style="margin: 0; color: #856404;">${quote.notes}</p>
          </div>
        ` : ''}

        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 30px;">
          <p><strong>Prochaines étapes :</strong></p>
          <ul>
            <li>Merci de nous confirmer votre accord par retour d'email</li>
            <li>Un acompte de 30% sera demandé à la commande</li>
            <li>Le solde sera facturé à la livraison</li>
          </ul>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666;">
          <p style="margin: 0;"><strong>KB&S - Services informatiques</strong></p>
          <p style="margin: 5px 0;">📞 +221 77 029 98 21 | ✉️ kewekane@yahoo.fr</p>
          <p style="margin: 5px 0 0 0; font-size: 14px;">Merci de votre confiance !</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { quote, pdfBuffer }: QuoteEmailRequest = await req.json();

    console.log("Sending quote email for:", quote.quote_number);

    const emailData: any = {
      from: "KB&S <noreply@kbs.com>",
      to: [quote.customer_email],
      subject: `Devis ${quote.quote_number} - KB&S`,
      html: generateEmailHTML(quote),
    };

    // Add PDF attachment if provided
    if (pdfBuffer) {
      emailData.attachments = [
        {
          filename: `Devis_${quote.quote_number}.pdf`,
          content: pdfBuffer,
          type: "application/pdf",
        },
      ];
    }

    const emailResponse = await resend.emails.send(emailData);

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-quote-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);