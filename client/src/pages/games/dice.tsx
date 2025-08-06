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
import { ArrowLeft, Dice1 } from "lucide-react";
import { Link } from "wouter";

export default function Dice() {
  const [betAmount, setBetAmount] = useState(10);
  const [prediction, setPrediction] = useState<'high' | 'low'>('high');
  const [rolling, setRolling] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const rollMutation = useMutation({
    mutationFn: async ({ betAmount, prediction }: { betAmount: number; prediction: 'high' | 'low' }) => {
      const response = await apiRequest("POST", "/api/games/play", {
        gameType: "dice",
        betAmount,
        gameData: { prediction },
      });
      return response.json();
    },
    onSuccess: (data) => {
      setLastResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      if (data.result === 'win') {
        toast({
          title: "Winner! 🎲",
          description: `You rolled ${data.gameData.roll} and won $${data.winAmount.toFixed(2)}!`,
        });
      } else {
        toast({
          title: "Better luck next time!",
          description: `You rolled ${data.gameData.roll}. Try again!`,
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
        description: error.message || "Failed to roll dice",
        variant: "destructive",
      });
    },
  });

  const handleRoll = () => {
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

    setRolling(true);
    setLastResult(null);
    
    // Simulate rolling animation
    setTimeout(() => {
      rollMutation.mutate({ betAmount, prediction });
      setRolling(false);
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
              🎲 Provably Fair Dice
            </h1>
            <p className="text-[hsl(215,13%,45%)] text-lg">
              Bet on high (51-100) or low (1-50) outcomes with cryptographic verification
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Game Area */}
            <div className="lg:col-span-2">
              <Card className="glass-effect">
                <CardContent className="p-8">
                  {/* Dice Display */}
                  <div className="text-center mb-8">
                    <div className="relative inline-block">
                      <div className={`w-24 h-24 bg-white rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg ${
                        rolling ? 'animate-spin' : ''
                      }`}>
                        <div className="text-4xl text-black font-bold" data-testid="dice-display">
                          {rolling ? '?' : (lastResult?.gameData?.roll || '?')}
                        </div>
                      </div>
                      {rolling && (
                        <div className="absolute -inset-2 border-2 border-[hsl(220,91%,57%)] rounded-xl animate-pulse"></div>
                      )}
                    </div>
                    
                    {lastResult && !rolling && (
                      <div className="mt-4" data-testid="result-display">
                        <div className={`text-xl font-bold mb-2 ${
                          lastResult.result === 'win' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {lastResult.result === 'win' ? 'WIN!' : 'LOSS'}
                        </div>
                        <div className="text-sm text-[hsl(215,13%,45%)] mb-1">
                          You predicted {lastResult.gameData.prediction.toUpperCase()} and rolled {lastResult.gameData.roll}
                        </div>
                        <div className="text-lg text-[hsl(43,96%,56%)] font-semibold">
                          {lastResult.result === 'win' ? '+' : '-'}${Math.abs(lastResult.winAmount - (lastResult.winAmount || lastResult.betAmount)).toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Prediction Buttons */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <Button
                      onClick={() => setPrediction('low')}
                      variant={prediction === 'low' ? 'default' : 'outline'}
                      disabled={rolling}
                      className={`h-20 text-base font-medium ${
                        prediction === 'low' 
                          ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' 
                          : 'border-red-500/30 hover:bg-red-500/10 text-red-400 hover:text-red-300'
                      }`}
                      data-testid="button-predict-low"
                    >
                      <div className="text-center">
                        <div className="text-xl mb-1">📉</div>
                        <div className="font-bold">LOW (1-50)</div>
                        <div className="text-xs opacity-80">Win Chance: 50%</div>
                      </div>
                    </Button>

                    <Button
                      onClick={() => setPrediction('high')}
                      variant={prediction === 'high' ? 'default' : 'outline'}
                      disabled={rolling}
                      className={`h-20 text-base font-medium ${
                        prediction === 'high' 
                          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                          : 'border-green-500/30 hover:bg-green-500/10 text-green-400 hover:text-green-300'
                      }`}
                      data-testid="button-predict-high"
                    >
                      <div className="text-center">
                        <div className="text-xl mb-1">📈</div>
                        <div className="font-bold">HIGH (51-100)</div>
                        <div className="text-xs opacity-80">Win Chance: 50%</div>
                      </div>
                    </Button>
                  </div>

                  {/* Controls */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-[hsl(215,13%,65%)]">Bet Amount</label>
                      <Input
                        type="number"
                        value={betAmount}
                        onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
                        min={1}
                        max={Math.floor(parseFloat(user.balance))}
                        disabled={rolling}
                        className="h-12 bg-[hsl(240,18%,8%)]/50 border-[hsl(220,91%,57%)]/20 text-white text-lg font-semibold"
                        data-testid="input-bet-amount"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-[hsl(215,13%,65%)]">Balance</label>
                      <div className="h-12 px-3 flex items-center bg-[hsl(240,18%,8%)]/50 border border-[hsl(220,91%,57%)]/20 rounded-md text-[hsl(43,96%,56%)] font-bold text-lg" data-testid="display-balance">
                        ${user.balance}
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleRoll}
                    disabled={rolling || rollMutation.isPending}
                    className="w-full h-14 bg-gradient-to-r from-[hsl(258,90%,66%)] to-purple-600 hover:shadow-lg hover:shadow-[hsl(258,90%,66%)]/25 transition-all duration-300 text-lg font-bold"
                    data-testid="button-roll"
                  >
                    {rolling ? (
                      <Dice1 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      "🎲"
                    )}
                    {rolling ? "ROLLING..." : `ROLL DICE ($${betAmount})`}
                  </Button>
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
                      <span>Predict HIGH (51-100) or LOW (1-50)</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-[hsl(43,96%,56%)]">3.</span>
                      <span>Roll the dice and see if you win!</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-[hsl(43,96%,56%)]">4.</span>
                      <span>Winners get 1.95x their bet</span>
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
                  <h3 className="text-lg font-bold mb-4 text-[hsl(258,90%,66%)]">Quick Bets</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 5, 10, 25, 50, 100].map((amount) => (
                      <Button
                        key={amount}
                        onClick={() => setBetAmount(amount)}
                        variant="outline"
                        size="sm"
                        disabled={rolling}
                        className="h-10 border-[hsl(258,90%,66%)]/30 hover:bg-[hsl(258,90%,66%)]/20 hover:border-[hsl(258,90%,66%)]/50 font-semibold"
                        data-testid={`button-quick-bet-${amount}`}
                      >
                        ${amount}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Provably Fair */}
              <Card className="glass-effect">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 text-[hsl(43,96%,56%)]">Provably Fair</h3>
                  <div className="space-y-2 text-sm text-[hsl(215,13%,45%)]">
                    <p>This game uses cryptographic hashing to ensure fairness.</p>
                    <p>All results can be verified independently.</p>
                    <Button variant="outline" size="sm" className="w-full mt-3" disabled>
                      Verify Last Roll
                    </Button>
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
