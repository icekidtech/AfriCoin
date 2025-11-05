import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Send,
  Download,
  TrendingUp,
  X,
  Download as DownloadIcon,
} from "lucide-react";
import { useTransactionHistory } from "@/hooks/useTransactionHistory";
import { useAuth } from "@/hooks/useAuth";

interface TransactionHistoryFilteredProps {
  onTransactionSelect?: (txHash: string) => void;
}

export const TransactionHistoryFiltered = ({
  onTransactionSelect,
}: TransactionHistoryFilteredProps) => {
  const { user } = useAuth();
  const {
    transactions,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
    search,
    stats,
    downloadCSV,
  } = useTransactionHistory(user?.phoneHash || null);

  const [searchInput, setSearchInput] = useState("");
  const [showStats, setShowStats] = useState(true);

  const handleSearch = (value: string) => {
    setSearchInput(value);
    search(value);
  };

  const handleTypeChange = (value: string) => {
    updateFilters({
      type: value as "all" | "send" | "receive" | "mint",
    });
  };

  const handleStatusChange = (value: string) => {
    updateFilters({
      status: value as "all" | "pending" | "completed" | "failed",
    });
  };

  const handleClearFilters = () => {
    setSearchInput("");
    clearFilters();
  };

  useEffect(() => {
    if (!user?.phoneHash) return;

    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const response = await api.transfer.getHistory(user.phoneHash, limit);
        const txData = response.data?.data?.transactions || [];
        setTransactions(Array.isArray(txData) ? txData : []);
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
        setTransactions([]);
        setError("Failed to load transactions");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [user?.phoneHash]);

  if (error) {
    return (
      <Card className="p-6 text-center text-destructive">
        <p>Failed to load transactions: {error}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      {showStats && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <p className="text-xs text-blue-600 font-semibold">Total</p>
            <p className="text-2xl font-bold text-blue-900">
              {stats.total}
            </p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <p className="text-xs text-green-600 font-semibold">Received</p>
            <p className="text-2xl font-bold text-green-900">
              {stats.received}
            </p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <p className="text-xs text-red-600 font-semibold">Sent</p>
            <p className="text-2xl font-bold text-red-900">
              {stats.sent}
            </p>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <p className="text-xs text-amber-600 font-semibold">Amount</p>
            <p className="text-2xl font-bold text-amber-900">
              {stats.totalAmount.toFixed(2)} AFRI
            </p>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card className="p-4 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-sm">Filters</h3>
          {(searchInput || filters.type !== "all" || filters.status !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-xs"
            >
              <X className="w-3 h-3 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Search Bar */}
        <Input
          placeholder="Search by phone, address, or tx hash..."
          value={searchInput}
          onChange={(e) => handleSearch(e.target.value)}
          className="text-sm"
        />

        {/* Filter Controls */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Type Filter */}
          <Select value={filters.type || "all"} onValueChange={handleTypeChange}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="send">Sent</SelectItem>
              <SelectItem value="receive">Received</SelectItem>
              <SelectItem value="mint">Minted</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select
            value={filters.status || "all"}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          {/* Export Button */}
          <Button
            onClick={downloadCSV}
            variant="outline"
            size="sm"
            className="text-xs"
            disabled={transactions.length === 0}
          >
            <DownloadIcon className="w-3 h-3 mr-1" />
            Export CSV
          </Button>

          {/* Toggle Stats */}
          <Button
            onClick={() => setShowStats(!showStats)}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            {showStats ? "Hide" : "Show"} Stats
          </Button>
        </div>
      </Card>

      {/* Transaction List */}
      {loading ? (
        <Card className="p-6 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <p className="text-sm">Loading transactions...</p>
        </Card>
      ) : transactions.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No transactions found</p>
        </Card>
      ) : (
        <Card>
          <div className="divide-y">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() =>
                  onTransactionSelect && onTransactionSelect(tx.transactionHash)
                }
              >
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
                      <Send
                        className={`w-5 h-5 ${
                          tx.type === "send"
                            ? "text-red-600"
                            : tx.type === "receive"
                              ? "text-green-600 rotate-180"
                              : "text-blue-600"
                        }`}
                      />
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
                        {tx.metadata.currency} = {tx.metadata.conversionRate}{" "}
                        AFRI
                      </p>
                    )}
                  </div>
                )}

                {/* Transaction Hash */}
                <div className="mt-2 text-xs font-mono text-muted-foreground truncate">
                  {tx.transactionHash}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Results Count */}
      {transactions.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Showing {transactions.length} of {transactions.length} transactions
        </p>
      )}
    </div>
  );
};