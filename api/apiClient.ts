import axios from 'axios';

/**
 * 提取后的基础 API 客户端
 * 所有的业务请求都应该基于这个实例发送
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' }
});

// --- 请求拦截器（修复版：含调试+GET防缓存+身份验证）---
apiClient.interceptors.request.use((config) => {
  // 调试日志：确认拦截器执行 + 打印原始配置
  console.log('===== apiClient 请求拦截器执行 =====');
  console.log('请求method（原始）:', config.method);
  console.log('请求URL:', config.url);
  console.log('原始params:', config.params);

  // 1. 身份验证逻辑（保留你的原有代码）
  const userStr = localStorage.getItem('user');
  if (userStr) {
    const user = JSON.parse(userStr);
    // 后端 auth.py 的 get_current_user 依赖这两个 Header
    config.headers['x-username'] = user.username;
    if (user.token) {
      config.headers['Authorization'] = user.token;
    }
  }

  // 2. GET请求防缓存逻辑（核心修复：判断小写method）
  if (config.method === 'get') {
    console.log('===== 触发GET请求防缓存逻辑 =====');
    // 添加防缓存请求头
    config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    config.headers['Pragma'] = 'no-cache';
    config.headers['Expires'] = '0';
    // 添加随机时间戳参数，彻底避开缓存
    config.params = {
      ...config.params, // 保留原有参数
      _t: new Date().getTime() // 唯一时间戳，每次请求不同
    };
    console.log('处理后params（含_t）:', config.params);
  }

  return config;
}, (error) => {
  console.error('===== apiClient 请求拦截器错误 =====', error);
  return Promise.reject(error);
});

// --- 响应拦截器（保留你的修复版逻辑）---
apiClient.interceptors.response.use(
  (response) => {
    console.log('===== apiClient 响应拦截器执行 =====', response.config.url);
    return response;
  },
  (error) => {
    // 1. 先判断是否是 401 错误
    if (error.response?.status === 401) {
      // 2. 判断当前请求是否是登录接口（根据实际接口路径调整）
      const isLoginRequest = error.config?.url?.includes('login');
      // 3. 只有非登录接口的 401 才执行登出跳转
      if (!isLoginRequest) {
        localStorage.removeItem('user');
        window.location.href = '/jabobo/app';
      }
    }
    console.error('===== apiClient 响应拦截器错误 =====', error);
    return Promise.reject(error);
  }
);

export default apiClient;