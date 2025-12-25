import { UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import AddNewInterview from "./_components/AddNewInterview";
import InterviewListServer from "./_components/InterviewList.server";

const Dashboard = async () => {
  const user = await currentUser();
  if (!user) {
    redirect("/sign-in");
  }
  const userEmail = user?.primaryEmailAddress?.emailAddress;

  return (
    <div className="p-10">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-bold text-2xl">Dashboard</h2>
          <h2 className="text-gray-500">
            Create and start your AI Mockup Interview
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 my-5">
        <AddNewInterview />
      </div>

      <InterviewListServer userEmail={userEmail} />
    </div>
  );
};

export default Dashboard;
