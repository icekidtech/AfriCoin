import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, Download, TrendingUp } from "lucide-react";
import { useTransactionHistory } from "@/hooks/useTransactionHistory";
import { useAuth } from "@/hooks/useAuth";

export const TransactionHistory = () => {
  const { user } = useAuth();
  const { transactions, loading, error } = useTransactionHistory(
    user?.phoneHash || null
  );

  if (loading) {
    return (
      <Card className="p-6 flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <p>Loading transactions...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center text-destructive">
        <p>Failed to load transactions: {error}</p>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No transactions yet</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="divide-y">
        {transactions.map((tx) => (
          <div key={tx.id} className="p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between gap-3">
              {/* Icon & Details */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    tx.type === "send"
                      ? "bg-red-100"
                      : tx.type === "receive"
                        ? "bg-green-100"
                        : "bg-blue-100"
                  }`}
                >
                  {tx.type === "send" ? (
                    <Send className={`w-5 h-5 ${tx.type === "send" ? "text-red-600" : ""}`} />
                  ) : (
                    <Download
                      className={`w-5 h-5 ${
                        tx.type === "receive" ? "text-green-600" : ""
                      }`}
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm capitalize">
                    {tx.type === "send" ? "Sent to" : "Received from"}{" "}
                    {tx.type === "send"
                      ? tx.recipientPhone
                      : tx.senderPhone}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tx.timestampFormatted}
                  </p>
                </div>
              </div>

              {/* Amount & Status */}
              <div className="text-right flex-shrink-0">
                <p
                  className={`font-semibold ${
                    tx.type === "send"
                      ? "text-red-600"
                      : tx.type === "receive"
                        ? "text-green-600"
                        : ""
                  }`}
                >
                  {tx.type === "send" ? "-" : "+"}
                  {tx.amountFormatted} AFRI
                </p>
                <Badge
                  variant={
                    tx.status === "completed"
                      ? "default"
                      : tx.status === "pending"
                        ? "secondary"
                        : "destructive"
                  }
                  className="text-xs mt-1"
                >
                  {tx.statusLabel}
                </Badge>
              </div>
            </div>

            {/* Metadata */}
            {tx.metadata && (
              <div className="mt-2 ml-13 text-xs text-muted-foreground space-y-1">
                {tx.metadata.method && (
                  <p>
                    <span className="font-semibold">Method:</span>{" "}
                    {tx.metadata.method}
                  </p>
                )}
                {tx.metadata.conversionRate && (
                  <p>
                    <span className="font-semibold">Rate:</span> 1{" "}
                    {tx.metadata.currency} = {tx.metadata.conversionRate} AFRI
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};