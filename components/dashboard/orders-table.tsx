"use client";

import { useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { OrderActions } from "./order-actions";
import { OrderSearch } from "./order-search";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function OrdersTable({ orders }: { orders: Record<string, any>[] }) {
    const [filter, setFilter] = useState<'all' | 'paid' | 'pending'>('all');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [searchResults, setSearchResults] = useState<Record<string, any>[] | null>(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSearchResults = useCallback((results: any[]) => {
        setSearchResults(results);
    }, []);

    const handleSearchClear = useCallback(() => {
        setSearchResults(null);
    }, []);

    const displayOrders = searchResults !== null ? searchResults : orders;

    const filteredOrders = displayOrders.filter(order => {
        if (filter === 'all') return true;
        if (filter === 'paid') return order.payment_status === 'paid' || order.payment_status === 'verified';
        if (filter === 'pending') return order.payment_status === 'pending' || order.payment_status === 'needs_review' || order.payment_status === 'awaiting_approval';
        return true;
    });

    const handleDownloadCSV = () => {
        if (!filteredOrders.length) return;

        const headers = ["Order ID", "Date", "Customer Name", "Phone", "Email", "Address Line 1", "Address Line 2", "City", "State", "Pincode", "Product", "Amount", "Payment Status", "Shipping Status"];
        const csvRows = [headers.join(",")];

        filteredOrders.forEach(order => {
            const addr = order.buyer_address || {};
            const date = new Date(order.created_at).toLocaleDateString('en-IN');
            const product = Array.isArray(order.products) ? order.products[0]?.name : order.products?.name || "";
            const amount = (order.amount / 100).toString();

            const row = [
                order.id,
                date,
                `"${(order.buyer_name || "").replace(/"/g, '""')}"`,
                `"${(order.buyer_phone || "").replace(/"/g, '""')}"`,
                `"${(order.buyer_email || "").replace(/"/g, '""')}"`,
                `"${(addr.line1 || "").replace(/"/g, '""')}"`,
                `"${(addr.line2 || "").replace(/"/g, '""')}"`,
                `"${(addr.city || "").replace(/"/g, '""')}"`,
                `"${(addr.state || "").replace(/"/g, '""')}"`,
                `"${(addr.pincode || "").replace(/"/g, '""')}"`,
                `"${product.replace(/"/g, '""')}"`,
                amount,
                order.payment_status || "pending",
                order.shipping_status || "pending"
            ];
            csvRows.push(row.join(","));
        });

        const csvContent = csvRows.join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `customer_addresses_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* Search + Filter Row */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex items-center gap-4">
                    <OrderSearch onResults={handleSearchResults} onClear={handleSearchClear} />
                    {searchResults !== null && (
                        <span className="text-xs text-muted-foreground mr-4">
                            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                        </span>
                    )}
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={handleDownloadCSV}
                    disabled={filteredOrders.length === 0}
                >
                    <Download className="h-4 w-4" />
                    Download CSV
                </Button>
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-white/[0.03] p-1 rounded-lg w-max border border-border">
                <button
                    onClick={() => setFilter('all')}
                    className={cn(
                        "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                        filter === 'all'
                            ? "bg-white/[0.08] text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    All
                </button>
                <button
                    onClick={() => setFilter('paid')}
                    className={cn(
                        "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                        filter === 'paid'
                            ? "bg-emerald-500/10 text-emerald-400 shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Paid
                </button>
                <button
                    onClick={() => setFilter('pending')}
                    className={cn(
                        "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                        filter === 'pending'
                            ? "bg-primary/10 text-primary shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Pending
                </button>
            </div>

            <div className="surface-elevated rounded-xl overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                            <TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Order ID</TableHead>
                            <TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Date</TableHead>
                            <TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Customer</TableHead>
                            <TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Amount</TableHead>
                            <TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">Status</TableHead>
                            <TableHead className="font-semibold text-muted-foreground text-xs uppercase tracking-wider text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredOrders.map((order) => {
                            let statusBadge;
                            const status = order.payment_status;
                            const isCod = order.payment_method === 'cod';

                            if (status === 'paid' || status === 'verified') {
                                statusBadge = <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15">Paid</Badge>;
                            } else if (status === 'needs_review' || status === 'awaiting_approval') {
                                statusBadge = <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/15">Needs Review</Badge>;
                            } else if (isCod && order.cod_status === 'pending_approval') {
                                statusBadge = <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/15">COD Request</Badge>;
                            } else if (isCod && order.cod_status === 'rejected') {
                                statusBadge = <Badge className="bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/15">Rejected</Badge>;
                            } else if (status === 'pending') {
                                statusBadge = <Badge variant="outline" className="text-muted-foreground border-border">Pending</Badge>;
                            } else {
                                statusBadge = <Badge variant="secondary">{status}</Badge>;
                            }

                            if (order.shipping_status === 'shipped') {
                                statusBadge = <Badge className="bg-white/[0.06] text-muted-foreground border-border">Shipped</Badge>;
                            }

                            return (
                                <TableRow key={order.id} className="hover:bg-white/[0.02] border-border group transition-colors">
                                    <TableCell className="font-mono text-xs text-muted-foreground">{order.id.slice(0, 8)}...</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-foreground">{order.buyer_name}</span>
                                            <span className="text-xs text-muted-foreground">{order.buyer_phone}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-bold text-foreground tabular-nums">
                                        ₹{(order.amount / 100).toLocaleString('en-IN')}
                                    </TableCell>
                                    <TableCell>{statusBadge}</TableCell>
                                    <TableCell className="text-right">
                                        <OrderActions order={order} />
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {filteredOrders.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground text-sm">
                                    No orders found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
