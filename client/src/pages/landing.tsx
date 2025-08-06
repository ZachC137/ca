import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dice1, Star, Users, TrendingUp, Shield, Zap } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-casino-dark via-casino-navy to-casino-dark text-white">
      {/* Header */}
      <header className="glass-effect border-b border-[hsl(220,91%,57%)]/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-[hsl(220,91%,57%)] to-[hsl(258,90%,66%)] rounded-lg flex items-center justify-center">
                <Dice1 className="text-white text-xl" />
              </div>
              <h1 className="text-2xl font-bold neon-text">CryptoGaming</h1>
            </div>
            
            <Button
              onClick={handleLogin}
              className="bg-gradient-to-r from-[hsl(220,91%,57%)] to-[hsl(258,90%,66%)] hover:shadow-lg hover:shadow-[hsl(220,91%,57%)]/25 transition-all duration-300"
              data-testid="button-login"
            >
              Sign In to Play
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-6xl font-bold mb-6 bg-gradient-to-r from-[hsl(220,91%,57%)] via-[hsl(258,90%,66%)] to-[hsl(43,96%,56%)] bg-clip-text text-transparent">
            Welcome to the Future of Gaming
          </h2>
          <p className="text-xl text-[hsl(215,13%,45%)] mb-8 max-w-2xl mx-auto">
            Experience provably fair gaming with cutting-edge technology. Win big with our diverse selection of games.
          </p>
          
          <Button
            onClick={handleLogin}
            size="lg"
            className="bg-gradient-to-r from-[hsl(220,91%,57%)] to-[hsl(258,90%,66%)] hover:shadow-lg hover:shadow-[hsl(220,91%,57%)]/25 transition-all duration-300 text-lg px-8 py-4 animate-glow"
            data-testid="button-get-started"
          >
            Get Started - Free $1000
          </Button>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto mt-16">
            <Card className="glass-effect">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-[hsl(43,96%,56%)] mb-2" data-testid="text-total-players">
                  12,847
                </div>
                <div className="text-[hsl(215,13%,45%)]">Active Players</div>
              </CardContent>
            </Card>
            <Card className="glass-effect">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-[hsl(220,91%,57%)] mb-2" data-testid="text-total-winnings">
                  $2.4M
                </div>
                <div className="text-[hsl(215,13%,45%)]">Total Winnings</div>
              </CardContent>
            </Card>
            <Card className="glass-effect">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-[hsl(258,90%,66%)] mb-2" data-testid="text-games-played">
                  486K
                </div>
                <div className="text-[hsl(215,13%,45%)]">Games Played</div>
              </CardContent>
            </Card>
            <Card className="glass-effect">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-green-400 mb-2" data-testid="text-uptime">
                  99.9%
                </div>
                <div className="text-[hsl(215,13%,45%)]">Uptime</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-gradient-to-r from-[hsl(240,17%,12%)]/50 to-[hsl(240,18%,8%)]/50">
        <div className="container mx-auto">
          <h3 className="text-4xl font-bold text-center mb-12">Why Choose CryptoGaming?</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="glass-effect hover:shadow-lg hover:shadow-[hsl(220,91%,57%)]/25 transition-all duration-300">
              <CardContent className="p-6 text-center">
                <Shield className="w-16 h-16 text-[hsl(220,91%,57%)] mx-auto mb-4" />
                <h4 className="text-xl font-semibold mb-3">Provably Fair</h4>
                <p className="text-[hsl(215,13%,45%)]">
                  All games use cryptographic verification to ensure complete fairness and transparency.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-effect hover:shadow-lg hover:shadow-[hsl(258,90%,66%)]/25 transition-all duration-300">
              <CardContent className="p-6 text-center">
                <Zap className="w-16 h-16 text-[hsl(258,90%,66%)] mx-auto mb-4" />
                <h4 className="text-xl font-semibold mb-3">Instant Payouts</h4>
                <p className="text-[hsl(215,13%,45%)]">
                  Lightning-fast virtual currency transactions with no delays or hidden fees.
                </p>
              </CardContent>
            </Card>

            <Card className="glass-effect hover:shadow-lg hover:shadow-[hsl(43,96%,56%)]/25 transition-all duration-300">
              <CardContent className="p-6 text-center">
                <Star className="w-16 h-16 text-[hsl(43,96%,56%)] mx-auto mb-4" />
                <h4 className="text-xl font-semibold mb-3">VIP Rewards</h4>
                <p className="text-[hsl(215,13%,45%)]">
                  Exclusive bonuses, achievements, and rewards for our most loyal players.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Games Preview */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h3 className="text-4xl font-bold text-center mb-12">Popular Games</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "Lucky Slots", icon: "🎰", description: "Classic slots with big jackpots" },
              { name: "Rocket Crash", icon: "🚀", description: "Multiplier-based crash game" },
              { name: "Dice Roll", icon: "🎲", description: "Provably fair dice betting" },
              { name: "Roulette", icon: "🎯", description: "European roulette wheel" },
            ].map((game) => (
              <Card key={game.name} className="glass-effect hover:scale-105 transition-transform duration-300">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">{game.icon}</div>
                  <h4 className="text-lg font-semibold mb-2">{game.name}</h4>
                  <p className="text-[hsl(215,13%,45%)] text-sm">{game.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <div className="container mx-auto">
          <h3 className="text-4xl font-bold mb-6">Ready to Start Playing?</h3>
          <p className="text-xl text-[hsl(215,13%,45%)] mb-8 max-w-xl mx-auto">
            Join thousands of players and start your gaming journey today. Get $1000 in virtual currency to begin.
          </p>
          
          <Button
            onClick={handleLogin}
            size="lg"
            className="bg-gradient-to-r from-[hsl(43,96%,56%)] to-yellow-600 hover:shadow-lg hover:shadow-[hsl(43,96%,56%)]/25 transition-all duration-300 text-lg px-8 py-4"
            data-testid="button-join-now"
          >
            Join Now - It's Free!
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[hsl(240,18%,8%)] border-t border-[hsl(220,91%,57%)]/20 py-8 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-[hsl(220,91%,57%)] to-[hsl(258,90%,66%)] rounded-lg flex items-center justify-center">
              <Dice1 className="text-white" />
            </div>
            <span className="text-xl font-bold neon-text">CryptoGaming</span>
          </div>
          <p className="text-[hsl(215,13%,45%)]">
            &copy; 2024 CryptoGaming. All rights reserved. Play responsibly with virtual currency only.
          </p>
        </div>
      </footer>
    </div>
  );
}
