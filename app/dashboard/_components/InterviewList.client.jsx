"use client";

import React from "react";
import InterviewItemCard from "./InterviewItemCard";
import { Skeleton } from "@/components/ui/skeleton";

const InterviewListClient = ({ interviewList }) => {
  return (
    <div>
      <h2 className="font-medium text-xl">Previous Mock Interviews</h2>

      {interviewList?.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 my-3">
          {interviewList.map((interview, index) => (
            <InterviewItemCard key={index} interview={interview} />
          ))}
        </div>
      ) : (
        <Skeleton className="w-full h-20 rounded-lg mt-4" />
      )}
    </div>
  );
};

export default InterviewListClient;
