import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";

const TransactionHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const loadTransactions = async () => {
      if (!user?.phoneHash) return;

      try {
        const response = await api.transfer.getHistory(user.phoneHash, 100);
        setTransactions(response.data.data.transactions);
        setLoading(false);
      } catch (error) {
        console.error("Failed to load transactions:", error);
        setLoading(false);
      }
    };

    loadTransactions();
  }, [user?.phoneHash]);

  const formatAmount = (wei: string) => {
    try {
      const afri = (BigInt(wei) / BigInt(10) ** BigInt(18)).toString();
      return parseFloat(afri).toFixed(2);
    } catch {
      return "0.00";
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === "all") return true;
    if (filter === "sent") return tx.type === "send";
    if (filter === "received") return tx.type === "receive";
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 pb-8">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 hover:bg-muted rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Transaction History</h1>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6">
          {["all", "sent", "received"].map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f === "all" ? "All" : f === "sent" ? "Sent" : "Received"}
            </Button>
          ))}
        </div>

        {loading ? (
          <Card className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading transactions...</p>
          </Card>
        ) : filteredTransactions.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No transactions found</p>
            <Button onClick={() => navigate("/send")}>Make a Transfer</Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((tx) => (
              <Card
                key={tx._id}
                className="p-4 shadow-soft border-0 hover:shadow-medium transition-smooth"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      tx.type === "send"
                        ? "bg-accent/10"
                        : tx.type === "receive"
                        ? "bg-success/10"
                        : "bg-primary/10"
                    }`}
                  >
                    {tx.type === "send" ? (
                      <ArrowUpRight className="w-5 h-5 text-accent" />
                    ) : tx.type === "receive" ? (
                      <ArrowDownLeft className="w-5 h-5 text-success" />
                    ) : (
                      <Plus className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">
                      {tx.type === "send"
                        ? `To ${tx.recipientPhone}`
                        : tx.type === "receive"
                        ? `From ${tx.senderPhone}`
                        : "Wallet Top Up"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(tx.timestamp)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Status: {tx.status}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold text-lg ${
                        tx.type === "send"
                          ? "text-accent"
                          : tx.type === "receive"
                          ? "text-success"
                          : "text-primary"
                      }`}
                    >
                      {tx.type === "send" ? "-" : "+"}
                      {formatAmount(tx.amount)} AFRI
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tx.transactionHash.slice(0, 10)}...
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;
