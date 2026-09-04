---
title: "Pop!_OS安装后？ 体验优化和软件推荐、安装"
date: 2026-9-3 14:52:34
tags: [Linux, 软件, 分享]
---

这篇文章致力于提高 Pop!_OS 的使用体验，持续更新。

## 必要配置

为提高配置效率，我会尽可能给出`bash`命令。

### APT 换源

**Pop!_OS 自己的源保持官方，仅把 Ubuntu 基础源换成中科大**：

```bash
# 只改 system.sources 里的 Ubuntu 镜像地址，Pop 自己的两个源不动
sudo sed -i 's@//apt.pop-os.org/ubuntu@//mirrors.ustc.edu.cn/ubuntu@g' \
  /etc/apt/sources.list.d/system.sources
sudo apt update
```

### Flatpak 换源

```bash
# 切换下载地址到镜像
sudo flatpak remote-modify flathub --url=https://mirrors.ustc.edu.cn/flathub
```

> 智能缓存模式，未命中回源，`flatpak update` 可验证是否生效。

### COSMIC 设置（可选）

你当然可以把 **COSMIC设置** 完完整整浏览并设置一遍，这很好，我这里列几个显著提高体验的配置，包括一些GUI不包含的设置：

1. **焦点跟随鼠标 / 鼠标跟随焦点 / 延迟微调**


2. **PiP 浮动 + Steam 取消浮动**

```bash
mkdir -p ~/.config/cosmic/com.system76.CosmicSettings.WindowRules/v1
cat > ~/.config/cosmic/com.system76.CosmicSettings.WindowRules/v1/tiling_exception_custom <<'EOF'
[
    (appid: "", title: "Picture in picture", enabled: true),
    (appid: "com.valvesoftware.Steam", title: "Steam", enabled: false),
]
EOF
```

- 未完

> Steam 取消浮动涉及 窗口浮动/平铺例外规则，RON 配置，热重载 \
配置地址`~/.config/cosmic/com.system76.CosmicSettings.WindowRules/v1/tiling_exception_custom`

---

## 软件分享

> **关于什么时候用Flatpak和APT的看法：** \
开发、游戏和注重更新的优先APT/官方包；社交、媒体和旧版应用可以Flatpak安装。

### 中文必备！

**Fcitx5 —— 手感好上手快可扩展的中文输入法方案**
```bash
sudo apt update
sudo apt install -y fcitx5 fcitx5-frontend-gtk fcitx5-frontend-qt fcitx5-configtool fcitx5-rime fcitx5-chinese-addons
```

- Steam++ / Watt Toolkit —— 国内加速GitHub和Steam的不二之选

### 系统增强 *

- Minimon Applet —— 顶栏状态监控组件
- Papyrus / F —— 适用的动态壁纸

### 应用开发

- VS Code —— 可扩展的代码编辑器
- OpenCode —— AI Agent工具
- OpenChamber —— 强大的OpenCode GUI

### 媒体娱乐

- COSMIC Camera —— 支持扫描相机
- Piliplus —— 第三方B站客户端
- Steam —— 蒸汽游戏平台
- OBS Studio —— 强大录屏软件

