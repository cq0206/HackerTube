# HackerTube · 私人放映室

一个开源的桌面视频片库，也提供 Chrome 插件。把 Hacker News 多年反复提及的内容，做成安静的深色影院：无需账号，收藏留在本机。

![HackerTube 桌面版](docs/images/desktop.png)

## 下载桌面版

前往 [GitHub Releases](https://github.com/cq0206/HackerTube/releases) 下载：

| 系统 | 安装文件 |
| --- | --- |
| macOS Apple Silicon | `mac-arm64.dmg` 或 `mac-arm64.zip` |
| macOS Intel | `mac-x64.dmg` 或 `mac-x64.zip` |
| Windows x64 | `win-x64.exe` 安装器或 `win-x64.zip` |
| Linux x64 | `linux-x64.AppImage` 或 `linux-x64.deb` |

完整文件名带版本号。macOS 将应用拖入「应用程序」；Windows 运行安装器；Linux 按发行版方式安装 deb，或给 AppImage 可执行权限后运行。当前发行包没有商业代码签名或 Apple 公证，系统可能要求手动确认来源。只从本仓库下载并核对 SHA-256；不需要关闭系统安全功能。

macOS arm64 安装包会在维护者本机验证；其余平台由 GitHub Actions 构建，未经逐平台人工验收。各平台文件以 Release 中实际生成的附件为准。

## 能做什么

- 内置 **6,454** 个视频、16 个领域、150 个原始分类；离线搜索标题、创作者、摘要和标签。
- 深色影院主推区、中间帧封面、明暗切换；视觉设计使用 [baoyu-design](https://github.com/jimliu/baoyu-design) 流程。
- HN 经典按原始推荐得分排序；发现页结合质量、日期种子与喜欢的分类排序，可手动换一批。
- 默认过滤仅被引用而未获推荐的视频、新闻、已屏蔽和已打开的内容。当前快照初始发现页有 4,654 条。
- 查看推荐理由、独立推荐月份、代表评论和 HN 原讨论。
- 喜欢、稍后观看、不感兴趣、打开记录；JSON 导出与合并导入。
- Longs 通过 HackerTube 公开接口分页获取超过一小时的视频，片单与时长缓存 7 天。
- 桌面版有原生菜单和文件对话框；视频在系统浏览器打开 YouTube。记录的是打开动作，不是观看完成度。

搜索内容以英文为主，可试 `distributed systems`、`linear algebra`、`Rich Hickey`。离线可整理本地片库；封面、首次时长/Longs 加载和播放需要网络。未缓存封面不会在离线时显示。

## Chrome 插件

下载 Release 中的 `hackertube-chrome-1.1.0.zip`，或直接加载源码的 `extension/` 文件夹，见 [安装说明](INSTALL.md)。无需构建，不替换新标签页、不修改 YouTube 页面。Chrome 商店版本已提交审核，审核结果由商店决定。

桌面版和 Chrome 插件使用同一套界面与备份格式，**不会自动共享或同步收藏**。迁移时在原端导出 JSON，再到另一端导入；只合并收藏、屏蔽与打开记录，保留目标端偏好。

## 从源码运行

需要 Node.js **22.12+** 和 npm；Chrome 插件本身不依赖 Node。

```sh
git clone git@github.com:cq0206/HackerTube.git
cd HackerTube
npm ci
npm start
```

Electron 运行时首次使用或打包时从官方发行源下载。Windows/Linux 请在对应系统构建；macOS 构建 DMG 需要 Mac。

```sh
npm run check               # 资源、模块语法与扩展 CSP 静态检查
npm test                    # 推荐规则、备份、存储和 URL 安全边界
npm run test:desktop        # 独立临时配置的真实 Electron 测试
npm run desktop:dir         # 生成可运行的解包应用
npm run desktop:dist        # 生成当前系统安装包，输出 dist/
# 按系统选择：
npm run desktop:dist -- --mac --arm64 --x64
npm run desktop:dist -- --win --x64
npm run desktop:dist -- --linux --x64
```

`npm run test:desktop` 需要可用的图形桌面环境。Linux 无桌面测试机可以使用 Xvfb；运行时仍启用 Chromium sandbox。CI 在 macOS 执行桌面集成测试，并在三个系统构建发行包。

Chrome 单独打包需要 Python 3：`npm run package`。开发预览：`npm run serve`，打开 `http://localhost:8787`；预览的 localStorage 与正式应用相互独立。macOS Chrome 真实扩展测试：`node scripts/browser-test.mjs`，使用临时 profile。

## 架构与数据

`extension/` 是共享的无框架前端和内置数据；`platform.js` 选择 Chrome、浏览器预览或桌面适配器。`desktop/` 提供 Electron 主进程、隔离 preload、原子本地存储、固定资源协议和有限的原生桥接。渲染层禁用 Node 集成、启用沙箱及上下文隔离；只允许固定公开 API 和封面来源，不加载远程脚本或任意网页。

数据快照 **2026-10-31**，原始说明见 [DATA.md](extension/data/DATA.md)。内置视频卡片，不包含完整 39,834 条标签化评论、原始 4,300 万评论库或向量模型。部分视频只有引用而非推荐；AI 摘要、分类和推荐理由可能有误。视频下架或地区限制不会由应用绕过。原站接口没有稳定性承诺，变更可能影响时长和 Longs，内置目录仍可使用。

本地数据位置、网络请求和备份说明见 [隐私说明](PRIVACY.md)。贡献方式见 [CONTRIBUTING.md](CONTRIBUTING.md)，安全报告见 [SECURITY.md](SECURITY.md)。

## 许可

应用代码 **MIT**；内置视频数据单独适用 **ODC-By 1.0**，详见 [第三方声明](THIRD_PARTY_NOTICES.md)。数据来自 [HackerTube](https://hackertube.org/data) 和 [open-index/hacker-news](https://huggingface.co/datasets/open-index/hacker-news)，评论与视频信息权利归原作者。本项目与这些平台无隶属关系。
