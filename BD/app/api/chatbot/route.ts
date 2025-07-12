// app/api/chatbot/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod"; // Assuming you have zod installed for validation
import { withCors, handleOptions } from '@/lib/cors'; // Adjust path if your cors.ts is elsewhere, e.g., '../lib/cors'

// IMPORTANT: Define chatbotInputSchema if it's not already defined in '@/lib/validation'
// For demonstration, I'll include a simple one here.
// You should ensure '@/lib/validation' exports it correctly.
const chatbotInputSchema = z.object({
  query: z.string().min(1, "Query cannot be empty."),
});

// === Constants ===
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MINUTES || 15) * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = Number(process.env.RATE_LIMIT_MAX_REQUESTS || 50);
const AI_ACTIVATION_THRESHOLD = 15;

// === Special commands ===
const SPECIAL_COMMANDS = ['matrix', 'hack', 'clear', 'enable-ai', 'disable-ai'] as const;
type SpecialCommand = (typeof SPECIAL_COMMANDS)[number];

type BotCommand = keyof typeof BOT_RESPONSES | SpecialCommand;

type BotResponse = {
  message: string;
  metadata?: {
    requiresClear?: boolean;
    requiresAnimation?: string;
    enableAI?: boolean;
    disableAI?: boolean;
  };
};

// === Bot responses ===
const BOT_RESPONSES = {
  help: {
    message:
      "😎 Need help? Try:\n• about - Who's Venu?\n• contact - Get in touch\n• skills - What can I do?\n• projects - My work\n• joke - Make you laugh\n• clear - Reset chat\n• enable-ai - For smarter responses\n• disable-ai - Return to basic mode",
  },
  about: {
    message:
      "🧑‍💻 I'm Venu Thota - ML Engineer & Cybersecurity Enthusiast. I build secure, intelligent systems that solve real-world problems.",
  },
  contact: {
    message:
      `📧 Email: ${process.env.CONTACT_EMAIL || 'contact@example.com'}\n📱 Phone: ${process.env.CONTACT_PHONE || '+1 234 567 8900'}\n📍 Location: ${process.env.CONTACT_LOCATION || 'Your Location'}`,
  },
  skills: {
    message:
      "🛠️ My stack:\n• AI/ML (TensorFlow, PyTorch)\n• Cybersecurity (Pentesting, Ethical Hacking)\n• Full Stack (React, Node.js, Python)\n• Cloud (AWS, GCP)\n• Python & Next.js",
  },
  projects: {
    message:
      "🚀 Cool stuff I built:\n• AI Sentiment Analysis\n• CKD Predictor\n• Real-time Security Dashboard\n• This Portfolio!\n• more",
  },
  joke: {
    message: "😂 Why did the developer go broke?\nBecause he used up all his cache!",
  },
  greeting: {
    message: "👋 Hey there! I'm **Killer**, Venu's digital sidekick. What's on your mind?",
  },
  secret: {
    message:
      "🤫 Shh... you found the secret! Venu loves creating powerful AI that makes a difference!",
  },
  matrix: {
    message: "Wake up, Neo... 🕶️ The Matrix has you...",
    metadata: { requiresAnimation: "matrix" },
  },
  hack: {
    message: "🛑 ACCESS DENIED. (Just kidding 😄 — I'm a friendly hacker here to help!)",
  },
  clear: {
    message: "",
    metadata: { requiresClear: true },
  },
  'enable-ai': {
    message: "🧠 AI mode activated! I'll now provide smarter responses using GPT-4o.",
    metadata: { enableAI: true },
  },
  'disable-ai': {
    message: "🔄 Returning to basic mode. Use 'enable-ai' to activate smarter responses again.",
    metadata: { disableAI: true },
  },
  default: {
    message: "🤔 Hmm... I didn't get that. Try 'help' to see what I can do!",
  },
} as const;

// === Greetings ===
const GREETINGS = [
  "👋 Hello! I'm **Killer**, Venu's digital sidekick. What's on your mind?",
  "👋 Hi there! **Killer** here, ready to assist you. What would you like to know?",
  "👋 Greetings! I'm **Killer**, Venu's AI assistant. How can I help today?",
  "👋 Hey! You've reached **Killer**, Venu's virtual helper. Ask me anything!",
  "👋 Welcome! I'm **Killer**, here to answer your questions about Venu."
];

// === Thank You Responses ===
const THANK_YOU_RESPONSES = [
  "It's my pleasure! Thank you for visiting Venu's profile!",
  "You're very welcome! Thanks for stopping by Venu's profile.",
  "Happy to help! And thank you for exploring Venu's work.",
  "Glad I could assist! It's a pleasure having you here on Venu's profile."
];

// === Session + Rate limit stores ===
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const sessionStore = new Map<string, { aiEnabled: boolean }>();

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  if (Math.random() < 0.1) {
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetTime) rateLimitStore.delete(key);
    }
  }

  const record = rateLimitStore.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  // FIX: Changed MAX_REQUESTS_PER_REQUESTS to MAX_REQUESTS_PER_WINDOW
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - record.count };
}

function processCommand(input: string): BotResponse | null {
  const cmd = input.trim().toLowerCase();

  if (['hello', 'hi', 'hey', 'hai', 'greetings'].includes(cmd)) {
    return {
      message: GREETINGS[Math.floor(Math.random() * GREETINGS.length)],
      metadata: { requiresAnimation: "wave" }
    };
  }

  // New: Handle "thank you" phrases
  if (['thank you', 'thanks', 'cheers', 'thx'].some(phrase => cmd.includes(phrase))) {
    return {
      message: THANK_YOU_RESPONSES[Math.floor(Math.random() * THANK_YOU_RESPONSES.length)],
    };
  }

  if (SPECIAL_COMMANDS.includes(cmd as SpecialCommand)) {
    return BOT_RESPONSES[cmd as BotCommand];
  }

  const matchedCommand = Object.keys(BOT_RESPONSES)
    .filter((key) => !SPECIAL_COMMANDS.includes(key as any))
    .find((key) => cmd.includes(key)) as BotCommand | undefined;

  return matchedCommand ? BOT_RESPONSES[matchedCommand] : null;
}

async function fetchFromOpenRouter(query: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("OpenRouter API key is missing");
    return BOT_RESPONSES.default.message;
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "",
        "X-Title": process.env.OPENROUTER_SITE_NAME || "VenuPortfolioAI",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1-0528:free",
        messages: [
          {
            role: "system",
            content: `You are Killer, an AI assistant for Venu Thota (ML Engineer & Cybersecurity Expert). Respond in a friendly, professional manner (1-2 paragraphs max). Focus on Venu's skills in AI/ML, cybersecurity, and full-stack development.`
          },
          { role: "user", content: query }
        ],
      }),
    });

    if (!response.ok) throw new Error(`OpenRouter API error: ${response.statusText}`);

    const data = await response.json();
    return data?.choices?.[0]?.message?.content || BOT_RESPONSES.default.message;
  } catch (error) {
    console.error("OpenRouter API failed:", error);
    return "🧠 I'm having trouble accessing my AI capabilities. Please try again later or use basic commands.";
  }
}

// === POST Handler ===
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(ip);

    if (!rateLimit.allowed) {
      const rateLimitResponse = NextResponse.json(
        {
          error: "⚠️ Too many requests. Please try again later.",
          retryAfter: Math.ceil((rateLimitStore.get(ip)!.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": MAX_REQUESTS_PER_WINDOW.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimitStore.get(ip)?.resetTime.toString() || "",
          },
        }
      );
      return withCors(rateLimitResponse, request); // Apply CORS to rate limit response
    }

    const body = await request.json();
    const { query } = chatbotInputSchema.parse(body);

    const botResponse = processCommand(query);

    if (query.toLowerCase() === "enable-ai") {
      sessionStore.set(ip, { aiEnabled: true });
    } else if (query.toLowerCase() === "disable-ai") {
      sessionStore.set(ip, { aiEnabled: false });
    }

    const session = sessionStore.get(ip) || { aiEnabled: false };

    let responseMessage: string;
    let metadata = botResponse?.metadata || {};

    if (botResponse) {
      responseMessage = botResponse.message;
      metadata = { ...metadata, ...botResponse.metadata };
    } else if (session.aiEnabled || query.length > AI_ACTIVATION_THRESHOLD) {
      responseMessage = await fetchFromOpenRouter(query);
    } else {
      responseMessage = BOT_RESPONSES.default.message;
    }

    const successResponse = NextResponse.json({
      success: true,
      message: responseMessage,
      metadata: {
        ...metadata,
        aiEnabled: session.aiEnabled,
      },
      rateLimit: {
        remaining: rateLimit.remaining,
        reset: rateLimitStore.get(ip)?.resetTime,
      },
    });
    return withCors(successResponse, request); // Apply CORS to successful response
  } catch (error) {
    if (error instanceof z.ZodError) {
      const zodErrorResponse = NextResponse.json(
        {
          error: "❌ Invalid input",
          issues: error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
      return withCors(zodErrorResponse, request); // Apply CORS to Zod validation error
    }

    console.error("Chatbot API Error:", error);
    const unexpectedErrorResponse = NextResponse.json(
      {
        error: "🚫 Unexpected error occurred. Please try again later.",
        ...(process.env.NODE_ENV === "development" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 }
    );
    return withCors(unexpectedErrorResponse, request); // Apply CORS to unexpected server error
  }
}

// Handle OPTIONS requests (for CORS preflight)
export async function OPTIONS(request: NextRequest) {
  try {
    return handleOptions(request);
  } catch (error) {
    console.error("API Error in OPTIONS handler:", error);
    // Even for OPTIONS, return a valid response to prevent "Failed to fetch"
    // This fallback ensures a response even if handleOptions fails for some reason.
    return new NextResponse(null, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*', // Broad CORS for error fallback
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  }
}
