# Mind Map Tool (GitHub 图床增强版)

> Fork 自 [oorzc/vscode-mindmap](https://github.com/oorzc/vscode-mindmap)（MIT License），在原版基础上集成了 GitHub 图床直传、内容去重、删除节点同步删远端等功能。

[中文文档](README.zh-CN.md)

## ❓ 如何使用

直接创建后缀为 km 或 xmind 的文件即可打开思维导图。

## ✨ 插件功能

1. 多语言支持（简体中文、繁體中文、English、German、Spanish、French、Italian、Czech、Hungarian、Japanese、Korean、Polish、Portuguese、Russia）
2. 直接打开 km、xmind 文档
3. 支持导出高清图片（插件设置中配置缩放倍数、背景色）
4. 导出 km、xmind、markdown、svg、txt、json、png 文件
5. 导入 km、xmind、markdown、txt、json 文件
6. **GitHub 图床直传**（本 fork 新增）：图片直接上传到 GitHub 仓库，返回 jsdelivr CDN 链接，不依赖额外 HTTP 上传服务
7. **内容去重**（本 fork 新增）：cyrb53 内容 hash 做文件名，内容相同自动复用，不重复存储
8. **删除节点同步删远端**（本 fork 新增）：删除含图床图片的节点时弹窗确认，批量删除远端图床对应图片
9. **图片对话框删远端**（本 fork 新增）：图片选项里一键删除当前图片对应的远端图床文件
10. **Ctrl+V 粘贴上传**（增强）：复制图片直接粘贴，自动上传 GitHub 图床并插入节点

## 🔧 GitHub 图床配置（本 fork 新增）

在 VSCode settings.json 配置（不配 token 则图片走本地 base64，即原版行为）：

```json
"MindMap.githubToken": "ghp_你的GitHub PAT",
"MindMap.githubOwner": "你的GitHub用户名",
"MindMap.githubRepo": "你的图床仓库名",
"MindMap.githubBranch": "main",
"MindMap.githubPath": "images/你的路径",
"MindMap.githubCdn": "jsdelivr"
```

- `githubToken`：GitHub Personal Access Token（classic 勾 repo，或 fine-grained 选目标仓库 Contents 读写权限）
- `githubOwner`/`githubRepo`/`githubBranch`/`githubPath`：图床仓库配置（有默认值）
- `githubCdn`：`jsdelivr`（CDN 加速，有缓存延迟）或 `raw`（直连 GitHub raw）

## 📖 界面展示

![](https://cdn.jsdelivr.net/gh/oorzc/public_img@main/img/2023%2F12%2F15%2F20231215115936.png)
![](https://cdn.jsdelivr.net/gh/oorzc/public_img@main/img/2023%2F12%2F15%2F20231215120032.png)

## 致谢

- [oorzc/vscode-mindmap](https://github.com/oorzc/vscode-mindmap) —— 本 fork 的直接上游（MIT License, Copyright (c) 2023 oorzc）
- [souche/vscode-mindmap](https://github.com/souche/vscode-mindmap) —— 最初原版

## License

MIT License（Copyright (c) 2023 oorzc）。本 fork 保留原版权声明，新增代码同样以 MIT 发布。
