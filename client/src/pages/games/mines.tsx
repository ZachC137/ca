
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Bomb, Gem } from "lucide-react";
import Link from "wouter/link";

interface MinesGameState {
  grid: boolean[][];
  revealedCells: boolean[][];
  multiplier: number;
  gameOver: boolean;
  won: boolean;
}

export default function Mines() {
  const [betAmount, setBetAmount] = useState(10);
  const [mineCount, setMineCount] = useState(5);
  const [gameState, setGameState] = useState<MinesGameState | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
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
          gameType: "mines",
          betAmount,
          gameData,
        }),
      });
      if (!response.ok) throw new Error("Failed to play game");
      return response.json();
    },
    onSuccess: (data) => {
      setGameState(data.gameData);
      setCurrentMultiplier(data.gameData.multiplier);
      
      if (data.gameData.gameOver) {
        setIsPlaying(false);
        setLastResult(data);
        queryClient.invalidateQueries({ queryKey: ["/api/user/balance"] });
        
        if (data.gameData.won) {
          toast({
            title: "You Won!",
            description: `Found all safe tiles! +$${(data.winAmount - data.betAmount).toFixed(2)}`,
          });
        } else {
          toast({
            title: "BOOM! 💥",
            description: "You hit a mine!",
            variant: "destructive",
          });
        }
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
    setCurrentMultiplier(1);
    playGameMutation.mutate({ action: 'start', mineCount });
  };

  const revealCell = (row: number, col: number) => {
    if (!gameState || gameState.gameOver || gameState.revealedCells[row][col]) return;
    
    playGameMutation.mutate({ 
      action: 'reveal', 
      grid: gameState.grid,
      revealedCells: gameState.revealedCells,
      mineCount,
      row,
      col 
    });
  };

  const cashOut = () => {
    if (!gameState || gameState.gameOver) return;
    
    setIsPlaying(false);
    const winAmount = betAmount * currentMultiplier;
    setLastResult({
      result: 'win',
      winAmount,
      betAmount,
      multiplier: currentMultiplier
    });
    
    queryClient.invalidateQueries({ queryKey: ["/api/user/balance"] });
    
    toast({
      title: "Cashed Out!",
      description: `+$${(winAmount - betAmount).toFixed(2)}`,
    });
    
    setGameState(null);
  };

  const getCellContent = (row: number, col: number) => {
    if (!gameState) return null;
    
    const isRevealed = gameState.revealedCells[row][col];
    const isMine = gameState.grid[row][col];
    
    if (!isRevealed) {
      return null;
    }
    
    if (isMine) {
      return <Bomb className="h-6 w-6 text-red-500" />;
    } else {
      return <Gem className="h-6 w-6 text-green-500" />;
    }
  };

  const getCellClass = (row: number, col: number) => {
    if (!gameState) {
      return "bg-[hsl(240,18%,8%)] hover:bg-[hsl(240,18%,12%)] border-2 border-[hsl(215,13%,45%)]";
    }
    
    const isRevealed = gameState.revealedCells[row][col];
    const isMine = gameState.grid[row][col];
    
    if (!isRevealed) {
      return "bg-[hsl(240,18%,8%)] hover:bg-[hsl(240,18%,12%)] border-2 border-[hsl(215,13%,45%)] cursor-pointer hover:scale-105";
    }
    
    if (isMine) {
      return "bg-red-500/20 border-2 border-red-500";
    } else {
      return "bg-green-500/20 border-2 border-green-500";
    }
  };

  const revealedCount = gameState?.revealedCells.flat().filter(Boolean).length || 0;
  const safeCount = 25 - mineCount;

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
                Mines 💎
              </h1>
              <p className="text-[hsl(215,13%,45%)]">Find gems while avoiding mines</p>
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
          {/* Game Grid */}
          <div className="lg:col-span-2">
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="text-center">
                  Minefield ({mineCount} mines hidden)
                  {gameState && (
                    <Badge variant="outline" className="ml-2">
                      {revealedCount}/{safeCount} safe tiles
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2 max-w-md mx-auto">
                  {Array.from({ length: 25 }, (_, i) => {
                    const row = Math.floor(i / 5);
                    const col = i % 5;
                    return (
                      <button
                        key={i}
                        onClick={() => revealCell(row, col)}
                        disabled={!gameState || gameState.gameOver || !isPlaying}
                        className={`
                          h-16 w-16 rounded-lg flex items-center justify-center
                          transition-all duration-200 
                          ${getCellClass(row, col)}
                        `}
                      >
                        {getCellContent(row, col)}
                      </button>
                    );
                  })}
                </div>
                
                {gameState && !gameState.gameOver && isPlaying && (
                  <div className="text-center mt-6">
                    <div className="text-2xl font-bold text-[hsl(43,96%,56%)] mb-2">
                      Current Multiplier: {currentMultiplier.toFixed(2)}x
                    </div>
                    <Button
                      onClick={cashOut}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      Cash Out: ${(betAmount * currentMultiplier).toFixed(2)}
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

                <div>
                  <Label htmlFor="mine-count">Number of Mines</Label>
                  <select
                    id="mine-count"
                    value={mineCount}
                    onChange={(e) => setMineCount(parseInt(e.target.value))}
                    disabled={isPlaying}
                    className="w-full mt-1 px-3 py-2 bg-[hsl(240,18%,8%)] border border-[hsl(215,13%,45%)] rounded-md"
                  >
                    {[3, 5, 7, 10, 15].map(count => (
                      <option key={count} value={count}>{count} mines</option>
                    ))}
                  </select>
                </div>

                <Button
                  onClick={startGame}
                  disabled={isPlaying || !user}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-lg"
                  size="lg"
                >
                  {isPlaying ? "Playing..." : "Start Mining"}
                </Button>
              </CardContent>
            </Card>

            {/* Current Game Stats */}
            {gameState && isPlaying && (
              <Card className="glass-effect">
                <CardHeader>
                  <CardTitle className="text-sm">Current Game</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Safe tiles found:</span>
                      <span>{revealedCount}/{safeCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current multiplier:</span>
                      <span className="text-[hsl(43,96%,56%)]">{currentMultiplier.toFixed(2)}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Potential payout:</span>
                      <span className="text-green-400">${(betAmount * currentMultiplier).toFixed(2)}</span>
                    </div>
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
                      {lastResult.result === 'win' ? 'WIN' : 'LOSS'}
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

            {/* How to Play */}
            <Card className="glass-effect">
              <CardHeader>
                <CardTitle className="text-sm">How to Play</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-[hsl(215,13%,45%)] space-y-2">
                <p>• Click tiles to reveal gems or mines</p>
                <p>• Each safe tile increases your multiplier</p>
                <p>• Cash out anytime to secure your winnings</p>
                <p>• Hit a mine and lose everything!</p>
                <p>• More mines = higher risk but better rewards</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
