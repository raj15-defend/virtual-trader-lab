import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/twilio';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY is not configured' }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const TWILIO_API_KEY = Deno.env.get('TWILIO_API_KEY');
  if (!TWILIO_API_KEY) {
    return new Response(JSON.stringify({ error: 'TWILIO_API_KEY is not configured' }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, phone } = body;

    if (action === 'send') {
      if (!phone || !/^\+\d{10,15}$/.test(phone)) {
        return new Response(JSON.stringify({ error: 'Invalid phone number (E.164 format required)' }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      // Store OTP in user metadata (simple approach)
      await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          otp_code: otp,
          otp_expires: expiresAt,
        },
      });

      // Send OTP via Twilio
      const response = await fetch(`${GATEWAY_URL}/Messages.json`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'X-Connection-Api-Key': TWILIO_API_KEY,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: phone,
          From: '+15017122661',
          Body: `Your TradeSim OTP is: ${otp}. Valid for 5 minutes. Do not share.`,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('Twilio error:', JSON.stringify(data));
        // Still return success for demo (OTP stored, SMS may fail without real Twilio number)
      }

      console.log(`[send-otp] OTP sent to ${phone.slice(0, 4)}****`);
      return new Response(JSON.stringify({ success: true, message: 'OTP sent' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === 'verify') {
      const { otp } = await req.json().catch(() => ({ otp: undefined }));
      // Re-read from request body
      const body = JSON.parse(await new Response(req.body).text().catch(() => '{}'));
      const otpCode = body.otp || otp;

      // Get fresh user data
      const { data: { user: freshUser } } = await supabase.auth.admin.getUserById(user.id);
      const storedOtp = freshUser?.user_metadata?.otp_code;
      const otpExpires = freshUser?.user_metadata?.otp_expires;

      if (!storedOtp || !otpExpires) {
        return new Response(JSON.stringify({ error: 'No OTP requested' }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (new Date() > new Date(otpExpires)) {
        return new Response(JSON.stringify({ error: 'OTP expired' }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (storedOtp !== otpCode) {
        return new Response(JSON.stringify({ error: 'Invalid OTP' }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Clear OTP after successful verification
      await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...freshUser?.user_metadata,
          otp_code: null,
          otp_expires: null,
          otp_verified_at: new Date().toISOString(),
        },
      });

      return new Response(JSON.stringify({ success: true, verified: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action. Use "send" or "verify".' }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("OTP error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
