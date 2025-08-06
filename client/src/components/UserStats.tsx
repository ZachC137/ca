import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Trophy, Target, Star } from "lucide-react";

interface UserStatsProps {
  user: any;
  gameHistory: any[];
}

export default function UserStats({ user, gameHistory }: UserStatsProps) {
  const totalGames = gameHistory?.length || 0;
  const winCount = gameHistory?.filter(game => game.result === 'win')?.length || 0;
  const winRate = totalGames > 0 ? ((winCount / totalGames) * 100).toFixed(1) : "0.0";
  const biggestWin = gameHistory?.reduce((max, game) => {
    const winAmount = parseFloat(game.winAmount);
    return winAmount > max ? winAmount : max;
  }, 0) || 0;

  const currentLevel = user?.level || 1;
  const currentExp = user?.experience || 0;
  const expToNext = currentLevel * 1000; // 1000 exp per level
  const expProgress = ((currentExp % 1000) / 1000) * 100;

  return (
    <Card className="glass-effect">
      <CardContent className="p-6">
        <h4 className="text-xl font-semibold mb-6 flex items-center">
          <TrendingUp className="text-[hsl(220,91%,57%)] mr-3" />
          Game Statistics
        </h4>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[hsl(215,13%,45%)]">Games Played</span>
            <span className="font-semibold" data-testid="text-games-played">
              {totalGames}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-[hsl(215,13%,45%)]">Win Rate</span>
            <span className="text-green-400 font-semibold" data-testid="text-win-rate">
              {winRate}%
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-[hsl(215,13%,45%)]">Biggest Win</span>
            <span className="text-[hsl(43,96%,56%)] font-semibold" data-testid="text-biggest-win">
              ${biggestWin.toFixed(2)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-[hsl(215,13%,45%)]">Current Level</span>
            <span className="font-semibold text-[hsl(258,90%,66%)]" data-testid="text-current-level">
              Level {currentLevel}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-[hsl(215,13%,45%)]">Total Winnings</span>
            <span className="text-[hsl(43,96%,56%)] font-semibold" data-testid="text-total-winnings">
              ${user?.totalWinnings || "0.00"}
            </span>
          </div>
        </div>
        
        {/* Progress towards next level */}
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[hsl(215,13%,45%)]">Level Progress</span>
            <span className="text-[hsl(258,90%,66%)]">
              {currentExp} / {expToNext} XP
            </span>
          </div>
          <Progress 
            value={expProgress} 
            className="h-2"
            data-testid="progress-level"
          />
        </div>

        {/* Recent Activity */}
        <div className="mt-6">
          <h5 className="font-semibold mb-3 flex items-center">
            <Trophy className="text-[hsl(258,90%,66%)] mr-2 h-4 w-4" />
            Recent Games
          </h5>
          
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
            {gameHistory?.slice(0, 5).map((game, index) => (
              <div 
                key={game.id || index} 
                className="flex justify-between items-center p-2 bg-[hsl(240,18%,8%)]/50 rounded-lg text-sm"
                data-testid={`item-recent-game-${index}`}
              >
                <div>
                  <div className="font-medium capitalize">
                    {game.gameId?.replace('game-', '') || 'Unknown'}
                  </div>
                  <div className="text-xs text-[hsl(215,13%,45%)]">
                    {new Date(game.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className={`font-semibold ${
                  game.result === 'win' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {game.result === 'win' ? '+' : '-'}${Math.abs(parseFloat(game.winAmount) - parseFloat(game.betAmount)).toFixed(2)}
                </div>
              </div>
            ))}
            
            {(!gameHistory || gameHistory.length === 0) && (
              <div className="text-center text-[hsl(215,13%,45%)] py-4">
                No games played yet. Start playing to see your history!
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
