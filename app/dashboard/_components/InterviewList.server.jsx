import { db } from "@/utils/db";
import { MockInterview } from "@/utils/schema";
import { eq, desc } from "drizzle-orm";
import InterviewListClient from "./InterviewList.client";

const InterviewListServer = async ({ userEmail }) => {
  //  ABSOLUTE SAFETY CHECK
  if (!userEmail) {
    return null;
  }

  const interviewList = await db
    .select()
    .from(MockInterview)
    .where(eq(MockInterview.createdBy, userEmail))
    .orderBy(desc(MockInterview.id));

  return <InterviewListClient interviewList={interviewList} />;
};

export default InterviewListServer;
