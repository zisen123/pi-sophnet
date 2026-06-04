# Vision / Image Understanding Tool for pi-sophnet

> 日期: 2026-06-04
> 范围: 当前对话 session
> 记录目录: changelog-agents/

---

## [20:06] 新增 describe_image Tool 和 /view-image Command

### 改动文件
- `extensions/index.ts`: 修改

### 改动说明
- `extensions/index.ts`
  - imports: 新增 `extname` from `node:path` 和 `Type` from `typebox`。原因：`extname` 用于检测图片文件扩展名以确定 MIME 类型；`Type` 用于定义 tool 的参数 schema
  - `VISION_MODELS` 常量: 新增，列出 sophnet 上可用的视觉模型（qwen3-vl-flash、qwen3-vl-plus、Qwen3-VL-235B-A22B-Instruct、GLM-4.6V、GLM-5V-Turbo、Doubao-Seed-1.6-vision）。原因：提供可选模型列表，用户可按需切换
  - `DEFAULT_VISION_MODEL` 常量: 新增，默认值 `qwen3-vl-flash`。原因：轻量快速，适合日常看图
  - `VISION_API_URL` 常量: 新增，指向 `https://www.sophnet.com/api/open-apis/v1/chat/completions`。原因：视觉理解通过标准 chat completions 多模态接口实现
  - `MIME_MAP` 映射表: 新增，文件扩展名（.png/.jpg/.jpeg/.gif/.webp/.bmp）到 MIME 类型的映射。原因：构造 base64 data URL 时需要正确的 MIME 类型
  - `encodeImage()` 函数: 新增，读取本地图片文件并编码为 `data:<mime>;base64,...` 格式。原因：Sophnet 视觉 API 接受 base64 或 URL 两种图片输入方式
  - `VisionResult` 接口: 新增，定义视觉 API 返回结构（text, imageTokens, totalTokens）。原因：统一 tool 和 command 的返回格式，同时追踪图片 token 消耗
  - `describeImage()` 函数: 新增，共享的图片理解调用逻辑，构造 multimodal 请求（type: image_url, detail: high），POST 到 chat completions 端点，解析 choices[0].message.content 和 usage 信息。原因：tool 和 command 共用同一逻辑，避免重复代码
  - `describe_image` Tool: 新增，LLM 可调用工具，参数 path（必填）/ model（可选）/ prompt（可选）。带 promptSnippet 和 promptGuidelines 引导 LLM 在用户提到图片文件时主动调用。原因：让 AI 能自主看图，提升代码排查/图表分析等场景的效率
  - `/view-image` Command: 新增，用户手动命令，用法 `/view-image <路径> [模型]`。原因：提供用户直接调用入口，不依赖 LLM 决策
  - 文件系统软链接: `~/.pi/agent/extensions/sophnet/index.ts` 改为指向 `/home/yicong.wu/pi-sophnet/extensions/index.ts` 的符号链接。原因：避免两份代码不同步，pi 直接加载 repo 版本

### 测试结果
- ✅ `/view-image /tmp/test_image.png` — 正确识别图片中的文字、颜色、布局
- ✅ `/view-image`（无参数）— 显示用法帮助和可用模型列表
- ✅ `/view-image /etc/hosts`（不支持的格式）— 正确报错并列出支持的格式
- ✅ `/view-image /tmp/nonexistent.png`（文件不存在）— 正确报 ENOENT 错误
- ✅ `describe_image` Tool — LLM 看到图片文件路径后自动调用，正确识别新图片内容（JSON 错误响应、颜色、字体等）
