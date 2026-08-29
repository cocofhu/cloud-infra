# cloud-infra

DeepSeek Harness 多云资源插件。在对话中查询云厂商上的域名与云服务器，以对齐各产品控制台的列表展示；在设置页配置各云 AccessKey。

已实现 [腾讯云 DNSPod](https://cloud.tencent.com/document/product/1427/56194) 域名与解析记录，以及 [CVM](https://cloud.tencent.com.cn/document/product/213/16533) 与 [轻量应用服务器](https://cloud.tencent.com/document/product/1207/44574)。架构按厂商 / 凭证 / 产品三层解耦，后续加云不必改 Host 与查询核心。

## 功能

- 对话里查询域名，按控制台列表展示状态、套餐、记录数，可翻页
- 点击域名或「解析」配置解析记录：添加、修改、启停、删除（删除始终确认）
- 对话里查询云服务器：默认广州地域；多地域、云服务器/轻量用 Tab 切换。CVM 为密表 + 行内更多；轻量为卡片，可切列表。实例过多时按设置里的每页条数翻页
- 实例详情按官方分组展示；开机 / 关机 / 重启在行内更多与详情顶栏完成
- 设置页按厂商 schema 填写 AKSK，密钥只保存在本机。不新增地域或电源控件；新产品只出现在既有产品模块勾选
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

打开 **设置 → 插件 → 插件配置 → 云资源**，填写腾讯云 SecretId / SecretKey。CAM 需包含对应产品的读权限；改记录或开关机还需写权限。

- 域名：`QcloudDNSPodReadOnlyAccess`（或等价读权限）；改记录再加写权限
- 云服务器：`QcloudCVMReadOnlyAccess` / `QcloudCVMFullAccess`（电源操作需要写）
- 轻量：`QcloudLighthouseReadOnlyAccess` / `QcloudLighthouseFullAccess`

然后可以直接对 Agent 说：

> 查一下 dnspod 域名

> 列出我的解析域名

> 查一下我的服务器

> 列出 CVM

> 列出轻量应用服务器

> 还有吗

插件向 Agent 提供 `cloud_infra_query`。`kind` 可取 `domain`（缺省）、`lighthouse`、`cvm`、`auto`。查服务器时应使用 `cvm` / `lighthouse` / `auto`，不要只用 `domain`。

查询完成后对话中会显示可翻页列表（默认每页 12 条，与设置里的每页条数一致）：域名点「解析」配置记录；CVM / 轻量默认广州，点 Tab 看其他地域或产品。点实例 ID 看分组详情，或用行内更多开机 / 关机 / 重启。地域筛选只影响当次对话，不写入设置。

## 配置

配置写入 `$DSH_HOME/cloud-infra.json`（默认 `~/.dsh/cloud-infra.json`），权限 0600。密钥不会出现在对话、工具正文或 `cordis.patch.yml` 中。

- **写操作免确认**：添加/修改/启停以及开机/关机/重启可跳过弹窗；删除始终二次确认
- 保存密钥时留空表示保持原值
- 新模块出现在「产品模块」勾选列表，设置页不增加地域多选或电源按钮

## 如何加一个云厂商

不改 `src/host.ts`、`src/core/query.ts` 的厂商名分支（它们本来就不按厂商名切换）。

1. 新建 `src/providers/<id>/index.ts`：`registerProvider({ id, title, fields, color })`，并实现该云的签名/HTTP 客户端
2. 新建 `src/providers/<id>/products/<kind>.ts`：实现 `ResourceModule`，把该云 API 映射为统一的 `ResourceCard`
3. 在 [`src/providers/index.ts`](src/providers/index.ts) 增加一行 `import './<id>/index.js'`

设置表单会自动出现新厂商。若新产品需要独立控制台皮肤（例如密表 vs 卡片），在 `src/client.js` 按 **kind** 分支，不要按厂商名分支。可参考 [`src/providers/tencent/`](src/providers/tencent/) 与测试里注册的假厂商。

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
- **CAM 未授权**：给子账号授予 DNSPod / CVM / 轻量相关策略后再查。单个地域未授权时其余地域仍会列出
- **查服务器却只看到域名**：确认对话调用了 `kind=cvm` / `lighthouse` / `auto`，而不是缺省的 `domain`

## 许可证

[MIT](LICENSE)
