
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
import { ArrowLeft, Circle } from "lucide-react";
import { Link } from "wouter";

export default function Plinko() {
  const [betAmount, setBetAmount] = useState(10);
  const [dropping, setDropping] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [ballPosition, setBallPosition] = useState<number>(6);
  const [ballDropAnimation, setBallDropAnimation] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const multipliers = [0.2, 0.5, 1, 1.5, 2, 5, 10, 5, 2, 1.5, 1, 0.5, 0.2];

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const dropMutation = useMutation({
    mutationFn: async ({ betAmount }: { betAmount: number }) => {
      const response = await apiRequest("POST", "/api/games/play", {
        gameType: "plinko",
        betAmount,
        gameData: {},
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Delay showing results until ball drop animation completes
      setTimeout(() => {
        setLastResult(data);
        setBallPosition(data.gameData.slot);
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        
        const multiplier = multipliers[data.gameData.slot];
        if (multiplier >= 2) {
          toast({
            title: "Big Win! 🎉",
            description: `Ball landed on ${multiplier}x multiplier! Won $${data.winAmount.toFixed(2)}!`,
          });
        } else if (multiplier >= 1) {
          toast({
            title: "Nice! ⚪",
            description: `Ball landed on ${multiplier}x multiplier! Won $${data.winAmount.toFixed(2)}!`,
          });
        } else {
          toast({
            title: "Better luck next time!",
            description: `Ball landed on ${multiplier}x multiplier. Try again!`,
            variant: "destructive",
          });
        }
      }, 3000); // Wait for ball drop animation to complete
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
        description: error.message || "Failed to drop ball",
        variant: "destructive",
      });
    },
  });

  const handleDrop = () => {
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

    setDropping(true);
    setLastResult(null);
    setBallDropAnimation(true);
    
    // Start the mutation immediately but don't show results until animation completes
    dropMutation.mutate({ betAmount });
    
    // Reset animation states after ball drop completes
    setTimeout(() => {
      setDropping(false);
      setBallDropAnimation(false);
    }, 3000);
  };

  const getMultiplierColor = (multiplier: number): string => {
    if (multiplier >= 10) return 'text-[hsl(43,96%,56%)] bg-[hsl(43,96%,56%)]/20';
    if (multiplier >= 5) return 'text-green-400 bg-green-400/20';
    if (multiplier >= 2) return 'text-[hsl(220,91%,57%)] bg-[hsl(220,91%,57%)]/20';
    if (multiplier >= 1) return 'text-[hsl(258,90%,66%)] bg-[hsl(258,90%,66%)]/20';
    return 'text-red-400 bg-red-400/20';
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
              ⚪ Plinko Drop
            </h1>
            <p className="text-[hsl(215,13%,45%)] text-lg">
              Drop the ball and watch it bounce through pegs into multiplier slots!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Game Board */}
            <div className="lg:col-span-2">
              <Card className="glass-effect">
                <CardContent className="p-8">
                  {/* Plinko Board */}
                  <div className="relative bg-gradient-to-b from-[hsl(220,91%,57%)]/10 to-[hsl(258,90%,66%)]/10 border-2 border-[hsl(220,91%,57%)]/20 rounded-lg p-6 mb-6 overflow-hidden" style={{ height: '500px' }}>
                    {/* Drop Zone */}
                    <div className="text-center mb-4">
                      <div className="inline-block p-2 border-2 border-[hsl(43,96%,56%)] rounded-lg">
                        <div className="text-lg font-bold text-[hsl(43,96%,56%)]">DROP ZONE</div>
                      </div>
                    </div>

                    {/* Ball */}
                    <div className="relative">
                      <div 
                        className={`absolute w-6 h-6 bg-white rounded-full shadow-lg border-2 border-[hsl(220,91%,57%)] flex items-center justify-center transition-all ${
                          ballDropAnimation 
                            ? 'animate-bounce duration-3000' 
                            : ''
                        }`}
                        style={{
                          top: ballDropAnimation ? '400px' : '0px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          zIndex: 10
                        }}
                        data-testid="ball"
                      >
                        ⚪
                      </div>
                    </div>

                    {/* Properly Aligned Pegs Grid */}
                    <div className="absolute inset-0 flex flex-col justify-center items-center" style={{ top: '80px', height: '300px' }}>
                      {Array.from({ length: 8 }, (_, row) => {
                        const pegsInRow = 13 - row;
                        const offset = row * 15; // Reduced offset for better alignment
                        return (
                          <div 
                            key={row} 
                            className="flex justify-center items-center"
                            style={{ 
                              marginBottom: '15px',
                              width: '100%'
                            }}
                          >
                            <div 
                              className="flex justify-center space-x-6"
                              style={{ 
                                marginLeft: `${offset}px`,
                                marginRight: `${offset}px`
                              }}
                            >
                              {Array.from({ length: pegsInRow }, (_, col) => (
                                <div 
                                  key={col} 
                                  className="w-3 h-3 bg-[hsl(215,13%,45%)] rounded-full shadow-md border border-[hsl(220,91%,57%)]/30"
                                ></div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Ball Landing Position - Only show after result is available */}
                    {lastResult && !ballDropAnimation && (
                      <div 
                        className="absolute bottom-16 w-6 h-6 bg-[hsl(43,96%,56%)] rounded-full animate-pulse flex items-center justify-center shadow-lg"
                        style={{ 
                          left: `${12 + (ballPosition * 75)}px`,
                          transform: 'translateX(-50%)',
                          zIndex: 10
                        }}
                        data-testid="ball-final-position"
                      >
                        ⭐
                      </div>
                    )}
                  </div>

                  {/* Multiplier Slots - Properly Spaced */}
                  <div className="grid grid-cols-13 gap-1 mb-6">
                    {multipliers.map((multiplier, index) => (
                      <div
                        key={index}
                        className={`text-center py-3 px-1 rounded font-bold text-sm border-2 transition-all duration-300 ${
                          lastResult && ballPosition === index && !ballDropAnimation
                            ? 'border-[hsl(43,96%,56%)] animate-pulse scale-110' 
                            : 'border-transparent'
                        } ${getMultiplierColor(multiplier)}`}
                        data-testid={`multiplier-slot-${index}`}
                      >
                        {multiplier}x
                      </div>
                    ))}
                  </div>

                  {/* Result Display - Only show after animation completes */}
                  {lastResult && !ballDropAnimation && (
                    <div className="text-center mb-6 animate-fadeIn" data-testid="result-display">
                      <div className="text-3xl font-bold text-[hsl(43,96%,56%)] mb-2">
                        {multipliers[ballPosition]}x MULTIPLIER!
                      </div>
                      <div className="text-xl">
                        <span className={`${
                          lastResult.winAmount > lastResult.betAmount ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {lastResult.winAmount > lastResult.betAmount ? '+' : ''}
                          ${(lastResult.winAmount - lastResult.betAmount).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Ball Dropping Indicator */}
                  {ballDropAnimation && (
                    <div className="text-center mb-6">
                      <div className="text-2xl font-bold text-[hsl(43,96%,56%)] animate-pulse">
                        Ball is dropping...
                      </div>
                      <div className="text-lg text-[hsl(215,13%,45%)]">
                        Watch it bounce through the pegs!
                      </div>
                    </div>
                  )}

                  {/* Controls */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Bet Amount</label>
                      <Input
                        type="number"
                        value={betAmount}
                        onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value) || 1))}
                        min={1}
                        max={Math.floor(parseFloat(user.balance))}
                        disabled={dropping || ballDropAnimation}
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
                    onClick={handleDrop}
                    disabled={dropping || dropMutation.isPending || ballDropAnimation}
                    className="w-full bg-gradient-to-r from-[hsl(220,91%,57%)] to-blue-600 hover:shadow-lg hover:shadow-[hsl(220,91%,57%)]/25 transition-all duration-300 text-xl py-4"
                    data-testid="button-drop"
                  >
                    {ballDropAnimation ? (
                      <Circle className="mr-2 h-6 w-6 animate-bounce" />
                    ) : (
                      "⚪"
                    )}
                    {ballDropAnimation ? "BALL DROPPING..." : `DROP BALL ($${betAmount})`}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Multiplier Guide */}
              <Card className="glass-effect">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 text-[hsl(220,91%,57%)]">Multipliers</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-[hsl(43,96%,56%)]">10x</span>
                      <span>Jackpot Slots</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-green-400">5x</span>
                      <span>High Payout</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[hsl(220,91%,57%)]">2x</span>
                      <span>Good Win</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[hsl(258,90%,66%)]">1x-1.5x</span>
                      <span>Break Even</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-red-400">0.2x-0.5x</span>
                      <span>Loss</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* How to Play */}
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
                      <span>Click "Drop Ball" to release</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-[hsl(43,96%,56%)]">3.</span>
                      <span>Watch it bounce through pegs</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="text-[hsl(43,96%,56%)]">4.</span>
                      <span>Win based on final slot multiplier</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Game Stats */}
              <Card className="glass-effect">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4 text-[hsl(43,96%,56%)]">Game Info</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[hsl(215,13%,45%)]">Max Multiplier</span>
                      <span className="text-[hsl(43,96%,56%)]">10x</span>
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
                      <span className="text-[hsl(215,13%,45%)]">RTP</span>
                      <span>97%</span>
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
                        disabled={dropping || ballDropAnimation}
                        className="border-[hsl(220,91%,57%)]/20 hover:bg-[hsl(220,91%,57%)]/20"
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
                  <h3 className="text-xl font-bold mb-4">Recent Drops</h3>
                  <div className="space-y-2">
                    {lastResult && !ballDropAnimation && (
                      <div className="flex justify-between items-center p-2 bg-[hsl(240,18%,8%)]/50 rounded text-sm" data-testid="last-result">
                        <span>{multipliers[ballPosition]}x</span>
                        <span className={`${
                          lastResult.winAmount > lastResult.betAmount ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {lastResult.winAmount > lastResult.betAmount ? '+' : ''}
                          ${(lastResult.winAmount - lastResult.betAmount).toFixed(2)}
                        </span>
                      </div>
                    )}
                    {(!lastResult || ballDropAnimation) && (
                      <div className="text-[hsl(215,13%,45%)] text-center py-4 text-sm">
                        {ballDropAnimation ? "Ball is dropping..." : "No drops yet. Start playing!"}
                      </div>
                    )}
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
