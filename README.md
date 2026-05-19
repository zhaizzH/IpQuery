# IP 地址查询

基于 Cloudflare Workers 的 IP 地址归属地与网络信息查询工具，支持双数据源切换。

## 功能

- **IP 归属地查询** — 国家、省份、城市、区县
- **网络信息** — 运营商、ASN、IP 类型、时区
- **坐标定位** — 经纬度坐标，一键跳转 Google 地图
- **双数据源** — ip9.com.cn（国内）和 ip.sb（国际），自动根据访客所在地选择
- **移动端适配** — 响应式设计，全端可用

## 部署

### 前置要求

- [Cloudflare 账号](https://dash.cloudflare.com)
- [Node.js](https://nodejs.org/) 16+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

### 安装

```bash
# 安装 wrangler
npm install -g wrangler

# 登录 Cloudflare
wrangler login
```

### 部署

#### 方式一：Wrangler CLI

```bash
# 部署到 Cloudflare Workers
wrangler deploy
```

#### 方式二：GitHub 集成（推荐）

无需本地安装任何工具，直接在 Cloudflare Dashboard 中连接 GitHub 仓库自动部署：

1. **推送代码到 GitHub**
   ```bash
   git init
   git add .
   git commit -m "init: IP 地址查询工具"
   git remote add origin https://github.com/<用户名>/<仓库名>.git
   git push -u origin main
   ```

2. **进入 Cloudflare Workers Dashboard**
   - 打开 https://dash.cloudflare.com/ → Workers 和 Pages
   - 点击 **创建** → **Worker** → **部署** 标签页

3. **连接 GitHub 仓库**
   - 点击 **Continue with GitHub**（或通过 Git 集成）
   - 授权 Cloudflare 访问你的 GitHub 账号
   - 选择刚才推送的仓库
   - 分支选择 `main`

4. **配置构建**
   - 框架预设：无
   - 构建命令：默认
   - 构建输出：默认
   - 部署分支：`main`

5. **完成部署**
   - 点击 **保存并部署**
   - Cloudflare 会自动拉取代码并部署
   - 以后每次推送 `main` 分支都会自动重新部署

### 开发

```bash
# 本地开发
wrangler dev
```

## 配置

在 `wrangler.toml` 中可配置 Workers 名称、路由等参数。

## API

### `GET /api/query`

查询 IP 地址信息。

**参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| `ip` | string | 要查询的 IP（可选，留空查询访客自身 IP） |
| `source` | string | 数据源：`auto`（默认）、`ip9`、`ipsb` |

**示例**

```bash
curl "https://your-worker.example.com/api/query?ip=8.8.8.8&source=ipsb"
```

**响应**

```json
{
  "success": true,
  "data": {
    "ip": "8.8.8.8",
    "country": "United States",
    "countryCode": "US",
    "region": "California",
    "city": "Mountain View",
    "isp": "Google LLC",
    "org": "Google LLC",
    "asn": "AS15169",
    "lat": 37.4056,
    "lng": -122.0775
  },
  "source": "ip.sb"
}
```

## 技术栈

- [Cloudflare Workers](https://workers.cloudflare.com/)
- [ip9.com.cn](https://ip9.com.cn) / [ip.sb](https://ip.sb) API

## License

[MIT](./LICENSE)
