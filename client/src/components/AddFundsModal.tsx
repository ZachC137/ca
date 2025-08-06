
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, DollarSign } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AddFundsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddFundsModal({ open, onOpenChange }: AddFundsModalProps) {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("virtual");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addFundsMutation = useMutation({
    mutationFn: async (amount: number) => {
      return await apiRequest("POST", "/api/wallet/add-funds", { amount, method: paymentMethod });
    },
    onSuccess: (data) => {
      toast({
        title: "Funds Added Successfully!",
        description: `$${parseFloat(amount).toFixed(2)} has been added to your account`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      onOpenChange(false);
      setAmount("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add funds",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    
    if (!numAmount || numAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than $0",
        variant: "destructive",
      });
      return;
    }

    if (numAmount > 10000) {
      toast({
        title: "Amount Too Large",
        description: "Maximum deposit is $10,000 per transaction",
        variant: "destructive",
      });
      return;
    }

    addFundsMutation.mutate(numAmount);
  };

  const quickAmounts = [10, 25, 50, 100, 250, 500];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] glass-effect border-[hsl(220,91%,57%)]/20">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <DollarSign className="mr-2 h-5 w-5 text-[hsl(43,96%,56%)]" />
            Add Funds to Wallet
          </DialogTitle>
          <DialogDescription className="text-[hsl(215,13%,45%)]">
            Add virtual currency to your gaming wallet. This is for demonstration purposes only.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ($USD)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              max="10000"
              step="0.01"
              className="bg-[hsl(240,18%,8%)]/50 border-[hsl(220,91%,57%)]/20 text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Quick Select</Label>
            <div className="grid grid-cols-3 gap-2">
              {quickAmounts.map((quickAmount) => (
                <Button
                  key={quickAmount}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(quickAmount.toString())}
                  className="border-[hsl(220,91%,57%)]/20 hover:bg-[hsl(220,91%,57%)]/10"
                >
                  ${quickAmount}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Payment Method</Label>
            <div className="space-y-2">
              <div 
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  paymentMethod === 'virtual' 
                    ? 'border-[hsl(220,91%,57%)] bg-[hsl(220,91%,57%)]/10' 
                    : 'border-[hsl(220,91%,57%)]/20 hover:border-[hsl(220,91%,57%)]/40'
                }`}
                onClick={() => setPaymentMethod('virtual')}
              >
                <div className="flex items-center space-x-2">
                  <input 
                    type="radio" 
                    checked={paymentMethod === 'virtual'} 
                    onChange={() => setPaymentMethod('virtual')}
                  />
                  <CreditCard className="h-4 w-4" />
                  <span>Virtual Payment (Demo)</span>
                </div>
                <p className="text-xs text-[hsl(215,13%,45%)] mt-1 ml-6">
                  Instant virtual currency for gaming purposes
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="border-[hsl(220,91%,57%)]/20"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={addFundsMutation.isPending || !amount}
              className="bg-gradient-to-r from-[hsl(220,91%,57%)] to-[hsl(258,90%,66%)] hover:shadow-lg hover:shadow-[hsl(220,91%,57%)]/25 transition-all duration-300"
            >
              {addFundsMutation.isPending ? "Processing..." : `Add $${parseFloat(amount || "0").toFixed(2)}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
