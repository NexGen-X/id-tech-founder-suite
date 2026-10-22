import React, { useState, useEffect } from 'react';
import {
  Globe,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Search,
  Filter,
  ArrowUpRight,
  Server,
  Lock,
  Layers,
  X,
  Info
} from 'lucide-react';
import { api } from '../../../services/api.js';

interface CustomDomainsTabProps {
  workspaces: any[];
  accent: { hex: string; name: string };
  showToast: (msg: string) => void;
  copyToClipboard: (text: string, id: string) => void;
  copiedId: string | null;
}

export const CustomDomainsTab: React.FC<CustomDomainsTabProps> = ({
  workspaces,
  accent,
  showToast,
  copyToClipboard,
  copiedId
}) => {
  const [domains, setDomains] = useState<any[]>([]);
  const [caddyStatus, setCaddyStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING_DNS'>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWsId, setSelectedWsId] = useState(workspaces[0]?.id || '');
  const [domainNameInput, setDomainNameInput] = useState('');
  const [isPrimaryDomain, setIsPrimaryDomain] = useState(false);
  const [useInternalTls, setUseInternalTls] = useState(false);
  const [isProvisioning, setIsProvisioning] = useState(false);

  // Per-Item Actions State
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [checkingSslId, setCheckingSslId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dnsResults, setDnsResults] = useState<Record<string, any>>({});
  const [sslResults, setSslResults] = useState<Record<string, any>>({});
  const [showDnsGuide, setShowDnsGuide] = useState(true);

  // Load Domains and Caddy status
  const loadDomainsData = async () => {
    try {
      setLoading(true);
      const res = await api.getDomains();
      if (res.domains) setDomains(res.domains);
      if (res.caddyStatus) setCaddyStatus(res.caddyStatus);
    } catch (err: any) {
      showToast(`Gagal memuat domain: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDomainsData();
  }, []);

  // Set default workspace if not set
  useEffect(() => {
    if (!selectedWsId && workspaces.length > 0) {
      setSelectedWsId(workspaces[0].id);
    }
  }, [workspaces]);

  // Handle Add Domain
  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWsId || !domainNameInput.trim()) {
      showToast('Pilih workspace dan isi nama domain terlebih dahulu.');
      return;
    }

    try {
      setIsProvisioning(true);
      const res = await api.addDomain({
        workspaceId: selectedWsId,
        domainName: domainNameInput.trim(),
        isPrimary: isPrimaryDomain,
        useInternalTls
      });

      showToast(`Domain ${res.domain?.domainName || domainNameInput} berhasil diprovisi!`);
      setIsModalOpen(false);
      setDomainNameInput('');
      loadDomainsData();
    } catch (err: any) {
      showToast(`Gagal memprovisi domain: ${err.message}`);
    } finally {
      setIsProvisioning(false);
    }
  };

  // Verify DNS for specific domain
  const handleVerifyDns = async (domainId: string) => {
    try {
      setVerifyingId(domainId);
      const res = await api.verifyDomainDns(domainId);
      setDnsResults(prev => ({ ...prev, [domainId]: res.dns }));
      showToast(res.message || 'Pemeriksaan DNS selesai.');
      loadDomainsData();
    } catch (err: any) {
      showToast(`Gagal verifikasi DNS: ${err.message}`);
    } finally {
      setVerifyingId(null);
    }
  };

  // Check SSL Certificate Handshake
  const handleCheckSsl = async (domainId: string) => {
    try {
      setCheckingSslId(domainId);
      const res = await api.checkDomainSsl(domainId);
      setSslResults(prev => ({ ...prev, [domainId]: res.ssl }));
      showToast(res.message || 'Pemeriksaan SSL selesai.');
      loadDomainsData();
    } catch (err: any) {
      showToast(`Pemeriksaan SSL gagal: ${err.message}`);
    } finally {
      setCheckingSslId(null);
    }
  };

  // Remove / Revoke Custom Domain
  const handleDeleteDomain = async (domainId: string, domainName: string) => {
    if (!confirm(`Konfirmasi pencabutan: Apakah Anda yakin ingin mencabut domain '${domainName}' dari Caddy dan routing sistem?`)) {
      return;
    }

    try {
      setDeletingId(domainId);
      await api.removeDomain(domainId);
      showToast(`Domain ${domainName} berhasil dicabut.`);
      loadDomainsData();
    } catch (err: any) {
      showToast(`Gagal menghapus domain: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered Domains
  const filteredDomains = domains.filter(d => {
    const matchesSearch = 
      d.domainName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.workspaceName && d.workspaceName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      d.workspaceId.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ========================================================= */}
      {/* HEADER SECTION */}
      {/* ========================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-tight text-neutral-950 dark:text-white">
              Enterprise Custom Domains & Edge SSL Gateway
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Caddy v2 Edge
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Manajemen sovereign pemetaan custom domain tenant, inspeksi propagasi DNS, dan otomatisasi sertifikat TLS/SSL Let's Encrypt.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Server IP Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-mono text-neutral-700 dark:text-neutral-300">
            <Server className="w-3.5 h-3.5 text-neutral-500" />
            <span className="text-[11px] text-neutral-400">Target IP:</span>
            <span className="font-bold text-neutral-900 dark:text-white">13.212.164.108</span>
            <button
              onClick={() => copyToClipboard('13.212.164.108', 'target-ip')}
              className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded transition text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              title="Salin IP Server"
            >
              {copiedId === 'target-ip' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>

          {/* Caddy Status Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${caddyStatus?.isValid ? 'bg-emerald-400' : 'bg-red-400'}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${caddyStatus?.isValid ? 'bg-emerald-500' : 'bg-red-500'}`} />
            </span>
            <span className="text-[11px]">Caddyfile:</span>
            <span className={`font-mono text-xs font-semibold ${caddyStatus?.isValid ? 'text-emerald-500' : 'text-red-500'}`}>
              {caddyStatus?.isValid ? 'VALID' : 'ERROR'}
            </span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={loadDomainsData}
            disabled={loading}
            className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition"
            title="Muat Ulang Domain"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Add Domain Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition hover:opacity-95"
            style={{ backgroundColor: accent.hex }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Alokasikan Custom Domain</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* DNS CONFIGURATION INSTRUCTIONS ACCORDION */}
      {/* ========================================================= */}
      {showDnsGuide && (
        <div className="rounded-2xl bg-gradient-to-r from-neutral-900/5 via-neutral-900/10 to-transparent dark:from-neutral-900/60 dark:via-neutral-900/30 dark:to-transparent border border-neutral-200 dark:border-[#222] p-4 relative overflow-hidden">
          <button
            onClick={() => setShowDnsGuide(false)}
            className="absolute top-3 right-3 text-neutral-400 hover:text-neutral-900 dark:hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500 mt-0.5">
              <Info className="w-4 h-4" />
            </div>
            <div className="space-y-1.5 pr-6">
              <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                Petunjuk Konfigurasi DNS untuk Klien Korporat B2B
              </h4>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Untuk menghubungkan custom domain (misal: <code className="px-1 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-200 font-mono">ai.perusahaan-klien.com</code>), instruksikan tim IT klien untuk menambahkan salah satu record berikut pada DNS Registrar mereka (Cloudflare, GoDaddy, Niagahoster, Rumahweb):
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                <div className="p-2.5 rounded-xl bg-white dark:bg-[#0c0c0c] border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                  <div>
                    <span className="text-neutral-400">Tipe A Record: </span>
                    <span className="font-bold text-neutral-900 dark:text-white">13.212.164.108</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard('13.212.164.108', 'rec-a')}
                    className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition"
                  >
                    {copiedId === 'rec-a' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-neutral-400" />}
                  </button>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-[#0c0c0c] border border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                  <div>
                    <span className="text-neutral-400">Tipe CNAME: </span>
                    <span className="font-bold text-neutral-900 dark:text-white">app.id-tech.cloud</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard('app.id-tech.cloud', 'rec-cname')}
                    className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition"
                  >
                    {copiedId === 'rec-cname' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-neutral-400" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* FILTER & SEARCH BAR */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari domain, nama workspace, atau ID..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-[#0a0a0a] border border-neutral-200 dark:border-[#222] text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-700 transition"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {(['ALL', 'ACTIVE', 'PENDING_DNS'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setStatusFilter(mode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                statusFilter === mode
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold shadow-sm'
                  : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'
              }`}
            >
              {mode === 'ALL' ? 'Semua Domain' : mode === 'ACTIVE' ? 'Aktif (Terverifikasi)' : 'Menunggu DNS'}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* DOMAIN LISTING MATRIX */}
      {/* ========================================================= */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin text-neutral-400" />
          <span className="text-xs text-neutral-500 font-mono">Memuat matriks custom domain dari Caddy Edge...</span>
        </div>
      ) : filteredDomains.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-[#0a0a0a] border border-neutral-200 dark:border-[#1f1f1f] p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center mx-auto text-neutral-400">
            <Globe className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Belum Ada Custom Domain Terdaftar</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Alokasikan custom domain untuk klien enterprise untuk memberikan pengalaman white-label AI Command Center yang profesional.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm transition"
            style={{ backgroundColor: accent.hex }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Alokasikan Domain Pertama</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredDomains.map(d => {
            const isVerifying = verifyingId === d.id;
            const isCheckingSsl = checkingSslId === d.id;
            const isDeleting = deletingId === d.id;
            const dnsData = dnsResults[d.id];
            const sslData = sslResults[d.id];

            return (
              <div
                key={d.id}
                className="rounded-2xl bg-white dark:bg-[#0a0a0a] border border-neutral-200 dark:border-[#1f1f1f] hover:border-neutral-300 dark:hover:border-neutral-800 transition p-4 sm:p-5 shadow-sm space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://${d.domainName}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-bold text-neutral-900 dark:text-white hover:underline flex items-center gap-1.5 font-mono"
                      >
                        <span>{d.domainName}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400" />
                      </a>

                      {d.isPrimary && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                          Primary
                        </span>
                      )}

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold flex items-center gap-1 ${
                        d.status === 'ACTIVE' 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${d.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        <span>{d.status === 'ACTIVE' ? 'VERIFIED' : 'PENDING DNS'}</span>
                      </span>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold flex items-center gap-1 ${
                        d.sslStatus === 'PROVISIONED'
                          ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border border-neutral-200 dark:border-neutral-700'
                      }`}>
                        <Lock className="w-2.5 h-2.5" />
                        <span>{d.sslStatus}</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
                      <div className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Workspace:</span>
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                          {d.workspaceName || d.workspaceId}
                        </span>
                      </div>
                      <span>•</span>
                      <div>
                        <span>Upstream: </span>
                        <code className="text-[11px] font-mono text-neutral-700 dark:text-neutral-300">127.0.0.1:3000</code>
                      </div>
                      <span>•</span>
                      <div className="text-[11px] font-mono">
                        ID: {d.id}
                      </div>
                    </div>
                  </div>

                  {/* Actions Buttons */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      onClick={() => handleVerifyDns(d.id)}
                      disabled={isVerifying}
                      className="px-2.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium flex items-center gap-1.5 transition disabled:opacity-50"
                      title="Uji Resolusi DNS"
                    >
                      <RefreshCw className={`w-3 h-3 ${isVerifying ? 'animate-spin text-emerald-500' : ''}`} />
                      <span>{isVerifying ? 'Memeriksa...' : 'Verifikasi DNS'}</span>
                    </button>

                    <button
                      onClick={() => handleCheckSsl(d.id)}
                      disabled={isCheckingSsl}
                      className="px-2.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium flex items-center gap-1.5 transition disabled:opacity-50"
                      title="Probe Handshake SSL Port 443"
                    >
                      <Lock className={`w-3 h-3 ${isCheckingSsl ? 'animate-pulse text-sky-500' : ''}`} />
                      <span>{isCheckingSsl ? 'Probing...' : 'Cek SSL'}</span>
                    </button>

                    <button
                      onClick={() => handleDeleteDomain(d.id, d.domainName)}
                      disabled={isDeleting}
                      className="p-1.5 rounded-xl bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs transition"
                      title="Cabut Domain"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Inline DNS Inspection Banner if probed */}
                {dnsData && (
                  <div className={`p-3 rounded-xl border text-xs font-mono space-y-1 ${
                    dnsData.matches
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300'
                      : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300'
                  }`}>
                    <div className="font-bold flex items-center gap-1.5">
                      {dnsData.matches ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                      <span>Hasil Inspeksi DNS: {dnsData.message}</span>
                    </div>
                    <div className="text-[11px] opacity-80">
                      Detected IPs: {dnsData.detectedIps?.length ? dnsData.detectedIps.join(', ') : 'Tidak ditemukan'} | Target: {dnsData.targetIp}
                    </div>
                  </div>
                )}

                {/* Inline SSL Inspection Banner if probed */}
                {sslData && (
                  <div className={`p-3 rounded-xl border text-xs font-mono space-y-1 ${
                    sslData.valid
                      ? 'bg-sky-50/50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-800/40 text-sky-800 dark:text-sky-300'
                      : 'bg-neutral-100 dark:bg-neutral-900 border-neutral-300 dark:border-neutral-800 text-neutral-700 dark:text-neutral-400'
                  }`}>
                    <div className="font-bold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Hasil Pemeriksaan TLS/SSL: {sslData.valid ? 'VALID & AKTIF' : 'BELUM AKTIF'}</span>
                    </div>
                    {sslData.valid ? (
                      <div className="text-[11px] opacity-80">
                        Issuer: {sslData.issuer} | Kedaluwarsa: {sslData.validTo} ({sslData.daysRemaining} hari tersisa)
                      </div>
                    ) : (
                      <div className="text-[11px] opacity-80">
                        Detail: {sslData.error || 'Port 443 belum merespon handshake TLS.'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ALOKASIKAN CUSTOM DOMAIN BARU */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#0c0c0c] border border-neutral-200 dark:border-[#222] shadow-2xl overflow-hidden animate-scaleIn">
            <div className="p-5 border-b border-neutral-200 dark:border-[#222] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-950 dark:text-white">
                    Alokasikan Enterprise Custom Domain
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Routing otomatis ke Caddy Edge Gateway dengan isolasi workspace.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddDomain} className="p-5 space-y-4">
              {/* Workspace Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Pilih Target Workspace Pelanggan
                </label>
                <select
                  value={selectedWsId}
                  onChange={(e) => setSelectedWsId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-[#222] text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-700 font-medium"
                >
                  {workspaces.map(ws => (
                    <option key={ws.id} value={ws.id}>
                      {ws.name} ({ws.plan}) — {ws.id}
                    </option>
                  ))}
                </select>
              </div>

              {/* Domain Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Nama Domain / Subdomain FQDN
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={domainNameInput}
                    onChange={(e) => setDomainNameInput(e.target.value)}
                    placeholder="misal: ai.korporat.co.id atau workspace.klien.com"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-[#222] text-xs font-mono text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-700"
                  />
                </div>
                <p className="text-[10px] text-neutral-400">
                  Jangan sertakan http:// atau trailing slash.
                </p>
              </div>

              {/* Toggles */}
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-[#222] space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-700 dark:text-neutral-300">
                  <input
                    type="checkbox"
                    checked={isPrimaryDomain}
                    onChange={(e) => setIsPrimaryDomain(e.target.checked)}
                    className="rounded border-neutral-300 text-emerald-600 focus:ring-0"
                  />
                  <span>Jadikan domain primer untuk workspace ini</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-700 dark:text-neutral-300">
                  <input
                    type="checkbox"
                    checked={useInternalTls}
                    onChange={(e) => setUseInternalTls(e.target.checked)}
                    className="rounded border-neutral-300 text-emerald-600 focus:ring-0"
                  />
                  <span>Gunakan internal self-signed TLS (hanya untuk testing lokal / staging)</span>
                </label>
              </div>

              {/* Notice */}
              <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/40 text-[11px] text-sky-800 dark:text-sky-300 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Jaminan Keamanan Zero-Downtime</span>
                </div>
                <p className="opacity-90">
                  Konfigurasi Caddyfile akan divalidasi sintaksnya sebelum di-reload. Jika ada kesalahan DNS atau sintaks, sistem otomatis melakukan rollback instan.
                </p>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-medium transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isProvisioning}
                  className="px-4 py-2 rounded-xl text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition hover:opacity-95 disabled:opacity-50"
                  style={{ backgroundColor: accent.hex }}
                >
                  {isProvisioning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{isProvisioning ? 'Memvalidasi & Reload Caddy...' : 'Provisi Domain Sekarang'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
