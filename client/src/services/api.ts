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

  async getMetrics() {
    return this.request('/api/founder/metrics');
  },

  async getFinancials() {
    return this.request('/api/founder/financials');
  },

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

  async resetUserPassword(userId: string, newPassword?: string) {
    return this.request(`/api/founder/users/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword })
    });
  },

  async getAuditLogs(limit: number = 50) {
    return this.request(`/api/founder/audit-logs?limit=${limit}`);
  },

  async getSystemHealth() {
    return this.request('/api/founder/system-health');
  },

  async getBroadcast() {
    return this.request('/api/founder/broadcast');
  },

  async setBroadcast(payload: { message: string; type?: 'info' | 'warning' | 'critical'; enabled?: boolean }) {
    return this.request('/api/founder/broadcast', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Backward compatible aliases for FounderSuite
  getAdminMetrics() { return this.getMetrics(); },
  getAdminFinancials() { return this.getFinancials(); },
  getAdminUsers(params: any) { return this.getUsers(params); },
  getAdminAuditLogs(limit?: number) { return this.getAuditLogs(limit); },
  getAdminSystemHealth() { return this.getSystemHealth(); },
  getAdminBroadcast() { return this.getBroadcast(); },
  setAdminBroadcast(payload: any) { return this.setBroadcast(payload); }
};
