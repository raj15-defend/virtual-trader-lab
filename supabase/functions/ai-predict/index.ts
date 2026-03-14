import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { stockSymbol, priceHistory, currentPrice, holdings, walletBalance } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an AI stock market analyst for a simulated trading platform (Indian stock market). 
Analyze the given stock data and provide:
1. Price prediction (short-term direction)
2. Trading recommendation (BUY, SELL, or HOLD)
3. Risk analysis score (1-100)
4. Key technical indicators interpretation

Always respond with valid JSON in this exact format:
{
  "prediction": {
    "direction": "up" | "down" | "sideways",
    "confidence": <number 0-100>,
    "targetPrice": <number>,
    "timeframe": "1 week"
  },
  "recommendation": "BUY" | "SELL" | "HOLD",
  "recommendationReason": "<brief reason>",
  "riskScore": <number 1-100>,
  "riskLevel": "Low" | "Medium" | "High",
  "riskFactors": ["<factor1>", "<factor2>"],
  "technicalIndicators": {
    "movingAverage": "<interpretation>",
    "rsi": "<interpretation>",
    "trend": "<interpretation>"
  },
  "summary": "<2-3 sentence analysis>"
}`;

    const userPrompt = `Analyze this stock for trading decisions:

Stock: ${stockSymbol}
Current Price: ₹${currentPrice}
Recent Price History (last 20 data points): ${JSON.stringify(priceHistory?.slice(-20) || [])}
${holdings ? `User holds ${holdings.quantity} shares at avg price ₹${holdings.avgBuyPrice}` : 'User has no position in this stock'}
User wallet balance: ₹${walletBalance || 0}

Calculate technical indicators from the price data:
- Simple Moving Average (7-period and 20-period)
- Relative Strength Index approximation
- Price trend direction
- Volatility assessment

Provide your analysis as JSON.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    // Parse JSON from response (handle markdown code blocks)
    let parsed;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      parsed = JSON.parse(jsonStr.trim());
    } catch {
      parsed = {
        prediction: { direction: "sideways", confidence: 50, targetPrice: currentPrice, timeframe: "1 week" },
        recommendation: "HOLD",
        recommendationReason: "Unable to parse AI response",
        riskScore: 50,
        riskLevel: "Medium",
        riskFactors: ["Analysis unavailable"],
        technicalIndicators: { movingAverage: "N/A", rsi: "N/A", trend: "N/A" },
        summary: content.slice(0, 200),
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-predict error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
