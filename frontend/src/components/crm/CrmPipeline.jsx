import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Users, 
  TrendingUp, 
  Search, 
  Plus, 
  Phone, 
  MessageSquare, 
  Clock, 
  AlertCircle, 
  X, 
  Kanban, 
  List, 
  DollarSign,
  PackageCheck,
  Zap,
} from 'lucide-react';

const STAGES = [
  { id: 'NEW', label: 'New Leads', color: 'border-indigo-500/30 bg-indigo-500/5 text-indigo-400' },
  { id: 'CONTACTED', label: 'Contacted', color: 'border-cyan-500/30 bg-cyan-500/5 text-cyan-400' },
  { id: 'QUALIFIED', label: 'Qualified', color: 'border-amber-500/30 bg-amber-500/5 text-amber-400' },
  { id: 'QUOTATION_SENT', label: 'Quote Sent', color: 'border-purple-500/30 bg-purple-500/5 text-purple-400' },
  { id: 'WON', label: 'Won / Deal Closed', color: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400' },
  { id: 'LOST', label: 'Lost', color: 'border-rose-500/30 bg-rose-500/5 text-rose-400' },
];

export const CrmPipeline = () => {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [pipelineSummary, setPipelineSummary] = useState({});
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'table'
  const [search, setSearch] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [callNotes, setCallNotes] = useState('');
  const [callOutcome, setCallOutcome] = useState('CONNECTED');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');

  // New Lead form state
  const [newLeadData, setNewLeadData] = useState({
    name: '',
    phone: '',
    email: '',
    budget: '',
    source: 'META_ADS',
    campaignName: '',
    initialNote: '',
  });

  // Convert Lead to Order state
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [convertingOrder, setConvertingOrder] = useState(false);
  const [convertFormData, setConvertFormData] = useState({
    street: '',
    city: '',
    pincode: '110001',
    price: 299,
    productName: '',
    paymentMethod: 'COD',
    notes: '',
  });

  const fetchLeads = useCallback(async () => {
    try {
      const res = await axios.get('/api/crm/leads', { params: { search } });
      if (res.data.success) {
        setLeads(res.data.leads);
        setPipelineSummary(res.data.pipelineSummary || {});
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
    }
  }, [search]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get('/api/crm/stats');
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
    fetchStats();
  }, [fetchLeads, fetchStats]);

  const handleCreateLead = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/crm/leads', newLeadData);
      if (res.data.success) {
        setIsAddModalOpen(false);
        setNewLeadData({
          name: '',
          phone: '',
          email: '',
          budget: '',
          source: 'META_ADS',
          campaignName: '',
          initialNote: '',
        });
        fetchLeads();
        fetchStats();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating lead');
    }
  };

  const handleUpdateStage = async (leadId, newStatus) => {
    try {
      const res = await axios.patch(`/api/crm/leads/${leadId}/status`, { status: newStatus });
      if (res.data.success) {
        if (selectedLead && selectedLead._id === leadId) {
          setSelectedLead(res.data.lead);
        }
        fetchLeads();
        fetchStats();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating stage');
    }
  };

  const handleOpenConvertModal = () => {
    if (!selectedLead) return;
    setConvertFormData({
      street: selectedLead.customFields?.address || '',
      city: selectedLead.customFields?.city || '',
      pincode: '110001',
      price: selectedLead.budget > 0 ? selectedLead.budget : 299,
      productName: selectedLead.customFields?.productName || selectedLead.campaignName || 'Direct Inquired Product',
      paymentMethod: 'COD',
      notes: '',
    });
    setIsConvertModalOpen(true);
  };

  const handleConvertLeadToOrder = async (e) => {
    e.preventDefault();
    if (!selectedLead) return;

    const cleanPin = (convertFormData.pincode || '').replace(/\D/g, '');
    if (cleanPin.length !== 6 || !/^[1-9][0-9]{5}$/.test(cleanPin)) {
      alert('⚠️ Invalid PIN Code! Please enter a valid 6-digit Indian postal PIN code (e.g. 110001, 400001).');
      return;
    }

    setConvertingOrder(true);
    try {
      const res = await axios.post(`/api/crm/leads/${selectedLead._id}/convert-to-order`, {
        ...convertFormData,
        pincode: cleanPin,
      });
      if (res.data.success) {
        alert(`🎉 Success! Lead converted to Order #${res.data.data.order.orderNumber}. It is now in Orders Management!`);
        setIsConvertModalOpen(false);
        setSelectedLead(res.data.data.lead);
        fetchLeads();
        fetchStats();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error converting lead to order');
    } finally {
      setConvertingOrder(false);
    }
  };

  const handleAddNote = async (leadId) => {
    if (!newNote.trim()) return;
    try {
      const res = await axios.post(`/api/crm/leads/${leadId}/notes`, { note: newNote });
      if (res.data.success) {
        setNewNote('');
        // Refresh lead details
        const updated = await axios.get(`/api/crm/leads/${leadId}`);
        setSelectedLead(updated.data.lead);
        fetchLeads();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding note');
    }
  };

  const handleLogCall = async (leadId) => {
    try {
      const res = await axios.post(`/api/crm/leads/${leadId}/call-logs`, {
        outcome: callOutcome,
        notes: callNotes,
        durationSeconds: 120,
      });
      if (res.data.success) {
        setCallNotes('');
        const updated = await axios.get(`/api/crm/leads/${leadId}`);
        setSelectedLead(updated.data.lead);
        fetchLeads();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error logging call');
    }
  };

  const handleCreateTask = async (leadId) => {
    if (!taskTitle.trim() || !taskDueDate) return;
    try {
      const res = await axios.post(`/api/crm/leads/${leadId}/tasks`, {
        title: taskTitle,
        dueDate: taskDueDate,
      });
      if (res.data.success) {
        setTaskTitle('');
        setTaskDueDate('');
        const updated = await axios.get(`/api/crm/leads/${leadId}`);
        setSelectedLead(updated.data.lead);
        fetchLeads();
        fetchStats();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating task');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top CRM Stats KPI Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-1 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Total Leads</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{stats?.totalLeads ?? leads.length}</div>
          <div className="text-[11px] text-slate-500">All channels combined</div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-1 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Active Pipeline Value</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">
            ₹{Number(stats?.totalPipelineValue || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-emerald-500/80">Estimated Deal Value</div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-1 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Win Rate</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{stats?.winRate || '0.0%'}</div>
          <div className="text-[11px] text-amber-500/80">{stats?.wonLeads || 0} Deals Won</div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-1 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Overdue Follow-ups</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold text-rose-400">{stats?.overdueTasks || 0}</div>
          <div className="text-[11px] text-rose-500/80">Requires immediate call</div>
        </div>
      </div>

      {/* Action Controls & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 p-3 rounded-xl shadow-xs">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads by name, phone, or campaign..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Switcher */}
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition font-medium ${
                viewMode === 'kanban' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" /> Kanban
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition font-medium ${
                viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" /> Table
            </button>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition"
          >
            <Plus className="w-3.5 h-3.5" /> Add Lead
          </button>
        </div>
      </div>

      {/* View Mode 1: Kanban Board */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 min-h-[550px] overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageLeads = leads.filter((l) => l.status === stage.id);
            return (
              <div
                key={stage.id}
                className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col space-y-3 min-w-[240px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{stage.label}</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-800 text-slate-600">
                      {pipelineSummary[stage.id] ?? stageLeads.length}
                    </span>
                  </div>
                </div>

                {/* Cards Container */}
                <div className="space-y-2 flex-1 overflow-y-auto max-h-[580px] pr-1">
                  {stageLeads.length === 0 ? (
                    <div className="h-24 border border-dashed border-slate-800/80 rounded-lg flex items-center justify-center text-[11px] text-slate-600">
                      No leads here
                    </div>
                  ) : (
                    stageLeads.map((lead) => (
                      <div
                        key={lead._id}
                        onClick={() => setSelectedLead(lead)}
                        className="bg-white border border-slate-200 hover:border-indigo-300 p-3 rounded-xl cursor-pointer transition shadow-xs space-y-2.5 group hover:shadow-indigo-500/10"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-300 transition">
                              {lead.name}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">{lead.phone}</div>
                          </div>
                          {lead.budget > 0 && (
                            <span className="text-[11px] font-bold text-emerald-400">
                              ₹{lead.budget.toLocaleString()}
                            </span>
                          )}
                        </div>

                        {lead.campaignName && (
                          <div className="text-[10px] text-indigo-400 truncate bg-indigo-500/5 px-2 py-0.5 rounded border border-indigo-500/10">
                            📢 {lead.campaignName}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-[10px] text-slate-500">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                            {lead.source}
                          </span>
                          
                          {/* 1-Click WhatsApp Quick Action */}
                          <a
                            href={`https://wa.me/91${lead.phone.replace(/\D/g, '')}?text=Hi%20${encodeURIComponent(lead.name)},%20regarding%20your%20enquiry...`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title="Chat on WhatsApp"
                            className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition font-medium"
                          >
                            <MessageSquare className="w-3 h-3" /> WhatsApp
                          </a>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View Mode 2: Table List View */}
      {viewMode === 'table' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Lead Name</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Source / Campaign</th>
                <th className="py-3 px-4">Stage</th>
                <th className="py-3 px-4">Budget</th>
                <th className="py-3 px-4">Assigned To</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {leads.map((lead) => (
                <tr
                  key={lead._id}
                  onClick={() => setSelectedLead(lead)}
                  className="hover:bg-slate-850/60 cursor-pointer transition"
                >
                  <td className="py-3 px-4 font-semibold text-slate-900">{lead.name}</td>
                  <td className="py-3 px-4 text-slate-600 font-mono">{lead.phone}</td>
                  <td className="py-3 px-4">
                    <div className="text-slate-600">{lead.source}</div>
                    {lead.campaignName && (
                      <div className="text-[10px] text-indigo-400 truncate max-w-xs">{lead.campaignName}</div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {lead.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-emerald-400">
                    {lead.budget ? `₹${lead.budget.toLocaleString()}` : '—'}
                  </td>
                  <td className="py-3 px-4 text-slate-500">{lead.assignedToName || 'Unassigned'}</td>
                  <td className="py-3 px-4 text-right">
                    <a
                      href={`https://wa.me/91${lead.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium mr-2"
                    >
                      WhatsApp
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Lead Detail & Timeline Drawer / Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xl bg-white border-l border-slate-200 h-full overflow-y-auto p-6 space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-slate-900">{selectedLead.name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {selectedLead.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-3 mt-1">
                    <span>📞 {selectedLead.phone}</span>
                    {selectedLead.email && <span>✉️ {selectedLead.email}</span>}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Stage Transition Bar */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Update Lead Stage
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {STAGES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleUpdateStage(selectedLead._id, s.id)}
                      className={`text-[11px] font-semibold py-1.5 px-2 rounded-lg border transition ${
                        selectedLead.status === s.id
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Campaign Attribution Box */}
              {selectedLead.campaignName && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                  <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                    Meta Ads Attribution
                  </div>
                  <div className="text-slate-200"><strong>Campaign:</strong> {selectedLead.campaignName}</div>
                  {selectedLead.adSetName && <div className="text-slate-500"><strong>Ad Set:</strong> {selectedLead.adSetName}</div>}
                  {selectedLead.adName && <div className="text-slate-500"><strong>Ad Creative:</strong> {selectedLead.adName}</div>}
                </div>
              )}

              {/* Log Call & Note Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Note Form */}
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-400" /> Add Note
                  </div>
                  <textarea
                    rows={2}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Type meeting note or requirement..."
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={() => handleAddNote(selectedLead._id)}
                    className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
                  >
                    Save Note
                  </button>
                </div>

                {/* Call Log Form */}
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" /> Log Phone Call
                  </div>
                  <select
                    value={callOutcome}
                    onChange={(e) => setCallOutcome(e.target.value)}
                    className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs text-white focus:outline-none"
                  >
                    <option value="CONNECTED">Connected / Discussed</option>
                    <option value="NO_ANSWER">No Answer</option>
                    <option value="BUSY">Line Busy</option>
                    <option value="CALLBACK_REQUESTED">Callback Requested</option>
                  </select>
                  <input
                    type="text"
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    placeholder="Call outcome summary..."
                    className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                  <button
                    onClick={() => handleLogCall(selectedLead._id)}
                    className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
                  >
                    Save Call Log
                  </button>
                </div>
              </div>

              {/* Task Scheduler */}
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" /> Schedule Follow-up Task
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder="Task: Call to confirm sample"
                    className="p-1.5 bg-white border border-slate-200 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                  <input
                    type="datetime-local"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="p-1.5 bg-white border border-slate-200 rounded-lg text-xs text-white focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => handleCreateTask(selectedLead._id)}
                  className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                >
                  Schedule Reminder Task
                </button>
              </div>

              {/* Timeline Feed */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Activity Timeline</h4>
                <div className="space-y-2 border-l-2 border-slate-800 pl-3">
                  {selectedLead.notes?.map((n, i) => (
                    <div key={i} className="text-xs space-y-1 relative">
                      <span className="w-2 h-2 rounded-full bg-indigo-400 absolute -left-[17px] top-1"></span>
                      <div className="text-slate-600">{n.note}</div>
                      <div className="text-[10px] text-slate-500">
                        {n.authorName} • {new Date(n.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                  {selectedLead.callLogs?.map((c, i) => (
                    <div key={i} className="text-xs space-y-1 relative">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 absolute -left-[17px] top-1"></span>
                      <div className="text-emerald-400 font-semibold">📞 Call: {c.outcome}</div>
                      {c.notes && <div className="text-slate-600">{c.notes}</div>}
                      <div className="text-[10px] text-slate-500">
                        {c.loggedByName} • {new Date(c.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2">
              <button
                onClick={handleOpenConvertModal}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition cursor-pointer"
              >
                <PackageCheck className="w-4 h-4 text-emerald-300" /> ⚡ Convert Lead to Order (1-Click)
              </button>
              <a
                href={`https://wa.me/91${selectedLead.phone.replace(/\D/g, '')}?text=Hi%20${encodeURIComponent(selectedLead.name)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition"
              >
                <MessageSquare className="w-4 h-4" /> Open Instant WhatsApp Chat
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" /> Add New Lead
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase">Lead Full Name *</label>
                <input
                  type="text"
                  required
                  value={newLeadData.name}
                  onChange={(e) => setNewLeadData({ ...newLeadData, name: e.target.value })}
                  placeholder="Rahul Verma"
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={newLeadData.phone}
                    onChange={(e) => setNewLeadData({ ...newLeadData, phone: e.target.value })}
                    placeholder="9876543210"
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase">Estimated Budget</label>
                  <input
                    type="number"
                    value={newLeadData.budget}
                    onChange={(e) => setNewLeadData({ ...newLeadData, budget: e.target.value })}
                    placeholder="2500"
                    className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase">Lead Source</label>
                <select
                  value={newLeadData.source}
                  onChange={(e) => setNewLeadData({ ...newLeadData, source: e.target.value })}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                >
                  <option value="META_ADS">Meta Ads (Facebook / Instagram)</option>
                  <option value="WEBSITE">Website Enquiry Form</option>
                  <option value="WHATSAPP">WhatsApp Direct</option>
                  <option value="MANUAL">Manual Phone / Walk-in</option>
                  <option value="REFERRAL">Customer Referral</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase">Campaign Name (Optional)</label>
                <input
                  type="text"
                  value={newLeadData.campaignName}
                  onChange={(e) => setNewLeadData({ ...newLeadData, campaignName: e.target.value })}
                  placeholder="e.g. Diwali Homemade Achar 2026"
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase">Initial Requirement Note</label>
                <textarea
                  rows={2}
                  value={newLeadData.initialNote}
                  onChange={(e) => setNewLeadData({ ...newLeadData, initialNote: e.target.value })}
                  placeholder="Customer requirements..."
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30"
              >
                Add Lead to Pipeline
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Convert Lead to Order Modal */}
      {isConvertModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <PackageCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Convert Lead to Order</h3>
                  <p className="text-[11px] text-slate-500">Transfers directly to Orders Fulfillment Dashboard</p>
                </div>
              </div>
              <button
                onClick={() => setIsConvertModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConvertLeadToOrder} className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                <div className="text-[11px] font-semibold text-slate-500">Customer Summary:</div>
                <div className="font-bold text-slate-800">{selectedLead.name} ({selectedLead.phone})</div>
                <div className="text-[10px] text-emerald-600 font-semibold">Status will automatically update to WON</div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Product / Item Name</label>
                <input
                  type="text"
                  required
                  value={convertFormData.productName}
                  onChange={(e) => setConvertFormData({ ...convertFormData, productName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Deal Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={convertFormData.price}
                    onChange={(e) => setConvertFormData({ ...convertFormData, price: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Payment Method</label>
                  <select
                    value={convertFormData.paymentMethod}
                    onChange={(e) => setConvertFormData({ ...convertFormData, paymentMethod: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
                  >
                    <option value="COD">Cash on Delivery (COD)</option>
                    <option value="ONLINE">Paid Online (UPI / Card)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Delivery Street Address</label>
                <input
                  type="text"
                  required
                  value={convertFormData.street}
                  placeholder="House No., Street, Area"
                  onChange={(e) => setConvertFormData({ ...convertFormData, street: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={convertFormData.city}
                    placeholder="e.g. Mumbai"
                    onChange={(e) => setConvertFormData({ ...convertFormData, city: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase">Pincode *</label>
                    <span className="text-[10px] text-slate-400">6 Digits</span>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={convertFormData.pincode}
                    placeholder="400001"
                    onChange={(e) => setConvertFormData({ ...convertFormData, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={convertingOrder}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-bold transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-4 h-4" />
                {convertingOrder ? 'Creating Order...' : '🚀 Confirm & Create Direct Order'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
