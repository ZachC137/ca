import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, Plus, Minus, Gift } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AddFundsModal from "./AddFundsModal";
import type { User } from "@shared/schema";

interface WalletSectionProps {
  user: User;
}

export default function WalletSection({ user }: WalletSectionProps) {
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bonusStatus } = useQuery<{ canClaim: boolean }>({
    queryKey: ["/api/daily-bonus/status"],
    retry: false,
  });

  const claimBonusMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/daily-bonus");
    },
    onSuccess: () => {
      toast({
        title: "Daily Bonus Claimed!",
        description: "You've received your daily bonus of $25.00",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/daily-bonus/status"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to claim daily bonus",
        variant: "destructive",
      });
    },
  });

  const handleClaimBonus = () => {
    claimBonusMutation.mutate();
  };

  // Calculate today's P&L (simplified)
  const todaysPnL = "+$127.30"; // Would calculate from transactions in real app
  const availableBonus = bonusStatus?.canClaim ? "$25.00" : "$0.00";

  return (
    <Card className="glass-effect">
      <CardContent className="p-6">
        <h4 className="text-xl font-semibold mb-6 flex items-center">
          <Wallet className="text-[hsl(43,96%,56%)] mr-3" />
          Virtual Wallet
        </h4>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[hsl(215,13%,45%)]">Current Balance</span>
            <span className="text-2xl font-bold text-[hsl(43,96%,56%)]" data-testid="text-current-balance">
              ${user?.balance || "0.00"}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-[hsl(215,13%,45%)]">Today's P&L</span>
            <span className="text-green-400 font-semibold" data-testid="text-daily-pnl">
              {todaysPnL}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-[hsl(215,13%,45%)]">Available Bonus</span>
            <span className="text-[hsl(258,90%,66%)] font-semibold" data-testid="text-available-bonus">
              {availableBonus}
            </span>
          </div>
        </div>
        
        <div className="mt-6 space-y-3">
          {bonusStatus?.canClaim && (
            <Button
              onClick={handleClaimBonus}
              disabled={claimBonusMutation.isPending}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:shadow-lg hover:shadow-green-500/25 transition-all duration-300"
              data-testid="button-claim-bonus"
            >
              <Gift className="mr-2 h-4 w-4" />
              {claimBonusMutation.isPending ? "Claiming..." : "Claim Daily Bonus ($25)"}
            </Button>
          )}
          
          <Button 
            onClick={() => setShowAddFundsModal(true)}
            className="w-full bg-gradient-to-r from-[hsl(220,91%,57%)] to-[hsl(258,90%,66%)] hover:shadow-lg hover:shadow-[hsl(220,91%,57%)]/25 transition-all duration-300"
            data-testid="button-add-funds"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Funds
          </Button>
          
          <Button 
            className="w-full bg-gradient-to-r from-[hsl(43,96%,56%)] to-yellow-600 hover:shadow-lg hover:shadow-[hsl(43,96%,56%)]/25 transition-all duration-300"
            data-testid="button-withdraw"
            disabled
          >
            <Minus className="mr-2 h-4 w-4" />
            Withdraw (Coming Soon)
          </Button>
        </div>

        {/* Stats Summary */}
        <div className="mt-6 pt-6 border-t border-[hsl(215,13%,45%)]/20">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-[hsl(258,90%,66%)]" data-testid="text-total-wagered">
                ${(parseFloat(user?.totalWinnings || "0") + parseFloat(user?.totalLosses || "0")).toFixed(2)}
              </div>
              <div className="text-xs text-[hsl(215,13%,45%)]">Total Wagered</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-400" data-testid="text-profit-loss">
                ${(parseFloat(user?.totalWinnings || "0") - parseFloat(user?.totalLosses || "0")).toFixed(2)}
              </div>
              <div className="text-xs text-[hsl(215,13%,45%)]">Profit/Loss</div>
            </div>
          </div>
        </div>
      </CardContent>
      
      <AddFundsModal 
        open={showAddFundsModal} 
        onOpenChange={setShowAddFundsModal}
      />
    </Card>
  );
}
