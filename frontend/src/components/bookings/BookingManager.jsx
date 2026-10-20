import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/useAuth';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Camera,
  CheckCircle,
  AlertCircle,
  Plus,
  RefreshCw,
  Search,
  Phone,
  DollarSign,
  UserCheck,
  Eye,
  Trash2,
  Tag
} from 'lucide-react';

export const BookingManager = () => {
  const { token, tenant } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('bookings'); // 'bookings' | 'packages'
  const [bookings, setBookings] = useState([]);
  const [packages, setPackages] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // New Package Modal state
  const [showPkgModal, setShowPkgModal] = useState(false);
  const [pkgName, setPkgName] = useState('');
  const [pkgPrice, setPkgPrice] = useState('');
  const [pkgDuration, setPkgDuration] = useState('');
  const [pkgAdvance, setPkgAdvance] = useState('');
  const [pkgDeliverables, setPkgDeliverables] = useState('');
  const [pkgDesc, setPkgDesc] = useState('');

  // Update modal state
  const [advanceInput, setAdvanceInput] = useState('');
  const [staffInput, setStaffInput] = useState('');
  const [statusNote, setStatusNote] = useState('');

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedStatus !== 'ALL') params.append('bookingStatus', selectedStatus);
      if (searchQuery) params.append('search', searchQuery);

      const [bRes, sRes, pRes] = await Promise.all([
        fetch(`/api/bookings?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/bookings/stats', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/packages', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const [bData, sData, pData] = await Promise.all([bRes.json(), sRes.json(), pRes.json()]);
      if (bData.success) setBookings(bData.data);
      if (sData.success) setStats(sData.data);
      if (pData.success) setPackages(pData.data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [selectedStatus, searchQuery]);

  const handleUpdateBooking = async (bookingId, newStatus, extraData = {}) => {
    try {
      setIsUpdating(true);
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingStatus: newStatus,
          note: extraData.note || `Stage updated to ${newStatus}`,
          assignedStaffName: extraData.assignedStaffName,
          advancePaid: extraData.advancePaid,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedBooking(data.data);
        fetchBookings();
        setAdvanceInput('');
        setStaffInput('');
        setStatusNote('');
      } else {
        alert(data.message || 'Failed to update booking');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreatePackage = async (e) => {
    e.preventDefault();
    if (!pkgName || !pkgPrice) return;
    try {
      const res = await fetch('/api/packages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: pkgName,
          price: Number(pkgPrice),
          duration: pkgDuration,
          advanceTokenPercent: Number(pkgAdvance),
          description: pkgDesc,
          deliverables: pkgDeliverables ? pkgDeliverables.split(',').map((s) => s.trim()) : [],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowPkgModal(false);
        setPkgName('');
        setPkgPrice('');
        setPkgDeliverables('');
        setPkgDesc('');
        fetchBookings();
      } else {
        alert(data.message || 'Failed to create package');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      PENDING: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', label: 'Pending Enquiry' },
      CONFIRMED: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', label: 'Confirmed' },
      IN_PROGRESS: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', label: 'In Progress' },
      COMPLETED: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', label: 'Completed' },
      CANCELLED: { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400', label: 'Cancelled' },
    };
    const c = config[status] || config.PENDING;
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${c.bg} ${c.border} ${c.text}`}>
        {c.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="text-xs text-slate-400">Total Bookings</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{stats.totalBookings}</div>
            <div className="text-[11px] text-indigo-400 mt-1">Confirmed & Scheduled</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="text-xs text-slate-400">Total Booked Value</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              ₹{(stats.finances?.totalBookedValue || 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Advance: ₹{(stats.finances?.advanceCollected || 0).toLocaleString('en-IN')}
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="text-xs text-slate-400">Upcoming Shoots</div>
            <div className="text-2xl font-black text-amber-400 mt-1">
              {stats.statusCounts?.CONFIRMED || 0}
            </div>
            <div className="text-[11px] text-amber-400/80 mt-1">
              {stats.statusCounts?.PENDING || 0} enquiries pending
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="text-xs text-slate-400">Balance Pending</div>
            <div className="text-2xl font-black text-cyan-400 mt-1">
              ₹{(stats.finances?.balanceDue || 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-emerald-400 mt-1">To collect at event</div>
          </div>
        </div>
      )}

      {/* Control Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white border border-slate-200 p-3 rounded-2xl shadow-xs">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('bookings')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeSubTab === 'bookings' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Scheduled Bookings ({bookings.length})
          </button>
          <button
            onClick={() => setActiveSubTab('packages')}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeSubTab === 'packages' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Service Packages ({packages.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === 'bookings' ? (
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search booking #, client, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:bg-white"
              />
            </div>
          ) : (
            <button
              onClick={() => setShowPkgModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-slate-900 font-semibold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Create Package
            </button>
          )}

          <button
            onClick={fetchBookings}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Bookings View */}
      {activeSubTab === 'bookings' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Booking #</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Event Date</th>
                  <th className="py-3 px-4">Package</th>
                  <th className="py-3 px-4">Amount / Advance</th>
                  <th className="py-3 px-4">Assigned Staff</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {loading && bookings.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-500">
                      Loading bookings...
                    </td>
                  </tr>
                ) : bookings.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-500">
                      <Calendar className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-50" />
                      No bookings found.
                    </td>
                  </tr>
                ) : (
                  bookings.map((b) => (
                    <tr key={b._id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {b.bookingNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{b.customerName}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-500" />
                          {b.customerPhone}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-amber-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(b.eventDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-[10px] text-slate-500">{b.timeSlot}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800 max-w-[160px] truncate">
                        {b.packageName}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">₹{b.totalAmount}</div>
                        <div className="text-[10px] text-emerald-400">
                          Adv: ₹{b.advancePaid} | Due: ₹{b.balanceDue}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-[10px] text-slate-700 border border-slate-200">
                          <UserCheck className="w-3 h-3 text-indigo-400" />
                          {b.assignedStaffName || 'Unassigned'}
                        </span>
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(b.bookingStatus)}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="px-3 py-1 bg-slate-100 hover:bg-indigo-600 text-slate-700 hover:text-white rounded-lg font-medium transition text-xs flex items-center gap-1 ml-auto"
                        >
                          <Eye className="w-3 h-3" /> Manage
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Packages View */}
      {activeSubTab === 'packages' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <div
              key={pkg._id}
              className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xs"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                    {pkg.category}
                  </span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {pkg.duration}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base">{pkg.name}</h3>
                {pkg.description && (
                  <p className="text-xs text-slate-400 line-clamp-2">{pkg.description}</p>
                )}

                {pkg.deliverables?.length > 0 && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] space-y-1">
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">Deliverables:</div>
                    {pkg.deliverables.map((d, i) => (
                      <div key={i} className="text-slate-300 flex items-center gap-1.5">
                        <CheckCircle className="w-3 h-3 text-emerald-400" /> {d}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-base font-black text-slate-900">₹{pkg.price}</div>
                  <div className="text-[10px] text-emerald-400">
                    {pkg.advanceTokenPercent}% Token (₹{Math.round((pkg.price * pkg.advanceTokenPercent) / 100)})
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Details / Manage Drawer */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-xl bg-white border-l border-slate-200 h-full overflow-y-auto p-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-start justify-between pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900 font-mono">{selectedBooking.bookingNumber}</h3>
                    {getStatusBadge(selectedBooking.bookingStatus)}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    For {new Date(selectedBooking.eventDate).toLocaleDateString('en-IN', { dateStyle: 'full' })}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              {/* Status Action Workflow Bar */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Update Booking Stage
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedBooking.bookingStatus === 'PENDING' && (
                    <button
                      onClick={() => handleUpdateBooking(selectedBooking._id, 'CONFIRMED')}
                      disabled={isUpdating}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-slate-900 font-semibold text-xs transition flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Confirm Dates
                    </button>
                  )}

                  {selectedBooking.bookingStatus === 'CONFIRMED' && (
                    <button
                      onClick={() => handleUpdateBooking(selectedBooking._id, 'IN_PROGRESS')}
                      disabled={isUpdating}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-slate-900 font-semibold text-xs transition flex items-center gap-1.5"
                    >
                      <Camera className="w-3.5 h-3.5" /> Start Shoot / Tour
                    </button>
                  )}

                  {selectedBooking.bookingStatus === 'IN_PROGRESS' && (
                    <button
                      onClick={() => handleUpdateBooking(selectedBooking._id, 'COMPLETED')}
                      disabled={isUpdating}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-semibold text-xs transition flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Mark Completed & Delivered
                    </button>
                  )}

                  {selectedBooking.bookingStatus !== 'CANCELLED' && selectedBooking.bookingStatus !== 'COMPLETED' && (
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to cancel this booking?')) {
                          handleUpdateBooking(selectedBooking._id, 'CANCELLED', { note: 'Cancelled by merchant' });
                        }
                      }}
                      disabled={isUpdating}
                      className="px-3 py-1.5 rounded-xl bg-rose-900/40 hover:bg-rose-900/60 text-rose-300 font-semibold text-xs border border-rose-800/50"
                    >
                      Cancel Booking
                    </button>
                  )}
                </div>
              </div>

              {/* Staff Assignment & Payment Recording Form */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-indigo-400" /> Assign Crew & Record Payment
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-600 font-medium block mb-1">Assign Lead Staff</label>
                    <input
                      type="text"
                      placeholder="e.g. Vikram Photographer"
                      value={staffInput}
                      onChange={(e) => setStaffInput(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 font-medium block mb-1">Total Advance Collected (₹)</label>
                    <input
                      type="number"
                      placeholder={selectedBooking.advancePaid?.toString()}
                      value={advanceInput}
                      onChange={(e) => setAdvanceInput(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-slate-800"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() =>
                      handleUpdateBooking(selectedBooking._id, selectedBooking.bookingStatus, {
                        assignedStaffName: staffInput || selectedBooking.assignedStaffName,
                        advancePaid: advanceInput !== '' ? Number(advanceInput) : selectedBooking.advancePaid,
                        note: 'Staff assignment and payment updated',
                      })
                    }
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-slate-900 font-semibold text-xs"
                  >
                    Save Changes
                  </button>
                </div>
              </div>

              {/* Client & Booking Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-400" /> Client Details
                  </div>
                  <div className="text-slate-300 font-semibold">{selectedBooking.customerName}</div>
                  <div className="text-slate-400">{selectedBooking.customerPhone}</div>
                  <div className="text-slate-400">{selectedBooking.customerEmail || 'No email provided'}</div>
                  <div className="pt-2">
                    <a
                      href={`https://wa.me/91${selectedBooking.customerPhone.replace(/\D/g, '').slice(-10)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-semibold"
                    >
                      <Phone className="w-3 h-3" /> WhatsApp Client
                    </a>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" /> Schedule & Financials
                  </div>
                  <div>
                    <div className="text-slate-500 text-[10px]">Package:</div>
                    <div className="text-slate-900 font-semibold">{selectedBooking.packageName}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[10px]">Total Fee / Advance / Due:</div>
                    <div className="text-slate-900 font-semibold">
                      ₹{selectedBooking.totalAmount} (Adv: ₹{selectedBooking.advancePaid} | Due: <span className="text-amber-400">₹{selectedBooking.balanceDue}</span>)
                    </div>
                  </div>
                </div>
              </div>

              {/* Passengers if Travel */}
              {selectedBooking.passengers?.length > 0 && (
                <div className="space-y-2 text-xs">
                  <div className="font-bold text-slate-900 uppercase tracking-wider">Passenger Roster</div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 divide-y divide-slate-200">
                    {selectedBooking.passengers.map((p, i) => (
                      <div key={i} className="py-1.5 flex justify-between text-slate-300">
                        <span>{p.name} ({p.age} yrs, {p.gender})</span>
                        <span className="text-cyan-400">Seat {p.seatNo || 'Auto'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="space-y-3 text-xs">
                <div className="font-bold text-slate-900 uppercase tracking-wider">Audit Trail</div>
                <div className="border-l-2 border-slate-200 ml-2 pl-4 space-y-3">
                  {selectedBooking.timeline?.map((ev, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 border-white" />
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        <span>{ev.status}</span>
                        <span className="text-[10px] text-slate-500">{new Date(ev.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="text-slate-400 text-[11px]">{ev.note}</div>
                      <div className="text-slate-500 text-[10px]">by {ev.updatedBy}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <button
                onClick={() => setSelectedBooking(null)}
                className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Package Modal */}
      {showPkgModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Create Service / Shoot Package</h3>
              <button onClick={() => setShowPkgModal(false)} className="text-slate-500 hover:text-slate-900">✕</button>
            </div>
            <form onSubmit={handleCreatePackage} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-medium block mb-1">Package Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Standard Consultation / 3-Day Tour"
                  value={pkgName}
                  onChange={(e) => setPkgName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Package Price (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="25000"
                    value={pkgPrice}
                    onChange={(e) => setPkgPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium block mb-1">Advance Token (%)</label>
                  <input
                    type="number"
                    placeholder="20"
                    value={pkgAdvance}
                    onChange={(e) => setPkgAdvance(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-700 font-medium block mb-1">Duration</label>
                <input
                  type="text"
                  placeholder="e.g. 6 Hours / 3 Days"
                  value={pkgDuration}
                  onChange={(e) => setPkgDuration(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:bg-white"
                />
              </div>
              <div>
                <label className="text-slate-700 font-medium block mb-1">Deliverables (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Included service, item, or session"
                  value={pkgDeliverables}
                  onChange={(e) => setPkgDeliverables(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:bg-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPkgModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-slate-900 font-semibold rounded-xl"
                >
                  Save Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
