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

![移动端|237x499](https://raw.githubusercontent.com/fishforks/imgs/refs/heads/main/gcm/1.gif)

## 首页
![image|690x397](https://raw.githubusercontent.com/fishforks/imgs/refs/heads/main/gcm/2.jpg)

可以根据资源中文名、英文名、简介进行搜索
![首页|690x392](https://raw.githubusercontent.com/fishforks/imgs/refs/heads/main/gcm/3.gif)

## 详情页
![image|690x398](https://raw.githubusercontent.com/fishforks/imgs/refs/heads/main/gcm/4.jpg)

可以切换查看图片，选择网盘标签，一键复制网盘链接密码
![详情页|690x392](https://raw.githubusercontent.com/fishforks/imgs/refs/heads/main/gcm/5.gif)

## 关于本站
![关于|690x392](https://raw.githubusercontent.com/fishforks/imgs/refs/heads/main/gcm/6.gif)

## 提交资源
这个才是资源共建平台的核心，点击右上角的'提交资源'，用户可以随意提交自己喜欢的动漫资源，如果网站还不存该美漫时，会是一个新建资源的表单，需要填写中文名、英文名、类型、简介等基础信息。提交后，要等管理员在后台审批完才会在首页显示

### 提交-新建资源
![image|690x384](https://raw.githubusercontent.com/fishforks/imgs/refs/heads/main/gcm/7.jpg)  
![image|690x379](https://raw.githubusercontent.com/fishforks/imgs/refs/heads/main/gcm/8.jpg)  

网盘链接和图片都可以提交多个
![提交资源|690x392](https://raw.githubusercontent.com/fishforks/imgs/refs/heads/main/gcm/9.gif)

### 提交-补充资源
顾名思义，就是对已经存在的动漫资源补充一些信息，主要是图片、资源链接
补充提交有2个入口，一个是右上角的'提交资源'，搜索已经存在的动漫名，然后选择确认即可
![image|690x396](https://raw.githubusercontent.com/fishforks/imgs/refs/heads/main/gcm/10.jpg)  

![补充资源|690x392](https://raw.githubusercontent.com/fishforks/imgs/refs/heads/main/gcm/11.gif)

从资源详情页点击'补充资源'按钮，不用自己再搜索选择了，自动绑定对应的动漫
![详情页补充|690x392](https://raw.githubusercontent.com/fishforks/imgs/refs/heads/main/gcm/12.gif)

## 管理员登录
不用多说了，就是输入账号密码，初始密码登录后可修改

![image|690x401](https://raw.githubusercontent.com/fishforks/imgs/refs/heads/main/gcm/13.jpg)

## 管理控制台
主要用于审批用户提交的资源

![image|690x398](https://raw.githubusercontent.com/fishforks/imgs/refs/heads/main/gcm/14.jpg)

审批用户提交的资源
![后台审批|690x391](https://raw.githubusercontent.com/fishforks/imgs/refs/heads/main/gcm/15.gif)

## 资源编辑(管理员权限)
管理员在动漫详情页面，可以进行编辑，修改中英文标题、简介、类型、图片增删、海报设置、修改添加资源链接等
![image|690x365](https://raw.githubusercontent.com/fishforks/imgs/refs/heads/main/gcm/16.jpg)  
![image|690x303](https://raw.githubusercontent.com/fishforks/imgs/refs/heads/main/gcm/17.jpg)  

![详情编辑|690x391](https://raw.githubusercontent.com/fishforks/imgs/refs/heads/main/gcm/18.gif)

## 新增喜欢按钮
在详情页可以点击喜欢
![image|690x370](https://raw.githubusercontent.com/fishforks/imgs/refs/heads/main/gcm/19.jpg)
首页可以根据喜欢数量排序，默认按最新发布排序
![image|690x397](https://raw.githubusercontent.com/fishforks/imgs/refs/heads/main/gcm/20.jpg)

## 新增分页
![image|690x397](https://raw.githubusercontent.com/fishforks/imgs/refs/heads/main/gcm/21.jpg)

## 新增在线点播功能
![image|690x397](https://raw.githubusercontent.com/fishforks/imgs/refs/heads/main/gcm/22.gif)

## 优化检测
![image|690x397](https://raw.githubusercontent.com/fishforks/imgs/refs/heads/main/gcm/23.jpg)

## 调整底栏
- 添加在线点播
- 添加访问统计
- 添加友链
![image|690x397](https://raw.githubusercontent.com/fishforks/imgs/refs/heads/main/gcm/24.jpg)

## 详情页剧照点击放大查看
![image|690x397](https://raw.githubusercontent.com/fishforks/imgs/refs/heads/main/gcm/25.gif)

## 全面支持管理后台设置网站信息和采集解析源
目前美漫共建官网内置30条数据源  
![image|690x397](https://raw.githubusercontent.com/fishforks/imgs/refs/heads/main/gcm/26.gif)

## 支持外挂在线播放数据源
会写爬虫的用户可以自己添加数据源，更加灵活。参考[外接数据源开发者文档](https://github.com/fish2018/GoComicMosaic/blob/main/docs/%E5%A4%96%E6%8E%A5%E6%95%B0%E6%8D%AE%E6%BA%90%E5%BC%80%E5%8F%91%E6%96%87%E6%A1%A3.md)，提供[爬虫示例及模板](https://github.com/fish2018/GoComicMosaic/tree/main/docs/%E5%A4%96%E6%8E%A5%E6%95%B0%E6%8D%AE%E6%BA%90%E7%A4%BA%E4%BE%8B%E5%8F%8A%E6%A8%A1%E6%9D%BF)  
![image|690x397](https://raw.githubusercontent.com/fishforks/imgs/refs/heads/main/gcm/27.gif)

## 支持从TMDB一键导入资源库
可以从TMDB搜索、预览、一键导入资源
![image|690x397](https://raw.githubusercontent.com/fishforks/imgs/refs/heads/main/gcm/28.gif)

## 支持一键分享
资源详情页可以一键生成分享海报和链接
![image|690x397](https://raw.githubusercontent.com/fishforks/imgs/refs/heads/main/gcm/29.gif)

## 新增「剧集探索」功能，支持查看分季分集信息  
资源详情页可以一键生成分享海报和链接  
![image|690x397](https://raw.githubusercontent.com/fishforks/imgs/refs/heads/main/gcm/30.gif)

---

# 更新日志
-202507161526   
✅ 优化TMDB搜索，显示结果列表页，选择具体资源后再显示详情，支持电影搜索   
✅ 变更访问人数统计工具   
-202507091318   
✅ 新增贴纸功能，可以在详情页显示透明贴纸，用户自由拖拽、旋转       
-202507061001   
✅ 外接数据源开发支持跨域代理返回Cookies功能   
✅ 外接数据源开发支持桥接存储 (localStorage)  
✅ 外接数据源开发支持二次请求播放地址支持 (getPlayUrl)  
✅ 优化数据源加载机制，只有在流媒体播放页面切换数据源时才开始加载  
✅ 新增bilibili外接数据源  
✅ 内置一键图片清晰AI工具  
✅ 调整vite.config.js配置proxy为`/app`（原`/api`），避免歧义  
-202506230806   
✅ 新增文章功能，支持markdown    
✅ 图片支持拖拽排序     
✅ 支持通过链接添加图片   
-202506211815  
✅ 新增滑动切换图片功能，对移动端体验友好  
✅ 调整网盘显示顺序  
-202506211422  
✅ 大幅优化「剧集探索」加载速度，切换季、集、剧照更丝滑  
✅ 在线点播页面新增主页推荐功能  
-202506191159   
✅ 新增「剧集探索」功能，支持查看电视剧分季和分集信息  
-202506180813  
✅ 后台网站设置增加免责声明模块，支持html代码  
✅ 播放器增加倍速选择、增加快捷键功能  
-202506151233  
✅ TMDB搜索后支持直接编辑，然后再一键导入  
✅ 调整TMDB搜索预览界面，和实际资源详情页保持风格一致  
-202506141634   
✅ 去掉点播时的质量设置，提升加载速度  
✅ 播放器界面切换数据源时，不再自动搜索  
✅ 资源详情页大图预览区限制高度，避免出现竖图时过于突兀  
✅ 梳理文档，集中放到docs目录下  
-202506121410  
✅ 后端跨域转发代理支持所有请求方法，支持透传headers   
✅ 重新优化外接数据源，解决跨域问题，提供外接数据源爬虫示例lanmei.js、rebo.js和模板 
-202506112021  
✅ 修复TMDB_API_KEY泄露问题   
✅ 详情页增加一键分享功能    
✅ 修复GO使用sqlite3时开启WAL导致数据丢失问题    
-202506100835  
✅ 后台读取到环境变量配置的TMDB_API_KEY会自动保存到数据库  
✅ 支持开启/关闭TMDB功能，自由控制顶栏显示  
-202506091954  
✅ 支持从TMDB一键导入资源库  
✅ 支持从环境变量、管理后台配置TDMB_API_KEY  
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
