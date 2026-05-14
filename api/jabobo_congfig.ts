import { ApiResponse, UserConfig, WakeWordStatus } from "@/types";
import apiClient from "./apiClient";



export const JaboboConfig = {
    // 获取特定设备的配置
    getUserConfig: async (jaboboId: string): Promise<ApiResponse<UserConfig>> => {
      const response = await apiClient.get('/user/config', { 
        params: { jabobo_id: jaboboId } 
      });
      return response.data;
    },
  
    // 同步特定设备的配置
    syncConfig: async (jaboboId: string, data: UserConfig): Promise<ApiResponse> => {
      const response = await apiClient.post('/user/sync-config', {
        jabobo_id: jaboboId,
        ...data
      });
      return response.data;
    },

    // 查询唤醒词训练状态
    getWakeWordStatus: async (jaboboId: string): Promise<ApiResponse<WakeWordStatus>> => {
      const response = await apiClient.get('/user/wake-word-status', {
        params: { jabobo_id: jaboboId }
      });
      return response.data;
    }
    
  };
  
  // 别名导出，确保兼容性
  export const jaboboConfig = JaboboConfig;