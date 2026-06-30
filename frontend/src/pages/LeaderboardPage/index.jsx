import { Navbar, Footer } from "@/components/layout";
import { Leaderboard } from "../DashboardPage/Leaderboard";
import { useUserStore } from "@/store/useUserStore";

export default function LeaderboardPage() {
  const loggedInUser = useUserStore((state) => state.user);

  return (
    <div className="min-h-screen bg-[#000000] text-white flex flex-col justify-between">
      <Navbar />
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 pt-32 pb-16">
        <Leaderboard user={loggedInUser} />
      </main>

      <Footer />
    </div>
  );
}
