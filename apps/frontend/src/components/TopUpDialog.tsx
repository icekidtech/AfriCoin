import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Smartphone, CreditCard, Zap } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";

interface TopUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TopUpDialog = ({ open, onOpenChange }: TopUpDialogProps) => {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [fundingMethod, setFundingMethod] = useState<"mobileMonkeyMoney" | "bankTransfer" | "crypto">("mobileMonkeyMoney");
  const [cryptoType, setCryptoType] = useState<"usdc" | "usdt">("usdc");

  const quickAmounts = [100, 500, 1000, 2000];

  const handleTopUp = () => {
    if (!amount) {
      toast({ 
        title: "Missing Amount", 
        description: "Please enter an amount",
        variant: "destructive"
      });
      return;
    }

    if (fundingMethod === "mobileMonkeyMoney" && !phone) {
      toast({ 
        title: "Missing Information", 
        description: "Please enter M-Pesa number",
        variant: "destructive"
      });
      return;
    }

    // Handle different funding methods
    if (fundingMethod === "mobileMonkeyMoney") {
      toast({ 
        title: "Top Up Initiated", 
        description: `M-Pesa prompt sent to ${phone} for ₳${amount}` 
      });
    } else if (fundingMethod === "bankTransfer") {
      toast({
        title: "Bank Transfer Details",
        description: `Transfer ₳${amount} to our account. Details sent to your phone.`
      });
    } else if (fundingMethod === "crypto") {
      toast({
        title: `${cryptoType.toUpperCase()} Conversion Initiated`,
        description: `Send ${cryptoType.toUpperCase()} equivalent to receive ₳${amount}`
      });
    }

    onOpenChange(false);
    setAmount("");
    setPhone("");
    setFundingMethod("mobileMonkeyMoney");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Top Up Wallet</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Amount Input */}
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

          {/* Funding Method Selection */}
          <div className="space-y-3">
            <Label>Funding Method</Label>
            
            {/* Mobile Money */}
            <Card 
              className={`p-4 cursor-pointer transition-all ${fundingMethod === "mobileMonkeyMoney" ? "border-primary bg-primary/5" : ""}`}
              onClick={() => setFundingMethod("mobileMonkeyMoney")}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                  <Smartphone className="w-5 h-5 text-success" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Mobile Money</p>
                  <p className="text-xs text-muted-foreground">M-Pesa, Airtel Money</p>
                </div>
                <input 
                  type="radio" 
                  checked={fundingMethod === "mobileMonkeyMoney"}
                  onChange={() => setFundingMethod("mobileMonkeyMoney")}
                />
              </div>
            </Card>

            {/* Bank Transfer */}
            <Card 
              className={`p-4 cursor-pointer transition-all ${fundingMethod === "bankTransfer" ? "border-primary bg-primary/5" : ""}`}
              onClick={() => setFundingMethod("bankTransfer")}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Bank Transfer</p>
                  <p className="text-xs text-muted-foreground">Direct bank deposit</p>
                </div>
                <input 
                  type="radio" 
                  checked={fundingMethod === "bankTransfer"}
                  onChange={() => setFundingMethod("bankTransfer")}
                />
              </div>
            </Card>

            {/* Crypto Payment */}
            <Card 
              className={`p-4 cursor-pointer transition-all ${fundingMethod === "crypto" ? "border-primary bg-primary/5" : ""}`}
              onClick={() => setFundingMethod("crypto")}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Crypto Transfer</p>
                  <p className="text-xs text-muted-foreground">USDC / USDT on blockchain</p>
                </div>
                <input 
                  type="radio" 
                  checked={fundingMethod === "crypto"}
                  onChange={() => setFundingMethod("crypto")}
                />
              </div>
            </Card>
          </div>

          {/* Mobile Money Details */}
          {fundingMethod === "mobileMonkeyMoney" && (
            <div className="space-y-2 pt-2 border-t">
              <Label htmlFor="phone">M-Pesa Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+254 700 000 000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          )}

          {/* Bank Transfer Details */}
          {fundingMethod === "bankTransfer" && (
            <div className="space-y-2 pt-2 border-t bg-muted/50 p-3 rounded-lg">
              <p className="text-xs font-semibold">Bank Transfer Instructions</p>
              <div className="text-xs space-y-1 text-muted-foreground">
                <p><span className="font-semibold">Bank Name:</span> AfriCoin Liquidity Bank</p>
                <p><span className="font-semibold">Account Number:</span> 123456789</p>
                <p><span className="font-semibold">Reference:</span> Use your phone number</p>
              </div>
              <p className="text-xs text-amber-600 font-semibold">Transfer will be credited within 24 hours</p>
            </div>
          )}

          {/* Crypto Details */}
          {fundingMethod === "crypto" && (
            <div className="space-y-3 pt-2 border-t">
              <Label>Cryptocurrency</Label>
              <div className="flex gap-2">
                <Button
                  variant={cryptoType === "usdc" ? "default" : "outline"}
                  onClick={() => setCryptoType("usdc")}
                  className="flex-1"
                >
                  USDC
                </Button>
                <Button
                  variant={cryptoType === "usdt" ? "default" : "outline"}
                  onClick={() => setCryptoType("usdt")}
                  className="flex-1"
                >
                  USDT
                </Button>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg text-xs space-y-1 text-muted-foreground">
                <p className="font-semibold text-foreground">Conversion Details:</p>
                <p>• Send {cryptoType.toUpperCase()} to our liquidity pool</p>
                <p>• Automatic conversion to AfriCoin (1:1 rate)</p>
                <p>• Funds received within 2-5 minutes</p>
                <p className="font-semibold text-amber-600">Network: Ethereum / Polygon</p>
              </div>
            </div>
          )}

          {/* CTA Button */}
          <Button 
            onClick={handleTopUp} 
            className="w-full"
            size="lg"
          >
            {fundingMethod === "mobileMonkeyMoney" && "Send M-Pesa Prompt"}
            {fundingMethod === "bankTransfer" && "Get Bank Details"}
            {fundingMethod === "crypto" && "Generate Deposit Address"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
