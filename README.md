# cloud-infra

DeepSeek Harness 多云资源插件。在对话中查询云厂商上的域名与腾讯云云拨测，以控制台风格的可翻页列表展示；在设置页配置各云 AccessKey。

已实现 [腾讯云 DNSPod](https://cloud.tencent.com/document/product/1427/56194) 域名与解析记录，以及 [可观测平台云拨测](https://cloud.tencent.com/document/product/280) 控制台四块：任务列表、即时拨测、多维分析、告警配置。架构按厂商 / 凭证 / 产品三层解耦，后续加云不必改 Host 与 Client。

## 功能

- 对话里查询域名，按控制台列表展示状态、套餐、记录数，可翻页
- 点击域名或「解析」配置解析记录：添加、修改、启停、删除（删除始终确认）
- 对话里查询云拨测，对齐控制台左侧四块，不新做整站框架
- 设置页按厂商 schema 填写 AKSK，密钥只保存在本机
- 预留阿里云凭证字段，产品模块尚未实现

## 云拨测（对照控制台）

对话走现有列表 / 详情 / 表单 / 确认。设置页与 `Config` schema **不改**；任意对话操作只打云 API，不写插件 overlay。

| 控制台菜单 | 对话入口 | 能力 |
| --- | --- | --- |
| 任务列表 | `kind=cat`，例如「查云拨测」 | 列：任务名称、状态、任务类型、拨测地址、拨测频率、拨测点；新建、配置、暂停、恢复、删除、批量暂停 |
| 新建 / 编辑 | 任务「配置」或「新建任务」 | 三块：基本信息、拨测点、拨测参数；自定义 / 快速拨测；六类任务按控制台同名项展开 |
| 即时拨测 | `kind=cat.instant` | 网络质量、页面性能、端口、文件下载、whois；开始测试、历史诊断（按量计费，不接支付） |
| 多维分析 | 任务详情内「多维分析」 | 可用性 / 时延 / 错误、地区与运营商、单次日志、多任务对比摘要；无数据时可读说明 |
| 告警配置 | `kind=cat.alarm` 或任务详情内告警分区 | 策略列表、按任务与指标新建、告警历史；未开通时提示，不改设置 |

拨测频率：1 / 5 / 10 / 15 / 30 分钟或 1 / 2 / 4 小时。拨测点类型：IDC / LastMile / 移动端；节点名解析失败回退编码。删除与批量暂停始终二次确认。

## 环境要求

- Node.js 22 或更高版本
- DeepSeek Harness Web

## 安装

本地开发：

```sh
dsh plugin --profile web add /absolute/path/to/cloud-infra
```

安装后重启 `dsh web`，并强制刷新浏览器。

## 使用

打开 **设置 → 插件 → 插件配置 → 云资源**，填写腾讯云 SecretId / SecretKey。已填腾讯云 AK 即可用域名与云拨测，不必再勾新模块或另填密钥。

然后可以直接对 Agent 说：

> 查一下 dnspod 域名

> 列出我的解析域名

> 查云拨测 / 列出拨测任务

> 做一次即时拨测

> 查看拨测告警

> 还有吗

插件向 Agent 提供 `cloud_infra_query`。`kind=domain` 查域名；`kind=cat` 任务列表；`kind=cat.instant` 即时拨测；`kind=cat.alarm` 告警。查询完成后对话中会显示可翻页列表。

## 权限（CAM）

给子账号按需授予：

- **读**：云拨测 `DescribeProbeTasks`、`DescribeNodes`、`DescribeInstantTasks`
- **写**：`CreateProbeTasks`、`UpdateProbeTaskConfigurationList`、`UpdateProbeTaskAttributes`、`SuspendProbeTask`、`ResumeProbeTask`、`DeleteProbeTask`
- **分析**：`DescribeProbeMetricData`、`DescribeProbeMetricTagValues`、`DescribeDetailedSingleProbeData`
- **告警**：可观测平台 `DescribeAlarmPolicies`、`CreateAlarmPolicy`、`DescribeAlarmHistories`

缺某类权限时只提示缺哪一类，不输出堆栈或密钥。告警产品未开通时给出可读说明。

## 配置

配置写入 `$DSH_HOME/cloud-infra.json`（默认 `~/.dsh/cloud-infra.json`），权限 0600。密钥不会出现在对话、工具正文或 `cordis.patch.yml` 中。

- **写操作免确认**：添加/修改/启停可跳过弹窗；删除与批量暂停始终二次确认
- 保存密钥时留空表示保持原值
- 对话路径禁止 `config save`，不会改模块开关、免确认、AK 或每页条数

## 如何加一个云厂商

不改 `src/host.ts`、`src/client.js`、`src/core/query.ts`。

1. 新建 `src/providers/<id>/index.ts`：`registerProvider({ id, title, fields, color })`，并实现该云的签名/HTTP 客户端
2. 新建 `src/providers/<id>/products/domain.ts` 或同类产品模块：实现 `ResourceModule`，把该云 API 映射为统一的 `ResourceCard`
3. 在 [`src/providers/index.ts`](src/providers/index.ts) 增加一行 `import './<id>/index.js'`

设置表单和对话列表会自动出现新厂商。可参考 [`src/providers/tencent/`](src/providers/tencent/) 与测试里注册的假厂商。

## 开发

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
```

源码位于 `src/`，构建结果输出到 `lib/`。`lib/` 不提交。

## 故障排查

- **loader 报 `requires options.key`**：客户端必须用 `key: "cloud-infra"` 注册设置卡，Host 还需 `settings.register('cloud-infra', …)`
- **提示去设置页**：尚未填写该云的 AccessKey，或未启用对应厂商
- **CAM 未授权**：给子账号授予 DNSPod 或云拨测对应读/写/分析/告警策略后再查
- **告警未开通**：先在可观测平台开通拨测告警，插件不会改设置页

## 许可证

[MIT](LICENSE)
