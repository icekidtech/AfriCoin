import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Send as SendIcon, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { CountryCodeSelector } from "@/components/CountryCodeSelector";
import { api } from "@/lib/api";

const Send = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState("0");
  const [formData, setFormData] = useState({
    recipientPhone: "",
    amount: "",
    pin: "",
  });

  useEffect(() => {
    const loadBalance = async () => {
      if (!user?.phoneHash) return;
      try {
        const response = await api.wallet.getBalance(user.phoneHash);
        const balanceInWei = response.data.data.balance;
        const balanceInAfri = (BigInt(balanceInWei) / BigInt(10) ** BigInt(18)).toString();
        setBalance(balanceInAfri);
      } catch (error) {
        console.error("Failed to load balance:", error);
      }
    };

    loadBalance();
  }, [user?.phoneHash]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateAmount = (amount: string) => {
    try {
      return BigInt(amount) > 0n;
    } catch {
      return false;
    }
  };

  const handleReviewSubmit = () => {
    if (!formData.recipientPhone || formData.recipientPhone.length < 10) {
      toast({
        title: "Invalid Phone",
        description: "Enter a valid recipient phone number",
        variant: "destructive",
      });
      return;
    }

    if (!formData.amount || !validateAmount(formData.amount)) {
      toast({
        title: "Invalid Amount",
        description: "Enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    const amountBig = BigInt(formData.amount) * BigInt(10) ** BigInt(18);
    const userBalance = BigInt(balance) * BigInt(10) ** BigInt(18);

    if (amountBig > userBalance) {
      toast({
        title: "Insufficient Balance",
        description: `You only have ${balance} AFRI`,
        variant: "destructive",
      });
      return;
    }

    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^\d{4}$/.test(formData.pin)) {
      toast({
        title: "Invalid PIN",
        description: "PIN must be 4 digits",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const amountInWei = (BigInt(formData.amount) * BigInt(10) ** BigInt(18)).toString();
      const response = await api.transfer.send(
        user!.phoneHash,
        formData.recipientPhone,
        amountInWei,
        formData.pin
      );

      toast({
        title: "Transfer Successful! ✓",
        description: `${formData.amount} AFRI sent to ${formData.recipientPhone}`,
      });

      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (error: any) {
      toast({
        title: "Transfer Failed",
        description: error.response?.data?.error || "Failed to send money",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/10 to-background border-b border-border sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold">Send Money</h1>
          </div>

          {/* Balance Info */}
          <Card className="p-4 bg-primary/5">
            <p className="text-sm text-muted-foreground">Available Balance</p>
            <p className="text-2xl font-bold">{balance} AFRI</p>
          </Card>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card className="p-6">
          <form onSubmit={handleSubmit}>
            {step === 1 ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Recipient Phone Number
                  </label>
                  <CountryCodeSelector
                    value={formData.recipientPhone}
                    onCountryChange={() => {}}
                    onPhoneChange={(phone) =>
                      setFormData((prev) => ({ ...prev, recipientPhone: phone }))
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Amount (AFRI)
                  </label>
                  <Input
                    type="number"
                    name="amount"
                    placeholder="0.00"
                    step="0.01"
                    value={formData.amount}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={handleReviewSubmit}
                  type="button"
                  disabled={loading}
                >
                  Review Transfer
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Review Details */}
                <div className="bg-muted p-4 rounded-lg space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">To:</span>
                    <span className="font-medium">{formData.recipientPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-medium">{formData.amount} AFRI</span>
                  </div>
                </div>

                {/* PIN Confirmation */}
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Enter PIN to Confirm
                  </label>
                  <input
                    type="password"
                    placeholder="••••"
                    maxLength={4}
                    value={formData.pin}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        pin: e.target.value.replace(/\D/g, ""),
                      }))
                    }
                    disabled={loading}
                    className="w-full px-4 py-2 border rounded-lg text-center text-2xl tracking-widest"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    type="button"
                    disabled={loading}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {loading ? "Sending..." : "Confirm & Send"}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Send;
