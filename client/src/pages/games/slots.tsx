import { useState, useEffect } from "react";
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

const symbols = ['🍒', '🍋', '🔔', '⭐', '💎', '7️⃣'];

export default function Slots() {
  const [betAmount, setBetAmount] = useState(10);
  const [reels, setReels] = useState(['🍒', '🍋', '🔔']);
  const [spinning, setSpinning] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const spinMutation = useMutation({
    mutationFn: async ({ betAmount }: { betAmount: number }) => {
      const response = await apiRequest("POST", "/api/games/play", {
        gameType: "slots",
        betAmount,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setReels(data.gameData.reels);
      setLastResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      if (data.result === 'win') {
        toast({
          title: "Congratulations! 🎉",
          description: `You won $${data.winAmount.toFixed(2)} with ${data.multiplier}x multiplier!`,
        });
      } else {
        toast({
          title: "Try Again!",
          description: "Better luck next spin!",
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
        description: error.message || "Failed to spin reels",
        variant: "destructive",
      });
    },
  });

  const handleSpin = () => {
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

    setSpinning(true);
    setLastResult(null);
    
    // Animate spinning
    const spinInterval = setInterval(() => {
      setReels([
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
      ]);
    }, 100);

    setTimeout(() => {
      clearInterval(spinInterval);
      spinMutation.mutate({ betAmount });
      setSpinning(false);
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
              🎰 Lucky Slots
            </h1>
            <p className="text-[hsl(215,13%,45%)] text-lg">
              Classic slot machine with big multipliers and exciting bonuses!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Game Area */}
            <div className="lg:col-span-2">
              <Card className="glass-effect">
                <CardContent className="p-8">
                  {/* Slot Machine */}
                  <div className="bg-gradient-to-b from-[hsl(43,96%,56%)] to-yellow-600 p-6 rounded-xl mb-6">
                    <div className="bg-black p-6 rounded-lg">
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        {reels.map((symbol, index) => (
                          <div
                            key={index}
                            className={`aspect-square bg-white rounded-lg flex items-center justify-center text-6xl ${
                              spinning ? 'animate-pulse' : ''
                            }`}
                            data-testid={`reel-${index}`}
                          >
                            {symbol}
                          </div>
                        ))}
                      </div>
                      
                      {/* Paylines */}
                      <div className="text-center text-[hsl(43,96%,56%)]">
                        <div className="text-lg font-bold">
                          {lastResult && (
                            <div data-testid="text-last-result">
                              {lastResult.result === 'win' ? (
                                <span className="text-green-400">
                                  WIN! ${lastResult.winAmount.toFixed(2)} ({lastResult.multiplier}x)
                                </span>
                              ) : (
                                <span className="text-red-400">Try Again!</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="space-y-4">
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
                      onClick={handleSpin}
                      disabled={spinning || spinMutation.isPending}
                      className="w-full bg-gradient-to-r from-[hsl(220,91%,57%)] to-[hsl(258,90%,66%)] hover:shadow-lg hover:shadow-[hsl(220,91%,57%)]/25 transition-all duration-300 text-xl py-4"
                      data-testid="button-spin"
                    >
                      {spinning ? (
                        <RotateCcw className="mr-2 h-6 w-6 animate-spin" />
                      ) : (
                        "🎰"
                      )}
                      {spinning ? "SPINNING..." : `SPIN (${betAmount} credits)`}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Paytable */}
              <Card className="glass-effect">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 text-[hsl(43,96%,56%)]">Paytable</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>💎 💎 💎</span>
                      <span className="text-[hsl(43,96%,56%)]">50x</span>
                    </div>
                    <div className="flex justify-between">
                      <span>7️⃣ 7️⃣ 7️⃣</span>
                      <span className="text-[hsl(43,96%,56%)]">25x</span>
                    </div>
                    <div className="flex justify-between">
                      <span>⭐ ⭐ ⭐</span>
                      <span className="text-[hsl(258,90%,66%)]">10x</span>
                    </div>
                    <div className="flex justify-between">
                      <span>🔔 🔔 🔔</span>
                      <span className="text-[hsl(258,90%,66%)]">10x</span>
                    </div>
                    <div className="flex justify-between">
                      <span>🍋 🍋 🍋</span>
                      <span className="text-[hsl(258,90%,66%)]">10x</span>
                    </div>
                    <div className="flex justify-between">
                      <span>🍒 🍒 🍒</span>
                      <span className="text-[hsl(258,90%,66%)]">10x</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Any 2 Match</span>
                      <span className="text-green-400">2x</span>
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
                      <span className="text-[hsl(215,13%,45%)]">RTP</span>
                      <span>96.5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[hsl(215,13%,45%)]">Min Bet</span>
                      <span>$1</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[hsl(215,13%,45%)]">Max Bet</span>
                      <span>$1000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[hsl(215,13%,45%)]">Max Win</span>
                      <span className="text-[hsl(43,96%,56%)]">50,000x</span>
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
                        className="border-[hsl(220,91%,57%)]/20 hover:bg-[hsl(220,91%,57%)]/20"
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
