import React, { useEffect, useState, useRef } from 'react';
import { Waves, Book, UserCircle, Brain, RefreshCw, Plus, Settings2, Users, LogOut, Loader2, ChevronLeft, Cpu, X, Mic, Speaker, Trash2, Sparkles, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import { Screen, Persona } from '../types';
import { UserConfig, AsrProvider, TtsProvider, LlmProvider, VoiceOption, DEFAULT_AZURE_VOICE, DEFAULT_HUOSHAN_VOICE } from "@/types";
import { JaboboConfig } from '../api/jabobo_congfig';
import { jaboboManager } from '../api/jabobo_manager';
import dashboadImg from '../assets/dashboad.png';

interface DashboardProps {
  jaboboId: string; 
  onNavigate: (screen: Screen) => void;
  personas: Persona[];
  setPersonas: React.Dispatch<React.SetStateAction<Persona[]>>;
  activePersonaId: string;
  setActivePersonaId: (id: string) => void;
  onUpdatePersona: (id: string, content: string) => void;
  onAddPersona: () => void;
  onDeletePersona: (id: string) => void;
  memory: string;
  setMemory: (v: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  jaboboId, onNavigate, personas, setPersonas, activePersonaId, 
  setActivePersonaId, onUpdatePersona, onAddPersona, onDeletePersona, 
  memory, setMemory 
}) => {
  const { t } = useTranslation();
  
  const activePersona = personas.find(p => p.id === activePersonaId) || personas[0] || { content: '' };
  const [currentUser, setCurrentUser] = useState<{ username: string; role: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState(t('dashboard.loading'));
  const [kbStatus, setKbStatus] = useState(t('dashboard.loading'));
  const [editingPersonaId, setEditingPersonaId] = useState<string | null>(null);
  const [tempPersonaName, setTempPersonaName] = useState('');
  const [currentVersion, setCurrentVersion] = useState('1.0.0');
  const [expectedVersion, setExpectedVersion] = useState('');
  const [firmwareList, setFirmwareList] = useState<{ filename: string; version: string | null; size: number }[]>([]);
  const [firmwareSaving, setFirmwareSaving] = useState(false);
  const [wsUrl, setWsUrl] = useState('');
  const [wsUrlList, setWsUrlList] = useState<string[]>([]);
  const [showWsUrlAdder, setShowWsUrlAdder] = useState(false);
  const [newWsUrl, setNewWsUrl] = useState('');
  const [asrProvider, setAsrProvider] = useState<AsrProvider>('');
  const [ttsProvider, setTtsProvider] = useState<TtsProvider>('');
  const [llmProvider, setLlmProvider] = useState<LlmProvider>('');
  const [azureVoiceId, setAzureVoiceId] = useState<string>('');
  const [azureVoiceList, setAzureVoiceList] = useState<VoiceOption[]>([]);
  const [huoshanVoiceId, setHuoshanVoiceId] = useState<string>('');
  const [huoshanVoiceList, setHuoshanVoiceList] = useState<VoiceOption[]>([]);
  const [newVoiceId, setNewVoiceId] = useState('');
  const [newVoiceName, setNewVoiceName] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);
  const newWsUrlInputRef = useRef<HTMLInputElement>(null);

  // 修正1：版本号比较函数（逻辑正确，保留）
  const compareVersion = (v1: string, v2: string): number => {
    const arr1 = v1.split('.').map(Number);
    const arr2 = v2.split('.').map(Number);
    const maxLen = Math.max(arr1.length, arr2.length);
    
    for (let i = 0; i < maxLen; i++) {
      const num1 = arr1[i] || 0;
      const num2 = arr2[i] || 0;
      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }
    return 0;
  };

  // expected_version 为空串表示"不升级"，不应显示 new badge / mismatch
  const showNewBadge = !!expectedVersion && compareVersion(expectedVersion, currentVersion) === 1;
  const isVersionMismatch = !!expectedVersion && currentVersion !== expectedVersion;

  // 修正3：新增调试日志（便于排查版本号值的问题）
  useEffect(() => {
    console.log('版本号信息：', {
      currentVersion,
      expectedVersion,
      compareResult: compareVersion(expectedVersion, currentVersion),
      showNewBadge
    });
  }, [currentVersion, expectedVersion]);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      fetchServerConfig(); 
    } else {
      onNavigate('LOGIN');
    }
  }, [jaboboId]); 

  useEffect(() => {
    if (editingPersonaId && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingPersonaId]);

  useEffect(() => {
    if (showWsUrlAdder && newWsUrlInputRef.current) {
      newWsUrlInputRef.current.focus();
    }
  }, [showWsUrlAdder]);

  useEffect(() => {
    (async () => {
      try {
        const res = await jaboboManager.listFirmwares();
        if (res.success && Array.isArray(res.data)) {
          setFirmwareList(res.data);
        }
      } catch (err) {
        console.error('获取固件列表失败：', err);
      }
    })();
  }, []);

  const handleSaveExpectedVersion = async (target: string) => {
    if (firmwareSaving) return;
    if (target === expectedVersion) return;
    setFirmwareSaving(true);
    try {
      const res = await jaboboManager.setExpectedVersion(jaboboId, target);
      if (res.success) {
        setExpectedVersion(target);
      } else {
        alert(t('dashboard.firmwareUpdateFailed', { defaultValue: '设置目标版本失败' }));
      }
    } catch (err: any) {
      console.error('设置目标版本失败：', err);
      alert(err?.response?.data?.detail || err?.message || t('dashboard.firmwareUpdateFailed', { defaultValue: '设置目标版本失败' }));
    } finally {
      setFirmwareSaving(false);
    }
  };

  const fetchServerConfig = async () => {
    try {
      const res = await JaboboConfig.getUserConfig(jaboboId);
      if (res.success && res.data) {
        const rawPersona = res.data.persona;
        try {
          const parsed = JSON.parse(rawPersona);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPersonas(parsed);
            setActivePersonaId(parsed[0].id);
          }
        } catch (e) {
          if (rawPersona) {
            setPersonas([{ id: 'default', name: t('dashboard.defaultPersonaName'), content: rawPersona }]);
            setActivePersonaId('default');
          }
        }
        setMemory(res.data.memory || '');
        setVoiceStatus(res.data.voice_status || t('dashboard.ready'));
        setKbStatus(res.data.kb_status || t('dashboard.synced'));
        // expected_version 空串 = "不下发升级"，前端不再兜底成 1.0.0
        const cv = res.data.current_version || '1.0.0';
        const ev = typeof res.data.expected_version === 'string' ? res.data.expected_version : '';
        setCurrentVersion(cv);
        setExpectedVersion(ev);
        const savedWs = res.data.websocket_url || '';
        setWsUrl(savedWs);
        const rawList = Array.isArray(res.data.websocket_url_list) ? res.data.websocket_url_list : [];
        const cleanList = rawList.filter((u): u is string => typeof u === 'string' && u.trim() !== '');
        const merged = savedWs && !cleanList.includes(savedWs)
          ? [savedWs, ...cleanList]
          : cleanList;
        setWsUrlList(merged);
        setAsrProvider((res.data.asr_provider as AsrProvider) || '');
        setTtsProvider((res.data.tts_provider as TtsProvider) || '');
        setLlmProvider((res.data.llm_provider as LlmProvider) || '');
        setAzureVoiceId(res.data.azure_tts_voice_id || '');
        setAzureVoiceList(Array.isArray(res.data.azure_tts_voice_list) ? res.data.azure_tts_voice_list : []);
        setHuoshanVoiceId(res.data.huoshan_tts_voice_id || '');
        setHuoshanVoiceList(Array.isArray(res.data.huoshan_tts_voice_list) ? res.data.huoshan_tts_voice_list : []);
        console.log('从接口读取的版本号：', { current_version: cv, expected_version: ev });
      }
    } catch (err) { console.error('获取配置失败：', err); }
  };

  // 其他函数逻辑不变（省略）
  const startEditingPersonaName = (persona: Persona) => {
    setEditingPersonaId(persona.id);
    setTempPersonaName(persona.name);
  };

  const confirmPersonaNameChange = () => {
    if (!editingPersonaId || !tempPersonaName.trim()) return;
    
    setPersonas(prev => prev.map(p => 
      p.id === editingPersonaId 
        ? { ...p, name: tempPersonaName.trim() } 
        : p
    ));
    setEditingPersonaId(null);
  };

  const cancelPersonaNameEdit = () => {
    setEditingPersonaId(null);
    setTempPersonaName('');
  };

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    
    try {
      const selected = personas.find(p => p.id === activePersonaId);
      if (!selected) return;
      const newOrdered = [selected, ...personas.filter(p => p.id !== activePersonaId)];

      const trimmedWs = wsUrl.trim();
      const dedupList = Array.from(new Set(
        wsUrlList.map(u => u.trim()).filter(Boolean)
      ));
      const payload: UserConfig = {
        persona: JSON.stringify(newOrdered),
        memory: memory,
        voice_status: voiceStatus,
        kb_status: kbStatus,
        current_version: currentVersion,
        expected_version: expectedVersion,
        websocket_url: trimmedWs,
        websocket_url_list: dedupList,
        asr_provider: asrProvider,
        tts_provider: ttsProvider,
        llm_provider: llmProvider,
        azure_tts_voice_id: azureVoiceId,
        azure_tts_voice_list: azureVoiceList,
        huoshan_tts_voice_id: huoshanVoiceId,
        huoshan_tts_voice_list: huoshanVoiceList,
      };
      
      const res = await JaboboConfig.syncConfig(jaboboId, payload);
      
      if (res.success) {
        setPersonas(newOrdered);
        alert(`${t('dashboard.syncSuccess')} ${jaboboId.slice(-4)}！`);
      }
    } catch (err) {
      alert(t('dashboard.syncFailed'));
    } finally {
      setIsSyncing(false);
    }
  };

  const isValidWsUrl = (raw: string): boolean => {
    const v = raw.trim();
    if (!v) return false;
    return /^wss?:\/\/[^\s]+$/i.test(v);
  };

  const handleAddWsUrl = () => {
    const v = newWsUrl.trim();
    if (!isValidWsUrl(v)) {
      alert(t('dashboard.wsUrlInvalid'));
      return;
    }
    if (wsUrlList.includes(v)) {
      alert(t('dashboard.wsUrlDuplicate'));
      return;
    }
    setWsUrlList(prev => [...prev, v]);
    setWsUrl(v);
    setNewWsUrl('');
    setShowWsUrlAdder(false);
  };

  const handleRemoveWsUrl = (target: string) => {
    setWsUrlList(prev => prev.filter(u => u !== target));
    if (wsUrl === target) setWsUrl('');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('active_jabobo_uuid');
    onNavigate('LOGIN');
  };

  // —— TTS 音色管理 ——
  // tts_provider 为空时（老记录 NULL）后端按 huoshan 兜底，UI 也跟着兜底，
  // 否则 select 视觉上显示第一项但 state 仍是 '' 会导致音色卡整块不渲染。
  const effectiveTtsProvider: TtsProvider =
    ttsProvider === 'azure_tts' ? 'azure_tts' : 'huoshan_double_stream';
  const isAzure = effectiveTtsProvider === 'azure_tts';
  const isHuoshan = effectiveTtsProvider === 'huoshan_double_stream';
  const defaultVoice = isAzure ? DEFAULT_AZURE_VOICE : DEFAULT_HUOSHAN_VOICE;
  const customVoiceList = isAzure ? azureVoiceList : isHuoshan ? huoshanVoiceList : [];
  const selectedVoiceId = isAzure ? azureVoiceId : isHuoshan ? huoshanVoiceId : '';
  // 全部展示项 = [默认] + 自定义；若选中 ID 不在列表里（含默认），回退到默认
  const allVoiceItems: VoiceOption[] = defaultVoice ? [defaultVoice, ...customVoiceList] : [];
  const effectiveSelectedId = (() => {
    if (!defaultVoice) return '';
    if (!selectedVoiceId) return defaultVoice.id;
    return allVoiceItems.some(v => v.id === selectedVoiceId) ? selectedVoiceId : defaultVoice.id;
  })();

  const setSelectedVoice = (id: string) => {
    if (isAzure) setAzureVoiceId(id);
    else if (isHuoshan) setHuoshanVoiceId(id);
  };
  const setCustomVoiceList = (next: VoiceOption[]) => {
    if (isAzure) setAzureVoiceList(next);
    else if (isHuoshan) setHuoshanVoiceList(next);
  };

  const handleAddVoice = () => {
    if (!defaultVoice) return;
    const id = newVoiceId.trim();
    const name = newVoiceName.trim();
    if (!id) {
      alert(t('dashboard.ttsVoiceIdRequired'));
      return;
    }
    if (id === defaultVoice.id || allVoiceItems.some(v => v.id === id)) {
      alert(t('dashboard.ttsVoiceDuplicate'));
      return;
    }
    setCustomVoiceList([...customVoiceList, { id, name: name || id }]);
    setNewVoiceId('');
    setNewVoiceName('');
  };

  const handleRemoveVoice = (id: string) => {
    if (!defaultVoice) return;
    const next = customVoiceList.filter(v => v.id !== id);
    setCustomVoiceList(next);
    if (selectedVoiceId === id) setSelectedVoice(defaultVoice.id);
  };

  if (!currentUser) return null;

  return (
    <Layout className="bg-gray-50 pb-12">
      <div className="bg-white px-6 pt-6 flex justify-between items-center">
        <button onClick={() => onNavigate('SELECT_JABOBO')} className="flex items-center text-gray-400 hover:text-yellow-500 font-black text-[10px] uppercase tracking-widest transition-all">
          <ChevronLeft size={16} className="mr-1" /> {t('dashboard.switchDevice')}
        </button>
        <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-gray-50 border border-gray-100 font-mono text-[10px] font-bold text-gray-400">
          <Cpu size={12} className="text-yellow-500" />
          <span>{jaboboId}</span>
        </div>
      </div>

      <div className="bg-white p-6 pb-12 rounded-b-[40px] shadow-sm mb-6 flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-4 px-2">
          {/* 核心修复：移除外层不必要的relative和padding，把定位基准移到版本号行 */}
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('dashboard.activeDevice')}</span>
            <h2 className="text-xl font-black text-gray-900">{currentUser.username}</h2>
            
            {/* 版本号展示区域：改为relative，作为new标识的定位基准 */}
            <div className="mt-1 flex items-center gap-2 relative pr-8">
              <span className="text-[9px] text-gray-500 font-bold">
                {t('dashboard.version')}: {currentVersion}
              </span>
                  {isVersionMismatch && (
                <span className="text-[9px] text-blue-500 font-bold">
                  ({expectedVersion})
                </span>
               )}
              {/* 修复new标识定位：相对于版本号行定位，精准对齐 */}
              {showNewBadge && (
                <div className="absolute top-1/2 right-0 -translate-y-1/2 bg-red-500 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full z-10 shadow-sm">
                  new
                </div>
              )}
            </div>
          </div>

          <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${currentUser.role === 'Admin' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
            {currentUser.role === 'Admin' ? t('dashboard.admin') : t('dashboard.user')}
          </div>
        </div>
        <div className="relative mb-6">
          <div className="w-56 h-72 bg-gray-50 rounded-3xl overflow-hidden flex items-center justify-center p-4">
            <img src={dashboadImg} alt={t('dashboard.mascot')} className="w-full h-full object-contain" />
          </div>
          <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 bg-yellow-400 text-gray-900 px-6 py-1 rounded-full font-black text-sm shadow-md uppercase">Jabobo</div>
        </div>

        {/* 固件目标版本选择：空串=不升级（默认） */}
        <div className="w-full bg-gray-50 rounded-2xl p-4 mt-2">
          <div className="flex items-center mb-3 text-gray-800">
            <Download size={16} className="mr-2 text-yellow-500" />
            <h3 className="font-bold text-sm">{t('dashboard.firmwareTarget', { defaultValue: '固件目标版本' })}</h3>
            {firmwareSaving && <Loader2 className="animate-spin ml-2 text-gray-400" size={14} />}
          </div>
          <p className="text-[10px] text-gray-500 mb-3 leading-relaxed">
            {t('dashboard.firmwareHint', {
              defaultValue: '选择"不升级"时设备保持当前版本；选择具体版本后，下次设备 OTA 检查时会被通知升级。'
            })}
          </p>
          <select
            value={expectedVersion}
            disabled={firmwareSaving}
            onChange={(e) => handleSaveExpectedVersion(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-yellow-400 focus:outline-none disabled:opacity-50"
          >
            <option value="">{t('dashboard.firmwareNone', { defaultValue: '不升级（默认）' })}</option>
            {firmwareList
              .filter(f => f.version !== null && f.version !== '')
              .map(f => (
                <option key={f.filename} value={f.version as string}>
                  {f.version}{currentVersion === f.version ? ` · ${t('dashboard.firmwareCurrent', { defaultValue: '当前' })}` : ''}{` (${(f.size / 1024 / 1024).toFixed(2)} MB)`}
                </option>
              ))}
          </select>
          {expectedVersion && !firmwareList.some(f => f.version === expectedVersion) && (
            <p className="text-[10px] text-red-500 mt-2 font-bold">
              ⚠️ {t('dashboard.firmwareMissing', { defaultValue: '当前目标版本在服务端 OTA 目录中不存在，设备不会升级。' })}（{expectedVersion}）
            </p>
          )}
        </div>
      </div>

      <div className="px-6 mb-4">
        <div className="bg-white p-5 rounded-[24px] shadow-sm border border-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center text-yellow-500"><UserCircle size={20} className="mr-2" /><h3 className="font-bold text-gray-800">{t('dashboard.personaCustomization')}</h3></div>
            <button onClick={onAddPersona} className="p-2 bg-gray-50 rounded-xl text-gray-400 hover:text-yellow-500 active:scale-95" aria-label={t('dashboard.addPersona')}>
              <Plus size={18} />
            </button>
          </div>
          <div className="flex space-x-2 overflow-x-auto pb-4 no-scrollbar">
            {personas.map((p) => (
              <div key={p.id} className="relative group flex-shrink-0 pt-1 pr-1">
                <div
                  onClick={() => setActivePersonaId(p.id)}
                  onDoubleClick={() => startEditingPersonaName(p)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${
                    activePersonaId === p.id ? 'bg-yellow-400 text-gray-900 border-yellow-400 shadow-md scale-105' : 'bg-gray-50 text-gray-400 border-gray-100'
                  }`}
                >
                  {editingPersonaId === p.id ? (
                    <div className="flex items-center justify-between w-[80px]">
                      <input
                        ref={nameInputRef}
                        type="text"
                        value={tempPersonaName}
                        onChange={(e) => setTempPersonaName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') confirmPersonaNameChange();
                          if (e.key === 'Escape') cancelPersonaNameEdit();
                        }}
                        onBlur={confirmPersonaNameChange}
                        className="w-full bg-transparent border-none outline-none text-xs font-black"
                        placeholder={t('dashboard.enterName')}
                      />
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelPersonaNameEdit();
                        }}
                        className="ml-1 text-gray-400 hover:text-gray-600"
                        aria-label={t('dashboard.cancel')}
                      >
                        <X size={10} strokeWidth={3} />
                      </button>
                    </div>
                  ) : (
                    <span>{p.name}</span>
                  )}
                </div>
                {personas.length > 1 && (
                  <button
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if (window.confirm(t('dashboard.confirmDeletePersona'))) onDeletePersona(p.id);
                    }}
                    className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    aria-label={t('dashboard.delete')}
                  >
                    <X size={10} strokeWidth={4} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <textarea
            value={activePersona.content}
            onChange={(e) => onUpdatePersona(activePersonaId, e.target.value)}
            className="w-full bg-gray-50 rounded-2xl p-4 text-sm text-gray-600 focus:outline-none min-h-[120px] resize-none"
            placeholder={t('dashboard.personaPlaceholder')}
          />
          <div className="mt-4">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
              {t('dashboard.wsUrl')}
            </label>
            <div className="flex items-center gap-2">
              <select
                value={wsUrl}
                onChange={(e) => setWsUrl(e.target.value)}
                className="flex-1 bg-gray-50 rounded-2xl p-4 text-sm text-gray-600 focus:outline-none font-mono appearance-none cursor-pointer"
                aria-label={t('dashboard.wsUrlSelect')}
              >
                <option value="">{t('dashboard.wsUrlDefault')}</option>
                {wsUrlList.map((url) => (
                  <option key={url} value={url}>{url}</option>
                ))}
              </select>
              {wsUrl && wsUrlList.includes(wsUrl) && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(t('dashboard.wsUrlRemove') + '?')) handleRemoveWsUrl(wsUrl);
                  }}
                  className="p-3 rounded-xl bg-gray-50 text-gray-400 hover:text-red-500 active:scale-95"
                  aria-label={t('dashboard.wsUrlRemove')}
                  title={t('dashboard.wsUrlRemove')}
                >
                  <Trash2 size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowWsUrlAdder(v => !v)}
                className="p-3 rounded-xl bg-gray-50 text-gray-400 hover:text-yellow-500 active:scale-95"
                aria-label={t('dashboard.wsUrlAddCustom')}
                title={t('dashboard.wsUrlAddCustom')}
              >
                <Plus size={16} />
              </button>
            </div>
            {showWsUrlAdder && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  ref={newWsUrlInputRef}
                  type="text"
                  value={newWsUrl}
                  onChange={(e) => setNewWsUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddWsUrl();
                    if (e.key === 'Escape') {
                      setShowWsUrlAdder(false);
                      setNewWsUrl('');
                    }
                  }}
                  className="flex-1 bg-gray-50 rounded-2xl p-3 text-sm text-gray-600 focus:outline-none font-mono"
                  placeholder={t('dashboard.wsUrlNewPlaceholder')}
                />
                <button
                  type="button"
                  onClick={handleAddWsUrl}
                  className="px-4 py-3 rounded-xl bg-yellow-400 text-gray-900 text-xs font-black active:scale-95"
                >
                  {t('dashboard.wsUrlAdd')}
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                <Mic size={10} /> {t('dashboard.asrProvider')}
              </label>
              <select
                value={asrProvider}
                onChange={(e) => setAsrProvider(e.target.value as AsrProvider)}
                className="w-full bg-gray-50 rounded-2xl p-4 text-sm text-gray-600 focus:outline-none cursor-pointer"
              >
                <option value="funasr">{t('dashboard.asrFunasr')}</option>
                <option value="azure_asr">{t('dashboard.asrAzure')}</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                <Speaker size={10} /> {t('dashboard.ttsProvider')}
              </label>
              <select
                value={ttsProvider}
                onChange={(e) => setTtsProvider(e.target.value as TtsProvider)}
                className="w-full bg-gray-50 rounded-2xl p-4 text-sm text-gray-600 focus:outline-none cursor-pointer"
              >
                <option value="huoshan_double_stream">{t('dashboard.ttsHuoshanDoubleStream')}</option>
                <option value="azure_tts">{t('dashboard.ttsAzure')}</option>
              </select>
            </div>
          </div>

          {defaultVoice && (
            <div className="mt-4 bg-gray-50 rounded-2xl p-4">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                <Speaker size={10} /> {t('dashboard.ttsVoice')}
              </label>
              <div className="space-y-2">
                {allVoiceItems.map((v, idx) => {
                  const isDefault = idx === 0;
                  const checked = effectiveSelectedId === v.id;
                  return (
                    <div key={v.id} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2">
                      <input
                        type="radio"
                        name="tts-voice"
                        checked={checked}
                        onChange={() => setSelectedVoice(v.id)}
                        className="cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-700 truncate">{v.name}</div>
                        <div className="text-[10px] font-mono text-gray-400 truncate">{v.id}</div>
                      </div>
                      {isDefault ? (
                        <span className="text-[10px] font-black uppercase tracking-widest text-yellow-500 bg-yellow-50 px-2 py-1 rounded-full">
                          {t('dashboard.ttsVoiceDefault')}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRemoveVoice(v.id)}
                          className="text-gray-300 hover:text-red-500 transition-colors"
                          aria-label={t('dashboard.ttsVoiceDelete')}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2">
                <input
                  type="text"
                  value={newVoiceId}
                  onChange={(e) => setNewVoiceId(e.target.value)}
                  placeholder={t('dashboard.ttsVoiceIdPlaceholder')}
                  className="bg-white rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none"
                />
                <input
                  type="text"
                  value={newVoiceName}
                  onChange={(e) => setNewVoiceName(e.target.value)}
                  placeholder={t('dashboard.ttsVoiceNamePlaceholder')}
                  className="bg-white rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddVoice}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-black uppercase tracking-widest rounded-xl px-4 py-2 transition-colors"
                >
                  {t('dashboard.ttsVoiceAdd')}
                </button>
              </div>

              <p className="mt-2 text-[10px] text-gray-400 leading-relaxed">
                {isAzure ? t('dashboard.ttsVoiceHelpAzure') : t('dashboard.ttsVoiceHelpHuoshan')}
              </p>
            </div>
          )}

          <div className="mt-4">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
              <Sparkles size={10} /> LLM
            </label>
            <select
              value={llmProvider}
              onChange={(e) => setLlmProvider(e.target.value as LlmProvider)}
              className="w-full bg-gray-50 rounded-2xl p-4 text-sm text-gray-600 focus:outline-none cursor-pointer"
            >
              <option value="">默认（Qwen Turbo）</option>
              <option value="qwen-turbo">Qwen Turbo</option>
              <option value="deepseek-v4-flash">DeepSeek v4 Flash</option>
              <option value="gpt-5.4-nano">GPT-5.4 Nano</option>
            </select>
          </div>
        </div>
      </div>

      <div className="px-6 mb-6">
        <div className="bg-white p-5 rounded-[24px] shadow-sm border border-white">
          <div className="flex items-center mb-3 text-yellow-500"><Brain size={20} className="mr-2" /><h3 className="font-bold text-gray-800">{t('dashboard.deviceMemory')}</h3></div>
          <textarea 
            value={memory} 
            onChange={(e) => setMemory(e.target.value)} 
            className="w-full bg-gray-50 rounded-2xl p-4 text-sm text-gray-600 min-h-[80px] resize-none"
            placeholder={t('dashboard.memoryPlaceholder')}
          />
        </div>
      </div>

       <div className="px-6 grid grid-cols-2 gap-4 mb-8">
        <button onClick={() => onNavigate('VOICEPRINT')} className="bg-white p-6 rounded-[28px] shadow-sm flex flex-col items-center hover:shadow-md transition-all active:scale-95 border border-white">
          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-3">
            <Waves size={24} />
          </div>
          <span className="font-black text-gray-800 text-xs">{t('dashboard.voiceprintSettings')}</span>
          <span className="text-[9px] text-gray-300 mt-1 font-bold uppercase tracking-widest">Voice</span>
        </button>

        <button onClick={() => onNavigate('KNOWLEDGE_BASE')} className="bg-white p-6 rounded-[28px] shadow-sm flex flex-col items-center hover:shadow-md transition-all active:scale-95 border border-white">
          <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center mb-3">
            <Book size={24} />
          </div>
          <span className="font-black text-gray-800 text-xs">{t('dashboard.knowledgeBase')}</span>
          <span className="text-[9px] text-gray-300 mt-1 font-bold uppercase tracking-widest">Library</span>
        </button>
      </div>

      <div className="px-6 mb-12">
        <button onClick={handleSync} disabled={isSyncing} className="w-full bg-yellow-400 py-5 rounded-3xl flex items-center justify-center font-black text-lg shadow-xl active:scale-[0.98] disabled:opacity-70 text-gray-900 transition-all">
          {isSyncing ? <Loader2 size={22} className="mr-3 animate-spin" /> : <RefreshCw size={22} className="mr-3" />}
          <span>{isSyncing ? t('dashboard.syncing') : t('dashboard.syncToDevice')}</span>
        </button>
      </div>

      <div className="px-6 border-t border-gray-100 pt-8 flex justify-center gap-x-8">
        <button onClick={() => onNavigate('SETTINGS')} className="flex items-center text-gray-400 text-[10px] font-black uppercase tracking-widest hover:text-gray-900 transition-colors">
          <Settings2 size={16} className="mr-2" /> {t('dashboard.settings')}
        </button>
        
        {currentUser.role === 'Admin' && (
          <button 
            onClick={() => onNavigate('ADMIN')} 
            className="flex items-center text-yellow-500 text-[10px] font-black uppercase tracking-widest hover:text-yellow-600 transition-colors"
          >
            <Users size={16} className="mr-2" /> {t('dashboard.adminPanel')}
          </button>
        )}
        
        <button onClick={handleLogout} className="flex items-center text-gray-400 text-[10px] font-black uppercase tracking-widest hover:text-red-500 transition-colors">
          <LogOut size={16} className="mr-2" /> {t('dashboard.signOut')}
        </button>
      </div>
    </Layout>
  );
};

export default Dashboard;