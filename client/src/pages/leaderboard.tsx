import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Medal, Award, Crown, Star } from "lucide-react";
import { Link } from "wouter";

export default function Leaderboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

  const { data: leaderboard = [], isLoading: isLoadingLeaderboard } = useQuery<any[]>({
    queryKey: ["/api/leaderboard"],
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

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-[hsl(43,96%,56%)]" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <Trophy className="h-6 w-6 text-[hsl(215,13%,45%)]" />;
    }
  };

  const getRankBackground = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-[hsl(43,96%,56%)]/20 to-yellow-600/20 border-[hsl(43,96%,56%)]/30";
      case 2:
        return "bg-gradient-to-r from-gray-500/20 to-gray-600/20 border-gray-500/30";
      case 3:
        return "bg-gradient-to-r from-amber-600/20 to-amber-700/20 border-amber-600/30";
      default:
        return "bg-[hsl(240,18%,8%)]/50 border-[hsl(215,13%,45%)]/20";
    }
  };

  const getRankNumber = (rank: number) => {
    return (
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
        rank === 1 ? 'bg-[hsl(43,96%,56%)] text-black' :
        rank === 2 ? 'bg-gray-400 text-white' :
        rank === 3 ? 'bg-amber-600 text-white' :
        'bg-[hsl(215,13%,45%)] text-white'
      }`}>
        {rank}
      </div>
    );
  };

  const getDisplayName = (player: any) => {
    if (player.firstName) {
      return player.firstName + (player.lastName ? ` ${player.lastName.charAt(0)}.` : '');
    }
    return player.email?.split('@')[0] || 'Anonymous';
  };

  const getAvatarUrl = (player: any) => {
    return player.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100";
  };

  const getUserLevel = (player: any) => {
    const level = player.level || 1;
    const titles = ['Beginner', 'Player', 'Regular', 'VIP', 'Premium', 'Elite', 'Master', 'Legend', 'Champion', 'Grandmaster'];
    const titleIndex = Math.min(Math.floor((level - 1) / 2), titles.length - 1);
    return `Level ${level} ${titles[titleIndex]}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[hsl(220,91%,57%)]"></div>
          <p className="mt-4 text-lg">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-casino-dark via-casino-navy to-casino-dark text-white">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-[hsl(220,91%,57%)] via-[hsl(258,90%,66%)] to-[hsl(43,96%,56%)] bg-clip-text text-transparent">
              🏆 Top Players Leaderboard
            </h1>
            <p className="text-[hsl(215,13%,45%)] text-lg">
              Compete for the top spot and earn exclusive rewards as a champion player
            </p>
          </div>

          <Card className="glass-effect overflow-hidden">
            <div className="bg-gradient-to-r from-[hsl(220,91%,57%)] to-[hsl(258,90%,66%)] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold flex items-center">
                    <Trophy className="mr-2 h-6 w-6" />
                    Weekly Champions
                  </h2>
                  <p className="text-[hsl(215,13%,45%)] mt-1">Ranked by total winnings and gaming activity</p>
                </div>
                <div className="text-right text-sm">
                  <div className="text-white/80">Updated Live</div>
                  <div className="flex items-center text-green-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-1"></div>
                    Active
                  </div>
                </div>
              </div>
            </div>

            <CardContent className="p-6">
              {isLoadingLeaderboard ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(220,91%,57%)] mx-auto mb-4"></div>
                  <p className="text-[hsl(215,13%,45%)]">Loading player rankings...</p>
                </div>
              ) : leaderboard && leaderboard.length > 0 ? (
                <div className="space-y-4">
                  {leaderboard.map((player: any, index: number) => {
                    const rank = index + 1;
                    const isCurrentUser = user && user.id === player.id;
                    
                    return (
                      <div
                        key={player.id}
                        className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-300 hover:scale-[1.02] ${
                          getRankBackground(rank)
                        } ${isCurrentUser ? 'ring-2 ring-[hsl(220,91%,57%)]' : ''}`}
                        data-testid={`leaderboard-player-${index}`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-3">
                            {getRankNumber(rank)}
                            {getRankIcon(rank)}
                          </div>
                          
                          <img
                            src={getAvatarUrl(player)}
                            alt="Player Avatar"
                            className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
                            data-testid={`img-avatar-player-${index}`}
                          />
                          
                          <div>
                            <div className="flex items-center space-x-2">
                              <span 
                                className={`font-semibold ${
                                  rank === 1 ? 'text-[hsl(43,96%,56%)]' :
                                  rank === 2 ? 'text-gray-300' :
                                  rank === 3 ? 'text-amber-400' :
                                  'text-white'
                                }`}
                                data-testid={`text-username-player-${index}`}
                              >
                                {getDisplayName(player)}
                                {isCurrentUser && (
                                  <span className="ml-2 text-xs bg-[hsl(220,91%,57%)] px-2 py-1 rounded-full">
                                    YOU
                                  </span>
                                )}
                              </span>
                              {rank <= 3 && <Star className="h-4 w-4 text-[hsl(43,96%,56%)]" />}
                            </div>
                            <div className="text-sm text-[hsl(215,13%,45%)]" data-testid={`text-level-player-${index}`}>
                              {getUserLevel(player)}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div 
                            className={`text-xl font-bold ${
                              rank === 1 ? 'text-[hsl(43,96%,56%)]' :
                              rank === 2 ? 'text-gray-300' :
                              rank === 3 ? 'text-amber-400' :
                              'text-white'
                            }`}
                            data-testid={`text-winnings-player-${index}`}
                          >
                            ${parseFloat(player.totalWinnings || "0").toFixed(2)}
                          </div>
                          <div className="text-sm text-[hsl(215,13%,45%)]">
                            {player.gamesPlayed || 0} games played
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Trophy className="h-16 w-16 text-[hsl(215,13%,45%)] mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Players Yet</h3>
                  <p className="text-[hsl(215,13%,45%)] mb-6">
                    Be the first to start playing and claim the top spot on the leaderboard!
                  </p>
                  <Link href="/">
                    <Button className="bg-gradient-to-r from-[hsl(220,91%,57%)] to-[hsl(258,90%,66%)] hover:shadow-lg hover:shadow-[hsl(220,91%,57%)]/25 transition-all duration-300">
                      Start Playing
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card className="glass-effect">
              <CardContent className="p-6 text-center">
                <Crown className="h-12 w-12 text-[hsl(43,96%,56%)] mx-auto mb-3" />
                <h3 className="font-bold text-lg mb-2">Weekly Champion</h3>
                <p className="text-[hsl(215,13%,45%)] text-sm">
                  Earn exclusive rewards and recognition as the top player of the week
                </p>
              </CardContent>
            </Card>

            <Card className="glass-effect">
              <CardContent className="p-6 text-center">
                <Star className="h-12 w-12 text-[hsl(258,90%,66%)] mx-auto mb-3" />
                <h3 className="font-bold text-lg mb-2">Level System</h3>
                <p className="text-[hsl(215,13%,45%)] text-sm">
                  Progress through levels by playing games and earning experience points
                </p>
              </CardContent>
            </Card>

            <Card className="glass-effect">
              <CardContent className="p-6 text-center">
                <Trophy className="h-12 w-12 text-[hsl(220,91%,57%)] mx-auto mb-3" />
                <h3 className="font-bold text-lg mb-2">Live Rankings</h3>
                <p className="text-[hsl(215,13%,45%)] text-sm">
                  Rankings update in real-time as players win games and climb the ladder
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Back to Dashboard */}
          <div className="text-center mt-8">
            <Link href="/">
              <Button 
                variant="outline" 
                className="border-[hsl(220,91%,57%)]/20 hover:bg-[hsl(220,91%,57%)]/20"
                data-testid="button-back-to-dashboard"
              >
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
