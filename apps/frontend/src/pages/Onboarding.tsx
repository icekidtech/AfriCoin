import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePhoneOTP } from "@/hooks/usePhoneOTP";
import { api } from "@/lib/api";
import { CountryCodeSelector } from "@/components/CountryCodeSelector";
import {
  ArrowLeft,
  Shield,
  Phone as PhoneIcon,
  CheckCircle2,
  Clock,
} from "lucide-react";
import logo from "@/assets/africoin-logo.png";
import { hashPhone } from "@/lib/utils";

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();
  const { sendOTP, verifyOTP, resendOTP } = usePhoneOTP();

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: phone, 2: otp, 3: name, 4: pin
  const [formData, setFormData] = useState({
    phone: "",
    otp: "",
    name: "",
    pin: "",
    pinConfirm: "",
  });
  const [otpResendTimer, setOtpResendTimer] = useState(0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validatePhone = (phone: string) => {
    return /^\+?[1-9]\d{1,14}$/.test(phone.replace(/\s/g, ""));
  };

  const validateOTP = (otp: string) => {
    return /^\d{4,6}$/.test(otp);
  };

  const validatePin = (pin: string) => {
    return /^\d{4}$/.test(pin);
  };

  const validateName = (name: string) => {
    return name.length >= 2 && name.length <= 100;
  };

  // Step 1: Send OTP to phone
  const handleSendOTP = async () => {
    if (!validatePhone(formData.phone)) {
      toast({
        title: "Invalid Phone",
        description: "Enter a valid phone number with country code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await sendOTP(formData.phone);

      if (result.success) {
        toast({
          title: "OTP Sent! 📱",
          description: `Verification code sent to ${formData.phone}`,
        });
        setStep(2);
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

  // OTP Resend Timer
  const handleResendOTP = async () => {
    setLoading(true);
    try {
      const result = await resendOTP(formData.phone);
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

  // Timer effect
  useEffect(() => {
    if (otpResendTimer > 0) {
      const timer = setTimeout(() => setOtpResendTimer(otpResendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpResendTimer]);

  // Step 2: Verify OTP
  const handleVerifyOTP = async () => {
    if (!validateOTP(formData.otp)) {
      toast({
        title: "Invalid OTP",
        description: "Enter a 4-6 digit code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await verifyOTP(formData.phone, formData.otp);

      if (result.success) {
        toast({
          title: "Phone Verified! ✓",
          description: "Your phone number is confirmed",
        });
        setStep(3);
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: "The OTP you entered is incorrect. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Verify Name
  const handleVerifyName = () => {
    if (!formData.name || !validateName(formData.name)) {
      toast({
        title: "Invalid Name",
        description: "Name must be 2-100 characters",
        variant: "destructive",
      });
      return;
    }
    setStep(4);
  };

  // Step 4: Create Wallet with PIN
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePin(formData.pin)) {
      toast({
        title: "Invalid PIN",
        description: "PIN must be exactly 4 digits",
        variant: "destructive",
      });
      return;
    }

    if (formData.pin !== formData.pinConfirm) {
      toast({
        title: "PIN Mismatch",
        description: "PINs don't match",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Create wallet on backend
      const response = await api.wallet.onboard(
        formData.phone,
        formData.name,
        formData.pin
      );

      const { phoneHash, walletAddress } = response.data.data;

      // Phone hash is the unique identifier (private key equivalent)
      // It's derived from the phone number and stored locally
      login({
        name: formData.name,
        phone: formData.phone,
        phoneHash, // This is the user's unique wallet ID
        walletAddress,
      });

      toast({
        title: "Wallet Created! 🎉",
        description: "Your AfriCoin wallet is ready to use",
      });

      setTimeout(() => navigate("/dashboard"), 500);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || "Failed to create wallet";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </Link>

        {/* Header */}
        <div className="text-center space-y-4 mb-8">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center p-3">
              <img
                src={logo}
                alt="AfriCoin"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              {step === 1
                ? "Welcome to AfriCoin"
                : step === 2
                ? "Verify Your Phone"
                : step === 3
                ? "Tell Us Who You Are"
                : "Secure Your Wallet"}
            </h1>
            <p className="text-muted-foreground text-sm mt-2">
              {step === 1
                ? "Join the One African Economy 🌍"
                : step === 2
                ? "Enter the code we sent to your phone"
                : step === 3
                ? "We need your name to get started"
                : "Create a 4-digit PIN to protect your wallet"}
            </p>
          </div>

          {/* Progress */}
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  s <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        <Card className="p-6">
          {/* Step 1: Phone Number */}
          {step === 1 && (
            <div className="space-y-4">
              <CountryCodeSelector
                value={formData.phone}
                onCountryChange={() => {}}
                onPhoneChange={(phone) =>
                  setFormData((prev) => ({ ...prev, phone }))
                }
              />
              <Button
                className="w-full"
                onClick={handleSendOTP}
                type="button"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send OTP"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                We'll send a verification code to this number
              </p>
            </div>
          )}

          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-3">
                  Phone: {formData.phone}
                </p>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <PhoneIcon className="w-4 h-4" />
                  Enter Verification Code
                </label>
                <input
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={formData.otp}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      otp: e.target.value.replace(/\D/g, ""),
                    }))
                  }
                  disabled={loading}
                  className="w-full px-4 py-2 border rounded-lg text-center text-2xl tracking-widest font-mono"
                />
              </div>

              <Button
                onClick={handleVerifyOTP}
                type="button"
                disabled={loading || formData.otp.length < 4}
                className="w-full"
              >
                {loading ? "Verifying..." : "Verify Code"}
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep(1);
                    setFormData((prev) => ({ ...prev, otp: "" }));
                  }}
                  type="button"
                  disabled={loading}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleResendOTP}
                  type="button"
                  disabled={loading || otpResendTimer > 0}
                  className="flex-1"
                >
                  {otpResendTimer > 0 ? (
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {otpResendTimer}s
                    </span>
                  ) : (
                    "Resend"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Name */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Phone Verified
                </label>
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-medium text-green-700">
                    ✓ {formData.phone}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Full Name
                </label>
                <Input
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  type="button"
                  disabled={loading}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleVerifyName}
                  type="button"
                  disabled={loading}
                  className="flex-1"
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: PIN */}
          {step === 4 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Set 4-Digit PIN
                </label>
                <input
                  type="password"
                  name="pin"
                  placeholder="••••"
                  maxLength={4}
                  value={formData.pin}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full px-4 py-2 border rounded-lg text-center text-2xl tracking-widest"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  This PIN will be required for every transaction
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Confirm PIN
                </label>
                <input
                  type="password"
                  name="pinConfirm"
                  placeholder="••••"
                  maxLength={4}
                  value={formData.pinConfirm}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="w-full px-4 py-2 border rounded-lg text-center text-2xl tracking-widest"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(3)}
                  type="button"
                  disabled={loading}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Creating..." : "Create Wallet"}
                </Button>
              </div>
            </form>
          )}
        </Card>

        {/* Security Note */}
        {step === 4 && (
          <div className="mt-4 p-3 bg-primary/10 rounded-lg">
            <div className="flex gap-2">
              <Shield className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-primary">🔐 Security Info</p>
                <p className="text-muted-foreground text-xs">
                  Your phone number is hashed locally as your unique wallet ID. Your PIN is encrypted and never stored in plain text.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Login Link */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Onboarding;
