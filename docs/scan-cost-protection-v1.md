# Tracking Preflight 扫描成本保护 v1

更新时间：2026-06-02

最新部署：

```txt
dpl_BQkfYe1WZ5QQxcvBaHMjrgt5Ugmj
https://007tracking-install-checker-3pp5akt2c-xuyifei-s-projects.vercel.app
```

## 本次完成

第七站已经补上真实远程扫描上线前的第一层成本保护。

已完成：

- 每 IP 每分钟限额：默认 12 次。
- 每 IP 每日限额：默认 80 次。
- 全站并发扫描上限：默认 2 个。
- 相同 URL + 相同扫描设置短时间缓存：默认 10 分钟。
- `/api/health` 返回 `scanControl`，可以查看当前并发、并发上限、缓存大小和缓存时间。
- `/api/scan` 响应头返回：
  - `X-RateLimit-Minute-Remaining`
  - `X-RateLimit-Minute-Reset`
  - `X-RateLimit-Daily-Remaining`
  - `X-RateLimit-Daily-Reset`
  - `X-Scan-Cache`
- 测试已覆盖：
  - 分钟限额。
  - 每日限额。
  - 并发槽。
  - 缓存命中。
- `mode: local` 真实扫描前会做 DNS 解析后的 IP 复检：
  - 拒绝解析到 localhost。
  - 拒绝解析到内网 IPv4 / IPv6。
  - DNS 解析超时或失败时拒绝扫描。
  - mock / fixture 不做 DNS 解析，因为它们不会访问目标网站。

## 当前边界

公网仍然不开真实浏览器扫描。

当前 production：

```txt
localScanEnabled=false
```

这表示线上用户只能跑 mock / fixture 报告，不会触发 Browserless 或 Playwright worker 成本。

## 为什么先做内存版

当前阶段只需要让产品接口和保护策略成型，不需要马上引入 KV / D1 / Redis。

内存版适合：

- 单实例 MVP。
- 本地验证。
- 早期接口行为测试。
- 先确定产品交互和报告结构。

内存版不适合：

- 多实例生产限流。
- 严格防刷。
- 长期成本审计。
- 跨部署保留扫描历史。

## 正式接远程扫描前还必须补

- Cloudflare KV / D1 / Redis 等持久化限流。
- 扫描日志。
- 异常告警。
- 跳转后的 final URL 复检。
- Browserless / worker 配额告警。
- 失败请求不无限重试。
- 同一 IP 大量扫描不同 URL 的风控。

## 当前结论

第七站现在已经具备：

- 正式 API 入口：`POST /api/scan`
- 兼容入口：`POST /api/mock-scan`
- 本地真实扫描模式：`npm run dev:local-scan`
- 线上成本保护 v1
- 线上 running API 测试通过
- 远程真实扫描模式的受控入口：`mode: "remote"`

远程模式当前状态：

- 默认禁用：`ENABLE_REMOTE_TRACKING_SCAN` 不为 `1` 时返回 403。
- 不泄露 token：`/api/health` 只返回 `remoteScanConfigured` 布尔值。
- 未配置 `BROWSERLESS_TOKEN` 时返回 503。
- Browserless provider 还没有正式接入，不对用户开放。

但还不应该开放公网真实浏览器扫描。
