import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, Users, UserX, CheckCircle, Trash2, Search, AlertCircle, Clock, ShieldCheck } from 'lucide-react';

export default function AdminPortalModal({ isOpen, onClose, token, onToast }) {
  if (!isOpen) return null;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserForSuspend, setSelectedUserForSuspend] = useState(null);

  // Suspend Form State
  const [suspendValue, setSuspendValue] = useState('7');
  const [suspendUnit, setSuspendUnit] = useState('days'); // 'days' | 'months' | 'permanent'
  const [suspendReason, setSuspendReason] = useState('Violation of platform rules');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch users');
      setUsers(data);
    } catch (err) {
      onToast(`Admin error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [isOpen]);

  const handleSuspendSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUserForSuspend) return;
    setActionLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/admin/suspend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: selectedUserForSuspend._id,
          durationValue: suspendValue,
          durationUnit: suspendUnit,
          reason: suspendReason
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Suspension failed');

      onToast(data.message);
      setSelectedUserForSuspend(null);
      fetchUsers();
    } catch (err) {
      onToast(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnsuspend = async (userId, name) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/unsuspend/${userId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reactivation failed');

      onToast(`Account for ${name} reactivated!`);
      fetchUsers();
    } catch (err) {
      onToast(`Error: ${err.message}`);
    }
  };

  const handleDeleteUser = async (userId, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${name}"?`)) return;

    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete user failed');

      onToast(data.message);
      fetchUsers();
    } catch (err) {
      onToast(`Error: ${err.message}`);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone && u.phone.includes(searchQuery))
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
      <div className="bg-[#0a0d14] border border-cyan-500/40 rounded-3xl w-full max-w-5xl p-6 sm:p-8 shadow-2xl relative text-slate-100 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-black shadow-lg shadow-cyan-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                <span>VISA Master Admin Portal</span>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-cyan-500 text-slate-950">
                  SYSTEM OVERSEER
                </span>
              </h3>
              <p className="text-xs text-slate-400">Registered users, account suspension, and platform safety controls</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar: Stats & Search */}
        <div className="py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 text-xs font-bold text-slate-300">
            <span className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Total Users: <strong className="text-white">{users.length}</strong></span>
            </span>
            <span className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
              <UserX className="w-4 h-4 text-pink-400" />
              <span>Suspended: <strong className="text-pink-400">{users.filter((u) => u.status === 'suspended').length}</strong></span>
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Search user name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="flex-1 overflow-y-auto border border-slate-800/80 rounded-2xl bg-slate-950/60 no-scrollbar">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading user database...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">No users found.</div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-900/90 text-slate-400 sticky top-0 border-b border-slate-800 text-[11px] uppercase tracking-wider font-extrabold">
                <tr>
                  <th className="p-3.5">User</th>
                  <th className="p-3.5">Phone</th>
                  <th className="p-3.5">Languages</th>
                  <th className="p-3.5">Joined</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredUsers.map((user) => {
                  const isSuspended = user.status === 'suspended';
                  return (
                    <tr key={user._id} className="hover:bg-slate-900/40 transition">
                      <td className="p-3.5 flex items-center gap-3">
                        <img
                          src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=10b981&color=fff&bold=true`}
                          alt=""
                          className="w-8 h-8 rounded-xl object-cover border border-white/10 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-white flex items-center gap-1.5">
                            <span>{user.name}</span>
                            {user.isAdmin && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-cyan-500 text-slate-950">
                                ADMIN
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-400">{user.email}</p>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-300 font-mono">{user.phone || 'N/A'}</td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {(user.preferredLanguages || []).map((l) => (
                            <span key={l} className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                              {l}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3.5">
                        {isSuspended ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30 text-[10px] font-bold uppercase">
                              <UserX className="w-3 h-3" />
                              <span>Suspended</span>
                            </span>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {user.suspendedUntil ? `Until: ${new Date(user.suspendedUntil).toLocaleDateString()}` : 'Permanent'}
                            </p>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase">
                            <CheckCircle className="w-3 h-3" />
                            <span>Active</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        {!user.isAdmin && (
                          <div className="flex items-center justify-end gap-1.5">
                            {isSuspended ? (
                              <button
                                onClick={() => handleUnsuspend(user._id, user.name)}
                                className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold hover:bg-emerald-500 hover:text-slate-950 transition text-[11px]"
                              >
                                Reactivate
                              </button>
                            ) : (
                              <button
                                onClick={() => setSelectedUserForSuspend(user)}
                                className="px-2.5 py-1 rounded-xl bg-pink-500/20 text-pink-300 border border-pink-500/30 font-bold hover:bg-pink-500 hover:text-white transition text-[11px]"
                              >
                                Suspend
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteUser(user._id, user.name)}
                              className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-pink-400 transition"
                              title="Delete user"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Suspend User Modal Popover */}
        {selectedUserForSuspend && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#0f1422] border border-pink-500/40 rounded-3xl w-full max-w-md p-6 text-slate-100 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <UserX className="w-4 h-4 text-pink-400" />
                  <span>Suspend Account: {selectedUserForSuspend.name}</span>
                </h4>
                <button onClick={() => setSelectedUserForSuspend(null)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSuspendSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Suspension Type / Duration</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSuspendUnit('days');
                        setSuspendValue('7');
                      }}
                      className={`p-2 rounded-xl font-bold border transition text-center ${
                        suspendUnit === 'days' ? 'bg-pink-500 text-white border-pink-400' : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      Days
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSuspendUnit('months');
                        setSuspendValue('1');
                      }}
                      className={`p-2 rounded-xl font-bold border transition text-center ${
                        suspendUnit === 'months' ? 'bg-pink-500 text-white border-pink-400' : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      Months
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSuspendUnit('permanent');
                        setSuspendValue('0');
                      }}
                      className={`p-2 rounded-xl font-bold border transition text-center ${
                        suspendUnit === 'permanent' ? 'bg-pink-500 text-white border-pink-400' : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      Permanent
                    </button>
                  </div>
                </div>

                {suspendUnit !== 'permanent' && (
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Duration Value ({suspendUnit})</label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={suspendValue}
                      onChange={(e) => setSuspendValue(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                )}

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Reason for Suspension</label>
                  <textarea
                    rows="2"
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    placeholder="Enter reason..."
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedUserForSuspend(null)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-1.5 rounded-xl bg-pink-500 text-white font-bold hover:bg-pink-600 transition"
                  >
                    {actionLoading ? 'Applying...' : 'Confirm Suspension'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
