import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Plus, 
  Trash2, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  MessageSquare, 
  Webhook, 
  UserCheck, 
  Bell, 
  Filter, 
  ChevronRight,
  RefreshCw,
  ShoppingBag,
  Calendar,
  Users
} from 'lucide-react';

const API_BASE = '/api/automations';

export const AutomationRules = () => {
  const [rules, setRules] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('rules'); // 'rules' | 'logs'
  const [showModal, setShowModal] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // New Rule Form State
  const [form, setForm] = useState({
    name: '',
    trigger: 'ORDER_CREATED',
    conditionField: 'always',
    conditionOperator: 'ALWAYS',
    conditionValue: '',
    actionType: 'SEND_WHATSAPP',
    actionTarget: '',
    actionTemplate: 'Hello {{customerName}}, your order {{orderNumber}} for ₹{{totalAmount}} has been received! We will ship it shortly.',
  });

  const token = localStorage.getItem('omniva_token') || localStorage.getItem('token') || '';
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const fetchRulesAndLogs = async () => {
    try {
      setLoading(true);
      const [rulesRes, logsRes] = await Promise.all([
        fetch(`${API_BASE}/rules`, { headers }),
        fetch(`${API_BASE}/logs`, { headers }),
      ]);
      const rulesData = await rulesRes.json();
      const logsData = await logsRes.json();

      if (rulesData.success) setRules(rulesData.data || []);
      if (logsData.success) setLogs(logsData.data || []);
    } catch (err) {
      console.error('Error fetching automations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRulesAndLogs();
  }, []);

  const handleCreateRule = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        trigger: form.trigger,
        condition: {
          field: form.conditionField,
          operator: form.conditionOperator,
          value: form.conditionValue,
        },
        action: {
          type: form.actionType,
          target: form.actionTarget,
          template: form.actionTemplate,
        },
      };

      const res = await fetch(`${API_BASE}/rules`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        fetchRulesAndLogs();
        setForm({
          name: '',
          trigger: 'ORDER_CREATED',
          conditionField: 'always',
          conditionOperator: 'ALWAYS',
          conditionValue: '',
          actionType: 'SEND_WHATSAPP',
          actionTarget: '',
          actionTemplate: 'Hello {{customerName}}, your order {{orderNumber}} for ₹{{totalAmount}} has been received! We will ship it shortly.',
        });
      } else {
        alert(data.message || 'Failed to create rule');
      }
    } catch (err) {
      alert('Error creating rule: ' + err.message);
    }
  };

  const handleToggleRule = async (rule) => {
    try {
      const res = await fetch(`${API_BASE}/rules/${rule._id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ isActive: !rule.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        setRules(rules.map((r) => (r._id === rule._id ? { ...r, isActive: !r.isActive } : r)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteRule = async (id) => {
    if (!window.confirm('Are you sure you want to delete this automation rule?')) return;
    try {
      const res = await fetch(`${API_BASE}/rules/${id}`, {
        method: 'DELETE',
        headers,
      });
      const data = await res.json();
      if (data.success) {
        setRules(rules.filter((r) => r._id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTestTrigger = async (rule) => {
    try {
      setTestResult({ loading: true, ruleId: rule._id });
      const samplePayload = {
        orderNumber: 'TEST-999',
        customerName: 'Aarav Patel',
        customerPhone: '+919876543210',
        totalAmount: 750,
        paymentMethod: 'COD',
      };

      const res = await fetch(`${API_BASE}/test`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          trigger: rule.trigger,
          entityType: 'ORDER',
          entityId: 'TEST-999',
          payload: samplePayload,
        }),
      });
      const data = await res.json();
      setTestResult({ loading: false, ruleId: rule._id, data });
      fetchRulesAndLogs();
    } catch (err) {
      setTestResult({ loading: false, ruleId: rule._id, error: err.message });
    }
  };

  const getTriggerIcon = (trigger) => {
    switch (trigger) {
      case 'ORDER_CREATED':
      case 'ORDER_SHIPPED':
        return <ShoppingBag className="w-4 h-4 text-emerald-400" />;
      case 'BOOKING_CREATED':
      case 'BOOKING_CONFIRMED':
        return <Calendar className="w-4 h-4 text-amber-400" />;
      case 'LEAD_INGESTED':
        return <Users className="w-4 h-4 text-cyan-400" />;
      default:
        return <Zap className="w-4 h-4 text-indigo-400" />;
    }
  };

  const getActionIcon = (actionType) => {
    switch (actionType) {
      case 'SEND_WHATSAPP':
        return <MessageSquare className="w-4 h-4 text-emerald-400" />;
      case 'OUTBOUND_WEBHOOK':
        return <Webhook className="w-4 h-4 text-indigo-400" />;
      case 'ASSIGN_STAFF':
        return <UserCheck className="w-4 h-4 text-purple-400" />;
      default:
        return <Bell className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              Automations & Webhooks
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Phase 6 Engine
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Zero-latency event triggers, webhook dispatches, and WhatsApp alerts on store events
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setActiveTab(activeTab === 'rules' ? 'logs' : 'rules');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition"
          >
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            {activeTab === 'rules' ? `Audit Logs (${logs.length})` : 'View Rules'}
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Rule
          </button>
        </div>
      </div>

      {/* Metric summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Active Rules</div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {rules.filter((r) => r.isActive).length} / {rules.length}
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Total Executions</div>
          <div className="text-xl font-bold text-slate-900 mt-1">
            {rules.reduce((acc, r) => acc + (r.executionCount || 0), 0)}
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Audit Logs</div>
          <div className="text-xl font-bold text-indigo-400 mt-1">{logs.length} logged</div>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase">Engine Status</div>
          <div className="text-xl font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            Live (HMAC-Ready)
          </div>
        </div>
      </div>

      {/* Main View: Rules or Logs */}
      {activeTab === 'rules' ? (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Configured Automation Rules</h3>
            <button
              onClick={fetchRulesAndLogs}
              className="text-slate-500 hover:text-slate-900 text-xs flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 text-xs">Loading rules...</div>
          ) : rules.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Zap className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="text-slate-500 text-sm font-semibold">No automation rules configured</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Create an automated rule to send WhatsApp order confirmations, dispatch outbound webhooks to your warehouse, or auto-assign leads.
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white"
              >
                <Plus className="w-3.5 h-3.5" /> Create Your First Rule
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {rules.map((rule) => (
                <div key={rule._id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-sm">{rule.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          rule.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {rule.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    {/* Flow representation: Trigger -> Condition -> Action */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                        {getTriggerIcon(rule.trigger)}
                        <span className="font-mono text-[11px] text-slate-600">{rule.trigger}</span>
                      </span>

                      <ChevronRight className="w-3.5 h-3.5 text-slate-600" />

                      <span className="inline-flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                        <Filter className="w-3 h-3 text-slate-500" />
                        <span className="text-[11px]">
                          {rule.condition?.operator === 'ALWAYS'
                            ? 'Always run'
                            : `${rule.condition?.field} ${rule.condition?.operator} ${rule.condition?.value}`}
                        </span>
                      </span>

                      <ChevronRight className="w-3.5 h-3.5 text-slate-600" />

                      <span className="inline-flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                        {getActionIcon(rule.action?.type)}
                        <span className="text-[11px] text-indigo-300 font-semibold">{rule.action?.type}</span>
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 font-mono truncate max-w-xl">
                      Template: {rule.action?.template || rule.action?.target}
                    </div>
                  </div>

                  {/* Actions column */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleTestTrigger(rule)}
                      disabled={testResult?.loading && testResult?.ruleId === rule._id}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition"
                      title="Run dry test trigger"
                    >
                      <Play className="w-3 h-3 text-emerald-400" />
                      Test
                    </button>

                    <button
                      onClick={() => handleToggleRule(rule)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
                        rule.isActive
                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                      }`}
                    >
                      {rule.isActive ? 'Pause' : 'Activate'}
                    </button>

                    <button
                      onClick={() => handleDeleteRule(rule._id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Delete rule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Audit Logs View */
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Live Automation Audit Logs</h3>
            <button
              onClick={fetchRulesAndLogs}
              className="text-slate-500 hover:text-slate-900 text-xs flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Refresh Logs
            </button>
          </div>

          {logs.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">No execution logs recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Rule Name</th>
                    <th className="py-3 px-4">Trigger / Entity</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4">
                        {log.status === 'SUCCESS' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-sans font-bold border border-emerald-500/20">
                            <CheckCircle2 className="w-2.5 h-2.5" /> SUCCESS
                          </span>
                        ) : log.status === 'SKIPPED' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 text-[10px] font-sans font-bold border border-slate-700">
                            SKIPPED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-sans font-bold border border-rose-500/20">
                            <XCircle className="w-2.5 h-2.5" /> FAILED
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-white font-sans font-semibold">{log.ruleName}</td>
                      <td className="py-3 px-4">
                        <span className="text-cyan-400 font-bold">{log.trigger}</span> ({log.entityType} #{log.entityId})
                      </td>
                      <td className="py-3 px-4 text-indigo-400">{log.actionType}</td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate" title={log.payloadSummary || log.errorMessage}>
                        {log.payloadSummary || log.errorMessage || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create Automation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-slate-900 text-base">Create Automation Rule</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-500 hover:text-slate-900 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Instant WhatsApp Confirmation on Order"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Trigger */}
              <div>
                <label className="block text-slate-600 font-semibold mb-1">1. When this event happens (Trigger)</label>
                <select
                  value={form.trigger}
                  onChange={(e) => setForm({ ...form, trigger: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ORDER_CREATED">Order Created (Product Storefront)</option>
                  <option value="ORDER_SHIPPED">Order Shipped (Courier Assigned)</option>
                  <option value="BOOKING_CREATED">Booking Created (Service / Travel Package)</option>
                  <option value="BOOKING_CONFIRMED">Booking Confirmed (Advance Payment Done)</option>
                  <option value="LEAD_INGESTED">Lead Ingested (Meta Ads / Website)</option>
                  <option value="STOCK_LOW">Stock Low Alert</option>
                </select>
              </div>

              {/* Condition */}
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2">
                <label className="block text-slate-600 font-semibold">2. If this condition matches</label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={form.conditionField}
                    onChange={(e) => setForm({ ...form, conditionField: e.target.value })}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800"
                  >
                    <option value="always">Always run</option>
                    <option value="totalAmount">Total Amount</option>
                    <option value="paymentMethod">Payment Method</option>
                    <option value="source">Source</option>
                  </select>

                  <select
                    value={form.conditionOperator}
                    onChange={(e) => setForm({ ...form, conditionOperator: e.target.value })}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800"
                  >
                    <option value="ALWAYS">Always</option>
                    <option value="EQUALS">Equals (==)</option>
                    <option value="GREATER_THAN">Greater than (&gt;)</option>
                    <option value="LESS_THAN">Less than (&lt;)</option>
                    <option value="CONTAINS">Contains</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Value (e.g. 500 or COD)"
                    value={form.conditionValue}
                    onChange={(e) => setForm({ ...form, conditionValue: e.target.value })}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-800"
                  />
                </div>
              </div>

              {/* Action */}
              <div className="space-y-2">
                <label className="block text-slate-600 font-semibold">3. Then perform this action</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={form.actionType}
                    onChange={(e) => setForm({ ...form, actionType: e.target.value })}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  >
                    <option value="SEND_WHATSAPP">Send WhatsApp Message</option>
                    <option value="OUTBOUND_WEBHOOK">Dispatch Outbound Webhook</option>
                    <option value="ASSIGN_STAFF">Auto-Assign Staff Member</option>
                    <option value="IN_APP_ALERT">Send In-App Notification</option>
                  </select>

                  <input
                    type="text"
                    placeholder={
                      form.actionType === 'OUTBOUND_WEBHOOK'
                        ? 'Webhook URL (https://...)'
                        : form.actionType === 'ASSIGN_STAFF'
                        ? 'Staff User ID'
                        : 'Recipient Phone or {{customerPhone}}'
                    }
                    value={form.actionTarget}
                    onChange={(e) => setForm({ ...form, actionTarget: e.target.value })}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>
              </div>

              {/* Template */}
              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Message / Payload Template (Placeholders: <code>&#123;&#123;customerName&#125;&#125;</code>, <code>&#123;&#123;orderNumber&#125;&#125;</code>, <code>&#123;&#123;totalAmount&#125;&#125;</code>)
                </label>
                <textarea
                  rows={3}
                  value={form.actionTemplate}
                  onChange={(e) => setForm({ ...form, actionTemplate: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30 transition"
                >
                  Save & Activate Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
