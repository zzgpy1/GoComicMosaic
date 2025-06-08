# 动漫资源共享平台 - Golang后端

这是使用Golang实现的动漫资源共享平台后端

## 项目结构

```
gobackend/
├── cmd/
│   ├── api/                    # API应用入口点
│   │   └── main.go             # API主程序
│   ├── webp/                   # WebP转换工具
│   │   └── main.go             # WebP转换工具主程序
│   ├── diagnostic/             # 诊断工具
│   │   └── main.go             # 数据库诊断程序
│   └── test/                   # 测试工具
├── internal/                   # 内部包
│   ├── config/                 # 配置文件处理
│   │   └── config.go           # 配置加载与管理
│   ├── models/                 # 数据模型
│   │   ├── models.go           # 定义数据模型结构
│   │   └── database.go         # 数据库连接和初始化
│   ├── handlers/               # HTTP处理器
│   │   ├── auth_handlers.go    # 认证相关处理器
│   │   ├── middleware.go       # 中间件
│   │   ├── resource_handlers.go# 资源基本操作处理器
│   │   ├── resource_approval.go# 资源审批和补充处理器
│   │   ├── upload_handlers.go  # 图片上传处理器
│   │   ├── proxy_handler.go    # CORS代理处理器
│   │   ├── info_handlers.go    # 网站信息处理器
│   │   └── routes.go           # 路由定义
│   ├── routes/                 # 路由管理
│   │   └── router.go           # 路由配置
│   ├── auth/                   # 认证工具
│   │   └── auth.go             # JWT认证相关功能
│   └── utils/                  # 工具函数
│       ├── image_utils.go      # 图像处理工具
│       └── webp_utils.go       # WebP转换工具函数
├── go.mod                      # Go模块定义
└── README.md                   # 本文件
```

## 功能特性

- **用户认证**：JWT认证系统，区分普通用户和管理员权限
- **资源管理**：完整的资源CRUD操作
- **审批系统**：资源审批流程（初始审批和补充内容审批）
- **图片处理**：图片上传、处理和WebP转换
- **网站配置**：支持动态管理网站信息（标题、描述、链接等）
- **数据源管理**：管理平台支持的外部数据源配置，包括自定义数据源
- **CORS代理**：提供安全的跨域资源访问服务，支持任意URL代理
- **资源交互**：支持资源点赞功能
- **数据存储**：SQLite数据库支持，方便部署和迁移
- **高效转换**：WebP图像优化（支持静态图像和动画GIF）
- **批量操作**：支持审批记录批量删除等批处理功能

## 技术栈

- Golang 1.21+
- Gin Web框架
- SQLx数据库操作
- SQLite数据库
- JWT认证
- WebP图像处理

## 安装和运行

1. 安装依赖：

```bash
go mod download
```

2. 运行API服务：

```bash
cd cmd/api
go run main.go
```

服务默认在8000端口运行，可以通过环境变量`PORT`修改端口。

3. 环境变量配置：

```
ASSETS_PATH="/path/to/assets" # 设置资源文件存储路径
DB_PATH="/path/to/database.db" # 设置数据库文件路径
PORT="8080" # 设置HTTP服务端口
```

## API 接口

### 认证相关

- `POST /api/auth/token` - 用户登录获取令牌
- `GET /api/auth/me` - 获取当前用户信息
- `POST /api/auth/change-password` - 修改密码

### 资源相关

- `GET /api/resources/public` - 获取公开的已审批资源
- `GET /api/resources/:id` - 获取单个资源详情
- `POST /api/resources/` - 创建新资源
- `PUT /api/resources/:id` - 更新资源（管理员）
- `DELETE /api/resources/:id` - 删除资源（管理员）

### 资源审批

- `GET /api/resources/pending` - 获取待审批资源（管理员）
- `PUT /api/resources/:id/approve` - 审批资源（管理员）
- `GET /api/resources/approval-records` - 获取所有审批记录（管理员）
- `DELETE /api/resources/:id/record` - 删除审批记录（管理员）
- `DELETE /api/resources/batch-delete-records` - 批量删除审批记录（管理员）

### 资源补充

- `POST /api/resources/:id/supplement` - 为资源添加补充内容
- `GET /api/resources/pending-supplements` - 获取待审批补充内容的资源列表（管理员）
- `GET /api/resources/:id/supplement` - 获取资源的补充内容（管理员）
- `GET /api/resources/:id/approval-records` - 获取资源的审批历史（管理员）

### 文件上传

- `POST /api/resources/upload-images` - 上传图片
- `POST /api/admin/upload/favicon` - 上传网站图标

### 点赞功能

- `POST /api/resources/:id/like` - 点赞资源
- `POST /api/resources/:id/unlike` - 取消点赞

### 网站配置管理

- `GET /api/info` - 获取网站配置信息
- `POST /api/admin/info` - 更新网站配置信息（管理员）

### CORS代理

- `GET /proxy` - 跨域代理请求服务，参数：
  - `url`: 要代理的原始URL（必需，需要URL编码）
  - 支持自动转发所有查询参数和请求头

## CORS代理服务

CORS代理服务允许客户端安全地访问外部资源，避免跨域限制：

### 主要特点

- **透明代理**: 无缝转发HTTP请求，支持各种HTTP方法
- **请求头处理**: 智能转发和处理请求头，确保兼容性
- **响应类型处理**: 自动处理和传递内容类型
- **安全性**: 隐藏客户端信息，提供额外安全层
- **错误处理**: 优雅处理各种网络和服务器错误

### 使用方法

```
GET /proxy?url=https://example.com/some-resource
```

URL需要进行URL编码，服务器会自动解码并请求目标资源。

### 安全限制

- 默认仅支持GET请求
- 服务器会验证请求源，防止滥用
- 内置请求频率限制，避免过度消耗资源

## 网站信息管理

系统支持动态管理网站配置信息，包括：

### 可配置项

- **基本信息**: 标题、描述、关键词、图标等
- **页脚设置**: 链接、版权信息、联系方式
- **SEO设置**: 各页面的元标签信息
- **数据源配置**: 内置数据源和外部数据源配置
- **关于页面**: 自定义关于页面内容

### 存储机制

所有配置信息存储在数据库中，支持：
- 实时更新
- 自动缓存
- 版本控制
- 默认值回退

## 初次运行

初次运行会创建默认管理员账号：

- 用户名：admin 
- 密码：admin123

请在登录后及时修改密码。

## WebP 转换工具

本项目包含一个独立的WebP转换工具，可以将多种格式的图像（JPEG、PNG、GIF等）转换为WebP格式，支持静态图像和动画GIF。

### 功能特点

- **多格式支持**：处理JPG、JPEG、PNG、GIF等常见图片格式
- **图像格式自动检测**：不依赖文件扩展名，通过检测文件内容判断实际格式
- **智能尺寸调整**：自动识别图片方向（横/竖），应用最佳尺寸设置
  - 横图（宽>高）：自动调整为1280×720px
  - 竖图（高>宽）：自动调整为600×900px
- **EXIF数据处理**：自动矫正图像方向，移除元数据减小文件大小
- **灵活的输出选项**：可选保留原扩展名或使用.webp扩展名
- **支持动画GIF转WebP**：保留动画效果，同时减小文件体积
- **降级处理**：当外部工具不可用时，自动降级使用内置方法处理
- **批量处理**：支持目录递归处理和并行转换

### 使用方法

#### 编译工具

```bash
cd gobackend
go build -o webp-converter cmd/webp/main.go
```

#### 单图处理

```bash
./webp-converter -img photo.jpg
```

#### 批量处理目录

```bash
./webp-converter -dir ./photos
```

目录处理默认会递归处理子目录。如果不需要递归处理，可以使用：

```bash
./webp-converter -dir ./photos -recursive=false
```

#### JSON列表批量处理

```bash
./webp-converter -json '["path/to/image1.jpg", "path/to/image2.png"]'
```

### 命令行参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `-img` | string | "" | 要转换的单个图片路径 |
| `-dir` | string | "" | 要批量处理的目录路径 |
| `-json` | string | "" | 图片路径的JSON列表 |
| `-recursive` | bool | true | 是否递归处理子目录（仅在使用 `-dir` 时有效） |
| `-ratio` | bool | true | 是否保持原始宽高比 |
| `-w` | int | 0 | 最大宽度（0表示自动判断） |
| `-h` | int | 0 | 最大高度（0表示自动判断） |
| `-keep` | bool | true | 是否保留原始图片 |
| `-webp` | bool | false | 是否使用`.webp`扩展名 |
| `-concurrency` | int | 4 | 并发处理的数量 |
| `-sync` | bool | false | 使用同步模式处理 |

### 动画GIF支持

转换工具支持将动画GIF转换为动画WebP格式，保持原始动画效果的同时减小文件体积。

#### 安装依赖

为了使用动画GIF转WebP功能，您需要安装`libwebp-tools`包：

- **Ubuntu/Debian**:
  ```bash
  sudo apt-get install webp
  ```

- **CentOS/RHEL**:
  ```bash
  sudo yum install libwebp-tools
  ```

- **MacOS**:
  ```bash
  brew install webp
  ```

#### 处理动画GIF

工具会自动检测是否为动画GIF，并选择合适的处理方式：

```bash
./webp-converter -img animated.gif -webp=true
```

如果外部工具`gif2webp`不可用，工具会自动降级为转换静态图像。

## 最近更新内容

- **增强CORS代理服务**：优化跨域代理功能，支持更多内容类型和更复杂的请求
- **网站配置系统改进**：增强网站信息管理功能，支持外部数据源配置存储
- **批量处理功能**：添加审批记录批量删除API和功能
- **数据源配置存储**：将数据源配置从localStorage迁移到数据库
- **性能优化**：改进API响应速度和数据处理效率
- **图像处理增强**：优化WebP转换工具，提高图像处理效率和质量 