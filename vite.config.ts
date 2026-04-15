// 引入Vite核心配置函数、React插件、路径处理模块
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// 导出Vite配置（最简核心版，适配你的React+TS项目）
export default defineConfig({
  // 必须：启用React插件，否则Vite无法编译React/TSX代码
  base: '/jabobo/',
  plugins: [react()],

  // 路径别名配置（解决@/*找不到模块的问题，和tsconfig.json配套）
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './') // @/* 对应项目根目录（/var/local/jobobo-manager/）
    }
  },

  // 打包优化（可选但推荐，适配更多浏览器，避免打包后兼容性问题）
  build: {
    target: 'es2020', // 适配主流浏览器（Chrome/Firefox/Edge）
    emptyOutDir: true, // 打包前清空dist目录，避免旧文件干扰
    outDir: 'dist' // 打包输出目录（默认就是dist，明确写出来更清晰）
  },

  // 开发服务器配置（如果你想继续用npm run dev，这部分可选）
  server: {
    host: '0.0.0.0', // 允许外部访问（服务器上启动dev时需要）
    port: 80, // 开发端口（和你原来一样）
    open: false // 不自动打开浏览器（服务器上不需要）
  }
})