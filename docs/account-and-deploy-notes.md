# Tracking Preflight 账号与部署记录

更新时间：2026-06-02

## 域名

已购买：

```txt
trackingpreflight.com
```

## Vercel

项目：

```txt
007_tracking-install-checker
```

Vercel Project ID：

```txt
prj_2zjI3xsGw2vkHBUSN4PsD006UseT
```

Vercel Org ID：

```txt
team_xLsaI5cafTwyIT4s9Ro1wHJy
```

生产部署：

```txt
dpl_2Wkqx921SdCTGHgiJ9Bwkz78Yik1
```

临时生产 URL：

```txt
https://007tracking-install-checker-elhpx66b5-xuyifei-s-projects.vercel.app
```

Vercel 已添加域名：

```txt
trackingpreflight.com
www.trackingpreflight.com
```

当前状态：

已完成生产部署、Vercel 域名绑定、Cloudflare DNS 托管、HTTPS 访问验证。

已验证：

```txt
https://www.trackingpreflight.com              200 OK
https://trackingpreflight.com                  308 -> https://www.trackingpreflight.com/
https://www.trackingpreflight.com/sitemap.xml  200 OK
https://www.trackingpreflight.com/robots.txt   200 OK
https://www.trackingpreflight.com/api/health   ok, production, localScanEnabled=false
```

说明：

- Vercel `domains inspect` 仍会提示 nameserver 不是 Vercel DNS，这是正常的。
- 本项目采用 Cloudflare 托管 DNS，Vercel 只负责项目部署和域名绑定。
- 实际访问和 HTTPS 已通过 `curl` 验证，以访问结果为准。

## Cloudflare

Cloudflare CLI：

```txt
npm exec wrangler
```

已登录账号：

```txt
1254519010@qq.com
```

Cloudflare Account ID：

```txt
3af9ba19942d106770354735e2fb4a98
```

说明：

- 不记录密码、验证码、长期 token。
- 当前 wrangler OAuth 可读账号和部分资源，但不适合直接添加 Zone / DNS。
- 添加域名到 Cloudflare 仍建议走网页控制台。

## 当前 DNS 状态

当前 nameserver 已切换到 Cloudflare：

```txt
everton.ns.cloudflare.com
mona.ns.cloudflare.com
```

Vercel / Cloudflare 当前解析：

```txt
A trackingpreflight.com 216.198.79.65
A trackingpreflight.com 64.29.17.65
CNAME www.trackingpreflight.com 9c9f4979b6a01685.vercel-dns-017.com
```

这一步不是完全自动完成，而是由用户在 Vercel 网页里点击授权/确认后，Vercel 通过授权写入 Cloudflare DNS。后续同类站点优先使用这个流程：

1. Vercel CLI 添加根域和 `www` 域名。
2. 用户在 Vercel 网页里点击 Cloudflare DNS 授权/确认。
3. Codex 用 `nslookup` 和 `curl` 验证最终访问。

## 后续待完成

GA4 / Clarity：

```txt
NEXT_PUBLIC_GA_ID=G-HQRDFB0FC4
NEXT_PUBLIC_CLARITY_ID=x0rk21q9w5
```

已用 Vercel CLI 写入生产环境变量，并重新部署。

已验证线上 HTML：

```txt
googletagmanager.com/gtag/js?id=G-HQRDFB0FC4
gtag('config', 'G-HQRDFB0FC4')
clarity.ms/tag/x0rk21q9w5
```

Cloudflare Email Routing：

```txt
support@trackingpreflight.com -> xyf1254519010@gmail.com
```

已完成：

```txt
Email Routing: enabled, ready
Rule ID: b96e7d75999e4b31a9f83b1e8094630e
Rule: support@trackingpreflight.com -> xyf1254519010@gmail.com
Catch-all: disabled, action drop
```

已验证：

```txt
MX trackingpreflight.com -> route1/route2/route3.mx.cloudflare.net
TXT trackingpreflight.com -> v=spf1 include:_spf.mx.cloudflare.net ~all
```

搜索收录：

- Google Search Console 提交 `https://www.trackingpreflight.com/sitemap.xml`。
- Google Search Console 请求首页编入索引 `https://www.trackingpreflight.com/`。
- Bing Webmaster 提交 `https://www.trackingpreflight.com/sitemap.xml`。
