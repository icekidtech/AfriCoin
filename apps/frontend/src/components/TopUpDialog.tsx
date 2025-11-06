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
import { useAvailableCrypto } from "@/hooks/useAvailableCrypto";
import { useCryptoDeposit } from "@/hooks/useCryptoDeposit";
import { ethers } from "ethers";
import { AFRICOIN_ADDRESS } from "@/config/contracts";

interface TopUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TopUpDialog = ({ open, onOpenChange }: TopUpDialogProps) => {
  const { toast } = useToast();
  const { user, account } = useAuth();
  const { convertToAfriCoin, getConversionRate, loading: priceLoading } =
    useMockOracle();
  const { fundViaWallet, fundViaBackend: fundViaBackendHook, loading: fundingLoading } =
    useWalletFunding();
  const { fundUserAccount, loading: contractLoading } = useAfriCoinContract();
  const { availableCryptos, checkAvailableCrypto, loading: cryptoLoading } = useAvailableCrypto();
  const { depositCrypto, loading: depositLoading } = useCryptoDeposit();

  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [currency, setCurrency] = useState("KES");
  const [fundingMethod, setFundingMethod] = useState<
    "mobileMoneyMoney" | "bankTransfer" | "crypto"
  >("mobileMoneyMoney");
  const [selectedCrypto, setSelectedCrypto] = useState<string>('ETH');  // ADD THIS LINE
  const [conversionRate, setConversionRate] = useState<string | null>(null);
  const [afriCoinAmount, setAfriCoinAmount] = useState<string | null>(null);
  const [showConversionDetails, setShowConversionDetails] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [showWalletConnect, setShowWalletConnect] = useState(false);
  const [connectedDepositWallet, setConnectedDepositWallet] = useState<string | null>(null);

  const quickAmounts = [100, 500, 1000, 2000];
  const loading = priceLoading || fundingLoading || contractLoading || cryptoLoading || depositLoading;

  /**
   * Check available cryptos when crypto method is selected
   */
  useEffect(() => {
    if (fundingMethod === "crypto" && account) {
      const checkCryptos = async () => {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          await checkAvailableCrypto(account, provider);
        } catch (err) {
          console.error("Error checking available cryptos:", err);
          toast({
            title: "Error",
            description: "Failed to check available cryptocurrencies",
            variant: "destructive",
          });
        }
      };
      checkCryptos();
    }
  }, [fundingMethod, account]);

  /**
   * Update selected crypto when available cryptos change
   */
  useEffect(() => {
    // ✅ Better null/undefined check
    if (availableCryptos?.length > 0) {
      if (!availableCryptos.find(c => c.symbol === selectedCrypto)) {
        setSelectedCrypto(availableCryptos[0].symbol);
      }
    }
  }, [availableCryptos, selectedCrypto]);

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

  const fundViaBackend = async (
    amount: string,
    phoneHash: string,
    method: "mobileMoney" | "bankTransfer",
    currency: string
  ) => {
    // Use the hook's fundViaBackend function
    await fundViaBackendHook(amount, phoneHash, method, currency);
  };

  /**
   * Handle crypto deposit flow
   */
  const handleCryptoDeposit = async () => {
    if (!amount || !selectedCrypto) {
      toast({
        title: "Missing Information",
        description: "Please select a cryptocurrency and enter an amount",
        variant: "destructive",
      });
      return;
    }

    // ✅ STEP 1: Require wallet connection first
    if (!connectedDepositWallet) {
      setShowWalletConnect(true);
      return;
    }

    // ✅ STEP 2: Proceed with deposit (user already connected)
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask not detected");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();

      // Verify connected wallet matches
      if (signerAddress.toLowerCase() !== connectedDepositWallet.toLowerCase()) {
        throw new Error("Connected wallet does not match. Please reconnect.");
      }

      if (selectedCrypto === 'ETH') {
        const amountWei = ethers.parseEther(amount);

        // Validate amount before sending
        const balance = await provider.getBalance(signerAddress);
        
        if (balance < amountWei) {
          throw new Error(`Insufficient ETH balance. You have ${ethers.formatEther(balance)} ETH`);
        }

        // Use depositCrypto hook instead of raw sendTransaction
        // This ensures proper handling and error detection
        const result = await depositCrypto(
          'ETH',
          amount,
          signer,
          AFRICOIN_ADDRESS
        );

        handleWalletSuccess(result.txHash);
      } else {
        // For ERC20 tokens, use the existing depositCrypto logic
        const result = await depositCrypto(
          selectedCrypto,
          amount,
          signer,
          AFRICOIN_ADDRESS
        );

        toast({
          title: "Success",
          description: `Sent ${amount} ${selectedCrypto}. TX: ${result.txHash.slice(0, 10)}...`,
        });
      }

      onOpenChange(false);
      setAmount("");
      setSelectedCrypto('ETH');
    } catch (error) {
      console.error("Crypto deposit error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to deposit crypto",
        variant: "destructive",
      });
    }
  };

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
        await handleCryptoDeposit();
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

      // ✅ ADD THIS: Wait a bit for backend to process, then refresh balance
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Refresh balance by reloading from API
      try {
        const balanceResponse = await api.wallet.getBalance(user?.phoneHash);
        const newBalance = balanceResponse.data.data.balance;
        console.log("✅ Updated balance:", newBalance);
        
        // Force re-render by dispatching an event or calling a refresh function
        window.dispatchEvent(new Event('balance-updated'));
      } catch (balanceErr) {
        console.error("Failed to refresh balance:", balanceErr);
      }

      setWalletModalOpen(false);
      onOpenChange(false);
      setAmount("");
      setFundingMethod("mobileMoneyMoney");
    } catch (err) {
      console.error("Failed to record transaction:", err);
      toast({
        title: "Warning",
        description: "Transaction may have succeeded but failed to record",
        variant: "destructive",
      });
    }
  };

  const handleWalletConnected = (walletAddress: string) => {
    setConnectedDepositWallet(walletAddress);
    setShowWalletConnect(false);
    // Wallet is now connected, user can proceed
    toast({
      title: "Wallet Connected",
      description: `Connected: ${walletAddress.slice(0, 10)}...`,
    });
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
              <div className="space-y-4 pt-4 border-t">
                {/* Available Cryptos */}
                {availableCryptos.length > 0 && (
                  <div className="space-y-2">
                    <Label>Select Cryptocurrency</Label>
                    {availableCryptos.map((crypto) => (
                      <Card
                        key={crypto.symbol}
                        className={`p-3 cursor-pointer transition-all ${
                          selectedCrypto === crypto.symbol ? 'border-primary bg-primary/5' : ''
                        }`}
                        onClick={() => setSelectedCrypto(crypto.symbol)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{crypto.symbol}</p>
                            <p className="text-xs text-muted-foreground">
                              Balance: {parseFloat(crypto.balance).toFixed(6)} {crypto.symbol}
                            </p>
                          </div>
                          <input
                            type="radio"
                            checked={selectedCrypto === crypto.symbol}
                            onChange={() => setSelectedCrypto(crypto.symbol)}
                          />
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {availableCryptos.length === 0 && !cryptoLoading && (
                  <Card className="bg-amber-50 border-amber-200 p-3">
                    <p className="text-sm text-amber-900">
                      No supported cryptocurrencies found. Please connect your wallet and make sure you have ETH, USDC, USDT, DAI, WETH, CBETH, or EURC.
                    </p>
                  </Card>
                )}

                <div>
                  <Label>Amount of {selectedCrypto} to Deposit</Label>
                  <Input
                    type="number"
                    placeholder="0.001"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    step="0.0001"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    You will receive approximately {afriCoinAmount} AFRI
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-sm space-y-2">
                  <p className="font-semibold text-blue-900">Deposit Details:</p>
                  <p>Send {amount} {selectedCrypto} to our contract</p>
                  <p className="text-xs">
                    Contract: {AFRICOIN_ADDRESS.slice(0, 10)}...
                  </p>
                </div>

                <Button
                  onClick={handleCryptoDeposit}
                  disabled={!amount || loading || !selectedCrypto}
                  className="w-full"
                >
                  {loading ? "Processing..." : "Send Crypto"}
                </Button>
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
      {showWalletConnect && (
        <WalletConnectModal
          open={showWalletConnect}
          onOpenChange={setShowWalletConnect}
          onConnected={handleWalletConnected}
        />
      )}

      {/* Crypto deposit section */}
      {fundingMethod === "wallet" && (
        <div className="space-y-3">
          {connectedDepositWallet && (
            <Card className="p-3 bg-green-50 border-green-200">
              <p className="text-sm text-green-700">
                ✅ Connected: {connectedDepositWallet.slice(0, 10)}...{connectedDepositWallet.slice(-8)}
              </p>
            </Card>
          )}
          <Button 
            onClick={handleCryptoDeposit}
            disabled={!amount || !selectedCrypto || !connectedDepositWallet}
          >
            {!connectedDepositWallet ? "Connect Wallet First" : "Confirm Deposit"}
          </Button>
        </div>
      )}
    </>
  );
};
