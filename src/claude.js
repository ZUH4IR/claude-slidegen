import Anthropic from "@anthropic-ai/sdk";
import "dotenv/config";

const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function askClaude(systemPrompt, userPrompt = "Please follow the instructions in the system prompt.") {
  const res = await claude.messages.create({
    model: "claude-3-5-sonnet-20241022",
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
    max_tokens: 4096,
  });
  return res.content[0].text.trim();
}
