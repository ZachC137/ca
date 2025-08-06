import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import GameCard from "@/components/GameCard";
import UserStats from "@/components/UserStats";
import WalletSection from "@/components/WalletSection";
import LiveChat from "@/components/LiveChat";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { User } from "@shared/schema";

const games = [
  {
    id: "slots",
    name: "Lucky Slots",
    type: "slots",
    description: "Classic slot machine with multiple paylines and bonus rounds",
    image: "🎰",
    rtp: "96.5%",
    buttonText: "Play Now",
    buttonColor: "from-[hsl(220,91%,57%)] to-[hsl(258,90%,66%)]",
    path: "/games/slots"
  },
  {
    id: "crash",
    name: "Rocket Crash",
    type: "crash",
    description: "Multiplier-based game - cash out before the crash!",
    image: "🚀",
    status: "Live: 2.45x",
    buttonText: "Join Game",
    buttonColor: "from-green-500 to-green-600",
    path: "/games/crash"
  },
  {
    id: "dice",
    name: "Provably Fair Dice",
    type: "dice",
    description: "Bet on high/low outcomes with cryptographic verification",
    image: "🎲",
    status: "Provably Fair",
    buttonText: "Roll Dice",
    buttonColor: "from-[hsl(258,90%,66%)] to-purple-600",
    path: "/games/dice"
  },
  {
    id: "roulette",
    name: "European Roulette",
    type: "roulette",
    description: "Classic roulette with single zero and multiple betting options",
    image: "🎯",
    status: "Last: 7 Red",
    buttonText: "Place Bets",
    buttonColor: "from-red-500 to-red-600",
    path: "/games/roulette"
  },
  {
    id: "blackjack",
    name: "Classic Blackjack",
    type: "blackjack",
    description: "Beat the dealer in this classic card game",
    image: "🃏",
    rtp: "99.5%",
    buttonText: "Deal Cards",
    buttonColor: "from-[hsl(43,96%,56%)] to-yellow-600",
    path: "/games/blackjack"
  },
  {
    id: "plinko",
    name: "Plinko Drop",
    type: "plinko",
    description: "Drop balls and watch them bounce into multiplier slots",
    image: "⚪",
    status: "Max: 1000x",
    buttonText: "Drop Ball",
    buttonColor: "from-[hsl(220,91%,57%)] to-blue-600",
    path: "/games/plinko"
  },
  {
    id: "coinflip",
    name: "Coin Flip",
    type: "coinflip",
    description: "Simple 50/50 betting game with instant results",
    image: "🪙",
    status: "50/50 Odds",
    buttonText: "Flip Coin",
    buttonColor: "from-[hsl(258,90%,66%)] to-purple-600",
    path: "/games/coinflip"
  }
];

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const { data: gameHistory = [] } = useQuery<any[]>({
    queryKey: ["/api/user/game-history"],
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[hsl(220,91%,57%)]"></div>
          <p className="mt-4 text-lg">Loading your gaming dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-casino-dark via-casino-navy to-casino-dark text-white">
      <Header />
      
      {/* Hero Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-[hsl(220,91%,57%)] via-[hsl(258,90%,66%)] to-[hsl(43,96%,56%)] bg-clip-text text-transparent">
            Welcome Back, {user.firstName || 'Player'}!
          </h2>
          <p className="text-xl text-[hsl(215,13%,45%)] mb-8 max-w-2xl mx-auto">
            Your gaming adventure continues. Choose from our diverse selection of games and win big!
          </p>
        </div>
      </section>

      {/* Games Selection */}
      <section id="games" className="py-16 px-4">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">Choose Your Game</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {games.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </div>
      </section>

      {/* User Dashboard */}
      <section className="py-16 px-4 bg-gradient-to-r from-[hsl(240,17%,12%)]/50 to-[hsl(240,18%,8%)]/50">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">Your Gaming Dashboard</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <WalletSection user={user} />
            <UserStats user={user} gameHistory={gameHistory} />
            <div className="glass-effect p-6 rounded-xl">
              <h4 className="text-xl font-semibold mb-6 flex items-center">
                <span className="mr-3">🎯</span>
                Quick Actions
              </h4>
              
              <div className="space-y-3">
                <button 
                  className="w-full bg-gradient-to-r from-[hsl(220,91%,57%)] to-[hsl(258,90%,66%)] py-3 rounded-lg hover:shadow-lg hover:shadow-[hsl(220,91%,57%)]/25 transition-all duration-300"
                  data-testid="button-play-slots"
                  onClick={() => window.location.href = "/games/slots"}
                >
                  🎰 Play Lucky Slots
                </button>
                <button 
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 py-3 rounded-lg hover:shadow-lg hover:shadow-green-500/25 transition-all duration-300"
                  data-testid="button-join-crash"
                  onClick={() => window.location.href = "/games/crash"}
                >
                  🚀 Join Crash Game
                </button>
                <button 
                  className="w-full bg-gradient-to-r from-[hsl(43,96%,56%)] to-yellow-600 py-3 rounded-lg hover:shadow-lg hover:shadow-[hsl(43,96%,56%)]/25 transition-all duration-300"
                  data-testid="button-view-leaderboard"
                  onClick={() => window.location.href = "/leaderboard"}
                >
                  🏆 View Leaderboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Chat */}
      <LiveChat />

      {/* Footer */}
      <footer className="bg-[hsl(240,18%,8%)] border-t border-[hsl(220,91%,57%)]/20 py-12 px-4">
        <div className="container mx-auto text-center">
          <p className="text-[hsl(215,13%,45%)]">
            &copy; 2024 CryptoGaming. All rights reserved. Play responsibly with virtual currency only.
          </p>
        </div>
      </footer>
    </div>
  );
}
