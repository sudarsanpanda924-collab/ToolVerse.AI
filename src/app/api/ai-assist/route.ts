import { NextResponse } from "next/server";
import { generateGeminiText } from "@/lib/ai/gemini";
import { generateGroqText } from "@/lib/ai/groq";
import { getGeminiApiKey, getGroqApiKey } from "@/lib/ai/env";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { action, prompt, style } = await request.json();
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const hasGroq = Boolean(getGroqApiKey());
    const hasGemini = Boolean(getGeminiApiKey());

    let systemPrompt = "";
    let userPrompt = "";

    switch (action) {
      case "enhance":
        systemPrompt = "You are an expert AI prompt engineer. Enhance the user prompt to be highly detailed, cinematic, and rich in texture, lighting, and composition. Keep the subject unchanged. Return ONLY the enhanced prompt, no commentary, no markdown, no quotes.";
        userPrompt = `Enhance this prompt: "${prompt}"`;
        break;
      case "rewrite":
        systemPrompt = "You are an expert AI prompt engineer. Rewrite the user prompt to make it creative, highly engaging, and stylized. Return ONLY the rewritten prompt, no commentary, no markdown, no quotes.";
        userPrompt = `Rewrite this prompt: "${prompt}"`;
        break;
      case "expand":
        systemPrompt = "You are an expert AI prompt engineer. Expand the user prompt by describing specific camera angles, volumetric lighting, rich environmental details, and textures. Return ONLY the expanded prompt, no commentary, no markdown, no quotes.";
        userPrompt = `Expand this prompt: "${prompt}"`;
        break;
      case "negative":
        systemPrompt = "You are an expert AI prompt engineer. Generate a comma-separated list of negative prompts (elements to avoid, e.g., low quality, blurry, deformed limbs, text, watermarks, bad anatomy) based on the prompt subject. Return ONLY the comma-separated negative list, no commentary, no markdown, no quotes.";
        userPrompt = `Generate a negative prompt for: "${prompt}"`;
        break;
      case "recommend_style":
        systemPrompt = "Based on the prompt, recommend the single best matching visual style from this list: Realistic, Cinematic, Documentary, Anime, Cartoon, 3D Render, Cyberpunk, Product Photography. Return ONLY the name of the style, nothing else.";
        userPrompt = `Recommend style for: "${prompt}"`;
        break;
      case "suggestions":
        systemPrompt = "You are an expert AI prompt engineer. Provide 3 smart alternative prompt suggestions based on the user's idea. Return them as a clean list of 3 items, each on a new line starting with a bullet (-) character. No intro or outro.";
        userPrompt = `Provide 3 variations for: "${prompt}"`;
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    let resultText = "";

    if (hasGroq) {
      try {
        resultText = await generateGroqText(systemPrompt, userPrompt);
      } catch (err) {
        console.warn("Groq failed in assist route, trying Gemini...", err);
      }
    }

    if (!resultText && hasGemini) {
      try {
        resultText = await generateGeminiText(systemPrompt, userPrompt);
      } catch (err) {
        console.warn("Gemini failed in assist route", err);
      }
    }

    // Smart Local Fallback
    if (!resultText) {
      const cleanPrompt = prompt.trim();
      if (action === "enhance") {
        resultText = `${cleanPrompt}, cinematic lighting, photorealistic details, 8k resolution, high contrast, octane render, masterpiece`;
      } else if (action === "rewrite") {
        resultText = `A stunning visual of ${cleanPrompt}, artistic composition, sharp focus, vibrant color palette, professional execution`;
      } else if (action === "expand") {
        resultText = `${cleanPrompt}, highly detailed textures, volumetric atmosphere, shallow depth of field, captured on 35mm lens, award-winning photography`;
      } else if (action === "negative") {
        resultText = "blurry, low quality, low resolution, deformed anatomy, bad proportions, bad hands, extra limbs, watermark, text, signature, duplicate, cropped";
      } else if (action === "recommend_style") {
        const lower = cleanPrompt.toLowerCase();
        if (lower.includes("person") || lower.includes("photo") || lower.includes("real") || lower.includes("face")) {
          resultText = "Realistic";
        } else if (lower.includes("car") || lower.includes("city") || lower.includes("sunset") || lower.includes("night")) {
          resultText = "Cinematic";
        } else if (lower.includes("cartoon") || lower.includes("child") || lower.includes("kids")) {
          resultText = "Cartoon";
        } else if (lower.includes("anime") || lower.includes("manga") || lower.includes("character")) {
          resultText = "Anime";
        } else {
          resultText = "3D Render";
        }
      } else if (action === "suggestions") {
        resultText = `- A close-up cinematic portrait of ${cleanPrompt}\n- An abstract digital art interpretation of ${cleanPrompt}\n- A hyper-realistic commercial product rendering of ${cleanPrompt}`;
      }
    }

    return NextResponse.json({ result: resultText.trim() });
  } catch (error) {
    console.error("[ToolVerse] AI Assist route failed", error);
    return NextResponse.json({ error: "Failed to process prompt assistant." }, { status: 500 });
  }
}
