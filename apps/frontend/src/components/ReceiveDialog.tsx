import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { QRCodeCanvas as QRCode } from "qrcode.react";
import { useRef } from "react";

interface ReceiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phone: string;
}

export const ReceiveDialog = ({ open, onOpenChange, phone }: ReceiveDialogProps) => {
  const { toast } = useToast();
  const qrRef = useRef<HTMLDivElement>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(phone);
    toast({ 
      title: "Copied!", 
      description: "Phone number copied to clipboard" 
    });
  };

  const handleDownloadQR = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (canvas) {
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `africoin-receive-${phone}.png`;
      link.click();
      toast({
        title: "Downloaded",
        description: "QR code saved to your device"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Receive Africoin</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* QR Code Section */}
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground text-center">
              Share this QR code or phone number to receive AfriCoin
            </p>
            <div 
              ref={qrRef}
              className="w-48 h-48 bg-white rounded-xl flex items-center justify-center p-2 border-2 border-primary"
            >
              <QRCode 
                value={phone} 
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>
          </div>

          {/* Phone Number Display */}
          <div className="space-y-3">
            <label className="text-sm font-semibold">Your Phone Number</label>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <input
                type="text"
                value={phone}
                readOnly
                className="flex-1 bg-transparent text-center font-mono font-semibold border-none outline-none"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="flex-shrink-0"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Your QR code never expires as long as your phone number remains unchanged
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleDownloadQR}
              className="flex-1 gap-2"
            >
              <QrCode className="w-4 h-4" />
              Download QR
            </Button>
            <Button
              onClick={handleCopy}
              className="flex-1"
            >
              Copy Number
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
