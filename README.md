# cloud-infra

DeepSeek Harness 多云资源插件。在对话中查询云厂商上的域名与 TKE 集群，以控制台风格的可翻页列表展示；在设置页配置各云 AccessKey。

已实现 [腾讯云 DNSPod](https://cloud.tencent.com/document/product/1427/56194) 域名与解析记录，以及 [腾讯云 TKE](https://cloud.tencent.com/document/product/457/31824) 控制台「集群」配置树。架构按厂商 / 凭证 / 产品三层解耦；Host / Query 不按厂商名分支。地域只在对话参数或资源 UI 会话中传递，不写回设置。

## 功能

- 对话里查询域名，按控制台列表展示状态、套餐、记录数，可翻页
- 点击域名或「解析」配置解析记录：添加、修改、启停、删除（删除始终确认）
- 对话里查询 TKE 集群（`kind=cluster` + 运行时 `region`），打开控制台风格集群列表
- TKE 列表：顶栏选地域，按名称 / 类型 / 状态 / VPC / 标签筛选；列含集群 ID/名称、状态、Kubernetes 版本、节点数、所在网络、创建时间
- 新建：类型卡（标准 / 弹性 / 边缘 / 注册）。标准集群四步向导（信息 → 网络含 GR 常用上限 → 组件可跳 → 确认+SLA）。边缘走独立网络步（VPC/Pod/Service CIDR）。注册集群走导入配置（DescribeExternalClusterSpec），不调用 CreateCluster。弹性新建入口关闭，引导标准集群 + 超级节点；独立集群不新建
- 删除向导：第一步可关闭删除保护，有普通/原生/超级节点则拒绝，再选资源保留或销毁并勾选风险
- 详情侧栏：基本信息（含 Master/Node 升级表单、APIServer 内外网分开关、删除保护）、节点（封锁用 K8s 节点名、新建需机型/镜像/安全组/子网）、节点池名片（含计费；普通/原生/超级分接口）、命名空间配额、组件（InstallAddon）、授权（K8s ClusterRoleBinding）、策略（DescribeOpenPolicyList/ModifyOpenPolicyList）、运维开关（DescribeLogSwitches ClusterIds/SwitchSet）
- kubeconfig 只在 APIServer 区块的受信 UI 复制或下载，不进对话
- 设置页按厂商 schema 填写 AKSK，并开关 `tencent.tke`；无必填地域字段
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

打开 **设置 → 插件 → 插件配置 → 云资源**，填写腾讯云 SecretId / SecretKey。不要在设置里填地域。

CAM：

- 域名：DNSPod 读权限；改记录还需写权限
- TKE：容器服务读写（集群、节点、节点池、组件、授权、策略、审计开关等对应接口）

然后可以直接对 Agent 说：

> 查一下 dnspod 域名

> 列出我的解析域名

> 查一下广州的 TKE 集群

> 还有吗

插件向 Agent 提供 `cloud_infra_query`。查域名用 `kind=domain`；查 TKE 用 `kind=cluster` 并传入运行时 `region`（如 `ap-guangzhou`）。查询、切地域、写操作都不会改 `cloud-infra.json`。

控制台路径对照：

1. 列表顶栏选地域 → 筛选 → 点集群 ID
2. 新建 → 类型卡 → 标准四步（确认页勾 SLA）
3. 更多 → 关闭删除保护 → 删除向导（清节点 → 资源保留 → 风险勾选）
4. 详情左侧：基本信息 / 节点 / 节点池 / 命名空间 / 组件 / 授权 / 策略 / 运维功能

不做：工作负荷、运维中心、Cloud Shell、CLS 大盘、对话输出 kubeconfig。

## 配置

配置写入 `$DSH_HOME/cloud-infra.json`（默认 `~/.dsh/cloud-infra.json`），权限 0600。密钥不会出现在对话、工具正文或 `cordis.patch.yml` 中。

- **写操作免确认**：添加/修改/启停可跳过弹窗；删除始终二次确认
- 保存密钥时留空表示保持原值

## 如何加一个云厂商

Host / Query 仍不按厂商名分支。新增厂商：

1. 新建 `src/providers/<id>/index.ts`：`registerProvider({ id, title, fields, color })`，并实现该云的签名/HTTP 客户端
2. 新建 `src/providers/<id>/products/<kind>.ts`：实现 `ResourceModule`，把该云 API 映射为统一的 `ResourceCard` / 详情分区
3. 在 [`src/providers/index.ts`](src/providers/index.ts) 增加一行 `import './<id>/index.js'`

新增产品 kind（如 `cluster`）时，可在客户端增加独立视图（TKE 使用 `ClusterConsole`，不要复用域名 `DetailView`）。运行时 `region` 经 query/detail/action 透传，禁止为此改设置 schema。

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
- **CAM 未授权**：给子账号授予 DNSPod 或 TKE 相关策略后再查
- **未选地域**：TKE 列表不会暗默写设置，也不会按默认地域拉数据
- **凭证进对话**：kubeconfig 只出现在集群详情 APIServer 区块，请勿让 Agent 复述

## 许可证

[MIT](LICENSE)
