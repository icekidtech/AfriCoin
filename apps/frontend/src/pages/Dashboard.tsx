import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Send,
  Download,
  Plus,
  Mic,
  Menu,
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { VoiceAssistant } from "@/components/VoiceAssistant";
import { ReceiveDialog } from "@/components/ReceiveDialog";
import { TopUpDialog } from "@/components/TopUpDialog";
import { api } from "@/lib/api";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout } = useAuth();

  const [showBalance, setShowBalance] = useState(true);
  const [balance, setBalance] = useState("0");
  const [loading, setLoading] = useState(true);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.phoneHash) return;

      try {
        // Fetch balance
        const balanceResponse = await api.wallet.getBalance(user.phoneHash);
        const balanceInWei = balanceResponse.data.data.balance;
        const balanceInAfri = (
          BigInt(balanceInWei) /
          BigInt(10) ** BigInt(18)
        ).toString();
        setBalance(balanceInAfri);

        // Fetch transaction history
        const historyResponse = await api.transfer.getHistory(
          user.phoneHash,
          10
        );
        setTransactions(historyResponse.data.data.transactions);

        setLoading(false);
      } catch (error) {
        console.error("Failed to load user data:", error);
        toast({
          title: "Error",
          description: "Failed to load wallet data",
          variant: "destructive",
        });
      }
    };

    loadUserData();
  }, [user?.phoneHash, toast]);

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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Loading wallet...</p>
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-glow to-primary pb-20">
      {/* Header */}
      <div className="px-4 pt-6 pb-8">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => setMenuOpen(true)}
            className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-smooth"
          >
            <Menu className="w-5 h-5 text-white" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-secondary"></div>
          </div>
        </div>

        {/* Balance Card */}
        <div className="text-center space-y-2 animate-fade-in">
          <p className="text-white/80 text-sm">Available Balance</p>
          <div className="flex items-center justify-center gap-3">
            <h1 className="text-5xl font-bold text-white">
              {showBalance ? `₳${parseFloat(balance).toFixed(2)}` : "••••••"}
            </h1>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center"
            >
              {showBalance ? (
                <EyeOff className="w-4 h-4 text-white" />
              ) : (
                <Eye className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
          <p className="text-white/60 text-sm">
            ≈ ${(parseFloat(balance) * 0.01).toFixed(2)} USD
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          <Link
            to="/send"
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-smooth"
          >
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-medium">
              <Send className="w-5 h-5 text-primary" />
            </div>
            <span className="text-white text-sm font-medium">Send</span>
          </Link>

          <button
            onClick={() => setReceiveOpen(true)}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-smooth"
          >
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-medium">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <span className="text-white text-sm font-medium">Receive</span>
          </button>

          <button
            onClick={() => setTopUpOpen(true)}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-smooth"
          >
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-medium">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            <span className="text-white text-sm font-medium">Top Up</span>
          </button>
        </div>
      </div>

      {/* Transactions Section */}
      <div className="bg-background rounded-t-[2rem] px-4 pt-8 pb-24 min-h-[50vh]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Recent Transactions</h2>
          <Link to="/transactions">
            <Button variant="ghost" size="sm" className="text-primary">
              See All
            </Button>
          </Link>
        </div>

        {transactions.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No transactions yet</p>
            <Link to="/send">
              <Button className="mt-4">Make Your First Transfer</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {transactions.slice(0, 5).map((tx) => (
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
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold ${
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
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Voice Command FAB */}
      <button
        onClick={() => setVoiceOpen(true)}
        className="fixed bottom-24 right-6 w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary shadow-strong flex items-center justify-center animate-glow hover:scale-110 transition-smooth"
      >
        <Mic className="w-6 h-6 text-white" />
      </button>

      {/* Voice Assistant Modal */}
      <VoiceAssistant open={voiceOpen} onOpenChange={setVoiceOpen} />

      {/* Receive Dialog */}
      <ReceiveDialog open={receiveOpen} onOpenChange={setReceiveOpen} />

      {/* Top Up Dialog */}
      <TopUpDialog open={topUpOpen} onOpenChange={setTopUpOpen} />

      {/* Side Menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="fixed left-0 top-0 bottom-0 w-80 bg-card shadow-strong animate-slide-in-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Menu</h2>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center"
                >
                  ×
                </button>
              </div>

              <div className="space-y-2">
                <div className="p-4 bg-muted rounded-xl">
                  <p className="text-sm text-muted-foreground">Logged in as</p>
                  <p className="font-semibold">{user?.name}</p>
                  <p className="text-sm text-muted-foreground">{user?.phone}</p>
                </div>

                <Link to="/profile" onClick={() => setMenuOpen(false)}>
                  <button className="w-full p-4 text-left rounded-xl hover:bg-muted transition-smooth">
                    Profile Settings
                  </button>
                </Link>
                <Link to="/transactions" onClick={() => setMenuOpen(false)}>
                  <button className="w-full p-4 text-left rounded-xl hover:bg-muted transition-smooth">
                    Transaction History
                  </button>
                </Link>
                <Link to="/security" onClick={() => setMenuOpen(false)}>
                  <button className="w-full p-4 text-left rounded-xl hover:bg-muted transition-smooth">
                    Security & PIN
                  </button>
                </Link>
                <Link to="/help" onClick={() => setMenuOpen(false)}>
                  <button className="w-full p-4 text-left rounded-xl hover:bg-muted transition-smooth">
                    Help & Support
                  </button>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full p-4 text-left rounded-xl hover:bg-destructive/10 text-destructive transition-smooth"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-6 py-4">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <button className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <div className="w-5 h-5 rounded-md bg-white"></div>
            </div>
            <span className="text-xs font-medium text-primary">Home</span>
          </button>

          <Link to="/send" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-smooth">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center">
              <Send className="w-5 h-5" />
            </div>
            <span className="text-xs">Send</span>
          </Link>

          <button
            onClick={() => setReceiveOpen(true)}
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-smooth"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <span className="text-xs">Receive</span>
          </button>

          <button
            onClick={() => setMenuOpen(true)}
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-smooth"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center">
              <Menu className="w-5 h-5" />
            </div>
            <span className="text-xs">More</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
