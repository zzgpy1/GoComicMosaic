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

---

### 附录(梳理了一些采集站)
黑木耳 https://www.heimuer.tv/  
魔都 https://moduzy2.com/  
卧龙 https://wolongzy.tv  
爱坤 https://ikunzy.vip/  
速播 https://subocaiji.com  
量子 https://lzizy.net/  
极速 https://www.jisuzy.com/  
淘片 https://www.taopianzy.com/index.html  
华为吧 https://huawei8.live/  
豆瓣资源 https://dbzy.tv/  
茅台 https://mtzy.me/  
非凡资源 http://www.ffzy.tv/  
红牛 https://hongniuziyuan.com/  
无线 https://wuxianzy5.com/  
金马 https://www.jmzy1.com/  
魔爪 https://mzzy.me/  
暴风 https://bfzy2.tv/  
无尽 https://www.wujinzy.net/  
优质 https://yzzy.tv/  
U酷 https://www.ukuzy.com/  
最大 https://zuidafile.com/  
360 https://360zy.com/  
如意 https://www.ryzy9.tv/  
天堂 http://dyttzyw.tv/  
爱奇艺 https://www.iqiyizy.com/  
天涯 https://tyyszy.com/  

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
- Gravity Falls（怪诞小镇）✅
- Milo Murphy's Law（迈罗·墨菲定律）✅
- Star Wats：The Clone Wars（星球大战：克隆人战争）✅
- Star Wars：Rebels（星球大战：义军崛起）✅
- Star Wars: The Bad Batch（星球大战：异等小队）✅
- Murder Drones（无机杀手）✅
- Randy Cunningham: 9th Grade Ninja（忍者好小子）✅
- Glitch Techs（电玩先锋）✅
- Dude, That's My Ghost!（幽灵死党）✅
- Wakfu（沃土）✅
- Dofus : Aux trésors de Kerubim（德弗斯战记 / 克鲁布的宝物）✅
- Regular Show（日常工作 / 天兵公园）✅
- Blue Eye Samurai（蓝眼武士）✅
- Afro Samurai（爆炸头武士）✅
- Paradise PD（天堂镇警局）✅
- Ugly Americans（俗世乐土 / 丑陋的美国人）✅
- Your Friendly Neighborhood Spider-Man（你的友好邻居蜘蛛侠）✅
- CatDog（猫狗）✅
- Creature Commandos（生物突击队）✅
- Scavengers Reign（拾荒者统治）✅
- Primal（史前战纪）✅
- Pantheon（万神殿）✅
- Summer Camp Island（夏令营岛）✅
- Teen Titans（少年泰坦）✅
- My Life as a Teenage Robot（青少年机器人）✅
- Bordertown（边城小镇）✅
- Motorcity（热血车城）✅
- Invader Zim（外星侵略者吉姆）✅
- The Transformers（变形金刚）✅
- Challenge of the GoBots（百变雄师）✅
- Ultraman（奥特曼）✅ 
- Goof Troop（高飞家族）✅
- Disney's House of Mouse（米老鼠群星会）✅
- Bee and PuppyCat（蜂妹与狗狗猫）✅
- Ben 10（少年骇客）✅
- YOLO（乐活姐妹：怪诞冒险）✅
- Super Robot Monkey Team Hyperforce Go!（超级战猴）✅
- Fanboy and Chum Chum（小幻与冲冲）✅
- The Loud House（喧闹一家亲）✅ 
- Uncle Grandpa（天才阿公 / 天才叔公）✅
- Infinity Train（无尽列车）✅
- Detentionaire（非典型高中生活）✅
- SpongeBob SquarePants（海绵宝宝）✅
- Phineas and Ferb（飞哥与小佛）✅
- Justice League Action（正义联盟行动） ✅
- Ed Edd n Eddy（捣蛋三傻 / 三个艾德）✅
- Time Squad（时空特工队 / 时间保安队）✅
- American Dragon: Jake Long（美国龙：杰克龙）✅
- The Secret Saturdays（神秘特攻队 / 秘密星期六）✅
- The Grim Adventures of Billy and Mandy（比利曼蒂和死神的大冒险）✅
- Bob's Burgers（开心汉堡店）
- Harley Quinn（哈莉·奎茵）
- Guardians of Ga’Hoole（守护者）
- We Bare Bears（咱们裸熊）
- Arcane（奥术）
- Castlevania（恶魔城）
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
- HouseBroken（一家之主）
- Star vs. the Forces of Evil（星蝶公主）
- The Great North（东倒西歪）
- House of Demons（恶魔之家）
- The Amazing Digital Circus（神奇数字马戏团）
- The Midnight Gospel（午夜福音）
- Ten Year Old Tom（十岁的汤姆）
- The Boys Presents: Diabolical（黑袍纠察队劣迹）
- Dead End: Paranormal Park（灵异游乐园无处可逃）
- Little Demon（小恶魔）
- The Cyanide & Happiness Show（氰化欢乐秀）
- Disenchantment（幻灭）
- Bless the Harts（福是全家福的福）
- My Adventures with Superman（我亲爱的怪物伙伴）
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
- Archer（间谍亚契）
- Final Space（终空）
- The Venture Bros.（冒险兄弟）
- Aqua Teen Hunger Force（水少年特攻队）
- Sealab 2021（2021海底实验室）
- Harvey Birdman, Attorney at Law（哈维·伯德曼律师）
- Space Ghost Coast to Coast（太空幽灵海岸到海岸）

# 更新日志
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
