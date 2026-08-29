# cloud-infra

DeepSeek Harness 多云资源插件。在对话中查询云厂商上的域名等资源，以控制台风格的可翻页列表展示；在设置页配置各云 AccessKey。

已实现 [腾讯云 DNSPod](https://cloud.tencent.com/document/product/1427/56194) 域名解析，以及对话卡片内的 [腾讯云域名注册](https://cloud.tencent.com/document/product/242/9595)（查询、立即加购、购物车、提交订单、核对信息、账户余额支付、我的域名）。架构按厂商 / 凭证 / 产品三层解耦，后续加云不必改 Host 与 Client。

## 功能

- 对话里查询域名解析，按控制台列表展示状态、套餐、记录数，可翻页
- 点击域名或「解析」配置解析记录：添加、修改、启停、删除（删除始终确认）
- 对话工具卡内查询可注册性、立即加购并走完余额支付（不改设置）
- 对话工具卡内查看我的域名，筛选、自动续费、基本信息 / 域名安全
- 设置页按厂商 schema 填写 AKSK，密钥只保存在本机
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

打开 **设置 → 插件 → 插件配置 → 云资源**，填写腾讯云 SecretId / SecretKey。CAM 需包含 DNSPod 读权限；改记录还需写权限。域名注册还需域名注册读写（查询、下单、我的域名、自动续费与两锁）。插件不新增设置项，复用同一套 AKSK。

然后可以直接对 Agent 说：

> 查一下 dnspod 域名

> 列出我的解析域名

> 查一下 example 能不能注册

> 我买了哪些域名

> 还有吗

插件向 Agent 提供 `cloud_infra_query`。查询完成后对话中会显示可翻页列表；点击域名或「解析」即可配置解析记录。

### 对话卡片里的域名注册

注册和我的域名都出现在 **对话弹出的工具卡** 上，搜索框在卡顶栏，不是独立页，也不进设置。

1. 对 Agent 说「查一下 example 能不能注册」，弹出 **域名注册** 卡。可在卡顶搜索框改关键字再查（完整域名单行；素名会查 `.com / .cn / .net / .xyz / .top`）。
2. 可买显示 **立即加购**，不可买显示 **已被注册**，溢价词不可加购。
3. 加购后打开 **购物车**，可加减多个可买后缀，再点 **立即购买**。
4. **提交订单**：时长默认 1 年（1–10，`.co` 最多 5）、已实名信息模板、自动续费 / 禁止更新锁 / 禁止转移锁（下单时两锁可同时开），勾选官方[域名注册协议](https://cloud.tencent.com/document/product/242/8458)（只链到官网，不复制全文）。
5. **核对信息** 后再 **账户余额支付**（`PayMode=1`）。不支持微信 / QQ 钱包 / 网银。支付与开关永远二次确认。
6. 下单后看操作状态（已提交 / 进行中 / 成功 / 失败），可到 **我的域名** 卡片刷新。注册不是瞬时 WHOIS 生效。

我的域名卡顶栏同样有搜索框（占位「请输入域名关键字」），清空恢复全部；筛选会分页拉取当前账号已购列表再本地过滤。点 **管理** 进入 **基本信息** / **域名安全**；自动续费在列表列上开关。仅在已购域名的 **域名安全** 页签：更新锁已开时不能改转移锁（以下单接口查询到的当前状态为准，不轻信卡片 extras）。

插件不创建信息模板、不续费付费、不转入、不下溢价词单。无已实名模板时请到腾讯云控制台「信息模板」完成实名。

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
- **CAM 未授权**：给子账号授予 DNSPod 或域名注册相关策略后再查
- **没有已实名模板**：到腾讯云控制台「信息模板」完成实名；插件不创建模板
- **账户余额不足**：核对页或浮层会提示「账户余额不足」；密钥不会出现在报错里

## 许可证

[MIT](LICENSE)
