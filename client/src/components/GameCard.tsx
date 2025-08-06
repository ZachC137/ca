import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface GameCardProps {
  game: {
    id: string;
    name: string;
    type: string;
    description: string;
    image: string;
    rtp?: string;
    status?: string;
    buttonText: string;
    buttonColor: string;
    path: string;
  };
}

export default function GameCard({ game }: GameCardProps) {
  const [, setLocation] = useLocation();

  const handlePlay = () => {
    setLocation(game.path);
  };

  return (
    <Card 
      className="glass-effect cursor-pointer group hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-[hsl(220,91%,57%)]/25"
      data-testid={`card-game-${game.id}`}
    >
      <CardContent className="p-6">
        <div className="text-6xl mb-4 text-center group-hover:scale-110 transition-transform duration-300">
          {game.image}
        </div>
        
        <h4 className="text-xl font-semibold mb-2" data-testid={`text-game-name-${game.id}`}>
          {game.name}
        </h4>
        
        <p className="text-[hsl(215,13%,45%)] mb-4 text-sm" data-testid={`text-game-description-${game.id}`}>
          {game.description}
        </p>
        
        <div className="flex justify-between items-center">
          <span className="font-semibold text-sm" data-testid={`text-game-status-${game.id}`}>
            {game.rtp && (
              <span className="text-[hsl(43,96%,56%)]">RTP: {game.rtp}</span>
            )}
            {game.status && (
              <span className="text-green-400">{game.status}</span>
            )}
          </span>
          
          <Button
            onClick={handlePlay}
            className={`bg-gradient-to-r ${game.buttonColor} hover:shadow-lg transition-all duration-300 text-sm`}
            data-testid={`button-play-${game.id}`}
          >
            {game.buttonText}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
