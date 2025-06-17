# 动漫资源站点地图生成器

一个用Go语言编写的动漫资源网站站点地图(sitemap.xml)生成工具，替代原有的Node.js实现。

## 功能特性

- 生成符合标准的sitemap.xml文件
- 支持从API获取资源数据
- 支持分页和并发请求处理大量数据
- 自动处理多种API响应格式
- 支持生成分割站点地图和站点地图索引
- 完全兼容原始Node.js实现的功能

## 安装

### 从源码编译

```bash
# 克隆仓库
git clone https://github.com/fish2018/GoComicMosaic/
cd GoComicMosaic/sitemap-generator

# 安装依赖并构建
go mod tidy
go build -o sitemap-generator

# 可选：安装到系统路径
sudo mv sitemap-generator /usr/local/bin/
```

### 在Docker环境中使用

将工具添加到Dockerfile中:

```dockerfile
# 将sitemap生成器添加到构建阶段
COPY sitemap-generator/ /app/sitemap-generator/
WORKDIR /app/sitemap-generator
RUN go mod download
RUN go build -o sitemap-generator

# 复制到最终镜像
COPY --from=builder /app/sitemap-generator/sitemap-generator /app/
```

## 使用方法

```bash
# 基本用法
./sitemap-generator

# 指定基础URL
./sitemap-generator --baseurl https://yourdomain.com

# 指定API URL和输出目录
./sitemap-generator --api https://api.yourdomain.com --output ./public
```

## Docker集成

在您的Dockerfile中，可以这样集成：

```dockerfile
# 在构建阶段
COPY sitemap-generator/ /app/sitemap-generator/
WORKDIR /app/sitemap-generator
RUN go mod download
RUN go build -o sitemap-generator

# 复制到最终镜像
COPY --from=builder /app/sitemap-generator/sitemap-generator /app/
```

## 自动化定时生成

可以在容器启动脚本中添加：

```bash
# 生成初始sitemap
/app/sitemap-generator -b ${DOMAIN} -o /usr/share/nginx/html/static

# 设置定时任务
echo "0 3 * * * /app/sitemap-generator -b ${DOMAIN} -o /usr/share/nginx/html/static" > /etc/crontabs/root
crond
```