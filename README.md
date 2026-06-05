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
- **Status bar** — Shows balance (¥), monthly cost, and today's cost, refreshed every 5 minutes and after each agent turn
- **`/sophnet-balance` command** — Detailed billing breakdown with paid vs. gift balance
- **`describe_image` tool** — LLM-callable tool for image understanding via Sophnet vision models. The LLM automatically calls this tool whenever the user mentions an image file (png, jpg, gif, webp, bmp), avoiding guesswork about image content
- **`/view-image` command** — Manual command to analyze images: `/view-image <path> [model]`

## Models

| Model | Context | Pricing (input/output ¥/1M tokens) |
|-------|---------|-------------------------------------|
| DeepSeek-V4-Pro | 1M | ¥9 / ¥18 |
| DeepSeek-V4-Flash | 1M | ¥1 / ¥2 |
| GLM-5.1 | 200K | ¥8 / ¥28 |
| MiniMax-M3 | 512K | ¥2.1 / ¥8.4 |
| Kimi-K2.6 | 256K | ¥6.5 / ¥27 |
| qwen3.7-max | 200K | ¥6 / ¥18 |

## Image Understanding

Use the `describe_image` tool (LLM) or `/view-image` command (manual) to analyze images with Sophnet vision models.

### Tool: `describe_image`

The LLM automatically calls this tool when the user references an image file.

| Parameter | Required | Description |
|-----------|----------|-------------|
| `path` | Yes | Local path to the image file |
| `model` | No | Vision model name (default: `qwen3-vl-flash`) |
| `prompt` | No | Custom analysis prompt (default: detailed description) |

### Command: `/view-image`

```
/view-image <path> [model]
```

Example:
```
/view-image screenshot.png qwen3-vl-plus
```

### Vision Models

| Model |
|-------|
| `qwen3-vl-flash` *(default)* |
| `qwen3-vl-plus` |
| `Qwen3-VL-235B-A22B-Instruct` |
| `GLM-4.6V` |
| `GLM-5V-Turbo` |
| `Doubao-Seed-1.6-vision` |

## License

MIT
