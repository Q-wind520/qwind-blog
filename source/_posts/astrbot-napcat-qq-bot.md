---
title: "部署 QQ 机器人：AstrBot + NapCat 记录"
date: 2026-11-12 12:00:00
tags: [AI, QQ, Docker, 教程]
---

> **一句话部署提示词：** 用 Docker 部署 AstrBot + NapCat 并接通 OneBot v11.

AstrBot 管对话，NapCat 管 QQ 协议。两个 Docker 容器通过 OneBot v11 反向 WebSocket 连接，就能得到一个能私聊、能进群的 QQ 机器人。

NapCat 走的是个人 QQ 的 NTQQ 协议，有风控和封号风险，别拿主号试。

## 架构

```text
QQ ↔ NapCat（Docker） ↔ OneBot v11 反向 WS ↔ AstrBot（Docker） ↔ 模型 API
```

AstrBot 是服务端，NapCat 是客户端，所以 NapCat 主动连 AstrBot 的 `6199` 端口。不用给 NapCat 开公网端口。

## 准备

环境：Pop!_OS 24.04、AstrBot 4.29.4、Docker 29.1.3、Compose 2.40.3。

```bash
mkdir -p ~/docker/bot-stack/{astrbot,napcat}
docker network create --subnet 172.18.0.0/16 botnet
```

`172.18` 被占用就换网段，后面 compose 的 IP 一起改。

国内拉不动 Docker Hub 可以套镜像前缀：

```bash
docker pull m.daocloud.io/docker.io/soulter/astrbot:latest
docker tag m.daocloud.io/docker.io/soulter/astrbot:latest soulter/astrbot:latest
```

## NapCat

`~/docker/bot-stack/napcat/compose.yml`：

```yaml
services:
  napcat:
    image: mlikiowa/napcat-docker:latest
    container_name: napcat
    hostname: qq-bot
    restart: unless-stopped
    environment:
      - NAPCAT_UID=${NAPCAT_UID:-1000}
      - NAPCAT_GID=${NAPCAT_GID:-1000}
      - MODE=astrbot
      - ACCOUNT=123456789
      - WEBUI_TOKEN=${WEBUI_TOKEN}
    ports:
      - "127.0.0.1:6099:6099"
    volumes:
      - ./data/config:/app/napcat/config
      - ./data/qq:/app/.config/QQ
      - ./data/plugins:/app/napcat/plugins
      - /etc/machine-id:/etc/machine-id:ro
    networks:
      botnet:
        ipv4_address: 172.18.0.3
        mac_address: "00:1b:21:3c:4d:5e"

networks:
  botnet:
    external: true
```

- `MODE=astrbot`：套用 AstrBot 的连接模板。
- `ACCOUNT`：机器人 QQ 号，重启时尝试快速登录，第一次仍要扫码。
- `WEBUI_TOKEN`：NapCat WebUI 的 token，从 `.env` 读。
- `6099` 只绑本机，别暴露到公网。
- `hostname`、`mac_address`、`ipv4_address`、`machine-id` 用来固定设备指纹，后面讲。

启动：

```bash
cd ~/docker/bot-stack/napcat
printf 'NAPCAT_UID=%s\nNAPCAT_GID=%s\nWEBUI_TOKEN=%s\n' \
  "$(id -u)" "$(id -g)" "$(openssl rand -hex 16)" > .env

docker compose up -d
docker logs -f napcat
```

WebUI：`http://127.0.0.1:6099/webui`。Token：

```bash
grep '^WEBUI_TOKEN=' ~/docker/bot-stack/napcat/.env
```

远程服务器用 SSH 隧道，别直接开 `6099`：

```bash
ssh -L 6099:127.0.0.1:6099 用户名@服务器地址
```

### 扫码

**二维码只认手机 QQ 当前登录的账号，不会让你选号。** 顺序：

1. 手机 QQ 切到机器人号；
2. 扫码；
3. 确认 NapCat 里显示的是机器人号；
4. 手机切回自己的号。

手机和 NapCat 可以同时在线；同一个号登在两个电脑版/NTQQ 客户端上会互踢。

### OneBot

NapCat WebUI → 网络配置 → 新建 → WebSockets 客户端：

| 项 | 值 |
| --- | --- |
| 启用 | 开 |
| URL | `ws://astrbot:6199/ws` |
| Token | 和 AstrBot 平台里填的一致 |
| 消息格式 | array |
| 上报自身消息 | 关 |
| 心跳/重连 | 30000 |

如果 `MODE=astrbot` 已经生成了一条，检查 token 即可，不用重复建。

## AstrBot

`~/docker/bot-stack/astrbot/compose.yml`：

```yaml
services:
  astrbot:
    image: soulter/astrbot:latest
    container_name: astrbot
    restart: unless-stopped
    security_opt:
      - no-new-privileges:true
    environment:
      - TZ=Asia/Shanghai
      - PYTHONPATH=/AstrBot/data/python-deps
    ports:
      - "127.0.0.1:6185:6185"
      - "127.0.0.1:6199:6199"
    volumes:
      - ${HOME}/.astrbot/data:/AstrBot/data
      - /etc/localtime:/etc/localtime:ro
    networks:
      botnet:
        ipv4_address: 172.18.0.4
    extra_hosts:
      - "host.docker.internal:host-gateway"

networks:
  botnet:
    external: true
```

- `${HOME}/.astrbot/data` 是数据目录，插件、人格、数据库都在里面。用 `sudo` 跑时 `${HOME}` 可能变成 `/root`，建议写绝对路径。
- `6185` 是 WebUI，`6199` 是反向 WebSocket，都只绑本机。
- `PYTHONPATH` 让额外的 Python 依赖装进数据目录，容器重建不丢。
- `extra_hosts` 给宿主机服务用，比如本地 TTS，用不到可以删。

启动：

```bash
cd ~/docker/bot-stack/astrbot
docker compose up -d
docker logs -f astrbot
```

日志里找初始账号和随机密码：

```text
➜  Initial username: astrbot
➜  Initial password: 一串随机字符
```

登录 `http://127.0.0.1:6185`，马上改强密码。远程用：

```bash
ssh -L 6185:127.0.0.1:6185 用户名@服务器地址
```

### 平台

WebUI → 机器人 → 创建机器人 → OneBot v11：

| 项 | 值 |
| --- | --- |
| ID | napcat |
| 启用 | 开 |
| 反向 WebSocket 主机 | `0.0.0.0` |
| 反向 WebSocket 端口 | `6199` |
| 反向 WebSocket Token | 和 NapCat 一致 |

日志出现下面这句就成功了：

```text
aiocqhttp(OneBot v11) 适配器已连接。
```

### 模型

WebUI → 服务提供商 → 新增，填 API Key、Base URL、模型名，设为默认。DeepSeek 用 `https://api.deepseek.com/v1`；Ollama 用 `http://host.docker.internal:11434/v1`。

私聊发“你好”，群里 @ 它或用 `/你好`。默认唤醒前缀是 `/`。

## 踩坑

### 扫错号

我第一次扫码时，手机还登在自己的号上，NapCat 直接登进了我的个人号，然后被电脑上的 QQ 踢下线。二维码不会问你登哪个号，一定要先切机器人号再扫。

| 提示 | 意思 | 处理 |
| --- | --- | --- |
| `您的账号已在另一台终端登录` | 同一个号在另一个电脑版/NTQQ 客户端登录 | 退出另一个客户端 |
| `你的账号当前登录已失效` | QQ 把 NapCat 的会话 token 判失效 | 重新扫码；检查手机是否切换过账号 |
| 扫码后一直循环二维码 | 扫的号不对，或会话已失效 | 确认手机当前是机器人号 |

机器人号最好专用，别长期挂在手机上。

### 设备指纹

NapCat 频繁掉线，日志里只有 `KickedOffLine`，原因是容器每次重建都换了一套“设备”：

| 项 | 默认 | 固定后 |
| --- | --- | --- |
| hostname | 随机容器 ID | `qq-bot` |
| MAC | 每次重建随机 | `00:1b:21:3c:4d:5e` |
| machine-id | 镜像通用值 | 挂载宿主机 `/etc/machine-id` |
| IP | 可能漂移 | `172.18.0.3` |

QQ 把这些当设备指纹，每次重建都像换了台新电脑，风控就容易踢人。固定之后还要再扫一次码；以后别随手改这几项，改一次等于换一台设备。

不要直接用宿主机的物理 MAC，会和宿主机在桥接层撞 MAC。固定一个正常的、不重复的地址就行。

### 固定 IP 撞车

NapCat 固定了 `172.18.0.3`，但 AstrBot 是自动分配。某次 NapCat 停着，AstrBot 把 `.3` 占了，再启动 NapCat 就报 `Address already in use`。

要固定就两个都固定：

```yaml
# napcat
ipv4_address: 172.18.0.3

# astrbot
ipv4_address: 172.18.0.4
```

确认：

```bash
docker network inspect botnet
```

### 插件没反应

AstrBot 的配置档案里有个 `plugin_set` 白名单，它不只控制指令，还会过滤插件的 LLM 请求钩子和工具。插件没进白名单时，日志显示加载成功，但 `send_meme`、人设注入、记忆钩子都不会执行。

去 WebUI 的配置档案里把插件名加进 `plugin_set`，或者新建档案时选全量插件。改完重启 AstrBot。

另外有些插件自带 `bot_filter`，只对 `napcat` 或官方机器人生效，也检查一下。

### 语音和测试对话

语音插件如果有 `private_only`，默认只在私聊触发；群里要用就改成 `false`，再加冷却，避免连续合成把机器拖死。

AstrBot WebUI 的“测试对话”走 `webchat` 平台，人格是默认的（我这里是 A.R.O.N.A），不会走 NapCat 上的人设和插件。验证插件要在真实 QQ 会话里发消息，或者用容器里的真实事件测。

### 密码和依赖

忘了 WebUI 密码：

```bash
docker exec -it astrbot astrbot password
```

或者：

```bash
docker exec -it astrbot astrbot conf set dashboard.password "你的新密码"
```

容器重建后，系统 `site-packages` 里的额外依赖会丢。把依赖装到数据目录：

```bash
docker exec -it astrbot pip install --target /AstrBot/data/python-deps 包名
```

compose 里已经配了 `PYTHONPATH=/AstrBot/data/python-deps`。

## 人设和插件

文字聊天跑通再装插件。我加了记忆、表情包、语音，人设是一条有点腹黑的鱼：平时装乖，偶尔留半句，回复拆成几条短气泡，偶尔配张图。

两个注意点：

- `plugin_set` 白名单要放行插件，否则装了也没反应。
- 语音按需启动，加冷却；4G 显卡同时只能跑一个合成任务。

我还给人设加了“不接整文件、长代码分析”的边界，再加一层消息拦截，超过行数直接拒绝。两层比一层可靠。

## 运维

两个 compose 都写了 `restart: unless-stopped`，Docker 也是开机自启：

```bash
systemctl is-enabled docker containerd
docker inspect -f '{{.Name}} {{.HostConfig.RestartPolicy.Name}}' astrbot napcat
```

更新：

```bash
cd ~/docker/bot-stack/astrbot && docker compose pull && docker compose up -d
cd ~/docker/bot-stack/napcat && docker compose pull && docker compose up -d
```

备份 AstrBot 数据，先停容器再打包：

```bash
cd ~/docker/bot-stack/astrbot
docker compose stop
tar -czf ~/backup/astrbot-data-$(date +%F).tar.gz -C ~/.astrbot data
docker compose start
```

NapCat 的 `napcat/data` 是登录态和配置，也可以备份，但含账号敏感信息，别乱放。

## 后言

部署本身不难，难的是 NapCat 挂着一个真实 QQ 号，会被登录、被踢、被风控。踩完这些坑，它终于能稳定在群里接话。

以上。
