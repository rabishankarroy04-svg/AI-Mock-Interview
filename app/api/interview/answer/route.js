import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { db } from "@/utils/db";
import { UserAnswer } from "@/utils/schema";

export async function POST(req) {
  console.log("🔥 /api/interview/answer HIT");

  try {
    const body = await req.json();
    console.log("📦 BODY:", body);

    const { mockId, question, correctAns, userAnswer, userEmail } = body;

    if (!mockId || !question || !userAnswer) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("🔑 API KEY EXISTS:", !!process.env.GEMINI_API_KEY);

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const prompt = `
You are an interview evaluator.

Question: ${question}
User Answer: ${userAnswer}

Respond ONLY in valid JSON.
No markdown. No explanation.

{
  "rating": number (1-10),
  "feedback": string (3-5 lines)
}
`;

    // ✅ ACTUAL GEMINI CALL (THIS WAS MISSING)
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    // 🔍 FULL RAW DEBUG
    console.log("🧠 Gemini raw response:", JSON.stringify(result, null, 2));

    // ✅ SAFE EXTRACTION (NEW SDK)
    let rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error("Gemini returned empty response");
    }

    // 🧼 CLEAN POSSIBLE MARKDOWN
    rawText = rawText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let feedbackJSON;
    try {
      feedbackJSON = JSON.parse(rawText);
    } catch (err) {
      console.error("❌ Gemini RAW TEXT:", rawText);
      throw new Error("Invalid JSON from Gemini");
    }

    await db.insert(UserAnswer).values({
      mockIdRef: mockId,
      question,
      correctAns,
      userAns: userAnswer,
      feedback: feedbackJSON.feedback,
      rating: feedbackJSON.rating,
      userEmail,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Answer save error:", error);
    return NextResponse.json(
      { error: "Failed to process answer" },
      { status: 500 }
    );
  }
}
