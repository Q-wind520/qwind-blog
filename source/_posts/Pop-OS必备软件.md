---
title: "Pop!_OS安装后？ 体验优化和软件推荐、安装"
date: 2026-9-3 14:52:34
tags: [Linux, 软件, 分享]
---

这篇文章致力于提高 Pop!_OS 的使用体验，持续更新。

## 必要配置

为提高配置效率，我会尽可能给出`bash`命令。

### APT 换源

Pop!_OS 的源是 deb822 格式`/etc/apt/sources.list.d/*.sources`，直接 sed 替换主机名为镜像（上海交大，国内唯一完整镜像 Pop 源的站点）：

```bash
# 前两个文件是 Pop!_OS 自己的仓库，system.sources 是 Ubuntu 基础源
sudo sed -i 's@//apt.pop-os.org/@//mirror.sjtu.edu.cn/pop-os/@g' \
  /etc/apt/sources.list.d/pop-os-apps.sources /etc/apt/sources.list.d/pop-os-release.sources
sudo sed -i 's@//apt.pop-os.org/@//mirror.sjtu.edu.cn/@g' \
  /etc/apt/sources.list.d/system.sources
sudo apt update
```

> 匹配 `//apt.pop-os.org/`；换源后首次 `apt update` 会重新拉取索引，稍慢属正常。

### Flatpak 换源

```bash
# 若系统还没 flathub 源则先添加（Pop!_OS 一般已内置，可跳过）
flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
# 切换下载地址到镜像
sudo flatpak remote-modify flathub --url=https://mirror.sjtu.edu.cn/flathub
```

> 交大的 flathub 是**智能缓存**，未命中的文件会回源站拉取，首次安装大应用时仍需能连通 flathub.org；`flatpak update` 可验证是否生效。

### COSMIC 设置（可选）

你当然可以把 **COSMIC设置** 完完整整浏览并设置一遍，这很好，我这里列几个显著提高体验的配置，包括一些GUI不包含的设置：

- 

---

## 软件分享

> **关于什么时候用Flatpak和APT的看法：** \
开发、游戏和注重更新的优先APT/官方包；社交、媒体和旧版应用可以Flatpak安装。

### 中文必备！

- Fcitx5 & Rime —— 手感很好的中文输入法方案
- Steam++ / Watt Toolkit —— 国内加速GitHub和Steam的不二之选

### 系统增强 *

- Minimon Applet
- Papyrus

### 应用开发

- VS Code
- Opencode
- 

### 媒体娱乐

- COSMIC Camera
- Piliplus
- Steam
- OBS Studio

