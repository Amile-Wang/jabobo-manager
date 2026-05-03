import { ApiResponse } from "@/types";
import apiClient from "./apiClient";


export const JaboboManager = {
    // 获取当前用户绑定的所有设备 ID
    getJaboboIds: async (): Promise<ApiResponse> => {
      const response = await apiClient.get('/user/jabobo_ids');
      return response.data;
    },
  
    // 👈 逻辑补全：绑定新设备 (Create)
    bindJabobo: async (jaboboId: string): Promise<ApiResponse> => {
      const response = await apiClient.post('/user/bind', { jabobo_id: jaboboId });
      return response.data;
    },
  
    // 👈 逻辑补全：解绑设备 (Delete)
    // 使用 delete 方法，并通过 params 传递 jabobo_id 匹配后端 Query 参数
    unbindJabobo: async (jaboboId: string): Promise<ApiResponse> => {
      const response = await apiClient.delete('/user/unbind', {
        params: { jabobo_id: jaboboId }
      });
      return response.data;
    },
  
    rebindJabobo: async (oldId: string, newId: string): Promise<ApiResponse> => {
      const response = await apiClient.put('/user/rebind', {
        old_jabobo_id: oldId,
        new_jabobo_id: newId
      });
      return response.data;
    },

    // 重命名设备：传入 null 或空字符串可清空名称（恢复默认显示）
    renameJabobo: async (jaboboId: string, deviceName: string | null): Promise<ApiResponse> => {
      const response = await apiClient.put('/user/rename_device', {
        jabobo_id: jaboboId,
        device_name: deviceName,
      });
      return response.data;
    },

    // 列出 OTA 目录里所有可下发的固件版本
    listFirmwares: async (): Promise<ApiResponse> => {
      const response = await apiClient.get('/xiaozhi/otaMag/list');
      return response.data;
    },

    // 设置设备的目标固件版本；传空串/null 表示不下发升级（默认行为）
    setExpectedVersion: async (jaboboId: string, expectedVersion: string): Promise<ApiResponse> => {
      const response = await apiClient.put('/user/device/update_version', null, {
        params: { jabobo_id: jaboboId, expected_version: expectedVersion },
      });
      return response.data;
    },

  };
  
  // 别名导出，确保兼容性
  export const jaboboManager = JaboboManager;