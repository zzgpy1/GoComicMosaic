# 动漫资源共享平台 - Golang后端

这是使用Golang重构的动漫资源共享平台后端，原后端使用Python FastAPI实现。

## 项目结构

```
gobackend/
├── cmd/
│   └── api/                    # 应用入口点
│       └── main.go             # 主程序
├── config/                     # 配置文件
├── internal/                   # 内部包
│   ├── models/                 # 数据模型
│   │   ├── models.go           # 定义数据模型结构
│   │   └── database.go         # 数据库连接和初始化
│   ├── handlers/               # HTTP处理器
│   │   ├── auth_handlers.go    # 认证相关处理器
│   │   ├── middleware.go       # 中间件
│   │   ├── resource_handlers.go# 资源基本操作处理器
│   │   ├── resource_approval.go# 资源审批和补充处理器
│   │   ├── upload_handlers.go  # 图片上传处理器
│   │   └── routes.go           # 路由定义
│   ├── auth/                   # 认证工具
│   │   └── auth.go             # JWT认证相关功能
│   └── utils/                  # 工具函数
│       └── image_utils.go      # 图像处理工具
├── go.mod                      # Go模块定义
└── README.md                   # 本文件
```

## 功能特性

- JWT认证系统，区分普通用户和管理员权限
- 完整的资源CRUD操作
- 资源审批流程（初始审批和补充内容审批）
- 图片上传和处理
- 资源点赞功能
- SQLite数据库支持

## 技术栈

- Golang 1.21+
- Gin Web框架
- SQLx数据库操作
- SQLite数据库
- JWT认证

## 安装和运行

1. 安装依赖：

```bash
go mod download
```

2. 运行服务：

```bash
cd cmd/api
go run main.go
```

服务默认在8000端口运行，可以通过环境变量`PORT`修改端口。

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
- `DELETE /api/resources/:id/record` - 删除审批记录（管理员）

### 资源补充

- `POST /api/resources/:id/supplement` - 为资源添加补充内容
- `GET /api/resources/pending-supplements` - 获取待审批补充内容的资源列表（管理员）
- `GET /api/resources/:id/supplement` - 获取资源的补充内容（管理员）

### 文件上传

- `POST /api/resources/upload-images` - 上传图片

### 点赞功能

- `POST /api/resources/:id/like` - 点赞资源
- `POST /api/resources/:id/unlike` - 取消点赞

## 初次运行

初次运行会创建默认管理员账号：

- 用户名：admin 
- 密码：admin123

请在登录后及时修改密码。 