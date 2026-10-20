import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Package,
  Search,
  CheckCircle,
  Truck,
  MapPin,
  Clock,
  ArrowRight,
  Phone,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export const OrderTracking = () => {
  const [searchParams] = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(searchParams.get('orderNumber') || '');
  const [phone, setPhone] = useState(searchParams.get('phone') || '');
  const storeSlug = searchParams.get('slug') || '';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!orderNumber || !phone) {
      setError('Please provide both Order Number and registered Mobile Number');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const storeQuery = storeSlug ? `&slug=${encodeURIComponent(storeSlug)}` : '';
      const res = await fetch(
        `/api/public/orders/track?orderNumber=${encodeURIComponent(
          orderNumber.trim()
        )}&phone=${encodeURIComponent(phone.trim())}${storeQuery}`
      );
      const data = await res.json();
      if (data.success) {
        setOrder(data.data);
      } else {
        setError(data.message || 'No matching order found');
        setOrder(null);
      }
    } catch (err) {
      setError(err.message || 'Error tracking order');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const stages = ['NEW', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
  const currentStageIndex = order ? stages.indexOf(order.orderStatus) : -1;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col items-center p-6 selection:bg-indigo-500 selection:text-white">
      <div className="max-w-xl w-full space-y-6 pt-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-2xl mb-2 shadow-xs">
            <Truck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">Track Your Order</h1>
          <p className="text-xs text-slate-500">
            Enter your order number and 10-digit mobile number to see the current recorded delivery status.
          </p>
        </div>

        {/* Search Form */}
        <form
          onSubmit={handleTrack}
          className="bg-white border border-slate-200/90 p-5 rounded-3xl shadow-xl space-y-4"
        >
          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-700 block mb-1 font-semibold">Order Number</label>
              <input
                type="text"
                placeholder="e.g. ORD-840414-129"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-mono uppercase tracking-wider focus:outline-none focus:bg-white focus:border-indigo-500 transition"
              />
            </div>
            <div>
              <label className="text-slate-700 block mb-1 font-semibold">Registered Phone Number</label>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              'Searching Order...'
            ) : (
              <>
                <Search className="w-4 h-4" /> Track Package
              </>
            )}
          </button>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </form>

        {/* Tracking Details Card */}
        {order && (
          <div className="bg-white border border-slate-200/90 p-6 rounded-3xl shadow-xl space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono">Order Reference</span>
                <div className="font-mono font-bold text-slate-900 text-base">{order.orderNumber}</div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 border border-indigo-200 text-indigo-700">
                {order.orderStatus}
              </span>
            </div>

            {/* Stepper Progression */}
            <div className="space-y-2">
              <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                <span>Placed</span>
                <span>Confirmed</span>
                <span>Dispatched</span>
                <span>Delivered</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-500 h-full transition-all duration-500"
                  style={{
                    width:
                      order.orderStatus === 'NEW'
                        ? '25%'
                        : order.orderStatus === 'CONFIRMED'
                        ? '50%'
                        : order.orderStatus === 'SHIPPED'
                        ? '75%'
                        : order.orderStatus === 'DELIVERED'
                        ? '100%'
                        : '10%',
                  }}
                />
              </div>
            </div>

            {/* Courier & Tracking Info */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-slate-400 text-[10px]">Courier Partner:</div>
                <div className="text-slate-900 font-bold">{order.courierPartner || 'Assigned soon'}</div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px]">Tracking Number (AWB):</div>
                <div className="text-indigo-600 font-mono font-semibold">
                  {order.trackingNumber || 'Pending dispatch'}
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Progression History
              </div>
              <div className="border-l-2 border-slate-200 ml-2 pl-4 space-y-3 text-xs">
                {order.timeline?.map((ev, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 border border-white" />
                    <div className="font-semibold text-slate-900 flex items-center gap-2">
                      <span>{ev.status}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {new Date(ev.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-slate-500 text-[11px]">{ev.note}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Items Summary */}
            <div className="pt-4 border-t border-slate-100 text-xs space-y-2">
              <div className="font-semibold text-slate-900">Items in this Package:</div>
              <div className="divide-y divide-slate-100">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="py-2 flex justify-between text-slate-600">
                    <div>
                      {item.name} {item.variantName && `(${item.variantName})`} × {item.quantity}
                    </div>
                    <div className="font-bold text-slate-900">₹{item.subtotal}</div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold text-sm text-slate-900 pt-2 border-t border-slate-100">
                <span>Total Amount Paid / Payable:</span>
                <span className="text-emerald-600">₹{order.totalAmount}</span>
              </div>
            </div>
          </div>
        )}

        <div className="text-center pt-4">
          <Link to="/" className="text-xs text-slate-500 hover:text-slate-700">
            &larr; Back to Omniva Home
          </Link>
        </div>
      </div>
    </div>
  );
};
