import { db } from "@/utils/db";
import { MockInterview } from "@/utils/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req, context) {
  const { interviewId } = await context.params;

  const result = await db
    .select()
    .from(MockInterview)
    .where(eq(MockInterview.mockId, interviewId));

  if (!result.length) {
    return NextResponse.json(null, { status: 404 });
  }

  return NextResponse.json(result[0]);
}
