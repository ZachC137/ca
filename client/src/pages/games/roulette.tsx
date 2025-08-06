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

interface Bet {
  type: 'number' | 'color' | 'odd_even';
  value: number | string;
  amount: number;
}

export default function Roulette() {
  const [betAmount, setBetAmount] = useState(10);
  const [bets, setBets] = useState<Bet[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const spinMutation = useMutation({
    mutationFn: async ({ bet }: { bet: Bet }) => {
      const response = await apiRequest("POST", "/api/games/play", {
        gameType: "roulette",
        betAmount: bet.amount,
        gameData: { bet },
      });
      return response.json();
    },
    onSuccess: (data) => {
      setLastResult(data);
      setBets([]);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      if (data.result === 'win') {
        toast({
          title: "Winner! 🎯",
          description: `The ball landed on ${data.gameData.number} ${data.gameData.color}! You won $${data.winAmount.toFixed(2)}!`,
        });
      } else {
        toast({
          title: "No luck this time!",
          description: `The ball landed on ${data.gameData.number} ${data.gameData.color}. Better luck next spin!`,
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
        description: error.message || "Failed to spin roulette",
        variant: "destructive",
      });
    },
  });

  const addBet = (bet: Omit<Bet, 'amount'>) => {
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

    setBets(prev => [...prev, { ...bet, amount: betAmount }]);
  };

  const handleSpin = () => {
    if (bets.length === 0) {
      toast({
        title: "No Bets Placed",
        description: "Please place at least one bet before spinning",
        variant: "destructive",
      });
      return;
    }

    setSpinning(true);
    setLastResult(null);
    
    // Use the first bet for now (in a real game, you'd handle multiple bets)
    const firstBet = bets[0];
    
    setTimeout(() => {
      spinMutation.mutate({ bet: firstBet });
      setSpinning(false);
    }, 3000);
  };

  const clearBets = () => {
    setBets([]);
  };

  const getNumberColor = (num: number): string => {
    if (num === 0) return 'green';
    const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    return redNumbers.includes(num) ? 'red' : 'black';
  };

  const totalBetAmount = bets.reduce((sum, bet) => sum + bet.amount, 0);

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

        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-[hsl(220,91%,57%)] via-[hsl(258,90%,66%)] to-[hsl(43,96%,56%)] bg-clip-text text-transparent">
              🎯 European Roulette
            </h1>
            <p className="text-[hsl(215,13%,45%)] text-lg">
              Place your bets and watch the wheel spin! Single zero European style.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Roulette Wheel */}
            <div className="lg:col-span-2">
              <Card className="glass-effect">
                <CardContent className="p-8">
                  <div className="text-center mb-8">
                    <div className="relative inline-block">
                      <div className={`w-48 h-48 rounded-full border-8 border-[hsl(43,96%,56%)] bg-gradient-to-br from-green-800 to-green-900 flex items-center justify-center mx-auto ${
                        spinning ? 'animate-spin' : ''
                      }`}>
                        <div className="w-32 h-32 rounded-full bg-black flex items-center justify-center">
                          <div className="text-4xl text-[hsl(43,96%,56%)]">
                            {spinning ? '🎯' : (lastResult?.gameData?.number ?? '?')}
                          </div>
                        </div>
                      </div>
                      {spinning && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl">
                          ⚪
                        </div>
                      )}
                    </div>
                    
                    {lastResult && !spinning && (
                      <div className="mt-6" data-testid="result-display">
                        <div className={`text-3xl font-bold ${
                          lastResult.result === 'win' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {lastResult.result === 'win' ? 'WINNER!' : 'NO WIN'}
                        </div>
                        <div className="text-xl">
                          <span className={`px-3 py-1 rounded ${
                            lastResult.gameData.color === 'red' ? 'bg-red-600' :
                            lastResult.gameData.color === 'black' ? 'bg-black' :
                            'bg-green-600'
                          }`}>
                            {lastResult.gameData.number} {lastResult.gameData.color.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-lg text-[hsl(43,96%,56%)] mt-2">
                          {lastResult.result === 'win' ? '+' : '-'}${Math.abs(lastResult.winAmount - (lastResult.winAmount || lastResult.betAmount)).toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Bet Buttons */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <Button
                      onClick={() => addBet({ type: 'color', value: 'red' })}
                      disabled={spinning}
                      className="bg-red-600 hover:bg-red-700 py-4"
                      data-testid="button-bet-red"
                    >
                      <div className="text-center">
                        <div className="text-lg font-bold">RED</div>
                        <div className="text-sm">Pays 2:1</div>
                      </div>
                    </Button>

                    <Button
                      onClick={() => addBet({ type: 'color', value: 'black' })}
                      disabled={spinning}
                      className="bg-black hover:bg-gray-800 py-4"
                      data-testid="button-bet-black"
                    >
                      <div className="text-center">
                        <div className="text-lg font-bold">BLACK</div>
                        <div className="text-sm">Pays 2:1</div>
                      </div>
                    </Button>

                    <Button
                      onClick={() => addBet({ type: 'color', value: 'green' })}
                      disabled={spinning}
                      className="bg-green-600 hover:bg-green-700 py-4"
                      data-testid="button-bet-green"
                    >
                      <div className="text-center">
                        <div className="text-lg font-bold">GREEN (0)</div>
                        <div className="text-sm">Pays 35:1</div>
                      </div>
                    </Button>
                  </div>

                  {/* Number Grid */}
                  <div className="grid grid-cols-6 gap-1 mb-6">
                    {Array.from({ length: 37 }, (_, i) => (
                      <Button
                        key={i}
                        onClick={() => addBet({ type: 'number', value: i })}
                        disabled={spinning}
                        variant="outline"
                        className={`aspect-square text-sm font-bold ${
                          i === 0 ? 'bg-green-600 border-green-600 text-white hover:bg-green-700' :
                          getNumberColor(i) === 'red' ? 'bg-red-600 border-red-600 text-white hover:bg-red-700' :
                          'bg-black border-gray-600 text-white hover:bg-gray-800'
                        }`}
                        data-testid={`button-number-${i}`}
                      >
                        {i}
                      </Button>
                    ))}
                  </div>

                  {/* Bet Controls */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Bet Amount</label>
                      <Input
                        type="number"
                        value={betAmount}
                        onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
                        min={1}
                        max={Math.floor(parseFloat(user.balance))}
                        disabled={spinning}
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

                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      onClick={clearBets}
                      disabled={spinning || bets.length === 0}
                      variant="outline"
                      className="border-red-500/20 hover:bg-red-500/20 text-red-400"
                      data-testid="button-clear-bets"
                    >
                      Clear Bets
                    </Button>

                    <Button
                      onClick={handleSpin}
                      disabled={spinning || spinMutation.isPending || bets.length === 0}
                      className="bg-gradient-to-r from-[hsl(43,96%,56%)] to-yellow-600 hover:shadow-lg hover:shadow-[hsl(43,96%,56%)]/25 transition-all duration-300"
                      data-testid="button-spin"
                    >
                      {spinning ? (
                        <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        "🎯"
                      )}
                      {spinning ? "SPINNING..." : "SPIN WHEEL"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-2 space-y-6">
              {/* Active Bets */}
              <Card className="glass-effect">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 text-[hsl(220,91%,57%)]">Active Bets</h3>
                  {bets.length > 0 ? (
                    <div className="space-y-2" data-testid="active-bets">
                      {bets.map((bet, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-[hsl(240,18%,8%)]/50 rounded">
                          <span className="capitalize">
                            {bet.type === 'number' ? `Number ${bet.value}` : 
                             bet.type === 'color' ? `${bet.value} Color` :
                             `${bet.value}`}
                          </span>
                          <span className="text-[hsl(43,96%,56%)]">${bet.amount}</span>
                        </div>
                      ))}
                      <div className="border-t border-[hsl(215,13%,45%)]/20 pt-2 mt-2">
                        <div className="flex justify-between font-bold">
                          <span>Total</span>
                          <span className="text-[hsl(43,96%,56%)]">${totalBetAmount}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[hsl(215,13%,45%)] text-center py-4">
                      No bets placed yet
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payouts */}
              <Card className="glass-effect">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 text-[hsl(258,90%,66%)]">Payouts</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Single Number</span>
                      <span className="text-[hsl(43,96%,56%)]">35:1</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Red/Black</span>
                      <span className="text-green-400">2:1</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Odd/Even</span>
                      <span className="text-green-400">2:1</span>
                    </div>
                    <div className="flex justify-between">
                      <span>High/Low</span>
                      <span className="text-green-400">2:1</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Game Info */}
              <Card className="glass-effect">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 text-[hsl(43,96%,56%)]">Game Info</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[hsl(215,13%,45%)]">Type</span>
                      <span>European (Single Zero)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[hsl(215,13%,45%)]">House Edge</span>
                      <span>2.7%</span>
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
                  <h3 className="text-xl font-bold mb-4">Quick Bet Amounts</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 5, 10, 25, 50, 100].map((amount) => (
                      <Button
                        key={amount}
                        onClick={() => setBetAmount(amount)}
                        variant="outline"
                        size="sm"
                        disabled={spinning}
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
