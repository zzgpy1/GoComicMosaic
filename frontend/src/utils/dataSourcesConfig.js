/**
 * 数据源配置文件
 * 集中管理所有数据源的配置，便于统一维护
 * 
 * 配置说明：
 * - name: 数据源显示名称（必填）
 * - baseUrl: API基础URL（必填）
 * - useXml: 是否使用XML格式（可选，默认false为JSON格式）
 * 
 * 其他参数会自动生成：
 * - id: 基于name自动生成
 * - description: 基于name自动生成
 */

const dataSourcesConfig = [
  // 黑木耳数据源
  {
    name: '黑木耳',
    baseUrl: 'https://json02.heimuer.xyz/api.php/provide/vod',
    useXml: false
  },
  
  // 量子数据源
  {
    name: '量子',
    baseUrl: 'https://cj.lziapi.com/api.php/provide/vod/from/lzm3u8/at/xml/',
    useXml: true
  },
  
  // 卧龙数据源
  {
    name: '卧龙',
    baseUrl: 'https://collect.wolongzy.cc/api.php/provide/vod/',
    useXml: false
  },
  
  // 魔都数据源
  {
    name: '魔都',
    baseUrl: 'https://www.mdzyapi.com/api.php/provide/vod',
    useXml: false
  },
  
  // 速播数据源
  {
    name: '速播',
    baseUrl: 'https://www.subocaiji.com/api.php/provide/vod/from/subm3u8/at/xml/',
    useXml: true
  },
  
  // 淘片数据源
  {
    name: '淘片',
    baseUrl: 'https://taopianapi.com/cjapi/mc/vod/json.html',
    useXml: false
  },
  
  // 爱坤数据源
  {
    name: '爱坤',
    baseUrl: 'https://ikunzy.vip/api.php/provide/vod/',
    useXml: false
  },
  
  // 极速数据源
  {
    name: '极速',
    baseUrl: 'https://jszyapi.com/api.php/provide/vod/from/jsm3u8/at/json',
    useXml: false
  }
  
  // 添加新数据源示例：
  /*
  {
    name: '新数据源',           // 数据源名称（必填）
    baseUrl: 'https://api.example.com/api.php/provide/vod/',  // API地址（必填）
    useXml: false              // 是否使用XML格式（可选，默认false）
  }
  */
];

export default dataSourcesConfig; 