# pi-sophnet

Sophnet provider extension for [pi](https://pi.dev). Registers Sophnet as a custom LLM provider and displays real-time billing info (balance, monthly cost, today's cost) in the status bar.

## Install

```bash
pi install npm:pi-sophnet
```

## Setup

Set your Sophnet API key using one of:

1. **Environment variable:** `export SOPHNET_API_KEY=your-key`
2. **pi auth:** Run `/login sophnet` inside pi and follow the prompt

## Features

- **Provider registration** — Adds the Sophnet provider with DeepSeek, GLM, MiniMax, Kimi, and Qwen models
- **Status bar** — Shows balance (¥), monthly cost (M), and today's cost (D), refreshed every 5 minutes and after each agent turn
- **`/sophnet-balance` command** — Detailed billing breakdown with paid vs. gift balance

## Models

| Model | Context | Pricing (input/output ¥/1M tokens) |
|-------|---------|-------------------------------------|
| DeepSeek-V4-Pro | 1M | ¥9 / ¥18 |
| DeepSeek-V4-Flash | 1M | ¥1 / ¥2 |
| GLM-5.1 | 200K | ¥8 / ¥28 |
| MiniMax-M3 | 512K | ¥2.1 / ¥8.4 |
| Kimi-K2.6 | 256K | ¥6.5 / ¥27 |
| qwen3.7-max | 524K | ¥6 / ¥18 |

## License

MIT
