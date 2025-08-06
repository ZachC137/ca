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
import { ArrowLeft, RotateCcw } from "lucide-react";
import { Link } from "wouter";

export default function CoinFlip() {
  const [betAmount, setBetAmount] = useState(10);
  const [choice, setChoice] = useState<'heads' | 'tails'>('heads');
  const [flipping, setFlipping] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [coinSide, setCoinSide] = useState<'heads' | 'tails'>('heads');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const flipMutation = useMutation({
    mutationFn: async ({ betAmount, choice }: { betAmount: number; choice: 'heads' | 'tails' }) => {
      const response = await apiRequest("POST", "/api/games/play", {
        gameType: "coinflip",
        betAmount,
        gameData: { choice },
      });
      return response.json();
    },
    onSuccess: (data) => {
      setLastResult(data);
      setCoinSide(data.gameData.result);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      if (data.result === 'win') {
        toast({
          title: "Winner! 🪙",
          description: `The coin landed on ${data.gameData.result}! You won $${data.winAmount.toFixed(2)}!`,
        });
      } else {
        toast({
          title: "Better luck next time!",
          description: `The coin landed on ${data.gameData.result}. Try again!`,
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
        description: error.message || "Failed to flip coin",
        variant: "destructive",
      });
    },
  });

  const handleFlip = () => {
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

    setFlipping(true);
    setLastResult(null);
    
    // Animate coin flipping
    const flipInterval = setInterval(() => {
      setCoinSide(prev => prev === 'heads' ? 'tails' : 'heads');
    }, 100);

    setTimeout(() => {
      clearInterval(flipInterval);
      flipMutation.mutate({ betAmount, choice });
      setFlipping(false);
    }, 2000);
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
              🪙 Coin Flip
            </h1>
            <p className="text-[hsl(215,13%,45%)] text-lg">
              Simple 50/50 betting game with instant results. Choose heads or tails!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Game Area */}
            <div className="lg:col-span-2">
              <Card className="glass-effect">
                <CardContent className="p-8">
                  {/* Coin Display */}
                  <div className="text-center mb-8">
                    <div className="relative inline-block">
                      <div className={`w-48 h-48 rounded-full mx-auto mb-6 flex items-center justify-center border-4 border-[hsl(43,96%,56%)] ${
                        flipping ? 'animate-spin' : ''
                      } ${coinSide === 'heads' ? 'bg-gradient-to-br from-[hsl(43,96%,56%)] to-yellow-600' : 'bg-gradient-to-br from-gray-400 to-gray-600'}`}>
                        <div className="text-6xl font-bold text-white" data-testid="coin-display">
                          {coinSide === 'heads' ? '👑' : '🏛️'}
                        </div>
                      </div>
                      {flipping && (
                        <div className="absolute -inset-4 border-4 border-[hsl(220,91%,57%)] rounded-full animate-pulse"></div>
                      )}
                    </div>
                    
                    <div className="text-3xl font-bold mb-2" data-testid="coin-side">
                      {coinSide.toUpperCase()}
                    </div>
                    
                    {lastResult && !flipping && (
                      <div className="mt-4" data-testid="result-display">
                        <div className={`text-2xl font-bold ${
                          lastResult.result === 'win' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {lastResult.result === 'win' ? 'YOU WIN!' : 'YOU LOSE'}
                        </div>
                        <div className="text-[hsl(215,13%,45%)]">
                          You chose {lastResult.gameData.choice.toUpperCase()}, coin landed on {lastResult.gameData.result.toUpperCase()}
                        </div>
                        <div className="text-xl text-[hsl(43,96%,56%)]">
                          {lastResult.result === 'win' ? '+' : '-'}${Math.abs(lastResult.winAmount - (lastResult.winAmount || lastResult.betAmount)).toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Choice Buttons */}
                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <Button
                      onClick={() => setChoice('heads')}
                      variant={choice === 'heads' ? 'default' : 'outline'}
                      disabled={flipping}
                      className={`py-12 text-2xl ${
                        choice === 'heads' 
                          ? 'bg-gradient-to-r from-[hsl(43,96%,56%)] to-yellow-600' 
                          : 'border-[hsl(43,96%,56%)]/20 hover:bg-[hsl(43,96%,56%)]/20 text-[hsl(43,96%,56%)]'
                      }`}
                      data-testid="button-choose-heads"
                    >
                      <div className="text-center">
                        <div className="text-6xl mb-4">👑</div>
                        <div>HEADS</div>
                        <div className="text-sm opacity-75 mt-2">50% chance • 1.95x payout</div>
                      </div>
                    </Button>

                    <Button
                      onClick={() => setChoice('tails')}
                      variant={choice === 'tails' ? 'default' : 'outline'}
                      disabled={flipping}
                      className={`py-12 text-2xl ${
                        choice === 'tails' 
                          ? 'bg-gradient-to-r from-gray-500 to-gray-600' 
                          : 'border-gray-500/20 hover:bg-gray-500/20 text-gray-400'
                      }`}
                      data-testid="button-choose-tails"
                    >
                      <div className="text-center">
                        <div className="text-6xl mb-4">🏛️</div>
                        <div>TAILS</div>
                        <div className="text-sm opacity-75 mt-2">50% chance • 1.95x payout</div>
                      </div>
                    </Button>
                  </div>

                  {/* Controls */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Bet Amount</label>
                      <Input
                        type="number"
                        value={betAmount}
                        onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
                        min={1}
                        max={Math.floor(parseFloat(user.balance))}
                        disabled={flipping}
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
                    onClick={handleFlip}
                    disabled={flipping || flipMutation.isPending}
                    className="w-full bg-gradient-to-r from-[hsl(258,90%,66%)] to-purple-600 hover:shadow-lg hover:shadow-[hsl(258,90%,66%)]/25 transition-all duration-300 text-xl py-4"
                    data-testid="button-flip"
                  >
                    {flipping ? (
                      <RotateCcw className="mr-2 h-6 w-6 animate-spin" />
                    ) : (
                      "🪙"
                    )}
                    {flipping ? "FLIPPING..." : `FLIP COIN (${betAmount} credits)`}
                  </Button>

                  {/* Current Selection Display */}
                  <div className="mt-6 text-center">
                    <div className="inline-block px-6 py-3 bg-[hsl(240,18%,8%)]/50 border border-[hsl(258,90%,66%)]/20 rounded-lg">
                      <div className="text-sm text-[hsl(215,13%,45%)]">Your Choice:</div>
                      <div className="text-lg font-bold text-[hsl(258,90%,66%)]" data-testid="display-choice">
                        {choice.toUpperCase()} {choice === 'heads' ? '👑' : '🏛️'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Game Rules */}
              <Card className="glass-effect">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 text-[hsl(258,90%,66%)]">How to Play</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start space-x-2">
                      <span className="text-[hsl(43,96%,56%)]">1.</span>
                      <span>Choose your bet amount</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-[hsl(43,96%,56%)]">2.</span>
                      <span>Select HEADS 👑 or TAILS 🏛️</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-[hsl(43,96%,56%)]">3.</span>
                      <span>Click "Flip Coin" to play</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-[hsl(43,96%,56%)]">4.</span>
                      <span>Win 1.95x your bet if correct!</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Game Info */}
              <Card className="glass-effect">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 text-[hsl(220,91%,57%)]">Game Info</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[hsl(215,13%,45%)]">Win Chance</span>
                      <span>50%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[hsl(215,13%,45%)]">Payout</span>
                      <span className="text-green-400">1.95x</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[hsl(215,13%,45%)]">House Edge</span>
                      <span>2.5%</span>
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
                        disabled={flipping}
                        className="border-[hsl(258,90%,66%)]/20 hover:bg-[hsl(258,90%,66%)]/20"
                        data-testid={`button-quick-bet-${amount}`}
                      >
                        ${amount}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Last Results */}
              <Card className="glass-effect">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4">Recent Flips</h3>
                  <div className="space-y-2">
                    {lastResult && (
                      <div className="space-y-1" data-testid="recent-result">
                        <div className="flex justify-between items-center p-2 bg-[hsl(240,18%,8%)]/50 rounded text-sm">
                          <span className="flex items-center space-x-2">
                            <span>{lastResult.gameData.result === 'heads' ? '👑' : '🏛️'}</span>
                            <span className="capitalize">{lastResult.gameData.result}</span>
                          </span>
                          <span className={`${
                            lastResult.result === 'win' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {lastResult.result === 'win' ? '+' : '-'}${Math.abs(lastResult.winAmount - (lastResult.winAmount || lastResult.betAmount)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                    {!lastResult && (
                      <div className="text-[hsl(215,13%,45%)] text-center py-4 text-sm">
                        No flips yet. Start playing!
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Strategy Tips */}
              <Card className="glass-effect">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 text-[hsl(43,96%,56%)]">Tips</h3>
                  <div className="space-y-2 text-sm text-[hsl(215,13%,45%)]">
                    <p>• Each flip is completely independent</p>
                    <p>• Previous results don't affect future outcomes</p>
                    <p>• Always bet within your limits</p>
                    <p>• This is a game of pure chance</p>
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
