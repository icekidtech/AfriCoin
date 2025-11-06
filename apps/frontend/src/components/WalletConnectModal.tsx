import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { ethers } from "ethers";
import { useToast } from "@/hooks/use-toast";
import { useWalletFunding } from "@/hooks/useWalletFunding";
import { useAvailableCrypto } from '@/hooks/useAvailableCrypto';
import { CONTRACTS } from "@/config/contracts";

interface WalletConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: string;
  currency: string;
  onSuccess?: (txHash: string) => void;
}

export const WalletConnectModal = ({
  open,
  onOpenChange,
  amount,
  currency,
  onSuccess,
}: WalletConnectModalProps) => {
  const { toast } = useToast();
  const { fundViaWallet, loading } = useWalletFunding();
  const { availableCryptos, checkAvailableCrypto } = useAvailableCrypto();

  const [step, setStep] = useState<"connect" | "confirm" | "signing" | "success">("connect");
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState<string>('ETH');

  /**
   * Connect to MetaMask or Web3 wallet
   */
  const handleConnect = async () => {
    // Prevent multiple simultaneous requests
    if (isConnecting) return;
    
    try {
      setIsConnecting(true);  // Set before request
      setError(null);

      if (!window.ethereum) {
        setError("MetaMask not detected. Please install MetaMask to continue.");
        toast({
          title: "Wallet Not Found",
          description: "Please install MetaMask or another Web3 wallet",
          variant: "destructive",
        });
        return;
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        setError("No accounts found. Please enable your wallet.");
        return;
      }

      const connectedAccount = accounts[0];
      setAccount(connectedAccount);

      // Check network
      const chainId = await window.ethereum.request({
        method: "eth_chainId",
      });

      if (chainId !== "0x14a34" && chainId !== 84532) {
        // 0x14a34 is hex for 84532 (Base Sepolia)
        toast({
          title: "Wrong Network",
          description:
            "Please switch to Base Sepolia testnet in your wallet",
          variant: "destructive",
        });
        setError("Please switch to Base Sepolia network");
        return;
      }

      // Get balance
      const provider = new ethers.BrowserProvider(window.ethereum);
      const balanceWei = await provider.getBalance(connectedAccount);
      const balanceEth = ethers.formatEther(balanceWei);
      setBalance(balanceEth);

      // Check AfriCoin balance
      const signer = await provider.getSigner();
      const afriCoinContract = new ethers.Contract(
        CONTRACTS.afriCoin.address,
        ["function balanceOf(address) view returns (uint256)"],
        signer
      );

      const afriBalance = await afriCoinContract.balanceOf(connectedAccount);
      const formattedAfriBalance = ethers.formatEther(afriBalance);

      console.log(`Connected: ${connectedAccount}`);
      console.log(`ETH Balance: ${balanceEth}`);
      console.log(`AFRI Balance: ${formattedAfriBalance}`);

      // Check available cryptos
      const available = await checkAvailableCrypto(connectedAccount, provider);
      
      if (available.length === 0) {
        toast({
          title: "No Balance",
          description: "You don't have any supported cryptocurrencies to deposit",
          variant: "destructive",
        });
        return;
      }

      // Move to confirmation step
      setStep("confirm");
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to connect wallet";
      setError(errorMsg);
      console.error("Connection error:", err);
    } finally {
      setIsConnecting(false);  // Reset after request completes
    }
  };

  /**
   * Confirm and send transaction
   */
  const handleConfirm = async () => {
    try {
      setError(null);
      setStep("signing");

      if (!account) {
        setError("Wallet not connected");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Call fundViaWallet hook
      const result = await fundViaWallet(amount, account, signer);

      setTxHash(result.txHash);
      setStep("success");

      toast({
        title: "Transaction Confirmed",
        description: `Transaction hash: ${result.txHash}`,
      });

      // Call success callback
      if (onSuccess) {
        onSuccess(result.txHash);
      }

      // Close modal after 3 seconds
      setTimeout(() => {
        onOpenChange(false);
        setStep("connect");
        setAccount(null);
        setBalance(null);
        setTxHash(null);
      }, 3000);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Transaction failed";
      setError(errorMsg);
      setStep("confirm");

      toast({
        title: "Transaction Failed",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  /**
   * Switch network to Base Sepolia
   */
  const handleSwitchNetwork = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x14a34" }], // Base Sepolia
      });
    } catch (err: any) {
      if (err.code === 4902) {
        // Chain not added, try to add it
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x14a34",
                chainName: "Base Sepolia Testnet",
                rpcUrls: [import.meta.env.VITE_BASE_SEPOLIA_RPC || "https://sepolia.base.org"],
                nativeCurrency: {
                  name: "Ethereum",
                  symbol: "ETH",
                  decimals: 18,
                },
                blockExplorerUrls: ["https://sepolia.basescan.org"],
              },
            ],
          });
        } catch (addError) {
          console.error("Failed to add network:", addError);
        }
      }
    }
  };

  /**
   * Handle successful connection and deposit
   */
  const handleSuccess = async () => {
    try {
      // Save the connected wallet to backend
      const response = await fetch('/api/wallet/connect-deposit-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneHash: user?.phoneHash,
          depositWalletAddress: account, // The connected MetaMask address
        }),
      });

      if (!response.ok) throw new Error('Failed to save wallet');

      const data = await response.json();
      console.log('✅ Deposit wallet connected:', data);
      
      // Now proceed with deposit
      setStep('success');
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setError('Failed to save wallet connection');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Fund Wallet with Crypto</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-6">
          {/* Step: Connect */}
          {step === "connect" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connect your Web3 wallet to send AfriCoin to your account.
              </p>

              {error && (
                <Card className="bg-destructive/10 border-destructive/20 p-3 flex gap-2">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </Card>
              )}

              <Button
                onClick={handleConnect}
                className="w-full"
                size="lg"
                disabled={loading || isConnecting}  // Also disable on isConnecting
              >
                {loading || isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect MetaMask"
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                MetaMask, WalletConnect, and other Web3 wallets supported
              </p>
            </div>
          )}

          {/* Step: Confirm */}
          {step === "confirm" && (
            <div className="space-y-4">
              {/* Wallet Info */}
              <Card className="bg-primary/5 border-primary/20 p-4 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Connected Wallet</p>
                  <p className="font-mono text-sm break-all">{account}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">ETH Balance</p>
                    <p className="font-semibold">{balance ? parseFloat(balance).toFixed(4) : "0"} ETH</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Network</p>
                    <p className="font-semibold">Base Sepolia</p>
                  </div>
                </div>
              </Card>

              {/* Transaction Details */}
              <Card className="bg-secondary/10 p-4 space-y-2 border-dashed">
                <p className="text-sm font-semibold">Transaction Details</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-mono">{amount} AFRI</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">To:</span>
                    <span className="font-mono text-xs">{account?.slice(0, 10)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contract:</span>
                    <span className="font-mono text-xs">
                      {CONTRACTS.afriCoin.address.slice(0, 10)}...
                    </span>
                  </div>
                </div>
              </Card>

              {error && (
                <Card className="bg-destructive/10 border-destructive/20 p-3 flex gap-2">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                  <p className="text-sm text-destructive">{error}</p>
                </Card>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => {
                    setStep("connect");
                    setAccount(null);
                  }}
                  variant="outline"
                  disabled={loading}
                >
                  Back
                </Button>
                <Button onClick={handleConfirm} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Transaction"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step: Signing */}
          {step === "signing" && (
            <div className="space-y-4 text-center py-4">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
              <div>
                <p className="font-semibold">Confirming Transaction</p>
                <p className="text-sm text-muted-foreground">
                  Please confirm in your wallet
                </p>
              </div>
            </div>
          )}

          {/* Step: Success */}
          {step === "success" && (
            <div className="space-y-4 text-center py-4">
              <div className="flex justify-center">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div>
                <p className="font-semibold">Transaction Sent!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your transaction has been submitted to the blockchain
                </p>
              </div>
              <Card className="bg-green-50 border-green-200 p-3">
                <p className="text-xs text-muted-foreground mb-1">Transaction Hash</p>
                <p className="font-mono text-xs break-all text-green-900">
                  {txHash}
                </p>
              </Card>
              <p className="text-xs text-muted-foreground">
                Modal closing in 3 seconds...
              </p>
            </div>
          )}

          {/* Available Cryptos */}
          {availableCryptos.length > 0 && step === "confirm" && (
            <div className="space-y-3">
              <Label>Select Cryptocurrency to Deposit</Label>
              <div className="space-y-2">
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
                        <p className="text-sm text-muted-foreground">
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
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};