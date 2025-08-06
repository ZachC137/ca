import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import UserStats from "@/components/UserStats";
import WalletSection from "@/components/WalletSection";
import LiveChat from "@/components/LiveChat";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dice1, TrendingUp, Users, Star, Clock, Zap, Award } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";

const games = [
  {
    id: "slots",
    name: "Lucky Slots",
    type: "slots",
    description: "Spin the reels and match symbols for massive wins",
    image: "🎰",
    status: "🔥 Hot",
    buttonText: "Spin Now",
    buttonColor: "from-[hsl(43,96%,56%)] to-yellow-600",
    path: "/games/slots",
    popularity: 98
  },
  {
    id: "crash",
    name: "Rocket Crash",
    type: "crash",
    description: "Cash out before the rocket crashes for multiplied wins",
    image: "🚀",
    status: "Max: 1000x",
    buttonText: "Launch",
    buttonColor: "from-red-500 to-orange-600",
    path: "/games/crash",
    popularity: 95
  },
  {
    id: "dice",
    name: "Dice Roll",
    type: "dice",
    description: "Provably fair dice betting with customizable odds",
    image: "🎲",
    status: "50/50 Odds",
    buttonText: "Roll Dice",
    buttonColor: "from-green-500 to-emerald-600",
    path: "/games/dice",
    popularity: 87
  },
  {
    id: "roulette",
    name: "Roulette",
    type: "roulette",
    description: "European roulette with single zero advantage",
    image: "🎯",
    status: "35:1 Max",
    buttonText: "Place Bet",
    buttonColor: "from-[hsl(258,90%,66%)] to-purple-600",
    path: "/games/roulette",
    popularity: 92
  },
  {
    id: "blackjack",
    name: "Blackjack",
    type: "blackjack",
    description: "Beat the dealer with strategy and luck",
    image: "🃏",
    status: "3:2 Payout",
    buttonText: "Deal Cards",
    buttonColor: "from-blue-500 to-indigo-600",
    path: "/games/blackjack",
    popularity: 83
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
    path: "/games/plinko",
    popularity: 78
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
    path: "/games/coinflip",
    popularity: 75
  },
  {
    id: "baccarat",
    name: "Baccarat",
    type: "baccarat",
    description: "Classic card game of Player vs Banker",
    image: "🃖",
    status: "8:1 Tie",
    buttonText: "Deal Cards",
    buttonColor: "from-purple-500 to-pink-600",
    path: "/games/baccarat",
    popularity: 89
  },
  {
    id: "keno",
    name: "Keno",
    type: "keno",
    description: "Pick numbers and watch the draw for big wins",
    image: "🔢",
    status: "Max: 25000x",
    buttonText: "Pick Numbers",
    buttonColor: "from-orange-500 to-red-600",
    path: "/games/keno",
    popularity: 82
  },
  {
    id: "wheel",
    name: "Wheel of Fortune",
    type: "wheel",
    description: "Spin the wheel for multiplied rewards",
    image: "🎡",
    status: "Max: 40x",
    buttonText: "Spin Wheel",
    buttonColor: "from-pink-500 to-rose-600",
    path: "/games/wheel",
    popularity: 91
  },
  {
    id: "mines",
    name: "Mines",
    type: "mines",
    description: "Reveal safe tiles while avoiding hidden mines",
    image: "💎",
    status: "Risk/Reward",
    buttonText: "Start Mining",
    buttonColor: "from-emerald-500 to-teal-600",
    path: "/games/mines",
    popularity: 85
  },
  {
    id: "hilo",
    name: "Hi-Lo Cards",
    type: "hilo",
    description: "Predict if the next card is higher or lower",
    image: "📈",
    status: "Streak Bonus",
    buttonText: "Start Game",
    buttonColor: "from-cyan-500 to-blue-600",
    path: "/games/hilo",
    popularity: 79
  }
];

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const [liveStats, setLiveStats] = useState({
    onlinePlayers: 12847,
    totalWinnings: 2400000,
    gamesPlayed: 486234,
    biggestWin: 15420
  });
  const [recentWins, setRecentWins] = useState([
    { player: "Player123", game: "Slots", amount: 1250, multiplier: "25x" },
    { player: "LuckyGamer", game: "Crash", amount: 890, multiplier: "8.9x" },
    { player: "BetMaster", game: "Roulette", amount: 3500, multiplier: "35x" },
    { player: "DiceKing", game: "Dice", amount: 450, multiplier: "1.95x" },
  ]);

  // Animate live stats
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStats(prev => ({
        onlinePlayers: prev.onlinePlayers + Math.floor(Math.random() * 10 - 5),
        totalWinnings: prev.totalWinnings + Math.floor(Math.random() * 1000),
        gamesPlayed: prev.gamesPlayed + Math.floor(Math.random() * 5),
        biggestWin: Math.max(prev.biggestWin, prev.biggestWin + Math.floor(Math.random() * 100 - 50))
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Animate recent wins
  useEffect(() => {
    const interval = setInterval(() => {
      const newWin = {
        player: `Player${Math.floor(Math.random() * 999)}`,
        game: games[Math.floor(Math.random() * games.length)].name,
        amount: Math.floor(Math.random() * 2000) + 100,
        multiplier: `${(Math.random() * 20 + 1).toFixed(1)}x`
      };
      setRecentWins(prev => [newWin, ...prev.slice(0, 3)]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const { data: leaderboard } = useQuery({
    queryKey: ["/api/leaderboard"],
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-casino-dark via-casino-navy to-casino-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[hsl(220,91%,57%)] mx-auto"></div>
          <p className="mt-4 text-lg text-white">Loading your gaming experience...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-casino-dark via-casino-navy to-casino-dark flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Please log in to continue</h2>
          <Button onClick={() => window.location.href = "/api/login"}>
            Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-casino-dark via-casino-navy to-casino-dark text-white">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section with Live Stats */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-[hsl(220,91%,57%)] via-[hsl(258,90%,66%)] to-[hsl(43,96%,56%)] bg-clip-text text-transparent animate-pulse">
              Welcome Back, {user.name || 'Player'}!
            </h1>
            <p className="text-[hsl(215,13%,45%)] text-lg">
              Ready to win big? Choose your game and let the excitement begin!
            </p>
          </div>

          {/* Live Casino Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="glass-effect hover:scale-105 transition-transform duration-300">
              <CardContent className="p-4 text-center">
                <Users className="w-8 h-8 text-[hsl(220,91%,57%)] mx-auto mb-2" />
                <div className="text-2xl font-bold text-[hsl(43,96%,56%)]" data-testid="live-players">
                  {liveStats.onlinePlayers.toLocaleString()}
                </div>
                <div className="text-xs text-[hsl(215,13%,45%)]">Players Online</div>
              </CardContent>
            </Card>

            <Card className="glass-effect hover:scale-105 transition-transform duration-300">
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-[hsl(43,96%,56%)]">
                  ${(liveStats.totalWinnings / 1000000).toFixed(1)}M
                </div>
                <div className="text-xs text-[hsl(215,13%,45%)]">Total Winnings</div>
              </CardContent>
            </Card>

            <Card className="glass-effect hover:scale-105 transition-transform duration-300">
              <CardContent className="p-4 text-center">
                <Zap className="w-8 h-8 text-[hsl(258,90%,66%)] mx-auto mb-2" />
                <div className="text-2xl font-bold text-[hsl(43,96%,56%)]">
                  {liveStats.gamesPlayed.toLocaleString()}
                </div>
                <div className="text-xs text-[hsl(215,13%,45%)]">Games Today</div>
              </CardContent>
            </Card>

            <Card className="glass-effect hover:scale-105 transition-transform duration-300">
              <CardContent className="p-4 text-center">
                <Award className="w-8 h-8 text-[hsl(43,96%,56%)] mx-auto mb-2" />
                <div className="text-2xl font-bold text-[hsl(43,96%,56%)]">
                  ${liveStats.biggestWin.toLocaleString()}
                </div>
                <div className="text-xs text-[hsl(215,13%,45%)]">Biggest Win</div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Games Section */}
          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold">🎮 Choose Your Game</h2>
              <Badge variant="secondary" className="bg-[hsl(43,96%,56%)]/20 text-[hsl(43,96%,56%)]">
                <Star className="w-4 h-4 mr-1" />
                {games.length} Games Available
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {games.map((game, index) => (
                <Card key={game.id} className="glass-effect hover:scale-105 hover:shadow-lg hover:shadow-[hsl(220,91%,57%)]/25 transition-all duration-300 group" style={{ animationDelay: `${index * 0.1}s` }}>
                  <CardContent className="p-6">
                    <div className="text-center mb-4">
                      <div className="text-6xl mb-3 group-hover:scale-110 transition-transform duration-300">
                        {game.image}
                      </div>
                      <h3 className="text-xl font-bold mb-2">{game.name}</h3>
                      <p className="text-[hsl(215,13%,45%)] text-sm mb-3">{game.description}</p>

                      {/* Popularity Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Popularity</span>
                          <span>{game.popularity}%</span>
                        </div>
                        <div className="w-full bg-[hsl(240,18%,8%)] rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-[hsl(220,91%,57%)] to-[hsl(258,90%,66%)] h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${game.popularity}%` }}
                          ></div>
                        </div>
                      </div>

                      <Badge variant="outline" className="border-[hsl(43,96%,56%)] text-[hsl(43,96%,56%)] mb-4">
                        {game.status}
                      </Badge>
                    </div>

                    <Link href={game.path}>
                      <Button 
                        className={`w-full bg-gradient-to-r ${game.buttonColor} hover:shadow-lg transition-all duration-300 group-hover:scale-105`}
                        data-testid={`button-${game.id}`}
                      >
                        {game.buttonText}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* User Stats & Wallet */}
            <UserStats />
            <WalletSection />

            {/* Recent Big Wins */}
            <Card className="glass-effect">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <Star className="w-5 h-5 mr-2 text-[hsl(43,96%,56%)]" />
                  Recent Big Wins
                </h3>
                <div className="space-y-3">
                  {recentWins.map((win, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-[hsl(240,18%,8%)]/50 rounded-lg animate-pulse">
                      <div>
                        <div className="font-semibold text-sm">{win.player}</div>
                        <div className="text-xs text-[hsl(215,13%,45%)]">{win.game}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[hsl(43,96%,56%)] font-bold">${win.amount}</div>
                        <div className="text-xs text-green-400">{win.multiplier}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Players */}
            {leaderboard && (
              <Card className="glass-effect">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center">
                    <Award className="w-5 h-5 mr-2 text-[hsl(43,96%,56%)]" />
                    Top Players
                  </h3>
                  <div className="space-y-3">
                    {leaderboard.slice(0, 5).map((player: any, index: number) => (
                      <div key={player.id} className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                            {index + 1}
                          </Badge>
                          <span className="font-medium">{player.name}</span>
                        </div>
                        <span className="text-[hsl(43,96%,56%)] font-bold">
                          ${parseFloat(player.totalWinnings).toFixed(0)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Link href="/leaderboard">
                    <Button variant="outline" className="w-full mt-4" size="sm">
                      View Full Leaderboard
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Live Chat */}
            <LiveChat />
          </div>
        </div>
      </div>
    </div>
  );
}