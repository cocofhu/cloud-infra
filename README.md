# cloud-infra

DeepSeek Harness 多云资源插件。在**对话工具卡片**里查询云厂商资源（与域名列表同一位置，不是独立控制台页）；在设置页配置各云 AccessKey。

已支持 [腾讯云 DNSPod](https://cloud.tencent.com/document/product/1427/56194) 域名与解析记录，以及 [腾讯云 CLS](https://cloud.tencent.com/document/product/614/56447) 日志主题查看与检索分析。架构按厂商 / 凭证 / 产品三层解耦。

## 功能

- 对话里查询域名，按控制台列表展示状态、套餐、记录数，可翻页
- 点击域名或「解析」配置解析记录：添加、修改、启停、删除（删除始终确认）
- 对话里查询 CLS **日志主题**（名称/ID、日志集、存储类型、保存时间、创建时间），点「检索分析」仍在同一张卡片内打开
- 对话一句话可直接检索指定主题的原始日志（CQL 语句模式；空语句查该时间窗全部日志）
- 卡片顶部可按官方地域分组切换（大陆/港澳台/海外/金融/特殊）。**只改当前对话卡片，不写设置页与覆盖文件**
- 设置页按厂商 schema 填写 AKSK，并可独立开关「腾讯云 CLS」模块；密钥只保存在本机
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

打开 **设置 → 插件 → 插件配置 → 云资源**，填写腾讯云 SecretId / SecretKey。

- 域名：CAM 需包含 DNSPod 读权限；改记录还需写权限
- CLS：CAM 需包含日志服务读权限（如 `DescribeTopics`、`DescribeLogsets`、`SearchLog`）。已有 AKSK 可直接复用，不必重填

然后可以直接对 Agent 说：

> 查一下 dnspod 域名

> 列出我的解析域名

> 查一下 CLS 主题

> 北京的 CLS 主题

> 检索 nginx-access 近 1 小时 status:500

> 还有吗

插件向 Agent 提供 `cloud_infra_query`。结果出现在对话里的工具卡片中：

- 域名：可翻页列表；点击域名或「解析」配置解析记录
- CLS：标题为「日志主题」；点「检索分析」在同一张卡片里打开语句模式 + 日志时间 + 原始日志。默认近 1 小时、空语句查全量
- 在卡片顶部改地域只作用于当前卡片，**不会改设置里的密钥或默认地域**（覆盖文件不增加 `clsRegion`）

`kind` 默认仍是 `domain`。查 CLS 时传 `kind=cls`；检索日志时再传 `topicId` 或主题名、`queryString`（CQL）、`range`（`15m` / `1h` / `4h` / `1d` / `today` / `yesterday`，默认 `1h`）。

## 配置

配置写入 `$DSH_HOME/cloud-infra.json`（默认 `~/.dsh/cloud-infra.json`），权限 0600。密钥不会出现在对话、工具正文或 `cordis.patch.yml` 中。

- **写操作免确认**：添加/修改/启停可跳过弹窗；删除始终二次确认
- 保存密钥时留空表示保持原值
- Region 不是腾讯云必填凭证。未指定地域时当次 CLS 请求默认广州（`ap-guangzhou`）
- 对话里切地域、改时间、检索**不会**触发 config 保存

## 如何加一个云厂商

同一种资源类型（例如再加一个云的域名）不改 `src/host.ts`、`src/client.js`、`src/core/query.ts`。

1. 新建 `src/providers/<id>/index.ts`：`registerProvider({ id, title, fields, color })`，并实现该云的签名/HTTP 客户端
2. 新建 `src/providers/<id>/products/domain.ts`：实现 `ResourceModule`，把该云 API 映射为统一的 `ResourceCard` / `DnsRecord`
3. 在 [`src/providers/index.ts`](src/providers/index.ts) 增加一行 `import './<id>/index.js'`

新产品类型（如 CLS）需要扩展工具参数、系统提示和对话卡片视图，可参考 [`src/providers/tencent/products/cls.ts`](src/providers/tencent/products/cls.ts)。

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
- **提示去设置页**：尚未填写该云的 AccessKey，或未启用对应厂商 / 模块
- **CAM 未授权**：给子账号授予 DNSPod 或 CLS 读权限后再查
- **当前地域没有主题**：卡片顶部换一个地域；不会改设置
- **主题名重名**：指定主题 ID 或日志集后再检索

## 许可证

[MIT](LICENSE)
