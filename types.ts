/**
 * 页面路由枚举类型
 */
export type Screen = 'LOGIN' | 'SIGNUP' | 'DASHBOARD' | 'VOICEPRINT' | 'KNOWLEDGE_BASE';

/**
 * 角色人设信息接口
 */
export interface Persona {
  id: string;
  name: string;
  content: string;
}

/**
 * 知识库文档信息接口
 */
export interface Document {
  id: string;
  name: string;
  size: string;
  date: string;
  filePath?: string; // 扩展字段：文件路径
}

/**
 * 聊天历史/音频列表展示项接口
 */
export interface ChatHistory {
  id: string;
  title: string;
  duration: string;
  date: string;
}

/**
 * 后端返回的文件基础信息（知识库/音频通用）
 */
export interface BackendFileInfo {
  file_path: string;
  file_name: string;
  file_size_bytes: number;
  file_size_mb: number;
  upload_time: string;
  upload_timestamp: number;
  status?: string; // 文件状态（可选）
}

/**
 * 音频文件详细信息接口（继承基础文件信息）
 */
export interface AudioFileInfo extends BackendFileInfo {
  audio_format: string; // 音频格式（mp3/wav等）
  audio_content: string; // 音频文本内容
  current_modify_time?: string; // 最后修改时间（可选）
}

/**
 * 声纹注册请求参数类型
 */
export interface VoiceprintRegisterParams {
  jaboboId: string;
  voiceprintName: string; // 声纹名称
  filePath: string; // 音频文件
  xUsername: string; // 用户名（请求头）
  authorization: string; // Token（请求头）
}

/**
 * 声纹注册响应数据类型
 */
export interface VoiceprintRegisterResponse {
  voiceprint_id?: string; // 声纹ID（预留）
  voiceprint_name: string; // 声纹名称
  file_path: string; // 关联的音频文件路径
  create_time: string; // 创建时间
}

/**
 * 知识库列表响应类型
 */
export interface ListKnowledgeBaseResponse {
  success: boolean;
  total_count: number;
  kb_list: BackendFileInfo[];
  message: string;
}

/**
 * 登录响应类型
 */
export interface LoginResponse {
  success: boolean;
  username: string;
  role: string;
  token: string; // 后端UUID生成的session_token
  message?: string;
}

/**
 * 用户信息接口
 */
export interface User {
  id: number;
  username: string;
  role: string;
  create_time: string;
  token?: string; // 用户登录令牌（可选）
}

/**
 * 用户配置信息接口
 */
export type AsrProvider = '' | 'funasr' | 'azure_asr';
export type TtsProvider = '' | 'huoshan_double_stream' | 'azure_tts';
export type LlmProvider = '' | 'qwen-turbo' | 'deepseek-v4-flash' | 'gpt-5.4-nano';

export interface VoiceOption {
  id: string;
  name: string;
}

// 内置默认音色，前端展示用，不写入 DB；后端在 voice_id 为空时套用同一 ID。
export const DEFAULT_AZURE_VOICE: VoiceOption = {
  id: 'zh-CN-XiaoxiaoNeural',
  name: '晓晓（默认）',
};
export const DEFAULT_HUOSHAN_VOICE: VoiceOption = {
  id: 'custom_mix_bigtts',
  name: '混合音色（默认）',
};

export interface UserConfig {
  persona: string;
  memory: string;
  voice_status: string;
  kb_status: string;
  current_version: string;
  expected_version: string;
  websocket_url?: string;
  websocket_url_list?: string[];
  asr_provider?: AsrProvider;
  tts_provider?: TtsProvider;
  llm_provider?: LlmProvider;
  azure_tts_voice_id?: string;
  azure_tts_voice_list?: VoiceOption[];
  huoshan_tts_voice_id?: string;
  huoshan_tts_voice_list?: VoiceOption[];
}

/**
 * 通用API响应类型（覆盖所有接口返回格式）
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  detail?: string; // 错误详情
  message?: string; // 提示信息
  token?: string; // 令牌（登录/刷新）
  username?: string; // 用户名
  role?: string; // 用户角色
  jabobo_ids?: string[]; // 设备ID列表
  jabobos?: { jabobo_id: string; device_name: string | null }[]; // 含名称的设备列表
  device_name?: string | null; // 重命名接口返回
  files?: any[]; // 通用文件列表（兼容旧接口）
  
  // 音频接口特有字段
  current_audio_info?: AudioFileInfo; // 当前选中音频信息
  all_audio_paths?: AudioFileInfo[]; // 所有音频路径（兼容旧字段）
  total_count?: number; // 总数
  audio_list?: AudioFileInfo[]; // 音频列表（主字段）
  deleted_path?: string; // 已删除文件路径
  remaining_audio_paths?: AudioFileInfo[]; // 删除后剩余音频
  
  // 声纹注册特有字段
  voiceprint_info?: VoiceprintRegisterResponse; // 声纹注册信息
  current_version?: string;
  expected_version?: string;
}