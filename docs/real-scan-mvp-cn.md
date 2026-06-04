# Tracking Preflight 真实扫描 MVP

更新时间：2026-06-03

最新部署：

```txt
dpl_6KVBBdfEvL4YcVgoxYV5dP86D347
https://007tracking-install-checker-99uc9eiu3-xuyifei-s-projects.vercel.app
```

## 当前目标

第七站不再把 mock 报告包装成真实检测。

当前线上默认状态：

- 真实远程扫描默认关闭。
- 未开启真实扫描时，首页只展示 demo 报告。
- 用户不会看到任意 URL 真实扫描表单。
- demo 报告必须明确是 demo，不当作真实扫描结果。

线上 health 当前确认：

```txt
localScanEnabled=false
remoteScanEnabled=false
remoteScanConfigured=false
scanControl.cacheTtlMs=1800000
```

## 已实现

### API

- 正式入口：`POST /api/scan`
- 兼容入口：`POST /api/mock-scan`
- 支持模式：
  - `fixture`：受控样例报告。
  - `local`：本地真实浏览器扫描，需要 `ENABLE_LOCAL_TRACKING_SCAN=1`。
  - `remote`：远程真实浏览器扫描，需要 `ENABLE_REMOTE_TRACKING_SCAN=1` 和 `BROWSERLESS_TOKEN`。

### 真实扫描限制

- 免费每天 3 次。
- 每分钟最多 3 次。
- 每次真实扫描超时 30 秒。
- 相同 URL + 相同扫描设置缓存 30 分钟。
- 全站同时扫描上限 2 个。
- 不保存历史报告。
- 不做复杂点击流程。

### 安全边界

- 只允许 `http` / `https`。
- 只允许 80 / 443 端口。
- 拒绝 localhost。
- 拒绝内网 IPv4 / IPv6。
- `local` / `remote` 真实扫描前会做 DNS 解析后的 IP 复检。
- remote 默认关闭，不会误触发 Browserless 成本。

### Browserless

原型扫描器已支持：

```txt
node 00_工具脚本/tracking-checker-prototype/check-tracking.mjs <url> --browserless
```

依赖环境变量：

```txt
BROWSERLESS_TOKEN=
BROWSERLESS_REGION=sfo
BROWSERLESS_BROWSER=chromium
```

当前还没有配置 token，所以 production 不开放 remote 扫描。

## 下一步只有在需要时做

- 申请 / 配置 Browserless token。
- 在 Vercel 写入：
  - `ENABLE_REMOTE_TRACKING_SCAN=1`
  - `BROWSERLESS_TOKEN`
  - 可选：`BROWSERLESS_REGION`
- 小流量测试 remote。
- 观察成本和扫描成功率。
- 有真实用户后再考虑登录、额度持久化、会员系统。
