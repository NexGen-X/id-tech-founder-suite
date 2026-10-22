import fs from 'fs/promises';
import { exec } from 'child_process';
import util from 'util';
import dns from 'dns/promises';
import tls from 'tls';
import crypto from 'crypto';
import { pool } from '../db.js';

const execAsync = util.promisify(exec);
const CADDYFILE_PATH = '/etc/caddy/Caddyfile';
const CUSTOM_DOMAINS_PATH = '/etc/caddy/custom_domains.caddy';
const SERVER_PUBLIC_IP = '13.212.164.108';

const RESERVED_DOMAINS = new Set([
  'id-tech.cloud',
  'app.id-tech.cloud',
  'founder.id-tech.cloud',
  'api.id-tech.cloud',
  'localhost',
  '127.0.0.1'
]);

export interface CustomDomainRecord {
  id: string;
  workspaceId: string;
  workspaceName?: string;
  domainName: string;
  status: 'ACTIVE' | 'PENDING_DNS' | 'ERROR';
  sslStatus: 'PROVISIONED' | 'PENDING' | 'FAILED';
  isPrimary: boolean;
  dnsMode: string;
  detectedIp: string | null;
  targetIp: string;
  lastCheckedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DnsVerificationResult {
  matches: boolean;
  detectedIps: string[];
  cnames: string[];
  targetIp: string;
  message: string;
}

export interface SslCheckResult {
  valid: boolean;
  issuer?: string;
  validFrom?: string;
  validTo?: string;
  daysRemaining?: number;
  error?: string;
}

export class FounderDomainService {
  /**
   * List all managed custom domains with workspace details
   */
  static async listDomains(): Promise<CustomDomainRecord[]> {
    const result = await pool.query(`
      SELECT 
        cd.id,
        cd.workspace_id as "workspaceId",
        w.name as "workspaceName",
        cd.domain_name as "domainName",
        cd.status,
        cd.ssl_status as "sslStatus",
        cd.is_primary as "isPrimary",
        cd.dns_mode as "dnsMode",
        cd.detected_ip as "detectedIp",
        cd.target_ip as "targetIp",
        cd.last_checked_at as "lastCheckedAt",
        cd.created_at as "createdAt",
        cd.updated_at as "updatedAt"
      FROM custom_domains cd
      LEFT JOIN workspaces w ON cd.workspace_id = w.id
      ORDER BY cd.created_at DESC;
    `);
    return result.rows;
  }

  /**
   * Perform DNS pre-flight verification for a domain
   */
  static async verifyDns(domain: string): Promise<DnsVerificationResult> {
    const cleanDomain = domain.toLowerCase().trim();
    let detectedIps: string[] = [];
    let cnames: string[] = [];

    try {
      detectedIps = await dns.resolve4(cleanDomain);
    } catch {
      // Ignore A record resolution failure
    }

    try {
      cnames = await dns.resolveCname(cleanDomain);
    } catch {
      // Ignore CNAME resolution failure
    }

    const matchesIp = detectedIps.includes(SERVER_PUBLIC_IP);
    const matchesCname = cnames.some(c => 
      c.toLowerCase().includes('id-tech.cloud') || 
      c.toLowerCase().includes('app.id-tech.cloud')
    );

    const matches = matchesIp || matchesCname;
    const message = matches
      ? `DNS terverifikasi: domain mengarah ke ${matchesIp ? SERVER_PUBLIC_IP : cnames.join(', ')}.`
      : `DNS belum terpropagasi. Pastikan domain memiliki A Record -> ${SERVER_PUBLIC_IP} atau CNAME -> app.id-tech.cloud.`;

    return {
      matches,
      detectedIps,
      cnames,
      targetIp: SERVER_PUBLIC_IP,
      message
    };
  }

  /**
   * Live TLS Handshake probe to inspect SSL certificate validity
   */
  static async checkSslCertificate(domain: string): Promise<SslCheckResult> {
    const cleanDomain = domain.toLowerCase().trim();

    return new Promise<SslCheckResult>((resolve) => {
      const socket = tls.connect(
        {
          host: cleanDomain,
          port: 443,
          servername: cleanDomain,
          rejectUnauthorized: false,
          timeout: 4000
        },
        () => {
          try {
            const cert = socket.getPeerCertificate();
            socket.destroy();

            if (!cert || !cert.valid_to) {
              return resolve({ valid: false, error: 'Sertifikat TLS tidak ditemukan saat handshake.' });
            }

            const validToDate = new Date(cert.valid_to);
            const now = new Date();
            const daysRemaining = Math.max(0, Math.floor((validToDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
            const rawIssuer = cert.issuer ? (cert.issuer.O || cert.issuer.CN || 'Certificate Authority') : 'Unknown';
            const issuer = Array.isArray(rawIssuer) ? rawIssuer.join(', ') : String(rawIssuer);

            resolve({
              valid: daysRemaining > 0,
              issuer,
              validFrom: cert.valid_from,
              validTo: cert.valid_to,
              daysRemaining
            });
          } catch (err: any) {
            socket.destroy();
            resolve({ valid: false, error: err.message });
          }
        }
      );

      socket.on('error', (err) => {
        socket.destroy();
        resolve({ valid: false, error: `Koneksi TLS gagal: ${err.message}` });
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve({ valid: false, error: 'Timeout koneksi saat probe port 443.' });
      });
    });
  }

  /**
   * Provision a new Enterprise Custom Domain for a Workspace
   */
  static async addDomain(params: {
    workspaceId: string;
    domainName: string;
    isPrimary?: boolean;
    useInternalTls?: boolean;
  }): Promise<CustomDomainRecord> {
    const cleanDomain = params.domainName.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');

    // 1. Validation
    if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/.test(cleanDomain)) {
      throw new Error(`Nama domain '${cleanDomain}' tidak valid. Gunakan format hostname resmi (contoh: portal.perusahaan.com).`);
    }

    if (RESERVED_DOMAINS.has(cleanDomain)) {
      throw new Error(`Domain '${cleanDomain}' adalah domain sistem inti dan tidak dapat dialokasikan.`);
    }

    // 2. Check if already registered
    const existing = await pool.query('SELECT id, workspace_id FROM custom_domains WHERE domain_name = $1;', [cleanDomain]);
    if (existing.rows.length > 0) {
      throw new Error(`Domain '${cleanDomain}' sudah terdaftar pada sistem (ID: ${existing.rows[0].id}).`);
    }

    // 3. Check workspace exists
    const wsCheck = await pool.query('SELECT id, name FROM workspaces WHERE id = $1;', [params.workspaceId]);
    if (wsCheck.rows.length === 0) {
      throw new Error(`Workspace dengan ID '${params.workspaceId}' tidak ditemukan.`);
    }
    const workspaceName = wsCheck.rows[0].name;

    // 4. DNS Pre-check
    const dnsResult = await this.verifyDns(cleanDomain);
    const domainId = `dom-${crypto.randomBytes(6).toString('hex')}`;
    const status = dnsResult.matches ? 'ACTIVE' : 'PENDING_DNS';
    const sslStatus = dnsResult.matches ? 'PROVISIONED' : 'PENDING';

    // 5. Generate Caddy config block
    const tlsDirective = params.useInternalTls ? '\ttls internal\n' : '';
    const domainBlock = `
# [DOMAIN_START:${domainId}:${cleanDomain}]
http://${cleanDomain}, https://${cleanDomain} {
${tlsDirective}\tencode zstd gzip {
\t\tminimum_length 512
\t}

\theader {
\t\tStrict-Transport-Security "max-age=31536000; includeSubDomains; preload"
\t\tX-Frame-Options "SAMEORIGIN"
\t\tX-Content-Type-Options "nosniff"
\t\tReferrer-Policy "strict-origin-when-cross-origin"
\t\t-Server
\t}

\thandle {
\t\treverse_proxy 127.0.0.1:3000 {
\t\t\tflush_interval -1
\t\t\theader_up X-Real-Ip {remote_host}
\t\t\theader_up X-Forwarded-Host {host}
\t\t\theader_up X-Custom-Domain "${cleanDomain}"
\t\t\ttransport http {
\t\t\t\tdial_timeout 5s
\t\t\t\tkeepalive 90s
\t\t\t\tkeepalive_idle_conns 250
\t\t\t}
\t\t}
\t}
}
# [DOMAIN_END:${domainId}]
`;

    // 6. Safely update Caddyfile with rollback guard
    await this.applyCaddyConfig((currentContent) => currentContent + '\n' + domainBlock);

    // 7. Persist to PostgreSQL database
    const insertRes = await pool.query(`
      INSERT INTO custom_domains (
        id, workspace_id, domain_name, status, ssl_status, is_primary,
        dns_mode, detected_ip, target_ip, last_checked_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
      RETURNING 
        id, workspace_id as "workspaceId", domain_name as "domainName",
        status, ssl_status as "sslStatus", is_primary as "isPrimary",
        dns_mode as "dnsMode", detected_ip as "detectedIp", target_ip as "targetIp",
        last_checked_at as "lastCheckedAt", created_at as "createdAt", updated_at as "updatedAt";
    `, [
      domainId,
      params.workspaceId,
      cleanDomain,
      status,
      sslStatus,
      params.isPrimary ?? false,
      'DIRECT',
      dnsResult.detectedIps[0] || null,
      SERVER_PUBLIC_IP
    ]);

    return {
      ...insertRes.rows[0],
      workspaceName
    };
  }

  /**
   * Delete a custom domain from Caddy and DB
   */
  static async removeDomain(domainId: string): Promise<{ success: boolean; domainName: string }> {
    const existing = await pool.query('SELECT id, domain_name FROM custom_domains WHERE id = $1;', [domainId]);
    if (existing.rows.length === 0) {
      throw new Error(`Domain dengan ID '${domainId}' tidak ditemukan.`);
    }
    const domainName = existing.rows[0].domain_name;

    // Remove block from custom_domains.caddy
    await this.applyCaddyConfig((currentContent) => {
      const startTag = `# [DOMAIN_START:${domainId}:${domainName}]`;
      const endTag = `# [DOMAIN_END:${domainId}]`;
      const startIndex = currentContent.indexOf(startTag);
      const endIndex = currentContent.indexOf(endTag);

      if (startIndex !== -1 && endIndex !== -1) {
        return (
          currentContent.substring(0, startIndex) +
          currentContent.substring(endIndex + endTag.length)
        ).trim() + '\n';
      }

      // If tagged block not found, attempt regex removal
      const regex = new RegExp(`#[\\s\\S]*?DOMAIN_START:${domainId}[\\s\\S]*?DOMAIN_END:${domainId}#?`, 'g');
      return currentContent.replace(regex, '').trim() + '\n';
    });

    // Delete record from DB
    await pool.query('DELETE FROM custom_domains WHERE id = $1;', [domainId]);

    return { success: true, domainName };
  }

  /**
   * Validate and reload Caddy with atomic rollback protection
   */
  private static async applyCaddyConfig(transformer: (current: string) => string): Promise<void> {
    let currentConfig = '';
    try {
      currentConfig = await fs.readFile(CUSTOM_DOMAINS_PATH, 'utf-8');
    } catch {
      currentConfig = '# Custom Domains Managed by ID-Tech Cloud\n';
    }

    // 1. Create safety backup
    await fs.writeFile(`${CUSTOM_DOMAINS_PATH}.bak`, currentConfig, 'utf-8');

    const newConfig = transformer(currentConfig);

    try {
      // 2. Write new config
      await fs.writeFile(CUSTOM_DOMAINS_PATH, newConfig, 'utf-8');

      // 3. Test Caddyfile syntax before reloading
      await execAsync(`caddy validate --config ${CADDYFILE_PATH}`);

      // 4. Reload Caddy with zero-downtime
      await execAsync(`caddy reload --config ${CADDYFILE_PATH}`);
    } catch (err: any) {
      // Rollback on any failure
      await fs.writeFile(CUSTOM_DOMAINS_PATH, currentConfig, 'utf-8');
      try {
        await execAsync(`caddy reload --config ${CADDYFILE_PATH}`);
      } catch {}
      throw new Error(`Validasi Caddyfile gagal. Konfigurasi dikembalikan ke versi aman: ${err.stderr || err.message}`);
    }
  }

  /**
   * Get Caddy health and configuration status
   */
  static async getCaddyStatus(): Promise<{
    isValid: boolean;
    serverIp: string;
    details: string;
  }> {
    try {
      const { stdout, stderr } = await execAsync(`caddy validate --config ${CADDYFILE_PATH}`);
      return {
        isValid: true,
        serverIp: SERVER_PUBLIC_IP,
        details: stdout || stderr || 'Caddy configuration is valid and operational.'
      };
    } catch (err: any) {
      return {
        isValid: false,
        serverIp: SERVER_PUBLIC_IP,
        details: err.stderr || err.message
      };
    }
  }
}
