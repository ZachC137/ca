import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Spade } from "lucide-react";
import { Link } from "wouter";

export default function Blackjack() {
  const [betAmount, setBetAmount] = useState(10);
  const [gameState, setGameState] = useState<'betting' | 'playing' | 'finished'>('betting');
  const [lastResult, setLastResult] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const playMutation = useMutation({
    mutationFn: async ({ betAmount }: { betAmount: number }) => {
      const response = await apiRequest("POST", "/api/games/play", {
        gameType: "blackjack",
        betAmount,
        gameData: {},
      });
      return response.json();
    },
    onSuccess: (data) => {
      setLastResult(data);
      setGameState('finished');
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      if (data.result === 'win') {
        toast({
          title: "Blackjack! 🃏",
          description: `You beat the dealer! Player: ${data.gameData.playerTotal}, Dealer: ${data.gameData.dealerTotal}. Won $${data.winAmount.toFixed(2)}!`,
        });
      } else if (data.result === 'push') {
        toast({
          title: "Push!",
          description: `It's a tie! Player: ${data.gameData.playerTotal}, Dealer: ${data.gameData.dealerTotal}`,
        });
      } else {
        toast({
          title: "Dealer wins",
          description: `Player: ${data.gameData.playerTotal}, Dealer: ${data.gameData.dealerTotal}. Better luck next hand!`,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to play blackjack",
        variant: "destructive",
      });
    },
  });

  const handleDeal = () => {
    if (!user) return;
    
    const balance = parseFloat(user.balance);
    if (balance < betAmount) {
      toast({
        title: "Insufficient Balance",
        description: "Please add more funds to continue playing",
        variant: "destructive",
      });
      return;
    }

    setGameState('playing');
    setLastResult(null);
    playMutation.mutate({ betAmount });
  };

  const newGame = () => {
    setGameState('betting');
    setLastResult(null);
  };

  const getCardValue = (total: number): string => {
    if (total > 21) return `${total} (BUST)`;
    if (total === 21) return `${total} (BLACKJACK!)`;
    return total.toString();
  };

  const getResultColor = (result: string): string => {
    switch (result) {
      case 'win': return 'text-green-400';
      case 'push': return 'text-yellow-400';
      default: return 'text-red-400';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[hsl(220,91%,57%)]"></div>
          <p className="mt-4 text-lg">Loading game...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-casino-dark via-casino-navy to-casino-dark text-white">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="text-[hsl(215,13%,45%)] hover:text-white" data-testid="button-back">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-[hsl(220,91%,57%)] via-[hsl(258,90%,66%)] to-[hsl(43,96%,56%)] bg-clip-text text-transparent">
              🃏 Classic Blackjack
            </h1>
            <p className="text-[hsl(215,13%,45%)] text-lg">
              Beat the dealer by getting as close to 21 as possible without going over!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Game Table */}
            <div className="lg:col-span-2">
              <Card className="glass-effect">
                <CardContent className="p-8">
                  {/* Table */}
                  <div className="bg-green-800 rounded-lg p-8 mb-6 relative">
                    <div className="absolute top-4 left-4 text-[hsl(43,96%,56%)] font-bold">
                      DEALER
                    </div>
                    <div className="absolute bottom-4 right-4 text-[hsl(43,96%,56%)] font-bold">
                      PLAYER
                    </div>

                    {/* Dealer's Hand */}
                    <div className="text-center mb-8">
                      <h3 className="text-lg font-semibold mb-4 text-[hsl(43,96%,56%)]">Dealer's Hand</h3>
                      <div className="flex justify-center space-x-2 mb-4">
                        {gameState === 'betting' ? (
                          <>
                            <div className="w-16 h-24 bg-blue-900 border-2 border-white rounded-lg flex items-center justify-center">
                              <Spade className="text-white" />
                            </div>
                            <div className="w-16 h-24 bg-blue-900 border-2 border-white rounded-lg flex items-center justify-center">
                              <Spade className="text-white" />
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-16 h-24 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center text-black font-bold">
                              🃏
                            </div>
                            <div className="w-16 h-24 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center text-black font-bold">
                              🂠
                            </div>
                          </>
                        )}
                      </div>
                      <div className="text-xl font-bold" data-testid="dealer-total">
                        {gameState === 'betting' ? '?' : 
                         lastResult ? getCardValue(lastResult.gameData.dealerTotal) : '?'}
                      </div>
                    </div>

                    {/* Player's Hand */}
                    <div className="text-center">
                      <h3 className="text-lg font-semibold mb-4 text-[hsl(43,96%,56%)]">Your Hand</h3>
                      <div className="flex justify-center space-x-2 mb-4">
                        {gameState === 'betting' ? (
                          <>
                            <div className="w-16 h-24 bg-blue-900 border-2 border-white rounded-lg flex items-center justify-center">
                              <Spade className="text-white" />
                            </div>
                            <div className="w-16 h-24 bg-blue-900 border-2 border-white rounded-lg flex items-center justify-center">
                              <Spade className="text-white" />
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-16 h-24 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center text-black font-bold">
                              🂱
                            </div>
                            <div className="w-16 h-24 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center text-black font-bold">
                              🂾
                            </div>
                          </>
                        )}
                      </div>
                      <div className="text-xl font-bold" data-testid="player-total">
                        {gameState === 'betting' ? '?' : 
                         lastResult ? getCardValue(lastResult.gameData.playerTotal) : '?'}
                      </div>
                    </div>

                    {/* Result */}
                    {lastResult && gameState === 'finished' && (
                      <div className="text-center mt-6" data-testid="game-result">
                        <div className={`text-3xl font-bold ${getResultColor(lastResult.result)}`}>
                          {lastResult.result === 'win' ? 'YOU WIN!' :
                           lastResult.result === 'push' ? 'PUSH!' : 'DEALER WINS'}
                        </div>
                        <div className="text-lg text-[hsl(43,96%,56%)] mt-2">
                          {lastResult.result === 'win' ? `+$${lastResult.winAmount.toFixed(2)}` :
                           lastResult.result === 'push' ? 'No money lost' :
                           `-$${lastResult.betAmount.toFixed(2)}`}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="space-y-4">
                    {gameState === 'betting' && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Bet Amount</label>
                            <Input
                              type="number"
                              value={betAmount}
                              onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
                              min={1}
                              max={Math.floor(parseFloat(user.balance))}
                              className="bg-[hsl(240,18%,8%)]/50 border-[hsl(220,91%,57%)]/20 text-white"
                              data-testid="input-bet-amount"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Balance</label>
                            <div className="px-3 py-2 bg-[hsl(240,18%,8%)]/50 border border-[hsl(220,91%,57%)]/20 rounded-md text-[hsl(43,96%,56%)] font-bold" data-testid="display-balance">
                              ${user.balance}
                            </div>
                          </div>
                        </div>

                        <Button
                          onClick={handleDeal}
                          disabled={playMutation.isPending}
                          className="w-full bg-gradient-to-r from-[hsl(43,96%,56%)] to-yellow-600 hover:shadow-lg hover:shadow-[hsl(43,96%,56%)]/25 transition-all duration-300 text-xl py-4"
                          data-testid="button-deal"
                        >
                          🃏 Deal Cards (${betAmount})
                        </Button>
                      </>
                    )}

                    {gameState === 'playing' && (
                      <div className="text-center">
                        <div className="text-lg text-[hsl(215,13%,45%)] mb-4">
                          Dealing cards and calculating results...
                        </div>
                        <div className="animate-pulse">
                          <Spade className="mx-auto h-8 w-8 text-[hsl(220,91%,57%)]" />
                        </div>
                      </div>
                    )}

                    {gameState === 'finished' && (
                      <Button
                        onClick={newGame}
                        className="w-full bg-gradient-to-r from-[hsl(220,91%,57%)] to-[hsl(258,90%,66%)] hover:shadow-lg hover:shadow-[hsl(220,91%,57%)]/25 transition-all duration-300 text-xl py-4"
                        data-testid="button-new-game"
                      >
                        🃏 New Game
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Rules */}
              <Card className="glass-effect">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 text-[hsl(43,96%,56%)]">How to Play</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start space-x-2">
                      <span className="text-[hsl(220,91%,57%)]">•</span>
                      <span>Get as close to 21 as possible</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-[hsl(220,91%,57%)]">•</span>
                      <span>Beat the dealer without going over 21</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-[hsl(220,91%,57%)]">•</span>
                      <span>Face cards are worth 10</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-[hsl(220,91%,57%)]">•</span>
                      <span>Aces can be 1 or 11</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-[hsl(220,91%,57%)]">•</span>
                      <span>Dealer hits on 16, stands on 17</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payouts */}
              <Card className="glass-effect">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 text-[hsl(258,90%,66%)]">Payouts</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Blackjack (21)</span>
                      <span className="text-[hsl(43,96%,56%)]">3:2</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Regular Win</span>
                      <span className="text-green-400">1:1</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Push (Tie)</span>
                      <span className="text-yellow-400">Push</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bust</span>
                      <span className="text-red-400">Lose Bet</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Game Stats */}
              <Card className="glass-effect">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 text-[hsl(220,91%,57%)]">Game Info</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[hsl(215,13%,45%)]">RTP</span>
                      <span>99.5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[hsl(215,13%,45%)]">House Edge</span>
                      <span>0.5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[hsl(215,13%,45%)]">Min Bet</span>
                      <span>$1</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[hsl(215,13%,45%)]">Max Bet</span>
                      <span>$1000</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Bets */}
              <Card className="glass-effect">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4">Quick Bets</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[1, 5, 10, 25, 50, 100].map((amount) => (
                      <Button
                        key={amount}
                        onClick={() => setBetAmount(amount)}
                        variant="outline"
                        size="sm"
                        disabled={gameState !== 'betting'}
                        className="border-[hsl(43,96%,56%)]/20 hover:bg-[hsl(43,96%,56%)]/20"
                        data-testid={`button-quick-bet-${amount}`}
                      >
                        ${amount}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
