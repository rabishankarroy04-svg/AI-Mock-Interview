import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req) {
  try {
    const { prompt } = await req.json();

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // updated
      contents: [{ type: "text", text: prompt }],
    });

    // Extract text safely
    const text =
      response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No text returned";

    return NextResponse.json({ text });
  } catch (err) {
    console.error("Gemini API Error:", err);
    return NextResponse.json({ error: "Gemini failed" }, { status: 500 });
  }
}
