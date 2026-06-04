# 真实扫描接入计划

更新时间：2026-06-02

当前项目是本地 Next.js MVP，真实扫描还未接入。这个文档记录后续从 mock API 过渡到真实扫描服务时的替换点。

## 当前接口

```http
POST /api/mock-scan
```

当前用途：

- 接收 URL、consent preset、event preset、selector 等输入。
- 做基础 URL 安全校验。
- 做内存版限流。
- 根据 URL 返回本地样例报告。

## 替换原则

页面不要重写。后续真实扫描优先替换 API 层：

1. 保留 `/api/mock-scan` 的输入结构，或新增 `/api/scan`。
2. 把 `scan-provider.ts` 里的 `runScan()` 替换为真实扫描调用。
3. 保留 URL guard、限流、错误响应格式。
4. 把真实扫描结果映射成现有 `SampleReport` 兼容结构。

当前代码已拆出扫描 provider：

```txt
src/app/api/mock-scan/scan-provider.ts
```

后续真实接入时优先替换 `runScan()`，不要重写页面和请求入口。

当前也已拆出真实报告 mapper：

```txt
src/app/api/mock-scan/report-mapper.ts
```

它负责把 `tracking-checker-prototype` 的原始 JSON 映射成页面报告结构。后续 Browserless / Playwright provider 应输出同类原始 JSON，再统一交给 mapper。

## 本地真实扫描模式

当前已经支持 `mode: "local"`，但默认关闭。

启用方式：

```bash
npm run dev:local-scan
```

默认关闭原因是成本和安全控制。公网部署不能默认开放本地真实扫描。

## 推荐真实扫描架构

### MVP 远程版

- Next.js 前端部署在 Vercel。
- 扫描接口调用 Browserless。
- 单次扫描控制在 15-30 秒内。
- 免费用户每天限制扫描次数。
- 扫描结果不长期保存，只返回即时报告。

优点：

- 上线快。
- 不需要自己维护浏览器环境。

风险：

- Browserless 配额和成本需要严控。
- 免费公开接口容易被刷。

### 后续稳定版

- 前端仍然用 Vercel。
- 扫描 worker 单独部署在 Fly.io / Railway / Render。
- Worker 内部运行 Playwright。
- 请求进入队列。
- 结果写入 KV / D1 / Postgres。
- 前端轮询扫描状态。

优点：

- 成本更可控。
- 扫描时长、并发和重试更容易管理。

风险：

- 运维复杂度提升。
- 需要健康检查、队列、日志和回滚。

## 必须保留的安全边界

- 只允许 `http` / `https`。
- 只允许 80 / 443 端口。
- 拒绝 localhost、内网 IP、`.local`。
- DNS 解析后仍要校验最终 IP。
- 跳转后的 final URL 也要重新校验。
- 每个 IP / 每个用户限流。
- 单次扫描超时。
- 禁止扫描过大页面和无限跳转页面。

## 成本保护

正式接入前必须实现：

- 每 IP 每分钟扫描限制。
- 每 IP 每天扫描限制。
- 全站每分钟扫描限制。
- 浏览器并发上限。
- 扫描队列。
- 超时自动终止。
- 缓存最近扫描结果。
- 失败请求不无限重试。

## 产品边界

不能承诺：

- tracking 一定正确。
- GA4 后台一定收到数据。
- 转化归因一定准确。
- server-side tagging 一定能被检测到。
- 登录后流程一定能测。

可以承诺：

- 检查公开页面中可见的 GA4 / GTM / Clarity 信号。
- 检查脚本和 collect 请求是否在本次浏览器会话中出现。
- 检查常见 consent 后信号变化。
- 把 warning 翻译成下一步排查动作。

## 下一步

在不买域名的前提下继续完成：

1. 更清晰的非技术用户事件选择方式。
2. pass / warning / fail 样本页。
3. Browserless token 的最小真实扫描验证。
4. 成本估算和限流策略复核。
