import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Phone, Shield } from "lucide-react";
import logo from "@/assets/africoin-logo.png";

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      toast({ 
        title: "Invalid Phone Number", 
        description: "Please enter a valid phone number",
        variant: "destructive"
      });
      return;
    }
    // Simulate sending OTP
    toast({ 
      title: "OTP Sent", 
      description: "Check your phone for verification code" 
    });
    setStep("otp");
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast({ 
        title: "Invalid OTP", 
        description: "Please enter the 6-digit code",
        variant: "destructive"
      });
      return;
    }
    // Simulate OTP verification
    toast({ title: "Login Successful", description: "Welcome back!" });
    setTimeout(() => navigate("/dashboard"), 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => step === "otp" ? setStep("phone") : navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src={logo} alt="AfriCoin" className="w-12 h-12" />
            <h1 className="text-3xl font-bold">AfriCoin</h1>
          </div>
          <h2 className="text-2xl font-bold">Welcome Back</h2>
          <p className="text-muted-foreground">
            {step === "phone" ? "Enter your phone number to log in" : "Enter the verification code"}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex gap-2 justify-center">
          <div className={`h-1 w-16 rounded-full ${step === "phone" ? "bg-primary" : "bg-primary/50"}`} />
          <div className={`h-1 w-16 rounded-full ${step === "otp" ? "bg-primary" : "bg-muted"}`} />
        </div>

        {/* Form Card */}
        <Card className="p-6">
          {step === "phone" ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder="+254 712 345 678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" size="lg">
                Send OTP
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  <span>Enter 6-digit code sent to {phone}</span>
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
              </div>
              <Button type="submit" className="w-full" size="lg">
                Verify & Login
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full"
                onClick={() => toast({ title: "OTP Resent", description: "Check your phone" })}
              >
                Resend OTP
              </Button>
            </form>
          )}
        </Card>

        {/* Footer Note */}
        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <button 
            onClick={() => navigate("/onboarding")}
            className="text-primary hover:underline font-medium"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}
