# Tracking Preflight 域名购买信息包

更新时间：2026-06-02

## 购买结论

可以购买验证型域名。

推荐购买：

```txt
trackingpreflight.com
```

## 推荐理由

- 比 `trackinginstallchecker.com` 更短。
- “Preflight” 表达上线前检查，比 “Install Checker” 更像产品。
- 不局限 GA4，也能扩展到 GTM、Clarity、Ads pixels、future diagnostics。
- 和当前产品定位一致：公开页面 tracking preflight report。

## DNS 初筛

已用 `nslookup` 做基础 DNS 检查：

- `trackingpreflight.com`：未发现 DNS 解析记录。
- `tagpreflight.com`：未发现 DNS 解析记录。
- `trackinginstallchecker.com`：未发现 DNS 解析记录。
- `tagfiringchecker.com`：未发现 DNS 解析记录。
- `analyticspreflight.com`：未发现 DNS 解析记录。

说明：

DNS 不存在不等于一定可购买，最终以阿里云购买页为准。

## 买完域名后给我的信息

只需要告诉我：

```txt
trackingpreflight.com 已购买
```

然后我会继续处理：

- Vercel domain
- Cloudflare DNS
- SSL 状态检查
- Sitemap
- 首页请求编入索引
- GA4 / Clarity 代码接入
- support@ 邮箱路由
- SOP 记录

## 站点信息

站点名称：Tracking Preflight

主域名：`trackingpreflight.com`

Canonical URL：`https://www.trackingpreflight.com`

首页 URL：`https://www.trackingpreflight.com/`

Sitemap URL：`https://www.trackingpreflight.com/sitemap.xml`

反馈邮箱：`support@trackingpreflight.com`

## GA4

GA4 媒体资源名称：

```txt
Tracking Preflight - trackingpreflight.com
```

GA4 数据流名称：

```txt
Tracking Preflight - www.trackingpreflight.com
```

协议：

```txt
https://
```

网站网址：

```txt
www.trackingpreflight.com
```

环境变量预留：

```txt
NEXT_PUBLIC_GA_ID=
```

## Clarity

Clarity 项目名：

```txt
Tracking Preflight - trackingpreflight.com
```

Clarity 网站 URL：

```txt
https://www.trackingpreflight.com
```

环境变量预留：

```txt
NEXT_PUBLIC_CLARITY_ID=
```

## 首版上线边界

第一版上线后：

- 可以开放 mock / fixture / health。
- 不默认开放真实扫描。
- local scan 只用于本机验证。
- Browserless / worker 成本验证完成后，再决定是否开放真实扫描。

## 代码侧已准备

已完成：

- `site.ts` 站点常量。
- `robots.ts`。
- `sitemap.ts`。
- GA4 / Clarity 环境变量注入。
- `.env.example`。
- `GET /api/health`。
- `POST /api/mock-scan`。
- `mock` / `fixture` / `local` scan mode。

已验证：

- `npm run test:api`
- `npm run test:mapper`
- `npm run smoke`
- `npm run build`
- `npm run test:running-api`

构建路由已包含：

- `/`
- `/api/health`
- `/api/mock-scan`
- `/robots.txt`
- `/sitemap.xml`
- `/samples`
- `/samples/pass`
- `/samples/warning`
- `/samples/fail`
