'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc/client';
import { toast } from 'sonner';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  IndianRupee,
  ShoppingBag,
  Filter,
  Check,
  X,
  RefreshCw,
} from 'lucide-react';

export function OrderManagement() {
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'REJECTED'>('ALL');

  // tRPC live polling for orders every 5 seconds!
  const ordersQuery = trpc.order.getAllOrders.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const updateStatusMutation = trpc.order.updateStatus.useMutation({
    onSuccess: () => {
      ordersQuery.refetch();
    },
  });

  const handleUpdateStatus = async (orderId: number, status: 'CONFIRMED' | 'REJECTED') => {
    try {
      await updateStatusMutation.mutateAsync({ orderId, status });
      toast.success(`Order #${orderId} marked as ${status}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update order status');
    }
  };

  const allOrders = ordersQuery.data?.orders || [];
  const filteredOrders = allOrders.filter((order) => {
    if (statusFilter === 'ALL') return true;
    return order.paymentStatus === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-parchment bg-white shadow-sm p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-ink-soft uppercase tracking-wider">
                Total Revenue
              </p>
              <h3 className="font-serif text-3xl font-bold text-ink mt-1">
                ₹{ordersQuery.data?.totalRevenue || 0}
              </h3>
            </div>
            <div className="w-12 h-12 bg-gold/10 text-gold rounded-full flex items-center justify-center">
              <IndianRupee className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="border-parchment bg-white shadow-sm p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-ink-soft uppercase tracking-wider">
                Pending Verification
              </p>
              <h3 className="font-serif text-3xl font-bold text-amber-600 mt-1">
                {ordersQuery.data?.pendingCount || 0}
              </h3>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="border-parchment bg-white shadow-sm p-5 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-ink-soft uppercase tracking-wider">
                Total Orders Placed
              </p>
              <h3 className="font-serif text-3xl font-bold text-ink mt-1">
                {ordersQuery.data?.totalOrders || 0}
              </h3>
            </div>
            <div className="w-12 h-12 bg-cream-deep text-ink-soft rounded-full flex items-center justify-center">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Bar & Polling Indicator */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white rounded-xl border border-parchment shadow-sm">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gold" />
          <span className="text-xs font-semibold text-ink mr-2">Filter Orders:</span>
          {(['ALL', 'PENDING', 'CONFIRMED', 'REJECTED'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === st
                  ? 'bg-gold text-white shadow-sm'
                  : 'bg-cream-deep hover:bg-parchment text-ink-soft'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-green-700 font-semibold">
          <RefreshCw className={`w-3.5 h-3.5 ${ordersQuery.isFetching ? 'animate-spin' : ''}`} />
          <span>Live 5s Polling Active</span>
        </div>
      </div>

      {/* Orders Table */}
      <Card className="border-parchment bg-white shadow-sm rounded-xl overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-ink-soft space-y-2">
              <ShoppingBag className="w-10 h-10 text-parchment mx-auto" />
              <p className="text-sm font-medium">No orders found matching this filter.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-cream-deep/60 border-b border-parchment text-ink uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items Summary</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Payment Status</th>
                  <th className="py-3 px-4">Receipt Proof</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-parchment/60">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-cream/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-ink">#{order.id}</td>
                    <td className="py-3 px-4 text-ink-soft">
                      {new Date(order.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-ink">
                        {order.customerId ? `Cust #${order.customerId}` : 'Guest'}
                      </div>
                      {order.phone && <div className="text-[11px] text-ink-soft">{order.phone}</div>}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <div className="space-y-0.5">
                        {order.items.map((it, idx) => (
                          <div key={idx} className="truncate text-ink-soft">
                            <span className="font-semibold text-ink">{it.quantity}x</span> {it.menu_name}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-sm text-ink">₹{order.total}</div>
                      {order.discountApplied > 0 && (
                        <span className="text-[10px] text-green-600 font-semibold">
                          (-₹{order.discountApplied} off)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {order.paymentStatus === 'CONFIRMED' && (
                        <Badge className="bg-green-600 text-white text-[11px] font-sans">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Confirmed
                        </Badge>
                      )}
                      {order.paymentStatus === 'PENDING' && (
                        <Badge className="bg-amber-500 text-white text-[11px] font-sans">
                          <Clock className="w-3 h-3 mr-1" /> Pending
                        </Badge>
                      )}
                      {order.paymentStatus === 'REJECTED' && (
                        <Badge className="bg-destructive text-white text-[11px] font-sans">
                          <AlertCircle className="w-3 h-3 mr-1" /> Rejected
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {order.paymentScreenshot ? (
                        <button
                          type="button"
                          onClick={() => setSelectedScreenshot(order.paymentScreenshot!)}
                          className="flex items-center gap-1 text-gold hover:underline font-semibold"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Proof
                        </button>
                      ) : (
                        <span className="text-ink-soft/50">None</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {order.paymentStatus === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(order.id, 'CONFIRMED')}
                            disabled={updateStatusMutation.isPending}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs h-7 px-2.5"
                          >
                            <Check className="w-3.5 h-3.5 mr-1" /> Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleUpdateStatus(order.id, 'REJECTED')}
                            disabled={updateStatusMutation.isPending}
                            className="text-xs h-7 px-2.5"
                          >
                            <X className="w-3.5 h-3.5 mr-1" /> Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-ink-soft">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Screenshot Inspection Modal */}
      <Dialog open={!!selectedScreenshot} onOpenChange={() => setSelectedScreenshot(null)}>
        <DialogContent className="sm:max-w-md bg-white border-parchment p-5 text-center">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-ink">
              Customer Payment Proof
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[65vh] overflow-y-auto rounded-lg border border-parchment p-1 mt-2">
            {selectedScreenshot && (
              <img
                src={selectedScreenshot}
                alt="Payment Receipt"
                className="w-full h-auto object-contain rounded"
              />
            )}
          </div>
          <Button
            type="button"
            onClick={() => setSelectedScreenshot(null)}
            className="w-full bg-gold hover:bg-gold-light text-white text-xs font-semibold mt-3"
          >
            Close Receipt
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
