/**
 * Sophnet Provider Extension for pi
 *
 * - Registers the Sophnet provider with all models and thinking-level maps
 * - Shows balance / monthly cost / today's cost in the status bar
 * - /sophnet-balance command for detailed billing info
 *
 * Setup: set SOPHNET_API_KEY env var, or run /login sophnet
 */

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

// ═══════════════════════════════════════════════════════════════════════════════
// API Key Resolution
// ═══════════════════════════════════════════════════════════════════════════════

function resolveApiKey(): string {
	const envKey = process.env.SOPHNET_API_KEY;
	if (envKey) return envKey;
	try {
		const authPath = join(homedir(), ".pi", "agent", "auth.json");
		const auth = JSON.parse(readFileSync(authPath, "utf-8"));
		const entry = auth.sophnet;
		if (entry) return typeof entry === "string" ? entry : entry.key ?? "";
	} catch { /* ignore */ }
	return "";
}

// ═══════════════════════════════════════════════════════════════════════════════
// Sophnet Billing API
// ═══════════════════════════════════════════════════════════════════════════════

const API_BASE = "https://www.sophnet.com/api/open-apis";

interface Balance { total: number; paid: number; gift: number }

async function apiFetch(path: string, apiKey: string, signal?: AbortSignal): Promise<any> {
	const res = await fetch(`${API_BASE}${path}`, {
		headers: { Authorization: `Bearer ${apiKey}` },
		signal,
	});
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	const data = await res.json();
	if (data.status !== 0) throw new Error(data.message ?? "API error");
	return data.result;
}

const getBalance = (k: string, s?: AbortSignal) =>
	apiFetch("/projects/balance", k, s).then((r: any): Balance => ({
		total: r.currentBalance ?? 0,
		paid: r.currentBalanceWithoutGift ?? 0,
		gift: r.currentGiftBalance ?? 0,
	}));

const getUsageCost = (k: string, begin: string, end: string, s?: AbortSignal) =>
	apiFetch(`/projects/usage_detail?beginTime=${begin}&endTime=${end}`, k, s)
		.then((r: any) => (r.costSummary as number) ?? 0);

// ═══════════════════════════════════════════════════════════════════════════════
// Formatting Helpers
// ═══════════════════════════════════════════════════════════════════════════════

const STATUS_KEY = "sophnet-billing";
const REFRESH_MS = 5 * 60 * 1000;

interface BillingState { balance: Balance; monthlyCost: number; todayCost: number }

function ymd(d: Date) {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function monthStart(d: Date) {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}
function fmtCNY(n: number): string {
	if (n >= 10000) return `${(n / 10000).toFixed(1)}w`;
	if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
	return n.toFixed(2);
}
function renderBilling(s: BillingState | null, err: string | null, theme: any): string {
	if (err) return theme.fg("dim", "sophnet ") + theme.fg("error", err);
	if (!s) return theme.fg("dim", "sophnet ···");
	return [
		theme.fg("success", `¥${Math.round(s.balance.total)}`),
		theme.fg("dim", "M ") + theme.fg("accent", `¥${fmtCNY(s.monthlyCost)}`),
		theme.fg("dim", "D ") + theme.fg("accent", `¥${fmtCNY(s.todayCost)}`),
	].join(" ");
}

// ═══════════════════════════════════════════════════════════════════════════════
// Provider Config
// ═══════════════════════════════════════════════════════════════════════════════

const SHARED_COMPAT = {
	supportsDeveloperRole: false,
	maxTokensField: "max_tokens" as const,
	supportsReasoningEffort: true,
	thinkingFormat: "deepseek" as const,
	requiresReasoningContentOnAssistantMessages: true,
};

const DEEPSEEK_THINKING = { off: "disabled", minimal: null, low: "low", medium: "medium", high: "high", xhigh: "max" };
const GLM_THINKING = { off: "none", minimal: "minimal", low: "low", medium: "medium", high: "high", xhigh: "xhigh" };
const MINIMAX_THINKING = { off: null, minimal: "minimal", low: "low", medium: "medium", high: "high", xhigh: "xhigh" };
const KIMI_THINKING = { off: "none", minimal: "minimal", low: "low", medium: "medium", high: "high", xhigh: "xhigh" };
const QWEN_THINKING = { off: "none", minimal: "minimal", low: "low", medium: "medium", high: "high", xhigh: "xhigh" };

const SOPHNET_MODELS = [
	{
		id: "DeepSeek-V4-Pro", name: "DeepSeek-V4-Pro", reasoning: true, input: ["text"] as const,
		contextWindow: 1_000_000, maxTokens: 65536,
		cost: { input: 9, output: 18, cacheRead: 0, cacheWrite: 0 },
		compat: SHARED_COMPAT, thinkingLevelMap: DEEPSEEK_THINKING,
	},
	{
		id: "DeepSeek-V4-Flash", name: "DeepSeek-V4-Flash", reasoning: true, input: ["text"] as const,
		contextWindow: 1_000_000, maxTokens: 65536,
		cost: { input: 1, output: 2, cacheRead: 0, cacheWrite: 0 },
		compat: SHARED_COMPAT, thinkingLevelMap: DEEPSEEK_THINKING,
	},
	{
		id: "GLM-5.1", name: "GLM-5.1", reasoning: true, input: ["text"] as const,
		contextWindow: 200_000, maxTokens: 65536,
		cost: { input: 8, output: 28, cacheRead: 0, cacheWrite: 0 },
		compat: SHARED_COMPAT, thinkingLevelMap: GLM_THINKING,
	},
	{
		id: "MiniMax-M3", name: "MiniMax-M3", reasoning: true, input: ["text"] as const,
		contextWindow: 512_000, maxTokens: 65536,
		cost: { input: 2.1, output: 8.4, cacheRead: 0, cacheWrite: 0 },
		compat: SHARED_COMPAT, thinkingLevelMap: MINIMAX_THINKING,
	},
	{
		id: "Kimi-K2.6", name: "Kimi-K2.6", reasoning: true, input: ["text"] as const,
		contextWindow: 256_000, maxTokens: 65536,
		cost: { input: 6.5, output: 27, cacheRead: 0, cacheWrite: 0 },
		compat: SHARED_COMPAT, thinkingLevelMap: KIMI_THINKING,
	},
	{
		id: "qwen3.7-max", name: "qwen3.7-max", reasoning: true, input: ["text"] as const,
		contextWindow: 200_000, maxTokens: 65536,
		cost: { input: 6, output: 18, cacheRead: 0, cacheWrite: 0 },
		compat: SHARED_COMPAT, thinkingLevelMap: QWEN_THINKING,
	},
];

// ═══════════════════════════════════════════════════════════════════════════════
// Extension Entry Point
// ═══════════════════════════════════════════════════════════════════════════════

export default function (pi: ExtensionAPI) {
	const apiKey = resolveApiKey();

	// ── Register Provider ─────────────────────────────────────────────────
	pi.registerProvider("sophnet", {
		name: "Sophnet",
		baseUrl: "https://www.sophnet.com/api/open-apis/v1",
		apiKey: apiKey || "$SOPHNET_API_KEY",
		api: "openai-completions",
		compat: SHARED_COMPAT,
		models: SOPHNET_MODELS,
	});

	// ── Billing State ─────────────────────────────────────────────────────
	if (!apiKey) return;

	let billing: BillingState | null = null;
	let billingErr: string | null = null;
	let refreshTimer: ReturnType<typeof setInterval> | null = null;

	async function refreshBilling(): Promise<void> {
		const d = new Date();
		try {
			const [bal, mCost, dCost] = await Promise.all([
				getBalance(apiKey),
				getUsageCost(apiKey, monthStart(d), ymd(d)),
				getUsageCost(apiKey, ymd(d), ymd(d)),
			]);
			billing = { balance: bal, monthlyCost: mCost, todayCost: dCost };
			billingErr = null;
		} catch (err: any) {
			if (err.name === "AbortError") return;
			billingErr = err.message.slice(0, 40);
		}
	}

	// Fetch immediately + periodically
	refreshBilling();
	refreshTimer = setInterval(refreshBilling, REFRESH_MS);

	// Update status bar on session start
	pi.on("session_start", async (_event, ctx) => {
		await refreshBilling();
		ctx.ui.setStatus(STATUS_KEY, renderBilling(billing, billingErr, ctx.ui.theme));
	});

	// Refresh after each agent turn
	pi.on("turn_end", async (_event, ctx) => {
		await refreshBilling();
		ctx.ui.setStatus(STATUS_KEY, renderBilling(billing, billingErr, ctx.ui.theme));
	});

	// Cleanup
	pi.on("session_shutdown", async () => {
		if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null; }
	});

	// ── /sophnet-balance ──────────────────────────────────────────────────
	pi.registerCommand("sophnet-balance", {
		description: "Show Sophnet balance and usage details",
		handler: async (_args, ctx) => {
			await ctx.waitForIdle();
			ctx.ui.notify("Fetching Sophnet billing...", "info");
			await refreshBilling();
			ctx.ui.setStatus(STATUS_KEY, renderBilling(billing, billingErr, ctx.ui.theme));
			if (billingErr) { ctx.ui.notify(`Error: ${billingErr}`, "error"); return; }
			if (!billing) return;
			ctx.ui.notify(
				[
					`💰 Balance: ¥${billing.balance.total.toFixed(4)}`,
					`   Paid: ¥${billing.balance.paid.toFixed(4)}  Gift: ¥${billing.balance.gift.toFixed(4)}`,
					`📅 Monthly: ¥${billing.monthlyCost.toFixed(4)}`,
					`📆 Today:   ¥${billing.todayCost.toFixed(4)}`,
				].join("\n"), "info",
			);
		},
	});
}
