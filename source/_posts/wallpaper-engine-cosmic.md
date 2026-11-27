---
title: "在 COSMIC 上跑 Wallpaper Engine 的网页和场景壁纸"
date: 2026-10-31 15:59:22
tags: [Linux, Wallpaper, 教程]
---

Steam 创意工坊的壁纸有四种：视频、网页、场景、应用程序。Linux Wayland 上长期只有「视频」能跑。

## 四种格式分别是什么

- **视频**：普通媒体文件，唯一能直接播放的。
- **网页**：就是本地网页。我试的那张是 Unity WebGL 导出（`.wasm` 22MB + `.data` 30MB），需要一个支持 WebGL2 / WASM 的 Chromium 内核。
- **场景**：`scene.pkg` 自研容器，里面是场景图、材质、粒子、编译后的 DXBC 着色器、字体和声音，属于 2D 场景。
- **应用程序**：exe，Linux 只能靠 Wine / Proton。

Wayland 没有 root window，壁纸必须走 `zwlr_layer_shell_v1` 的 background 层。COSMIC 恰好实现了这个协议（`cosmic-bg` 自己就用它画背景），很适合跑这类工具。

## 步骤

方案是 Waywallen + open-wallpaper-engine 插件。

1. 装 Waywallen（Flathub）并放行 Steam 目录：

```bash
flatpak install flathub org.waywallen.waywallen
flatpak override --user \
  --filesystem=/path/to/Steam/library \
  --filesystem="$HOME/.local/share/Steam" \
  --talk-name='org.mpris.MediaPlayer2.*' \
  org.waywallen.waywallen
```

2. 把 OWE 插件装到 `~/.var/app/org.waywallen.waywallen/data/waywallen/plugins/org.waywallen.open-wallpaper-engine/`。
3. Flatpak 沙箱里建不了 layer-shell 背景层，要在宿主机额外跑 `waywallen-layer-shell`，并配 XDG autostart——Waywallen 自带的门户自启在 COSMIC 上会失败。
4. 混合显卡（我的是 GTX 1650 + AMD 核显）要关掉共享纹理，否则网页壁纸容易黑屏：

```toml
# ~/.var/app/org.waywallen.waywallen/config/waywallen/config.toml
[plugin.weweb-renderer]
shared_texture_enabled = "false"
```

## 结果

三张实测都跑通了：两张场景（其中一张有 126 个节点、72 个文字层、17 个特效），一张 Unity WebGL 网页壁纸，鼠标跟随和背景音乐都正常。

屏幕是 1080p，默认却按 4K 内部渲染再缩放，网页壁纸约占 21% GPU——把 `resolution` 改成 1080p、`fps` 改成 60 更划算。

上游还有几个现成的问题可以提：`parallaxDepth` 被当成 bool 解析、文字层 `padding` 类型警告、Flatpak + COSMIC 的 layer-shell 启动方式。
