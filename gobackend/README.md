# 动漫资源共享平台 - Golang后端

这是使用Golang实现的动漫资源共享平台后端，原后端使用Python FastAPI实现。

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
│       ├── image_utils.go      # 图像处理工具
│       └── webp_utils.go       # WebP转换工具函数
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
- WebP图像转换（支持静态图像和动画GIF）

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

### 性能优化建议

1. **调整并发数量**：根据机器性能调整`-concurrency`参数
2. **批量处理大量文件**：对大型目录建议分批处理或增加并发数
3. **内存使用优化**：处理超大图片时建议单独处理，避免内存溢出 