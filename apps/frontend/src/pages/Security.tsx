import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Lock, Fingerprint, Shield, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Security = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const handleChangePIN = () => {
    if (newPin.length !== 4) {
      toast({
        title: "Invalid PIN",
        description: "PIN must be 4 digits",
        variant: "destructive",
      });
      return;
    }
    if (newPin !== confirmPin) {
      toast({
        title: "PINs don't match",
        description: "Please make sure both PINs are the same",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "PIN Changed",
      description: "Your PIN has been updated successfully",
    });
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
  };

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-10 h-10 rounded-xl hover:bg-muted flex items-center justify-center transition-smooth"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Security & PIN</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        {/* Security Status */}
        <Card className="p-6 bg-success/5 border-success/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-success" />
            </div>
            <div>
              <h3 className="font-semibold text-success mb-1">Account Secured</h3>
              <p className="text-sm text-muted-foreground">
                Your account is protected with PIN and biometric authentication
              </p>
            </div>
          </div>
        </Card>

        {/* Change PIN */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Change PIN</h2>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentPin">Current PIN</Label>
            <Input
              id="currentPin"
              type="password"
              maxLength={4}
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPin">New PIN</Label>
            <Input
              id="newPin"
              type="password"
              maxLength={4}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPin">Confirm New PIN</Label>
            <Input
              id="confirmPin"
              type="password"
              maxLength={4}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
            />
          </div>

          <Button onClick={handleChangePIN} className="w-full gradient-primary text-white">
            Update PIN
          </Button>
        </Card>

        {/* Security Options */}
        <Card className="p-6 space-y-6">
          <h2 className="text-lg font-semibold mb-4">Security Options</h2>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Fingerprint className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">Biometric Login</p>
                <p className="text-sm text-muted-foreground">Use fingerprint or face ID</p>
              </div>
            </div>
            <Switch checked={biometricEnabled} onCheckedChange={setBiometricEnabled} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Extra security layer via SMS</p>
              </div>
            </div>
            <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
          </div>
        </Card>

        {/* Security Tips */}
        <Card className="p-6 bg-muted/50">
          <h3 className="font-semibold mb-3">Security Tips</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Never share your PIN with anyone</li>
            <li>• Use a unique PIN that's hard to guess</li>
            <li>• Enable biometric authentication for faster access</li>
            <li>• Change your PIN regularly</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default Security;
