# Tracking Checker Prototype

第七站候选方向的技术验证原型。

目标：用可见 Chrome 打开公开页面，通过 Chrome DevTools Protocol 监听 network 请求，判断 GA4 / GTM / Clarity 是否真的加载和发出 collect 请求。

这不是正式产品，只用于判断第七站是否值得进入域名和开发阶段。

## 使用

快速模块测试，不启动 Chrome：

```powershell
node .\00_工具脚本\tracking-checker-prototype\test-modules.mjs
```

估算浏览器托管成本：

```powershell
node .\00_工具脚本\tracking-checker-prototype\estimate-browser-cost.mjs 100 15 30
```

常用成本边界：

- `20 15 30`：约 600 次/月，Browserless 免费档够用。
- `100 15 30`：约 3000 次/月，Browserless 免费档不够，Prototyping 档够用。
- `300 15 30`：约 9000 次/月，Prototyping 档仍够用。

这些估算只用于决策，不等于真实账单。正式上线必须配合限流、缓存和单次扫描超时。

检测公开 URL：

```powershell
node .\00_工具脚本\tracking-checker-prototype\check-tracking.mjs https://www.example.com
```

输出报告文件：

```powershell
node .\00_工具脚本\tracking-checker-prototype\check-tracking.mjs https://www.example.com --out .\00_工具脚本\tracking-checker-prototype\reports\example.json
```

扫描并同时生成 HTML 报告：

```powershell
node .\00_工具脚本\tracking-checker-prototype\check-tracking.mjs https://www.example.com --out .\00_工具脚本\tracking-checker-prototype\reports\example.json --html-out .\00_工具脚本\tracking-checker-prototype\reports\example.html
```

预览非技术用户可读摘要：

```powershell
node .\00_工具脚本\tracking-checker-prototype\render-report-preview.mjs .\00_工具脚本\tracking-checker-prototype\reports\example.json
```

生成可打开的 HTML 报告页：

```powershell
node .\00_工具脚本\tracking-checker-prototype\generate-report-html.mjs .\00_工具脚本\tracking-checker-prototype\reports\example.json .\00_工具脚本\tracking-checker-prototype\reports\preview.html
```

打开静态产品交互原型：

```txt
00_工具脚本/tracking-checker-prototype/product-prototype.html
```

汇总多份报告：

```powershell
node .\00_工具脚本\tracking-checker-prototype\summarize-reports.mjs .\00_工具脚本\tracking-checker-prototype\reports\example.json
```

对比两份报告，例如普通扫描与 `--auto-consent` 扫描：

```powershell
node .\00_工具脚本\tracking-checker-prototype\compare-reports.mjs .\00_工具脚本\tracking-checker-prototype\reports\base.json .\00_工具脚本\tracking-checker-prototype\reports\auto-consent.json
```

批量对比多组普通扫描与 `--auto-consent` 扫描：

```powershell
node .\00_工具脚本\tracking-checker-prototype\compare-consent-batch.mjs ".\00_工具脚本\tracking-checker-prototype\reports\base.json::.\00_工具脚本\tracking-checker-prototype\reports\auto-consent.json"
```

启用本地缓存，60 分钟内同 URL + selector 不重复启动 Chrome：

```powershell
node .\00_工具脚本\tracking-checker-prototype\check-tracking.mjs https://www.example.com --cache-ttl-min 60
```

模拟点击一个按钮或链接：

```powershell
node .\00_工具脚本\tracking-checker-prototype\check-tracking.mjs https://www.example.com --click ".download-button"
```

按顺序执行多个点击，例如先接受 Cookie，再点目标按钮：

```powershell
node .\00_工具脚本\tracking-checker-prototype\check-tracking.mjs https://www.example.com --click ".accept-cookies" --click ".download-button"
```

尝试自动点击常见 Cookie / Consent 接受按钮：

```powershell
node .\00_工具脚本\tracking-checker-prototype\check-tracking.mjs https://www.example.com --auto-consent
```

本地 fixture 仅测试时允许：

```powershell
node .\00_工具脚本\tracking-checker-prototype\check-tracking.mjs file:///E:/程序/出海网站项目/00_工具脚本/tracking-checker-prototype/fixtures/bad-multiple-ga.html --allow-file
```

## 当前检测项

- 页面源码和请求 URL 中的 GA4 Measurement ID：`G-...`
- 页面源码和请求 URL 中的 GTM Container ID：`GTM-...`
- 页面源码和请求 URL 中的 Clarity Project ID
- 是否请求 `googletagmanager.com/gtag/js`
- 是否请求 `googletagmanager.com/gtm.js`
- 是否请求 GA4 `google-analytics.com/g/collect`
- 是否请求 `clarity.ms/tag`
- 是否请求 Clarity collect endpoint
- 是否存在多个 GA4 ID
- 是否有硬失败 tracking 请求
- `net::ERR_ABORTED` 这类 analytics beacon 不当作硬失败

## 状态判断

- `pass`：发现 tracking ID，脚本加载，且观察到 collect 请求，没有 warning。
- `warning`：发现 ID 但没有 collect、多 ID、重复脚本、硬失败请求、点击 selector 异常等。
- `fail`：没有发现 GA4 / GTM / Clarity，或 URL 不允许扫描，或页面无法加载。

## 安全边界

原型已经加入基础 URL 安全校验：

- 只允许 `http` / `https`
- `file://` 默认禁用，仅 `--allow-file` 测试 fixture 时允许
- 禁止 localhost
- 禁止私网 IP、link-local IP、metadata IP
- 只允许端口 80 / 443
- DNS 解析后必须是公网 IP
- 跳转后的最终 URL 会再次校验

这还不是完整生产防护。正式产品还需要：

- DNS rebinding 防护
- 请求级别 IP 复查
- 队列
- 限流
- 缓存
- 单次扫描超时
- 每 IP 每天额度
- 禁止批量免费扫描

## 资源拦截

为了降低扫描成本，原型会拦截：

- jpg / jpeg / png / webp / avif
- mp4 / webm
- woff / woff2 / ttf / otf

不拦截 gif，因为 Clarity collect 可能使用 `c.gif`。

## 已验证样本

- `https://www.aiwallpaperprompts.com`：正例，GA4 + Clarity，当前判定 `pass`。
- `https://www.chatexportchecker.com`：正例，GA4 + Clarity。
- `https://example.com`：反例，无 tracking，当前判定 `fail`。
- `fixtures/bad-multiple-ga.html`：坏样本，多 GA4 ID 且无 collect，当前判定 `warning`。
- `http://127.0.0.1`：安全拦截样本，启动 Chrome 前拒绝。

## 当前模块结构

- `check-tracking.mjs`：CLI 入口，只负责参数解析、调用扫描、写报告。
- `lib/scan-url.mjs`：可复用扫描入口，后续网页 API / worker 可直接调用 `scanUrl()`。
- `lib/url-safety.mjs`：URL、端口、DNS、私网 IP 安全校验。
- `lib/tracking-report.mjs`：tracking 请求分类、ID 提取、报告状态判断。
- `lib/cdp-client.mjs`：Chrome DevTools Protocol 客户端封装。
- `lib/browserless-config.mjs`：Browserless WebSocket URL 构造与 token 脱敏。
- `lib/plain-language-report.mjs`：把扫描 JSON 转成非技术用户可读的标题、解释、发现、下一步和边界说明。
- `lib/api-schema.mjs`：正式 API 的输入、输出和公开错误结构。
- `lib/file-cache.mjs`：本地文件缓存模块。
- `lib/rate-limit.mjs`：固定窗口限流模块，供后续 API 使用。
- `test-modules.mjs`：不启动 Chrome 的基础模块测试。
- `generate-report-html.mjs`：把扫描 JSON 生成可打开的单页 HTML 报告，用于验证产品表达。
- `product-prototype.html`：静态产品首页 + 报告页交互原型，用于验证非技术用户体验。
- `render-report-preview.mjs`：在终端预览 `plainLanguage` 文案。
- `summarize-reports.mjs`：汇总多份扫描报告，用于外部样本稳定性复盘。
- `compare-reports.mjs`：对比两份扫描报告的 collect、conversion、warning 变化。
- `compare-consent-batch.mjs`：批量对比普通扫描与 auto-consent 扫描。

## Browserless 配置边界

后续接 Browserless 时只使用环境变量，不把 token 写进代码或文档：

```powershell
$env:BROWSERLESS_TOKEN="..."
$env:BROWSERLESS_REGION="sfo"
```

当前只完成连接 URL 构造和脱敏模块，尚未把扫描引擎切到远程 Browserless。真正切换前还需要实测连接、超时、并发和错误处理。

## API 草案

请求：

```json
{
  "url": "https://www.example.com",
  "clickSelector": ".download-button",
  "cacheTtlMinutes": 60
}
```

成功响应：

```json
{
  "ok": true,
  "data": {
    "url": "https://www.example.com/",
    "finalUrl": "https://www.example.com/",
    "status": "pass",
    "detected": {},
    "requests": {},
    "warnings": [],
    "fixSuggestions": []
  }
}
```

失败响应：

```json
{
  "ok": false,
  "error": {
    "code": "blocked_url",
    "message": "URL resolves to a blocked or private IP address"
  }
}
```

## 判断边界

本原型只能确认“公开页面加载时是否发出 tracking 请求”。它不能确认：

- GA4 后台最终是否入库
- Shopify checkout / purchase tracking 是否完整
- 登录态页面 tracking
- 复杂 Consent Mode 全量诊断
- 广告归因是否准确
