import axios from 'axios';
import apiClient from './apiClient';
import { LoginResponse } from '@/types';


export const authApi = {
  /**
   * 用户登录
   * 验证成功后会返回包含 token 的对象
   */
  login: async (username: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await apiClient.post<LoginResponse>('/login', { username, password });
      
      // 后端直接返回 {"success": true, "token": "...", ...}
      return response.data; 
    } catch (error: any) {
      // Surface FastAPI HTTPException detail; otherwise let the caller's t() fallback take over
      const message = error.response?.data?.detail || '';
      throw new Error(message);
    }
  }
};