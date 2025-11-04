import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Smartphone, CreditCard, Zap, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { useMockOracle } from "@/hooks/useMockOracle";
import { useWalletFunding } from "@/hooks/useWalletFunding";
import { useAuth } from "@/hooks/useAuth";
import { WalletConnectModal } from "./WalletConnectModal";
import { useAfriCoinContract } from "@/hooks/useAfriCoinContract";

interface TopUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TopUpDialog = ({ open, onOpenChange }: TopUpDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { convertToAfriCoin, getConversionRate, loading: priceLoading } =
    useMockOracle();
  const { fundViaWallet, fundViaBackend, loading: fundingLoading } =
    useWalletFunding();
  const { fundUserAccount, loading: contractLoading } = useAfriCoinContract();

  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [currency, setCurrency] = useState("KES");
  const [fundingMethod, setFundingMethod] = useState<
    "mobileMoneyMoney" | "bankTransfer" | "crypto"
  >("mobileMoneyMoney");
  const [cryptoType, setCryptoType] = useState<"usdc" | "usdt">("usdc");
  const [conversionRate, setConversionRate] = useState<string | null>(null);
  const [afriCoinAmount, setAfriCoinAmount] = useState<string | null>(null);
  const [showConversionDetails, setShowConversionDetails] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  const quickAmounts = [100, 500, 1000, 2000];
  const loading = priceLoading || fundingLoading || contractLoading;

  /**
   * Fetch conversion rate when amount or currency changes
   */
  useEffect(() => {
    const updateConversion = async () => {
      if (!amount || fundingMethod === "crypto") {
        setConversionRate(null);
        setAfriCoinAmount(null);
        return;
      }

      try {
        const rate = await getConversionRate(currency);
        setConversionRate(rate);

        const afriAmount = await convertToAfriCoin(
          parseFloat(amount),
          currency
        );
        setAfriCoinAmount(afriAmount.toFixed(2));
      } catch (err) {
        console.error("Conversion error:", err);
        setConversionRate(null);
        setAfriCoinAmount(null);
      }
    };

    updateConversion();
  }, [amount, currency, fundingMethod, convertToAfriCoin, getConversionRate]);

  const handleTopUp = async () => {
    if (!amount) {
      toast({
        title: "Missing Amount",
        description: "Please enter an amount",
        variant: "destructive",
      });
      return;
    }

    try {
      if (fundingMethod === "mobileMoneyMoney") {
        if (!phone) {
          toast({
            title: "Missing Information",
            description: "Please enter M-Pesa number",
            variant: "destructive",
          });
          return;
        }

        await fundViaBackend(
          afriCoinAmount || amount,
          user?.phoneHash || "",
          "mobileMoney",
          currency
        );

        toast({
          title: "Top Up Initiated",
          description: `M-Pesa prompt sent to ${phone} for ${currency} ${amount}`,
        });
        onOpenChange(false);
      } else if (fundingMethod === "bankTransfer") {
        await fundViaBackend(
          afriCoinAmount || amount,
          user?.phoneHash || "",
          "bankTransfer",
          currency
        );

        toast({
          title: "Bank Transfer Details",
          description: `Transfer ${currency} ${amount} to our account. Details sent to your phone.`,
        });
        onOpenChange(false);
      } else if (fundingMethod === "crypto") {
        // Open wallet connection modal
        setWalletModalOpen(true);
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to process top up",
        variant: "destructive",
      });
    }
  };

  const handleWalletSuccess = async (txHash: string) => {
    try {
      // Record transaction in backend via POST endpoint
      const response = await fetch("/api/wallet/record-funding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txHash,
          amount: afriCoinAmount || amount,
          fromAddress: user?.walletAddress,
          toAddress: user?.walletAddress,
          method: "wallet",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to record transaction");
      }

      toast({
        title: "Funding Successful",
        description: `Transaction ${txHash.slice(0, 10)}... confirmed`,
      });

      setWalletModalOpen(false);
      onOpenChange(false);
      setAmount("");
      setFundingMethod("mobileMoneyMoney");
    } catch (err) {
      console.error("Failed to record transaction:", err);
      toast({
        title: "Warning",
        description: "Transaction sent but could not be recorded. Please contact support.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Top Up Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount ({fundingMethod === "crypto" ? "USD" : currency})
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={loading}
              />
              <div className="grid grid-cols-4 gap-2 mt-2">
                {quickAmounts.map((amt) => (
                  <Button
                    key={amt}
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(amt.toString())}
                    disabled={loading}
                  >
                    {fundingMethod === "crypto" ? "$" : ""}
                    {amt}
                  </Button>
                ))}
              </div>
            </div>

            {/* Conversion Rate Display */}
            {conversionRate && afriCoinAmount && fundingMethod !== "crypto" && (
              <Card className="bg-primary/5 border-primary/20 p-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Conversion Rate:
                    </span>
                    <span className="font-semibold">
                      1 {currency} = {conversionRate} AFRI
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">You will receive:</span>
                    <span className="text-primary font-bold">
                      {afriCoinAmount} AFRI
                    </span>
                  </div>
                </div>
              </Card>
            )}

            {/* Currency Selection (for mobile money/bank) */}
            {fundingMethod !== "crypto" && (
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  disabled={loading}
                >
                  <option value="KES">Kenyan Shilling (KES)</option>
                  <option value="NGN">Nigerian Naira (NGN)</option>
                  <option value="USD">US Dollar (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                  <option value="GBP">British Pound (GBP)</option>
                  <option value="ZAR">South African Rand (ZAR)</option>
                </select>
              </div>
            )}

            {/* Funding Method Selection */}
            <div className="space-y-3">
              <Label>Funding Method</Label>

              {/* Mobile Money */}
              <Card
                className={`p-4 cursor-pointer transition-all ${
                  fundingMethod === "mobileMoneyMoney"
                    ? "border-primary bg-primary/5"
                    : ""
                }`}
                onClick={() => setFundingMethod("mobileMoneyMoney")}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                    <Smartphone className="w-5 h-5 text-success" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Mobile Money</p>
                    <p className="text-xs text-muted-foreground">
                      M-Pesa, Airtel Money
                    </p>
                  </div>
                  <input
                    type="radio"
                    checked={fundingMethod === "mobileMoneyMoney"}
                    onChange={() => setFundingMethod("mobileMoneyMoney")}
                  />
                </div>
              </Card>

              {/* Bank Transfer */}
              <Card
                className={`p-4 cursor-pointer transition-all ${
                  fundingMethod === "bankTransfer"
                    ? "border-primary bg-primary/5"
                    : ""
                }`}
                onClick={() => setFundingMethod("bankTransfer")}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Bank Transfer</p>
                    <p className="text-xs text-muted-foreground">
                      Direct bank deposit
                    </p>
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
                className={`p-4 cursor-pointer transition-all ${
                  fundingMethod === "crypto" ? "border-primary bg-primary/5" : ""
                }`}
                onClick={() => setFundingMethod("crypto")}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Crypto Wallet</p>
                    <p className="text-xs text-muted-foreground">
                      Send from your Web3 wallet
                    </p>
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
            {fundingMethod === "mobileMoneyMoney" && (
              <div className="space-y-2 pt-2 border-t">
                <Label htmlFor="phone">M-Pesa Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+254 700 000 000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading}
                />
              </div>
            )}

            {/* Bank Transfer Details */}
            {fundingMethod === "bankTransfer" && (
              <div className="space-y-2 pt-2 border-t bg-muted/50 p-3 rounded-lg">
                <p className="text-xs font-semibold">Bank Transfer Instructions</p>
                <div className="text-xs space-y-1 text-muted-foreground">
                  <p>
                    <span className="font-semibold">Bank Name:</span> AfriCoin
                    Liquidity Bank
                  </p>
                  <p>
                    <span className="font-semibold">Account Number:</span>{" "}
                    123456789
                  </p>
                  <p>
                    <span className="font-semibold">Reference:</span> Use your
                    phone number
                  </p>
                </div>
                <p className="text-xs text-amber-600 font-semibold">
                  Transfer will be credited within 24 hours
                </p>
              </div>
            )}

            {/* Crypto Details */}
            {fundingMethod === "crypto" && (
              <div className="space-y-3 pt-2 border-t">
                <Label>Send from Your Wallet</Label>
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-sm space-y-2">
                  <p className="font-semibold text-blue-900">
                    Contract Address:
                  </p>
                  <p className="font-mono text-xs bg-white p-2 rounded break-all">
                    {process.env.VITE_AFRICOIN_ADDRESS}
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs space-y-1 text-amber-900">
                  <p className="font-semibold">Steps:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Copy the contract address above</li>
                    <li>Open your Web3 wallet (MetaMask, etc.)</li>
                    <li>Send AfriCoin to the address</li>
                    <li>Sign and confirm the transaction</li>
                    <li>Funds will be available shortly</li>
                  </ol>
                </div>

                {showConversionDetails && amount && (
                  <Card className="bg-primary/5 border-primary/20 p-3">
                    <p className="text-sm font-semibold mb-2">
                      Transaction Details:
                    </p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Amount:</span>
                        <span className="font-mono">{amount} USD</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Network:</span>
                        <span className="font-mono">Base Sepolia</span>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* CTA Button */}
            <Button
              onClick={handleTopUp}
              className="w-full"
              size="lg"
              disabled={loading || !amount}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {fundingMethod === "mobileMoneyMoney" && "Send M-Pesa Prompt"}
              {fundingMethod === "bankTransfer" && "Get Bank Details"}
              {fundingMethod === "crypto" && "I'm Ready to Send"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Wallet Connection Modal */}
      <WalletConnectModal
        open={walletModalOpen}
        onOpenChange={setWalletModalOpen}
        amount={afriCoinAmount || amount}
        currency="AFRI"
        onSuccess={handleWalletSuccess}
      />
    </>
  );
};
