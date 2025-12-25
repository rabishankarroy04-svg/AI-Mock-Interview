import { pgTable, serial, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { jsonb } from "drizzle-orm/pg-core";

export const MockInterview = pgTable("mock_interview", {
  id: serial("id").primaryKey(),

  jsonMockResp: jsonb("json_mock_resp").notNull(),

  jobPosition: varchar("job_position", { length: 255 }).notNull(),
  jobDesc: varchar("job_desc", { length: 1000 }).notNull(),
  jobExperience: varchar("job_experience", { length: 50 }).notNull(),

  createdBy: varchar("created_by", { length: 255 }).notNull(),

  createdAt: timestamp("created_at").defaultNow(),

  mockId: varchar("mock_id", { length: 255 }).notNull(),
});

export const UserAnswer = pgTable("userAnswer", {
  id: serial("id").primaryKey(),
  mockIdRef: varchar("mockId").notNull(),
  question: varchar("question").notNull(),
  correctAns: text("correctAns"),
  userAns: text("userAns"),
  feedback: text("feedback"),
  rating: varchar("rating"),
  userEmail: varchar("userEmail"),
  createdAt: varchar("createdAt"),
});
