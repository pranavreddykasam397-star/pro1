'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc/client';
import { toast } from 'sonner';
import { QrCode, TrendingUp, IndianRupee, Calendar, Eye, Save } from 'lucide-react';

export function SettingsAnalytics() {
  const [upiIdInput, setUpiIdInput] = useState('');
  const [ownerQrInput, setOwnerQrInput] = useState('');
  const [selectedArchive, setSelectedArchive] = useState<{ date: string; orders: any[] } | null>(null);

  // Settings query & mutation
  const configQuery = trpc.settings.getConfig.useQuery();

  useEffect(() => {
    if (configQuery.data?.upiId && !upiIdInput) {
      setUpiIdInput(configQuery.data.upiId);
    }
    if (configQuery.data?.ownerQr && !ownerQrInput) {
      setOwnerQrInput(configQuery.data.ownerQr);
    }
  }, [configQuery.data]);

  const updateConfigMutation = trpc.settings.updateConfig.useMutation({
    onSuccess: () => {
      configQuery.refetch();
      toast.success('Restaurant payment configuration saved!');
    },
  });

  // Daily Summaries Query
  const dailySummariesQuery = trpc.order.getDailySummaries.useQuery();

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateConfigMutation.mutateAsync({
        upiId: upiIdInput.trim() || undefined,
        ownerQr: ownerQrInput.trim() || undefined,
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings');
    }
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setOwnerQrInput(reader.result as string);
      toast.success('QR Code image attached!');
    };
    reader.readAsDataURL(file);
  };

  const summaries = dailySummariesQuery.data || [];

  return (
    <div className="space-y-6">
      {/* Payment Settings Card */}
      <Card className="border-parchment bg-white shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="border-b border-parchment py-4">
          <CardTitle className="font-serif text-xl font-bold text-ink flex items-center gap-2">
            <QrCode className="w-5 h-5 text-gold" /> UPI Payment Configuration
          </CardTitle>
          <CardDescription className="text-xs text-ink-soft">
            Update the UPI ID and QR code image presented to dining patrons on the checkout drawer.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSaveSettings} className="space-y-4 max-w-xl">
            <div className="space-y-1.5">
              <Label htmlFor="upiId" className="text-xs font-semibold">
                Restaurant UPI ID (VPA)
              </Label>
              <Input
                id="upiId"
                placeholder="e.g. 9392767835@ybl"
                value={upiIdInput || configQuery.data?.upiId || ''}
                onChange={(e) => setUpiIdInput(e.target.value)}
                className="bg-cream-deep/40 text-sm font-mono"
              />
              <p className="text-[11px] text-ink-soft">
                All customer UPI QR codes will route payments directly to this VPA.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="qrUpload" className="text-xs font-semibold">
                Custom Static QR Code Image (Optional)
              </Label>
              <Input
                id="qrUpload"
                type="file"
                accept="image/*"
                onChange={handleQrUpload}
                className="bg-cream-deep/40 text-xs"
              />
              {ownerQrInput && (
                <div className="mt-2 w-28 h-28 border border-parchment rounded-lg p-1">
                  <img src={ownerQrInput} alt="QR Preview" className="w-full h-full object-contain" />
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={updateConfigMutation.isPending}
              className="bg-gold hover:bg-gold-light text-white font-semibold text-xs px-6 shadow-sm flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" /> Save Configuration
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Daily Sales Summaries */}
      <Card className="border-parchment bg-white shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="border-b border-parchment py-4">
          <CardTitle className="font-serif text-xl font-bold text-ink flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gold" /> Daily Revenue Rollups & Archives
          </CardTitle>
          <CardDescription className="text-xs text-ink-soft">
            Historical day-end accounting metrics and archived receipts.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          {summaries.length === 0 ? (
            <div className="text-center py-10 text-xs text-ink-soft space-y-1">
              <Calendar className="w-8 h-8 text-parchment mx-auto" />
              <p>No historical daily summaries compiled yet.</p>
              <p className="text-[11px] text-ink-soft/70">
                End-of-day revenue will automatically roll up here.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-cream-deep/60 border-b border-parchment text-ink uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Orders Count</th>
                  <th className="py-3 px-4">Total Revenue</th>
                  <th className="py-3 px-4 text-right">Archived Receipts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-parchment/60">
                {summaries.map((summary) => (
                  <tr key={summary.id} className="hover:bg-cream/40">
                    <td className="py-3 px-4 font-bold text-ink">{summary.date}</td>
                    <td className="py-3 px-4 text-ink-soft">{summary.orderCount} orders</td>
                    <td className="py-3 px-4 font-serif font-bold text-sm text-gold">
                      ₹{summary.totalRevenue}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setSelectedArchive({
                            date: summary.date,
                            orders: summary.ordersJson as any[],
                          })
                        }
                        className="text-xs text-gold hover:text-gold-light flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Inspect Day Log
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Archive Inspection Modal */}
      <Dialog open={!!selectedArchive} onOpenChange={() => setSelectedArchive(null)}>
        <DialogContent className="sm:max-w-lg bg-white border-parchment p-6">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-ink">
              Archived Orders: {selectedArchive?.date}
            </DialogTitle>
          </DialogHeader>

          <div className="max-h-[50vh] overflow-y-auto space-y-2 mt-2">
            {selectedArchive?.orders?.map((ord, i) => (
              <div key={i} className="p-3 rounded-lg border border-parchment bg-cream-deep/30 text-xs space-y-1">
                <div className="flex justify-between font-bold text-ink">
                  <span>Order #{ord.id}</span>
                  <span>₹{ord.total}</span>
                </div>
                <div className="text-[11px] text-ink-soft">
                  {ord.items?.map((it: any) => `${it.quantity}x ${it.menu_name}`).join(', ')}
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            onClick={() => setSelectedArchive(null)}
            className="w-full bg-gold hover:bg-gold-light text-white text-xs font-semibold mt-3"
          >
            Close Archive
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
