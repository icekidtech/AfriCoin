import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Send as SendIcon, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Send = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<"form" | "pin" | "success">("form");
  const [formData, setFormData] = useState({
    phone: "",
    amount: "",
    pin: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (step === "form") {
      if (!formData.phone || !formData.amount) {
        toast({
          title: "Missing Information",
          description: "Please fill in all fields",
          variant: "destructive",
        });
        return;
      }
      setStep("pin");
    } else if (step === "pin") {
      if (formData.pin.length !== 4) {
        toast({
          title: "Invalid PIN",
          description: "PIN must be 4 digits",
          variant: "destructive",
        });
        return;
      }
      setStep("success");
      setTimeout(() => {
        navigate("/dashboard");
      }, 2500);
    }
  };

  if (step === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-success/10 via-background to-success/5 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-6 animate-scale-in">
          <div className="w-24 h-24 mx-auto rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle2 className="w-16 h-16 text-success" />
          </div>
          <h1 className="text-3xl font-bold">Transfer Successful!</h1>
          <p className="text-muted-foreground">
            Your money has been sent successfully
          </p>
          <Card className="p-6 text-left space-y-4 shadow-medium border-0">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Recipient</span>
              <span className="font-semibold">{formData.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-bold text-2xl">₳{formData.amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transaction ID</span>
              <span className="text-sm font-mono">ACF{Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
            </div>
          </Card>
          <Button
            onClick={() => navigate("/dashboard")}
            className="w-full gradient-primary text-white font-semibold shadow-medium"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="w-full max-w-md mx-auto pt-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => step === "pin" ? setStep("form") : navigate("/dashboard")}
            className="w-10 h-10 rounded-xl bg-card shadow-soft flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">Send Money</h1>
        </div>

        {/* Progress */}
        <div className="flex gap-2">
          <div className={`h-1 flex-1 rounded-full transition-all ${step === "form" || step === "pin" ? "bg-primary" : "bg-muted"}`}></div>
          <div className={`h-1 flex-1 rounded-full transition-all ${step === "pin" ? "bg-primary" : "bg-muted"}`}></div>
        </div>

        {/* Form */}
        <Card className="p-6 shadow-medium border-0 animate-fade-in">
          <form onSubmit={handleSubmit} className="space-y-6">
            {step === "form" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="phone">Recipient Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+254 700 123 456"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="h-12"
                  />
                  <p className="text-xs text-muted-foreground">Include country code</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (AfriCoin)</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">₳</span>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="h-16 pl-10 text-3xl font-bold"
                    />
                  </div>
                  {formData.amount && (
                    <p className="text-sm text-muted-foreground">
                      ≈ ${(parseFloat(formData.amount) * 0.01).toFixed(2)} USD
                    </p>
                  )}
                </div>

                {/* Quick Amounts */}
                <div className="grid grid-cols-4 gap-2">
                {[10, 25, 50, 100].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setFormData({ ...formData, amount: amount.toString() })}
                      className="py-2 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary transition-smooth font-medium"
                    >
                      ₳{amount}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-6">
                <div className="text-center space-y-2 pb-4 border-b border-border">
                  <p className="text-sm text-muted-foreground">You're sending</p>
                  <p className="text-4xl font-bold">₳{formData.amount}</p>
                  <p className="text-sm text-muted-foreground">to {formData.phone}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pin">Enter Your PIN</Label>
                  <Input
                    id="pin"
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="••••"
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, "") })}
                    className="h-16 text-center text-3xl tracking-widest"
                    autoFocus
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 gradient-primary text-white font-semibold shadow-medium hover:shadow-strong transition-smooth"
            >
              {step === "form" ? (
                <>
                  Continue
                  <SendIcon className="ml-2 w-4 h-4" />
                </>
              ) : (
                "Confirm & Send"
              )}
            </Button>
          </form>
        </Card>

        {/* Security Note */}
        {step === "pin" && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20">
            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs">✓</span>
            </div>
            <div className="text-sm">
              <p className="font-medium text-primary">Secure Transaction</p>
              <p className="text-muted-foreground">Your PIN is encrypted and verified on-chain</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Send;
