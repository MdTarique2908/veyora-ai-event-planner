import React, { useState, useEffect } from 'react';
import {
  Users,
  Share2,
  Copy,
  Check,
  Shield,
  Cloud,
  RefreshCw,
  Trash2,
  X,
  Mail,
  UserPlus,
  Activity,
  Key,
  ExternalLink,
  Lock,
  Globe,
  Smartphone,
  Tablet,
  Laptop,
} from 'lucide-react';
import { EventPlan, EventCollaborator, CollaboratorRole, CollaborationActivity } from '../types/event';
import {
  UserProfile,
  getStoredUserProfile,
  setStoredUserProfile,
  signInWithGoogleAuth,
  signOutAuth,
  syncPlanToCloud,
  getFirebaseConfig,
  saveFirebaseConfig,
  FirebaseConfigOptions,
} from '../utils/firebase';

interface CoHostCollaborationModalProps {
  plan: EventPlan;
  isOpen: boolean;
  onClose: () => void;
  onUpdatePlan: (updatedPlan: EventPlan) => void;
  onToast: (msg: string) => void;
}

export const CoHostCollaborationModal: React.FC<CoHostCollaborationModalProps> = ({
  plan,
  isOpen,
  onClose,
  onUpdatePlan,
  onToast,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'invite' | 'auth' | 'activity' | 'devices'>('invite');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(getStoredUserProfile());
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Invite form states
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<CollaboratorRole>('co_host');
  const [isInviting, setIsInviting] = useState(false);

  // Live activity feed
  const [activities, setActivities] = useState<CollaborationActivity[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);

  // Firebase config editor modal state
  const [showFirebaseConfig, setShowFirebaseConfig] = useState(false);
  const [fbConfig, setFbConfig] = useState<FirebaseConfigOptions>(getFirebaseConfig() || {});

  // Collaborators list
  const collaborators: EventCollaborator[] = plan.collaborators || [];

  // Share URL
  const shareCode = plan.shareCode || plan.id;
  const shareUrl = `${window.location.origin}?share=${shareCode}`;

  // Load activities on mount/tab change
  useEffect(() => {
    if (activeTab === 'activity') {
      loadActivities();
    }
  }, [activeTab, plan.id]);

  const loadActivities = async () => {
    setIsLoadingActivity(true);
    try {
      const res = await fetch(`/api/cloud/activity/${plan.id}`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
      }
    } catch (e) {
      console.warn('Failed to fetch activity feed:', e);
    } finally {
      setIsLoadingActivity(false);
    }
  };

  // One-click Google Sign-in
  const handleGoogleSignIn = async () => {
    try {
      const profile = await signInWithGoogleAuth();
      setUserProfile(profile);
      onToast(`Signed in as ${profile.displayName}!`);

      // Trigger automatic cloud sync
      handleSyncNow(profile);
    } catch (err: any) {
      console.error('Sign in error:', err);
      onToast('Sign-in failed. Please try again.');
    }
  };

  const handleSignOut = async () => {
    await signOutAuth();
    setUserProfile(null);
    onToast('Signed out from Cloud Sync.');
  };

  // Sync to Cloud
  const handleSyncNow = async (activeUser = userProfile) => {
    setIsSyncing(true);
    try {
      const result = await syncPlanToCloud(plan, activeUser);
      onUpdatePlan({
        ...plan,
        cloudSyncedAt: result.cloudSyncedAt,
      });
      onToast('Cloud synchronized across all devices!');
    } catch (err: any) {
      console.error('Sync error:', err);
      onToast('Could not sync to cloud: ' + (err?.message || 'Server error'));
    } finally {
      setIsSyncing(false);
    }
  };

  // Copy share invite link
  const handleCopyShareLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
      onToast('Co-Host invite link copied to clipboard!');
    }
  };

  // Add collaborator
  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setIsInviting(true);
    try {
      const res = await fetch('/api/cloud/collaborators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          email: inviteEmail.trim(),
          name: inviteName.trim() || inviteEmail.split('@')[0],
          role: inviteRole,
        }),
      });

      if (!res.ok) throw new Error('Failed to add collaborator');

      const data = await res.json();
      onUpdatePlan({
        ...plan,
        collaborators: data.collaborators,
      });

      setInviteEmail('');
      setInviteName('');
      onToast(`Invited ${inviteName || inviteEmail} as ${inviteRole.replace('_', ' ')}!`);
    } catch (err: any) {
      console.error('Invite error:', err);
      onToast('Failed to add collaborator.');
    } finally {
      setIsInviting(false);
    }
  };

  // Remove collaborator
  const handleRemoveCollaborator = async (email: string) => {
    try {
      const res = await fetch(`/api/cloud/collaborators/${plan.id}/${encodeURIComponent(email)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Delete failed');
      const data = await res.json();
      onUpdatePlan({
        ...plan,
        collaborators: data.collaborators,
      });
      onToast(`Removed ${email} from co-hosts.`);
    } catch {
      onToast('Could not remove co-host.');
    }
  };

  // Save custom Firebase config
  const handleSaveFirebaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveFirebaseConfig(fbConfig);
    setShowFirebaseConfig(false);
    onToast('Firebase configuration updated and saved!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div
        className="w-full max-w-2xl rounded-3xl border border-stone-200/90 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative border-b border-stone-200 px-6 py-5 bg-stone-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-2.5 text-indigo-600 shadow-2xs">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Cloud Sync & Co-Host Collaboration</h3>
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 flex items-center gap-1">
                  <Cloud className="h-2.5 w-2.5" />
                  <span>Realtime Sync</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Multi-device synchronization across phone, tablet, and desktop with secure co-host access.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:text-slate-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-stone-200 bg-stone-50/40 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('invite')}
            className={`flex items-center gap-1.5 pb-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'invite'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Co-Hosts & Share Link</span>
            {collaborators.length > 0 && (
              <span className="rounded-full bg-stone-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                {collaborators.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('auth')}
            className={`flex items-center gap-1.5 pb-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'auth'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Google & Cloud Auth</span>
          </button>

          <button
            onClick={() => setActiveTab('devices')}
            className={`flex items-center gap-1.5 pb-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'devices'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Multi-Device Sync</span>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-1.5 pb-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'activity'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Team Activity Log</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* TAB 1: CO-HOSTS & SHARE LINK */}
          {activeTab === 'invite' && (
            <div className="space-y-6">
              {/* Shareable Invite Link Card */}
              <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                    <Share2 className="h-3.5 w-3.5" />
                    <span>Shareable Co-Host Invite Link</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 font-mono font-semibold">Realtime Enabled</span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Anyone with this link can open <strong className="text-slate-900 font-semibold">{plan.concept.title}</strong>, review
                  itemized budgets, check off milestones, and collaborate in real-time.
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs font-mono text-slate-800 truncate focus:outline-none shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={handleCopyShareLink}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all shrink-0 active:scale-95 cursor-pointer"
                  >
                    {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedLink ? 'Copied Link!' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>

              {/* Add Co-Host Form */}
              <form onSubmit={handleAddCollaborator} className="rounded-2xl border border-stone-200/90 bg-white p-5 space-y-4 shadow-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <UserPlus className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Invite a Co-Host or Partner by Email</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      placeholder="Co-Host Name (e.g. Sarah)"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-5">
                    <input
                      type="email"
                      required
                      placeholder="Email address (e.g. sarah@example.com)"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as CollaboratorRole)}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-2.5 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="co_host">Co-Host (Full Edit)</option>
                      <option value="budget_manager">Budget Lead</option>
                      <option value="viewer">Viewer Only</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isInviting || !inviteEmail}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-all cursor-pointer shadow-xs"
                  >
                    {isInviting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                    <span>Add to Co-Host Team</span>
                  </button>
                </div>
              </form>

              {/* Collaborator List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                  <span>Current Team Members ({collaborators.length})</span>
                  <span className="text-[10px] text-slate-400">Owner & Assigned Co-Hosts</span>
                </h4>

                {collaborators.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-stone-300 p-6 text-center text-xs text-slate-500 bg-stone-50/50">
                    No co-hosts added yet. Share your invite link above or invite a partner to start planning together!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {collaborators.map((c) => (
                      <div
                        key={c.email}
                        className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50/60 p-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={c.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(c.email)}`}
                            alt={c.name}
                            className="h-8 w-8 rounded-full border border-stone-200 bg-white"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">{c.name}</span>
                              <span className="rounded-full bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-[10px] font-mono text-indigo-700 capitalize">
                                {c.role.replace('_', ' ')}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-medium">{c.email}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500 hidden sm:inline">
                            Joined {new Date(c.joinedAt).toLocaleDateString()}
                          </span>
                          {c.role !== 'owner' && (
                            <button
                              type="button"
                              onClick={() => handleRemoveCollaborator(c.email)}
                              className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                              title="Remove co-host"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: GOOGLE & FIREBASE CLOUD AUTH */}
          {activeTab === 'auth' && (
            <div className="space-y-6">
              {/* User Profile Card */}
              <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-5 space-y-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {userProfile?.photoURL ? (
                      <img
                        src={userProfile.photoURL}
                        alt="User"
                        className="h-12 w-12 rounded-full border border-indigo-500 shadow-xs"
                      />
                    ) : (
                      <div className="rounded-full bg-indigo-50 border border-indigo-100 p-3 text-indigo-600 shadow-2xs">
                        <Users className="h-6 w-6" />
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {userProfile ? userProfile.displayName : 'Guest Planner (Local Mode)'}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        {userProfile ? userProfile.email : 'Sign in with Google to synchronize across devices'}
                      </p>
                    </div>
                  </div>

                  {userProfile && (
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-rose-600 hover:bg-stone-50 transition-colors shadow-2xs cursor-pointer"
                    >
                      Sign Out
                    </button>
                  )}
                </div>

                {!userProfile && (
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="w-full flex items-center justify-center gap-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 px-4 py-3 text-xs font-bold text-slate-800 shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>One-Click Sign In with Google (Firebase Auth)</span>
                  </button>
                )}
              </div>

              {/* Cloud Sync Status & Actions */}
              <div className="rounded-2xl border border-stone-200 bg-white p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cloud className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900">Firestore Cloud Persistence</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 font-medium">
                    {plan.cloudSyncedAt ? `Last Synced: ${new Date(plan.cloudSyncedAt).toLocaleTimeString()}` : 'Not synced yet'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Your event blueprint is saved across sessions. Sync now to push all latest budget items, vendor selections, and seating setups to the cloud.
                </p>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleSyncNow()}
                    disabled={isSyncing}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Syncing with Cloud...' : 'Synchronize Now'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowFirebaseConfig(!showFirebaseConfig)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-stone-50 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Key className="h-3.5 w-3.5 text-amber-500" />
                    <span>Custom Firebase Config</span>
                  </button>
                </div>
              </div>

              {/* Custom Firebase Config Editor */}
              {showFirebaseConfig && (
                <form onSubmit={handleSaveFirebaseConfig} className="rounded-2xl border border-amber-300 bg-amber-50/40 p-5 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                      Configure Firebase Project Keys
                    </h5>
                    <span className="text-[10px] text-slate-500 font-medium">Optional custom credentials</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-700 mb-1">API Key</label>
                      <input
                        type="text"
                        value={fbConfig.apiKey || ''}
                        onChange={(e) => setFbConfig({ ...fbConfig, apiKey: e.target.value })}
                        placeholder="AIzaSy..."
                        className="w-full rounded-xl border border-stone-200 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-700 mb-1">Project ID</label>
                      <input
                        type="text"
                        value={fbConfig.projectId || ''}
                        onChange={(e) => setFbConfig({ ...fbConfig, projectId: e.target.value })}
                        placeholder="veyora-app"
                        className="w-full rounded-xl border border-stone-200 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-700 mb-1">Auth Domain</label>
                      <input
                        type="text"
                        value={fbConfig.authDomain || ''}
                        onChange={(e) => setFbConfig({ ...fbConfig, authDomain: e.target.value })}
                        placeholder="veyora.firebaseapp.com"
                        className="w-full rounded-xl border border-stone-200 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-700 mb-1">App ID</label>
                      <input
                        type="text"
                        value={fbConfig.appId || ''}
                        onChange={(e) => setFbConfig({ ...fbConfig, appId: e.target.value })}
                        placeholder="1:123456789:web:abcdef"
                        className="w-full rounded-xl border border-stone-200 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="rounded-xl bg-amber-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 cursor-pointer shadow-xs"
                    >
                      Save Configuration
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: MULTI-DEVICE SYNC GUIDE */}
          {activeTab === 'devices' && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-5 space-y-3 shadow-xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                  Cross-Device Seamless Synchronization
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Veyora synchronizes changes across all devices. Open this event on your phone to check off
                  tasks on-site, review budgets on a tablet during vendor meetings, or orchestrate from desktop.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="rounded-xl border border-stone-200 bg-white p-3.5 text-center space-y-1.5 shadow-2xs">
                    <Smartphone className="h-6 w-6 text-rose-500 mx-auto" />
                    <div className="text-xs font-bold text-slate-900">Mobile Phone</div>
                    <p className="text-[11px] text-slate-500">Day-of coordination & on-site task check-offs</p>
                  </div>

                  <div className="rounded-xl border border-stone-200 bg-white p-3.5 text-center space-y-1.5 shadow-2xs">
                    <Tablet className="h-6 w-6 text-indigo-600 mx-auto" />
                    <div className="text-xs font-bold text-slate-900">Tablet & iPad</div>
                    <p className="text-[11px] text-slate-500">Vendor walkthroughs & 3D seating planner</p>
                  </div>

                  <div className="rounded-xl border border-stone-200 bg-white p-3.5 text-center space-y-1.5 shadow-2xs">
                    <Laptop className="h-6 w-6 text-emerald-600 mx-auto" />
                    <div className="text-xs font-bold text-slate-900">Desktop & Laptop</div>
                    <p className="text-[11px] text-slate-500">Full budget breakdown, video & music studio</p>
                  </div>
                </div>
              </div>

              {/* Instant Access QR / Link */}
              <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-5 flex items-center justify-between gap-4 shadow-xs">
                <div>
                  <div className="text-xs font-bold text-slate-900">Access on Your Mobile Browser</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Open <span className="font-mono font-medium text-indigo-700">{shareUrl}</span> on any mobile browser.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className="rounded-xl border border-stone-200 bg-white hover:bg-stone-50 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors shrink-0 shadow-2xs cursor-pointer"
                >
                  {copiedLink ? 'Copied!' : 'Copy Mobile Link'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: TEAM ACTIVITY LOG */}
          {activeTab === 'activity' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Real-Time Co-Host Audit Stream</span>
                </h4>
                <button
                  type="button"
                  onClick={loadActivities}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`h-3 w-3 ${isLoadingActivity ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {activities.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-xs text-slate-500 bg-stone-50/50">
                  No co-host actions logged yet. When teammates update budgets, check tasks, or sync, their live activity will appear here.
                </div>
              ) : (
                <div className="space-y-2">
                  {activities.map((act) => (
                    <div
                      key={act.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50/60 p-3 text-xs shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="h-2 w-2 rounded-full bg-indigo-600 shrink-0" />
                        <div>
                          <strong className="text-slate-900 font-bold">{act.userName}</strong>{' '}
                          <span className="text-slate-600">{act.action}</span>{' '}
                          <span className="text-indigo-700 font-medium">"{act.target}"</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 shrink-0 font-medium">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-stone-200 px-6 py-4 bg-stone-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-slate-600 font-medium">
            <Shield className="h-3.5 w-3.5 text-emerald-600" />
            <span>End-to-End Secure Cloud Sync (Firebase + Firestore)</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-stone-200 bg-white hover:bg-stone-50 px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
