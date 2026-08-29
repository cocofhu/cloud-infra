# cloud-infra

DeepSeek Harness 多云资源插件。在对话中查询云厂商上的域名与对象存储，以控制台风格的可翻页列表展示；在设置页配置各云 AccessKey。

已实现 [腾讯云 DNSPod](https://cloud.tencent.com/document/product/1427/56194) 域名与解析记录，以及 [腾讯云 COS](https://cloud.tencent.com/document/product/436/8291) 存储桶列表与文件列表。架构按厂商 / 凭证 / 产品三层解耦，后续加云不必改 Host 与 Client。

## 功能

- 对话里查询域名，按控制台列表展示状态、套餐、记录数，可翻页
- 点击域名或「解析」配置解析记录：添加、修改、启停、删除（删除始终确认）
- 对话里查询 COS：地域补全默认为广州（ap-guangzhou），仍可输入中文名 / ID 改选其它官方地域，再列该地域存储桶；点名称进入当前目录文件列表，用面包屑下钻（对齐控制台列表视图，不是 IDE 展开树）
- COS 可在对话卡创建/删除空桶、上传≤20MB 文件、创建文件夹、查看详情、下载、重命名、删除与复制 15 分钟临时链接
- 设置页按厂商 schema 填写 AKSK，密钥只保存在本机。本轮不新增 COS / 默认地域字段，对话内选地域与文件操作不写 `cloud-infra.json`
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

打开 **设置 → 插件 → 插件配置 → 云资源**，填写腾讯云 SecretId / SecretKey。CAM 需包含 DNSPod 与/或 COS 对应权限。设置卡字段与布局保持原样：不增加默认地域或 COS 专用配置。

然后可以直接对 Agent 说：

> 查一下 dnspod 域名

> 列出我的解析域名

> 查一下 COS / 对象存储

> 还有吗

插件向 Agent 提供 `cloud_infra_query`。`kind=domain` 列出域名；用户说「查 COS」时必须调用 `kind=cos` **且可以不带 region**，对话卡默认选中广州（`ap-guangzhou`）并列出该地域存储桶，顶部 `#ci-cos-region` 仍可输入补全改选。清空后回到「请输入并选择地域」。禁止把中文名或自由文本当 region，也禁止用 Ask question 代替卡内补全。未配置腾讯云密钥时卡片置顶提示去 **设置 → 插件 → 云资源**，不会把鉴权失败画成「该地域下没有存储桶」。

COS 对话卡对齐控制台两页：顶部地域补全默认广州，仍可用中文名 / GZ / `ap-guangzhou` 改选（含硅谷、法兰克福、金融区等官方枚举）→ 存储桶列表（名称 / 地域 / 创建时间 / 访问权限只读，桶名搜索 300ms 防抖）→ 点名称进入文件列表（当前层短名 + 面包屑下钻）。一层对象过多时用「加载更多」按 `nextMarker` 续拉，搜索仅过滤已加载项。访问权限、CORS、生命周期等桶设置不在对话卡内改。地域选择与上传/删除等操作只留在对话卡内存，不写插件设置。重命名走官方 `x-cos-copy-source`（`<桶>.cos.<地域>.myqcloud.com/<编码后的 Key>`）；删文件夹使用批量删除，失败会提示已删/剩余数量。

## 配置

配置写入 `$DSH_HOME/cloud-infra.json`（默认 `~/.dsh/cloud-infra.json`），权限 0600。密钥不会出现在对话、工具正文或 `cordis.patch.yml` 中。

- **写操作免确认**：添加/修改/启停可跳过弹窗；删除（含空桶、文件、文件夹）始终二次确认
- 保存密钥时留空表示保持原值
- COS 地域与当前目录只存在于对话卡，`query` / `detail` / `action` 不会调用设置保存

## 如何加一个云厂商

不改 `src/host.ts`、`src/client.js`、`src/core/query.ts`。

1. 新建 `src/providers/<id>/index.ts`：`registerProvider({ id, title, fields, color })`，并实现该云的签名/HTTP 客户端
2. 新建 `src/providers/<id>/products/<kind>.ts`：实现 `ResourceModule`，把该云 API 映射为统一的 `ResourceCard`（域名用 `DnsRecord`，对象存储用当前层 `entries`）
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
- **CAM 未授权**：给子账号授予 DNSPod 或 COS 相关策略后再查
- **COS 提示先选择地域**：必须从补全列表点选或回车命中官方枚举项；改字未命中会回到空态且不请求 GetService
- **未配置密钥**：COS 卡展示设置页提示，而不是空桶列表
- **文件列表被截断**：当前层超过一页时点「加载更多」，不要以为只有 12 个对象

## 许可证

[MIT](LICENSE)
