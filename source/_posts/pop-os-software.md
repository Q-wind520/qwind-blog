---
title: "Pop!_OS 安装后的体验优化与软件推荐"
date: 2026-09-03 14:52:34
tags: [Linux, Pop!_OS, 教程]
---

这篇文章致力于提高 Pop!_OS 的使用体验。

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

   配置位于 `~/.config/cosmic/com.system76.CosmicComp/v1/`，写入后即时生效：

   ```bash
   echo true > ~/.config/cosmic/com.system76.CosmicComp/v1/focus_follows_cursor        # 焦点跟随鼠标
   echo true > ~/.config/cosmic/com.system76.CosmicComp/v1/cursor_follows_focus       # 鼠标跟随焦点
   echo 160  > ~/.config/cosmic/com.system76.CosmicComp/v1/focus_follows_cursor_delay # 延迟（毫秒），越小越跟手
   ```

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

> Steam 取消浮动涉及 窗口浮动/平铺例外规则，RON 配置，热重载 \
配置地址`~/.config/cosmic/com.system76.CosmicSettings.WindowRules/v1/tiling_exception_custom`

---

## 软件分享

> **关于什么时候用Flatpak和APT的看法：** \
开发、游戏和注重更新的优先APT/官方包；社交、媒体和旧版应用可以Flatpak安装。

### 中文必备！

**[Fcitx5](https://fcitx-im.org/) —— 手感好上手快可扩展的中文输入法方案**
```bash
sudo apt update
sudo apt install -y fcitx5 fcitx5-frontend-gtk fcitx5-frontend-qt fcitx5-configtool fcitx5-rime fcitx5-chinese-addons
```

**[Steam++ / Watt Toolkit](https://steampp.net/) —— 国内加速 GitHub 和 Steam 的不二之选**

> Linux 下有两个必踩的坑：**NSS 证书库未初始化**（点加速会跳转到 `steampp.net/liunxSetupCer`）与 **`/etc/hosts` 无写权限**。按下面顺序配置即可。

```bash
# 1. 安装依赖
sudo apt update
sudo apt install -y libnss3-tools wget tar

# 2. 下载解压
mkdir -p ~/Steam++ && cd ~/Steam++
wget -O WattToolkit.tgz "https://gitee.com/rmbgame/SteamTools/releases/download/3.1.0/Steam%20%20_v3.1.0_linux_x64.tgz"
tar -xzf WattToolkit.tgz -C ~/Steam++
chmod +x ~/Steam++/dotnet/dotnet ~/Steam++/Steam++.sh

# 3. 先启动一次生成证书文件，然后关闭
~/Steam++/Steam++.sh

# 4. 初始化 NSS 证书库并导入证书
mkdir -p ~/.pki/nssdb && chmod 700 ~/.pki/nssdb
certutil -d ~/.pki/nssdb -N --empty-password
certutil -d ~/.pki/nssdb -A -t "C,," -n "SteamTools Certificate" \
  -i ~/.local/share/Steam++/Plugins/Accelerator/SteamTools.Certificate.cer

# 5. 导入系统证书（解决 Git/curl 报错，需要 sudo）
sudo cp ~/.local/share/Steam++/Plugins/Accelerator/SteamTools.Certificate.cer \
  /usr/local/share/ca-certificates/steamtools.crt
sudo update-ca-certificates

# 6. 加速走 Hosts 模式，需要 /etc/hosts 写权限（二选一）
sudo ~/Steam++/Steam++.sh            # 推荐：每次用 sudo 启动
# sudo chmod a+w /etc/hosts          # 备选：放宽权限，有安全风险
```

浏览器还需手动信任证书：

- **Firefox**：`about:preferences#privacy` → 查看证书 → 证书颁发机构 → 导入 `SteamTools.Certificate.cer` → 勾选「信任由此证书颁发机构来标识网站」
- **Chrome / Edge**：`chrome://settings/certificates` → 授权机构 → 导入 → 勾选「信任该证书，以标识网站身份」

> 其他坑：证书文件在首次启动后才生成；`update-ca-certificates` 漏掉 `sudo` 会静默失败；若点加速仍不生效，可在界面**关闭 DoH**（部分网络下 `dns.google`、`1.1.1.1` 不可达会导致 DoH 测试超时）。

### 系统增强 *

- [Minimon Applet](https://github.com/cosmic-utils/minimon-applet) —— 顶栏状态监控组件
- [Papyrus](https://github.com/PSGtatitos/papyrus) / [Fresco](https://fresco.dibbayajyoti.com/) —— 适用的动态壁纸
- [Zsh](https://www.zsh.org/) —— 强大的 shell

### 应用开发

- [VS Code](https://code.visualstudio.com/Download) —— 可扩展的代码编辑器
- [OpenCode](https://opencode.ai/download) —— AI Agent工具
- [OpenChamber](https://openchamber.dev/download) —— 强大的OpenCode GUI

### 媒体娱乐

- [COSMIC Camera](https://github.com/cosmic-utils/cosmic-ext-camera) —— 支持扫描的相机
- [Piliplus](https://github.com/bggRGjQaUbCoE/PiliPlus/releases/) —— 第三方B站客户端
- [Steam](https://store.steampowered.com/about/) —— 蒸汽游戏平台
- [OBS Studio](https://obsproject.com/download) —— 强大录屏软件
- [Readest](https://readest.com/download) —— 跨平台读书软件

