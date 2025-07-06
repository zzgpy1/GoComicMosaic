# 外接数据源示例及模板

本目录包含了几个外接数据源的示例和模板，用于帮助开发者快速创建自己的外接数据源。

## 新增功能介绍

最新版本的外接数据源支持以下新功能：

### 1. 跨域代理请求返回Cookies

通过在代理请求URL中添加`returnCookies=true`参数，可以在响应头中获取目标网站的Cookies。这些Cookies会以JSON字符串的形式在`X-Proxy-Cookies`响应头中返回。

```javascript
// 示例：获取目标网站的Cookies
const targetUrl = 'https://example.com';
const encodedUrl = encodeURIComponent(targetUrl);
const proxyUrl = `/api/proxy?returnCookies=true&url=${encodedUrl}`;

const response = await fetch(proxyUrl);
const cookiesJSON = response.headers.get('X-Proxy-Cookies');
if (cookiesJSON) {
  const cookies = JSON.parse(cookiesJSON);
  console.log('获取到的Cookies:', cookies);
}
```

### 2. 桥接存储（localStorage）

外接数据源现在可以通过桥接客户端访问浏览器的localStorage，用于存储持久化数据。

```javascript
// 示例：加载存储桥接客户端
const bridgeModule = await lib.load('storage-bridge-client');
if (bridgeModule && bridgeModule.createStorageBridge) {
  this._storageBridge = bridgeModule.createStorageBridge(this.id);
}

// 存储数据
await this._storageBridge.setItem('key', JSON.stringify(value));

// 读取数据
const dataStr = await this._storageBridge.getItem('key');
const data = JSON.parse(dataStr);
```

### 3. 二次请求播放地址（getPlayUrl）

通过在影片详情中设置`vod_play_require_cid: true`，可以启用二次请求获取播放地址的功能。当用户点击播放按钮时，系统会调用数据源的`getPlayUrl`方法获取实际的播放地址。

```javascript
// 在getMovieDetail方法中设置标记
const detail = {
  // ...其他字段
  vod_play_require_cid: true // 标记需要二次请求播放地址
};

// 实现getPlayUrl方法
async getPlayUrl(cid, options = {}) {
  // 获取实际播放地址的逻辑
  return 'https://example.com/video.mp4';
}
```

## 模板文件说明

### 1. basic_template.js

基础模板，适合新手使用。包含了最基本的外接数据源结构和必要的方法实现。

### 2. advanced_template.js

高级模板，包含了所有新增功能的完整实现，包括跨域代理请求返回Cookies、桥接存储和二次请求播放地址。

### 3. cookies_example.js

专门演示如何使用`returnCookies=true`参数获取和管理目标网站的Cookies的示例。

## 如何使用

1. 根据你的需求选择合适的模板
2. 将模板文件复制到`assets/ext/`目录下
3. 将文件重命名为你的数据源名称，如`my_data_source.js`
4. 修改基本信息（id、name、baseUrl等）
5. 根据你的API实现具体的方法（searchMovies、getMovieDetail等）
6. 如需使用新增功能，参考相应的示例代码

## 必要的方法

每个外接数据源必须实现以下方法：

- `searchMovies(keyword, page, pageSize)`: 搜索影片
- `getMovieDetail(id)`: 获取影片详情

如果设置了`vod_play_require_cid: true`，还需要实现：

- `getPlayUrl(cid, options)`: 获取播放地址

## 数据格式

### searchMovies返回格式

```javascript
{
  dataList: [
    {
      vod_id: '123',
      vod_name: '影片标题',
      vod_pic: 'https://example.com/cover.jpg',
      vod_remarks: '备注信息',
      vod_year: '2023',
      vod_area: '地区',
      type_name: '分类',
      vod_content: '简介'
    }
    // ...更多结果
  ],
  total: 100,      // 总条数
  pagecount: 5,    // 总页数
  size: 20,        // 每页条数
  current: 1       // 当前页码
}
```

### getMovieDetail返回格式

```javascript
{
  vod_id: '123',
  vod_name: '影片标题',
  vod_pic: 'https://example.com/cover.jpg',
  vod_blurb: '简短介绍',
  vod_content: '详细介绍',
  vod_play_url: '第1集$id1#第2集$id2#第3集$id3',
  vod_year: '2023',
  vod_area: '地区',
  vod_remarks: '备注',
  type_name: '分类',
  vod_actor: '演员A,演员B',
  vod_director: '导演X',
  vod_play_require_cid: true // 标记需要二次请求播放地址
}
```

### getPlayUrl返回格式

直接返回播放地址字符串：

```javascript
'https://example.com/video.mp4'
```

或者返回包含更多信息的对象：

```javascript
{
  url: 'https://example.com/video.mp4',
  headers: {
    'Referer': 'https://example.com'
  }
}
``` 