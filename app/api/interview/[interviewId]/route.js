import { db } from "@/utils/db";
import { MockInterview } from "@/utils/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req, context) {
  // unwrap params promise
  const params = await context.params;
  const interviewId = params.interviewId;

  const result = await db
    .select()
    .from(MockInterview)
    .where(eq(MockInterview.mockId, interviewId));

  return NextResponse.json(result[0] ?? null);
}
