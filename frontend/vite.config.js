import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import express from 'express'
import { config as dotenvConfig } from 'dotenv'; // 使用别名避免冲突

// 加载 .env.production
dotenvConfig({ path: path.resolve('.env.production') });

// 获取环境变量
const ASSETS_PATH = process.env.ASSETS_PATH || '../assets'

// 自定义插件：提供本地 data/assets 目录中的静态文件
const assetsPlugin = {
  name: 'serve-assets',
  configureServer(server) {
    // 将 /assets 请求映射到本地 ASSETS_PATH(../data/assets) 目录
    server.middlewares.use('/assets', express.static(path.resolve(__dirname, ASSETS_PATH)))
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // 当运行vite命令时为开发环境，运行vite build命令时为生产环境
  const isDev = command === 'serve' // serve = 开发环境，build = 生产环境
  return {
    plugins: [vue(), assetsPlugin], // 添加自定义插件
    // 开发环境不设置base，生产环境设置base为'/static/'
    base: isDev ? '' : '/static/',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      proxy: {
        '/app': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          // 恢复原始重写，去掉/api前缀
          rewrite: (path) => path.replace(/^\/app/, ''),
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.log('API proxy error:', err);
            });
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log('API请求代理:', req.method, req.url, '->', options.target + proxyReq.path);
            });
          }
        },
        '/proxy': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.log('Proxy error:', err);
            });
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log('请求代理:', req.method, req.url, '->', options.target + proxyReq.path);
            });
          }
        }
      }
    }
  }
})