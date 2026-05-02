import React, { useEffect, useState, useRef } from 'react';
import { Waves, Book, UserCircle, Brain, RefreshCw, Plus, Settings2, Users, LogOut, Loader2, ChevronLeft, Cpu, X, Mic, Speaker, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import { Screen, Persona } from '../types';
import { UserConfig, AsrProvider, TtsProvider } from "@/types";
import { JaboboConfig } from '../api/jabobo_congfig';
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
  const [expectedVersion, setExpectedVersion] = useState('1.0.0');
  const [wsUrl, setWsUrl] = useState('');
  const [wsUrlList, setWsUrlList] = useState<string[]>([]);
  const [showWsUrlAdder, setShowWsUrlAdder] = useState(false);
  const [newWsUrl, setNewWsUrl] = useState('');
  const [asrProvider, setAsrProvider] = useState<AsrProvider>('');
  const [ttsProvider, setTtsProvider] = useState<TtsProvider>('');
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

  // 修正2：版本号比较逻辑（关键！写反的地方）
  // 正确逻辑：预期版本 > 当前版本 时显示new
  const showNewBadge = compareVersion(expectedVersion, currentVersion) === 1;
  const isVersionMismatch = currentVersion !== expectedVersion;

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
        // 修正4：确保版本号从接口正确读取（添加日志）
        const cv = res.data.current_version || '1.0.0';
        const ev = res.data.expected_version || '1.0.0';
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
        tts_provider: ttsProvider
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