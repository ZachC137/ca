
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Users, TrendingUp } from "lucide-react";
import Link from "wouter/link";

interface BaccaratResult {
  playerCards: number[];
  bankerCards: number[];
  playerTotal: number;
  bankerTotal: number;
  winner: 'player' | 'banker' | 'tie';
}

export default function Baccarat() {
  const [betAmount, setBetAmount] = useState(10);
  const [selectedBet, setSelectedBet] = useState<'player' | 'banker' | 'tie'>('player');
  const [gameResult, setGameResult] = useState<BaccaratResult | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
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
          gameType: "baccarat",
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
      setIsPlaying(false);
      queryClient.invalidateQueries({ queryKey: ["/api/user/balance"] });
      
      if (data.result === 'win') {
        toast({
          title: "You Won!",
          description: `+$${(data.winAmount - data.betAmount).toFixed(2)}`,
        });
      } else {
        toast({
          title: "You Lost",
          description: `-$${data.betAmount.toFixed(2)}`,
          variant: "destructive",
        });
      }
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
    playGameMutation.mutate({ bet: { type: selectedBet } });
  };

  const getCardDisplay = (card: number) => {
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const suit = suits[Math.floor(Math.random() * 4)];
    const rank = ranks[card - 1] || 'A';
    return `${rank}${suit}`;
  };

  const getCardValue = (card: number) => card > 10 ? 0 : card;

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
                Baccarat 🃖
              </h1>
              <p className="text-[hsl(215,13%,45%)]">Player vs Banker - Classic Card Game</p>
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
          {/* Game Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Table */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="text-center text-2xl">Baccarat Table</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Player Hand */}
                <div className="bg-[hsl(220,91%,57%)]/10 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-[hsl(220,91%,57%)]">Player</h3>
                  <div className="flex justify-center space-x-2 mb-3">
                    {gameResult?.playerCards?.map((card, index) => (
                      <div
                        key={index}
                        className="w-16 h-20 bg-white rounded-lg flex items-center justify-center text-black font-bold shadow-lg"
                      >
                        {getCardDisplay(card)}
                      </div>
                    )) || (
                      <>
                        <div className="w-16 h-20 bg-[hsl(240,18%,8%)] border-2 border-dashed border-[hsl(215,13%,45%)] rounded-lg"></div>
                        <div className="w-16 h-20 bg-[hsl(240,18%,8%)] border-2 border-dashed border-[hsl(215,13%,45%)] rounded-lg"></div>
                      </>
                    )}
                  </div>
                  {gameResult && (
                    <div className="text-center">
                      <Badge variant="outline" className="text-lg px-4 py-2">
                        Total: {gameResult.playerTotal}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* VS */}
                <div className="text-center text-2xl font-bold text-[hsl(43,96%,56%)]">VS</div>

                {/* Banker Hand */}
                <div className="bg-red-500/10 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-red-400">Banker</h3>
                  <div className="flex justify-center space-x-2 mb-3">
                    {gameResult?.bankerCards?.map((card, index) => (
                      <div
                        key={index}
                        className="w-16 h-20 bg-white rounded-lg flex items-center justify-center text-black font-bold shadow-lg"
                      >
                        {getCardDisplay(card)}
                      </div>
                    )) || (
                      <>
                        <div className="w-16 h-20 bg-[hsl(240,18%,8%)] border-2 border-dashed border-[hsl(215,13%,45%)] rounded-lg"></div>
                        <div className="w-16 h-20 bg-[hsl(240,18%,8%)] border-2 border-dashed border-[hsl(215,13%,45%)] rounded-lg"></div>
                      </>
                    )}
                  </div>
                  {gameResult && (
                    <div className="text-center">
                      <Badge variant="outline" className="text-lg px-4 py-2">
                        Total: {gameResult.bankerTotal}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Winner */}
                {gameResult && (
                  <div className="text-center">
                    <Badge 
                      className={`text-xl px-6 py-3 ${
                        gameResult.winner === 'player' ? 'bg-[hsl(220,91%,57%)]' :
                        gameResult.winner === 'banker' ? 'bg-red-500' :
                        'bg-[hsl(258,90%,66%)]'
                      }`}
                    >
                      {gameResult.winner.toUpperCase()} WINS!
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Betting Panel */}
          <div className="space-y-6">
            {/* Bet Selection */}
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
                  />
                </div>

                <div className="space-y-2">
                  <Label>Betting Options</Label>
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      variant={selectedBet === 'player' ? 'default' : 'outline'}
                      onClick={() => setSelectedBet('player')}
                      className={`${selectedBet === 'player' ? 'bg-[hsl(220,91%,57%)]' : ''}`}
                    >
                      Player (2:1)
                    </Button>
                    <Button
                      variant={selectedBet === 'banker' ? 'default' : 'outline'}
                      onClick={() => setSelectedBet('banker')}
                      className={`${selectedBet === 'banker' ? 'bg-red-500' : ''}`}
                    >
                      Banker (1.95:1)
                    </Button>
                    <Button
                      variant={selectedBet === 'tie' ? 'default' : 'outline'}
                      onClick={() => setSelectedBet('tie')}
                      className={`${selectedBet === 'tie' ? 'bg-[hsl(258,90%,66%)]' : ''}`}
                    >
                      Tie (8:1)
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={handlePlay}
                  disabled={isPlaying || !user}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:shadow-lg"
                  size="lg"
                >
                  {isPlaying ? "Dealing..." : "Deal Cards"}
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
                      Winner: {gameResult?.winner?.toUpperCase()}
                    </div>
                    <div className="text-sm text-[hsl(215,13%,45%)]">
                      Your bet: {selectedBet.toUpperCase()}
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

            {/* Game Rules */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="text-sm">How to Play</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-[hsl(215,13%,45%)] space-y-2">
                <p>• Player and Banker each get 2-3 cards</p>
                <p>• Card values: A=1, 2-9=face value, 10/J/Q/K=0</p>
                <p>• Hand value is the rightmost digit of the sum</p>
                <p>• Closest to 9 wins</p>
                <p>• Player pays 2:1, Banker pays 1.95:1, Tie pays 8:1</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
