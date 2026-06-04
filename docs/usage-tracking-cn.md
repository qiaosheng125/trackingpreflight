# Tracking Preflight 使用记录方案

更新时间：2026-06-03

## 当前策略

第七站暂时没有账号系统，所以不能知道用户真实身份。

当前采用匿名使用信号：

- GA4 事件。
- Clarity 录屏/热力图。
- API 限流状态。

不记录：

- 用户姓名。
- 邮箱。
- 原始 IP。
- 登录身份。

## 已埋 GA4 事件

### demo_view

用户点击 demo 报告按钮。

参数：

```txt
demo_type=clean_install | warning
```

用途：

- 判断用户是否理解/点击 demo。
- 判断哪个 demo 更有吸引力。

### report_copy

用户复制报告摘要。

参数：

```txt
report_status=pass | warning | fail
report_type=demo | real
```

用途：

- 判断报告是否有“拿走价值”。

### report_download

用户下载 JSON 报告。

参数：

```txt
report_status=pass | warning | fail
report_type=demo | real
```

用途：

- 判断用户是否愿意保存报告。

### scan_blocked

用户尝试真实扫描但当前环境未开启。

参数：

```txt
scan_mode=local | remote
reason=local_disabled | remote_disabled
```

用途：

- 判断是否有人想用真实扫描。
- 如果这个事件变多，说明需要考虑开启 remote。

### scan_submit

用户提交真实扫描。

参数：

```txt
scan_mode=local | remote
host=<hostname>
auto_consent=true | false
```

用途：

- 判断真实扫描被提交了多少次。
- 看用户扫描哪些域名类型。

### scan_success

真实扫描成功返回。

参数：

```txt
scan_mode=local | remote
host=<hostname>
report_status=pass | warning | fail
```

用途：

- 判断扫描成功率。
- 判断报告结果分布。

### scan_error

真实扫描失败。

参数：

```txt
scan_mode=local | remote
host=<hostname>
```

用途：

- 判断真实扫描是否稳定。

## 怎么判断有没有人用

在 GA4 里重点看：

- `demo_view` 是否有量。
- `report_copy` 是否有量。
- `report_download` 是否有量。
- `scan_blocked` 是否出现。

如果出现这些信号：

```txt
demo_view 有量，但 report_copy / report_download 没量
```

说明用户看了但没觉得报告有用。

如果出现：

```txt
scan_blocked 有量
```

说明有人想真实扫描，这时可以考虑开启 remote 小流量测试。

如果开启 remote 后：

```txt
scan_submit > 0
scan_success / scan_submit 比例高
report_copy 或 report_download 有量
```

说明工具开始有真实价值。

## 后续增强

有真实使用后，再考虑 D1 / KV 存匿名扫描日志：

- 时间。
- 域名 host。
- report status。
- 是否命中缓存。
- 是否限流。
- 扫描耗时。

仍然不建议在无账号阶段记录原始 IP。

