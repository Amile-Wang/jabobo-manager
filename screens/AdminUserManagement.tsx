import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, ChevronLeft, Loader2, RefreshCw, Key } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Screen } from '../types';
import { userManagementApi, User } from '../api/user';

interface AdminProps {
  onNavigate: (screen: Screen) => void;
}

const AdminUserManagement: React.FC<AdminProps> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('User');

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const result = await userManagementApi.getUsers();
      if (result.success && result.data) {
        setUsers(result.data);
      } else {
        alert(result.detail || t('admin.alertFetchFailed'));
      }
    } catch (err: any) {
      alert(err.message || t('admin.alertNetwork'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('create');
    try {
      const res = await userManagementApi.createUser({
        username: newUsername,
        password: newPassword,
        role: newRole
      });
      if (res.success) {
        setNewUsername('');
        setNewPassword('');
        fetchUsers();
      } else {
        alert(res.detail || t('admin.alertCreateFailed'));
      }
    } catch (err: any) {
      alert(err.message || t('admin.alertCreateFailed'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPassword = async (targetUsername: string) => {
    const newPwd = window.prompt(t('admin.promptNewPassword', { username: targetUsername }));
    if (!newPwd) return;
    if (newPwd.length < 6) {
      alert(t('admin.alertPasswordTooShort'));
      return;
    }

    setActionLoading(targetUsername);
    try {
      const res = await userManagementApi.updatePassword({
        username: targetUsername,
        new_password: newPwd
      });
      if (res.success) alert(t('admin.alertResetSuccess', { username: targetUsername }));
      else alert(res.detail || t('admin.alertResetFailed'));
    } catch (err: any) {
      alert(err.message || t('admin.alertResetFailed'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (targetUsername: string) => {
    if (!window.confirm(t('admin.confirmDelete', { username: targetUsername }))) return;

    setActionLoading(targetUsername);
    try {
      const res = await userManagementApi.deleteUser(targetUsername);
      if (res.success) fetchUsers();
      else alert(res.detail || t('admin.alertDeleteFailed'));
    } catch (err: any) {
      alert(err.message || t('admin.alertDeleteFailed'));
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto flex items-center justify-between mb-8">
        <button
          onClick={() => onNavigate('DASHBOARD')}
          className="flex items-center text-gray-500 hover:text-gray-900 font-bold text-xs uppercase tracking-widest transition-colors"
        >
          <ChevronLeft size={16} className="mr-1" /> {t('admin.back')}
        </button>
        <button
          onClick={fetchUsers}
          className={`text-gray-400 hover:text-gray-900 transition-all ${loading ? 'animate-spin' : ''}`}
          aria-label={t('common.refresh')}
        >
          <RefreshCw size={20} />
        </button>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

        <div className="lg:col-span-1">
          <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 sticky top-8">
            <div className="flex items-center mb-6 text-gray-900">
              <UserPlus size={24} className="mr-3" />
              <h2 className="text-xl font-black">{t('admin.createSection')}</h2>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">{t('admin.username')}</label>
                <input
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-yellow-400 transition-all"
                  placeholder={t('admin.usernamePlaceholder')}
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">{t('admin.initialPassword')}</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-yellow-400 transition-all"
                  placeholder={t('admin.passwordPlaceholder')}
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">{t('admin.role')}</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-yellow-400 transition-all"
                >
                  <option value="User">{t('admin.roleUser')}</option>
                  <option value="Admin">{t('admin.roleAdmin')}</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={actionLoading === 'create'}
                className="w-full bg-gray-900 text-yellow-400 py-4 rounded-2xl font-black text-sm mt-4 hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {actionLoading === 'create' ? t('admin.creating') : t('admin.submitCreate')}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-[40px] p-2 shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="text-left py-6 px-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('admin.tableUserInfo')}</th>
                  <th className="text-left py-6 px-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('admin.tableRole')}</th>
                  <th className="text-right py-6 px-8 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('admin.tableActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading && users.length === 0 ? (
                  <tr><td colSpan={3} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-yellow-400" /></td></tr>
                ) : users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="py-6 px-6">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center font-black text-gray-400 mr-4">
                          {user.username[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-black text-gray-800">{user.username}</div>
                          <div className="text-[10px] text-gray-400 font-bold tracking-tight">{user.create_time}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-6 px-4">
                      <span className={`text-[10px] font-black px-2 py-1 rounded-md ${
                        user.role === 'Admin' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-6 px-8 text-right space-x-1">
                      <button
                        onClick={() => handleResetPassword(user.username)}
                        disabled={actionLoading === user.username}
                        className="p-2 text-gray-300 hover:text-yellow-500 transition-colors"
                        title={t('admin.actionResetPassword')}
                        aria-label={t('admin.actionResetPassword')}
                      >
                        <Key size={18} />
                      </button>

                      {user.username !== currentUser.username && (
                        <button
                          onClick={() => handleDeleteUser(user.username)}
                          disabled={actionLoading === user.username}
                          className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                          title={t('admin.actionDelete')}
                          aria-label={t('admin.actionDelete')}
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUserManagement;
