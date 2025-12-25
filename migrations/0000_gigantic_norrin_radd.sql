CREATE TABLE "mock_interview" (
	"id" serial PRIMARY KEY NOT NULL,
	"json_mock_resp" jsonb NOT NULL,
	"job_position" varchar(255) NOT NULL,
	"job_desc" varchar(1000) NOT NULL,
	"job_experience" varchar(50) NOT NULL,
	"created_by" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"mock_id" varchar(255) NOT NULL
);
