# 美漫资源共享平台 - 前端

这是美漫资源共建平台前端项目，使用Vue.js实现

## 功能特点

- **资源共建**：提交资源功能，支持上传配图、资源链接等信息
- **剧集探索**：支持查看分季和分集信息，便于用户浏览多集内容
- **响应式设计**：支持桌面端和移动端访问
- **外部数据源系统**：在线点播功能支持采集接口和自定义爬虫
- **CORS代理服务**：内置代理功能，解决跨域问题
- **网站配置**：支持自定义网站信息、图标等
- **推荐功能**：欧美动漫推荐首页
- **文章功能**：支持markdown格式文章

## 项目结构

```
frontend/
├── README.md                           # 项目说明文档
├── public/                             # 静态资源目录
│   ├── apple-touch-icon.png            # 苹果设备触摸图标
│   ├── favicon.ico                     # 网站图标
│   ├── index.html                      # 主HTML模板
│   ├── robots.txt                      # 搜索引擎爬虫配置
│   ├── sitemap.xml                     # 网站地图
│   └── test-settings-api.html          # 测试设置API的HTML
├── scripts/                            # 脚本目录
│   └── generate-sitemap.js             # 生成网站地图脚本
├── src/                                # 源代码目录
│   ├── assets/                         # 资源文件目录
│   ├── components/                     # 组件目录
│   │   ├── EpisodeOverview.vue         # 剧集概览组件
│   │   ├── EpisodeSelector.vue         # 剧集选择器组件
│   │   ├── LazyImage.vue               # 懒加载图片组件
│   │   ├── LocalSearch.vue             # 本地搜索组件
│   │   ├── RecommendationContainer.vue # 推荐容器组件
│   │   ├── RecommendationHome.vue      # 推荐主页组件
│   │   ├── ShareResource.vue           # 资源分享组件
│   │   └── VideoPlayer.vue             # 视频播放器组件
│   ├── router/                         # 路由目录
│   │   └── index.js                    # 路由定义文件
│   ├── services/                       # 服务目录
│   │   └── TmdbStatusService.js        # TMDB状态服务
│   ├── styles/                         # 样式目录
│   │   ├── About.css                   # 关于页面样式
│   │   ├── Admin.css                   # 管理页面样式
│   │   ├── App.css                     # 应用主样式
│   │   ├── EpisodeOverview.css         # 剧集概览样式
│   │   ├── EpisodeSelector.css         # 剧集选择器样式
│   │   ├── Home.css                    # 首页样式
│   │   ├── LocalSearch.css             # 本地搜索样式
│   │   ├── Login.css                   # 登录页面样式
│   │   ├── ResourceDetail.css          # 资源详情样式
│   │   ├── ResourceReview.css          # 资源审核样式
│   │   ├── ShareResource.css           # 资源分享样式
│   │   ├── ShareResourceGlobal.css     # 资源分享全局样式
│   │   ├── StreamsPage.css             # 流媒体页面样式
│   │   ├── SubmitResource.css          # 提交资源样式
│   │   ├── TMDBSearch.css              # TMDB搜索样式
│   │   └── VideoPlayer.css             # 视频播放器样式
│   ├── utils/                          # 工具函数目录
│   │   ├── dataSources/                # 数据源目录
│   │   │   └── index.js                # 数据源索引文件
│   │   ├── InfoManager.js              # 信息管理工具
│   │   ├── api.js                      # API请求工具
│   │   ├── auth.js                     # 认证工具
│   │   ├── corsProxy.js                # CORS代理工具
│   │   ├── dataSourceFactory.js        # 数据源工厂
│   │   ├── dataSourceManager.js        # 数据源管理器
│   │   ├── dataSourcesConfig.js        # 数据源配置
│   │   ├── externalDataSourceLoader.js # 外部数据源加载器
│   │   ├── externalLibLoader.js        # 外部库加载器
│   │   ├── icons.js                    # 图标工具
│   │   ├── imageUtils.js               # 图片工具
│   │   └── libLoader.js                # 库加载器
│   ├── views/                          # 视图目录
│   │   ├── About.vue                   # 关于页面
│   │   ├── Admin.vue                   # 管理页面
│   │   ├── Home.vue                    # 首页
│   │   ├── Login.vue                   # 登录页面
│   │   ├── ResourceDetail.vue          # 资源详情页面
│   │   ├── ResourceReview.vue          # 资源审核页面
│   │   ├── StreamsPage.vue             # 流媒体页面（更新：添加返回推荐功能）
│   │   ├── SubmitResource.vue          # 提交资源页面
│   │   └── TMDBSearch.vue              # TMDB搜索页面
│   ├── App.vue                         # 应用根组件（更新：添加返回推荐按钮及状态管理）
│   └── main.js                         # 应用入口文件
├── index.html                          # 项目HTML入口
├── package.json                        # 项目依赖配置
├── package-lock.json                   # 依赖锁定文件
└── vite.config.js                      # Vite配置文件
```

## 安装与运行

1. 安装依赖：

```bash
npm install
```

2. 开发模式运行：

```bash
npm run dev
```

3. 构建生产版本：

```bash
npm run build
```

## 配置项

在`.env`文件中可配置以下项：

```
BASE_URL=https://dm.xueximeng.com # 用于生成sitemap.xml，默认 http://localhost:8000
ASSETS_PATH=../data/assets # 指定本地图片路径，默认 "../assets"
```

## 环境要求

- Node.js 16+
- npm 7+
