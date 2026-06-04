# Tracking Preflight 收款与真实扫描决策

更新时间：2026-06-03

## 当前结论

第七站当前不接支付，也不对公网开放真实扫描。

现在的产品阶段是验证：

- 是否有人访问；
- 是否有人看 demo 报告；
- 是否有人复制或下载报告；
- 是否有人尝试真实扫描；
- 是否有人通过 `support@trackingpreflight.com` 反馈需求。

在这些信号出现前，不应该急着做会员、登录、收款和高成本扫描。

## 真实扫描什么时候开启

真实扫描不是“上线后马上开启”，而是满足下面任一条件后再开启小流量测试：

- GA4 里 `scan_blocked` 连续 3 天有记录；
- 有用户邮件反馈需要检测自己的网站；
- Clarity 里看到用户反复尝试输入 URL 或寻找扫描入口；
- 每天自然访问稳定超过 30-50，且报告复制/下载事件有真实行为；
- 我们准备好 Browserless token 或自托管 Playwright worker，并确认成本上限。

第一次开启只做灰度：

- 每天免费 3 次；
- 每次 20-30 秒超时；
- 相同 URL 缓存 10-30 分钟；
- 不做历史报告；
- 不做复杂点击流程；
- 不开放批量扫描；
- remote 开关手动开启，观察后再决定是否长期开放。

## 为什么现在不开

真实扫描会带来三类风险：

- 成本风险：浏览器扫描比普通页面请求贵，可能消耗 Browserless、Vercel 或自托管 worker 资源。
- 滥用风险：匿名用户可以反复扫无关 URL，甚至把网站当成探测器。
- 产品风险：如果还没有人明确需要真实扫描，提前接复杂系统会拖慢第八站和后续选题。

所以当前策略是：先记录需求信号，再开放真实能力。

## 当前如何判断有没有人用

已经接入 GA4 和 Clarity。

GA4 事件：

- `demo_view`：有人查看示例报告；
- `report_copy`：有人复制报告；
- `report_download`：有人下载报告；
- `request_live_scan`：有人点击申请真实扫描入口；
- `scan_blocked`：有人尝试真实扫描，但线上开关关闭；
- `scan_submit`：真实扫描提交；
- `scan_success`：真实扫描成功；
- `scan_error`：真实扫描失败。

当前最重要的是 `request_live_scan` 和 `scan_blocked`。

- `request_live_scan` 出现，说明用户接受 limited beta 的事实，仍然愿意主动申请。
- `scan_blocked` 出现，说明用户不是只看页面，而是想用真实扫描功能。

只看 `page_view`、`session_start`、`first_visit` 不足以判断用户想用，只能说明有人访问。

## 2026-06-03 页面策略调整

用户指出：如果别人看到工具不能用，下次可能不会回来。这个判断成立。

因此首页改为明确的 limited beta 逻辑：

- 不伪装成完整可用的真实扫描器；
- 明确写明当前公共页面只展示 sample reports；
- 明确写明 live browser scan 处于 limited beta；
- 提供 `Request live scan access` 按钮；
- 按钮通过 `mailto:support@trackingpreflight.com` 收集真实扫描需求；
- 点击按钮记录 GA4 事件 `request_live_scan`。

这可以避免用户误解，也能把真实需求从普通访问里区分出来。

## Creem 评估

Creem 可以作为后续收款候选，但当前不接。

适合点：

- 面向独立开发者和 SaaS；
- 支持订阅和一次性付款；
- Merchant of Record 模式可以减少 VAT/GST/销售税处理复杂度；
- 比 Stripe 直接接入更适合个人早期出海 SaaS。

不适合现在立刻接的原因：

- 当前还没有验证用户愿意为扫描额度付费；
- 低客单价会被固定交易费吃掉利润；
- 接支付会要求补全更多合规页面和售后流程；
- 一旦订阅用户在某个支付平台上，后续迁移会有成本；
- Creem 相比 Stripe/Paddle 仍属于较新的方案，需要观察稳定性和风控。

## 未来收款触发条件

只有满足下面条件之一，才考虑接 Creem 或其他支付：

- 每天有 50 次以上 `scan_blocked`；
- 有用户主动邮件询问更多额度；
- 真实扫描开启后免费额度被稳定用完；
- 扫描成本开始明显，需要用付费限制滥用；
- 出现明确 B2B 用户，例如站长、营销人员、独立开发者、电商运营。

## 暂定套餐思路

先不做会员系统。等验证后再考虑：

- Free：每天 3 次真实扫描；
- Pro：每月 9 或 19 美元；
- Pro 权益：更多扫描次数、真实扫描、导出报告、批量 URL、优先队列。

在付款前，先做等待名单或额度申请表，收集邮箱和需求。

## 当前执行策略

- 真实扫描已经接入 Browserless，并可在线上工作；
- 不接支付；
- 不做登录；
- 继续用 GA4 + Clarity 看用户行为；
- 真实扫描只做小流量灰度，不开放批量和历史报告；
- 有付费意愿后，再评估 Creem。

## 2026-06-03 Browserless 接入记录

已完成：

- Browserless 免费额度账户已创建；
- Vercel production 已配置：
  - `ENABLE_REMOTE_TRACKING_SCAN=1`
  - `BROWSERLESS_TOKEN`
  - `BROWSERLESS_REGION=sfo`
  - `BROWSERLESS_BROWSER=chromium`
- 已修复 Vercel 生产环境找不到扫描脚本依赖的问题；
- 已修复 Vercel serverless 不能写 `.cache` 的问题，生产缓存改写到 `/tmp/tracking-checker-cache`；
- 已修复 demo 文案里的 GA4 示例 ID 被误判为真实安装 ID 的问题；
- 已显式绑定最新部署到 `www.trackingpreflight.com`。

最终线上验证：

- `GET https://www.trackingpreflight.com/api/health`
  - `remoteScanEnabled=true`
  - `remoteScanConfigured=true`
  - `modes.remote=true`
- `POST https://www.trackingpreflight.com/api/scan` 使用 `mode=remote` 扫描本站成功；
- 扫描结果：
  - `status=pass`
  - `scripts=2`
  - `collects=4`
  - `failed=0`

当前边界：

- 每 IP 每日 3 次；
- 每分钟 3 次；
- 全站并发 2；
- 单次扫描 30 秒超时；
- 相同 URL 缓存 30 分钟；
- 不做批量扫描；
- 不做历史报告；
- 后续是否扩大开放，看 `request_live_scan`、`scan_submit`、`scan_success`、`scan_error` 和 Browserless units 消耗。
