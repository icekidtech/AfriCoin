import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Copy,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TransactionDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: {
    transactionHash: string;
    senderPhone: string;
    recipientPhone: string;
    amount: string;
    status: "pending" | "completed" | "failed";
    type: "send" | "receive" | "mint";
    timestamp: string;
    metadata?: {
      method?: string;
      currency?: string;
      conversionRate?: string;
      fromAddress?: string;
      toAddress?: string;
    };
  };
}

export const TransactionDetailModal = ({
  open,
  onOpenChange,
  transaction,
}: TransactionDetailModalProps) => {
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    });
  };

  const openBlockExplorer = () => {
    const explorerUrl = `https://sepolia.basescan.org/tx/${transaction.transactionHash}`;
    window.open(explorerUrl, "_blank");
  };

  const getStatusIcon = () => {
    switch (transaction.status) {
      case "completed":
        return <CheckCircle2 className="w-8 h-8 text-green-600" />;
      case "pending":
        return <Clock className="w-8 h-8 text-amber-600 animate-spin" />;
      case "failed":
        return <AlertCircle className="w-8 h-8 text-red-600" />;
    }
  };

  const getStatusColor = () => {
    switch (transaction.status) {
      case "completed":
        return "bg-green-50 border-green-200";
      case "pending":
        return "bg-amber-50 border-amber-200";
      case "failed":
        return "bg-red-50 border-red-200";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status Header */}
          <Card className={`p-4 border ${getStatusColor()} flex items-center gap-4`}>
            <div className="flex-shrink-0">{getStatusIcon()}</div>
            <div>
              <p className="font-semibold capitalize">{transaction.status}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(transaction.timestamp).toLocaleString()}
              </p>
            </div>
          </Card>

          {/* Transaction Summary */}
          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-muted-foreground">Type</span>
                <Badge variant="outline" className="capitalize">
                  {transaction.type}
                </Badge>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold text-lg">{transaction.amount} AFRI</span>
              </div>
              <div className="border-t pt-3">
                <span className="text-muted-foreground text-sm">From</span>
                <p className="font-mono text-sm break-all">
                  {transaction.senderPhone}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground text-sm">To</span>
                <p className="font-mono text-sm break-all">
                  {transaction.recipientPhone}
                </p>
              </div>
            </div>
          </Card>

          {/* Transaction Hash */}
          <Card className="p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              Transaction Hash
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-muted p-2 rounded overflow-x-auto">
                {transaction.transactionHash}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  copyToClipboard(transaction.transactionHash, "Hash")
                }
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </Card>

          {/* Wallet Addresses (if available) */}
          {transaction.metadata?.fromAddress && (
            <Card className="p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                Wallet Addresses
              </p>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">From</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-muted p-2 rounded overflow-x-auto">
                      {transaction.metadata.fromAddress}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          transaction.metadata!.fromAddress!,
                          "Address"
                        )
                      }
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">To</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-muted p-2 rounded overflow-x-auto">
                      {transaction.metadata.toAddress}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          transaction.metadata!.toAddress!,
                          "Address"
                        )
                      }
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Metadata */}
          {transaction.metadata && (
            <Card className="p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                Details
              </p>
              <div className="space-y-2 text-sm">
                {transaction.metadata.method && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Method</span>
                    <span className="font-medium">{transaction.metadata.method}</span>
                  </div>
                )}
                {transaction.metadata.currency && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Currency</span>
                    <span className="font-medium">
                      {transaction.metadata.currency}
                    </span>
                  </div>
                )}
                {transaction.metadata.conversionRate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Conversion Rate</span>
                    <span className="font-medium">
                      {transaction.metadata.conversionRate}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => copyToClipboard(JSON.stringify(transaction), "Data")}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Data
            </Button>
            <Button onClick={openBlockExplorer} variant="outline">
              <ExternalLink className="w-4 h-4 mr-2" />
              View on Explorer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};