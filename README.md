# GoComicMosaic
一款开源美漫共建平台，不同用户可以自由提交动漫信息(标题、类型、简介、图片、资源链接)，像马赛克一样，由多方贡献拼凑成完整资源。当然程序本身是通用的，用来做电影、剧集、综艺等等都可以。  

正式上线地址：https://dm.xueximeng.com/  
套CF CDN地址：https://mm.252035.xyz/

Demo演示（每小时重置1次数据）：https://demo.xueximeng.com/  
管理员账号：admin / admin123  

如果喜欢，点个star  

---

## Docker一键部署

```
docker run -d --name dongman \
  -p 80:80 -p 443:443 \
  -v /your/local/path:/app/data \
  -e DOMAIN=your-domain.com \
  2011820123/gcm:latest
```

如需启用HTTPS，需要在挂载目录中放置SSL证书：

1. 创建SSL证书目录：
   ```bash
   mkdir -p /your/local/path/ssl
   ```

2. 复制证书文件（必须使用这些文件名）：
   ```bash
   cp /path/to/your/fullchain.pem /your/local/path/ssl/
   cp /path/to/your/privkey.pem /your/local/path/ssl/
   ```


## 适配移动端样式
移动端也可以更好的体验美漫共建小站了

![移动端|237x499](docs/1.gif)

## 首页
![image|690x397](docs/2.jpg)

可以根据资源中文名、英文名、简介进行搜索
![首页|690x392](docs/3.gif)

## 详情页
![image|690x398](docs/4.jpg)

可以切换查看图片，选择网盘标签，一键复制网盘链接密码
![详情页|690x392](docs/5.gif)

## 关于本站
![关于|690x392](docs/6.gif)

## 提交资源
这个才是资源共建平台的核心，点击右上角的'提交资源'，用户可以随意提交自己喜欢的动漫资源，如果网站还不存该美漫时，会是一个新建资源的表单，需要填写中文名、英文名、类型、简介等基础信息。提交后，要等管理员在后台审批完才会在首页显示

### 提交-新建资源
![image|690x384](docs/7.jpg)  
![image|690x379](docs/8.jpg)  

网盘链接和图片都可以提交多个
![提交资源|690x392](docs/9.gif)

### 提交-补充资源
顾名思义，就是对已经存在的动漫资源补充一些信息，主要是图片、资源链接
补充提交有2个入口，一个是右上角的'提交资源'，搜索已经存在的动漫名，然后选择确认即可
![image|690x396](docs/10.jpg)  

![补充资源|690x392](docs/11.gif)

从资源详情页点击'补充资源'按钮，不用自己再搜索选择了，自动绑定对应的动漫
![详情页补充|690x392](docs/12.gif)

## 管理员登录
不用多说了，就是输入账号密码，初始密码登录后可修改

![image|690x401](docs/13.jpg)

## 管理控制台
主要用于审批用户提交的资源

![image|690x398](docs/14.jpg)

审批用户提交的资源
![后台审批|690x391](docs/15.gif)

## 资源编辑(管理员权限)
管理员在动漫详情页面，可以进行编辑，修改中英文标题、简介、类型、图片增删、海报设置、修改添加资源链接等
![image|690x365](docs/16.jpg)  
![image|690x303](docs/17.jpg)  

![详情编辑|690x391](docs/18.gif)

## 新增喜欢按钮
在详情页可以点击喜欢
![image|690x370](docs/19.jpg)
首页可以根据喜欢数量排序，默认按最新发布排序
![image|690x397](docs/20.jpg)

## 新增分页
![image|690x397](docs/21.jpg)

## 新增在线点播功能
![image|690x397](docs/22.gif)

## 优化检测
![image|690x397](docs/23.jpg)

## 调整底栏
- 添加在线点播
- 添加访问统计
- 添加友链
![image|690x397](docs/24.jpg)

## 详情页剧照点击放大查看
![image|690x397](docs/25.gif)

## 全面支持管理后台设置网站信息和采集解析源
![image|690x397](docs/26.gif)

## 支持外挂在线播放数据源
会写爬虫的用户可以自己添加数据源，更加灵活
![image|690x397](docs/27.gif)

---

# 美漫资源共建平台部署

本教程将指导您如何将前端和后端代码部署到 `/home/work/dongman` 目录，并使用nginx配置同一个域名 `https://dm.xueximeng.com`。

## 一、目录结构

首先创建所需的目录结构：

```bash
/home/work/dongman/
├── assets/                   # 资源文件目录（用户上传的图片）
│   ├── imgs/
│   └── uploads/
├── gobackend/
│   ├── cmd/                  # 应用入口点
│   │   ├── api/              # API服务入口
│   │   │   └── main.go       # 主程序
│   │   ├── diagnostic/       # 诊断工具
│   │   ├── test/             # 测试工具
│   │   └── webp/             # WebP图片转换工具
│   │       └── main.go       # WebP转换命令行工具
│   ├── internal/             # 内部包
│   │   ├── auth/             # 认证工具
│   │   │   └── auth.go       # JWT认证相关功能
│   │   ├── models/           # 数据模型
│   │   │   ├── models.go     # 数据模型结构定义
│   │   │   └── database.go   # 数据库连接和初始化
│   │   ├── handlers/         # HTTP处理器
│   │   │   ├── auth_handlers.go  # 认证相关处理器
│   │   │   ├── proxy_handler.go  # CORS代理功能
│   │   │   ├── middleware.go     # 中间件
│   │   │   ├── resource_handlers.go # 资源基本操作处理器
│   │   │   ├── resource_approval.go # 资源审批和补充处理器
│   │   │   ├── upload_handlers.go # 图片上传处理器
│   │   │   └── routes.go         # 路由定义
│   │   └── utils/            # 工具函数
│   │       ├── image_utils.go # 图像处理工具
│   │       └── webp_utils.go  # WebP图像转换工具
│   ├── go.mod                # Go模块定义
│   └── README.md             # 项目说明文件
├── frontend/                 # 前端代码目录
│   ├── .env.production       # 生产环境配置
│   ├── .eslintrc.json        # ESLint配置
│   ├── README.md             # 项目说明文档
│   ├── assets/               # 静态资产目录
│   ├── index.html            # 项目入口HTML文件
│   ├── node_modules/         # 依赖包目录
│   ├── package-lock.json     # 依赖包锁定文件
│   ├── package.json          # 项目配置和依赖管理
│   ├── public/               # 公共资源目录
│   │   ├── apple-touch-icon.png # iOS设备图标
│   │   ├── favicon.ico       # 网站图标
│   │   ├── robots.txt        # 搜索引擎爬虫规则文件
│   │   └── sitemap.xml       # 网站地图
│   ├── scripts/              # 项目脚本目录
│   │   └── generate-sitemap.js # 生成网站地图的脚本
│   ├── src/                  # 源代码目录
│   │   ├── App.vue           # 根组件
│   │   ├── assets/           # 项目内部资源
│   │   │   └── streamsPage.css # 视频流页面样式
│   │   ├── components/       # 组件目录
│   │   │   ├── EpisodeSelector.vue # 集数选择器组件
│   │   │   ├── LocalSearch.vue # 本地搜索组件
│   │   │   └── VideoPlayer.vue # 视频播放器组件
│   │   ├── main.js           # 应用程序入口文件
│   │   ├── router/           # 路由配置
│   │   │   └── index.js      # 路由定义文件
│   │   ├── styles/           # 样式目录
│   │   ├── utils/            # 工具函数目录
│   │   │   ├── api.js        # API请求工具
│   │   │   ├── auth.js       # 身份验证工具
│   │   │   ├── corsProxy.js  # CORS代理工具
│   │   │   ├── dataSourceManager.js # 数据源管理工具
│   │   │   ├── dataSources/  # 数据源实现
│   │   │   │   ├── heimuer.js # 黑幕数据源
│   │   │   │   ├── mockSource.js # 模拟数据源
│   │   │   │   └── testApi.js # 测试API数据源
│   │   │   └── imageUtils.js # 图片处理工具
│   │   └── views/            # 页面视图
│   │       ├── About.vue     # 关于页面
│   │       ├── Admin.vue     # 管理后台页面
│   │       ├── Home.vue      # 首页
│   │       ├── Login.vue     # 登录页面
│   │       ├── ResourceDetail.vue # 资源详情页面
│   │       ├── ResourceReview.vue # 资源审核页面
│   │       ├── StreamsPage.vue # 视频流页面
│   │       └── SubmitResource.vue # 资源提交页面
│   └── vite.config.js        # Vite配置文件
├── migrations/               # 数据库迁移脚本
└── prompt.md                 # 项目概述文档
``` 

## 二、前端部署

### 构建前端代码

#### 进入前端代码目录
```
cd /home/work/dongman/frontend
```
#### 安装依赖
```
npm install
```

#### 修改`.env.production`文件

```
BASE_URL=https://dm.xueximeng.com // 生成sitemap会用，不指定则访问 'http://localhost:80000'
ASSETS_PATH=../assets // 使用express代理访问本地图片路径，不指定默认为 '../assets'
```

#### 编译
```
npm i && npm run build
```

构建完成后，将在 `/home/work/dongman/frontend/dist` 目录中生成静态文件。

## 三、后端部署

### 安装后端依赖

#### 进入后端代码目录
```
cd /home/work/dongman/gobackend
```
#### 安装依赖
```
go mod tidy
```
#### 编译二进制
linux机器直接编译二进制
```
go build -ldflags="-w -s" -o app
```

mac上交叉编译linux二进制
```
sudo chown -R $(whoami):admin /usr/local/Homebrew
chmod u+w /usr/local/Homebrew

brew install x86_64-linux-gnu-binutils
brew tap messense/macos-cross-toolchains
brew install x86_64-unknown-linux-gnu

CC=/usr/local/Cellar/x86_64-unknown-linux-gnu/13.3.0.reinstall/bin/x86_64-linux-gnu-gcc CGO_ENABLED=1 GOOS=linux GOARCH=amd64 go build -tags "sqlite_static" -ldflags="-w -s" -o app cmd/api/main.go
```

## 四、Supervisor 配置

配置 Supervisor 来管理后端应用：

#### 创建 supervisor 配置文件
```
sudo nano /etc/supervisor/conf.d/dongman.conf
```

填入以下内容：

```ini
[program:dm]
environment=ASSETS_PATH="/home/work/dongman/assets",DB_PATH="/home/work/dongman/gobackend/resource_hub.db" ;支持环境变量指定assets和数据库路径(默认assets和frontend、gobackend同级，数据库默认在gobackend/resource_hub.db)
command=/home/work/dongman/gobackend/app 
directory=/home/work/dongman/gobackend        ; 项目的文件夹路径
autostart=true                              ; 是否在 Supervisor 启动时自动启动该程序
autorestart=true                            ; 程序退出后是否自动重启
startsecs=5                                 ; 程序启动需要的秒数
startretries=3                              ; 启动失败后的重试次数
exitcodes=0                                 ; 程序正常退出的退出码
stopwaitsecs=10                             ; 程序停止等待的秒数
stopasgroup=true                            ; 是否向进程组发送停止信号
killasgroup=true                            ; 是否向进程组发送杀死信号
redirect_stderr=true                        ; 是否将 stderr 重定向到 stdout
stdout_logfile=/home/work/logs/dongman.log
stdout_logfile_maxbytes=50MB                ; 标准输出日志文件的最大字节数
stdout_logfile_backups=10                   ; 保留的日志文件备份数量
```

重新加载 supervisor 配置：

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start dm
```

## 五、Nginx 配置

### 1. 安装 Nginx

```bash
sudo apt update
sudo apt install nginx
```

### 2. 配置 Nginx

```bash
sudo vi /etc/nginx/conf.d/dongman.conf
```

填入以下配置：

```nginx
server {
    listen 80;
    server_name dm.xueximeng.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name dm.xueximeng.com;
    
    # 基础路径
    set $base_path /home/work/dongman;
    
    # SSL配置
    ssl_certificate /etc/letsencrypt/live/xueximeng.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/xueximeng.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;
    
    # 安全头部
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-XSS-Protection "1; mode=block";
    
    # CORS代理端点 - 注意这与前端请求的路径完全匹配 /proxy
    location = /proxy {
        # 重要：这里没有以 /api 开头，与前端代码中的路径保持一致
        proxy_pass http://127.0.0.1:8000/proxy;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 处理大型响应
        proxy_buffer_size 16k;
        proxy_buffers 8 32k;
        proxy_busy_buffers_size 64k;
        
        # 超时设置
        proxy_connect_timeout 15s;
        proxy_read_timeout 45s;
        proxy_send_timeout 15s;
        proxy_ssl_server_name on;
        
        # 日志设置
        access_log /var/log/nginx/proxy_access.log;
        error_log /var/log/nginx/proxy_error.log;
    }
    
    # API请求 - 代理到Go后端
    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
    }
    
    # 静态资源
    location /static/ {
        alias $base_path/frontend/dist/;
        expires 30d;
    }
    
    location /assets/ {
        alias $base_path/assets/; # 如果修改了默认的assets路径，这里也要一同修改 
        expires 30d;
    }
    
    # 特定文件
    location = /favicon.ico {
        alias $base_path/frontend/dist/favicon.ico;
    }
    
    location = /robots.txt {
        alias $base_path/frontend/dist/robots.txt;
    }
    
    location = /sitemap.xml {
        alias $base_path/frontend/dist/sitemap.xml;
    }
    
    # 前端应用
    location / {
        root $base_path/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # 限制上传大小
    client_max_body_size 50M;
    
    # 日志
    access_log /var/log/nginx/dongman.access.log;
    error_log /var/log/nginx/dongman.error.log;
}
```


### 3. 启用站点配置

```bash
# 验证配置是否正确
sudo nginx -t

# 如果配置正确，重新加载 Nginx
sudo systemctl reload nginx
```

## 六、SSL 证书配置

使用 Let's Encrypt 获取免费 SSL 证书：

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d dm.xueximeng.com

# 配置自动续期
sudo systemctl status certbot.timer
```

## 七、权限配置

确保文件权限正确：

```bash
# 设置资源目录权限
sudo chmod 755 -R /home/work/dongman/
```

## 八、防火墙配置

```bash
# 允许 HTTP 和 HTTPS 流量
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 九、配置检查和测试

### 1. 检查 Supervisor 状态

```bash
sudo supervisorctl status dm
```

### 2. 检查 Nginx 状态

```bash
sudo systemctl status nginx
```

### 美漫资源共建进度
- Rick and Morty（瑞克和莫蒂）✅
- South Park（南方公园）✅
- Brickleberry（脆莓公园）✅
- Family Guy（恶搞之家）✅
- American Dad!（美国老爹）✅
- Happy Tree Friends（欢乐树的朋友们）✅
- Superjail!（暴力监狱 / 超级监狱）✅
- Mr. Pickles（腌黄瓜先生）✅
- Hazbin Hotel（地狱客栈）✅
- Solar Opposites（外星也难民）✅
- Futurama（飞出个未来）✅
- Inside Job（阴谋职场 / 阴谋办公室）✅
- Invincible（无敌少侠）✅
- Villainous（反派本色）✅
- The Legend of Vox Machina（机械之声的传奇）✅
- Panty & Stocking with Garterbelt（吊带袜天使 / 婊子天使）✅
- BoJack Horseman（马男波杰克）✅
- Adventure Time（探险活宝 / 探险时光）✅
- Common Side Effects（常见副作用）✅
- The Boondocks（乡下人）✅
- King of the Hill（山丘之王 / 乡巴佬希尔一家的幸福生活）✅
- The Amazing World of Gumball（阿甘妙世界）✅
- The Simpsons（辛普森一家）✅
- Pokémon（宝可梦 / 宠物小精灵）✅
- Danny Phantom（幻影丹尼）✅
- Smiling Friends（微笑朋友）✅
- DuckTales（唐老鸭俱乐部）✅
- Amphibia（奇幻沼泽）✅
- Mighty Magiswords（超级魔剑 / 神剑变变变）✅
- Helluva Boss（极恶老大）✅
- Steven Universe（宇宙小子）✅
- Rapunzel's Tangled Adventure（魔发奇缘）✅
- Teenage Mutant Ninja Turtles（忍者神龟）✅
- Carmen Sandiego（大神偷卡门）✅
- RWBY（红白黑黄）✅
- Avatar: The Last Airbender（降世神通：最后的气宗）✅
- Avatar: The Legend of Korra（降世神通：科拉传奇）✅
- Bluey（布鲁伊）✅
- Hilda（希尔达）✅
- The Owl House（猫头鹰魔法社）✅
- Clarence（小胖克莱伦斯 / 我爱阿噗）✅
- Heroes of Pure Heart（猫猫：纯心之谷的英雄们）✅
- Sym-Bionic Titan（合神泰坦）✅
- Generator Rex（变形小雷 / 机械战士REX）✅
- Di-Gata Defenders（迪卡塔卫士）✅
- Over the Garden Wall（花园墙外）✅
- The Dragon Prince（龙王子）✅
- OK K.O.! Let's Be Heroes（成为英雄吧）✅
- Bob's Burgers（开心汉堡店）
- SpongeBob SquarePants（海绵宝宝）
- Harley Quinn（哈莉·奎茵）
- Guardians of Ga’Hoole（守护者）
- Gravity Falls（怪诞小镇）
- We Bare Bears（咱们裸熊）
- Arcane（奥术）
- Castlevania（恶魔城）
- Teen Titans Go!（少年泰坦出击）
- Dexter's Laboratory（德克斯特的实验室）
- Hey Arnold!（嘿！阿诺德）
- Robot Chicken（机器鸡）
- Krapopolis（克拉波利斯）
- Gargoyles（夜行神龙）
- Camp Snoopy（史努比营地）
- Batman: The Animated Series（蝙蝠侠动画系列）
- Doug（道格）
- Scooby-Doo（史酷比）
- Aeon Flux（魔力女战士）
- Bullwinkle（布温克尔）
- Ren & Stimpy（伦和史丁比）
- Tuca & Bertie（图卡与伯蒂）
- F is for Family（家庭的意义）
- Love, Death & Robots（爱，死亡与机器人）
- Clerks: The Animated Series（店员动画系列）
- Static Shock（静电侠）
- Scavengers Reign（拾荒者统治）
- Paradise PD（天堂镇警局）
- Ugly Americans（俗世乐土）
- Primal（史前战纪）
- Blue Eye Samurai（蓝眼武士）
- HouseBroken（一家之主）
- Star vs. the Forces of Evil（星蝶公主）
- The Great North（东倒西歪）
- Murder Drones（无机杀手）
- House of Demons（恶魔之家）
- The Amazing Digital Circus（神奇数字马戏团）
- Summer Camp Island（夏令营岛）
- The Midnight Gospel（午夜福音）
- Pantheon（万神殿）
- Ten Year Old Tom（十岁的汤姆）
- The Boys Presents: Diabolical（黑袍纠察队劣迹）
- Dead End: Paranormal Park（灵异游乐园无处可逃）
- Little Demon（小恶魔）
- The Cyanide & Happiness Show（氰化欢乐秀）
- Disenchantment（幻灭）
- Bless the Harts（福是全家福的福）
- My Adventures with Superman（我亲爱的怪物伙伴）
- Ben 10（少年骇客）
- She-Ra and the Princesses of Power（神勇战士）
- Central Park（中央公园）
- The Age of the Chip and the Amazing Animals（奇波和神奇动物的时代）
- Daria（拽妹黛薇儿）
- Big Mouth（大嘴巴）
- Animals.（纽约屁民）
- Metalocalypse（金属启示录）
- Exploding Kittens（爆炸猫）
- The Flintstones（摩登原始人）
- The Jetsons（杰森一家）
- Tom and Jerry（猫和老鼠）
- The Powerpuff Girls（飞天小女警）
- Courage the Cowardly Dog（胆小狗英雄）
- Ed, Edd n Eddy（艾德，艾迪和艾德）
- Johnny Bravo（强尼布拉沃）
- Samurai Jack（武士杰克）
- Star Wars: The Clone Wars（星球大战：克隆人战争）
- Regular Show（普通秀）
- Archer（间谍亚契）
- Final Space（终空）
- The Venture Bros.（冒险兄弟）
- Aqua Teen Hunger Force（水少年特攻队）
- Sealab 2021（2021海底实验室）
- Harvey Birdman, Attorney at Law（哈维·伯德曼律师）
- Space Ghost Coast to Coast（太空幽灵海岸到海岸）

# 更新日志

-202506081248  
✅ 后台网站设置改为标签切换配置  
✅ 后台支持配置采集解析数据源  
✅ 拆分独立CSS文件  
✅ 独立icon文件，包含2000多图标  
-202506071917  
✅ 全面支持管理后台设置网站信息  
-202506061607  
✅ 优化悬浮按钮样式问题  
✅ 修复最近播放恢复播放失败问题  
✅ 新增的资源，如果没有批准任何图片和链接，则代表审核不通过，直接删除该条数据  
✅ 修复编辑资源时，将新上传的图片设置为海报失败问题  
-2020506051132  
✅ 增加golang版动态生成sitemap工具`sitemap-generator`，为将来容器化做准备  
✅ 允许通过环境变量指定assets和数据库路径，为将来容器化做准备  
✅ 自动判断vite.config.js中是否需要启用`base: '/static/',`，只有正式编译时启用，本地开发不会启用，避免每次编译手动修改一遍   
✅ 使用express代理访问本地静态资源路径，根据.env.production配置中的ASSETS_PATH自动设置，默认路径'../assets'  
✅ 调整后台所有图片预览模态框，保持全站风格一致，审批通过的图片，点击也可以放大看  
✅ 优化搜索框样式  
