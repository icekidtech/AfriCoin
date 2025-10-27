import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ArrowLeft, Shield } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/africoin-logo.png";

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    pin: "",
    confirmPin: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 1) {
      if (!formData.name || !formData.phone) {
        toast({
          title: "Missing Information",
          description: "Please fill in all fields",
          variant: "destructive",
        });
        return;
      }
      toast({ 
        title: "OTP Sent", 
        description: "Check your phone for verification code" 
      });
      setStep(2);
    } else if (step === 2) {
      if (otp.length !== 6) {
        toast({ 
          title: "Invalid OTP", 
          description: "Please enter the 6-digit code",
          variant: "destructive"
        });
        return;
      }
      toast({ 
        title: "Phone Verified", 
        description: "Now set up your secure PIN" 
      });
      setStep(3);
    } else if (step === 3) {
      if (formData.pin.length !== 4) {
        toast({
          title: "Invalid PIN",
          description: "PIN must be 4 digits",
          variant: "destructive",
        });
        return;
      }
      if (formData.pin !== formData.confirmPin) {
        toast({
          title: "PIN Mismatch",
          description: "PINs do not match",
          variant: "destructive",
        });
        return;
      }

      // Simulate wallet creation
      toast({
        title: "Welcome to AfriCoin! 🎉",
        description: "Your wallet has been created successfully",
      });

      // Store mock auth
      localStorage.setItem("africoin_user", JSON.stringify({ name: formData.name, phone: formData.phone }));
      
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 animate-scale-in">
        {/* Back Button - Positioned Absolutely */}
        <Link to="/" className="absolute top-4 left-4 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </Link>

        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-glow p-3">
              <img src={logo} alt="AfriCoin" className="w-full h-full object-contain" />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold">
            {step === 1 ? "Welcome to AfriCoin" : step === 2 ? "Verify Your Phone" : "Secure Your Wallet"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {step === 1 
              ? "Join the One African Economy 🌍" 
              : step === 2
              ? "Enter the verification code sent to your phone"
              : "Create a 4-digit PIN to protect your wallet"}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex gap-2 justify-center">
          <div className={`h-1 w-12 rounded-full transition-all ${step >= 1 ? "bg-primary" : "bg-muted"}`}></div>
          <div className={`h-1 w-12 rounded-full transition-all ${step >= 2 ? "bg-primary" : "bg-muted"}`}></div>
          <div className={`h-1 w-12 rounded-full transition-all ${step >= 3 ? "bg-primary" : "bg-muted"}`}></div>
        </div>

        {/* Form Card */}
        <Card className="p-6 shadow-medium border-0">
          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+254 700 123 456"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="h-12"
                  />
                  <p className="text-xs text-muted-foreground">Include country code (e.g., +254 for Kenya)</p>
                </div>
              </>
            ) : step === 2 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  <span>Enter code sent to {formData.phone}</span>
                </div>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => toast({ title: "OTP Resent", description: "Check your phone" })}
                >
                  Resend OTP
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="pin" className="block text-center">Create 4-Digit PIN</Label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={4}
                      value={formData.pin}
                      onChange={(value) => setFormData({ ...formData, pin: value })}
                    >
                      <InputOTPGroup className="gap-3">
                        <InputOTPSlot index={0} className="w-14 h-14 text-lg" />
                        <InputOTPSlot index={1} className="w-14 h-14 text-lg" />
                        <InputOTPSlot index={2} className="w-14 h-14 text-lg" />
                        <InputOTPSlot index={3} className="w-14 h-14 text-lg" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">This PIN will secure all your transactions</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPin" className="block text-center">Confirm PIN</Label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={4}
                      value={formData.confirmPin}
                      onChange={(value) => setFormData({ ...formData, confirmPin: value })}
                    >
                      <InputOTPGroup className="gap-3">
                        <InputOTPSlot index={0} className="w-14 h-14 text-lg" />
                        <InputOTPSlot index={1} className="w-14 h-14 text-lg" />
                        <InputOTPSlot index={2} className="w-14 h-14 text-lg" />
                        <InputOTPSlot index={3} className="w-14 h-14 text-lg" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>
              </>
            )}

            <Button type="submit" className="w-full h-12 gradient-primary text-white font-semibold shadow-medium hover:shadow-strong transition-smooth">
              {step === 1 ? "Continue" : step === 2 ? "Verify OTP" : "Create Wallet"}
            </Button>
          </form>
        </Card>

        {/* Security Note */}
        {step === 3 && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-success/10 border border-success/20">
            <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs">✓</span>
            </div>
            <div className="text-sm">
              <p className="font-medium text-success">Bank-Level Security</p>
              <p className="text-muted-foreground">Your PIN is encrypted and never stored in plain text</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
