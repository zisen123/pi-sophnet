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
import { extname, join } from "node:path";
import { Type } from "typebox";

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
// Vision / Image Understanding
// ═══════════════════════════════════════════════════════════════════════════════

const VISION_MODELS = [
	"qwen3-vl-flash",
	"qwen3-vl-plus",
	"Qwen3-VL-235B-A22B-Instruct",
	"GLM-4.6V",
	"GLM-5V-Turbo",
	"Doubao-Seed-1.6-vision",
] as const;

const DEFAULT_VISION_MODEL = "qwen3-vl-flash";
const VISION_API_URL = "https://www.sophnet.com/api/open-apis/v1/chat/completions";

const MIME_MAP: Record<string, string> = {
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".gif": "image/gif",
	".webp": "image/webp",
	".bmp": "image/bmp",
};

function encodeImage(filePath: string): { mime: string; dataUrl: string } {
	const ext = extname(filePath).toLowerCase();
	const mime = MIME_MAP[ext];
	if (!mime) {
		const supported = Object.keys(MIME_MAP).join(", ");
		throw new Error(`Unsupported image format: ${ext}. Supported: ${supported}`);
	}
	const data = readFileSync(filePath);
	const base64 = data.toString("base64");
	return { mime, dataUrl: `data:${mime};base64,${base64}` };
}

interface VisionResult {
	text: string;
	imageTokens: number;
	totalTokens: number;
}

async function describeImage(
	imagePath: string,
	model: string,
	prompt: string,
	apiKey: string,
	signal?: AbortSignal,
): Promise<VisionResult> {
	const { dataUrl } = encodeImage(imagePath);

	const body = JSON.stringify({
		model,
		messages: [{
			role: "user" as const,
			content: [
				{ type: "text", text: prompt },
				{ type: "image_url", image_url: { url: dataUrl, detail: "high" } },
			],
		}],
		stream: false,
		max_tokens: 4096,
	});

	const res = await fetch(VISION_API_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`,
		},
		body,
		signal,
	});

	if (!res.ok) {
		const errText = await res.text().catch(() => "");
		throw new Error(`Vision API error (${res.status}): ${errText.slice(0, 200)}`);
	}

	const data = await res.json() as any;
	const text: string = data.choices?.[0]?.message?.content ?? "";
	const usage = data.usage ?? {};
	const imageTokens: number = usage.prompt_tokens_details?.image_tokens ?? 0;
	const totalTokens: number = usage.total_tokens ?? 0;

	return { text, imageTokens, totalTokens };
}

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
		models: SOPHNET_MODELS,
	});

	// ── describe_image Tool ───────────────────────────────────────────────
	pi.registerTool({
		name: "describe_image",
		label: "Describe Image",
		description: "使用 Sophnet 视觉模型理解/描述图片内容。当用户提到或引用图片文件（png/jpg/jpeg/gif/webp/bmp）时调用此工具。",
		promptSnippet: "Describe an image using sophnet vision model",
		promptGuidelines: [
			"Use describe_image whenever the user mentions or references an image file (png, jpg, jpeg, gif, webp, bmp). Always look at images the user asks about rather than guessing their content.",
		],
		parameters: Type.Object({
			path: Type.String({ description: "图片文件的本地路径" }),
			model: Type.Optional(Type.String({ description: `视觉模型名称，可选: ${VISION_MODELS.join(", ")}。默认 ${DEFAULT_VISION_MODEL}` })),
			prompt: Type.Optional(Type.String({ description: "对图片的提问或分析指令，默认请模型详细描述图片内容" })),
		}),
		async execute(_toolCallId, params, signal, onUpdate, _ctx) {
			const key = resolveApiKey();
			if (!key) {
				return {
					content: [{ type: "text", text: "错误：未配置 Sophnet API Key。请设置 SOPHNET_API_KEY 环境变量或运行 /login sophnet。" }],
					details: {},
				};
			}

			const model = params.model ?? DEFAULT_VISION_MODEL;
			const prompt = params.prompt ?? "请详细描述这张图片的内容，包括其中的文字、界面元素、图表数据等所有可见信息。";

			onUpdate?.({ content: [{ type: "text", text: `正在使用 ${model} 分析图片...` }] });

			try {
				const result = await describeImage(params.path, model, prompt, key, signal);
				const footer = `\n\n---\n*(${model}, 图片token: ${result.imageTokens}, 总token: ${result.totalTokens})*`;
				return {
					content: [{ type: "text", text: result.text + footer }],
					details: { model, imageTokens: result.imageTokens, totalTokens: result.totalTokens },
				};
			} catch (err: any) {
				return {
					content: [{ type: "text", text: `图片分析失败: ${err.message}` }],
					details: { error: err.message },
					isError: true,
				};
			}
		},
	});

	// ── /view-image Command ───────────────────────────────────────────────
	pi.registerCommand("view-image", {
		description: "使用 Sophnet 视觉模型理解图片。用法: /view-image <路径> [模型]",
		handler: async (args, ctx) => {
			await ctx.waitForIdle();

			const key = resolveApiKey();
			if (!key) {
				ctx.ui.notify("错误：未配置 Sophnet API Key", "error");
				return;
			}

			if (!args?.trim()) {
				ctx.ui.notify("用法: /view-image <图片路径> [模型名称]\n可选模型: " + VISION_MODELS.join(", "), "info");
				return;
			}

			const parts = args.trim().split(/\s+/);
			const imagePath = parts[0];
			const model = parts[1] ?? DEFAULT_VISION_MODEL;

			ctx.ui.notify(`正在使用 ${model} 分析图片...`, "info");

			try {
				const result = await describeImage(imagePath, model, "请详细描述这张图片的内容，包括其中的文字、界面元素、图表数据等所有可见信息。", key);
				const footer = `\n\n(${model}, 图片token: ${result.imageTokens}, 总token: ${result.totalTokens})`;
				ctx.ui.notify(result.text + footer, "info");
			} catch (err: any) {
				ctx.ui.notify(`图片分析失败: ${err.message}`, "error");
			}
		},
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
