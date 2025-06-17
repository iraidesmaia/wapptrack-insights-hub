
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InviteEmailRequest {
  email: string;
  inviteLink: string;
  inviterEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, inviteLink, inviterEmail }: InviteEmailRequest = await req.json();

    console.log('Enviando email de convite para:', email);

    const emailResponse = await resend.emails.send({
      from: "WappTrack <onboarding@resend.dev>",
      to: [email],
      subject: "Você foi convidado para acessar o WappTrack",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Convite para WappTrack</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">WappTrack</h1>
            <p style="color: #f0f0f0; margin: 10px 0 0 0;">Rastreamento de leads do WhatsApp</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Você foi convidado!</h2>
            
            <p>Olá!</p>
            
            <p><strong>${inviterEmail}</strong> convidou você para acessar o sistema WappTrack.</p>
            
            <p>Com o WappTrack você poderá:</p>
            <ul style="color: #666;">
              <li>Visualizar e gerenciar leads do WhatsApp</li>
              <li>Acompanhar campanhas de marketing</li>
              <li>Monitorar vendas e conversões</li>
              <li>Acessar relatórios e dashboards</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteLink}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        font-weight: bold; 
                        display: inline-block;
                        font-size: 16px;">
                Aceitar Convite
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px;">
              Se você não conseguir clicar no botão, copie e cole este link no seu navegador:<br>
              <a href="${inviteLink}" style="color: #667eea; word-break: break-all;">${inviteLink}</a>
            </p>
            
            <p style="font-size: 12px; color: #999; text-align: center; margin-top: 20px;">
              Se você não esperava este convite, pode ignorar este email.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email enviado com sucesso:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Erro ao enviar email de convite:", error);
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
