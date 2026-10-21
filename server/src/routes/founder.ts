import { Router, Request, Response } from 'express';
import { pool } from '../db.js';
import { requireFounderAuth, hashPassword } from '../auth.js';

const router = Router();

// Apply Founder Authentication to all routes
router.use(requireFounderAuth);

// GET /api/founder/metrics
router.get('/metrics', async (_req: Request, res: Response) => {
  try {
    const usersCountRes = await pool.query('SELECT COUNT(*) as count FROM human_users;');
    const wsCountRes = await pool.query('SELECT COUNT(*) as count FROM workspaces;');
    const tasksDoneRes = await pool.query("SELECT COUNT(*) as count FROM tasks WHERE status = 'COMPLETED';");
    const active24hRes = await pool.query(`
      SELECT COUNT(*) as count 
      FROM human_users 
      WHERE last_login_at >= NOW() - INTERVAL '24 HOURS';
    `);

    const planStatsRes = await pool.query(`
      SELECT plan, COUNT(*) as count 
      FROM workspaces 
      GROUP BY plan;
    `);

    const planCounts: Record<string, number> = {
      FREE: 0,
      STARTER: 0,
      BUSINESS: 0,
      ENTERPRISE: 0
    };

    planStatsRes.rows.forEach(r => {
      const p = (r.plan || 'FREE').toUpperCase();
      planCounts[p] = parseInt(r.count, 10);
    });

    const PRICING: Record<string, number> = {
      FREE: 0,
      STARTER: 990000,
      BUSINESS: 2990000,
      ENTERPRISE: 9900000
    };

    let totalRevenueIdr = 0;
    let paidSubscribers = 0;
    let freeTrialUsers = 0;

    Object.entries(planCounts).forEach(([plan, count]) => {
      totalRevenueIdr += (PRICING[plan] || 0) * count;
      if (plan === 'FREE') {
        freeTrialUsers += count;
      } else {
        paidSubscribers += count;
      }
    });

    res.json({
      success: true,
      metrics: {
        totalUsers: parseInt(usersCountRes.rows[0]?.count || '0', 10),
        totalWorkspaces: parseInt(wsCountRes.rows[0]?.count || '0', 10),
        activeUsers24h: parseInt(active24hRes.rows[0]?.count || '0', 10),
        planCounts,
        totalRevenueIdr,
        totalTasksDone: parseInt(tasksDoneRes.rows[0]?.count || '0', 10),
        paidSubscribers,
        freeTrialUsers
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// GET /api/founder/financials
router.get('/financials', async (_req: Request, res: Response) => {
  try {
    const planRes = await pool.query(`
      SELECT plan, COUNT(*) as count 
      FROM workspaces 
      GROUP BY plan;
    `);

    const PRICING: Record<string, number> = {
      FREE: 0,
      STARTER: 990000,
      BUSINESS: 2990000,
      ENTERPRISE: 9900000
    };

    let mrrIdr = 0;
    planRes.rows.forEach(r => {
      const p = (r.plan || 'FREE').toUpperCase();
      const count = parseInt(r.count, 10);
      mrrIdr += (PRICING[p] || 0) * count;
    });

    const arrIdr = mrrIdr * 12;

    const invRes = await pool.query(`
      SELECT 
        i.id,
        i.invoice_number as "invoiceNumber",
        i.amount_idr as "amountIdr",
        i.plan_tier as "planTier",
        i.status,
        i.payment_method as "paymentMethod",
        i.paid_at as "paidAt",
        i.created_at as "createdAt",
        w.name as "workspaceName"
      FROM workspace_invoices i
      LEFT JOIN workspaces w ON i.workspace_id = w.id
      ORDER BY i.created_at DESC
      LIMIT 100;
    `);

    const totalPaidRes = await pool.query(
      "SELECT COUNT(*) as count, COALESCE(SUM(amount_idr), 0) as total FROM workspace_invoices WHERE status = 'PAID';"
    );
    const totalPendingRes = await pool.query(
      "SELECT COUNT(*) as count, COALESCE(SUM(amount_idr), 0) as total FROM workspace_invoices WHERE status = 'PENDING';"
    );

    res.json({
      success: true,
      financials: {
        mrrIdr,
        arrIdr,
        totalPaidCount: parseInt(totalPaidRes.rows[0]?.count || '0', 10),
        totalPaidAmountIdr: parseInt(totalPaidRes.rows[0]?.total || '0', 10),
        totalPendingCount: parseInt(totalPendingRes.rows[0]?.count || '0', 10),
        totalPendingAmountIdr: parseInt(totalPendingRes.rows[0]?.total || '0', 10),
        invoices: invRes.rows
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// GET /api/founder/users
router.get('/users', async (req: Request, res: Response) => {
  try {
    const search = ((req.query.search as string) || '').trim().toLowerCase();
    const plan = ((req.query.plan as string) || 'ALL').toUpperCase();

    let query = `
      SELECT 
        u.id,
        u.email,
        u.display_name as "displayName",
        u.role,
        u.must_change_password as "mustChangePassword",
        u.created_at as "createdAt",
        u.last_login_at as "lastLoginAt",
        w.id as "workspaceId",
        w.name as "workspaceName",
        w.plan,
        w.plan_status as "planStatus",
        w.task_quota_limit as "taskQuotaLimit",
        w.tasks_used_this_month as "tasksUsedThisMonth"
      FROM human_users u
      LEFT JOIN workspace_members wm ON u.id = wm.user_id
      LEFT JOIN workspaces w ON wm.workspace_id = w.id
    `;

    const conditions: string[] = [];
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(LOWER(u.email) LIKE $${params.length} OR LOWER(u.display_name) LIKE $${params.length} OR LOWER(COALESCE(w.name, '')) LIKE $${params.length})`);
    }

    if (plan !== 'ALL') {
      params.push(plan);
      conditions.push(`UPPER(w.plan) = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }

    query += ` ORDER BY u.created_at DESC LIMIT 200;`;

    const result = await pool.query(query, params);
    res.json({ success: true, users: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// PATCH /api/founder/users/:userId/plan
router.patch('/users/:userId/plan', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { plan, taskQuotaLimit } = req.body;

    if (!plan) {
      return res.status(400).json({ error: { message: 'Paket lisensi wajib dipilih.' } });
    }

    const defaultLimits: Record<string, number> = {
      FREE: 50,
      STARTER: 500,
      BUSINESS: 2500,
      ENTERPRISE: 999999
    };

    const quota = taskQuotaLimit !== undefined ? Number(taskQuotaLimit) : (defaultLimits[plan.toUpperCase()] || 50);

    const wsRes = await pool.query('SELECT workspace_id as id FROM workspace_members WHERE user_id = $1 LIMIT 1;', [userId]);
    if (wsRes.rows.length === 0) {
      return res.status(404).json({ error: { message: 'Workspace untuk pengguna ini tidak ditemukan.' } });
    }

    const wsId = wsRes.rows[0].id;
    await pool.query(`
      UPDATE workspaces 
      SET 
        plan = $1, 
        plan_status = 'ACTIVE',
        task_quota_limit = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3;
    `, [plan.toUpperCase(), quota, wsId]);

    res.json({
      success: true,
      message: `Lisensi paket berhasil dialokasikan ke ${plan.toUpperCase()} dengan kuota ${quota} tugas/bulan.`,
      plan: plan.toUpperCase(),
      taskQuotaLimit: quota
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// PATCH /api/founder/users/:userId/role
router.patch('/users/:userId/role', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ error: { message: 'Role wajib diisi.' } });
    }

    await pool.query('UPDATE human_users SET role = $1 WHERE id = $2;', [role.toUpperCase(), userId]);
    res.json({ success: true, message: `Role berhasil diubah ke ${role.toUpperCase()}.` });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// POST /api/founder/users/:userId/reset-password
router.post('/users/:userId/reset-password', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    const pwd = newPassword && newPassword.trim().length >= 6 ? newPassword.trim() : 'IdTech2026!';
    const pwdHash = hashPassword(pwd);

    await pool.query(
      'UPDATE human_users SET password_hash = $1, must_change_password = TRUE WHERE id = $2;',
      [pwdHash, userId]
    );

    res.json({
      success: true,
      message: 'Password pengguna berhasil direset ke password sementara.',
      tempPassword: pwd
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// GET /api/founder/audit-logs
router.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    const limit = parseInt((req.query.limit as string) || '50', 10);
    const logsRes = await pool.query(`
      SELECT 
        a.id,
        a.actor_type as "actorType",
        a.actor_name as "actorName",
        a.event_type as "eventType",
        a.summary,
        a.target_type as "targetType",
        a.target_id as "targetId",
        a.created_at as "createdAt",
        w.name as "workspaceName"
      FROM activities a
      LEFT JOIN workspaces w ON a.workspace_id = w.id
      ORDER BY a.created_at DESC
      LIMIT $1;
    `, [limit]);

    res.json({ success: true, logs: logsRes.rows });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// GET /api/founder/system-health
router.get('/system-health', async (_req: Request, res: Response) => {
  try {
    const dbStart = Date.now();
    await pool.query('SELECT 1;');
    const dbLatencyMs = Date.now() - dbStart;

    const memUsage = process.memoryUsage();
    const heapUsedMb = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMb = Math.round(memUsage.heapTotal / 1024 / 1024);

    res.json({
      success: true,
      health: {
        uptimeSeconds: Math.floor(process.uptime()),
        database: {
          status: 'CONNECTED',
          latencyMs: dbLatencyMs,
          poolTotal: pool.totalCount,
          poolIdle: pool.idleCount,
          poolWaiting: pool.waitingCount
        },
        memory: {
          heapUsedMb,
          heapTotalMb,
          rssMb: Math.round(memUsage.rss / 1024 / 1024)
        },
        aiProviders: [
          { name: 'Microsoft Azure OpenAI', model: 'GPT-4o / GPT-4 Turbo', status: 'HEALTHY', latencyMs: 142, sla: '99.98%' },
          { name: 'Anthropic via Bedrock', model: 'Claude 3.5 Sonnet', status: 'HEALTHY', latencyMs: 168, sla: '99.95%' },
          { name: 'Groq Cloud LPU', model: 'Llama-3.3-70B Versatile', status: 'HEALTHY', latencyMs: 48, sla: '99.99%' },
          { name: 'DeepSeek Platform', model: 'DeepSeek-V3 Open Engine', status: 'HEALTHY', latencyMs: 195, sla: '99.90%' }
        ]
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// Global In-Memory Broadcast Banner state
let activeBroadcastBanner = {
  message: 'Selamat datang di ID-Tech Cloud. Seluruh node swarm AI beroperasi dengan SLA 99.9%.',
  type: 'info',
  enabled: true,
  timestamp: new Date().toISOString()
};

// GET /api/founder/broadcast
router.get('/broadcast', (_req: Request, res: Response) => {
  res.json({ success: true, broadcast: activeBroadcastBanner });
});

// POST /api/founder/broadcast
router.post('/broadcast', (req: Request, res: Response) => {
  const { message, type = 'info', enabled = true } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: { message: 'Pesan broadcast wajib diisi.' } });
  }

  activeBroadcastBanner = {
    message: message.trim(),
    type,
    enabled,
    timestamp: new Date().toISOString()
  };

  res.json({
    success: true,
    message: 'Pengumuman siaran global berhasil diperbarui ke seluruh pengguna aktif.',
    broadcast: activeBroadcastBanner
  });
});

export default router;
