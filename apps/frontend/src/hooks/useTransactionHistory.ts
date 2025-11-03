import { useState, useCallback, useEffect } from "react";
import api from "@/lib/api";

export interface Transaction {
  id: string;
  transactionHash: string;
  senderPhone: string;
  recipientPhone: string;
  amount: string;
  status: "pending" | "completed" | "failed";
  type: "send" | "receive" | "mint";
  timestamp: Date;
  metadata?: {
    method?: string;
    currency?: string;
    conversionRate?: string;
  };
}

export interface FilterOptions {
  type?: "all" | "send" | "receive" | "mint";
  status?: "all" | "pending" | "completed" | "failed";
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  searchQuery?: string;
}

export const useTransactionHistory = (phoneHash: string | null) => {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<FilterOptions>({
    type: "all",
    status: "all",
  });

  /**
   * Parse amount from wei string
   */
  const parseAmount = (wei: string): number => {
    try {
      return parseFloat(ethers.formatEther(wei));
    } catch {
      return 0;
    }
  };

  /**
   * Apply filters to transactions
   */
  const applyFilters = useCallback(
    (transactions: Transaction[], filterOptions: FilterOptions) => {
      return transactions.filter((tx) => {
        // Type filter
        if (
          filterOptions.type &&
          filterOptions.type !== "all" &&
          tx.type !== filterOptions.type
        ) {
          return false;
        }

        // Status filter
        if (
          filterOptions.status &&
          filterOptions.status !== "all" &&
          tx.status !== filterOptions.status
        ) {
          return false;
        }

        // Date range filter
        const txDate = new Date(tx.timestamp);
        if (filterOptions.startDate && txDate < filterOptions.startDate) {
          return false;
        }
        if (filterOptions.endDate && txDate > filterOptions.endDate) {
          return false;
        }

        // Amount range filter
        const amount = parseAmount(tx.amount);
        if (
          filterOptions.minAmount !== undefined &&
          amount < filterOptions.minAmount
        ) {
          return false;
        }
        if (
          filterOptions.maxAmount !== undefined &&
          amount > filterOptions.maxAmount
        ) {
          return false;
        }

        // Search query filter
        if (filterOptions.searchQuery) {
          const query = filterOptions.searchQuery.toLowerCase();
          const matches =
            tx.senderPhone.toLowerCase().includes(query) ||
            tx.recipientPhone.toLowerCase().includes(query) ||
            tx.transactionHash.toLowerCase().includes(query);

          if (!matches) return false;
        }

        return true;
      });
    },
    []
  );

  /**
   * Fetch transaction history
   */
  const fetchHistory = useCallback(
    async (limit: number = 50) => {
      if (!phoneHash) return;

      try {
        setLoading(true);
        setError(null);

        const response = await api.transfer.getHistory(phoneHash, limit);
        const transactions = response.data.data.transactions;
        
        setAllTransactions(transactions);
        setTotalCount(transactions.length);

        // Apply current filters
        const filtered = applyFilters(transactions, filters);
        setFilteredTransactions(filtered);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to fetch history";
        setError(errorMsg);
        console.error("Fetch history error:", err);
      } finally {
        setLoading(false);
      }
    },
    [phoneHash, filters, applyFilters]
  );

  /**
   * Update filters and reapply
   */
  const updateFilters = useCallback(
    (newFilters: Partial<FilterOptions>) => {
      const updatedFilters = { ...filters, ...newFilters };
      setFilters(updatedFilters);

      // Reapply filters to existing transactions
      const filtered = applyFilters(allTransactions, updatedFilters);
      setFilteredTransactions(filtered);
    },
    [filters, allTransactions, applyFilters]
  );

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    const defaultFilters: FilterOptions = {
      type: "all",
      status: "all",
    };
    setFilters(defaultFilters);
    setFilteredTransactions(allTransactions);
  }, [allTransactions]);

  /**
   * Search transactions
   */
  const search = useCallback(
    (query: string) => {
      updateFilters({ searchQuery: query });
    },
    [updateFilters]
  );

  /**
   * Get transaction stats
   */
  const getStats = useCallback(() => {
    return {
      total: filteredTransactions.length,
      sent: filteredTransactions.filter((tx) => tx.type === "send").length,
      received: filteredTransactions.filter((tx) => tx.type === "receive").length,
      pending: filteredTransactions.filter((tx) => tx.status === "pending").length,
      totalAmount: filteredTransactions.reduce(
        (sum, tx) => sum + parseAmount(tx.amount),
        0
      ),
    };
  }, [filteredTransactions]);

  /**
   * Export transactions as CSV
   */
  const exportAsCSV = useCallback(() => {
    const headers = [
      "Hash",
      "Type",
      "From",
      "To",
      "Amount (AFRI)",
      "Status",
      "Date",
      "Method",
    ];
    const rows = filteredTransactions.map((tx) => [
      tx.transactionHash,
      tx.type,
      tx.senderPhone,
      tx.recipientPhone,
      parseAmount(tx.amount).toFixed(4),
      tx.status,
      new Date(tx.timestamp).toLocaleString(),
      tx.metadata?.method || "N/A",
    ]);

    const csv =
      [headers, ...rows]
        .map((row) =>
          row
            .map((cell) =>
              typeof cell === "string" && cell.includes(",")
                ? `"${cell}"`
                : cell
            )
            .join(",")
        )
        .join("\n") + "\n";

    return csv;
  }, [filteredTransactions]);

  /**
   * Download CSV file
   */
  const downloadCSV = useCallback(() => {
    const csv = exportAsCSV();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `transactions_${Date.now()}.csv`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [exportAsCSV]);

  /**
   * Poll for transaction updates
   */
  useEffect(() => {
    if (!phoneHash) return;

    fetchHistory();

    // Poll every 10 seconds for pending transactions
    const interval = setInterval(() => {
      const hasPending = filteredTransactions.some(
        (tx) => tx.status === "pending"
      );
      if (hasPending) {
        fetchHistory();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [phoneHash, fetchHistory, filteredTransactions]);

  /**
   * Get transaction status label
   */
  const getStatusLabel = useCallback((status: string): string => {
    switch (status) {
      case "pending":
        return "Pending";
      case "completed":
        return "Completed";
      case "failed":
        return "Failed";
      default:
        return status;
    }
  }, []);

  /**
   * Format transaction for display
   */
  const formatTransaction = useCallback(
    (tx: Transaction) => {
      return {
        ...tx,
        amountFormatted: parseAmount(tx.amount).toFixed(4),
        timestampFormatted: new Date(tx.timestamp).toLocaleString(),
        statusLabel: getStatusLabel(tx.status),
      };
    },
    [getStatusLabel]
  );

  return {
    transactions: filteredTransactions.map(formatTransaction),
    allTransactions,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
    search,
    fetchHistory,
    refresh: () => fetchHistory(),
    stats: getStats(),
    exportAsCSV,
    downloadCSV,
    totalCount,
  };
};