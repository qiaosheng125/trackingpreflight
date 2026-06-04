# 本地真实扫描模式

更新时间：2026-06-02

第七站当前默认不执行真实浏览器扫描。`mode: "local"` 已经接入 provider，但必须显式启用。

## 默认行为

请求：

```json
{
  "url": "https://www.example.com/",
  "mode": "local"
}
```

默认返回：

```txt
403 Local browser scanning is disabled for this environment.
```

原因：

- 避免公网部署后被刷真实浏览器扫描。
- 避免本地误触发大量 Chrome / Playwright 会话。
- 避免 Browserless 或 worker 成本不可控。

## 启用方式

只在本地验证时使用：

```bash
npm run dev:local-scan
```

该命令会设置：

```txt
ENABLE_LOCAL_TRACKING_SCAN=1
```

并启动：

```txt
http://localhost:3008
```

## 扫描来源

local provider 会调用：

```txt
00_工具脚本/tracking-checker-prototype/check-tracking.mjs
```

然后通过：

```txt
src/app/api/mock-scan/report-mapper.ts
```

映射成前端报告结构。

## 安全限制

- 仍然经过 URL guard。
- 仍然经过 API 限流。
- 仍然限制 selector 长度。
- 使用 `execFile` 调用脚本，不走 shell 字符串拼接。
- 单次本地扫描超时 45 秒。

## 当前结论

local scan mode 只用于本机验证，不作为公网默认能力。

## 前端入口

页面现在有 `Scan mode` 选择：

- `Mock report`
- `Fixture report`
- `Local browser scan`

默认是 `Mock report`。只有本地验证时才手动选择 `Local browser scan`。

页面也会读取 `/api/health`，显示当前环境是否已启用 local scan。

切换到 `Local browser scan` 时，页面会自动把 URL 示例切换为：

```txt
https://www.aiwallpaperprompts.com/
```

## 2026-06-02 实测结果

本地服务：

```txt
http://localhost:3008
```

已通过：

- `https://www.aiwallpaperprompts.com/` -> `pass`
- `https://www.browserstack.com/` -> `warning`
- `https://vercel.com/` -> `fail`
- `GET /api/health` -> `localScanEnabled: true`
- `npm run test:running-api` -> passed

这些请求已经走完整链路：

```txt
Next API -> local provider -> check-tracking.mjs -> report-mapper.ts -> 页面报告结构
```
