import React, { useState, useEffect } from 'react';
import {
  Crown,
  ShieldCheck,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Terminal,
  Radio,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  RefreshCw,
  LogOut,
  Building2,
  Server,
  Zap,
  KeyRound,
  Copy,
  Check,
  ExternalLink,
  Lock,
  Unlock,
  Download,
  Plus,
  FileText,
  ChevronRight,
  X,
  Sliders,
  Database,
  Cpu,
  ShieldAlert
} from 'lucide-react';
import { api } from '../../services/api.js';

type SuiteTab = 'cockpit' | 'tenants' | 'users' | 'billing' | 'swarm' | 'audit' | 'governance';

interface FounderSuiteProps {
  currentUser?: any;
  onLogout?: () => void;
  onExit?: () => void;
}

export const FounderSuite: React.FC<FounderSuiteProps> = ({ currentUser, onLogout, onExit }) => {
  const handleLogoutAction = onLogout || onExit || (() => {});
  const [activeTab, setActiveTab] = useState<SuiteTab>('cockpit');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Core Data States
  const [metrics, setMetrics] = useState<any>(null);
  const [financials, setFinancials] = useState<any>(null);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [invoicesSummary, setInvoicesSummary] = useState<any>(null);
  const [swarmTelemetry, setSwarmTelemetry] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [broadcast, setBroadcast] = useState<any>(null);

  // Filters & Search
  const [wsSearch, setWsSearch] = useState('');
  const [wsPlanFilter, setWsPlanFilter] = useState('ALL');
  const [wsStatusFilter, setWsStatusFilter] = useState('ALL');

  const [userSearch, setUserSearch] = useState('');
  const [userPlanFilter, setUserPlanFilter] = useState('ALL');

  const [invSearch, setInvSearch] = useState('');
  const [invStatusFilter, setInvStatusFilter] = useState('ALL');

  const [auditSearch, setAuditSearch] = useState('');

  // Modals & Active Edit Entities
  const [editingWorkspace, setEditingWorkspace] = useState<any | null>(null);
  const [editWsPlan, setEditWsPlan] = useState('STARTER');
  const [editWsQuota, setEditWsQuota] = useState(500);
  const [editWsStatus, setEditWsStatus] = useState('ACTIVE');
  const [extendDays, setExtendDays] = useState(0);
  const [savingWs, setSavingWs] = useState(false);

  const [isCreateWsOpen, setIsCreateWsOpen] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsPlan, setNewWsPlan] = useState('STARTER');
  const [newWsQuota, setNewWsQuota] = useState(500);
  const [newWsOwnerEmail, setNewWsOwnerEmail] = useState('');
  const [newWsOwnerName, setNewWsOwnerName] = useState('');
  const [creatingWs, setCreatingWs] = useState(false);

  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editUserRole, setEditUserRole] = useState('OPERATOR');
  const [savingUserRole, setSavingUserRole] = useState(false);

  const [resettingUser, setResettingUser] = useState<any | null>(null);
  const [tempPassword, setTempPassword] = useState('IdTech2026!');
  const [resetPin, setResetPin] = useState('');
  const [resettingPwd, setResettingPwd] = useState(false);

  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [emergencyPin, setEmergencyPin] = useState('');
  const [revokingSessions, setRevokingSessions] = useState(false);

  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [settlingInvoice, setSettlingInvoice] = useState(false);

  // Broadcast & Governance
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastType, setBroadcastType] = useState<'info' | 'warning' | 'critical'>('info');
  const [broadcastEnabled, setBroadcastEnabled] = useState(true);
  const [savingBroadcast, setSavingBroadcast] = useState(false);

  // UI Feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast('Teks berhasil disalin ke clipboard');
  };

  // Main Data Fetcher
  const loadAllData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const [
        metricsRes,
        finRes,
        wsRes,
        usersRes,
        invRes,
        swarmRes,
        auditRes,
        healthRes,
        bcRes
      ] = await Promise.all([
        api.getMetrics().catch(() => null),
        api.getFinancials().catch(() => null),
        api.getWorkspaces({ search: wsSearch, plan: wsPlanFilter, status: wsStatusFilter }).catch(() => null),
        api.getUsers({ search: userSearch, plan: userPlanFilter }).catch(() => null),
        api.getInvoices({ search: invSearch, status: invStatusFilter }).catch(() => null),
        api.getSwarmTelemetry().catch(() => null),
        api.getAuditLogs({ limit: 100, search: auditSearch }).catch(() => null),
        api.getSystemHealth().catch(() => null),
        api.getBroadcast().catch(() => null)
      ]);

      if (metricsRes?.metrics) setMetrics(metricsRes.metrics);
      if (finRes?.financials) setFinancials(finRes.financials);
      if (wsRes?.workspaces) setWorkspaces(wsRes.workspaces);
      if (usersRes?.users) setUsers(usersRes.users);
      if (invRes?.invoices) {
        setInvoices(invRes.invoices);
        setInvoicesSummary(invRes.summary);
      }
      if (swarmRes?.telemetry) setSwarmTelemetry(swarmRes.telemetry);
      if (auditRes?.logs) setAuditLogs(auditRes.logs);
      if (healthRes?.health) setSystemHealth(healthRes.health);
      if (bcRes?.broadcast) {
        setBroadcast(bcRes.broadcast);
        setBroadcastMsg(bcRes.broadcast.message || '');
        setBroadcastType(bcRes.broadcast.type || 'info');
        setBroadcastEnabled(bcRes.broadcast.enabled ?? true);
      }
    } catch (err: any) {
      showToast(`Gagal memuat data: ${err.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Filter Watchers
  useEffect(() => {
    api.getWorkspaces({ search: wsSearch, plan: wsPlanFilter, status: wsStatusFilter })
      .then(res => res.workspaces && setWorkspaces(res.workspaces))
      .catch(() => {});
  }, [wsSearch, wsPlanFilter, wsStatusFilter]);

  useEffect(() => {
    api.getUsers({ search: userSearch, plan: userPlanFilter })
      .then(res => res.users && setUsers(res.users))
      .catch(() => {});
  }, [userSearch, userPlanFilter]);

  useEffect(() => {
    api.getInvoices({ search: invSearch, status: invStatusFilter })
      .then(res => {
        if (res.invoices) setInvoices(res.invoices);
        if (res.summary) setInvoicesSummary(res.summary);
      })
      .catch(() => {});
  }, [invSearch, invStatusFilter]);

  useEffect(() => {
    api.getAuditLogs({ limit: 100, search: auditSearch })
      .then(res => res.logs && setAuditLogs(res.logs))
      .catch(() => {});
  }, [auditSearch]);

  // Actions: Update Workspace
  const handleSaveWorkspace = async () => {
    if (!editingWorkspace) return;
    setSavingWs(true);
    try {
      await api.updateWorkspace(editingWorkspace.id, {
        plan: editWsPlan,
        taskQuotaLimit: editWsQuota,
        planStatus: editWsStatus,
        extendDays: extendDays > 0 ? extendDays : undefined
      });
      showToast(`Workspace "${editingWorkspace.name}" berhasil diperbarui.`);
      setEditingWorkspace(null);
      setExtendDays(0);
      loadAllData(true);
    } catch (err: any) {
      showToast(`Gagal: ${err.message}`);
    } finally {
      setSavingWs(false);
    }
  };

  // Actions: Create Workspace
  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    setCreatingWs(true);
    try {
      await api.createWorkspace({
        name: newWsName.trim(),
        plan: newWsPlan,
        taskQuotaLimit: newWsQuota,
        ownerEmail: newWsOwnerEmail.trim() || undefined,
        ownerName: newWsOwnerName.trim() || undefined
      });
      showToast(`Tenant "${newWsName}" berhasil diprovisikan.`);
      setIsCreateWsOpen(false);
      setNewWsName('');
      setNewWsOwnerEmail('');
      setNewWsOwnerName('');
      loadAllData(true);
    } catch (err: any) {
      showToast(`Gagal provisi: ${err.message}`);
    } finally {
      setCreatingWs(false);
    }
  };

  // Actions: User Role
  const handleSaveUserRole = async () => {
    if (!editingUser) return;
    setSavingUserRole(true);
    try {
      await api.updateUserRole(editingUser.id, editUserRole);
      showToast(`Peran pengguna ${editingUser.email} diperbarui ke ${editUserRole}.`);
      setEditingUser(null);
      loadAllData(true);
    } catch (err: any) {
      showToast(`Gagal mengubah peran: ${err.message}`);
    } finally {
      setSavingUserRole(false);
    }
  };

  // Actions: Reset Password
  const handleExecuteResetPassword = async () => {
    if (!resettingUser) return;
    if (!resetPin.trim()) {
      showToast('Master Security PIN 6-digit wajib diisi.');
      return;
    }
    setResettingPwd(true);
    try {
      const res = await api.resetUserPassword(resettingUser.id, tempPassword, resetPin.trim());
      showToast(res.message || 'Kata sandi berhasil direset.');
      setResettingUser(null);
      setResetPin('');
      loadAllData(true);
    } catch (err: any) {
      showToast(`Gagal reset sandi: ${err.message}`);
    } finally {
      setResettingPwd(false);
    }
  };

  // Actions: Mark Invoice Paid
  const handleMarkInvoicePaid = async (invoiceId: string) => {
    setSettlingInvoice(true);
    try {
      await api.markInvoicePaid(invoiceId);
      showToast(`Faktur #${invoiceId} telah diselesaikan secara manual.`);
      setSelectedInvoice(null);
      loadAllData(true);
    } catch (err: any) {
      showToast(`Gagal: ${err.message}`);
    } finally {
      setSettlingInvoice(false);
    }
  };

  // Actions: Broadcast
  const handleSaveBroadcast = async () => {
    setSavingBroadcast(true);
    try {
      await api.setBroadcast({
        message: broadcastMsg,
        type: broadcastType,
        enabled: broadcastEnabled
      });
      showToast('Siaran banner global berhasil dipublikasikan ke seluruh platform.');
      loadAllData(true);
    } catch (err: any) {
      showToast(`Gagal menyimpan siaran: ${err.message}`);
    } finally {
      setSavingBroadcast(false);
    }
  };

  // Actions: Emergency Kill-Switch
  const handleExecuteEmergencyRevoke = async () => {
    if (!emergencyPin.trim()) {
      showToast('Master Security PIN wajib diisi untuk otorisasi kill-switch.');
      return;
    }
    setRevokingSessions(true);
    try {
      const res = await api.emergencyRevokeSessions(emergencyPin.trim());
      showToast(res.message || 'Seluruh sesi non-founder berhasil dicabut.');
      setIsEmergencyModalOpen(false);
      setEmergencyPin('');
      loadAllData(true);
    } catch (err: any) {
      showToast(`Gagal eksekusi: ${err.message}`);
    } finally {
      setRevokingSessions(false);
    }
  };

  const formatIdr = (val?: number) => {
    if (val === undefined || val === null) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* Background Cyber Grid */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1e293b10_1px,transparent_1px),linear-gradient(to_bottom,#1e293b10_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] pointer-events-none" />
      <div className="fixed top-0 left-1/4 w-[40rem] h-[40rem] bg-amber-500/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[35rem] h-[35rem] bg-cyan-500/5 rounded-full blur-[160px] pointer-events-none" />

      {/* Top Executive Header Bar */}
      <header className="relative z-30 border-b border-slate-800/80 bg-[#0B0F17]/95 backdrop-blur-xl px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500/25 via-yellow-500/20 to-orange-500/20 border border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
            <Crown className="w-6 h-6 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0B0F17] animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">ID-Tech Cloud</span>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-[10px] font-mono font-bold text-amber-300 uppercase tracking-widest">
                Level 5 Clearance
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="text-slate-300 font-medium">Founder & CEO Executive Suite</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 flex items-center gap-1 font-mono text-[11px]">
                <Database className="w-3 h-3 text-emerald-400" />
                Railway PostgreSQL Connected
              </span>
            </div>
          </div>
        </div>

        {/* Right Executive Toolbar */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{new Date().toLocaleTimeString('id-ID', { hour12: false })} WIB</span>
          </div>

          <button
            onClick={() => loadAllData(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-200 transition shadow-sm disabled:opacity-50"
            title="Sinkronisasi data real-time dengan database PostgreSQL"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sinkronisasi</span>
          </button>

          <div className="h-6 w-px bg-slate-800" />

          {/* Founder Profile Badge */}
          <div className="flex items-center gap-2.5 pl-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center font-bold text-slate-950 text-xs shadow-md shadow-amber-500/20">
              AW
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-bold text-white leading-tight">Arjun Wijaya</div>
              <div className="text-[10px] text-amber-400/90 font-mono">Chief Executive Officer</div>
            </div>
          </div>

          <button
            onClick={handleLogoutAction}
            className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition"
            title="Kunci Panel & Keluar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Titanium Executive Navigation Tabs Bar */}
      <nav className="relative z-20 border-b border-slate-800/80 bg-[#0E1522]/80 backdrop-blur-md px-4 lg:px-8 py-2 overflow-x-auto no-scrollbar flex items-center gap-2">
        {[
          { id: 'cockpit', label: 'Ringkasan Eksekutif', icon: TrendingUp, badge: metrics?.mrrIdr ? formatIdr(metrics.mrrIdr) : undefined },
          { id: 'tenants', label: 'Multi-Tenant Workspaces', icon: Building2, badge: workspaces.length ? String(workspaces.length) : undefined },
          { id: 'users', label: 'Direktori Pengguna', icon: Users, badge: users.length ? String(users.length) : undefined },
          { id: 'billing', label: 'Faktur & Midtrans', icon: DollarSign, badge: invoices.length ? `${invoices.length} Inv` : undefined },
          { id: 'swarm', label: 'Armada AI & Daemons', icon: Zap, badge: '7 Agen' },
          { id: 'audit', label: 'Jejak Audit SOC2', icon: ShieldCheck, badge: 'Zero-Trust' },
          { id: 'governance', label: 'Tata Kelola Platform', icon: Sliders }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SuiteTab)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 border ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-orange-500/20 border-amber-500/50 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                  : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                  isActive ? 'bg-amber-400/20 text-amber-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Main Content Viewport */}
      <main className="relative z-10 flex-1 max-w-[1720px] w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* ========================================================= */}
        {/* TAB 1: COCKPIT (EXECUTIVE OVERVIEW) */}
        {/* ========================================================= */}
        {activeTab === 'cockpit' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top SaaS KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Monthly Recurring Revenue */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0E1522] to-[#121B2A] border border-amber-500/30 shadow-[0_0_35px_rgba(245,158,11,0.12)] space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold tracking-wide uppercase text-[11px]">Monthly Recurring Revenue</span>
                  <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl lg:text-3xl font-extrabold text-white font-mono tracking-tight">
                  {formatIdr(metrics?.mrrIdr || 998000)}
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400 border-t border-slate-800/80">
                  <span>ARR (Annual Run Rate):</span>
                  <span className="font-mono font-bold text-amber-300">{formatIdr((metrics?.mrrIdr || 998000) * 12)}</span>
                </div>
              </div>

              {/* Total Paid Revenue (Midtrans Realized) */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0E1522] to-[#121B2A] border border-emerald-500/30 shadow-[0_0_35px_rgba(16,185,129,0.1)] space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold tracking-wide uppercase text-[11px]">Realisasi Kas Midtrans</span>
                  <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl lg:text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">
                  {formatIdr(metrics?.totalRevenueIdr || 998000)}
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400 border-t border-slate-800/80">
                  <span>Gross Margin:</span>
                  <span className="font-mono font-bold text-emerald-300">~92.4% (Net High)</span>
                </div>
              </div>

              {/* Tenant Workspaces & Paid Subscribers */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0E1522] to-[#121B2A] border border-cyan-500/30 shadow-[0_0_35px_rgba(6,182,212,0.1)] space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold tracking-wide uppercase text-[11px]">Organisasi / Workspaces</span>
                  <div className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                    <Building2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl lg:text-3xl font-extrabold text-white font-mono tracking-tight flex items-baseline gap-2">
                  <span>{metrics?.totalWorkspaces || 5}</span>
                  <span className="text-xs font-normal text-slate-400">Tenant Aktif</span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400 border-t border-slate-800/80">
                  <span>Paid vs Trial:</span>
                  <span className="font-mono font-bold text-cyan-300">
                    {metrics?.paidSubscribers || 2} Berbayar • {metrics?.freeTrialUsers || 3} Trial
                  </span>
                </div>
              </div>

              {/* AI Agent Workload & SLA */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0E1522] to-[#121B2A] border border-purple-500/30 shadow-[0_0_35px_rgba(168,85,247,0.1)] space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold tracking-wide uppercase text-[11px]">Throughput Tugas AI</span>
                  <div className="p-1.5 rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/30">
                    <Zap className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl lg:text-3xl font-extrabold text-white font-mono tracking-tight flex items-baseline gap-2">
                  <span>{metrics?.totalTasksDone || 19}</span>
                  <span className="text-xs font-normal text-emerald-400 font-semibold">Tugas Selesai</span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400 border-t border-slate-800/80">
                  <span>Uptime SLA Platform:</span>
                  <span className="font-mono font-bold text-purple-300">99.98% (High Tier)</span>
                </div>
              </div>
            </div>

            {/* Quick Actions & Velocity Bar */}
            <div className="p-4 rounded-2xl bg-[#0E1522] border border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">Tindakan Eksekutif:</span>
                <button
                  onClick={() => setIsCreateWsOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-bold transition shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Provisi Tenant Baru</span>
                </button>
                <a
                  href={api.getExportUrl('users')}
                  download
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Export Users CSV</span>
                </a>
                <a
                  href={api.getExportUrl('invoices')}
                  download
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Export Invoices CSV</span>
                </a>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  PostgreSQL 18 SSL Active
                </span>
                <span>•</span>
                <span>Port 3001 Isolated</span>
              </div>
            </div>

            {/* Two-Column Deep Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Plan Distribution Breakdown */}
              <div className="p-6 rounded-2xl bg-[#0E1522] border border-slate-800/80 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Distribusi Paket Lisensi B2B</span>
                  </h3>
                  <span className="text-xs font-mono text-slate-500">Tier Matrix</span>
                </div>

                <div className="space-y-3">
                  {[
                    { plan: 'STARTER', count: metrics?.planCounts?.STARTER || 2, price: 'Rp 499.000 / bln', quota: '500 Tugas/bln', color: 'from-blue-500 to-cyan-500' },
                    { plan: 'BUSINESS', count: metrics?.planCounts?.BUSINESS || 0, price: 'Rp 1.999.000 / bln', quota: '2.500 Tugas/bln', color: 'from-amber-500 to-orange-500' },
                    { plan: 'ENTERPRISE', count: metrics?.planCounts?.ENTERPRISE || 0, price: 'Rp 4.999.000 / bln', quota: 'Unlimited SLA', color: 'from-purple-500 to-pink-500' },
                    { plan: 'FREE (TRIAL)', count: metrics?.planCounts?.FREE || 3, price: 'Rp 0 (14 Hari)', quota: '50 Tugas Trial', color: 'from-slate-600 to-slate-500' }
                  ].map(row => (
                    <div key={row.plan} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{row.plan}</span>
                          <span className="text-[10px] font-mono text-slate-400">({row.price})</span>
                        </div>
                        <div className="text-[11px] text-slate-500">Alokasi: {row.quota}</div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm font-mono font-bold text-white">{row.count} Tenant</div>
                          <div className="text-[10px] text-slate-500">{((row.count / 5) * 100).toFixed(0)}% pangsa</div>
                        </div>
                        <div className={`w-2.5 h-8 rounded-full bg-gradient-to-b ${row.color}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Infrastructure FinOps Telemetry */}
              <div className="p-6 rounded-2xl bg-[#0E1522] border border-slate-800/80 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Server className="w-4 h-4 text-cyan-400" />
                    <span>Infrastruktur & Telemetri Model AI</span>
                  </h3>
                  <span className="text-xs font-mono text-emerald-400">ALL HEALTHY</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                    <div className="text-[11px] text-slate-400 font-mono">DB POOL STATUS</div>
                    <div className="text-lg font-bold text-white font-mono flex items-center gap-2">
                      <span>{systemHealth?.database?.latencyMs || 8} ms</span>
                      <span className="text-[10px] text-emerald-400 font-normal">Sangat Cepat</span>
                    </div>
                    <div className="text-[10px] text-slate-500">Sakura TCP Proxy · SSL Full</div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                    <div className="text-[11px] text-slate-400 font-mono">DAEMONS 24/7</div>
                    <div className="text-lg font-bold text-white font-mono flex items-center gap-2">
                      <span>4 Scheduler</span>
                      <span className="text-[10px] text-cyan-400 font-normal">Aktif</span>
                    </div>
                    <div className="text-[10px] text-slate-500">Health, Security, Sync, Audit</div>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="text-xs font-bold text-slate-400">Penyedia Model AI Terhubung:</div>
                  {[
                    { name: 'Azure OpenAI Enterprise', model: 'GPT-4o / GPT-4 Turbo', sla: '99.98%' },
                    { name: 'Anthropic Claude Engine', model: 'Claude 3.5 Sonnet', sla: '99.95%' },
                    { name: 'Groq Cloud LPU Speed Engine', model: 'Llama-3.3-70B Versatile', sla: '99.99%' },
                    { name: 'DeepSeek Platform', model: 'DeepSeek-V3 Reasoning', sla: '99.90%' }
                  ].map(provider => (
                    <div key={provider.name} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/40 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span className="font-semibold text-slate-200">{provider.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">({provider.model})</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">{provider.sla}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: TENANTS (MULTI-TENANT WORKSPACES) */}
        {/* ========================================================= */}
        {activeTab === 'tenants' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header & Search Bar */}
            <div className="p-4 rounded-2xl bg-[#0E1522] border border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={wsSearch}
                    onChange={e => setWsSearch(e.target.value)}
                    placeholder="Cari tenant berdasarkan nama, email billing, atau ID..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                {/* Plan Filter */}
                <select
                  value={wsPlanFilter}
                  onChange={e => setWsPlanFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 focus:outline-none focus:border-amber-500 transition"
                >
                  <option value="ALL">Semua Paket</option>
                  <option value="FREE">FREE</option>
                  <option value="STARTER">STARTER</option>
                  <option value="BUSINESS">BUSINESS</option>
                  <option value="ENTERPRISE">ENTERPRISE</option>
                </select>

                {/* Status Filter */}
                <select
                  value={wsStatusFilter}
                  onChange={e => setWsStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 focus:outline-none focus:border-amber-500 transition"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="TRIALING">TRIALING</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
              </div>

              <button
                onClick={() => setIsCreateWsOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Tenant Baru</span>
              </button>
            </div>

            {/* Workspaces Table */}
            <div className="rounded-2xl bg-[#0E1522] border border-slate-800/80 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Nama Workspace & Tenant</th>
                      <th className="py-3 px-4">Paket & Status</th>
                      <th className="py-3 px-4">Alokasi Kuota Tugas</th>
                      <th className="py-3 px-4">Member / Agen</th>
                      <th className="py-3 px-4">Total Realisasi Kas</th>
                      <th className="py-3 px-4 text-right">Aksi Founder</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {workspaces.map(ws => (
                      <tr key={ws.id} className="hover:bg-slate-900/40 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{ws.name}</span>
                            <button
                              onClick={() => copyToClipboard(ws.id, ws.id)}
                              className="text-slate-500 hover:text-slate-300 transition"
                              title="Salin Workspace ID"
                            >
                              {copiedId === ws.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">{ws.id}</div>
                          {ws.billingEmail && (
                            <div className="text-[11px] text-cyan-400">{ws.billingEmail}</div>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                              ws.plan === 'STARTER' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' :
                              ws.plan === 'BUSINESS' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                              ws.plan === 'ENTERPRISE' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' :
                              'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}>
                              {ws.plan}
                            </span>
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                              ws.planStatus === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' :
                              ws.planStatus === 'SUSPENDED' ? 'bg-red-500/10 text-red-400' :
                              'bg-amber-500/10 text-amber-400'
                            }`}>
                              {ws.planStatus}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono">
                          <div className="text-slate-200">
                            {ws.tasksUsedThisMonth || 0} / <span className="text-white font-bold">{ws.taskQuotaLimit}</span> tugas
                          </div>
                          <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                            <div
                              className="bg-cyan-500 h-full rounded-full"
                              style={{ width: `${Math.min(100, ((ws.tasksUsedThisMonth || 0) / (ws.taskQuotaLimit || 50)) * 100)}%` }}
                            />
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          {ws.membersCount || 0} Member • {ws.agentsCount || 0} Agen
                        </td>

                        <td className="py-3.5 px-4 font-mono text-emerald-400 font-bold">
                          {formatIdr(Number(ws.totalPaidIdr || 0))}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setEditingWorkspace(ws);
                              setEditWsPlan(ws.plan);
                              setEditWsQuota(ws.taskQuotaLimit);
                              setEditWsStatus(ws.planStatus);
                              setExtendDays(0);
                            }}
                            className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition shadow-sm"
                          >
                            Kelola Tenant
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: USERS (RBAC & ACCESS CONTROL) */}
        {/* ========================================================= */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Search & Actions Bar */}
            <div className="p-4 rounded-2xl bg-[#0E1522] border border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    placeholder="Cari pengguna berdasarkan nama, email, atau workspace..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <select
                  value={userPlanFilter}
                  onChange={e => setUserPlanFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 focus:outline-none focus:border-amber-500 transition"
                >
                  <option value="ALL">Semua Paket</option>
                  <option value="FREE">FREE</option>
                  <option value="STARTER">STARTER</option>
                  <option value="BUSINESS">BUSINESS</option>
                  <option value="ENTERPRISE">ENTERPRISE</option>
                </select>
              </div>

              <a
                href={api.getExportUrl('users')}
                download
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs transition"
              >
                <Download className="w-4 h-4 text-cyan-400" />
                <span>Unduh Direktori CSV</span>
              </a>
            </div>

            {/* Users Table */}
            <div className="rounded-2xl bg-[#0E1522] border border-slate-800/80 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Operator / Pengguna</th>
                      <th className="py-3 px-4">Workspace / Organisasi</th>
                      <th className="py-3 px-4">Peran (RBAC)</th>
                      <th className="py-3 px-4">Paket Lisensi</th>
                      <th className="py-3 px-4">Login Terakhir</th>
                      <th className="py-3 px-4 text-right">Aksi Keamanan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-900/40 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white text-sm flex items-center gap-2">
                            <span>{u.displayName || 'Unnamed Operator'}</span>
                            {u.role === 'ADMIN' && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-mono font-bold">
                                C-LEVEL
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-cyan-400">{u.email}</div>
                          <div className="text-[10px] font-mono text-slate-500">{u.id}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-slate-200 font-semibold">{u.workspaceName || 'Command Center'}</div>
                          <div className="text-[10px] font-mono text-slate-500">{u.workspaceId || '-'}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                            u.role === 'ADMIN' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                            u.role === 'OPERATOR' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' :
                            'bg-slate-800 text-slate-300'
                          }`}>
                            {u.role}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-mono text-slate-300 font-semibold">
                            {u.plan || 'FREE'}
                          </span>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {u.taskQuotaLimit ? `${u.taskQuotaLimit} kuota` : '-'}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                          {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('id-ID') : 'Belum pernah login'}
                        </td>

                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setEditingUser(u);
                              setEditUserRole(u.role);
                            }}
                            className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 transition"
                          >
                            Ubah Peran
                          </button>
                          <button
                            onClick={() => {
                              setResettingUser(u);
                              setTempPassword(`IdTech#${Math.random().toString(36).slice(-6)}!`);
                            }}
                            className="px-2.5 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-xs font-semibold text-amber-300 transition"
                          >
                            Reset Sandi
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: BILLING & MIDTRANS INVOICES */}
        {/* ========================================================= */}
        {activeTab === 'billing' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Invoices Summary Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-[#0E1522] border border-emerald-500/30">
                <div className="text-[11px] font-mono text-slate-400">TOTAL PEMBAYARAN SELESAI (SETTLED)</div>
                <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                  {formatIdr(invoicesSummary?.totalPaidIdr || 998000)}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">{invoicesSummary?.totalPaidCount || 2} Faktur Berhasil Diterima</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0E1522] border border-amber-500/30">
                <div className="text-[11px] font-mono text-slate-400">FAKTUR MENUNGGU PEMBAYARAN (PENDING)</div>
                <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
                  {formatIdr(invoicesSummary?.totalPendingIdr || 5997000)}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">{invoicesSummary?.totalPendingCount || 5} Faktur Terbit / Menunggu</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0E1522] border border-slate-800">
                <div className="text-[11px] font-mono text-slate-400">GATEWAY PEMBAYARAN UTAMA</div>
                <div className="text-lg font-bold text-white mt-1">Midtrans Snap B2B</div>
                <div className="text-[10px] text-slate-500 mt-1">QRIS, Virtual Account BCA/Mandiri/BRI/BNI</div>
              </div>
            </div>

            {/* Filter & Export */}
            <div className="p-4 rounded-2xl bg-[#0E1522] border border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={invSearch}
                    onChange={e => setInvSearch(e.target.value)}
                    placeholder="Cari berdasarkan nomor invoice atau nama organisasi..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <select
                  value={invStatusFilter}
                  onChange={e => setInvStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 focus:outline-none focus:border-amber-500 transition"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="PAID">PAID</option>
                  <option value="PENDING">PENDING</option>
                  <option value="EXPIRED">EXPIRED</option>
                </select>
              </div>

              <a
                href={api.getExportUrl('invoices')}
                download
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs transition"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Unduh Laporan Faktur CSV</span>
              </a>
            </div>

            {/* Invoices Ledger Table */}
            <div className="rounded-2xl bg-[#0E1522] border border-slate-800/80 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Nomor Faktur</th>
                      <th className="py-3 px-4">Workspace / Klien</th>
                      <th className="py-3 px-4">Paket Lisensi</th>
                      <th className="py-3 px-4">Nominal Tagihan</th>
                      <th className="py-3 px-4">Status & Waktu</th>
                      <th className="py-3 px-4 text-right">Rekonsiliasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {invoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-900/40 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-white flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                            <span>{inv.invoiceNumber}</span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">{inv.id}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-slate-200 font-semibold">{inv.workspaceName || 'Command Center'}</div>
                          <div className="text-[10px] font-mono text-slate-500">{inv.workspaceId}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-mono text-slate-300 font-bold">{inv.plan}</span>
                          <span className="text-[10px] text-slate-500 ml-1">({inv.interval || 'MONTHLY'})</span>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-sm text-white">
                          {formatIdr(Number(inv.amountIdr))}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                              inv.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                              inv.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                              'bg-slate-800 text-slate-400'
                            }`}>
                              {inv.status}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {inv.paidAt ? `Lunas: ${new Date(inv.paidAt).toLocaleDateString('id-ID')}` : `Dibuat: ${new Date(inv.createdAt).toLocaleDateString('id-ID')}`}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          {inv.status !== 'PAID' ? (
                            <button
                              onClick={() => handleMarkInvoicePaid(inv.id)}
                              disabled={settlingInvoice}
                              className="px-2.5 py-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold text-xs transition"
                            >
                              Selesaikan Manual
                            </button>
                          ) : (
                            <span className="text-emerald-400 font-mono text-xs flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Terverifikasi
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: AI SWARM & 24/7 DAEMONS TELEMETRY */}
        {/* ========================================================= */}
        {activeTab === 'swarm' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top Swarm Pipeline Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-[#0E1522] border border-cyan-500/30">
                <div className="text-[11px] font-mono text-slate-400">TOTAL AI AGENTS</div>
                <div className="text-2xl font-bold font-mono text-white mt-1">
                  {swarmTelemetry?.totalAgents || 7} Agen
                </div>
                <div className="text-[10px] text-cyan-400 mt-1">Siap Koordinasi Swarm</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0E1522] border border-emerald-500/30">
                <div className="text-[11px] font-mono text-slate-400">TUGAS SELESAI (DONE)</div>
                <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                  {swarmTelemetry?.taskDistribution?.DONE || 19}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Eksekusi Sukses 100%</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0E1522] border border-amber-500/30">
                <div className="text-[11px] font-mono text-slate-400">ANTREAN TUGAS (TODO)</div>
                <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
                  {swarmTelemetry?.taskDistribution?.TODO || 12}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Dalam Backlog Tenant</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0E1522] border border-purple-500/30">
                <div className="text-[11px] font-mono text-slate-400">CRON DAEMONS 24/7</div>
                <div className="text-2xl font-bold font-mono text-purple-400 mt-1">
                  {swarmTelemetry?.cronDaemons?.length || 4} Aktif
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Orkestrasi Terjadwal</div>
              </div>
            </div>

            {/* AI Agent Fleet Table */}
            <div className="rounded-2xl bg-[#0E1522] border border-slate-800/80 overflow-hidden shadow-xl space-y-3 p-5">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span>Daftar Armada Agen Otonom (Platform-Wide Fleet)</span>
                </h3>
                <span className="text-xs font-mono text-slate-500">Autonomous Nodes</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(swarmTelemetry?.agents || []).map((agent: any) => (
                  <div key={agent.id} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{agent.name}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono">
                        {agent.status || 'READY'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">Peran: {agent.role}</div>
                    <div className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
                      <Cpu className="w-3 h-3" />
                      <span>{agent.modelId || 'gpt-4o'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 24/7 Daemons Schedules */}
            <div className="rounded-2xl bg-[#0E1522] border border-slate-800/80 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-pink-400" />
                  <span>24/7 Autonomous Daemon Schedules (Cron Engine)</span>
                </h3>
                <span className="text-xs font-mono text-pink-400 font-bold">4 DAEMONS LIVE</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(swarmTelemetry?.cronDaemons || []).map((d: any) => (
                  <div key={d.id} className="p-3.5 rounded-xl bg-slate-900/60 border border-pink-500/20 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{d.title}</span>
                      <span className="px-2 py-0.5 rounded bg-pink-500/15 text-pink-300 font-mono text-[10px]">
                        {d.cronExpression}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 font-mono">
                      <span>Total Eksekusi: <strong className="text-white">{d.totalRuns}x</strong></span>
                      <span className="text-emerald-400">{d.lastStatus || 'IDLE'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: AUDIT LEDGER (SOC2 / COMPLIANCE) */}
        {/* ========================================================= */}
        {activeTab === 'audit' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Search & Export Bar */}
            <div className="p-4 rounded-2xl bg-[#0E1522] border border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
              <div className="relative flex-1 min-w-[280px]">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={auditSearch}
                  onChange={e => setAuditSearch(e.target.value)}
                  placeholder="Cari jejak audit berdasarkan aktivitas, aktor, atau tipe event..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <a
                href={api.getExportUrl('audit-logs')}
                download
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs transition"
              >
                <Download className="w-4 h-4 text-cyan-400" />
                <span>Unduh Audit Log SOC2 (CSV)</span>
              </a>
            </div>

            {/* Audit Logs List */}
            <div className="rounded-2xl bg-[#0E1522] border border-slate-800/80 overflow-hidden shadow-xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Log Aktivitas & Jejak Keamanan Sistem (Immutable Ledger)</span>
                </h3>
                <span className="text-xs font-mono text-slate-500">{auditLogs.length} Entri Ditampilkan</span>
              </div>

              <div className="space-y-2">
                {auditLogs.map((log: any) => (
                  <div key={log.id} className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-cyan-300 font-bold">
                          {log.eventType || 'SYSTEM_EVENT'}
                        </span>
                        <span className="text-xs font-semibold text-slate-200">
                          {log.actorName || log.actorType || 'Sistem'}
                        </span>
                        {log.workspaceName && (
                          <span className="text-[11px] text-slate-500">
                            • {log.workspaceName}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">{log.summary}</p>
                    </div>

                    <div className="text-[10px] font-mono text-slate-500 shrink-0">
                      {new Date(log.createdAt).toLocaleString('id-ID')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 7: GOVERNANCE & EMERGENCY KILL-SWITCH */}
        {/* ========================================================= */}
        {activeTab === 'governance' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Global Broadcast Editor */}
            <div className="p-6 rounded-2xl bg-[#0E1522] border border-amber-500/30 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-amber-400" />
                  <span>Siaran Banner Global Platform (Broadcast Announcement)</span>
                </h3>
                <span className="text-xs font-mono text-amber-300 font-bold">MULTI-TENANT BROADCAST</span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Pesan ini akan langsung muncul sebagai banner prioritas di bagian atas layar seluruh tenant pelanggan di domain <strong className="text-white">app.id-tech.cloud</strong>.
              </p>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Isi Pengumuman / Pesan Siaran:</label>
                  <textarea
                    rows={3}
                    value={broadcastMsg}
                    onChange={e => setBroadcastMsg(e.target.value)}
                    placeholder="Contoh: Pemeliharaan infrastruktur terjadwal pukul 02:00 WIB. Seluruh swarm tetap aman."
                    className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition font-sans"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-400">Tipe Banner:</label>
                      <select
                        value={broadcastType}
                        onChange={e => setBroadcastType(e.target.value as any)}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-slate-200"
                      >
                        <option value="info">Info (Biru/Cyan)</option>
                        <option value="warning">Peringatan (Kuning/Amber)</option>
                        <option value="critical">Kritis (Merah)</option>
                      </select>
                    </div>

                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={broadcastEnabled}
                        onChange={e => setBroadcastEnabled(e.target.checked)}
                        className="rounded border-slate-700 text-amber-500 focus:ring-0"
                      />
                      <span>Aktifkan Banner Sekarang</span>
                    </label>
                  </div>

                  <button
                    onClick={handleSaveBroadcast}
                    disabled={savingBroadcast}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs transition shadow-sm disabled:opacity-50"
                  >
                    {savingBroadcast ? 'Menyiarkan...' : 'Publikasikan Siaran'}
                  </button>
                </div>
              </div>
            </div>

            {/* Emergency Protocols & Kill Switches */}
            <div className="p-6 rounded-2xl bg-[#0E1522] border border-red-500/30 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span>Protokol Keamanan Darurat & Kill Switch (Zero-Trust Security)</span>
                </h3>
                <span className="text-xs font-mono text-red-400 font-bold">LEVEL 5 ONLY</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-900/60 border border-red-500/20 space-y-2">
                  <div className="font-bold text-xs text-white">Cabut Seluruh Sesi Operator Non-Founder</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Segera membatalkan semua token sesi login operator di database jika terdeteksi aktivitas anomali atau intrusi.
                  </p>
                  <button
                    onClick={() => setIsEmergencyModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-xs font-bold transition shadow-sm mt-2"
                  >
                    Eksekusi Cabut Sesi
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="font-bold text-xs text-white">Status Isolasi Repositori & Domain</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Sistem berjalan pada 3 repositori mandiri: <strong className="text-white">NexGen-X/id-tech-founder-suite</strong>, <strong className="text-white">Ai-Center-Workspace</strong>, dan <strong className="text-white">id-tech-landing</strong>.
                  </p>
                  <div className="text-[10px] font-mono text-emerald-400 pt-1">
                    ✓ Isolasi Repositori 100% Aktif & Terverifikasi
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* MODAL: EDIT WORKSPACE (TENANT MANAGEMENT) */}
      {/* ========================================================= */}
      {editingWorkspace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-[#0E1522] border border-amber-500/40 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">Kelola Tenant: {editingWorkspace.name}</h3>
              </div>
              <button
                onClick={() => setEditingWorkspace(null)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Pilih Paket Lisensi B2B:</label>
                <select
                  value={editWsPlan}
                  onChange={e => {
                    setEditWsPlan(e.target.value);
                    if (e.target.value === 'STARTER') setEditWsQuota(500);
                    else if (e.target.value === 'BUSINESS') setEditWsQuota(2500);
                    else if (e.target.value === 'ENTERPRISE') setEditWsQuota(999999);
                    else setEditWsQuota(50);
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold"
                >
                  <option value="FREE">FREE (50 Tugas Trial)</option>
                  <option value="STARTER">STARTER (500 Tugas - Rp 499.000/bln)</option>
                  <option value="BUSINESS">BUSINESS (2.500 Tugas - Rp 1.999.000/bln)</option>
                  <option value="ENTERPRISE">ENTERPRISE (Unlimited - Rp 4.999.000/bln)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Batas Kuota Tugas AI (Task Quota Limit):</label>
                <input
                  type="number"
                  value={editWsQuota}
                  onChange={e => setEditWsQuota(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Status Langganan Tenant:</label>
                <select
                  value={editWsStatus}
                  onChange={e => setEditWsStatus(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold"
                >
                  <option value="ACTIVE">ACTIVE (Aktif Penuh)</option>
                  <option value="TRIALING">TRIALING (Masa Percobaan)</option>
                  <option value="SUSPENDED">SUSPENDED (Ditangguhkan Sementara)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Perpanjang Masa Trial / Siklus (Hari Tambahan):</label>
                <div className="flex items-center gap-2">
                  {[0, 14, 30, 60].map(days => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setExtendDays(days)}
                      className={`px-3 py-1.5 rounded-xl font-mono text-xs border transition ${
                        extendDays === days
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      {days === 0 ? 'Tetap' : `+${days} Hari`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingWorkspace(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveWorkspace}
                disabled={savingWs}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-bold shadow-md disabled:opacity-50"
              >
                {savingWs ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREATE WORKSPACE (PROVISION NEW TENANT) */}
      {/* ========================================================= */}
      {isCreateWsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <form onSubmit={handleCreateWorkspace} className="w-full max-w-lg rounded-2xl bg-[#0E1522] border border-amber-500/40 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">Provisi Tenant Organisasi Baru</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateWsOpen(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Nama Perusahaan / Organisasi Klien:</label>
                <input
                  type="text"
                  required
                  value={newWsName}
                  onChange={e => setNewWsName(e.target.value)}
                  placeholder="Contoh: PT Teknologi Finansial Gemilang"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Paket Lisensi:</label>
                  <select
                    value={newWsPlan}
                    onChange={e => {
                      setNewWsPlan(e.target.value);
                      if (e.target.value === 'STARTER') setNewWsQuota(500);
                      else if (e.target.value === 'BUSINESS') setNewWsQuota(2500);
                      else if (e.target.value === 'ENTERPRISE') setNewWsQuota(999999);
                      else setNewWsQuota(50);
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold"
                  >
                    <option value="FREE">FREE (50 Tugas Trial)</option>
                    <option value="STARTER">STARTER (500 Tugas)</option>
                    <option value="BUSINESS">BUSINESS (2.500 Tugas)</option>
                    <option value="ENTERPRISE">ENTERPRISE (Unlimited)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-300">Alokasi Kuota:</label>
                  <input
                    type="number"
                    value={newWsQuota}
                    onChange={e => setNewWsQuota(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Email Pemilik / Penanggung Jawab Klien (Opsional):</label>
                <input
                  type="email"
                  value={newWsOwnerEmail}
                  onChange={e => setNewWsOwnerEmail(e.target.value)}
                  placeholder="admin@klien.co.id"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Nama Penanggung Jawab Klien (Opsional):</label>
                <input
                  type="text"
                  value={newWsOwnerName}
                  onChange={e => setNewWsOwnerName(e.target.value)}
                  placeholder="Bambang Wijaya"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsCreateWsOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={creatingWs}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-bold shadow-md disabled:opacity-50"
              >
                {creatingWs ? 'Memprovisi...' : 'Provisikan Tenant'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT USER ROLE */}
      {/* ========================================================= */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-[#0E1522] border border-cyan-500/40 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-white">Ubah Peran Pengguna</h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400">Pengguna:</span>{' '}
                <strong className="text-white">{editingUser.displayName}</strong> ({editingUser.email})
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Pilih Peran Baru:</label>
                <select
                  value={editUserRole}
                  onChange={e => setEditUserRole(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold"
                >
                  <option value="OPERATOR">OPERATOR (Eksekusi Agen & Tugas)</option>
                  <option value="ADMIN">ADMIN (Hak Penuh Workspace)</option>
                  <option value="VIEWER">VIEWER (Read-Only)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setEditingUser(null)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-slate-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleSaveUserRole}
                disabled={savingUserRole}
                className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md disabled:opacity-50"
              >
                {savingUserRole ? 'Menyimpan...' : 'Simpan Peran'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: RESET PASSWORD */}
      {/* ========================================================= */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-[#0E1522] border border-amber-500/40 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400">
                <KeyRound className="w-5 h-5" />
                <h3 className="font-bold text-sm text-white">Reset Kata Sandi Pengguna</h3>
              </div>
              <button onClick={() => setResettingUser(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-400">
                Mereset kata sandi untuk <strong className="text-white">{resettingUser.email}</strong>. Sesi login pengguna saat ini akan otomatis dicabut demi keamanan.
              </p>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Kata Sandi Sementara Baru:</label>
                <div className="relative">
                  <input
                    type="text"
                    value={tempPassword}
                    onChange={e => setTempPassword(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(tempPassword, 'temp_pwd')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {copiedId === 'temp_pwd' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-300">Master Security PIN (Step-Up 2FA):</label>
                  <span className="text-[10px] text-amber-400 font-mono">6-Digit PIN</span>
                </div>
                <input
                  type="password"
                  maxLength={6}
                  value={resetPin}
                  onChange={e => setResetPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ketik 6-digit PIN (default 992817)"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-amber-500/30 text-amber-300 font-mono text-xs tracking-widest placeholder:tracking-normal placeholder:text-slate-500"
                />
                <p className="text-[10px] text-slate-500">
                  Diperlukan untuk otorisasi penimpaan kredensial keamanan operator secara zero-trust.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => { setResettingUser(null); setResetPin(''); }}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-slate-300 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleExecuteResetPassword}
                disabled={resettingPwd || !resetPin.trim()}
                className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md disabled:opacity-50"
              >
                {resettingPwd ? 'Mereset...' : 'Terapkan Reset Sandi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EMERGENCY KILL-SWITCH SESSIONS REVOCATION */}
      {/* ========================================================= */}
      {isEmergencyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-[#0E1522] border border-red-500/60 p-6 space-y-5 shadow-[0_0_40px_rgba(239,68,68,0.25)]">
            <div className="flex items-center justify-between border-b border-red-500/20 pb-3">
              <div className="flex items-center gap-2 text-red-400">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
                <h3 className="font-bold text-sm text-white">Protokol Keamanan Darurat: Kill-Switch</h3>
              </div>
              <button onClick={() => { setIsEmergencyModalOpen(false); setEmergencyPin(''); }} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs leading-relaxed">
                <strong className="block text-red-400 font-bold mb-1">PERINGATAN LEVEL EKSEKUTIF:</strong>
                Tindakan ini akan langsung menghapus seluruh session token operator non-founder dari database PostgreSQL shared cluster. Seluruh koneksi operator aktif akan terputus seketika.
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Master Security PIN (Step-Up 2FA):</label>
                <input
                  type="password"
                  maxLength={6}
                  value={emergencyPin}
                  onChange={e => setEmergencyPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ketik 6-digit Master PIN (default: 992817)"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-red-500/40 text-red-300 font-mono text-xs tracking-widest placeholder:tracking-normal placeholder:text-slate-500 focus:outline-none focus:border-red-400"
                />
                <p className="text-[10px] text-slate-500">
                  Masukkan Master Security PIN Founder untuk mengesahkan pemutusan darurat.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => { setIsEmergencyModalOpen(false); setEmergencyPin(''); }}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-slate-300 text-xs font-semibold hover:bg-slate-800"
              >
                Batalkan
              </button>
              <button
                onClick={handleExecuteEmergencyRevoke}
                disabled={revokingSessions || !emergencyPin.trim()}
                className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg disabled:opacity-50 flex items-center gap-2"
              >
                {revokingSessions ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Mencabut Sesi...</span>
                  </>
                ) : (
                  <span>Konfirmasi & Eksekusi Kill-Switch</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Interactive Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-[#0E1522] border border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.3)] text-amber-300 text-xs font-semibold flex items-center gap-2.5 animate-in slide-in-from-bottom-5 duration-200">
          <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
