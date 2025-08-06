
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "wouter/link";

interface KenoResult {
  drawnNumbers: number[];
  matches: number;
  selectedNumbers: number[];
}

export default function Keno() {
  const [betAmount, setBetAmount] = useState(10);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [gameResult, setGameResult] = useState<KenoResult | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [animatingNumbers, setAnimatingNumbers] = useState<number[]>([]);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  const { data: balance } = useQuery({
    queryKey: ["/api/user/balance"],
  });

  const playGameMutation = useMutation({
    mutationFn: async (gameData: any) => {
      const response = await fetch("/api/games/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameType: "keno",
          betAmount,
          gameData,
        }),
      });
      if (!response.ok) throw new Error("Failed to play game");
      return response.json();
    },
    onSuccess: (data) => {
      setGameResult(data.gameData);
      setLastResult(data);
      
      // Animate the drawn numbers
      setAnimatingNumbers([]);
      data.gameData.drawnNumbers.forEach((num: number, index: number) => {
        setTimeout(() => {
          setAnimatingNumbers(prev => [...prev, num]);
        }, index * 100);
      });
      
      setTimeout(() => {
        setIsPlaying(false);
        queryClient.invalidateQueries({ queryKey: ["/api/user/balance"] });
        
        if (data.result === 'win') {
          toast({
            title: "You Won!",
            description: `${data.gameData.matches} matches! +$${(data.winAmount - data.betAmount).toFixed(2)}`,
          });
        } else {
          toast({
            title: "No Luck",
            description: `${data.gameData.matches} matches. Try again!`,
            variant: "destructive",
          });
        }
      }, 2500);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIsPlaying(false);
    },
  });

  const toggleNumber = (num: number) => {
    if (isPlaying) return;
    
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter(n => n !== num));
    } else if (selectedNumbers.length < 10) {
      setSelectedNumbers([...selectedNumbers, num]);
    } else {
      toast({
        title: "Maximum Numbers",
        description: "You can select up to 10 numbers",
        variant: "destructive",
      });
    }
  };

  const clearSelection = () => {
    if (isPlaying) return;
    setSelectedNumbers([]);
  };

  const quickPick = () => {
    if (isPlaying) return;
    const numbers = [];
    while (numbers.length < 10) {
      const num = Math.floor(Math.random() * 80) + 1;
      if (!numbers.includes(num)) {
        numbers.push(num);
      }
    }
    setSelectedNumbers(numbers.sort((a, b) => a - b));
  };

  const handlePlay = () => {
    if (!user || !balance) return;
    
    if (selectedNumbers.length === 0) {
      toast({
        title: "No Numbers Selected",
        description: "Please select at least 1 number",
        variant: "destructive",
      });
      return;
    }
    
    const currentBalance = parseFloat(balance.balance);
    if (currentBalance < betAmount) {
      toast({
        title: "Insufficient Balance",
        description: "Please add funds to your account",
        variant: "destructive",
      });
      return;
    }

    setIsPlaying(true);
    setGameResult(null);
    setAnimatingNumbers([]);
    playGameMutation.mutate({ selectedNumbers });
  };

  const isNumberDrawn = (num: number) => animatingNumbers.includes(num);
  const isNumberMatch = (num: number) => selectedNumbers.includes(num) && animatingNumbers.includes(num);

  return (
    <div className="min-h-screen bg-gradient-to-br from-casino-dark via-casino-navy to-casino-dark p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="glass-effect">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[hsl(43,96%,56%)] to-yellow-600 bg-clip-text text-transparent">
                Keno 🔢
              </h1>
              <p className="text-[hsl(215,13%,45%)]">Pick your lucky numbers and watch the draw</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-[hsl(215,13%,45%)]">Balance</div>
            <div className="text-2xl font-bold text-[hsl(43,96%,56%)]">
              ${balance?.balance ? parseFloat(balance.balance).toFixed(2) : "0.00"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Number Grid */}
          <div className="lg:col-span-3">
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="text-center">
                  Choose Your Numbers (1-80)
                  <Badge variant="outline" className="ml-2">
                    {selectedNumbers.length}/10 selected
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-8 sm:grid-cols-10 gap-2 mb-4">
                  {Array.from({ length: 80 }, (_, i) => i + 1).map((num) => (
                    <Button
                      key={num}
                      variant={selectedNumbers.includes(num) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleNumber(num)}
                      disabled={isPlaying}
                      className={`
                        relative h-8 text-xs transition-all duration-300
                        ${selectedNumbers.includes(num) 
                          ? 'bg-[hsl(220,91%,57%)] hover:bg-[hsl(220,91%,52%)]' 
                          : 'hover:scale-105'
                        }
                        ${isNumberMatch(num) 
                          ? 'bg-green-500 hover:bg-green-600 animate-pulse' 
                          : ''
                        }
                        ${isNumberDrawn(num) && !selectedNumbers.includes(num)
                          ? 'bg-red-500/50' 
                          : ''
                        }
                      `}
                    >
                      {num}
                      {isNumberMatch(num) && (
                        <div className="absolute inset-0 bg-white/20 rounded animate-ping"></div>
                      )}
                    </Button>
                  ))}
                </div>

                <div className="flex justify-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearSelection}
                    disabled={isPlaying}
                  >
                    Clear All
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={quickPick}
                    disabled={isPlaying}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Quick Pick
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Drawn Numbers */}
            {isPlaying || gameResult && (
              <Card className="glass-effect mt-6">
                <CardHeader>
                  <CardTitle className="text-center">Drawn Numbers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-10 gap-2">
                    {gameResult?.drawnNumbers.map((num, index) => (
                      <div
                        key={num}
                        className={`
                          h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold
                          transition-all duration-500 transform
                          ${animatingNumbers.includes(num) 
                            ? selectedNumbers.includes(num)
                              ? 'bg-green-500 scale-110' 
                              : 'bg-[hsl(43,96%,56%)]'
                            : 'bg-gray-600 scale-75 opacity-50'
                          }
                        `}
                        style={{ 
                          animationDelay: `${index * 100}ms`,
                          animation: animatingNumbers.includes(num) ? 'bounceIn 0.5s ease-out' : 'none'
                        }}
                      >
                        {num}
                      </div>
                    )) || Array(20).fill(0).map((_, i) => (
                      <div
                        key={i}
                        className="h-10 w-10 rounded-full bg-gray-600/30 border-2 border-dashed border-gray-500"
                      ></div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Betting Panel */}
          <div className="space-y-6">
            {/* Bet Amount */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle>Place Your Bet</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="bet-amount">Bet Amount</Label>
                  <Input
                    id="bet-amount"
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Math.max(1, parseFloat(e.target.value) || 1))}
                    min="1"
                    step="0.01"
                    className="mt-1"
                    disabled={isPlaying}
                  />
                </div>

                <Button
                  onClick={handlePlay}
                  disabled={isPlaying || selectedNumbers.length === 0 || !user}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:shadow-lg"
                  size="lg"
                >
                  {isPlaying ? "Drawing..." : "Play Keno"}
                </Button>
              </CardContent>
            </Card>

            {/* Last Result */}
            {lastResult && (
              <Card className="glass-effect">
                <CardHeader>
                  <CardTitle className="text-sm">Last Result</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className={`text-lg font-semibold ${
                      lastResult.result === 'win' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {lastResult.result === 'win' ? 'WIN' : 'NO WIN'}
                    </div>
                    <div className="text-sm text-[hsl(215,13%,45%)]">
                      Matches: {gameResult?.matches || 0}/{selectedNumbers.length}
                    </div>
                    <div className="text-sm text-[hsl(215,13%,45%)]">
                      Multiplier: {lastResult.multiplier}x
                    </div>
                    <div className="text-lg text-[hsl(43,96%,56%)]">
                      {lastResult.result === 'win' 
                        ? `+$${(lastResult.winAmount - lastResult.betAmount).toFixed(2)}`
                        : `-$${lastResult.betAmount.toFixed(2)}`
                      }
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payout Table */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="text-sm">Payout Table</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-[hsl(215,13%,45%)] space-y-1">
                <div className="grid grid-cols-2 gap-1">
                  <div>Spots: Matches → Payout</div>
                  <div></div>
                  <div>1: 1 → 3x</div>
                  <div>2: 2 → 12x</div>
                  <div>3: 2 → 1x, 3 → 42x</div>
                  <div>4: 2 → 1x, 3 → 4x, 4 → 142x</div>
                  <div>5: 3 → 1x, 4 → 12x, 5 → 810x</div>
                  <div>6+: Higher payouts...</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
