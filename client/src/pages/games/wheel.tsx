
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import Link from "wouter/link";

interface WheelResult {
  winningSegment: {
    number: number;
    color: string;
    multiplier: number;
  };
}

export default function Wheel() {
  const [betAmount, setBetAmount] = useState(10);
  const [selectedBet, setSelectedBet] = useState<{type: 'number' | 'color' | 'multiplier', value: any}>({type: 'multiplier', value: 2});
  const [gameResult, setGameResult] = useState<WheelResult | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [wheelRotation, setWheelRotation] = useState(0);
  const queryClient = useQueryClient();

  const segments = [
    { number: 1, color: 'red', multiplier: 2 },
    { number: 2, color: 'blue', multiplier: 2 },
    { number: 5, color: 'yellow', multiplier: 5 },
    { number: 10, color: 'green', multiplier: 10 },
    { number: 1, color: 'red', multiplier: 2 },
    { number: 2, color: 'blue', multiplier: 2 },
    { number: 5, color: 'yellow', multiplier: 5 },
    { number: 20, color: 'purple', multiplier: 20 },
    { number: 1, color: 'red', multiplier: 2 },
    { number: 2, color: 'blue', multiplier: 2 },
    { number: 5, color: 'yellow', multiplier: 5 },
    { number: 40, color: 'orange', multiplier: 40 }
  ];

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
          gameType: "wheel",
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
      
      // Calculate winning segment index for animation
      const winningIndex = segments.findIndex(seg => 
        seg.number === data.gameData.winningSegment.number &&
        seg.color === data.gameData.winningSegment.color &&
        seg.multiplier === data.gameData.winningSegment.multiplier
      );
      
      // Spin the wheel
      const segmentAngle = 360 / segments.length;
      const targetAngle = (winningIndex * segmentAngle) + (segmentAngle / 2);
      const spins = 5; // Number of full rotations
      const finalRotation = (spins * 360) + (360 - targetAngle);
      
      setWheelRotation(finalRotation);
      
      setTimeout(() => {
        setIsPlaying(false);
        queryClient.invalidateQueries({ queryKey: ["/api/user/balance"] });
        
        if (data.result === 'win') {
          toast({
            title: "You Won!",
            description: `Landed on ${data.gameData.winningSegment.multiplier}x! +$${(data.winAmount - data.betAmount).toFixed(2)}`,
          });
        } else {
          toast({
            title: "Better Luck Next Time",
            description: `Landed on ${data.gameData.winningSegment.multiplier}x`,
            variant: "destructive",
          });
        }
      }, 3000);
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

  const handlePlay = () => {
    if (!user || !balance) return;
    
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
    playGameMutation.mutate({ bet: selectedBet });
  };

  const getSegmentColor = (color: string) => {
    const colors: { [key: string]: string } = {
      red: '#ef4444',
      blue: '#3b82f6',
      yellow: '#eab308',
      green: '#22c55e',
      purple: '#a855f7',
      orange: '#f97316'
    };
    return colors[color] || '#6b7280';
  };

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
                Wheel of Fortune 🎡
              </h1>
              <p className="text-[hsl(215,13%,45%)]">Spin the wheel for amazing multipliers</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-[hsl(215,13%,45%)]">Balance</div>
            <div className="text-2xl font-bold text-[hsl(43,96%,56%)]">
              ${balance?.balance ? parseFloat(balance.balance).toFixed(2) : "0.00"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Wheel */}
          <div className="lg:col-span-2 flex items-center justify-center">
            <Card className="glass-effect p-8">
              <div className="relative w-96 h-96 mx-auto">
                {/* Pointer */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-white"></div>
                </div>
                
                {/* Wheel */}
                <div 
                  className="w-full h-full rounded-full border-4 border-white relative overflow-hidden transition-transform duration-3000 ease-out"
                  style={{ 
                    transform: `rotate(${wheelRotation}deg)`,
                    background: `conic-gradient(${segments.map((segment, index) => {
                      const startAngle = (index * 360) / segments.length;
                      const endAngle = ((index + 1) * 360) / segments.length;
                      return `${getSegmentColor(segment.color)} ${startAngle}deg ${endAngle}deg`;
                    }).join(', ')})`
                  }}
                >
                  {/* Segment labels */}
                  {segments.map((segment, index) => {
                    const angle = (index * 360) / segments.length + (360 / segments.length) / 2;
                    const radius = 120;
                    const x = Math.sin((angle * Math.PI) / 180) * radius;
                    const y = -Math.cos((angle * Math.PI) / 180) * radius;
                    
                    return (
                      <div
                        key={index}
                        className="absolute text-white font-bold text-lg"
                        style={{
                          left: `calc(50% + ${x}px)`,
                          top: `calc(50% + ${y}px)`,
                          transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                        }}
                      >
                        {segment.multiplier}x
                      </div>
                    );
                  })}
                </div>
                
                {/* Center circle */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full flex items-center justify-center text-black font-bold">
                  SPIN
                </div>
              </div>
            </Card>
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

                <div className="space-y-2">
                  <Label>Betting Options</Label>
                  
                  {/* Multiplier Bets */}
                  <div className="grid grid-cols-2 gap-2">
                    {[2, 5, 10, 20, 40].map(mult => (
                      <Button
                        key={mult}
                        variant={selectedBet.type === 'multiplier' && selectedBet.value === mult ? 'default' : 'outline'}
                        onClick={() => setSelectedBet({type: 'multiplier', value: mult})}
                        disabled={isPlaying}
                        size="sm"
                      >
                        {mult}x
                      </Button>
                    ))}
                  </div>
                  
                  {/* Color Bets */}
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {['red', 'blue', 'yellow', 'green', 'purple', 'orange'].map(color => (
                      <Button
                        key={color}
                        variant={selectedBet.type === 'color' && selectedBet.value === color ? 'default' : 'outline'}
                        onClick={() => setSelectedBet({type: 'color', value: color})}
                        disabled={isPlaying}
                        size="sm"
                        className="capitalize"
                        style={{
                          backgroundColor: selectedBet.type === 'color' && selectedBet.value === color ? getSegmentColor(color) : undefined
                        }}
                      >
                        {color}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handlePlay}
                  disabled={isPlaying || !user}
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-600 hover:shadow-lg"
                  size="lg"
                >
                  {isPlaying ? "Spinning..." : "Spin Wheel"}
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
                      {lastResult.result === 'win' ? 'WIN' : 'LOSS'}
                    </div>
                    <div className="text-sm text-[hsl(215,13%,45%)]">
                      Landed on: {gameResult?.winningSegment.multiplier}x ({gameResult?.winningSegment.color})
                    </div>
                    <div className="text-sm text-[hsl(215,13%,45%)]">
                      Your bet: {selectedBet.type} - {selectedBet.value}
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

            {/* Payout Info */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="text-sm">Payouts</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-[hsl(215,13%,45%)] space-y-1">
                <div>Multiplier Bet: Exact multiplier pays that amount</div>
                <div>Color Bet: Any color segment pays 2x</div>
                <div className="mt-2 text-xs">
                  <div>Segments: 2x (5), 5x (3), 10x (1), 20x (1), 40x (1)</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
