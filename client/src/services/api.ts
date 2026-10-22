export const api = {
  getToken(): string | null {
    return localStorage.getItem('idtech_founder_token');
  },

  setToken(token: string) {
    localStorage.setItem('idtech_founder_token', token);
  },

  removeToken() {
    localStorage.removeItem('idtech_founder_token');
  },

  async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(endpoint, {
      ...options,
      headers
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) {
        this.removeToken();
      }
      throw new Error(data.error?.message || `Permintaan gagal (${res.status})`);
    }

    return data;
  },

  // Auth
  async login(email: string, password: string) {
    const res = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  },

  async getMe() {
    return this.request('/api/auth/me');
  },

  async logout() {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } finally {
      this.removeToken();
    }
  },

  // Executive Metrics & Financials
  async getMetrics() {
    return this.request('/api/founder/metrics');
  },

  async getFinancials() {
    return this.request('/api/founder/financials');
  },

  // Tenant / Workspace Management
  async getWorkspaces(params: { search?: string; plan?: string; status?: string } = {}) {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.plan && params.plan !== 'ALL') query.set('plan', params.plan);
    if (params.status && params.status !== 'ALL') query.set('status', params.status);
    return this.request(`/api/founder/workspaces?${query.toString()}`);
  },

  async getWorkspaceDetails(workspaceId: string) {
    return this.request(`/api/founder/workspaces/${workspaceId}`);
  },

  async createWorkspace(payload: { name: string; plan?: string; taskQuotaLimit?: number; ownerEmail?: string; ownerName?: string }) {
    return this.request('/api/founder/workspaces', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async updateWorkspace(workspaceId: string, payload: { plan?: string; taskQuotaLimit?: number; planStatus?: string; extendDays?: number }) {
    return this.request(`/api/founder/workspaces/${workspaceId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },

  // User Directory & Access Control
  async getUsers(params: { search?: string; plan?: string } = {}) {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.plan && params.plan !== 'ALL') query.set('plan', params.plan);
    return this.request(`/api/founder/users?${query.toString()}`);
  },

  async updateUserPlan(userId: string, plan: string, taskQuotaLimit?: number) {
    return this.request(`/api/founder/users/${userId}/plan`, {
      method: 'PATCH',
      body: JSON.stringify({ plan, taskQuotaLimit })
    });
  },

  async updateUserRole(userId: string, role: string) {
    return this.request(`/api/founder/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role })
    });
  },

  async resetUserPassword(userId: string, newPassword?: string, founderPin?: string) {
    return this.request(`/api/founder/users/${userId}/reset-password`, {
      method: 'POST',
      headers: founderPin ? { 'x-founder-pin': founderPin } : {},
      body: JSON.stringify({ newPassword, founderPin })
    });
  },

  // Invoices & Billing
  async getInvoices(params: { status?: string; search?: string } = {}) {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'ALL') query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    return this.request(`/api/founder/invoices?${query.toString()}`);
  },

  async markInvoicePaid(invoiceId: string) {
    return this.request(`/api/founder/invoices/${invoiceId}/mark-paid`, {
      method: 'PATCH'
    });
  },

  // AI Swarm Fleet & Telemetry
  async getSwarmTelemetry() {
    return this.request('/api/founder/swarm-telemetry');
  },

  // Audit Logs & System Health
  async getAuditLogs(params: { limit?: number; search?: string } = {}) {
    const query = new URLSearchParams();
    query.set('limit', String(params.limit || 50));
    if (params.search) query.set('search', params.search);
    return this.request(`/api/founder/audit-logs?${query.toString()}`);
  },

  async getSystemHealth() {
    return this.request('/api/founder/system-health');
  },

  // Broadcast & Governance
  async getBroadcast() {
    return this.request('/api/founder/broadcast');
  },

  async setBroadcast(payload: { message: string; type?: 'info' | 'warning' | 'critical'; enabled?: boolean; targetAudience?: string }) {
    return this.request('/api/founder/broadcast', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getPlatformSettings() {
    return this.request('/api/founder/platform-settings');
  },

  async updatePlatformSettings(payload: any) {
    return this.request('/api/founder/platform-settings', {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },

  async emergencyRevokeSessions(founderPin?: string) {
    return this.request('/api/founder/kill-switch/revoke-all-sessions', {
      method: 'POST',
      headers: founderPin ? { 'x-founder-pin': founderPin } : {},
      body: JSON.stringify({ founderPin })
    });
  },

  // Railway PostgreSQL Engine & Query Runner
  async getDatabaseStats() {
    return this.request('/api/founder/database-stats');
  },

  async runDatabaseQuery(query: string) {
    return this.request('/api/founder/database-query', {
      method: 'POST',
      body: JSON.stringify({ query })
    });
  },

  // Git CI/CD & Deployments Telemetry
  async getDeployments() {
    return this.request('/api/founder/deployments');
  },

  // Enterprise Custom Domains & Caddy SSL Gateway
  async getDomains() {
    return this.request('/api/founder/domains');
  },

  async getCaddyStatus() {
    return this.request('/api/founder/domains/caddy-status');
  },

  async addDomain(payload: { workspaceId: string; domainName: string; isPrimary?: boolean; useInternalTls?: boolean }) {
    return this.request('/api/founder/domains', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async verifyDomainDns(domainId: string) {
    return this.request(`/api/founder/domains/${domainId}/verify-dns`, {
      method: 'POST'
    });
  },

  async checkDomainSsl(domainId: string) {
    return this.request(`/api/founder/domains/${domainId}/check-ssl`, {
      method: 'POST'
    });
  },

  async removeDomain(domainId: string) {
    return this.request(`/api/founder/domains/${domainId}`, {
      method: 'DELETE'
    });
  },

  // Autonomous SRE & VPS Host Supervisor
  async getSreServices() {
    return this.request('/api/founder/sre/services');
  },

  async getSreHostMetrics() {
    return this.request('/api/founder/sre/host-metrics');
  },

  async getSreServiceLogs(serviceName: string, lines: number = 50) {
    return this.request(`/api/founder/sre/services/${serviceName}/logs?lines=${lines}`);
  },

  async restartSreService(serviceName: string) {
    return this.request(`/api/founder/sre/services/${serviceName}/restart`, {
      method: 'POST'
    });
  },

  async purgeSreTemp() {
    return this.request('/api/founder/sre/heal/purge-temp', {
      method: 'POST'
    });
  },

  async vacuumSreDb() {
    return this.request('/api/founder/sre/heal/vacuum-db', {
      method: 'POST'
    });
  },

  async reapSreZombies() {
    return this.request('/api/founder/sre/heal/reap-zombies', {
      method: 'POST'
    });
  },

  // Download Export CSV Helper
  getExportUrl(type: 'users' | 'invoices' | 'workspaces' | 'audit-logs'): string {
    const token = this.getToken();
    return `/api/founder/export/${type}?auth_token=${token || ''}`;
  },

  // Backward compatible aliases
  getAdminMetrics() { return this.getMetrics(); },
  getAdminFinancials() { return this.getFinancials(); },
  getAdminUsers(params: any) { return this.getUsers(params); },
  getAdminAuditLogs(limit?: number) { return this.getAuditLogs({ limit }); },
  getAdminSystemHealth() { return this.getSystemHealth(); },
  getAdminBroadcast() { return this.getBroadcast(); },
  setAdminBroadcast(payload: any) { return this.setBroadcast(payload); }
};
