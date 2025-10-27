import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Zap, Phone, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/africoin-logo.png";

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="AfriCoin" className="w-8 h-8" />
            <span className="font-bold text-xl">AfriCoin</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost">Log In</Button>
            </Link>
            <Link to="/onboarding">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pt-36 pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
        
        <div className="container relative z-10 mx-auto max-w-6xl">
          <div className="flex flex-col items-center text-center space-y-8 animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-primary/20 shadow-soft">
              <img src={logo} alt="AfriCoin" className="w-5 h-5" />
              <span className="text-sm font-medium">Built on Base · Powered by AfriCore</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-balance max-w-4xl">
              The One African
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"> Economy</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl text-balance">
              Send, save, and trade seamlessly across borders. No wallets, no hassle—just your phone number.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link to="/onboarding">
                <Button size="lg" className="gradient-primary text-white font-semibold shadow-medium hover:shadow-strong transition-smooth group">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-2 border-primary/20 hover:bg-primary/5">
                Learn More
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center gap-6 pt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <span>Bank-level Security</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <span>Instant Transfers</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-20 bg-card/50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">
            How It Works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-2xl bg-card shadow-soft hover:shadow-medium transition-smooth animate-slide-up">
              <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-2xl shadow-glow">
                1
              </div>
              <Phone className="w-12 h-12 text-primary" />
              <h3 className="text-xl font-semibold">Sign Up with Your Phone</h3>
              <p className="text-muted-foreground">
                Just your phone number and a secure PIN. No crypto knowledge needed.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-2xl bg-card shadow-soft hover:shadow-medium transition-smooth animate-slide-up" style={{ animationDelay: "0.1s" }}>
              <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-2xl shadow-glow">
                2
              </div>
              <Wallet className="w-12 h-12 text-primary" />
              <h3 className="text-xl font-semibold">Fund Your Wallet</h3>
              <p className="text-muted-foreground">
                Add money via mobile money or bank transfer. Convert to AfriCoin instantly.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-2xl bg-card shadow-soft hover:shadow-medium transition-smooth animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-2xl shadow-glow">
                3
              </div>
              <Zap className="w-12 h-12 text-primary" />
              <h3 className="text-xl font-semibold">Send & Receive Instantly</h3>
              <p className="text-muted-foreground">
                Transfer AfriCoin to any phone number across Africa. Fast, secure, borderless.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-20">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">
            Core Features
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-card border border-border shadow-soft hover:shadow-medium transition-smooth">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold mb-2">Phone Number Sending</h3>
              <p className="text-sm text-muted-foreground">Send to anyone using just their phone number</p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border shadow-soft hover:shadow-medium transition-smooth">
              <div className="w-12 h-12 rounded-xl bg-secondary/20 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="font-semibold mb-2">AI Stability Engine</h3>
              <p className="text-sm text-muted-foreground">Powered by AfriCore AI for consistent value</p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border shadow-soft hover:shadow-medium transition-smooth">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-4">
                <img src={logo} alt="AfriCoin" className="w-7 h-7" />
              </div>
              <h3 className="font-semibold mb-2">Voice Assistant</h3>
              <p className="text-sm text-muted-foreground">Swahili, English, French voice commands</p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border shadow-soft hover:shadow-medium transition-smooth">
              <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-success" />
              </div>
              <h3 className="font-semibold mb-2">Inclusive Design</h3>
              <p className="text-sm text-muted-foreground">Low data usage, offline mode ready</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-12 border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <img src={logo} alt="AfriCoin" className="w-8 h-8" />
              <span className="font-bold text-xl">AfriCoin</span>
            </div>
            
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
              <a href="#" className="hover:text-foreground transition-colors">DAO Governance</a>
            </div>

            <div className="text-sm text-muted-foreground">
              Built on Base · Powered by AfriCore
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
