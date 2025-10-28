import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePhoneOTP } from "@/hooks/usePhoneOTP";
import { CountryCodeSelector } from "@/components/CountryCodeSelector";
import { api } from "@/lib/api";
import { ArrowLeft, Lock, Clock, CheckCircle2 } from "lucide-react";
import logo from "@/assets/africoin-logo.png";
import { hashPhone } from "@/lib/utils";

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();
  const { sendOTP, verifyOTP, resendOTP } = usePhoneOTP();

  const [step, setStep] = useState<"phone" | "otp" | "pin">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpResendTimer, setOtpResendTimer] = useState(0);

  // OTP Resend Timer
  useEffect(() => {
    if (otpResendTimer > 0) {
      const timer = setTimeout(() => setOtpResendTimer(otpResendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpResendTimer]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phone || phone.length < 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number with country code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await sendOTP(phone);

      if (result.success) {
        toast({
          title: "OTP Sent! 📱",
          description: `Verification code sent to ${phone}`,
        });
        setStep("otp");
        setOtpResendTimer(60);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send OTP",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^\d{4,6}$/.test(otp)) {
      toast({
        title: "Invalid OTP",
        description: "Enter a 4-6 digit code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await verifyOTP(phone, otp);

      if (result.success) {
        setStep("pin");
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "The OTP is incorrect",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^\d{4}$/.test(pin)) {
      toast({
        title: "Invalid PIN",
        description: "PIN must be 4 digits",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Hash the phone to get phoneHash
      const phoneHash = hashPhone(phone);

      // Verify PIN on backend
      await api.wallet.verifyPin(phoneHash, pin);

      // Get user balance to confirm they exist
      const balanceResponse = await api.wallet.getBalance(phoneHash);

      // Get user name from backend (mock for now)
      const userData = {
        name: "User",
        phone,
        phoneHash, // Hashed phone is the unique wallet ID
        walletAddress: "0x...", // Get from backend if available
      };

      login(userData);

      toast({
        title: "Login Successful! 🎉",
        description: "Welcome back to your wallet",
      });

      setTimeout(() => navigate("/dashboard"), 500);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to login",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    try {
      const result = await resendOTP(phone);
      if (result.success) {
        toast({
          title: "OTP Resent! 📱",
          description: "Check your phone for a new code",
        });
        setOtpResendTimer(60);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (step === "otp") {
                setStep("phone");
                setOtp("");
              } else if (step === "pin") {
                setStep("otp");
                setPin("");
              } else {
                navigate("/");
              }
            }}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src={logo} alt="AfriCoin" className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-bold">Welcome Back</h2>
          <p className="text-muted-foreground">
            {step === "phone"
              ? "Enter your phone number to log in"
              : step === "otp"
              ? "Enter the verification code"
              : "Enter your 4-digit PIN"}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex gap-2 justify-center">
          <div
            className={`h-1 w-12 rounded-full ${
              step !== "phone" ? "bg-primary" : "bg-primary/50"
            }`}
          />
          <div
            className={`h-1 w-12 rounded-full ${
              step === "otp" || step === "pin" ? "bg-primary" : "bg-muted"
            }`}
          />
          <div
            className={`h-1 w-12 rounded-full ${
              step === "pin" ? "bg-primary" : "bg-muted"
            }`}
          />
        </div>

        {/* Form Card */}
        <Card className="p-6">
          {step === "phone" && (
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <CountryCodeSelector
                value={phone}
                onCountryChange={() => {}}
                onPhoneChange={setPhone}
              />

              <Button className="w-full" disabled={loading} type="submit">
                {loading ? "Sending..." : "Send OTP"}
              </Button>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div>
                <p className="text-sm text-muted-foreground mb-3">
                  Phone: {phone}
                </p>
                <label className="text-sm font-medium block mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  disabled={loading}
                  className="w-full px-4 py-2 border rounded-lg text-center text-2xl tracking-widest font-mono"
                />
              </div>

              <Button
                className="w-full"
                disabled={loading || otp.length < 4}
                type="submit"
              >
                {loading ? "Verifying..." : "Verify Code"}
              </Button>

              <Button
                variant="ghost"
                onClick={handleResendOTP}
                disabled={loading || otpResendTimer > 0}
                className="w-full"
                type="button"
              >
                {otpResendTimer > 0 ? (
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Resend in {otpResendTimer}s
                  </span>
                ) : (
                  "Resend Code"
                )}
              </Button>
            </form>
          )}

          {step === "pin" && (
            <form onSubmit={handlePinSubmit} className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-700">
                    {phone} verified
                  </span>
                </div>

                <label className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Lock className="w-4 h-4" />
                  Enter PIN
                </label>
                <input
                  type="password"
                  placeholder="••••"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  disabled={loading}
                  className="w-full px-4 py-2 border rounded-lg text-center text-2xl tracking-widest"
                />
              </div>

              <Button
                className="w-full"
                disabled={loading || pin.length !== 4}
                type="submit"
              >
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>
          )}
        </Card>

        {/* Sign Up Link */}
        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link
            to="/onboarding"
            className="text-primary hover:underline font-medium"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
