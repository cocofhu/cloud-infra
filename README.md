# cloud-infra

DeepSeek Harness 多云资源插件。在对话中查询云厂商上的域名、证书、对象存储、TKE 集群、云服务器与云数据库，以对齐各产品控制台的列表展示；在设置页配置各云 AccessKey。

已实现 [腾讯云 DNSPod](https://cloud.tencent.com/document/product/1427/56194) 域名与解析记录，[腾讯云 SSL「我的证书」](https://cloud.tencent.com/document/product/400/55741)（列表、完整详情、申请/上传/部署/下载/更多），对话卡片内的 [腾讯云域名注册](https://cloud.tencent.com/document/product/242/9595)（查询、立即加购、购物车、提交订单、核对信息、账户余额支付、我的域名），[腾讯云 COS](https://cloud.tencent.com/document/product/436/8291) 存储桶列表与文件列表，[腾讯云 TKE](https://cloud.tencent.com/document/product/457/31824) 控制台「集群」配置树，[CVM](https://cloud.tencent.com.cn/document/product/213/16533) 与 [轻量应用服务器](https://cloud.tencent.com/document/product/1207/44574)，以及 [腾讯云 CLS](https://cloud.tencent.com/document/product/614/56447) 日志主题查看与检索分析、[腾讯云 CDB MySQL](https://cloud.tencent.com/document/product/236/3131) 的实例列表、11 个官方管理页签与 DMC 登录 / SQL。架构按厂商 / 凭证 / 产品三层解耦；Host / Query 不按厂商名分支。地域只在对话参数或资源 UI 会话中传递，不写回设置。

## 功能

- 对话里查询域名解析，按控制台列表展示状态、套餐、记录数，可翻页
- 点击域名或「解析」配置解析记录：添加、修改、启停、删除（删除始终确认）
- 对话里查询证书（`kind=cert`）：复刻「我的证书」表，点击证书 ID / 绑定域名看完整分块详情
- 顶栏申请免费证书、上传证书；行内部署（勾选匹配实例）、下载、更多（吊销/重颁发/删除）
- 对话里查询 COS：地域补全默认为广州（ap-guangzhou），仍可输入中文名 / ID 改选其它官方地域，再列该地域存储桶；点名称进入当前目录文件列表，用面包屑下钻（对齐控制台列表视图，不是 IDE 展开树）
- COS 可在对话卡创建/删除空桶、上传≤20MB 文件、创建文件夹、查看详情、下载、重命名、删除与复制 15 分钟临时链接
- 对话工具卡内查询可注册性、立即加购并走完余额支付（不改设置）
- 对话工具卡内查看我的域名，筛选、自动续费、基本信息 / 域名安全
- 对话里查询 TKE 集群（`kind=cluster` + 运行时 `region`），打开控制台风格集群列表
- TKE 列表：顶栏选地域，按名称 / 类型 / 状态 / VPC / 标签筛选；列含集群 ID/名称、状态、Kubernetes 版本、节点数、所在网络、创建时间
- 新建：类型卡（标准 / 弹性 / 边缘 / 注册）。标准集群四步向导（信息 → 网络含 GR 常用上限 → 组件可跳 → 确认+SLA）。边缘走独立网络步（VPC/Pod/Service CIDR）。注册集群先 `CreateCluster ClusterType=EXTERNAL_CLUSTER` 拿到 ClusterId，再 `DescribeExternalClusterSpec({ ClusterId, IsExtranet })` 生成导入 YAML。弹性新建入口关闭，引导标准集群 + 超级节点；独立集群不新建
- 删除向导：第一步可关闭删除保护，有普通/原生/超级节点则拒绝，再选资源保留或销毁并勾选风险。标准走 `DeleteCluster`，边缘走 `DeleteTKEEdgeCluster`，弹性走 `DeleteEKSCluster`
- 详情侧栏：基本信息（含 Master/Node 升级表单、APIServer 内外网分开关、删除保护）、节点（封锁用 K8s 节点名；新建需机型/镜像/可用区 Placement.Zone/安全组/子网/登录凭证；添加已有节点需安全组与密钥或密码；节点列表按 TotalCount 翻页并合并超级节点）、节点池名片（含计费；普通 `ModifyNodePoolDesiredCapacityAboutAsg` / 原生 `ModifyNodePool` 2022-05-01 / 超级不按 ASG 期望数缩容）、命名空间配额、组件（InstallAddon）、授权（K8s ClusterRoleBinding）、策略（DescribeOpenPolicyList/ModifyOpenPolicyList）、运维开关（DescribeLogSwitches ClusterIds/SwitchSet）
- kubeconfig 只在 APIServer 区块的受信 UI 复制或下载，不进对话
- 对话里查询云服务器：默认广州地域，顶栏下拉切换地域；同时有云服务器和轻量时用 Tab 切换产品。CVM / 轻量均为密表 + 行内更多。实例过多时按设置里的每页条数翻页
- 实例详情按官方分组展示；开机 / 关机 / 重启在行内更多与详情顶栏完成
- 对话里查询 CLS **日志主题**（名称/ID、日志集、存储类型、保存时间、创建时间），点「检索分析」仍在同一张卡片内打开
- 对话一句话可直接检索指定主题的原始日志（CQL 语句模式；空语句查该时间窗全部日志）
- 卡片顶部可按官方地域分组切换（大陆/港澳台/海外/金融/特殊）。**只改当前对话卡片，不写设置页与覆盖文件**
- 对话里查询 CDB：列表为「登录 / 管理」，管理页为官方 11 个页签；SQL 走 DMC 登录，库账号只在进程内存
- 设置页按厂商 schema 填写 AKSK，并开关 `tencent.tke`；无必填地域字段。密钥只保存在本机。不新增地域、库账号或电源控件；新产品只出现在既有产品模块勾选。证书操作不改设置
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

打开 **设置 → 插件 → 插件配置 → 云资源**，填写腾讯云 SecretId / SecretKey。CAM 需包含对应产品的读权限；改记录、开关机或管库还需写权限。域名注册还需域名注册读写（查询、下单、我的域名、自动续费与两锁）。COS 需对象存储对应权限。插件不新增设置项，复用同一套 AKSK。设置卡字段与布局保持原样：不增加默认地域或 COS 专用配置。设置页不填写地域或库账号。已有腾讯云凭证即可用证书，不必再改设置。

- 域名 / DNS：`QcloudDNSPodReadOnlyAccess`（或等价读权限）；改记录再加写权限
- SSL 证书：SSL 读权限；申请 / 上传 / 部署 / 吊销还需写权限
- 域名注册：域名注册读写（查询、下单、我的域名、自动续费与两锁）
- TKE：容器服务读写（集群、节点、节点池、组件、授权、策略、审计开关等对应接口）
- 云服务器：`QcloudCVMReadOnlyAccess` / `QcloudCVMFullAccess`（电源操作需要写）
- 轻量：`QcloudLighthouseReadOnlyAccess` / `QcloudLighthouseFullAccess`
- 云数据库：CDB 读权限；登录 DMC 与写操作还需对应写权限与库账号
- 对象存储：COS 读权限；上传 / 删除 / 建桶还需写权限
- CLS：CAM 需包含日志服务读权限（如 `DescribeTopics`、`DescribeLogsets`、`SearchLog`）。已有 AKSK 可直接复用，不必重填

然后可以直接对 Agent 说：

> 查一下 dnspod 域名

> 列出我的解析域名

> 查一下腾讯云证书

> 查一下 COS / 对象存储

> 查一下 example 能不能注册

> 我买了哪些域名

> 查一下广州的 TKE 集群

> 查一下我的服务器

> 列出 CVM

> 列出轻量应用服务器

> 查一下 CLS 主题

> 北京的 CLS 主题

> 检索 nginx-access 近 1 小时 status:500

> 查一下我的 CDB

> 还有吗

插件向 Agent 提供 `cloud_infra_query`。`kind` 可取 `domain`（缺省）、`cert`、`cos`、`cluster`、`cdb`、`lighthouse`、`cvm`、`registrar`、`my-domain`、`cls`、`auto`。查 CLS 时传 `kind=cls`；检索日志时再传 `topicId` 或主题名、`queryString`（CQL）、`range`（`15m` / `1h` / `4h` / `1d` / `today` / `yesterday`，默认 `1h`）。**查证书必须传 `kind=cert`**。用户说「查 COS」时必须调用 `kind=cos` **且可以不带 region**，对话卡默认选中广州（`ap-guangzhou`）并列出该地域存储桶，顶部 `#ci-cos-region` 仍可输入补全改选。清空后回到「请输入并选择地域」。禁止把中文名或自由文本当 region，也禁止用 Ask question 代替卡内补全。未配置腾讯云密钥时卡片置顶提示去 **设置 → 插件 → 云资源**，不会把鉴权失败画成「该地域下没有存储桶」。查 TKE 用 `kind=cluster` 并传入运行时 `region`（如 `ap-guangzhou`）。查服务器时应使用 `cvm` / `lighthouse` / `auto`，不要只用 `domain`。查询、切地域、写操作都不会改 `cloud-infra.json`。

COS 对话卡对齐控制台两页：顶部地域补全默认广州，仍可用中文名 / GZ / `ap-guangzhou` 改选（含硅谷、法兰克福、金融区等官方枚举）→ 存储桶列表（名称 / 地域 / 创建时间 / 访问权限只读，桶名搜索 300ms 防抖）→ 点名称进入文件列表（当前层短名 + 面包屑下钻）。一层对象过多时用「上一页 / 下一页」按 `nextMarker` 翻页，搜索仅过滤当前页。访问权限、CORS、生命周期等桶设置不在对话卡内改。地域选择与上传/删除等操作只留在对话卡内存，不写插件设置。重命名走官方 `x-cos-copy-source`（`<桶>.cos.<地域>.myqcloud.com/<编码后的 Key>`）；删文件夹使用批量删除，失败会提示已删/剩余数量。

控制台路径对照（TKE）：

1. 列表顶栏选地域 → 筛选 → 点集群 ID
2. 新建 → 类型卡 → 标准四步（确认页勾 SLA）
3. 更多 → 关闭删除保护 → 删除向导（清节点 → 资源保留 → 风险勾选）
4. 详情左侧：基本信息 / 节点 / 节点池 / 命名空间 / 组件 / 授权 / 策略 / 运维功能

查询完成后对话中会显示可翻页列表（默认每页 12 条，与设置里的每页条数一致）：域名点「解析」配置记录；证书点证书 ID 或绑定域名查看完整详情。CVM / 轻量默认广州，可用顶栏下拉看其他地域，同时有两个产品时用 Tab 切换。点实例 ID 看分组详情，或用行内更多开机 / 关机 / 重启。CDB 点「登录」进 DMC 或点「管理」进实例管理页。地域筛选只影响当次对话，不写入设置。不要打印密钥或 PEM。

不做：工作负荷、运维中心、Cloud Shell、CLS 大盘、对话输出 kubeconfig。

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

- **写操作免确认**：添加/修改/启停以及开机/关机/重启可跳过弹窗；删除（含空桶、文件、文件夹）始终二次确认
- 保存密钥时留空表示保持原值
- 新模块出现在「产品模块」勾选列表，设置页不增加地域多选或电源按钮
- COS 地域与当前目录只存在于对话卡，`query` / `detail` / `action` 不会调用设置保存
- Region 不是腾讯云必填凭证。未指定地域时当次 CLS 请求默认广州（`ap-guangzhou`）
- 对话里切地域、改时间、检索**不会**触发 config 保存（覆盖文件不增加 `clsRegion`）

## 如何加一个云厂商

Host / Query 仍不按厂商名分支。新增厂商：

1. 新建 `src/providers/<id>/index.ts`：`registerProvider({ id, title, fields, color })`，并实现该云的签名/HTTP 客户端
2. 新建 `src/providers/<id>/products/<kind>.ts`：实现 `ResourceModule`，把该云 API 映射为统一的 `ResourceCard` / 详情分区（域名用 `DnsRecord`，对象存储用当前层 `entries`）
3. 在 [`src/providers/index.ts`](src/providers/index.ts) 增加一行 `import './<id>/index.js'`

新产品类型（如 CLS）需要扩展工具参数、系统提示和对话卡片视图，可参考 [`src/providers/tencent/products/cls.ts`](src/providers/tencent/products/cls.ts)。新增产品 kind（如 `cluster`）时，可在客户端增加独立视图（TKE 使用 `ClusterConsole`，不要复用域名 `DetailView`）。运行时 `region` 经 query/detail/action 透传，禁止为此改设置 schema。若新产品需要独立控制台皮肤（例如密表 vs 卡片），在 `src/client.js` 按 **kind** 分支，不要按厂商名分支。

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
- **CAM 未授权**：给子账号授予 DNSPod / SSL / 域名注册 / COS / TKE / CVM / 轻量 / CDB 相关策略后再查。单个地域未授权时其余地域仍会列出
- **COS 提示先选择地域**：必须从补全列表点选或回车命中官方枚举项；改字未命中会回到空态且不请求 GetService
- **未配置密钥**：COS 卡展示设置页提示，而不是空桶列表
- **文件列表被截断**：当前层超过一页时点「下一页」，不要以为只有 12 个对象
- **没有已实名模板**：到腾讯云控制台「信息模板」完成实名；插件不创建模板
- **账户余额不足**：核对页或浮层会提示「账户余额不足」；密钥不会出现在报错里
- **未选地域**：TKE 列表不会暗默写设置；查询集群时默认广州
- **凭证进对话**：kubeconfig 只出现在集群详情 APIServer 区块，请勿让 Agent 复述
- **查服务器却只看到域名**：确认对话调用了 `kind=cvm` / `lighthouse` / `auto`，而不是缺省的 `domain`
- **当前地域没有主题**：卡片顶部换一个地域；不会改设置
- **主题名重名**：指定主题 ID 或日志集后再检索

## 许可证

[MIT](LICENSE)
