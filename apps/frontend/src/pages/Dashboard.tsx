import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Send, Download, Plus, Mic, Menu, Eye, EyeOff, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { VoiceAssistant } from "@/components/VoiceAssistant";
import { ReceiveDialog } from "@/components/ReceiveDialog";
import { TopUpDialog } from "@/components/TopUpDialog";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<{ name: string; phone: string } | null>(null);
  const [showBalance, setShowBalance] = useState(true);
  const [balance] = useState(1250.54);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("africoin_user");
    if (!userData) {
      navigate("/onboarding");
    } else {
      setUser(JSON.parse(userData));
    }
  }, [navigate]);

  const handleVoiceCommand = () => {
    setVoiceOpen(true);
  };

  if (!user) return null;

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
            <div className="w-6 h-6 rounded-lg gradient-primary"></div>
          </div>
        </div>

        {/* Balance Card */}
        <div className="text-center space-y-2 animate-fade-in">
          <p className="text-white/80 text-sm">Available Balance</p>
          <div className="flex items-center justify-center gap-3">
            <h1 className="text-5xl font-bold text-white">
              {showBalance ? `₳${balance.toFixed(2)}` : "••••••"}
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
          <p className="text-white/60 text-sm">≈ ${(balance * 0.01).toFixed(2)} USD</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          <Link to="/send" className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-smooth">
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
      <div className="bg-background rounded-t-[2rem] px-4 pt-8 pb-4 min-h-[50vh]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Recent Transactions</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary"
            onClick={() => toast({ title: "All Transactions", description: "Full transaction history coming soon!" })}
          >
            See All
          </Button>
        </div>

        <div className="space-y-3">
          {/* Transaction Items */}
          <Card className="p-4 shadow-soft border-0 hover:shadow-medium transition-smooth">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
                <ArrowDownLeft className="w-5 h-5 text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">Received from Sarah</p>
                <p className="text-sm text-muted-foreground">+254 700 555 123</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-success">+₳50.00</p>
                <p className="text-xs text-muted-foreground">Today</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 shadow-soft border-0 hover:shadow-medium transition-smooth">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                <ArrowUpRight className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">Sent to John Doe</p>
                <p className="text-sm text-muted-foreground">+234 803 555 678</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-accent">-₳25.00</p>
                <p className="text-xs text-muted-foreground">Yesterday</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 shadow-soft border-0 hover:shadow-medium transition-smooth">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">Wallet Top Up</p>
                <p className="text-sm text-muted-foreground">M-Pesa</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary">+₳200.00</p>
                <p className="text-xs text-muted-foreground">2 days ago</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Voice Command FAB */}
      <button
        onClick={handleVoiceCommand}
        className="fixed bottom-24 right-6 w-16 h-16 rounded-full gradient-primary shadow-strong flex items-center justify-center animate-glow hover:scale-110 transition-smooth"
      >
        <Mic className="w-6 h-6 text-white" />
      </button>

      {/* Voice Assistant Modal */}
      <VoiceAssistant open={voiceOpen} onOpenChange={setVoiceOpen} balance={balance} />
      
      {/* Receive Dialog */}
      <ReceiveDialog open={receiveOpen} onOpenChange={setReceiveOpen} phone={user.phone} />
      
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
                
                <button 
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/profile");
                  }}
                  className="w-full p-4 text-left rounded-xl hover:bg-muted transition-smooth"
                >
                  Profile Settings
                </button>
                <button 
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/transactions");
                  }}
                  className="w-full p-4 text-left rounded-xl hover:bg-muted transition-smooth"
                >
                  Transaction History
                </button>
                <button 
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/security");
                  }}
                  className="w-full p-4 text-left rounded-xl hover:bg-muted transition-smooth"
                >
                  Security & PIN
                </button>
                <button 
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/help");
                  }}
                  className="w-full p-4 text-left rounded-xl hover:bg-muted transition-smooth"
                >
                  Help & Support
                </button>
                <button 
                  onClick={() => {
                    localStorage.removeItem("africoin_user");
                    navigate("/");
                  }}
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
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <div className="w-5 h-5 rounded-md bg-white"></div>
            </div>
            <span className="text-xs font-medium text-primary">Home</span>
          </button>
          
          <button 
            onClick={() => navigate("/send")}
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-smooth"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center">
              <Send className="w-5 h-5" />
            </div>
            <span className="text-xs">Send</span>
          </button>
          
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
