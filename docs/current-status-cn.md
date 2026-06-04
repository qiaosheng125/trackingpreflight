# Tracking Preflight 当前状态

更新时间：2026-06-02

## 已完成

- 域名已购买：`trackingpreflight.com`
- Cloudflare 已添加域名，NS 已切换。
- Vercel 已部署生产环境。
- 最新生产部署：
  - `dpl_6d6K6hHKvjWr9xcxNjv8mtrf2fGT`
  - `https://007tracking-install-checker-nxoe6lllb-xuyifei-s-projects.vercel.app`
- Vercel 已绑定：
  - `trackingpreflight.com`
  - `www.trackingpreflight.com`
- HTTPS 已生效。
- 裸域已跳转到 `www`。
- 首页可访问：`https://www.trackingpreflight.com/`
- Sitemap 可访问：`https://www.trackingpreflight.com/sitemap.xml`
- Robots 可访问：`https://www.trackingpreflight.com/robots.txt`
- 反馈邮箱已配置：
  - `support@trackingpreflight.com -> xyf1254519010@gmail.com`
- GA4 已接入并验证：
  - `G-HQRDFB0FC4`
- Clarity 已接入并验证：
  - `x0rk21q9w5`
- 正式扫描 API 入口已创建：
  - `POST /api/scan`
- 旧 mock 入口暂时保留兼容：
  - `POST /api/mock-scan`
- 前端已经改为调用正式入口 `/api/scan`。
- 线上默认仍只开放 mock / fixture 报告，不会触发真实浏览器扫描成本。
- 本地显式开启后，可以走真实本地浏览器扫描链路：
  - `npm run dev:local-scan`
- 线上验证结果：
  - `GET https://www.trackingpreflight.com/api/health` 返回 `production`，`localScanEnabled=false`
  - `POST https://www.trackingpreflight.com/api/scan` 使用 `fixture` 模式返回 `warning` 报告

## 用户手动完成项

以后 GSC / Bing 由用户手动做，Codex 只提供 URL 和记录状态。

需要提交：

```txt
Google Search Console sitemap:
https://www.trackingpreflight.com/sitemap.xml

Google Search Console 首页请求编入索引:
https://www.trackingpreflight.com/

Bing Webmaster sitemap:
https://www.trackingpreflight.com/sitemap.xml
```

## 仍未完成

- 确认 GSC 首页是否已经请求编入索引。
- 确认 Bing 是否已经导入站点或提交 sitemap。
- 继续完善 GA4 / Clarity 创建脚本，让后续新站更快复用。
- 后续决定真实远程扫描引擎方案，当前只完成接口架构，不急着公网开放：
  - MVP 可以先用 Browserless 免费档或本地 worker 验证。
  - 后续再考虑 Fly.io / Railway / Render 自托管 Playwright worker。
- 正式远程扫描上线前，还必须补：
  - 每 IP 每日限额。
  - 全站扫描并发上限。
  - 相同 URL 短时间缓存。
  - 扫描日志与异常告警。
  - DNS 解析后内网 IP 复检。

## 暂不开放

- 真实远程浏览器扫描暂未对公网开放，避免 Browserless / worker 成本失控。
- 付费功能暂不做。
- 用户账号系统暂不做。
