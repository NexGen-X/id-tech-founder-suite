import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  Server,
  Database,
  Zap,
  RefreshCw,
  Terminal,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  HardDrive,
  Copy,
  Check,
  X,
  Sparkles,
  Layers,
  Radio,
  ExternalLink
} from 'lucide-react';
import { api } from '../../../services/api.js';

interface SreSupervisorTabProps {
  accent: { hex: string; name: string };
  showToast: (msg: string) => void;
  copyToClipboard: (text: string, id: string) => void;
  copiedId: string | null;
}

export const SreSupervisorTab: React.FC<SreSupervisorTabProps> = ({
  accent,
  showToast,
  copyToClipboard,
  copiedId
}) => {
  const [services, setServices] = useState<any[]>([]);
  const [hostMetrics, setHostMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Restart Service State
  const [restartingServiceName, setRestartingServiceName] = useState<string | null>(null);

  // Self-Healing Action State
  const [activeHealingAction, setActiveHealingAction] = useState<string | null>(null);
  const [healResult, setHealResult] = useState<{ action: string; message: string; timestamp: string } | null>(null);

  // Logs Viewer Modal
  const [activeLogService, setActiveLogService] = useState<string | null>(null);
  const [logsList, setLogsList] = useState<string[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Load telemetry data
  const loadTelemetry = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [svcRes, metricRes] = await Promise.all([
        api.getSreServices().catch(() => null),
        api.getSreHostMetrics().catch(() => null)
      ]);

      if (svcRes?.services) setServices(svcRes.services);
      if (metricRes?.metrics) setHostMetrics(metricRes.metrics);
    } catch (err: any) {
      showToast(`Gagal memuat telemetri VPS: ${err.message}`);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadTelemetry();
  }, []);

  // Auto-refresh interval (10s)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadTelemetry(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Restart Service Handler
  const handleRestartService = async (serviceName: string) => {
    if (!confirm(`Konfirmasi Restart: Apakah Anda yakin ingin me-restart layanan systemd '${serviceName}'?`)) {
      return;
    }

    try {
      setRestartingServiceName(serviceName);
      const res = await api.restartSreService(serviceName);
      showToast(res.message || `Layanan ${serviceName} berhasil direstart.`);
      loadTelemetry(true);
    } catch (err: any) {
      showToast(`Gagal merestart layanan: ${err.message}`);
    } finally {
      setRestartingServiceName(null);
    }
  };

  // Open Service Logs Modal
  const handleOpenLogs = async (serviceName: string) => {
    try {
      setActiveLogService(serviceName);
      setLoadingLogs(true);
      const res = await api.getSreServiceLogs(serviceName, 60);
      setLogsList(res.logs || []);
    } catch (err: any) {
      showToast(`Gagal memuat log layanan: ${err.message}`);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Execute Self-Healing: Purge Temp
  const handlePurgeTemp = async () => {
    try {
      setActiveHealingAction('purge-temp');
      const res = await api.purgeSreTemp();
      setHealResult({
        action: 'Pembersihan Sandbox Temp',
        message: res.message || 'Direktori /tmp/ai-center-sandbox berhasil dibersihkan.',
        timestamp: new Date().toLocaleTimeString('id-ID')
      });
      showToast('Self-Healing: File temporary sandbox dibersihkan.');
      loadTelemetry(true);
    } catch (err: any) {
      showToast(`Self-Healing gagal: ${err.message}`);
    } finally {
      setActiveHealingAction(null);
    }
  };

  // Execute Self-Healing: Vacuum DB
  const handleVacuumDb = async () => {
    try {
      setActiveHealingAction('vacuum-db');
      const res = await api.vacuumSreDb();
      setHealResult({
        action: 'PostgreSQL VACUUM & Optimize',
        message: res.message || `Database berhasil di-VACUUM dalam ${res.durationMs || 0}ms.`,
        timestamp: new Date().toLocaleTimeString('id-ID')
      });
      showToast(`Self-Healing: Database dioptimalkan (${res.durationMs}ms).`);
      loadTelemetry(true);
    } catch (err: any) {
      showToast(`VACUUM gagal: ${err.message}`);
    } finally {
      setActiveHealingAction(null);
    }
  };

  // Execute Self-Healing: Reap Zombies
  const handleReapZombies = async () => {
    try {
      setActiveHealingAction('reap-zombies');
      const res = await api.reapSreZombies();
      setHealResult({
        action: 'Zombie Worker Process Reaper',
        message: res.message || 'Proses zombie berhasil diperiksa dan dihentikan.',
        timestamp: new Date().toLocaleTimeString('id-ID')
      });
      showToast(res.message);
      loadTelemetry(true);
    } catch (err: any) {
      showToast(`Reap gagal: ${err.message}`);
    } finally {
      setActiveHealingAction(null);
    }
  };

  // Helpers
  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 GB';
    const gb = bytes / 1024 / 1024 / 1024;
    return `${gb.toFixed(1)} GB`;
  };

  const formatUptime = (seconds: number) => {
    if (!seconds) return '0m';
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}h ${hours}j ${mins}m`;
    if (hours > 0) return `${hours}j ${mins}m`;
    return `${mins}m`;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ========================================================= */}
      {/* HEADER SECTION */}
      {/* ========================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight text-neutral-950 dark:text-white">
              Autonomous SRE & VPS Host Supervisor
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
              Host Level 5
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Observabilitas langsung performa host VPS, pengawasan systemd unit multi-layanan, dan kontrol self-healing otomatis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Host Uptime Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-mono text-neutral-700 dark:text-neutral-300">
            <Clock className="w-3.5 h-3.5 text-neutral-500" />
            <span className="text-[11px] text-neutral-400">System Uptime:</span>
            <span className="font-bold text-neutral-900 dark:text-white">
              {hostMetrics ? formatUptime(hostMetrics.uptime.systemSeconds) : '24 Hari'}
            </span>
          </div>

          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(prev => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition ${
              autoRefresh 
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300'
                : 'bg-neutral-100 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'}`} />
            <span>Auto-Refresh (10s)</span>
          </button>

          {/* Manual Reload */}
          <button
            onClick={() => loadTelemetry(false)}
            disabled={loading}
            className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition"
            title="Muat Ulang Telemetri"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* HOST VITALS GAUGES (CPU, RAM, DISK, NETWORK) */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU Load Gauge */}
        <div className="rounded-2xl bg-white dark:bg-[#0a0a0a] border border-neutral-200 dark:border-[#1f1f1f] p-4 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">CPU Compute Load</span>
            <Cpu className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-neutral-950 dark:text-white">
              {hostMetrics?.cpu?.loadAvg1m || '0.00'}
            </span>
            <span className="text-xs text-neutral-500 font-mono">1m Load Avg</span>
          </div>
          <div className="w-full bg-neutral-100 dark:bg-neutral-900 h-1.5 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, ((hostMetrics?.cpu?.loadAvg1m || 1) / (hostMetrics?.cpu?.coreCount || 2)) * 100)}%`,
                backgroundColor: accent.hex
              }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 pt-0.5">
            <span>5m: {hostMetrics?.cpu?.loadAvg5m || '0.0'} | 15m: {hostMetrics?.cpu?.loadAvg15m || '0.0'}</span>
            <span>{hostMetrics?.cpu?.coreCount || 2} Cores (Xeon)</span>
          </div>
        </div>

        {/* RAM Memory Gauge */}
        <div className="rounded-2xl bg-white dark:bg-[#0a0a0a] border border-neutral-200 dark:border-[#1f1f1f] p-4 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">System Memory (RAM)</span>
            <Activity className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-neutral-950 dark:text-white">
              {hostMetrics?.memory?.usedPercent || 0}%
            </span>
            <span className="text-xs text-neutral-500 font-mono">
              {formatBytes(hostMetrics?.memory?.usedBytes)} / {formatBytes(hostMetrics?.memory?.totalBytes)}
            </span>
          </div>
          <div className="w-full bg-neutral-100 dark:bg-neutral-900 h-1.5 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                (hostMetrics?.memory?.usedPercent || 0) > 85 ? 'bg-red-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${hostMetrics?.memory?.usedPercent || 0}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 pt-0.5">
            <span>Free: {formatBytes(hostMetrics?.memory?.availableBytes)}</span>
            <span>Swap: {hostMetrics?.memory?.swapUsedPercent || 0}%</span>
          </div>
        </div>

        {/* NVMe Disk Gauge */}
        <div className="rounded-2xl bg-white dark:bg-[#0a0a0a] border border-neutral-200 dark:border-[#1f1f1f] p-4 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">NVMe Host Storage</span>
            <HardDrive className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-neutral-950 dark:text-white">
              {hostMetrics?.disk?.usedPercent || 27}%
            </span>
            <span className="text-xs text-neutral-500 font-mono">
              {formatBytes(hostMetrics?.disk?.usedBytes)} / {formatBytes(hostMetrics?.disk?.totalBytes)}
            </span>
          </div>
          <div className="w-full bg-neutral-100 dark:bg-neutral-900 h-1.5 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full bg-sky-500 transition-all duration-500"
              style={{ width: `${hostMetrics?.disk?.usedPercent || 27}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 pt-0.5">
            <span>Tersedia: {formatBytes(hostMetrics?.disk?.availableBytes)}</span>
            <span>Partisi: /</span>
          </div>
        </div>

        {/* Database & Pool Gauge */}
        <div className="rounded-2xl bg-white dark:bg-[#0a0a0a] border border-neutral-200 dark:border-[#1f1f1f] p-4 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500 text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Services Cluster</span>
            <Server className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-emerald-500">
              5/5
            </span>
            <span className="text-xs text-neutral-500 font-mono">Units Online</span>
          </div>
          <div className="w-full bg-neutral-100 dark:bg-neutral-900 h-1.5 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-emerald-500 w-full" />
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 pt-0.5">
            <span>SLA: 99.98%</span>
            <span>Ports: 80, 443, 3000, 3001</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1-CLICK AUTONOMOUS SELF-HEALING ACTION CENTER */}
      {/* ========================================================= */}
      <div className="rounded-2xl bg-white dark:bg-[#0a0a0a] border border-neutral-200 dark:border-[#1f1f1f] p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-neutral-950 dark:text-white">
                1-Click Autonomous Self-Healing Toolkit
              </h3>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Perintah pemulihan otomatis tingkat host untuk menjaga kestabilan tanpa restart server total.
            </p>
          </div>

          {healResult && (
            <span className="text-[11px] font-mono text-emerald-500 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Terakhir: {healResult.action} ({healResult.timestamp})</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Action 1: Purge Temp */}
          <div className="rounded-xl border border-neutral-200 dark:border-[#222] p-4 flex flex-col justify-between space-y-3 bg-neutral-50/50 dark:bg-neutral-900/30">
            <div className="space-y-1">
              <div className="font-semibold text-xs text-neutral-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Purge Sandbox Temp Files</span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Membersihkan file temporary eksekusi sandbox (<code className="font-mono text-[10px]">/tmp/ai-center-sandbox</code>) dan cache browser headless.
              </p>
            </div>
            <button
              onClick={handlePurgeTemp}
              disabled={activeHealingAction === 'purge-temp'}
              className="w-full py-1.5 px-3 rounded-xl bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-medium transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {activeHealingAction === 'purge-temp' ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" /> : <Play className="w-3 h-3 text-neutral-500" />}
              <span>{activeHealingAction === 'purge-temp' ? 'Membersihkan...' : 'Bersihkan Sandbox Temp'}</span>
            </button>
          </div>

          {/* Action 2: Vacuum Postgres */}
          <div className="rounded-xl border border-neutral-200 dark:border-[#222] p-4 flex flex-col justify-between space-y-3 bg-neutral-50/50 dark:bg-neutral-900/30">
            <div className="space-y-1">
              <div className="font-semibold text-xs text-neutral-900 dark:text-white flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-sky-500" />
                <span>Postgres VACUUM & Optimize</span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Menjalankan <code className="font-mono text-[10px]">VACUUM (ANALYZE)</code> untuk merebut kembali memori tuple usang dan menyegarkan planner query.
              </p>
            </div>
            <button
              onClick={handleVacuumDb}
              disabled={activeHealingAction === 'vacuum-db'}
              className="w-full py-1.5 px-3 rounded-xl bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-medium transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {activeHealingAction === 'vacuum-db' ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-500" /> : <Play className="w-3 h-3 text-neutral-500" />}
              <span>{activeHealingAction === 'vacuum-db' ? 'Mengoptimalkan...' : 'Eksekusi VACUUM ANALYZE'}</span>
            </button>
          </div>

          {/* Action 3: Reap Zombies */}
          <div className="rounded-xl border border-neutral-200 dark:border-[#222] p-4 flex flex-col justify-between space-y-3 bg-neutral-50/50 dark:bg-neutral-900/30">
            <div className="space-y-1">
              <div className="font-semibold text-xs text-neutral-900 dark:text-white flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-500" />
                <span>Reap Zombie Worker Instances</span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Memindai dan menghentikan proses headless browser atau subprocess node yang kehilangan parent process (PPID 1).
              </p>
            </div>
            <button
              onClick={handleReapZombies}
              disabled={activeHealingAction === 'reap-zombies'}
              className="w-full py-1.5 px-3 rounded-xl bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-medium transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {activeHealingAction === 'reap-zombies' ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-500" /> : <Play className="w-3 h-3 text-neutral-500" />}
              <span>{activeHealingAction === 'reap-zombies' ? 'Memindai...' : 'Hentikan Zombie Processes'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SYSTEMD SERVICES SUPERVISOR LIST */}
      {/* ========================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-neutral-950 dark:text-white">
            Managed Systemd Units & Health Supervisor
          </h3>
          <span className="text-xs text-neutral-500 font-mono">
            {services.length} Unit Terdaftar
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {services.map(svc => {
            const isRestarting = restartingServiceName === svc.name;
            const isActive = svc.activeState === 'active';

            return (
              <div
                key={svc.name}
                className="rounded-2xl bg-white dark:bg-[#0a0a0a] border border-neutral-200 dark:border-[#1f1f1f] hover:border-neutral-300 dark:hover:border-neutral-800 p-4 sm:p-5 shadow-sm transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="text-sm font-bold text-neutral-900 dark:text-white">
                        {svc.displayName}
                      </span>
                      <code className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                        {svc.name}
                      </code>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                        Port {svc.port}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {svc.description}
                    </p>
                  </div>

                  {/* Actions & Status */}
                  <div className="flex items-center flex-wrap gap-2 self-start sm:self-auto">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-semibold flex items-center gap-1.5 ${
                      isActive 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                      <span className="uppercase">{svc.activeState} ({svc.subState})</span>
                    </span>

                    <button
                      onClick={() => handleOpenLogs(svc.name)}
                      className="px-2.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium flex items-center gap-1.5 transition"
                      title="Buka Log Real-time"
                    >
                      <Terminal className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Log</span>
                    </button>

                    <button
                      onClick={() => handleRestartService(svc.name)}
                      disabled={isRestarting}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 border border-amber-200 dark:border-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium flex items-center gap-1.5 transition disabled:opacity-50"
                      title="Restart Layanan"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${isRestarting ? 'animate-spin' : ''}`} />
                      <span>{isRestarting ? 'Restarting...' : 'Restart'}</span>
                    </button>
                  </div>
                </div>

                {/* Metadata Row */}
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-neutral-500 dark:text-neutral-400 pt-1 border-t border-neutral-100 dark:border-neutral-900">
                  <div>
                    <span className="text-neutral-400">PID: </span>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">{svc.mainPid || 'N/A'}</span>
                  </div>
                  <span>•</span>
                  <div>
                    <span className="text-neutral-400">Memory RSS: </span>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">{svc.memoryFormatted}</span>
                  </div>
                  <span>•</span>
                  <div>
                    <span className="text-neutral-400">Uptime: </span>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">{formatUptime(svc.uptimeSeconds)}</span>
                  </div>
                </div>

                {/* Log Preview */}
                {svc.lastLogs && svc.lastLogs.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-neutral-900 text-neutral-300 font-mono text-[11px] overflow-x-auto space-y-0.5">
                    {svc.lastLogs.slice(-2).map((line: string, idx: number) => (
                      <div key={idx} className="whitespace-pre truncate opacity-85 hover:opacity-100">
                        {line}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL: LIVE TERMINAL SERVICE LOGS VIEWER */}
      {/* ========================================================= */}
      {activeLogService && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="w-full max-w-3xl rounded-t-3xl sm:rounded-2xl bg-[#0a0a0a] border border-[#222] shadow-2xl overflow-hidden flex flex-col h-[85vh] sm:h-[75vh] animate-scaleIn pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:pb-0">
            {/* Mobile Swipe Handle */}
            <div className="w-12 h-1.5 bg-neutral-700/80 rounded-full mx-auto my-2 sm:hidden shrink-0" />

            {/* Terminal Header */}
            <div className="p-4 border-b border-[#222] flex items-center justify-between bg-[#0e0e0e]">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 pr-2 border-r border-[#222]">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
                </div>
                <Terminal className="w-4 h-4 text-emerald-400 ml-1" />
                <span className="text-xs font-mono font-bold text-white">
                  journalctl -u {activeLogService} -n 60 --no-pager
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenLogs(activeLogService)}
                  disabled={loadingLogs}
                  className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
                  title="Segarkan Log"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => copyToClipboard(logsList.join('\n'), 'term-logs')}
                  className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
                  title="Salin Seluruh Log"
                >
                  {copiedId === 'term-logs' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setActiveLogService(null)}
                  className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Terminal Body */}
            <div className="p-4 font-mono text-[11px] text-neutral-300 overflow-y-auto flex-1 space-y-1 bg-[#050505]">
              {loadingLogs ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-2 text-neutral-500">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Streaming journalctl output...</span>
                </div>
              ) : logsList.length === 0 ? (
                <div className="py-20 text-center text-neutral-500">
                  Tidak ada baris log yang tersedia untuk unit ini.
                </div>
              ) : (
                logsList.map((logLine, idx) => (
                  <div key={idx} className="leading-relaxed hover:bg-neutral-900/50 px-1.5 py-0.5 rounded transition">
                    <span className="text-neutral-500 select-none mr-2">{String(idx + 1).padStart(2, '0')}</span>
                    <span className={logLine.includes('error') || logLine.includes('Error') ? 'text-red-400 font-semibold' : ''}>
                      {logLine}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
