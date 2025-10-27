import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReceiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phone: string;
}

export const ReceiveDialog = ({ open, onOpenChange, phone }: ReceiveDialogProps) => {
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(phone);
    toast({ title: "Copied!", description: "Phone number copied to clipboard" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Receive Africoin</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex flex-col items-center gap-4">
            <div className="w-48 h-48 bg-muted rounded-xl flex items-center justify-center">
              <QrCode className="w-24 h-24 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Share your phone number to receive Africoin
            </p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Phone Number</label>
            <div className="flex gap-2">
              <div className="flex-1 p-3 bg-muted rounded-lg font-mono">
                {phone}
              </div>
              <Button size="icon" variant="outline" onClick={handleCopy}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
