# 安装 HackerTube Chrome 插件

1. 如果使用 ZIP：先解压 `hackertube-chrome-1.1.0.zip`，得到 `hackertube` 文件夹。
2. 在 Chrome 地址栏输入 `chrome://extensions`。
3. 打开右上角「开发者模式」。
4. 点击「加载已解压的扩展程序」，选择解压后的 `hackertube` 文件夹（里面应直接有 `manifest.json`）。如果直接使用源码，选择项目的 `extension` 文件夹。
5. 在 Chrome 右上角的拼图菜单中固定 HackerTube，点击图标打开私人片库。

无需构建、登录或 API Key。不会自动替换新标签页或修改 YouTube 页面。

推荐先搜索 `distributed systems`、`linear algebra`、`Rich Hickey` 或 `3Blue1Brown`。原始视频标题和摘要是英文，推荐使用英文关键词；领域筛选和界面为中文。

点击视频查看推荐理由，再点「在 YouTube 观看」。♡ 喜欢会影响本地推荐；稍后观看和打开记录保存在这个 Chrome 配置中，可在「设置与数据」导出备份。

视频目录内置，离线可搜索和整理收藏。封面和播放需要能访问 YouTube；时长和首次 Longs 片单需要能访问 hackertube.org，失败会显示说明。Longs 缓存保留 7 天后尝试更新。普通时长加载失败不影响搜索和收藏。

这是本地开发者模式安装方式；商店版已提交审核，审核通过前请使用此方式。安装后请保留扩展文件夹；移动或删除文件夹会导致加载失败。覆盖升级前建议先导出收藏备份，卸载扩展会清除其本地数据。
