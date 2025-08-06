
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import Link from "wouter/link";

interface HiLoGameState {
  currentCard: number;
  nextCard?: number;
  multiplier: number;
  gameOver: boolean;
  streak: number;
  correct?: boolean;
}

export default function HiLo() {
  const [betAmount, setBetAmount] = useState(10);
  const [gameState, setGameState] = useState<HiLoGameState | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [pendingPrediction, setPendingPrediction] = useState<'higher' | 'lower' | null>(null);
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
          gameType: "hilo",
          betAmount,
          gameData,
        }),
      });
      if (!response.ok) throw new Error("Failed to play game");
      return response.json();
    },
    onSuccess: (data) => {
      setGameState(data.gameData);
      setPendingPrediction(null);
      
      if (data.gameData.gameOver) {
        setIsPlaying(false);
        setLastResult(data);
        queryClient.invalidateQueries({ queryKey: ["/api/user/balance"] });
        
        if (data.gameData.correct === false) {
          toast({
            title: "Wrong Prediction!",
            description: "Game over. Better luck next time!",
            variant: "destructive",
          });
        }
      } else if (data.gameData.correct === true) {
        toast({
          title: "Correct!",
          description: `Streak: ${data.gameData.streak}. Multiplier: ${data.gameData.multiplier.toFixed(2)}x`,
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
      setPendingPrediction(null);
    },
  });

  const startGame = () => {
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
    setGameState(null);
    setLastResult(null);
    playGameMutation.mutate({ action: 'start' });
  };

  const makePrediction = (prediction: 'higher' | 'lower') => {
    if (!gameState || gameState.gameOver) return;
    
    setPendingPrediction(prediction);
    playGameMutation.mutate({ 
      action: 'predict', 
      currentCard: gameState.currentCard,
      prediction,
      streak: gameState.streak
    });
  };

  const cashOut = () => {
    if (!gameState || gameState.gameOver || gameState.streak === 0) return;
    
    setIsPlaying(false);
    const winAmount = betAmount * gameState.multiplier;
    setLastResult({
      result: 'win',
      winAmount,
      betAmount,
      multiplier: gameState.multiplier
    });
    
    queryClient.invalidateQueries({ queryKey: ["/api/user/balance"] });
    
    toast({
      title: "Cashed Out!",
      description: `+$${(winAmount - betAmount).toFixed(2)}`,
    });
    
    setGameState(null);
  };

  const getCardDisplay = (card: number) => {
    const suits = ['♠', '♥', '♦', '♣'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const suit = suits[Math.floor(Math.random() * 4)];
    const rank = ranks[card - 1] || 'A';
    const color = suits.indexOf(suit) < 2 ? 'text-red-500' : 'text-black';
    return { display: `${rank}${suit}`, color };
  };

  const getCardValue = (card: number) => {
    if (card === 1) return 'A';
    if (card === 11) return 'J';
    if (card === 12) return 'Q';
    if (card === 13) return 'K';
    return card.toString();
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
                Hi-Lo Cards 📈
              </h1>
              <p className="text-[hsl(215,13%,45%)]">Predict if the next card is higher or lower</p>
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
          <div className="lg:col-span-2">
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="text-center">
                  Card Prediction Game
                  {gameState && (
                    <Badge variant="outline" className="ml-2">
                      Streak: {gameState.streak}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Card */}
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-4">Current Card</h3>
                  <div className="w-32 h-44 bg-white rounded-lg mx-auto flex items-center justify-center shadow-lg">
                    {gameState ? (
                      <div className={`text-4xl font-bold ${getCardDisplay(gameState.currentCard).color}`}>
                        {getCardDisplay(gameState.currentCard).display}
                      </div>
                    ) : (
                      <div className="text-2xl text-gray-400">🂠</div>
                    )}
                  </div>
                </div>

                {/* Prediction Buttons */}
                {gameState && !gameState.gameOver && isPlaying && (
                  <div className="flex justify-center space-x-4">
                    <Button
                      onClick={() => makePrediction('higher')}
                      disabled={!!pendingPrediction}
                      className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 text-lg"
                      size="lg"
                    >
                      <TrendingUp className="h-6 w-6 mr-2" />
                      Higher
                    </Button>
                    <Button
                      onClick={() => makePrediction('lower')}
                      disabled={!!pendingPrediction}
                      className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 text-lg"
                      size="lg"
                    >
                      <TrendingDown className="h-6 w-6 mr-2" />
                      Lower
                    </Button>
                  </div>
                )}

                {/* Next Card (after prediction) */}
                {gameState?.nextCard && (
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-4">
                      Next Card - {gameState.correct ? '✅ Correct!' : '❌ Wrong!'}
                    </h3>
                    <div className="w-32 h-44 bg-white rounded-lg mx-auto flex items-center justify-center shadow-lg">
                      <div className={`text-4xl font-bold ${getCardDisplay(gameState.nextCard).color}`}>
                        {getCardDisplay(gameState.nextCard).display}
                      </div>
                    </div>
                  </div>
                )}

                {/* Current Multiplier */}
                {gameState && !gameState.gameOver && gameState.streak > 0 && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[hsl(43,96%,56%)] mb-2">
                      Current Multiplier: {gameState.multiplier.toFixed(2)}x
                    </div>
                    <div className="text-lg text-[hsl(215,13%,45%)] mb-4">
                      Potential Payout: ${(betAmount * gameState.multiplier).toFixed(2)}
                    </div>
                    <Button
                      onClick={cashOut}
                      className="bg-[hsl(43,96%,56%)] hover:bg-yellow-600 text-black font-bold"
                      size="lg"
                    >
                      Cash Out: ${(betAmount * gameState.multiplier).toFixed(2)}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* Game Settings */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle>Game Settings</CardTitle>
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
                  onClick={startGame}
                  disabled={isPlaying || !user}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:shadow-lg"
                  size="lg"
                >
                  {isPlaying ? "Playing..." : "Start Game"}
                </Button>
              </CardContent>
            </Card>

            {/* Game Stats */}
            {gameState && isPlaying && (
              <Card className="glass-effect">
                <CardHeader>
                  <CardTitle className="text-sm">Current Game</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Current card:</span>
                      <span>{getCardValue(gameState.currentCard)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Streak:</span>
                      <span>{gameState.streak}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Multiplier:</span>
                      <span className="text-[hsl(43,96%,56%)]">{gameState.multiplier.toFixed(2)}x</span>
                    </div>
                    {pendingPrediction && (
                      <div className="flex justify-between">
                        <span>Prediction:</span>
                        <span className="text-blue-400">{pendingPrediction}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

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
                      {lastResult.result === 'win' ? 'CASHED OUT' : 'GAME OVER'}
                    </div>
                    <div className="text-sm text-[hsl(215,13%,45%)]">
                      Final Multiplier: {lastResult.multiplier}x
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

            {/* Card Values */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="text-sm">Card Values</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-[hsl(215,13%,45%)] space-y-1">
                <div>A = 1 (lowest)</div>
                <div>2, 3, 4, 5, 6, 7, 8, 9, 10</div>
                <div>J = 11, Q = 12, K = 13 (highest)</div>
                <div className="mt-2 text-xs">
                  <div>• Equal cards = loss</div>
                  <div>• Each correct guess increases multiplier</div>
                  <div>• Cash out anytime to secure winnings</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
