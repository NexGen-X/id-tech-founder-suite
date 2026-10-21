# 👑 ID-Tech Cloud — Founder & CEO Executive Suite

> **Air-gapped Standalone C-Level Operations & Governance Portal for PT NexGen Digital Nusantara**

This repository contains the standalone Founder Suite for ID-Tech Cloud, completely isolated from tenant customer code.

## 🏛️ Triad Domain Architecture

| Platform | Repository | Deployment | Target Domain |
|---|---|---|---|
| **Commercial Landing** | [`NexGen-X/id-tech-landing`](https://github.com/NexGen-X/id-tech-landing) | Cloudflare Pages | `id-tech.cloud` |
| **Tenant SaaS Platform** | [`NexGen-X/Ai-Center-Workspace`](https://github.com/NexGen-X/Ai-Center-Workspace) | Railway (Service 1) | `app.id-tech.cloud` |
| **Founder Executive Suite** | [`NexGen-X/id-tech-founder-suite`](https://github.com/NexGen-X/id-tech-founder-suite) | Railway (Service 2) | `founder.id-tech.cloud` |

## 🌟 Executive Modules

1. **Financials & MRR Intelligence**: Live MRR/ARR calculator & Midtrans payment transaction ledger.
2. **Master User & Enterprise Organization Directory**: Multi-tenant customer list, manual plan grants, quota injection, and 1-click CSV export.
3. **LLM Unit Economics & FinOps**: Gross profit margin tracking (~89.4%), upstream API token costs, and live provider SLA monitor (Azure OpenAI, Claude 3.5 Sonnet, Groq, DeepSeek).
4. **Platform Immutable Audit Trail**: Unalterable event ledger across all organizations (UU PDP & SOC2 compliance).
5. **System Governance & Global Broadcast**: Instant global announcement banner dispatch to all active tenant dashboards.

## 🚀 Development & Deployment

```bash
# Install dependencies
npm install

# Run backend & frontend
npm run dev:server
npm run dev:client

# Production Build
npm run build
npm start
```

## 🔒 Security Clearance

Access to this portal is restricted to Level 5 credentials (`role = 'ADMIN'`). All requests are verified against the shared PostgreSQL database.
