import React from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const InterviewItemCard = ({ interview }) => {
  const router = useRouter();
  const onStart = () => {
    router.push("/dashboard/interview/" + interview?.mockId);
  };
  const onFeedback = () => {
    router.push("/dashboard/interview/" + interview?.mockId + "/feedback");
  };
  return (
    <div className="border border-gray-500 shadow-sm rounded-lg p-3">
      <h2 className="font-bold text-primary">{interview?.jobPosition}</h2>
      <h2 className="text-sm text-gray-600">
        {interview?.jobExperience} Years of experience
      </h2>
      <h2 className="text-xs text-gray-400">
        Created At: {new Date(interview.createdAt).toLocaleDateString()}
      </h2>

      <div className="flex justify-around mt-2 ">
        <Button onClick={onFeedback} className="w-0.4">
          Feedback
        </Button>
        <Button onClick={onStart} className="w-0.4">
          Start
        </Button>
      </div>
    </div>
  );
};

export default InterviewItemCard;
