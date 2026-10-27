'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnimatedButton } from '@/components/ui/animated-button';
import { NumberTicker } from '@/components/ui/number-ticker';
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
  CalendarCheck,
  AlertTriangle,
} from 'lucide-react';

export function OrderManagement() {
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'REJECTED'>('ALL');
  const [isEndDayModalOpen, setIsEndDayModalOpen] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

  // tRPC live polling for orders every 5 seconds!
  const ordersQuery = trpc.order.getAllOrders.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const updateStatusMutation = trpc.order.updateStatus.useMutation({
    onSuccess: () => {
      ordersQuery.refetch();
    },
  });

  const endDayMutation = trpc.order.endDay.useMutation({
    onSuccess: (data) => {
      toast.success(
        `Day ended successfully! Archived ${data.summary.ordersArchived} order(s) (₹${data.summary.confirmedRevenue} confirmed revenue).`
      );
      setIsEndDayModalOpen(false);
      ordersQuery.refetch();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to complete end day summary');
    },
  });

  const handleUpdateStatus = async (orderId: number, status: 'CONFIRMED' | 'REJECTED') => {
    try {
      setUpdatingOrderId(orderId);
      await updateStatusMutation.mutateAsync({ orderId, status });
      toast.success(`Order #${orderId} marked as ${status}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update order status');
    } finally {
      setUpdatingOrderId(null);
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
              <h3 className="font-serif text-3xl font-bold text-ink mt-1 flex items-center">
                ₹<NumberTicker value={ordersQuery.data?.totalRevenue || 0} className="font-serif text-3xl font-bold text-ink" />
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
                <NumberTicker value={ordersQuery.data?.pendingCount || 0} className="font-serif text-3xl font-bold text-amber-600" />
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
                <NumberTicker value={ordersQuery.data?.totalOrders || 0} className="font-serif text-3xl font-bold text-ink" />
              </h3>
            </div>
            <div className="w-12 h-12 bg-cream-deep text-ink-soft rounded-full flex items-center justify-center">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Bar, Polling Indicator & End Day Action */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-parchment shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
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

        <div className="flex flex-wrap items-center justify-between md:justify-end gap-3">
          <div className="flex items-center gap-2 text-xs text-green-700 font-semibold bg-green-50/80 px-2.5 py-1 rounded-lg border border-green-200/60">
            <RefreshCw className={`w-3.5 h-3.5 ${ordersQuery.isFetching ? 'animate-spin' : ''}`} />
            <span>Live 5s Polling Active</span>
          </div>

          <AnimatedButton
            id="end-day-summary-btn"
            type="button"
            variant="heritage-primary"
            size="sm"
            onClick={() => {
              if (allOrders.length === 0) {
                toast.info('No active orders to end the day. All orders are already archived!');
                return;
              }
              setIsEndDayModalOpen(true);
            }}
            disabled={endDayMutation.isPending}
            className="h-8 px-3.5 shadow-sm text-xs font-semibold cursor-pointer"
          >
            <CalendarCheck className="w-4 h-4 mr-1 text-amber-100" />
            <span>End Day Summary</span>
          </AnimatedButton>
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
                          <AnimatedButton
                            size="sm"
                            onClick={() => handleUpdateStatus(order.id, 'CONFIRMED')}
                            disabled={updateStatusMutation.isPending}
                            isLoading={updateStatusMutation.isPending && updatingOrderId === order.id}
                            loadingText="Accepting..."
                            className="bg-green-600 hover:bg-green-700 text-white text-xs h-7 px-2.5 rounded-lg cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5 mr-1" /> Accept
                          </AnimatedButton>
                          <AnimatedButton
                            size="sm"
                            variant="destructive"
                            onClick={() => handleUpdateStatus(order.id, 'REJECTED')}
                            disabled={updateStatusMutation.isPending}
                            className="text-xs h-7 px-2.5 rounded-lg cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5 mr-1" /> Reject
                          </AnimatedButton>
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

      {/* End Day Summary Confirmation Modal */}
      <Dialog open={isEndDayModalOpen} onOpenChange={setIsEndDayModalOpen}>
        <DialogContent className="sm:max-w-md bg-white border-parchment p-6">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <CalendarCheck className="w-5 h-5 text-amber-700" />
              </div>
              <div className="text-left">
                <DialogTitle className="font-serif text-lg font-bold text-ink">
                  End Business Day Summary
                </DialogTitle>
                <p className="text-xs text-ink-soft">
                  {new Date().toLocaleDateString('en-IN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    timeZone: 'Asia/Kolkata',
                  })}
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 my-2 text-left">
            {/* Metric preview cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-parchment bg-cream-deep/40 text-center">
                <p className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider">
                  Total Orders
                </p>
                <p className="text-2xl font-bold font-serif text-ink mt-0.5">
                  {allOrders.length}
                </p>
                <p className="text-[10px] text-ink-soft mt-0.5">
                  {allOrders.filter((o) => o.paymentStatus === 'CONFIRMED').length} Confirmed
                </p>
              </div>
              <div className="p-3 rounded-lg border border-parchment bg-gold/10 text-center">
                <p className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider">
                  Confirmed Revenue
                </p>
                <p className="text-2xl font-bold font-serif text-gold mt-0.5">
                  ₹{ordersQuery.data?.totalRevenue || 0}
                </p>
                <p className="text-[10px] text-green-700 font-semibold mt-0.5">Ready to Rollup</p>
              </div>
            </div>

            {/* Warning if pending orders exist */}
            {(ordersQuery.data?.pendingCount || 0) > 0 && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">
                    {ordersQuery.data?.pendingCount} order(s) pending payment verification!
                  </span>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Ending the day now will archive all active orders and clear the live queue.
                  </p>
                </div>
              </div>
            )}

            <div className="p-3 rounded-lg bg-cream-deep/30 border border-parchment text-xs text-ink-soft space-y-1.5 leading-relaxed">
              <p className="font-semibold text-ink">Accounting &amp; Reset Actions:</p>
              <ul className="list-disc list-inside space-y-1 text-[11px]">
                <li>Today&apos;s orders are saved into the permanent Daily Summaries archive.</li>
                <li>Live active orders queue will reset to zero for tomorrow&apos;s shift.</li>
                <li>Daily Chef Specials are reset back to standard catalog items.</li>
              </ul>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-parchment">
            <Button
              type="button"
              variant="outline"
              disabled={endDayMutation.isPending}
              onClick={() => setIsEndDayModalOpen(false)}
              className="text-xs h-9 px-4 border-parchment"
            >
              Cancel
            </Button>
            <AnimatedButton
              id="confirm-end-day-btn"
              type="button"
              variant="heritage-primary"
              size="default"
              disabled={endDayMutation.isPending || allOrders.length === 0}
              isLoading={endDayMutation.isPending}
              loadingText="Archiving Day..."
              onClick={() => endDayMutation.mutate()}
              className="text-xs h-9 px-4 shadow-sm"
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              Confirm &amp; End Day
            </AnimatedButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
