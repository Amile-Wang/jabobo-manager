import { ApiResponse, VoiceprintRegisterParams, VoiceprintRegisterResponse } from "@/types";
import apiClient from "./apiClient";

// 匹配后端返回的声纹数据结构
export interface RegisteredVoiceprint {
  speaker_id: string;
  voiceprint_name: string;
  create_time: string;
  status: string;
  jabobo_id: string;
  file_path?: string; // 补充后端返回的文件路径字段
}

export const JaboboVoice = {
  // 【保留原有接口不变】
  uploadAudio: async (jaboboId: string, file: File, audioContent?: string): Promise<ApiResponse> => {
    const formData = new FormData();
    formData.append("jabobo_id", jaboboId);
    formData.append("file", file);
    if (audioContent) formData.append("audio_content", audioContent);

    const response = await apiClient.post('/user/upload-audio', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
        console.log(`音频上传进度：${percent}%`);
      }
    });
    return response.data;
  },

  listAudio: async (jaboboId: string): Promise<ApiResponse> => {
    const response = await apiClient.get('/user/list-audio', { params: { jabobo_id: jaboboId } });
    return response.data;
  },

  deleteAudio: async (jaboboId: string, filePath: string): Promise<ApiResponse> => {
    const response = await apiClient.post('/user/delete-audio', null, {
      params: { jabobo_id: jaboboId, file_path: filePath }
    });
    return response.data;
  },

  registerVoiceprint: async (
    params: Omit<VoiceprintRegisterParams, 'xUsername' | 'authorization'>
  ): Promise<ApiResponse<VoiceprintRegisterResponse>> => {
    try {
      const jaboboId = params.jaboboId?.trim() || '';
      const voiceprintName = params.voiceprintName?.trim() || '';
      const filePath = params.filePath?.trim() || '';

      if (!jaboboId || !voiceprintName || !filePath) {
        return {
          success: false,
          message: '缺少必要参数：设备ID、声纹名称、文件路径不能为空',
          detail: '',
          data: {} as VoiceprintRegisterResponse
        };
      }

      const formData = new FormData();
      formData.append("jabobo_id", jaboboId);
      formData.append("voiceprint_name", voiceprintName);
      formData.append("file_path", filePath);

      const response = await apiClient.post('/voiceprint/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000

      });

      return {
        success: true,
        message: response.data?.message || '注册成功',
        detail: '',
        data: response.data?.data || {} as VoiceprintRegisterResponse
      };
    } catch (error) {
      console.error("【注册错误】:", error);
      const axiosError = error as any;
      const backendError = axiosError.response?.data || {};
      return {
        success: false,
        message: backendError?.message || axiosError.message || '注册失败',
        detail: JSON.stringify(backendError?.detail || axiosError.stack),
        data: {} as VoiceprintRegisterResponse
      };
    }
  },

  listRegisteredVoiceprints: async (jaboboId: string): Promise<ApiResponse<RegisteredVoiceprint[]>> => {
    try {
      const response = await apiClient.get('/voiceprint/list', { params: { jabobo_id: jaboboId } });
      return {
        success: true,
        message: response.data?.message || '获取声纹列表成功',
        detail: '',
        data: response.data?.voiceprint_list || [] as RegisteredVoiceprint[]
      };
    } catch (error) {
      console.error("【获取声纹列表错误】:", error);
      const axiosError = error as any;
      const backendError = axiosError.response?.data || {};
      return {
        success: false,
        message: axiosError.response?.status === 404 
          ? '声纹列表接口路径错误' 
          : backendError?.message || axiosError.message || '获取声纹列表失败',
        detail: JSON.stringify(backendError?.detail || axiosError.stack),
        data: [] as RegisteredVoiceprint[]
      };
    }
  },

  /**
   * 修正后的删除声纹接口（适配后端Form传参+必填参数）
   * @param jaboboId 设备ID
   * @param speakerId 说话人ID（优先级高）
   * @param voiceprintName 声纹名称（必填，兜底）
   * @returns 删除响应
   */
  deleteRegisteredVoiceprint: async (
    jaboboId: string,
    speakerId: string,
    voiceprintName: string // 新增：传递声纹名称，满足后端必填
  ): Promise<ApiResponse> => {
    try {
      // 安全校验
      if (!jaboboId?.trim() || !speakerId?.trim() || !voiceprintName?.trim()) {
        return {
          success: false,
          message: '设备ID、声纹ID、声纹名称不能为空',
          detail: '',
          data: {}
        };
      }

      const formData = new FormData();
      formData.append("jabobo_id", jaboboId.trim());
      formData.append("voiceprint_name", voiceprintName.trim());
      formData.append("speaker_id", speakerId.trim()); // 优先级更高

      const response = await apiClient.post('/voiceprint/delete', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      return {
        success: true,
        message: response.data?.msg || '声纹删除成功',
        detail: '',
        data: response.data || {}
      };
    } catch (error) {
      console.error("【删除声纹错误】:", error);
      const axiosError = error as any;
      const backendError = axiosError.response?.data || {};
      const rawDetail = backendError?.detail;
      const detailMsg = Array.isArray(rawDetail)
        ? rawDetail.map((e: any) => e?.msg || JSON.stringify(e)).join('; ')
        : (typeof rawDetail === 'string' ? rawDetail : (rawDetail ? JSON.stringify(rawDetail) : ''));
      return {
        success: false,
        message: detailMsg || axiosError.message || '删除声纹失败',
        detail: JSON.stringify(backendError || axiosError.stack),
        data: {}
      };
    }
  }
};

export const jaboboVoice = JaboboVoice;