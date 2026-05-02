  import React, { useState, useEffect } from 'react';
  import { Plus, Cpu, LogOut, Link as LinkIcon, X, Loader2, Trash2, Pencil } from 'lucide-react';
  import Layout from '../components/Layout';
  import { Screen } from '../types';
  import { jaboboManager } from '../api/jabobo_manager';
  import { useTranslation } from 'react-i18next';
  import '../i18n';

  interface JaboboSelectorProps {
    onSelect: (uuid: string) => void;
    onNavigate: (screen: Screen) => void;
  }

  interface DeviceItem {
    id: string;
    name: string | null;
  }

  const JaboboSelector: React.FC<JaboboSelectorProps> = ({ onSelect, onNavigate }) => {
    // 状态管理
    const [devices, setDevices] = useState<DeviceItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isBinding, setIsBinding] = useState(false);
    const [inputUuid, setInputUuid] = useState('');
    const [validateError, setValidateError] = useState('');
    const [deleteConfirmUuid, setDeleteConfirmUuid] = useState<string | null>(null);
    const [deletingUuid, setDeletingUuid] = useState<string | null>(null);
    const [renameTargetUuid, setRenameTargetUuid] = useState<string | null>(null);
    const [renameInput, setRenameInput] = useState('');
    const [renameError, setRenameError] = useState('');
    const [renamingUuid, setRenamingUuid] = useState<string | null>(null);

    // 多语言：使用 ready 状态判断翻译是否加载完成（替代 isLoaded）
    const { t, ready, i18n } = useTranslation();

    // 调试日志（开发阶段用，可删除）
    useEffect(() => {
      console.log("=== i18n 调试信息 ===");
      console.log("翻译是否就绪：", ready);
      console.log("当前语言：", i18n.language);
      console.log("title 翻译结果：", ready ? t("jaboboSelector.title") : "加载中...");
    }, [ready, t, i18n]);

    // 翻译就绪后加载设备列表
    useEffect(() => {
      if (ready) {
        fetchJaboboList();
      }
    }, [ready]);

    // 获取设备列表
    const fetchJaboboList = async () => {
      setIsLoading(true);
      try {
        const res = await jaboboManager.getJaboboIds();
        if (res.success && Array.isArray(res.jabobos)) {
          setDevices(res.jabobos.map(d => ({ id: d.jabobo_id, name: d.device_name })));
        } else if (res.success && Array.isArray(res.jabobo_ids)) {
          setDevices(res.jabobo_ids.map(id => ({ id, name: null })));
        }
      } catch (err) {
        console.error(ready ? t("common.networkError") : "网络错误，请重试", err);
        alert(ready ? t("common.networkError") : "网络错误，请重试");
      } finally {
        setIsLoading(false);
      }
    };

    // 设备ID校验
    const validateJaboboId = (id: string): { valid: boolean; message: string } => {
      const trimmedId = id.trim().toUpperCase();
      if (!trimmedId) {
        return { valid: false, message: t("jaboboSelector.validate.empty") };
      }
      const isMacFormat = trimmedId.length === 17 && trimmedId.split(':').length === 6;
      const is6DigitFormat = trimmedId.length === 6 && /^\d+$/.test(trimmedId);
      if (!isMacFormat && !is6DigitFormat) {
        return { 
          valid: false, 
          message: t("jaboboSelector.validate.formatError") 
        };
      }
      return { valid: true, message: "" };
    };

    // 绑定设备
    const handleBind = async () => {
    // 前端本地校验
    const { valid, message } = validateJaboboId(inputUuid);
    if (!valid) {
      setValidateError(message);
      return;
    }
    setValidateError('');

    const val = inputUuid.trim().toUpperCase();
    try {
      const res = await jaboboManager.bindJabobo(val);
      
      // 情况1：接口正常响应（200 OK），但业务逻辑失败（如 res.success = false）
      if (res.success) {
        await fetchJaboboList();
        setIsBinding(false);
          setInputUuid('');
        } else {
          alert(res.message || t("jaboboSelector.bindFail"));
        }
      } catch (err) {
        // 情况2：接口抛出异常（非200状态码，如400/500等）
        // 精确处理400错误（无效设备ID）
        if (err.response?.status === 400) {
          // 优先取后端返回的detail（对应HTTPException的detail），无则用通用提示
          const errorMsg =  t("jaboboSelector.invalidDeviceId");
          alert(errorMsg);
        } 
        // 其他状态码错误（如500服务器错误）
        else if (err.response?.status) {
          alert(t("common.serverError"));
        } 
        // 纯网络错误（如断网、跨域、请求超时）
        else {
          alert(t("common.networkError"));
        }
      }
    };

    // 输入框变化处理
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputUuid(e.target.value);
      if (validateError) {
        setValidateError('');
      }
    };

    // 删除设备
    const handleDelete = async (uuid: string) => {
      if (deletingUuid === uuid) return;
      setDeletingUuid(uuid);
      try {
        const res = await jaboboManager.unbindJabobo(uuid);
        if (res.success) {
          setDevices(prev => prev.filter(item => item.id !== uuid));
          alert(t("jaboboSelector.deleteSuccess"));
        } else {
          alert(res.message || t("jaboboSelector.deleteFail"));
        }
      } catch (err) {
        console.error(t("common.networkError"), err);
        alert(t("common.networkError"));
      } finally {
        setDeletingUuid(null);
        setDeleteConfirmUuid(null);
      }
    };

    // 打开重命名弹窗
    const openRename = (uuid: string, currentName: string | null) => {
      setRenameTargetUuid(uuid);
      setRenameInput(currentName ?? '');
      setRenameError('');
    };

    const closeRename = () => {
      setRenameTargetUuid(null);
      setRenameInput('');
      setRenameError('');
    };

    // 提交重命名
    const handleRename = async (uuid: string) => {
      const trimmed = renameInput.trim();
      if (trimmed.length > 64) {
        setRenameError(t("jaboboSelector.renameTooLong"));
        return;
      }
      if (renamingUuid === uuid) return;
      setRenamingUuid(uuid);
      try {
        const newName = trimmed === '' ? null : trimmed;
        const res = await jaboboManager.renameJabobo(uuid, newName);
        if (res.success) {
          const persisted = (res.device_name ?? newName) as string | null;
          setDevices(prev => prev.map(d => d.id === uuid ? { ...d, name: persisted } : d));
          closeRename();
        } else {
          alert(res.message || t("jaboboSelector.renameFail"));
        }
      } catch (err) {
        console.error(t("jaboboSelector.renameFail"), err);
        alert(t("common.networkError"));
      } finally {
        setRenamingUuid(null);
      }
    };

    // 翻译未就绪时显示加载中
    if (!ready) {
      return (
        <div className="flex items-center justify-center h-screen bg-white">
          <Loader2 className="animate-spin text-yellow-400" size={48} />
        </div>
      );
    }

    return (
      <Layout className="bg-white h-full flex flex-col p-8 md:p-12">
        {/* 顶部标题栏 */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-black text-gray-900 italic tracking-tighter uppercase">
              {t("jaboboSelector.title")}
            </h1>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">
              {t("jaboboSelector.subtitle")}
            </p>
          </div>
          <button 
            onClick={() => { localStorage.clear(); onNavigate('LOGIN'); }} 
            className="p-4 text-gray-300 hover:text-red-500 transition-colors"
            aria-label={t("common.logout")}
          >
            <LogOut size={28}/>
          </button>
        </div>

        {/* 设备列表 */}
        <div className="flex-1 overflow-y-auto pr-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="animate-spin text-yellow-400" size={48} />
              <span className="ml-4 text-gray-500 font-bold">{t("common.loading")}</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* 已绑定设备 */}
              {devices.map(({ id: uuid, name }) => (
                <div
                  key={uuid}
                  className="group bg-gray-50 border-2 border-transparent hover:border-yellow-400 p-10 rounded-[40px] transition-all cursor-pointer shadow-sm hover:shadow-xl relative"
                >
                  <div
                    onClick={(e) => {
                      const target = e.target as HTMLElement;
                      if (!target.closest('.delete-btn') && !target.closest('.rename-btn')) {
                        onSelect(uuid);
                      }
                    }}
                    className="h-full w-full"
                  >
                    <div className="w-20 h-20 bg-gray-900 rounded-[24px] flex items-center justify-center text-yellow-400 mb-8 group-hover:scale-110 transition-transform shadow-lg">
                      <Cpu size={40} />
                    </div>
                    <div className="font-black text-2xl text-gray-900 italic tracking-tight mb-2 uppercase break-words">
                      {name && name.trim() !== '' ? name : t("jaboboSelector.deviceCardTitle")}
                    </div>
                    <div className="font-mono text-sm text-gray-400 font-bold tracking-widest break-all">{uuid}</div>
                  </div>

                  {/* 重命名 + 删除按钮 */}
                  <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button
                      className="rename-btn p-2 text-gray-300 hover:text-yellow-500 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        openRename(uuid, name);
                      }}
                      aria-label={t("jaboboSelector.rename")}
                      title={t("jaboboSelector.rename")}
                    >
                      <Pencil size={20} />
                    </button>
                    <button
                      className="delete-btn p-2 text-gray-300 hover:text-red-500 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmUuid(uuid);
                      }}
                      aria-label={t("common.delete")}
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>

                  {/* 删除确认弹窗 */}
                  {deleteConfirmUuid === uuid && (
                    <div className="absolute inset-0 bg-black/70 rounded-[40px] flex flex-col items-center justify-center z-20 animate-in fade-in-50">
                      <p className="text-white font-bold text-sm mb-4 text-center">
                        {t("jaboboSelector.deleteConfirm")}
                      </p>
                      <div className="flex gap-4">
                        <button
                          onClick={() => setDeleteConfirmUuid(null)}
                          className="bg-gray-200 text-gray-800 px-6 py-2 rounded-xl font-black text-xs uppercase"
                        >
                          {t("common.cancel")}
                        </button>
                        <button
                          onClick={() => handleDelete(uuid)}
                          disabled={deletingUuid === uuid}
                          className="bg-red-500 text-white px-6 py-2 rounded-xl font-black text-xs uppercase active:scale-95 transition-all"
                        >
                          {deletingUuid === uuid ? (
                            <Loader2 size={16} className="animate-spin mx-auto" />
                          ) : (
                            t("common.delete")
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 重命名弹窗 */}
                  {renameTargetUuid === uuid && (
                    <div
                      className="absolute inset-0 bg-black/80 rounded-[40px] flex flex-col items-stretch justify-center z-20 p-6 animate-in fade-in-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <p className="text-white font-black text-sm mb-3 text-center uppercase tracking-widest">
                        {t("jaboboSelector.renameTitle")}
                      </p>
                      <input
                        autoFocus
                        value={renameInput}
                        onChange={(e) => {
                          setRenameInput(e.target.value);
                          if (renameError) setRenameError('');
                        }}
                        maxLength={64}
                        placeholder={t("jaboboSelector.renamePlaceholder")}
                        className={`w-full bg-white rounded-xl px-4 py-3 font-bold text-gray-900 outline-none mb-1 text-sm ${
                          renameError ? 'border-2 border-red-500' : ''
                        }`}
                      />
                      {renameError ? (
                        <p className="text-red-300 text-xs font-bold mb-3">{renameError}</p>
                      ) : (
                        <p className="text-gray-300 text-[10px] mb-3">{t("jaboboSelector.renameClearHint")}</p>
                      )}
                      <div className="flex gap-3 justify-center">
                        <button
                          onClick={closeRename}
                          className="bg-gray-200 text-gray-800 px-5 py-2 rounded-xl font-black text-xs uppercase"
                        >
                          {t("common.cancel")}
                        </button>
                        <button
                          onClick={() => handleRename(uuid)}
                          disabled={renamingUuid === uuid}
                          className="bg-yellow-400 text-gray-900 px-5 py-2 rounded-xl font-black text-xs uppercase active:scale-95 transition-all"
                        >
                          {renamingUuid === uuid ? (
                            <Loader2 size={16} className="animate-spin mx-auto" />
                          ) : (
                            t("common.save")
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* 绑定新设备入口 */}
              {!isBinding ? (
                <button 
                  onClick={() => setIsBinding(true)}
                  className="border-2 border-dashed border-gray-100 p-10 rounded-[40px] flex flex-col items-center justify-center text-gray-300 hover:border-yellow-400 hover:text-yellow-400 transition-all min-h-[260px]"
                >
                  <Plus size={48} />
                  <span className="font-black text-xs uppercase tracking-widest mt-4">
                    {t("jaboboSelector.bindNewBtn")}
                  </span>
                </button>
              ) : (
                <div className="lg:col-span-1 bg-yellow-50 border-2 border-yellow-400 p-10 rounded-[40px] flex flex-col justify-center animate-in zoom-in-95">
                  <div className="flex justify-between items-center mb-8">
                    <span className="font-black text-sm text-yellow-700 uppercase tracking-widest flex items-center">
                      <LinkIcon size={18} className="mr-3"/> {t("jaboboSelector.bindTitle")}
                    </span>
                    <button 
                      onClick={() => setIsBinding(false)}
                      aria-label={t("common.cancel")}
                    >
                      <X size={20}/>
                    </button>
                  </div>
                  <input 
                    autoFocus 
                    value={inputUuid} 
                    onChange={handleInputChange}
                    className={`w-full bg-white rounded-2xl px-6 py-4 font-bold text-gray-900 shadow-inner outline-none mb-2 ${
                      validateError ? 'border-2 border-red-500' : ''
                    }`}
                    placeholder={t("jaboboSelector.inputPlaceholder")}
                  />
                  {validateError && (
                    <p className="text-red-500 text-xs font-bold mb-4">{validateError}</p>
                  )}
                  <button 
                    onClick={handleBind} 
                    className="bg-gray-900 text-yellow-400 py-4 rounded-2xl font-black text-xs uppercase active:scale-95 transition-all"
                  >
                    {t("jaboboSelector.confirmBindBtn")}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </Layout>
    );
  };

  export default JaboboSelector;