# Jabobo Manager

Jabobo Manager 是一个基于 **React 19 + TypeScript** 的前端管理应用，用于管理 Jabobo AI 语音陪伴设备。提供用户认证、设备绑定、声纹注册、知识库管理、AI 人设配置及管理员后台等功能，支持中英文双语。

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 19 + TypeScript 5.8 |
| 构建工具 | Vite 6 |
| 路由 | React Router DOM 7 |
| HTTP 客户端 | Axios |
| 国际化 | i18next + react-i18next |
| 图标 | Lucide React、Font Awesome |
| 部署 | Docker (Node 20 Alpine 构建 + Nginx Alpine 托管) |

## 快速开始

### 环境要求

- Node.js 20+
- npm

### 本地开发

```bash
npm install      # 安装依赖
npm run dev      # 启动开发服务器 (http://0.0.0.0:80)
npm run build    # 生产环境构建 → dist/
npm run preview  # 预览生产构建
```

### 环境变量

| 变量 | 说明 | 示例 |
|------|------|------|
| `VITE_API_BASE_URL` | 后端 API 地址 | `https://jabobo.com/api/` |
| `TEST_VITE_API_BASE_URL` | 测试环境 API 地址 | `http://121.41.168.85:8007/api` |

### Docker 部署

```bash
docker build --build-arg VITE_API_BASE_URL=https://jabobo.com/api/ -t jabobo-manager .
docker run -p 80:80 jabobo-manager
```

多阶段构建：Node 20 Alpine 编译 React 应用 → Nginx Alpine 托管静态文件，包含 SPA 路由回退、`/api/` 反向代理、Gzip 压缩和静态资源缓存（7 天）。

## 项目结构

```
├── App.tsx                  # 主路由组件
├── AppShell.tsx             # 应用内壳，管理屏幕状态导航
├── types.ts                 # 集中 TypeScript 类型定义
├── i18n.ts                  # i18next 国际化配置
├── api/
│   ├── apiClient.ts         # Axios 实例 (自动注入认证头、缓存破坏、401 处理)
│   ├── auth.ts              # 登录认证 API
│   ├── jabobo_manager.ts    # 设备绑定/解绑管理
│   ├── jabobo_voice.ts      # 音频上传、声纹注册
│   ├── jabobo_knowledge_base.ts  # 知识库文件管理
│   ├── jabobo_congfig.ts    # 设备配置同步
│   └── user.ts              # 用户管理 (CRUD)
├── screens/
│   ├── LandingPage.tsx      # 公开营销落地页
│   ├── Login.tsx            # 登录
│   ├── SignUp.tsx           # 注册
│   ├── Dashboard.tsx        # 仪表盘 (人设、记忆、版本控制)
│   ├── JaboboSelector.tsx   # 设备选择/绑定
│   ├── Voiceprint.tsx       # 声纹管理
│   ├── KnowledgeBase.tsx    # 知识库管理
│   ├── Settings.tsx         # 用户设置
│   └── AdminUserManagement.tsx  # 管理员用户管理
├── components/
│   ├── Input.tsx            # 通用输入组件
│   ├── LanguageSwitcher.tsx # 中英文切换
│   └── Layout.tsx           # 页面布局容器
├── hooks/
│   └── useAuth.ts           # 认证状态 Hook
└── public/locales/
    ├── zh/translation.json  # 中文翻译
    └── en/translation.json  # 英文翻译
```

## 核心功能

### 🔐 用户认证

- 用户名/密码登录，Token 存储于 localStorage
- API 请求自动注入 `x-username` 和 `Authorization` 头
- 401 响应自动跳转登录页
- 基于角色的访问控制 (管理员/普通用户)

### 📱 设备管理

- 通过 UUID（MAC 格式或 6 位代码）绑定/解绑 Jabobo 设备
- 多设备切换，活跃设备 UUID 持久化存储
- 设备配置版本对比，不一致时显示提醒徽标

### 🎭 AI 人设配置

- 创建/编辑/删除多个 AI 人设 (Persona)
- 设备记忆内容管理
- 一键同步配置到设备端

### 🎤 声纹注册

- 上传音频文件或麦克风录制
- 关联音频到说话人 ID 进行声纹注册
- 查看已注册声纹列表，支持删除
- 单设备最多支持 10 个声纹

### 📚 知识库管理

- 上传 TXT 文件（单文件 ≤ 5MB，总数 ≤ 10 个，内容 ≤ 100KB）
- 文件列表展示（名称、大小、上传时间）
- 文件删除

### 👥 管理员后台

- 用户列表查看
- 创建用户（指定角色）
- 重置用户密码
- 删除用户

### 🌍 国际化

- 支持中文/英文双语
- 自动检测浏览器语言
- 语言偏好持久化 (localStorage + Cookie)

## API 接口

| 模块 | 方法 | 端点 | 说明 |
|------|------|------|------|
| 认证 | POST | `/login` | 用户登录 |
| 设备管理 | GET | `/user/jabobo_ids` | 获取已绑定设备列表 |
| | POST | `/user/bind` | 绑定设备 |
| | POST | `/user/unbind` | 解绑设备 |
| | POST | `/user/rebind` | 重新绑定设备 |
| 声纹 | POST | `/user/upload-audio` | 上传音频 |
| | GET | `/user/list-audio` | 音频文件列表 |
| | POST | `/user/delete-audio` | 删除音频 |
| | POST | `/voiceprint/register` | 注册声纹 |
| | GET | `/voiceprint/list` | 已注册声纹列表 |
| 知识库 | GET | `/user/list-kb` | 知识库文件列表 |
| | POST | `/user/upload-kb` | 上传知识库文件 |
| | POST | `/user/delete-kb` | 删除知识库文件 |
| 配置 | GET | `/user/config` | 获取设备配置 |
| | POST | `/user/sync-config` | 同步配置到设备 |
| 用户管理 | GET | `/users` | 用户列表 |
| | POST | `/users` | 创建用户 |
| | DELETE | `/users/{username}` | 删除用户 |
| | PUT | `/users/password` | 修改密码 |

## 路由结构

| 路径 | 组件 | 说明 |
|------|------|------|
| `/` | LandingPage | 公开营销页，含应用下载链接 |
| `/app/*` | AppShell | 应用主体，基于状态的屏幕导航 |

AppShell 内部使用状态驱动导航（非嵌套路由），通过 `Screen` 类型管理页面切换：`LOGIN → SIGNUP → SELECT_JABOBO → DASHBOARD → VOICEPRINT → KNOWLEDGE_BASE → SETTINGS → ADMIN`

## 路径别名

`@/*` 映射到项目根目录，在 `vite.config.ts` 和 `tsconfig.json` 中同步配置。

```typescript
import { SomeType } from '@/types'
```
