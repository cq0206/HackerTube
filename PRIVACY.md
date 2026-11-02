# 隐私说明

更新：2026-11-02 · 适用于本仓库桌面版与 Chrome 插件。

无需账号，没有广告、遥测、分析 SDK 或云同步。搜索词、收藏、屏蔽、打开记录和推荐计算留在本机，不发送给开发者或 HackerTube。应用不读取浏览器历史、Cookie 或其他网站页面。

## 本地保存

桌面版的 `library.json` 包含收藏、偏好、视频时长和 Longs 缓存，默认位于：

- macOS：`~/Library/Application Support/HackerTube/`
- Windows：`%APPDATA%/HackerTube/`
- Linux：`$XDG_CONFIG_HOME/HackerTube/`，通常为 `~/.config/HackerTube/`

「帮助 → 关于 HackerTube」显示实际目录。开发/便携使用可以通过 `HACKERTUBE_USER_DATA` 环境变量指定独立的绝对路径。应用采用串行、原子文件替换；本地 JSON 与导出的备份没有加密，同一系统账户可读取。损坏文件会保留，应用不会用空片库静默覆盖。

Chrome 插件使用 `chrome.storage.local`；HTTP 预览使用页面的 localStorage。三个环境彼此独立。卸载扩展、清除应用数据或删除配置目录会丢失本地状态，请先导出备份。卸载桌面应用可能保留配置目录，需要时可自行删除。

## 网络连接

- `i.ytimg.com`：请求当前展示的视频封面，URL 包含公开视频 ID。
- `hackertube.org/api/docs`：请求当前可见视频的时长，参数只有视频 ID。
- `hackertube.org/api/list`：请求 Longs，参数只有时长筛选与分页条件。
- 点击观看、原讨论或来源链接时，通过系统浏览器打开 YouTube、Hacker News、HackerTube、Hugging Face 或本项目 GitHub 页面；后续访问适用对应网站的隐私政策。

外站正常收到 IP 地址和请求元数据。桌面 API 请求不附带账号凭据，不传输搜索词、收藏和打开记录。浏览器播放沿用浏览器自身的登录状态。应用没有内嵌视频播放器，不跟踪播放进度，不会自动下载或安装更新。

## 数据使用

本项目不出售用户数据，不将数据用于与视频片库无关的用途、广告、信用或贷款判断。JSON 导出由你选定保存位置，导入只读取你选择的备份文件，最大 2 MB。Chrome 仅申请本地存储及 HackerTube 的跨域请求权限。

问题可在 [GitHub Issues](https://github.com/cq0206/HackerTube/issues) 提出。请勿在公开 Issue 中上传包含个人收藏与记录的完整备份。
