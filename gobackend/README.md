# 动漫资源共享平台 - Go 后端

这是动漫资源共享平台的Go后端实现。

## 功能特点

- **资源管理**：支持资源的新增、修改、查询、删除
- **资源审核**：支持资源的审核流程，包括审核、驳回
- **用户认证**：支持用户登录、注册、权限管理
- **文件上传**：支持图片上传、文件存储
- **图片处理**：图片自动转WebP格式，支持批量处理
- **数据库集成**：使用pgx驱动的PostgreSQL数据库
- **CORS代理**：内置代理功能，解决前端跨域问题
- **网站配置**：支持自定义网站信息、图标等
- **TMDB集成**：支持配置TMDB API密钥，提供TMDB数据访问接口

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
│   │   ├── site_settings_handlers.go # 网站设置处理
│   │   ├── tmdb_handlers.go        # TMDB API处理
│   │   └── routes.go           # 路由定义
│   ├── auth/                   # 认证工具
│   │   └── auth.go             # JWT认证相关功能
│   └── utils/                  # 工具函数
│       ├── image_utils.go      # 图像处理工具
│       ├── config.go           # 配置工具
│       ├── tmdb.go             # TMDB API工具
│       └── webp_utils.go       # WebP转换工具函数
├── go.mod                      # Go模块定义
├── go.sum                      # Go依赖版本锁定
└── README.md                   # 本文件
```

## API文档

### 资源管理API

- `GET /api/resources` - 获取资源列表
- `GET /api/resources/:id` - 获取资源详情
- `POST /api/resources` - 创建新资源
- `PUT /api/resources/:id` - 更新资源
- `DELETE /api/resources/:id` - 删除资源
- `GET /api/resources/:id/supplements` - 获取资源补充内容
- `POST /api/resources/:id/supplements` - 添加资源补充内容

### 资源审核API

- `GET /api/admin/approval` - 获取待审核资源列表
- `POST /api/admin/approval/:id/approve` - 审核通过资源
- `POST /api/admin/approval/:id/reject` - 驳回资源
- `POST /api/admin/approval/:id/supplement/approve` - 审核通过资源补充
- `POST /api/admin/approval/:id/supplement/reject` - 驳回资源补充

### 用户认证API

- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `GET /api/auth/verify` - 验证用户Token
- `POST /api/auth/logout` - 用户登出

### 文件上传API

- `POST /api/upload` - 上传文件
- `GET /api/files/:filename` - 获取文件

### 网站配置API

- `GET /api/site/settings` - 获取网站配置
- `POST /api/admin/site/settings` - 更新网站配置

### TMDB API相关

- `GET /api/admin/tmdb/config` - 获取当前TMDB配置
- `POST /api/admin/tmdb/config` - 更新TMDB配置信息

### 代理API

- `GET /api/proxy` - 代理请求，用于解决跨域问题

## 安装与运行

### 环境要求

- Go 1.20+
- PostgreSQL 14+
- libwebp (用于WebP图片转换)

### 配置

复制`.env.example`文件为`.env`，并根据需求修改配置：

```bash
cp .env.example .env
```

主要配置项：

```
PORT=8000
ASSETS_PATH="../data/assets" # 默认 '../assets'
DB_PATH="../data/resource_hub.db" # 默认gobackend目录下
TMDB_API_KEY=your_tmdb_api_key # 此处可选，也可通过管理界面配置
```

## 图片处理功能

系统具有强大的图片处理能力，主要特点：

1. **自动WebP转换**：所有上传的图片会自动转换为WebP格式，显著减小文件大小
2. **批量处理**：支持批量处理多张图片
3. **异步处理**：图片转换在后台异步进行，不阻塞主程序
4. **格式兼容**：支持从JPEG、PNG、GIF等格式转换
5. **质量控制**：可配置WebP转换质量

## TMDB集成功能

系统集成了TMDB(The Movie Database)API，提供以下功能：

1. **API密钥管理**：支持通过管理界面配置TMDB API密钥，优先级高于环境变量
2. **搜索功能**：支持搜索TMDB中的电影和剧集信息
3. **详情获取**：获取TMDB影视作品的详细信息
4. **图片处理**：支持导入和处理TMDB提供的海报和背景图
5. **权限控制**：TMDB配置管理需要管理员权限

### TMDB配置优先级

系统按以下优先级获取TMDB API密钥：
1. 数据库中存储的配置（通过管理界面设置）
2. 环境变量`TMDB_API_KEY`
3. 默认值（如果有配置）

## CORS代理功能

为支持外部数据源访问，系统集成了CORS代理服务：

### 主要特点：

- **透明调用**：自动处理所有外部请求的跨域问题
- **统一格式**：简单的API格式 `/api/proxy?url=原始URL`
- **自动编码**：自动处理URL编码/解码
- **安全处理**：隐藏客户端信息，防止敏感信息泄露

## 贡献指南

欢迎提交PR或Issue来完善项目。请确保提交的代码经过了测试并遵循项目的代码风格规范。

## 开源许可

本项目使用MIT许可证 