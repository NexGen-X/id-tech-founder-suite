import React, { useState, useEffect, useMemo } from 'react';
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
  ShieldAlert,
  Command,
  ArrowUpRight,
  GitBranch,
  GitCommit,
  Globe,
  Play,
  Layers,
  ArrowRight
} from 'lucide-react';
import { api } from '../../services/api.js';

type SuiteTab = 
  | 'cockpit' 
  | 'tenants' 
  | 'users' 
  | 'billing' 
  | 'swarm' 
  | 'database' 
  | 'deployments' 
  | 'audit' 
  | 'governance';

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
  const [dbStats, setDbStats] = useState<any>(null);
  const [deploymentsData, setDeploymentsData] = useState<any>(null);

  // Command Palette States
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [paletteSearch, setPaletteSearch] = useState('');

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

  // SQL Console States
  const [sqlQuery, setSqlQuery] = useState('SELECT id, name, plan, task_quota_limit, plan_status FROM workspaces LIMIT 10;');
  const [runningSql, setRunningSql] = useState(false);
  const [sqlResult, setSqlResult] = useState<any | null>(null);
  const [sqlError, setSqlError] = useState<string | null>(null);

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

  // Global Command Palette Shortcut (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
        bcRes,
        dbRes,
        depRes
      ] = await Promise.all([
        api.getMetrics().catch(() => null),
        api.getFinancials().catch(() => null),
        api.getWorkspaces({ search: wsSearch, plan: wsPlanFilter, status: wsStatusFilter }).catch(() => null),
        api.getUsers({ search: userSearch, plan: userPlanFilter }).catch(() => null),
        api.getInvoices({ search: invSearch, status: invStatusFilter }).catch(() => null),
        api.getSwarmTelemetry().catch(() => null),
        api.getAuditLogs({ limit: 100, search: auditSearch }).catch(() => null),
        api.getSystemHealth().catch(() => null),
        api.getBroadcast().catch(() => null),
        api.getDatabaseStats().catch(() => null),
        api.getDeployments().catch(() => null)
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
      if (dbRes?.stats) setDbStats(dbRes.stats);
      if (depRes) setDeploymentsData(depRes);
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

  // Actions: Reset Password with Step-Up PIN
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

  // Actions: Execute Read-Only SQL Query
  const handleRunSqlQuery = async () => {
    if (!sqlQuery.trim()) return;
    setRunningSql(true);
    setSqlError(null);
    setSqlResult(null);

    try {
      const res = await api.runDatabaseQuery(sqlQuery.trim());
      setSqlResult(res);
      showToast(`Query selesai dalam ${res.executionTimeMs}ms (${res.rowCount} baris).`);
    } catch (err: any) {
      setSqlError(err.message || 'Gagal mengeksekusi query SQL.');
      showToast(`SQL Error: ${err.message}`);
    } finally {
      setRunningSql(false);
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

  // Sparkline Generator Helper
  const renderSparkline = (data: number[], color: string = '#10B981', height: number = 24, width: number = 80) => {
    if (!data || data.length < 2) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((d - min) / range) * (height - 6) - 3;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width={width} height={height} className="overflow-visible shrink-0">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  // Filtered command palette items
  const filteredPaletteItems = useMemo(() => {
    const q = paletteSearch.toLowerCase().trim();
    if (!q) {
      return [
        { type: 'nav', id: 'cockpit', label: 'Overview Cockpit', icon: TrendingUp },
        { type: 'nav', id: 'tenants', label: 'Workspaces Matrix', icon: Building2 },
        { type: 'nav', id: 'users', label: 'Users & RBAC Directory', icon: Users },
        { type: 'nav', id: 'billing', label: 'Billing & Invoices', icon: DollarSign },
        { type: 'nav', id: 'swarm', label: 'AI Swarm Fleet & Daemons', icon: Cpu },
        { type: 'nav', id: 'database', label: 'Postgres Engine Telemetry & Query', icon: Database },
        { type: 'nav', id: 'deployments', label: 'Deployments & Git CI/CD', icon: Server },
        { type: 'nav', id: 'audit', label: 'SOC2 Audit Trail Logs', icon: Activity },
        { type: 'nav', id: 'governance', label: 'Platform Governance & Kill Switch', icon: ShieldCheck },
        { type: 'action', id: 'action-new-ws', label: '+ Provisi Workspace Baru', icon: Plus },
        { type: 'action', id: 'action-export-soc2', label: 'Unduh SOC2 Audit Trail CSV', icon: Download },
        { type: 'action', id: 'action-emergency', label: 'Eksekusi Protokol Darurat Kill-Switch', icon: ShieldAlert }
      ];
    }

    const results: any[] = [];

    // Filter Navigation
    const navs = [
      { id: 'cockpit', label: 'Overview Cockpit', icon: TrendingUp },
      { id: 'tenants', label: 'Workspaces Matrix', icon: Building2 },
      { id: 'users', label: 'Users & RBAC Directory', icon: Users },
      { id: 'billing', label: 'Billing & Invoices', icon: DollarSign },
      { id: 'swarm', label: 'AI Swarm Fleet & Daemons', icon: Cpu },
      { id: 'database', label: 'Postgres Engine Telemetry & Query', icon: Database },
      { id: 'deployments', label: 'Deployments & Git CI/CD', icon: Server },
      { id: 'audit', label: 'SOC2 Audit Trail Logs', icon: Activity },
      { id: 'governance', label: 'Platform Governance & Kill Switch', icon: ShieldCheck }
    ].filter(n => n.label.toLowerCase().includes(q));

    results.push(...navs.map(n => ({ type: 'nav', ...n })));

    // Filter Workspaces
    workspaces.forEach(ws => {
      if (ws.name?.toLowerCase().includes(q) || ws.plan?.toLowerCase().includes(q)) {
        results.push({
          type: 'workspace',
          id: ws.id,
          label: `Workspace: ${ws.name} (${ws.plan})`,
          raw: ws,
          icon: Building2
        });
      }
    });

    // Filter Users
    users.forEach(u => {
      if (u.email?.toLowerCase().includes(q) || u.displayName?.toLowerCase().includes(q)) {
        results.push({
          type: 'user',
          id: u.id,
          label: `User: ${u.displayName || u.email} (${u.role})`,
          raw: u,
          icon: Users
        });
      }
    });

    return results;
  }, [paletteSearch, workspaces, users]);

  const handleSelectPaletteItem = (item: any) => {
    setIsCommandPaletteOpen(false);
    setPaletteSearch('');

    if (item.type === 'nav') {
      setActiveTab(item.id);
    } else if (item.id === 'action-new-ws') {
      setIsCreateWsOpen(true);
    } else if (item.id === 'action-export-soc2') {
      window.open(api.getExportUrl('audit-logs'), '_blank');
    } else if (item.id === 'action-emergency') {
      setIsEmergencyModalOpen(true);
    } else if (item.type === 'workspace') {
      setActiveTab('tenants');
      setEditingWorkspace(item.raw);
      setEditWsPlan(item.raw.plan);
      setEditWsQuota(item.raw.taskQuotaLimit);
      setEditWsStatus(item.raw.planStatus);
    } else if (item.type === 'user') {
      setActiveTab('users');
      setEditingUser(item.raw);
      setEditUserRole(item.raw.role);
    }
  };

  const navTabs: { id: SuiteTab; label: string; badge?: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'cockpit', label: 'Overview', icon: TrendingUp },
    { id: 'tenants', label: 'Workspaces', badge: `${workspaces.length}`, icon: Building2 },
    { id: 'users', label: 'Users & RBAC', badge: `${users.length}`, icon: Users },
    { id: 'billing', label: 'Billing & Invoices', badge: `${invoices.length}`, icon: DollarSign },
    { id: 'swarm', label: 'AI Swarm', badge: '7 Nodes', icon: Cpu },
    { id: 'database', label: 'Postgres Engine', badge: '100% Cache', icon: Database },
    { id: 'deployments', label: 'Deployments & Git', badge: '3 Ready', icon: Server },
    { id: 'audit', label: 'Audit Trail', badge: 'SOC2', icon: Activity },
    { id: 'governance', label: 'Governance & Security', icon: ShieldCheck }
  ];

  return (
    <div className="min-h-screen bg-[#000000] text-neutral-100 flex flex-col font-sans select-none antialiased">
      {/* Vercel / Railway Minimal Dot Matrix Background */}
      <div className="fixed inset-0 bg-[radial-gradient(#1f1f1f_1px,transparent_1px)] bg-[size:1.75rem_1.75rem] pointer-events-none opacity-70" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[50rem] h-[15rem] bg-gradient-to-b from-white/[0.03] to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* ========================================================= */}
      {/* GLOBAL TOPBAR & PROJECT SELECTOR (ALA VERCEL & RAILWAY) */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-40 bg-[#000000]/85 backdrop-blur-md border-b border-[#1f1f1f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Left: Organization & Project Breadcrumb */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white shadow-sm">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <span className="font-bold tracking-tight text-sm text-white flex items-center gap-1.5">
                <span>ID-TECH</span>
                <span className="text-neutral-500 font-normal">/</span>
                <span className="text-neutral-300 font-mono text-xs">founder-suite</span>
              </span>
            </div>

            {/* Railway Production Pill */}
            <div className="hidden md:flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#0a0a0a] border border-[#262626] text-[11px] font-mono text-neutral-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>production</span>
              <span className="text-neutral-600">•</span>
              <span className="text-neutral-500">Railway ap-se-1</span>
            </div>
          </div>

          {/* Center: Command Palette Trigger Button (⌘K) */}
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="flex-1 max-w-sm hidden sm:flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#0a0a0a] border border-[#222] hover:border-[#333] text-neutral-400 text-xs transition shadow-inner group"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-300 transition" />
              <span className="text-neutral-500 group-hover:text-neutral-300">Quick search commands, tenants, users...</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-neutral-400">
              ⌘K
            </kbd>
          </button>

          {/* Right: Telemetry Refresh, Emergency Badge & User Profile */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => loadAllData(true)}
              disabled={refreshing}
              title="Refresh Telemetry Data"
              className="p-2 rounded-lg bg-[#0a0a0a] border border-[#222] hover:border-[#333] text-neutral-400 hover:text-white transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            <button
              onClick={() => setIsEmergencyModalOpen(true)}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/30 border border-red-500/30 text-red-300 text-xs font-mono font-medium hover:bg-red-900/30 transition"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span>Kill-Switch</span>
            </button>

            <div className="h-4 w-px bg-[#222]" />

            <div className="flex items-center gap-2 pl-1">
              <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-mono text-xs font-bold">
                AW
              </div>
              <div className="hidden xl:block text-left">
                <div className="text-xs font-medium text-white leading-tight">Arjun Wijaya</div>
                <div className="text-[10px] font-mono text-amber-400">Founder Level 5</div>
              </div>
              <button
                onClick={handleLogoutAction}
                title="Keluar dari Founder Suite"
                className="p-2 rounded-lg hover:bg-neutral-900 text-neutral-400 hover:text-white transition ml-1"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SUB-NAVBAR TABS (ALA VERCEL PROJECT NAVIGATION) */}
        {/* ========================================================= */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-[#1a1a1a]">
          {navTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative py-3 px-3 text-xs font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${
                  isActive ? 'text-white' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive 
                      ? 'bg-white/10 text-neutral-200' 
                      : 'bg-[#141414] text-neutral-500'
                  }`}>
                    {tab.badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-t-full shadow-[0_-2px_8px_rgba(255,255,255,0.4)]" />
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Global Live Announcement Alert if active */}
      {broadcast && broadcast.enabled && (
        <div className={`px-4 py-2 border-b text-xs flex items-center justify-between z-30 ${
          broadcast.type === 'critical'
            ? 'bg-red-950/50 border-red-500/40 text-red-200'
            : broadcast.type === 'warning'
            ? 'bg-amber-950/50 border-amber-500/40 text-amber-200'
            : 'bg-neutral-900 border-[#222] text-neutral-300'
        }`}>
          <div className="max-w-7xl mx-auto w-full flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 animate-pulse shrink-0 text-amber-400" />
            <span className="font-mono text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-black/40">
              BROADCAST
            </span>
            <span className="truncate">{broadcast.message}</span>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MAIN CONTENT AREA */}
      {/* ========================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8 z-10">
        
        {/* ========================================================= */}
        {/* TAB 1: OVERVIEW COCKPIT */}
        {/* ========================================================= */}
        {activeTab === 'cockpit' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Top Stat Row with Real-Time Sparklines */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: MRR */}
              <div className="p-5 rounded-2xl bg-[#0a0a0a] border border-[#1f1f1f] hover:border-[#333] transition-all duration-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">Monthly Recurring Revenue</span>
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-2xl font-bold tracking-tight text-white font-mono">
                      {formatIdr(financials?.mrr || 998000)}
                    </div>
                    <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-mono">
                      <span>↑ 100% MoM</span>
                      <span className="text-neutral-500">• ARR {formatIdr((financials?.mrr || 998000) * 12)}</span>
                    </div>
                  </div>
                  {renderSparkline([499000, 650000, 750000, 890000, 998000], '#10B981', 28, 70)}
                </div>
              </div>

              {/* Card 2: Active Workspaces */}
              <div className="p-5 rounded-2xl bg-[#0a0a0a] border border-[#1f1f1f] hover:border-[#333] transition-all duration-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">Total Workspaces</span>
                  <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-2xl font-bold tracking-tight text-white font-mono">
                      {workspaces.length || 5}
                    </div>
                    <div className="text-[11px] text-sky-400 flex items-center gap-1 mt-1 font-mono">
                      <span>100% Active</span>
                      <span className="text-neutral-500">• 0% Churn</span>
                    </div>
                  </div>
                  {renderSparkline([1, 2, 3, 4, 5], '#38BDF8', 28, 70)}
                </div>
              </div>

              {/* Card 3: AI Swarm Tasks Throughput */}
              <div className="p-5 rounded-2xl bg-[#0a0a0a] border border-[#1f1f1f] hover:border-[#333] transition-all duration-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">Autonomous Tasks Done</span>
                  <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Cpu className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-2xl font-bold tracking-tight text-white font-mono">
                      {swarmTelemetry?.tasksSummary?.done || 19}
                    </div>
                    <div className="text-[11px] text-purple-400 flex items-center gap-1 mt-1 font-mono">
                      <span>7 Nodes Live</span>
                      <span className="text-neutral-500">• SLA 99.98%</span>
                    </div>
                  </div>
                  {renderSparkline([5, 8, 12, 16, 19], '#A855F7', 28, 70)}
                </div>
              </div>

              {/* Card 4: Midtrans Cash Collected */}
              <div className="p-5 rounded-2xl bg-[#0a0a0a] border border-[#1f1f1f] hover:border-[#333] transition-all duration-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">Midtrans Net Cash</span>
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <DollarSign className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-2xl font-bold tracking-tight text-white font-mono">
                      {formatIdr(financials?.totalCashPaid || 998000)}
                    </div>
                    <div className="text-[11px] text-amber-400 flex items-center gap-1 mt-1 font-mono">
                      <span>100% Settled</span>
                      <span className="text-neutral-500">• Snap Live</span>
                    </div>
                  </div>
                  {renderSparkline([300000, 500000, 800000, 998000], '#F59E0B', 28, 70)}
                </div>
              </div>
            </div>

            {/* Quick Action Dock */}
            <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-[#1f1f1f] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-neutral-300">Executive Quick Actions:</span>
                <button
                  onClick={() => setIsCreateWsOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Provisi Workspace</span>
                </button>
                <button
                  onClick={() => setActiveTab('database')}
                  className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-medium flex items-center gap-1.5 transition"
                >
                  <Database className="w-3.5 h-3.5 text-sky-400" />
                  <span>Konsol PostgreSQL</span>
                </button>
                <button
                  onClick={() => window.open(api.getExportUrl('audit-logs'), '_blank')}
                  className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-medium flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Ekspor SOC2 CSV</span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-500">
                <span>Tekan</span>
                <kbd className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                  ⌘K
                </kbd>
                <span>untuk membuka command bar global</span>
              </div>
            </div>

            {/* Two Column Layout: Recent Tenants & Live Infrastructure */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Recent Workspaces */}
              <div className="lg:col-span-2 rounded-2xl bg-[#0a0a0a] border border-[#1f1f1f] p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-neutral-400" />
                    <h3 className="text-sm font-semibold text-white">Multi-Tenant Workspaces</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('tenants')}
                    className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 font-mono transition"
                  >
                    <span>View all ({workspaces.length})</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="divide-y divide-[#1a1a1a]">
                  {workspaces.slice(0, 5).map(ws => (
                    <div key={ws.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <div className="text-xs font-medium text-white flex items-center gap-2">
                          <span>{ws.name}</span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                            ws.plan === 'ENTERPRISE' ? 'bg-purple-950/60 text-purple-300 border border-purple-500/30' :
                            ws.plan === 'BUSINESS' ? 'bg-sky-950/60 text-sky-300 border border-sky-500/30' :
                            'bg-neutral-900 text-neutral-300 border border-neutral-800'
                          }`}>
                            {ws.plan}
                          </span>
                        </div>
                        <div className="text-[11px] text-neutral-500 font-mono">
                          ID: {ws.id} • Kuota: {ws.usedTasksCount || 0} / {ws.taskQuotaLimit} Tugas
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-[10px] font-mono text-emerald-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          {ws.planStatus || 'ACTIVE'}
                        </span>
                        <button
                          onClick={() => {
                            setActiveTab('tenants');
                            setEditingWorkspace(ws);
                            setEditWsPlan(ws.plan);
                            setEditWsQuota(ws.taskQuotaLimit);
                            setEditWsStatus(ws.planStatus);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] text-neutral-300 font-medium transition"
                        >
                          Kelola
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right 1 Col: Live Cluster & Infrastructure Status */}
              <div className="rounded-2xl bg-[#0a0a0a] border border-[#1f1f1f] p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-semibold text-white">Cluster Telemetry</h3>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">ONLINE</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-neutral-950 border border-[#1a1a1a] space-y-1">
                    <div className="text-[10px] font-mono uppercase text-neutral-500">Database Engine</div>
                    <div className="text-xs font-semibold text-white flex items-center justify-between">
                      <span>PostgreSQL 18.6 (Railway)</span>
                      <span className="text-emerald-400 font-mono">100% Cache</span>
                    </div>
                    <div className="text-[11px] text-neutral-500 font-mono">
                      Host: sakura.proxy.rlwy.net:36465
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-950 border border-[#1a1a1a] space-y-1">
                    <div className="text-[10px] font-mono uppercase text-neutral-500">Edge Gateway & TLS</div>
                    <div className="text-xs font-semibold text-white flex items-center justify-between">
                      <span>Caddy 2.8 + Cloudflare</span>
                      <span className="text-sky-400 font-mono">HSTS Preload</span>
                    </div>
                    <div className="text-[11px] text-neutral-500 font-mono">
                      Zero Fingerprint • Strict CSP
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-950 border border-[#1a1a1a] space-y-1">
                    <div className="text-[10px] font-mono uppercase text-neutral-500">Zero-Trust Security Level</div>
                    <div className="text-xs font-semibold text-white flex items-center justify-between">
                      <span>Founder Level 5 clearance</span>
                      <span className="text-amber-400 font-mono">2FA Step-Up</span>
                    </div>
                    <div className="text-[11px] text-neutral-500 font-mono">
                      Anti-Brute Force (5 attempts lockout)
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('deployments')}
                  className="w-full mt-2 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-neutral-300 transition flex items-center justify-center gap-1.5"
                >
                  <span>Cek Semua Deployment & PoPs</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: WORKSPACES / MULTI-TENANT MATRIX */}
        {/* ========================================================= */}
        {activeTab === 'tenants' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-white">Multi-Tenant Workspaces Matrix</h2>
                <p className="text-xs text-neutral-400">Kelola batas kuota, siklus langganan, dan provisi tenant organisasi.</p>
              </div>
              <button
                onClick={() => setIsCreateWsOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold flex items-center gap-2 transition self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Provisi Tenant Baru</span>
              </button>
            </div>

            {/* Filter Bar */}
            <div className="p-3 rounded-2xl bg-[#0a0a0a] border border-[#1f1f1f] flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  value={wsSearch}
                  onChange={e => setWsSearch(e.target.value)}
                  placeholder="Cari nama tenant atau ID workspace..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-black border border-[#262626] text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-400 font-mono"
                />
              </div>

              <select
                value={wsPlanFilter}
                onChange={e => setWsPlanFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-black border border-[#262626] text-xs text-neutral-300 focus:outline-none font-mono"
              >
                <option value="ALL">Semua Paket</option>
                <option value="FREE">FREE</option>
                <option value="STARTER">STARTER</option>
                <option value="BUSINESS">BUSINESS</option>
                <option value="ENTERPRISE">ENTERPRISE</option>
              </select>

              <select
                value={wsStatusFilter}
                onChange={e => setWsStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-black border border-[#262626] text-xs text-neutral-300 focus:outline-none font-mono"
              >
                <option value="ALL">Semua Status</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="TRIALING">TRIALING</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>

            {/* Workspaces Table */}
            <div className="rounded-2xl bg-[#0a0a0a] border border-[#1f1f1f] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-black/60 border-b border-[#1f1f1f] text-neutral-400 font-mono text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Nama Workspace</th>
                      <th className="py-3 px-4">Paket & Kuota Tugas</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Pengeluaran Midtrans</th>
                      <th className="py-3 px-4 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a1a1a]">
                    {workspaces.map(ws => (
                      <tr key={ws.id} className="hover:bg-white/[0.02] transition">
                        <td className="py-3 px-4">
                          <div className="font-medium text-white flex items-center gap-2">
                            <span>{ws.name}</span>
                          </div>
                          <div className="text-[10px] font-mono text-neutral-500">ID: {ws.id}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-neutral-200">{ws.plan}</span>
                            <span className="text-neutral-500 font-mono text-[11px]">
                              ({ws.usedTasksCount || 0} / {ws.taskQuotaLimit} kuota)
                            </span>
                          </div>
                          <div className="w-32 bg-neutral-900 h-1.5 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className="bg-sky-400 h-full rounded-full"
                              style={{ width: `${Math.min(100, ((ws.usedTasksCount || 0) / (ws.taskQuotaLimit || 1)) * 100)}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono ${
                            ws.planStatus === 'ACTIVE' ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300' :
                            ws.planStatus === 'TRIALING' ? 'bg-amber-950/40 border border-amber-500/30 text-amber-300' :
                            'bg-red-950/40 border border-red-500/30 text-red-300'
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {ws.planStatus || 'ACTIVE'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-neutral-300">
                          {formatIdr(ws.totalSpent || 0)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setEditingWorkspace(ws);
                              setEditWsPlan(ws.plan);
                              setEditWsQuota(ws.taskQuotaLimit);
                              setEditWsStatus(ws.planStatus);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] text-neutral-300 font-medium transition"
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
        {/* TAB 3: USERS & RBAC DIRECTORY */}
        {/* ========================================================= */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-white">Users & Access Control Directory</h2>
                <p className="text-xs text-neutral-400">Pemberian hak akses RBAC dan reset kata sandi operator berstandar zero-trust.</p>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="p-3 rounded-2xl bg-[#0a0a0a] border border-[#1f1f1f] flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  placeholder="Cari nama atau email operator..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-black border border-[#262626] text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-400 font-mono"
                />
              </div>

              <select
                value={userPlanFilter}
                onChange={e => setUserPlanFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-black border border-[#262626] text-xs text-neutral-300 focus:outline-none font-mono"
              >
                <option value="ALL">Semua Peran</option>
                <option value="ADMIN">ADMIN</option>
                <option value="OPERATOR">OPERATOR</option>
                <option value="VIEWER">VIEWER</option>
              </select>
            </div>

            {/* Users Table */}
            <div className="rounded-2xl bg-[#0a0a0a] border border-[#1f1f1f] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-black/60 border-b border-[#1f1f1f] text-neutral-400 font-mono text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Operator</th>
                      <th className="py-3 px-4">Workspace Afiliasi</th>
                      <th className="py-3 px-4">Hak Akses (RBAC)</th>
                      <th className="py-3 px-4">Sesi Login</th>
                      <th className="py-3 px-4 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a1a1a]">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-white/[0.02] transition">
                        <td className="py-3 px-4">
                          <div className="font-medium text-white">{u.displayName || u.email}</div>
                          <div className="text-[11px] text-neutral-500 font-mono">{u.email}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-neutral-300">
                          {u.workspaceName || 'Default Command Center'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono ${
                            u.role === 'ADMIN' ? 'bg-amber-950/40 border border-amber-500/30 text-amber-300' :
                            u.role === 'OPERATOR' ? 'bg-sky-950/40 border border-sky-500/30 text-sky-300' :
                            'bg-neutral-900 border border-neutral-800 text-neutral-400'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {u.hasActiveSession ? (
                            <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              Aktif
                            </span>
                          ) : (
                            <span className="text-neutral-500 font-mono text-[11px]">Tidak Ada</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setEditingUser(u);
                              setEditUserRole(u.role);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] text-neutral-300 font-medium transition"
                          >
                            Peran
                          </button>
                          <button
                            onClick={() => {
                              setResettingUser(u);
                              setTempPassword(`IdTech#${Math.random().toString(36).slice(-6)}!`);
                              setResetPin('');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-[11px] text-amber-300 font-medium transition"
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
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-white">Billing & Midtrans Invoices</h2>
                <p className="text-xs text-neutral-400">Rekonsiliasi transaksi pembayaran Midtrans Snap & aktivasi paket langganan.</p>
              </div>
              <button
                onClick={() => window.open(api.getExportUrl('invoices'), '_blank')}
                className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-medium flex items-center gap-2 transition self-start sm:self-auto"
              >
                <Download className="w-4 h-4 text-neutral-400" />
                <span>Unduh CSV Faktur</span>
              </button>
            </div>

            {/* Invoices Table */}
            <div className="rounded-2xl bg-[#0a0a0a] border border-[#1f1f1f] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-black/60 border-b border-[#1f1f1f] text-neutral-400 font-mono text-[11px]">
                    <tr>
                      <th className="py-3 px-4">No. Faktur</th>
                      <th className="py-3 px-4">Workspace</th>
                      <th className="py-3 px-4">Jumlah (IDR)</th>
                      <th className="py-3 px-4">Metode Bayar</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a1a1a]">
                    {invoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-white/[0.02] transition">
                        <td className="py-3 px-4 font-mono font-medium text-white">
                          #{inv.invoiceNumber || inv.id.slice(0, 8)}
                        </td>
                        <td className="py-3 px-4 font-medium text-neutral-300">
                          {inv.workspaceName || inv.workspaceId}
                        </td>
                        <td className="py-3 px-4 font-mono text-white font-bold">
                          {formatIdr(inv.amount)}
                        </td>
                        <td className="py-3 px-4 font-mono text-neutral-400">
                          {inv.paymentMethod || 'Midtrans Snap'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono ${
                            inv.status === 'PAID' ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300' :
                            inv.status === 'PENDING' ? 'bg-amber-950/40 border border-amber-500/30 text-amber-300' :
                            'bg-red-950/40 border border-red-500/30 text-red-300'
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {inv.status !== 'PAID' && (
                            <button
                              onClick={() => handleMarkInvoicePaid(inv.id)}
                              disabled={settlingInvoice}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium transition"
                            >
                              Tandai Lunas
                            </button>
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
        {/* TAB 5: AI SWARM FLEET */}
        {/* ========================================================= */}
        {activeTab === 'swarm' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white">AI Swarm Autonomous Fleet</h2>
              <p className="text-xs text-neutral-400">Telemetri armada multi-agent otonom dan cron daemons pemeliharaan 24/7.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {swarmTelemetry?.agents?.map((agent: any) => (
                <div key={agent.id} className="p-5 rounded-2xl bg-[#0a0a0a] border border-[#1f1f1f] hover:border-[#333] transition space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-purple-400">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{agent.name}</div>
                        <div className="text-[10px] font-mono text-neutral-500">{agent.role}</div>
                      </div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>

                  <div className="pt-2 border-t border-[#1a1a1a] flex items-center justify-between text-[11px] font-mono">
                    <span className="text-neutral-500">Model Engine:</span>
                    <span className="text-purple-300 px-2 py-0.5 rounded bg-purple-950/40 border border-purple-500/30">
                      {agent.model || 'GPT-4o'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                    <span>Status Eksekusi:</span>
                    <span className="text-emerald-400">IDLE / STANDBY</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: RAILWAY POSTGRES ENGINE (NEW ALA RAILWAY) */}
        {/* ========================================================= */}
        {activeTab === 'database' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-sky-400" />
                  <span>Railway PostgreSQL 18 Engine Cockpit</span>
                </h2>
                <p className="text-xs text-neutral-400">Telemetri real-time koneksi cluster, shared memory buffer, dan konsol SQL read-only eksekutif.</p>
              </div>

              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#0a0a0a] border border-[#222] text-xs font-mono text-neutral-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Cluster Online: {dbStats?.pingMs || 18}ms</span>
              </div>
            </div>

            {/* DB Stat Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-[#1f1f1f] space-y-1">
                <div className="text-[10px] font-mono uppercase text-neutral-500">Database Size</div>
                <div className="text-2xl font-bold font-mono text-white">{dbStats?.size || '12 MB'}</div>
                <div className="text-[10px] font-mono text-neutral-500">35 User Tables</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-[#1f1f1f] space-y-1">
                <div className="text-[10px] font-mono uppercase text-neutral-500">Active Connections</div>
                <div className="text-2xl font-bold font-mono text-emerald-400">
                  {dbStats?.connections?.active || 1} <span className="text-xs text-neutral-500">/ {dbStats?.connections?.total || 11}</span>
                </div>
                <div className="text-[10px] font-mono text-neutral-500">Pool Capacity 20</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-[#1f1f1f] space-y-1">
                <div className="text-[10px] font-mono uppercase text-neutral-500">Cache Hit Ratio</div>
                <div className="text-2xl font-bold font-mono text-sky-400">{dbStats?.cacheHitRatio || '100.00'}%</div>
                <div className="text-[10px] font-mono text-emerald-400">Optimal In-Memory Read</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0a0a0a] border border-[#1f1f1f] space-y-1">
                <div className="text-[10px] font-mono uppercase text-neutral-500">Transactions Committed</div>
                <div className="text-2xl font-bold font-mono text-purple-400">
                  {(dbStats?.transactions?.committed || 49000).toLocaleString()}
                </div>
                <div className="text-[10px] font-mono text-neutral-500">{dbStats?.transactions?.rollbacks || 12} Rollbacks (99.98% OK)</div>
              </div>
            </div>

            {/* Split View: Tables & SQL Console */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Tables Browser */}
              <div className="rounded-2xl bg-[#0a0a0a] border border-[#1f1f1f] p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#1a1a1a]">
                  <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">User Tables ({dbStats?.tables?.length || 10})</h3>
                  <span className="text-[10px] font-mono text-neutral-500">Rows / Disk</span>
                </div>

                <div className="space-y-1.5 max-h-[380px] overflow-y-auto no-scrollbar pr-1">
                  {dbStats?.tables?.map((tbl: any) => (
                    <button
                      key={tbl.table_name}
                      onClick={() => setSqlQuery(`SELECT * FROM ${tbl.table_name} LIMIT 10;`)}
                      className="w-full p-2.5 rounded-xl bg-black/60 hover:bg-white/[0.04] border border-[#1a1a1a] flex items-center justify-between text-left transition group"
                    >
                      <div className="font-mono text-xs text-neutral-300 group-hover:text-white flex items-center gap-1.5">
                        <Terminal className="w-3 h-3 text-sky-400" />
                        <span>{tbl.table_name}</span>
                      </div>
                      <div className="text-[10px] font-mono text-neutral-500 group-hover:text-neutral-300">
                        {tbl.row_estimate || 0} rows • {tbl.total_size || 'N/A'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right 2 Columns: Safe SQL Query Console */}
              <div className="lg:col-span-2 rounded-2xl bg-[#0a0a0a] border border-[#1f1f1f] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                      Safe Read-Only Query Console
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
                    SELECT & EXPLAIN ONLY
                  </span>
                </div>

                {/* Preset Query Shortcuts */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono text-neutral-500">Presets:</span>
                  {[
                    { label: 'Workspaces', q: 'SELECT id, name, plan, task_quota_limit FROM workspaces LIMIT 10;' },
                    { label: 'Users', q: 'SELECT id, email, display_name, role FROM human_users LIMIT 10;' },
                    { label: 'Invoices', q: 'SELECT id, amount, status, payment_method FROM workspace_invoices LIMIT 10;' },
                    { label: 'Activities', q: 'SELECT event_type, actor_name, summary, created_at FROM activities ORDER BY created_at DESC LIMIT 10;' }
                  ].map(p => (
                    <button
                      key={p.label}
                      onClick={() => setSqlQuery(p.q)}
                      className="px-2 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[10px] font-mono text-neutral-300 transition"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Query Input */}
                <div className="relative">
                  <textarea
                    rows={3}
                    value={sqlQuery}
                    onChange={e => setSqlQuery(e.target.value)}
                    placeholder="Tulis query SELECT Anda di sini..."
                    className="w-full p-3 rounded-xl bg-black border border-[#262626] text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500 transition leading-relaxed resize-none"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-neutral-500">
                    Statement timeout 3000ms • Auto-limit 50 rows
                  </span>
                  <button
                    onClick={handleRunSqlQuery}
                    disabled={runningSql || !sqlQuery.trim()}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{runningSql ? 'Running...' : 'Execute Query'}</span>
                  </button>
                </div>

                {/* SQL Result Output */}
                {sqlError && (
                  <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs font-mono">
                    {sqlError}
                  </div>
                )}

                {sqlResult && (
                  <div className="space-y-2 pt-2 border-t border-[#1a1a1a]">
                    <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                      <span>Hasil Query ({sqlResult.rowCount} baris)</span>
                      <span className="text-emerald-400">⚡ Selesai dalam {sqlResult.executionTimeMs}ms</span>
                    </div>

                    <div className="max-h-[260px] overflow-auto rounded-xl border border-[#1f1f1f] bg-black">
                      <table className="w-full text-left text-[11px] font-mono">
                        <thead className="bg-neutral-950 border-b border-[#1f1f1f] text-neutral-400 sticky top-0">
                          <tr>
                            {sqlResult.fields?.map((f: string) => (
                              <th key={f} className="py-2 px-3 whitespace-nowrap">{f}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1a1a1a]">
                          {sqlResult.rows?.map((row: any, i: number) => (
                            <tr key={i} className="hover:bg-white/[0.02]">
                              {sqlResult.fields?.map((f: string) => (
                                <td key={f} className="py-2 px-3 whitespace-nowrap text-neutral-300">
                                  {typeof row[f] === 'object' ? JSON.stringify(row[f]) : String(row[f] ?? '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 7: DEPLOYMENTS & GIT CI/CD (ALA VERCEL) */}
        {/* ========================================================= */}
        {activeTab === 'deployments' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  <Server className="w-5 h-5 text-emerald-400" />
                  <span>Deployments & Global Edge Telemetry</span>
                </h2>
                <p className="text-xs text-neutral-400">Pantau status deployment continuous delivery dari GitHub di seluruh domain ID-Tech Cloud.</p>
              </div>

              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#0a0a0a] border border-[#222] text-xs font-mono text-neutral-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Global SLA: 99.98%</span>
              </div>
            </div>

            {/* 3 Repositories Production Deployments Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {deploymentsData?.deployments?.map((dep: any) => (
                <div key={dep.id} className="p-5 rounded-2xl bg-[#0a0a0a] border border-[#1f1f1f] hover:border-[#333] transition space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-white text-xs">{dep.project}</div>
                      <a
                        href={`https://${dep.targetDomain}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-mono text-sky-400 hover:underline flex items-center gap-1 mt-0.5"
                      >
                        <span>{dep.targetDomain}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-[10px] font-mono text-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      READY
                    </span>
                  </div>

                  <div className="space-y-1.5 text-[11px] font-mono text-neutral-400 pt-3 border-t border-[#1a1a1a]">
                    <div className="flex items-center justify-between">
                      <span>Repository:</span>
                      <a
                        href={`https://github.com/${dep.repo}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-neutral-200 hover:underline flex items-center gap-1"
                      >
                        <GitBranch className="w-3 h-3" />
                        <span>{dep.branch}</span>
                      </a>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Commit SHA:</span>
                      <span className="text-white px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800">
                        {dep.commit}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Region / Port:</span>
                      <span className="text-neutral-300">{dep.port === 443 ? 'Cloudflare CDN' : `Port ${dep.port} (SG-1)`}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/60 border border-[#1a1a1a] text-[11px] text-neutral-400 line-clamp-2">
                    {dep.commitMessage}
                  </div>
                </div>
              ))}
            </div>

            {/* Edge PoP Latency Test Matrix */}
            <div className="rounded-2xl bg-[#0a0a0a] border border-[#1f1f1f] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-sky-400" />
                  <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                    Global Edge Anycast PoPs Latency (Cloudflare CDN)
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-400">ALL POPs OPERATIONAL</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {deploymentsData?.edgePops?.map((pop: any) => (
                  <div key={pop.code} className="p-3.5 rounded-xl bg-black/60 border border-[#1f1f1f] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-white text-xs">{pop.code}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    </div>
                    <div className="text-[10px] text-neutral-500 truncate">{pop.city}</div>
                    <div className="text-sm font-bold font-mono text-emerald-400 pt-1">{pop.latencyMs}ms</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 8: AUDIT TRAIL (SOC2) */}
        {/* ========================================================= */}
        {activeTab === 'audit' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-white">Immutable SOC2 Audit Trail</h2>
                <p className="text-xs text-neutral-400">Seluruh rekaman peristiwa keamanan, login, otorisasi PIN, dan pemutusan darurat dicatat permanen.</p>
              </div>
              <button
                onClick={() => window.open(api.getExportUrl('audit-logs'), '_blank')}
                className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-xs font-medium flex items-center gap-2 transition self-start sm:self-auto"
              >
                <Download className="w-4 h-4 text-neutral-400" />
                <span>Unduh Audit Logs (CSV)</span>
              </button>
            </div>

            {/* Audit Logs Table */}
            <div className="rounded-2xl bg-[#0a0a0a] border border-[#1f1f1f] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-black/60 border-b border-[#1f1f1f] text-neutral-400 font-mono text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Waktu (UTC/WIB)</th>
                      <th className="py-3 px-4">Aktor</th>
                      <th className="py-3 px-4">Event Type</th>
                      <th className="py-3 px-4">Ringkasan Aktivitas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a1a1a]">
                    {auditLogs.map((log, idx) => (
                      <tr key={log.id || idx} className="hover:bg-white/[0.02] transition">
                        <td className="py-3 px-4 font-mono text-neutral-400 text-[11px] whitespace-nowrap">
                          {log.createdAt ? new Date(log.createdAt).toLocaleString('id-ID') : 'N/A'}
                        </td>
                        <td className="py-3 px-4 font-medium text-white whitespace-nowrap">
                          {log.actorName || log.actorType}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono ${
                            log.eventType?.includes('rejected') || log.eventType?.includes('revoked')
                              ? 'bg-red-950/40 border border-red-500/30 text-red-300'
                              : log.eventType?.includes('login')
                              ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
                              : 'bg-neutral-900 border border-neutral-800 text-neutral-300'
                          }`}>
                            {log.eventType}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-neutral-300">
                          {log.summary}
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
        {/* TAB 9: GOVERNANCE & SECURITY */}
        {/* ========================================================= */}
        {activeTab === 'governance' && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white">Platform Governance & Emergency Protocols</h2>
              <p className="text-xs text-neutral-400">Siaran banner global dan protokol darurat pemutusan sesi operator non-founder.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Broadcast Banner Card */}
              <div className="rounded-2xl bg-[#0a0a0a] border border-[#1f1f1f] p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-semibold text-white">Global Broadcast Announcement</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-neutral-400">Pesan Pengumuman:</label>
                    <textarea
                      rows={3}
                      value={broadcastMsg}
                      onChange={e => setBroadcastMsg(e.target.value)}
                      placeholder="Tulis pesan pengumuman untuk seluruh operator platform..."
                      className="w-full mt-1.5 p-3 rounded-xl bg-black border border-[#262626] text-xs text-white focus:outline-none focus:border-neutral-400 resize-none font-mono"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <select
                        value={broadcastType}
                        onChange={(e: any) => setBroadcastType(e.target.value)}
                        className="px-3 py-1.5 rounded-xl bg-black border border-[#262626] text-xs text-neutral-300 font-mono"
                      >
                        <option value="info">Info (Netral)</option>
                        <option value="warning">Peringatan (Amber)</option>
                        <option value="critical">Kritis (Merah)</option>
                      </select>

                      <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={broadcastEnabled}
                          onChange={e => setBroadcastEnabled(e.target.checked)}
                          className="rounded bg-black border-[#262626]"
                        />
                        <span>Aktifkan Banner</span>
                      </label>
                    </div>

                    <button
                      onClick={handleSaveBroadcast}
                      disabled={savingBroadcast}
                      className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold transition"
                    >
                      {savingBroadcast ? 'Menyimpan...' : 'Simpan & Publikasikan'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Emergency Kill-Switch Protocol */}
              <div className="rounded-2xl bg-[#0a0a0a] border border-red-500/20 p-6 space-y-4">
                <div className="flex items-center gap-2 text-red-400">
                  <ShieldAlert className="w-4 h-4" />
                  <h3 className="text-sm font-semibold text-white">Emergency Session Revocation</h3>
                </div>

                <p className="text-xs text-neutral-400 leading-relaxed">
                  Protokol darurat untuk mencabut paksa seluruh token sesi login operator non-founder dari database PostgreSQL secara seketika jika terdeteksi intrusi atau anomali akun.
                </p>

                <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-500/20 text-[11px] font-mono text-red-300">
                  Perlindungan Zero-Trust: Memerlukan Master Security PIN 6-digit untuk otorisasi eksekusi.
                </div>

                <button
                  onClick={() => setIsEmergencyModalOpen(true)}
                  className="w-full py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  <span>Buka Otorisasi Kill-Switch</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* GLOBAL COMMAND PALETTE MODAL (⌘K / CTRL+K) */}
      {/* ========================================================= */}
      {isCommandPaletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-[#0a0a0a] border border-[#262626] shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-hidden">
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#1f1f1f]">
              <Search className="w-4 h-4 text-neutral-500" />
              <input
                type="text"
                autoFocus
                value={paletteSearch}
                onChange={e => setPaletteSearch(e.target.value)}
                placeholder="Type a command, jump to tab, or search workspace/user..."
                className="w-full bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none font-sans"
              />
              <button
                onClick={() => setIsCommandPaletteOpen(false)}
                className="p-1 rounded text-neutral-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results List */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {filteredPaletteItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-500 font-mono">
                  Tidak ada perintah atau entitas yang cocok dengan "{paletteSearch}".
                </div>
              ) : (
                filteredPaletteItems.map((item, idx) => {
                  const Icon = item.icon || Terminal;
                  return (
                    <button
                      key={item.id || idx}
                      onClick={() => handleSelectPaletteItem(item)}
                      className="w-full p-2.5 rounded-xl text-left flex items-center justify-between hover:bg-white/[0.04] transition group"
                    >
                      <div className="flex items-center gap-2.5 text-xs text-neutral-300 group-hover:text-white">
                        <Icon className="w-4 h-4 text-neutral-500 group-hover:text-white transition" />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-neutral-600 group-hover:text-neutral-400" />
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer Cues */}
            <div className="px-4 py-2 border-t border-[#1a1a1a] flex items-center justify-between text-[10px] font-mono text-neutral-500 bg-black/40">
              <div className="flex items-center gap-3">
                <span>↑↓ navigate</span>
                <span>↵ select</span>
                <span>esc close</span>
              </div>
              <span>ID-Tech Command Engine</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREATE WORKSPACE */}
      {/* ========================================================= */}
      {isCreateWsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-[#0a0a0a] border border-[#262626] p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1f1f1f] pb-3">
              <div className="flex items-center gap-2 text-white">
                <Building2 className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-sm">Provisi Workspace Tenant Baru</h3>
              </div>
              <button onClick={() => setIsCreateWsOpen(false)} className="text-neutral-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateWorkspace} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-neutral-300">Nama Organisasi / Perusahaan:</label>
                <input
                  type="text"
                  required
                  value={newWsName}
                  onChange={e => setNewWsName(e.target.value)}
                  placeholder="Contoh: PT Solusi Cerdas AI"
                  className="w-full p-2.5 rounded-xl bg-black border border-[#262626] text-white focus:outline-none focus:border-neutral-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-neutral-300">Paket Langganan:</label>
                  <select
                    value={newWsPlan}
                    onChange={e => {
                      setNewWsPlan(e.target.value);
                      if (e.target.value === 'FREE') setNewWsQuota(100);
                      else if (e.target.value === 'STARTER') setNewWsQuota(500);
                      else if (e.target.value === 'BUSINESS') setNewWsQuota(2500);
                      else if (e.target.value === 'ENTERPRISE') setNewWsQuota(10000);
                    }}
                    className="w-full p-2.5 rounded-xl bg-black border border-[#262626] text-white font-mono"
                  >
                    <option value="FREE">FREE</option>
                    <option value="STARTER">STARTER</option>
                    <option value="BUSINESS">BUSINESS</option>
                    <option value="ENTERPRISE">ENTERPRISE</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-neutral-300">Batas Kuota Tugas:</label>
                  <input
                    type="number"
                    value={newWsQuota}
                    onChange={e => setNewWsQuota(parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl bg-black border border-[#262626] text-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-neutral-300">Email Pemilik / PIC Tenant:</label>
                <input
                  type="email"
                  value={newWsOwnerEmail}
                  onChange={e => setNewWsOwnerEmail(e.target.value)}
                  placeholder="pic@tenant.com"
                  className="w-full p-2.5 rounded-xl bg-black border border-[#262626] text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1f1f1f]">
                <button
                  type="button"
                  onClick={() => setIsCreateWsOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-neutral-900 text-neutral-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creatingWs}
                  className="px-4 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold shadow"
                >
                  {creatingWs ? 'Memprovisi...' : 'Provisi Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT WORKSPACE */}
      {/* ========================================================= */}
      {editingWorkspace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-[#0a0a0a] border border-[#262626] p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1f1f1f] pb-3">
              <div className="flex items-center gap-2 text-white">
                <Building2 className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-sm">Kelola Workspace: {editingWorkspace.name}</h3>
              </div>
              <button onClick={() => setEditingWorkspace(null)} className="text-neutral-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-neutral-300">Paket Langganan:</label>
                <select
                  value={editWsPlan}
                  onChange={e => setEditWsPlan(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black border border-[#262626] text-white font-mono"
                >
                  <option value="FREE">FREE</option>
                  <option value="STARTER">STARTER</option>
                  <option value="BUSINESS">BUSINESS</option>
                  <option value="ENTERPRISE">ENTERPRISE</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-neutral-300">Batas Kuota Tugas Bulanan:</label>
                <input
                  type="number"
                  value={editWsQuota}
                  onChange={e => setEditWsQuota(parseInt(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-xl bg-black border border-[#262626] text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-neutral-300">Status Langganan:</label>
                <select
                  value={editWsStatus}
                  onChange={e => setEditWsStatus(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black border border-[#262626] text-white font-mono"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="TRIALING">TRIALING</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-neutral-300">Perpanjang Masa Aktif (Hari Tambahan):</label>
                <input
                  type="number"
                  value={extendDays}
                  onChange={e => setExtendDays(parseInt(e.target.value) || 0)}
                  placeholder="Contoh: 14 atau 30 hari"
                  className="w-full p-2.5 rounded-xl bg-black border border-[#262626] text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1f1f1f]">
                <button
                  onClick={() => setEditingWorkspace(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-neutral-900 text-neutral-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveWorkspace}
                  disabled={savingWs}
                  className="px-4 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold shadow"
                >
                  {savingWs ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: RESET PASSWORD WITH STEP-UP MASTER PIN */}
      {/* ========================================================= */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-[#0a0a0a] border border-amber-500/40 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1f1f1f] pb-3">
              <div className="flex items-center gap-2 text-amber-400">
                <KeyRound className="w-5 h-5" />
                <h3 className="font-bold text-sm text-white">Reset Kata Sandi Pengguna</h3>
              </div>
              <button onClick={() => setResettingUser(null)} className="text-neutral-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-neutral-400">
                Mereset kata sandi untuk <strong className="text-white">{resettingUser.email}</strong>. Sesi login pengguna saat ini akan otomatis dicabut demi keamanan.
              </p>

              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-300">Kata Sandi Sementara Baru:</label>
                <div className="relative">
                  <input
                    type="text"
                    value={tempPassword}
                    onChange={e => setTempPassword(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-black border border-[#262626] text-white font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(tempPassword, 'temp_pwd')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                  >
                    {copiedId === 'temp_pwd' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-neutral-300">Master Security PIN (Step-Up 2FA):</label>
                  <span className="text-[10px] text-amber-400 font-mono">6-Digit PIN</span>
                </div>
                <input
                  type="password"
                  maxLength={6}
                  value={resetPin}
                  onChange={e => setResetPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ketik 6-digit PIN (default 992817)"
                  className="w-full p-2.5 rounded-xl bg-black border border-amber-500/30 text-amber-300 font-mono text-xs tracking-widest placeholder:tracking-normal placeholder:text-neutral-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1f1f1f]">
              <button
                onClick={() => { setResettingUser(null); setResetPin(''); }}
                className="px-3.5 py-1.5 rounded-xl bg-neutral-900 text-neutral-400 hover:text-white"
              >
                Batal
              </button>
              <button
                onClick={handleExecuteResetPassword}
                disabled={resettingPwd || !resetPin.trim()}
                className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-[#0a0a0a] border border-red-500/60 p-6 space-y-5 shadow-[0_0_50px_rgba(239,68,68,0.3)]">
            <div className="flex items-center justify-between border-b border-red-500/20 pb-3">
              <div className="flex items-center gap-2 text-red-400">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
                <h3 className="font-bold text-sm text-white">Protokol Keamanan Darurat: Kill-Switch</h3>
              </div>
              <button onClick={() => { setIsEmergencyModalOpen(false); setEmergencyPin(''); }} className="text-neutral-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 leading-relaxed">
                <strong className="block text-red-400 font-bold mb-1">PERINGATAN LEVEL EKSEKUTIF:</strong>
                Tindakan ini akan langsung menghapus seluruh session token operator non-founder dari database PostgreSQL cluster. Seluruh koneksi operator aktif akan terputus seketika.
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-300">Master Security PIN (Step-Up 2FA):</label>
                <input
                  type="password"
                  maxLength={6}
                  value={emergencyPin}
                  onChange={e => setEmergencyPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ketik 6-digit Master PIN (default: 992817)"
                  className="w-full p-2.5 rounded-xl bg-black border border-red-500/40 text-red-300 font-mono text-xs tracking-widest placeholder:tracking-normal placeholder:text-neutral-600 focus:outline-none focus:border-red-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1f1f1f]">
              <button
                onClick={() => { setIsEmergencyModalOpen(false); setEmergencyPin(''); }}
                className="px-3.5 py-1.5 rounded-xl bg-neutral-900 text-neutral-400 hover:text-white"
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
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-[#0a0a0a] border border-white/20 shadow-[0_0_40px_rgba(0,0,0,0.9)] text-white text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
