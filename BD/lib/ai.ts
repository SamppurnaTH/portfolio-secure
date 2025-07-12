import axios from "axios";

export async function generateReplyFromDeepSeek(prompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("❌ Missing OpenRouter API key");

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "deepseek/deepseek-r1-0528:free",
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content: "You are a professional assistant helping write polite and helpful business replies to clients.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 1000, // This was the crucial fix for getting complete responses
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (error: any) {
    throw new Error("🚫 AI reply generation failed. Please try again.");
  }
}