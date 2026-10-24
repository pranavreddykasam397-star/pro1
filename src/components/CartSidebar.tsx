'use client';

import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DiscountMiniGame } from './DiscountMiniGame';
import { trpc } from '@/lib/trpc/client';
import { toast } from 'sonner';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Sparkles,
  QrCode,
  Copy,
  CheckCircle2,
  Lock,
  ArrowRight,
  Upload,
} from 'lucide-react';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  type: string;
}

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (id: number, delta: number) => void;
  onRemoveItem: (id: number) => void;
  onClearCart: () => void;
  upiId?: string;
  ownerQr?: string;
}

export function CartSidebar({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  upiId = '9392767835@ybl',
  ownerQr,
}: CartSidebarProps) {
  // Steps: 'cart' | 'auth' | 'payment' | 'success'
  const [step, setStep] = useState<'cart' | 'auth' | 'payment' | 'success'>('cart');
  const [showGame, setShowGame] = useState(false);
  const [discount, setDiscount] = useState(0);

  // Customer Auth State
  const [customerIdInput, setCustomerIdInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [authenticatedCustomer, setAuthenticatedCustomer] = useState<{
    id: number;
    pin: string;
    phone?: string | null;
  } | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('customerAuth');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return null;
  });

  // Payment State
  const [paymentScreenshot, setPaymentScreenshot] = useState<string>('');
  const [placedOrderId, setPlacedOrderId] = useState<number | null>(null);

  // tRPC Mutations
  const signupMutation = trpc.customer.signup.useMutation();
  const loginMutation = trpc.customer.login.useMutation();
  const createOrderMutation = trpc.order.createOrder.useMutation();

  // Price calculations
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const finalTotal = Math.max(0, subtotal - discount);

  // Handle Game Win
  const handleGameWin = (amount: number) => {
    setDiscount(amount);
    toast.success(`🎉 ₹${amount} discount applied to your cart!`);
  };

  // Customer Login / Signup
  const handleCustomerAuth = async () => {
    if (!/^\d{4}$/.test(pinInput.trim())) {
      return toast.error('PIN must be exactly 4 digits.');
    }

    try {
      if (isNewCustomer) {
        const res = await signupMutation.mutateAsync({
          pin: pinInput.trim(),
          phone: phoneInput.trim() || undefined,
        });

        setAuthenticatedCustomer(res.customer);
        localStorage.setItem('customerAuth', JSON.stringify(res.customer));
        toast.success(`Welcome! Your Customer ID is #${res.customer.id}. Keep your PIN safe.`);
        setStep('payment');
      } else {
        const custId = parseInt(customerIdInput.trim(), 10);
        if (isNaN(custId)) {
          return toast.error('Please enter a valid Customer ID.');
        }

        const res = await loginMutation.mutateAsync({
          customerId: custId,
          pin: pinInput.trim(),
        });

        setAuthenticatedCustomer(res.customer);
        localStorage.setItem('customerAuth', JSON.stringify(res.customer));
        toast.success(`Welcome back, Customer #${res.customer.id}!`);
        setStep('payment');
      }
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed');
    }
  };

  // Screenshot Upload (FileReader to Base64)
  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      return toast.error('File too large. Max screenshot size is 5MB.');
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPaymentScreenshot(reader.result as string);
      toast.success('Payment receipt screenshot attached!');
    };
    reader.readAsDataURL(file);
  };

  // Submit Order
  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;

    try {
      const order = await createOrderMutation.mutateAsync({
        total: finalTotal,
        discountApplied: discount,
        method: 'QR',
        customerId: authenticatedCustomer?.id || undefined,
        phone: authenticatedCustomer?.phone || undefined,
        paymentScreenshot: paymentScreenshot || undefined,
        items: cart.map((i) => ({
          menu_name: i.name,
          quantity: i.quantity,
          price_at_time: i.price,
        })),
      });

      setPlacedOrderId(order.id);
      setStep('success');
      onClearCart();
      toast.success('Order placed successfully! Waiting for kitchen confirmation.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to place order.');
    }
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText(upiId);
    toast.success('UPI ID copied to clipboard!');
  };

  const resetAll = () => {
    setStep('cart');
    setShowGame(false);
    setPaymentScreenshot('');
    setPlacedOrderId(null);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md flex flex-col justify-between p-6 bg-cream text-ink overflow-y-auto">
        <SheetHeader className="border-b border-parchment pb-4">
          <SheetTitle className="font-serif text-2xl font-bold text-ink flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-gold" />
              {step === 'cart' && 'Your Dining Cart'}
              {step === 'auth' && 'Customer Verification'}
              {step === 'payment' && 'UPI QR Payment'}
              {step === 'success' && 'Order Confirmed!'}
            </span>
            {cart.length > 0 && step === 'cart' && (
              <Badge variant="outline" className="text-xs border-gold text-gold font-sans">
                {cart.reduce((sum, i) => sum + i.quantity, 0)} items
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        {/* STEP 1: CART ITEMS & DISCOUNT GAME */}
        {step === 'cart' && (
          <div className="flex-1 py-4 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <ShoppingBag className="w-12 h-12 text-parchment mx-auto" />
                <p className="font-serif text-lg text-ink-soft">Your cart is currently empty.</p>
                <p className="text-xs text-ink-soft">Explore our handcrafted Indian menu and add your favorite dishes.</p>
              </div>
            ) : (
              <>
                {/* Cart Items List */}
                <div className="space-y-3 max-h-[35vh] overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-white border border-parchment shadow-sm"
                    >
                      <div className="flex-1 pr-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              item.type === 'veg' ? 'bg-green-600' : 'bg-red-600'
                            }`}
                          />
                          <h4 className="font-medium text-sm text-ink line-clamp-1">{item.name}</h4>
                        </div>
                        <p className="text-xs text-gold font-semibold mt-0.5">₹{item.price}</p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          className="w-7 h-7 rounded bg-cream-deep hover:bg-parchment text-ink flex items-center justify-center transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          className="w-7 h-7 rounded bg-cream-deep hover:bg-parchment text-ink flex items-center justify-center transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.id)}
                          className="w-7 h-7 ml-1 text-destructive/70 hover:text-destructive flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Gamified Discount Trigger */}
                {discount === 0 ? (
                  !showGame ? (
                    <button
                      type="button"
                      onClick={() => setShowGame(true)}
                      className="w-full p-3 rounded-xl border border-dashed border-gold bg-gold/10 hover:bg-gold/20 flex items-center justify-between text-xs text-ink font-semibold transition-colors"
                    >
                      <span className="flex items-center gap-2 text-gold">
                        <Sparkles className="w-4 h-4 animate-spin text-gold" />
                        Play Mini-Game to Unlock ₹50 Discount!
                      </span>
                      <ArrowRight className="w-4 h-4 text-gold" />
                    </button>
                  ) : (
                    <DiscountMiniGame
                      onWin={handleGameWin}
                      onClose={() => setShowGame(false)}
                    />
                  )
                ) : (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between text-xs text-green-700">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <Sparkles className="w-4 h-4 text-green-600" /> ₹{discount} Mini-Game Discount Applied!
                    </span>
                    <button
                      type="button"
                      onClick={() => setDiscount(0)}
                      className="text-xs text-destructive hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* STEP 2: CUSTOMER PIN AUTH */}
        {step === 'auth' && (
          <div className="flex-1 py-4 space-y-4">
            <div className="p-3 bg-white rounded-lg border border-parchment text-xs text-ink-soft space-y-1">
              <p className="font-semibold text-ink flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-gold" /> Quick Customer Identification
              </p>
              <p>
                We use a lightweight 4-digit PIN system so you can track your live orders without remembering passwords.
              </p>
            </div>

            <div className="flex rounded-md border border-parchment p-1 bg-cream-deep">
              <button
                type="button"
                onClick={() => setIsNewCustomer(false)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded ${
                  !isNewCustomer ? 'bg-white text-ink shadow-sm' : 'text-ink-soft'
                }`}
              >
                Existing Customer
              </button>
              <button
                type="button"
                onClick={() => setIsNewCustomer(true)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded ${
                  isNewCustomer ? 'bg-white text-ink shadow-sm' : 'text-ink-soft'
                }`}
              >
                New Customer
              </button>
            </div>

            {!isNewCustomer ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="custId" className="text-xs font-semibold">
                    Customer ID
                  </Label>
                  <Input
                    id="custId"
                    type="number"
                    placeholder="e.g. 10245"
                    value={customerIdInput}
                    onChange={(e) => setCustomerIdInput(e.target.value)}
                    className="bg-white text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pin" className="text-xs font-semibold">
                    4-Digit PIN
                  </Label>
                  <Input
                    id="pin"
                    type="password"
                    maxLength={4}
                    placeholder="••••"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    className="bg-white text-sm text-center tracking-widest font-bold"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="newPin" className="text-xs font-semibold">
                    Create 4-Digit PIN
                  </Label>
                  <Input
                    id="newPin"
                    type="password"
                    maxLength={4}
                    placeholder="••••"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    className="bg-white text-sm text-center tracking-widest font-bold"
                  />
                  <p className="text-[11px] text-ink-soft">
                    You will receive an auto-generated Customer ID to use with this PIN.
                  </p>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phone" className="text-xs font-semibold">
                    Phone Number (Optional)
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="bg-white text-sm"
                  />
                </div>
              </div>
            )}

            <Button
              type="button"
              onClick={handleCustomerAuth}
              disabled={signupMutation.isPending || loginMutation.isPending}
              className="w-full bg-gold hover:bg-gold-light text-white font-semibold text-sm mt-4"
            >
              {signupMutation.isPending || loginMutation.isPending
                ? 'Verifying...'
                : isNewCustomer
                ? 'Create Account & Continue'
                : 'Login & Continue'}
            </Button>
            <button
              type="button"
              onClick={() => setStep('cart')}
              className="w-full text-center text-xs text-ink-soft hover:underline mt-2"
            >
              ← Back to Cart
            </button>
          </div>
        )}

        {/* STEP 3: UPI QR PAYMENT */}
        {step === 'payment' && (
          <div className="flex-1 py-4 space-y-4">
            <div className="p-4 bg-white rounded-xl border border-parchment shadow-sm text-center space-y-3">
              <Badge className="bg-gold text-white font-sans text-xs">Scan & Pay via UPI</Badge>
              <h4 className="font-serif text-2xl font-bold text-ink">₹{finalTotal}</h4>

              {/* Dynamic QR Display */}
              <div className="w-48 h-48 mx-auto bg-parchment/40 rounded-xl flex items-center justify-center p-2 border border-gold/30">
                {ownerQr ? (
                  <img src={ownerQr} alt="Owner UPI QR" className="w-full h-full object-contain" />
                ) : (
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=${encodeURIComponent(
                      upiId
                    )}%26pn=Heritage%20Restaurant%26am=${finalTotal}%26cu=INR`}
                    alt="Dynamic UPI QR"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              {/* Copy UPI ID */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-cream-deep border border-parchment text-xs">
                <span className="font-mono text-ink-soft truncate mr-2">{upiId}</span>
                <button
                  type="button"
                  onClick={copyUpiId}
                  className="flex items-center gap-1 text-gold font-semibold hover:underline"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy
                </button>
              </div>
            </div>

            {/* Receipt Screenshot Upload */}
            <div className="space-y-2">
              <Label htmlFor="screenshot" className="text-xs font-semibold text-ink flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-gold" /> Attach Payment Screenshot
              </Label>
              <Input
                id="screenshot"
                type="file"
                accept="image/*"
                onChange={handleScreenshotUpload}
                className="bg-white text-xs file:text-gold file:font-semibold"
              />
              {paymentScreenshot && (
                <p className="text-xs text-green-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Screenshot successfully attached
                </p>
              )}
            </div>

            <Button
              type="button"
              onClick={handlePlaceOrder}
              disabled={createOrderMutation.isPending}
              className="w-full bg-gold hover:bg-gold-light text-white font-semibold text-sm py-5 mt-2"
            >
              {createOrderMutation.isPending ? 'Submitting Order...' : 'Confirm & Place Order'}
            </Button>
            <button
              type="button"
              onClick={() => setStep('auth')}
              className="w-full text-center text-xs text-ink-soft hover:underline"
            >
              ← Back
            </button>
          </div>
        )}

        {/* STEP 4: ORDER CONFIRMATION */}
        {step === 'success' && (
          <div className="flex-1 py-12 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-ink">Order Received!</h3>
            <p className="text-sm text-ink-soft">
              Order <span className="font-bold text-gold">#{placedOrderId}</span> has been dispatched to the kitchen.
            </p>
            {authenticatedCustomer && (
              <div className="p-3 bg-white rounded-lg border border-parchment text-xs text-ink-soft">
                Customer ID: <span className="font-bold text-ink">#{authenticatedCustomer.id}</span>
                <br />
                Use your 4-digit PIN anytime to view this order in your order tracker.
              </div>
            )}
            <Button
              type="button"
              onClick={resetAll}
              className="bg-gold hover:bg-gold-light text-white font-semibold text-sm px-8"
            >
              Back to Menu
            </Button>
          </div>
        )}

        {/* FOOTER TOTALS & CHECKOUT CTA */}
        {step === 'cart' && cart.length > 0 && (
          <SheetFooter className="border-t border-parchment pt-4 flex-col space-y-3">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-ink-soft">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600 font-semibold">
                  <span>Mini-Game Discount</span>
                  <span>- ₹{discount}</span>
                </div>
              )}
              <div className="flex justify-between text-ink font-serif text-lg font-bold pt-1 border-t border-dashed border-parchment">
                <span>Final Total</span>
                <span className="text-gold">₹{finalTotal}</span>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => {
                if (authenticatedCustomer) {
                  setStep('payment');
                } else {
                  setStep('auth');
                }
              }}
              className="w-full bg-gold hover:bg-gold-light text-white font-semibold text-sm py-5 flex items-center justify-center gap-2 shadow-md"
            >
              Proceed to Checkout <ArrowRight className="w-4 h-4" />
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
