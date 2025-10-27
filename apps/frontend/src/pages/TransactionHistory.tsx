import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";

const TransactionHistory = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const transactions = [
    {
      id: 1,
      type: "received",
      name: "Sarah Mwangi",
      phone: "+254 700 555 123",
      amount: 50.0,
      date: "Today, 2:30 PM",
      icon: ArrowDownLeft,
      color: "success",
    },
    {
      id: 2,
      type: "sent",
      name: "John Doe",
      phone: "+234 803 555 678",
      amount: -25.0,
      date: "Yesterday, 10:15 AM",
      icon: ArrowUpRight,
      color: "accent",
    },
    {
      id: 3,
      type: "topup",
      name: "Wallet Top Up",
      phone: "M-Pesa",
      amount: 200.0,
      date: "Dec 18, 2024",
      icon: Plus,
      color: "primary",
    },
    {
      id: 4,
      type: "sent",
      name: "Grace Okonkwo",
      phone: "+234 811 222 333",
      amount: -75.5,
      date: "Dec 17, 2024",
      icon: ArrowUpRight,
      color: "accent",
    },
    {
      id: 5,
      type: "received",
      name: "Michael Banda",
      phone: "+260 977 444 555",
      amount: 120.0,
      date: "Dec 16, 2024",
      icon: ArrowDownLeft,
      color: "success",
    },
    {
      id: 6,
      type: "topup",
      name: "Wallet Top Up",
      phone: "Bank Transfer",
      amount: 500.0,
      date: "Dec 15, 2024",
      icon: Plus,
      color: "primary",
    },
    {
      id: 7,
      type: "sent",
      name: "Fatima Hassan",
      phone: "+212 666 777 888",
      amount: -40.0,
      date: "Dec 14, 2024",
      icon: ArrowUpRight,
      color: "accent",
    },
    {
      id: 8,
      type: "received",
      name: "David Kimani",
      phone: "+254 722 888 999",
      amount: 95.25,
      date: "Dec 13, 2024",
      icon: ArrowDownLeft,
      color: "success",
    },
  ];

  const filteredTransactions = transactions.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.phone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-4">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-10 h-10 rounded-xl hover:bg-muted flex items-center justify-center transition-smooth"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Transaction History</h1>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="px-4 pt-6 pb-4">
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Received</p>
            <p className="text-2xl font-bold text-success">₳265.25</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Sent</p>
            <p className="text-2xl font-bold text-accent">₳140.50</p>
          </Card>
        </div>
      </div>

      {/* Transactions List */}
      <div className="px-4 space-y-3">
        {filteredTransactions.map((transaction) => (
          <Card
            key={transaction.id}
            className="p-4 shadow-soft border-0 hover:shadow-medium transition-smooth"
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-xl bg-${transaction.color}/10 flex items-center justify-center flex-shrink-0`}
              >
                <transaction.icon className={`w-5 h-5 text-${transaction.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{transaction.name}</p>
                <p className="text-sm text-muted-foreground">{transaction.phone}</p>
              </div>
              <div className="text-right">
                <p
                  className={`font-bold ${
                    transaction.amount > 0 ? "text-success" : "text-accent"
                  }`}
                >
                  {transaction.amount > 0 ? "+" : ""}₳{Math.abs(transaction.amount).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">{transaction.date}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredTransactions.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No transactions found</p>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
