import { useState, useEffect, useRef } from "react";
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
import { ArrowLeft, TrendingUp } from "lucide-react";
import { Link } from "wouter";

export default function Crash() {
  const [betAmount, setBetAmount] = useState(10);
  const [cashoutMultiplier, setCashoutMultiplier] = useState(2.0);
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [gameState, setGameState] = useState<'waiting' | 'running' | 'crashed'>('waiting');
  const [lastResult, setLastResult] = useState<any>(null);
  const [hasActiveBet, setHasActiveBet] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const placeBetMutation = useMutation({
    mutationFn: async ({ betAmount, cashoutMultiplier }: { betAmount: number; cashoutMultiplier: number }) => {
      const response = await apiRequest("POST", "/api/games/play", {
        gameType: "crash",
        betAmount,
        gameData: { cashoutMultiplier },
      });
      return response.json();
    },
    onSuccess: (data) => {
      setLastResult(data);
      setHasActiveBet(false);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      if (data.result === 'win') {
        toast({
          title: "Successful Cashout! 🚀",
          description: `You won $${data.winAmount.toFixed(2)} at ${cashoutMultiplier}x multiplier!`,
        });
      } else {
        toast({
          title: "Crashed! 💥",
          description: `The rocket crashed at ${data.gameData.crashPoint.toFixed(2)}x before your cashout!`,
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      setHasActiveBet(false);
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
        description: error.message || "Failed to place bet",
        variant: "destructive",
      });
    },
  });

  const startGame = () => {
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

    setHasActiveBet(true);
    setGameState('running');
    setCurrentMultiplier(1.0);
    setLastResult(null);

    // Simulate real-time multiplier increase
    intervalRef.current = setInterval(() => {
      setCurrentMultiplier(prev => {
        const newMultiplier = prev + 0.01;
        
        // Auto cashout if reached target
        if (newMultiplier >= cashoutMultiplier && hasActiveBet) {
          placeBetMutation.mutate({ betAmount, cashoutMultiplier });
          return newMultiplier;
        }
        
        // Random crash between 1x and 10x
        const crashChance = Math.random();
        const crashProbability = Math.min(0.02 * (newMultiplier - 1), 0.1);
        
        if (crashChance < crashProbability) {
          setGameState('crashed');
          if (hasActiveBet) {
            placeBetMutation.mutate({ betAmount, cashoutMultiplier });
          }
          return newMultiplier;
        }
        
        return newMultiplier;
      });
    }, 50);

    // Force crash after 30 seconds max
    setTimeout(() => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        setGameState('crashed');
        if (hasActiveBet) {
          placeBetMutation.mutate({ betAmount, cashoutMultiplier });
        }
      }
    }, 30000);
  };

  const cashOut = () => {
    if (hasActiveBet && gameState === 'running') {
      placeBetMutation.mutate({ betAmount, cashoutMultiplier: currentMultiplier });
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (gameState === 'crashed') {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setTimeout(() => {
        setGameState('waiting');
        setCurrentMultiplier(1.0);
      }, 3000);
    }
  }, [gameState]);

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
              🚀 Rocket Crash
            </h1>
            <p className="text-[hsl(215,13%,45%)] text-lg">
              Watch the multiplier climb and cash out before the rocket crashes!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Game Chart */}
            <div className="lg:col-span-3">
              <Card className="glass-effect">
                <CardContent className="p-8">
                  <div className="relative h-96 bg-black rounded-lg p-6 mb-6 overflow-hidden">
                    {/* Chart Background */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[hsl(220,91%,57%)]/10 to-transparent"></div>
                    
                    {/* Current Multiplier Display */}
                    <div className="absolute top-6 left-6 z-10">
                      <div className={`text-6xl font-bold ${
                        gameState === 'crashed' ? 'text-red-500' : 'text-green-400'
                      }`} data-testid="text-current-multiplier">
                        {currentMultiplier.toFixed(2)}x
                      </div>
                      <div className="text-[hsl(215,13%,45%)]">
                        {gameState === 'waiting' && 'Waiting for next round...'}
                        {gameState === 'running' && 'Rocket climbing!'}
                        {gameState === 'crashed' && 'CRASHED!'}
                      </div>
                    </div>

                    {/* Rocket Animation */}
                    <div className={`absolute bottom-6 transition-all duration-100 ${
                      gameState === 'running' ? 'animate-float' : ''
                    }`} style={{
                      left: `${Math.min((currentMultiplier - 1) * 10, 80)}%`,
                      bottom: `${Math.min((currentMultiplier - 1) * 20, 70)}%`
                    }}>
                      <div className="text-4xl">🚀</div>
                    </div>

                    {/* Crash Effect */}
                    {gameState === 'crashed' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-8xl animate-pulse">💥</div>
                      </div>
                    )}

                    {/* Chart Lines */}
                    <svg className="absolute inset-0 w-full h-full">
                      <defs>
                        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="hsl(220,91%,57%)" />
                          <stop offset="100%" stopColor="hsl(258,90%,66%)" />
                        </linearGradient>
                      </defs>
                      <path
                        d={`M 50 ${384 - 50} Q ${50 + (currentMultiplier - 1) * 50} ${384 - 50 - (currentMultiplier - 1) * 100} ${50 + (currentMultiplier - 1) * 100} ${384 - 50 - (currentMultiplier - 1) * 150}`}
                        stroke="url(#chartGradient)"
                        strokeWidth="3"
                        fill="none"
                        className={gameState === 'running' ? 'animate-pulse' : ''}
                      />
                    </svg>
                  </div>

                  {/* Game Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Bet Amount</label>
                      <Input
                        type="number"
                        value={betAmount}
                        onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
                        min={1}
                        max={Math.floor(parseFloat(user.balance))}
                        disabled={gameState === 'running'}
                        className="bg-[hsl(240,18%,8%)]/50 border-[hsl(220,91%,57%)]/20 text-white"
                        data-testid="input-bet-amount"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Auto Cashout</label>
                      <Input
                        type="number"
                        value={cashoutMultiplier}
                        onChange={(e) => setCashoutMultiplier(Math.max(1.01, parseFloat(e.target.value) || 1.01))}
                        min={1.01}
                        step={0.01}
                        disabled={gameState === 'running'}
                        className="bg-[hsl(240,18%,8%)]/50 border-[hsl(220,91%,57%)]/20 text-white"
                        data-testid="input-cashout-multiplier"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Balance</label>
                      <div className="px-3 py-2 bg-[hsl(240,18%,8%)]/50 border border-[hsl(220,91%,57%)]/20 rounded-md text-[hsl(43,96%,56%)] font-bold" data-testid="display-balance">
                        ${user.balance}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      onClick={startGame}
                      disabled={gameState === 'running' || placeBetMutation.isPending}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:shadow-lg hover:shadow-green-500/25 transition-all duration-300 text-xl py-4"
                      data-testid="button-place-bet"
                    >
                      {gameState === 'running' ? 'Round in Progress' : `Place Bet ($${betAmount})`}
                    </Button>

                    <Button
                      onClick={cashOut}
                      disabled={!hasActiveBet || gameState !== 'running'}
                      className="bg-gradient-to-r from-[hsl(43,96%,56%)] to-yellow-600 hover:shadow-lg hover:shadow-[hsl(43,96%,56%)]/25 transition-all duration-300 text-xl py-4"
                      data-testid="button-cashout"
                    >
                      Cash Out at {currentMultiplier.toFixed(2)}x
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Last Result */}
              <Card className="glass-effect">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 text-[hsl(220,91%,57%)]">Last Result</h3>
                  {lastResult ? (
                    <div className="space-y-2" data-testid="display-last-result">
                      <div className={`text-lg font-bold ${
                        lastResult.result === 'win' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {lastResult.result === 'win' ? 'WIN' : 'LOSS'}
                      </div>
                      <div className="text-sm text-[hsl(215,13%,45%)]">
                        Crashed at: {lastResult.gameData.crashPoint.toFixed(2)}x
                      </div>
                      <div className="text-sm text-[hsl(215,13%,45%)]">
                        Your target: {lastResult.gameData.cashoutMultiplier.toFixed(2)}x
                      </div>
                      <div className="text-lg text-[hsl(43,96%,56%)]">
                        {lastResult.result === 'win' 
                          ? `+$${(lastResult.winAmount - lastResult.betAmount).toFixed(2)}`
                          : `-$${lastResult.betAmount.toFixed(2)}`
                        }
                      </div>
                    </div>
                  ) : (
                    <div className="text-[hsl(215,13%,45%)]">No games played yet</div>
                  )}
                </CardContent>
              </Card>

              {/* Game Stats */}
              <Card className="glass-effect">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 text-[hsl(258,90%,66%)]">Game Info</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[hsl(215,13%,45%)]">Min Bet</span>
                      <span>$1</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[hsl(215,13%,45%)]">Max Bet</span>
                      <span>$1000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[hsl(215,13%,45%)]">Min Cashout</span>
                      <span>1.01x</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[hsl(215,13%,45%)]">Max Multiplier</span>
                      <span className="text-[hsl(43,96%,56%)]">∞</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Multipliers */}
              <Card className="glass-effect">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4">Quick Cashout</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[1.5, 2.0, 3.0, 5.0, 10.0, 100.0].map((multiplier) => (
                      <Button
                        key={multiplier}
                        onClick={() => setCashoutMultiplier(multiplier)}
                        variant="outline"
                        size="sm"
                        disabled={gameState === 'running'}
                        className="border-[hsl(220,91%,57%)]/20 hover:bg-[hsl(220,91%,57%)]/20"
                        data-testid={`button-quick-cashout-${multiplier}`}
                      >
                        {multiplier}x
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
