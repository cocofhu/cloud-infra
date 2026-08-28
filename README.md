# cloud-infra

DeepSeek Harness 多云资源插件。在对话中查询云厂商上的域名、证书等资源，以控制台风格的可翻页列表展示；在设置页配置各云 AccessKey。

已实现 [腾讯云 DNSPod](https://cloud.tencent.com/document/product/1427/56194) 域名解析，以及 [腾讯云 SSL「我的证书」](https://cloud.tencent.com/document/product/400/55741)（列表、完整详情、申请/上传/部署/下载/更多）。架构按厂商 / 凭证 / 产品三层解耦。

## 功能

- 对话里查询域名，按控制台列表展示状态、套餐、记录数，可翻页
- 点击域名或「解析」配置解析记录：添加、修改、启停、删除（删除始终确认）
- 对话里查询证书（`kind=cert`）：复刻「我的证书」表，点击证书 ID / 绑定域名看完整分块详情
- 顶栏申请免费证书、上传证书；行内部署（勾选匹配实例）、下载、更多（吊销/重颁发/删除）
- 设置页按厂商 schema 填写 AKSK，密钥只保存在本机；证书操作不改设置
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

打开 **设置 → 插件 → 插件配置 → 云资源**，填写腾讯云 SecretId / SecretKey。CAM 需包含 DNSPod / SSL 读权限；写操作还需对应写权限。已有腾讯云凭证即可用证书，不必再改设置。

然后可以直接对 Agent 说：

> 查一下 dnspod 域名

> 列出我的解析域名

> 查一下腾讯云证书

> 还有吗

插件向 Agent 提供 `cloud_infra_query`。查域名默认 `kind=domain`；**查证书必须传 `kind=cert`**。查询完成后对话中会显示可翻页列表：域名点「解析」，证书点证书 ID 或绑定域名查看完整详情。不要打印密钥或 PEM。

## 配置

配置写入 `$DSH_HOME/cloud-infra.json`（默认 `~/.dsh/cloud-infra.json`），权限 0600。密钥不会出现在对话、工具正文或 `cordis.patch.yml` 中。

- **写操作免确认**：添加/修改/启停可跳过弹窗；删除始终二次确认
- 保存密钥时留空表示保持原值

## 如何加一个云厂商

不改 `src/host.ts`、`src/client.js`、`src/core/query.ts`。

1. 新建 `src/providers/<id>/index.ts`：`registerProvider({ id, title, fields, color })`，并实现该云的签名/HTTP 客户端
2. 新建 `src/providers/<id>/products/domain.ts`：实现 `ResourceModule`，把该云 API 映射为统一的 `ResourceCard` / `DnsRecord`
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
- **CAM 未授权**：给子账号授予 DNSPod 相关策略后再查

## 许可证

[MIT](LICENSE)
