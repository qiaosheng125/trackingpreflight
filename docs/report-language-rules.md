# 报告解释文案规则

更新时间：2026-06-02

Tracking Install Checker 的核心不是“检测到 ID”，而是把检测结果翻译成可执行判断。后续真实扫描接入后，报告文案必须遵守以下规则。

## 每条发现必须包含三层含义

1. Evidence：本次浏览器会话实际观察到了什么。
2. Risk：这件事可能意味着什么风险，但不能过度断言。
3. Next action：用户下一步应该去哪里查。

## 禁止使用的表达

- “tracking 安装正确”
- “GA4 一定收到数据”
- “转化一定正常”
- “没有检测到就说明没装”
- “这是 Google Analytics 的问题”

## 推荐表达

- “本次浏览器会话观察到 GA4 collect 请求。”
- “这说明公开页面至少发出了一个可见 GA4 信号。”
- “仍需在 GA4 Realtime / DebugView 中确认后台是否收到。”
- “未观察到 collect 请求，不等于一定没安装，可能被 consent、地区策略或条件加载阻止。”
- “下一步建议打开 GTM Preview 查看容器是否加载和标签是否触发。”

## Pass 文案模板

```txt
Visible tracking signals were observed in this browser session.
Keep this report as a deploy baseline, then confirm business metrics in the native analytics dashboard.
```

使用场景：

- 有 GA4 / Clarity collect。
- 没有明显失败请求。
- 没有重复安装 warning。

注意：

- Pass 只能表示“本次浏览器会话有可见信号”。
- 不能表示业务归因、广告转化、后台报表一定正确。

## Warning 文案模板

```txt
Partial tracking evidence was found, but this scan needs review.
Check consent, GTM Preview, regional loading, or the selected event before changing code.
```

使用场景：

- 有 ID 但没有脚本请求。
- 有脚本但没有 collect。
- 有 collect 但有失败请求。
- 有重复 ID / 重复脚本。
- consent 前后结果不同。

## Fail 文案模板

```txt
No supported browser-side tracking signal was visible in this scan.
Confirm whether this page is supposed to use GA4, GTM, UA, or Clarity before treating it as broken.
```

使用场景：

- 没有 GA4 / GTM / UA / Clarity ID。
- 没有相关脚本和 collect 请求。
- 页面最终跳转到不可扫描状态。

## 报告顺序

1. Status
2. Decision for this scan
3. Detected tools
4. Request evidence
5. Consent result
6. Findings
7. Recommended next steps
8. What this checks
9. What this cannot prove

## 面向非技术用户的原则

- 先说结论，再说证据。
- 不要求用户先懂 Network。
- 不把 warning 写成错误。
- 不把 fail 写成一定坏了。
- 每个 warning 至少给一个可以执行的下一步。
