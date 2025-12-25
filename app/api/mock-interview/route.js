import { NextResponse } from "next/server";
import { db } from "@/utils/db";
import { MockInterview } from "@/utils/schema";
import { v4 as uuidv4 } from "uuid";

export async function POST(req) {
  try {
    const body = await req.json();

    const { jsonMockResp, jobPosition, jobDesc, jobExperience, createdBy } =
      body;

    const resp = await db
      .insert(MockInterview)
      .values({
        mockId: uuidv4(),
        jsonMockResp,
        jobPosition,
        jobDesc,
        jobExperience,
        createdBy,
      })
      .returning({ mockId: MockInterview.mockId });

    return NextResponse.json({ success: true, data: resp[0] });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "DB insert failed" },
      { status: 500 }
    );
  }
}
