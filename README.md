# cloud-infra

DeepSeek Harness 多云资源插件。在对话中查询云厂商上的域名、解析记录与 DBbrain 诊断，以控制台风格的可翻页卡片展示；在设置页配置各云 AccessKey。

已实现 [腾讯云 DNSPod](https://cloud.tencent.com/document/product/1427/56194) 域名与解析记录，以及 [腾讯云 DBbrain](https://cloud.tencent.com/document/product/1130/39054) 实例管理 / 诊断优化。架构按厂商 / 凭证 / 产品三层解耦。结果出现在**当前这轮对话的工具卡片**里，不是独立控制台整页。

## 功能

- 对话里查询域名，按控制台列表展示状态、套餐、记录数，可翻页
- 点击域名或「解析」配置解析记录：添加、修改、启停、删除（删除始终确认）
- 对话里查询 DBbrain：卡片顶栏选数据库类型与地域（默认全地域），点「诊断优化」在同一张卡片里看诊断。页多时按诊断/性能/会话/空间/治理分组，切换时显示加载中
- 列表请求公共 Region 按官方用广州；实例级诊断用该行实例自己的地域。缺地域会明文拒绝，不会暗默广州
- 设置页按厂商 schema 填写 AKSK，密钥只保存在本机。**没有地域设置项**，切类型/地域/Kill 都不会改插件设置
- 预留阿里云凭证字段，产品模块尚未实现

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

打开 **设置 → 插件 → 插件配置 → 云资源**，填写腾讯云 SecretId / SecretKey。CAM 需包含 DNSPod / DBbrain 读权限；改记录或 Kill 还需写权限。不要在设置里填地域。

然后可以直接对 Agent 说：

> 查一下 dnspod 域名

> 列出我的解析域名

> 查一下 dbbrain，看看我的库

> 帮我看一下慢 SQL

> 还有吗

插件向 Agent 提供 `cloud_infra_query`。查询完成后对话中会显示可翻页列表：

- 域名：点击域名或「解析」配置解析记录
- DBbrain：`kind=dbbrain`，点击实例名 / 告警 /「诊断优化」进入异常诊断；有健康报告页的产品线可点健康分进入健康报告，Redis / MongoDB 没有该页则不跳转。筛选和详情都留在这张对话卡片里
- Kill 会话：仅 MySQL / TDSQL-C 支持按会话 ID 两阶段 `Prepare(Threads)` → `Commit(SqlExecId)`。MariaDB / TDSQL / 自建 MySQL 不展示行上 Kill。MongoDB 在卡片内「创建中断任务」（`Duration` 必填，`Time`/`Host`/`Type` 可选），不按 sessionId 杀，可能同时中断多条会话。生成健康报告不发送邮件（`SendMailFlag=0`）

地域约定：

- 卡片筛选默认「全地域」，也可只看上海等单地域（对应列表接口 `Regions.N`）
- 列表接口公共 Region 固定广州（`ap-guangzhou`）
- 点进某实例后，后续诊断 / 慢 SQL / Kill 使用该实例返回的 Region，例如广州列表里的上海实例会按 `ap-shanghai` 请求

## 配置

配置写入 `$DSH_HOME/cloud-infra.json`（默认 `~/.dsh/cloud-infra.json`），权限 0600。密钥不会出现在对话、工具正文或 `cordis.patch.yml` 中。

- **写操作免确认**：添加/修改/启停可跳过弹窗；删除与 Kill 始终二次确认
- 保存密钥时留空表示保持原值
- 对话卡片操作不调用设置保存，overlay 不会被 DBbrain 动作改写

## 如何加一个云厂商

不改 `src/host.ts`、`src/client.js`、`src/core/query.ts`。

1. 新建 `src/providers/<id>/index.ts`：`registerProvider({ id, title, fields, color })`，并实现该云的签名/HTTP 客户端
2. 新建 `src/providers/<id>/products/domain.ts`：实现 `ResourceModule`，把该云 API 映射为统一的 `ResourceCard` / `DnsRecord`
3. 在 [`src/providers/index.ts`](src/providers/index.ts) 增加一行 `import './<id>/index.js'`

设置表单和对话列表会自动出现新厂商。可参考 [`src/providers/tencent/`](src/providers/tencent/) 与测试里注册的假厂商。同一厂商加新产品（如 DBbrain）时，可扩展对话卡片对 `kind` 的展示，仍不要按厂商名在 Host 里分支。

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
- **CAM 未授权**：给子账号授予 DNSPod / DBbrain 相关策略后再查
- **缺少实例地域**：卡片会提示无法诊断，请从带地域的列表行进入，不要假设广州

## 许可证

[MIT](LICENSE)
