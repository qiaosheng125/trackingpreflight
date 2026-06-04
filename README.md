# Tracking Preflight

第七站 Tracking Preflight 的 Next.js MVP。当前已部署到生产域名，首版开放 mock / fixture 检查体验，真实远程扫描暂不对公网开放。

## 当前状态

- 阶段：L0- 上线验证
- 域名：`trackingpreflight.com`
- Canonical URL：`https://www.trackingpreflight.com`
- 部署：Vercel
- DNS：Cloudflare，用户在 Vercel 网页授权后写入 DNS
- 当前边界：公开 mock / fixture / sample pages；真实远程扫描暂未开放
- 本地预览：`http://localhost:3007` 或 `http://localhost:3008`

## 已实现

- URL 输入区
- Scan mode 选择：`mock` / `fixture` / `local`
- 切换 Scan mode 时会自动填入对应示例 URL
- Auto consent 开关
- Consent selector 输入
- Manual event selector 输入
- 4 组样例报告切换
- 本地 mock API：`POST /api/mock-scan`
- 健康检查 API：`GET /api/health`
- 页面会读取 health API，显示当前 local scan 是否启用
- URL 安全校验雏形：拒绝 localhost、内网 IP、非 80/443 端口
- API 输入校验：URL 长度、preset 白名单、selector 长度
- 内存版 API 限流：每 IP 每分钟 12 次，用于原型成本保护
- 扫描 provider 抽象：当前是 mock provider，后续替换为 Browserless / Playwright provider
- 真实脚本 JSON mapper：把 `tracking-checker-prototype` 输出转成页面报告结构
- fixture 模式：`mode: "fixture"` 可走 mapper 生成受控样本报告
- local 模式：`mode: "local"` 可在本机启用后走真实扫描
- 页面会显示 API 返回的具体错误文案，例如本地地址拦截或限流
- 检测边界说明：能检查什么、不能证明什么
- 小团队工作流说明
- 受控样本页：
  - `/samples/pass`
  - `/samples/warning`
  - `/samples/fail`

## 未实现

- 真实远程扫描 API
- Browserless 接入
- 自托管 Playwright worker
- 用户账户
- 报告保存
- 付费功能

## 工程文档

- [真实扫描接入计划](docs/real-scan-integration-plan.md)
- [报告解释文案规则](docs/report-language-rules.md)
- [扫描成本控制清单](docs/cost-control-checklist.md)
- [本地真实扫描模式](docs/local-scan-mode.md)
- [域名购买信息包](docs/domain-purchase-pack.md)
- [账号与部署记录](docs/account-and-deploy-notes.md)

## 受控样本页

```txt
/samples
/samples/pass
/samples/warning
/samples/fail
```

这些页面用于后续真实扫描验证，避免只依赖外部网站。当前样本页不会加载真实 GA4 / GTM / Clarity 生产脚本，只放 fixture metadata，防止污染真实统计数据。

## 验证命令

```bash
npm run smoke
npm run test:api
npm run test:mapper
npm run test:running-api
npm run build
```

当前构建脚本使用 `next build --webpack`，原因是 Next 16 在当前 Windows 环境默认 Turbopack 会遇到原生绑定不可用或文件占用问题。

`npm run test:api` 会验证 URL guard 和请求体校验行为，后续接真实扫描前必须保持通过。
`npm run test:mapper` 会验证真实脚本 JSON 到页面报告结构的映射。
`npm run test:running-api` 会请求正在运行的本地服务，验证 `/api/health`、fixture scan，以及在 local scan 已启用时验证真实扫描。

## 环境变量

```txt
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_CLARITY_ID=
```

当前生产环境仍待填入 GA4 和 Clarity ID。填入后必须重新生产部署，并验证线上脚本。

## Mock API

```http
POST /api/mock-scan
```

## Health API

```http
GET /api/health
```

返回当前服务状态、可用扫描模式，以及 `localScanEnabled` 是否开启。

当前根据输入 URL 返回本地样例报告，用于打磨前端交互。后续接 Browserless 或自托管 Playwright worker 时，优先替换这个接口，不重写页面。

当前 API 已拆成三层：

- `scan-request.ts`：请求体校验和标准化
- `url-guard.ts`：公开 URL 安全校验
- `scan-provider.ts`：扫描执行层，当前返回 mock 报告
- `report-mapper.ts`：真实脚本 JSON 到页面报告结构的映射

接口已先加入 SSRF 防护雏形：

- 只允许 `http` / `https`
- 只允许 80 / 443 端口
- 拒绝 localhost
- 拒绝常见内网 IPv4 / IPv6
- 拒绝 `.local` 主机名

接口也有内存版限流：

- 每个客户端 key 每分钟 12 次
- 返回 `X-RateLimit-Remaining`
- 返回 `X-RateLimit-Reset`
- 正式上线前应替换为 Cloudflare / Vercel KV / 队列层限流
