import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Slots from "@/pages/games/slots";
import Crash from "@/pages/games/crash";
import Dice from "@/pages/games/dice";
import Roulette from "@/pages/games/roulette";
import Blackjack from "@/pages/games/blackjack";
import Plinko from "@/pages/games/plinko";
import CoinFlip from "@/pages/games/coinflip";
import Leaderboard from "@/pages/leaderboard";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/games/slots" component={Slots} />
          <Route path="/games/crash" component={Crash} />
          <Route path="/games/dice" component={Dice} />
          <Route path="/games/roulette" component={Roulette} />
          <Route path="/games/blackjack" component={Blackjack} />
          <Route path="/games/plinko" component={Plinko} />
          <Route path="/games/coinflip" component={CoinFlip} />
          <Route path="/leaderboard" component={Leaderboard} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="dark min-h-screen">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
