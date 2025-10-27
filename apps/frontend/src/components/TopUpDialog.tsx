import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Smartphone } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface TopUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TopUpDialog = ({ open, onOpenChange }: TopUpDialogProps) => {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");

  const quickAmounts = [100, 500, 1000, 2000];

  const handleTopUp = () => {
    if (!amount || !phone) {
      toast({ 
        title: "Missing Information", 
        description: "Please enter amount and M-Pesa number",
        variant: "destructive"
      });
      return;
    }
    
    toast({ 
      title: "Top Up Initiated", 
      description: `M-Pesa prompt sent to ${phone} for ₳${amount}` 
    });
    onOpenChange(false);
    setAmount("");
    setPhone("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Top Up Wallet</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (₳)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <div className="grid grid-cols-4 gap-2 mt-2">
              {quickAmounts.map((amt) => (
                <Button
                  key={amt}
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(amt.toString())}
                >
                  ₳{amt}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">M-Pesa Number</Label>
            <div className="flex gap-2">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-5 h-5 text-success" />
              </div>
              <Input
                id="phone"
                type="tel"
                placeholder="+254 700 000 000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <Button 
            onClick={handleTopUp} 
            className="w-full"
            size="lg"
          >
            Send M-Pesa Prompt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
