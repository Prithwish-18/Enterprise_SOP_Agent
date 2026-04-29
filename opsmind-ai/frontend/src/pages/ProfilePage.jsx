import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatContext } from '../context/ChatContext';
import { User, Mail, Key, Lock, Save, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { updateProfileUser } from '../services/api';

const ProfilePage = () => {
    const { userEmail, login, apiKey, saveApiKey } = useContext(ChatContext);
    const navigate = useNavigate();

    const [profile, setProfile] = useState({
        name: localStorage.getItem('opsmind_user_name') || '',
        email: userEmail || '',
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
        api_key: apiKey || ''
    });

    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (profile.newPassword && profile.newPassword !== profile.confirmPassword) {
            return alert("New passwords do not match!");
        }

        try {
            // Update backend first
            await updateProfileUser(
                profile.email, 
                profile.name, 
                profile.oldPassword || undefined,
                profile.newPassword || undefined, 
                profile.api_key
            );

            // Save to local context and storage
            if (profile.email !== userEmail) {
                login(profile.email);
            }
            
            if (profile.api_key !== apiKey) {
                saveApiKey(profile.api_key || '__USE_SERVER_KEY__');
            }

            localStorage.setItem('opsmind_user_name', profile.name);
            if (profile.newPassword) {
                setProfile(prev => ({ ...prev, oldPassword: '', newPassword: '', confirmPassword: '' })); 
                setIsChangingPassword(false);
            }

            setSaved(true);
            setTimeout(() => {
                setSaved(false);
                navigate('/');
            }, 1500);
        } catch (error) {
            console.error("Failed to update profile", error);
            alert("Failed to update profile: " + error.message);
        }
    };

    return (
        <div className="w-full h-full overflow-y-auto scrollbar-thin"
             style={{ background: 'radial-gradient(ellipse at 80% 20%, rgba(99,102,241,0.08), transparent 50%)' }}>
            <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
                
                <button 
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft size={16} /> Back to Chat
                </button>

                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-500/20 text-indigo-400">
                            <User size={20} />
                        </div>
                        Your Profile
                    </h1>
                    <p className="text-gray-400 mt-2 text-sm sm:text-base">
                        Manage your account settings, personal details and Gemini API configuration
                    </p>
                </div>

                <div className="glass rounded-2xl p-5 sm:p-8">
                    <form onSubmit={handleSave} className="space-y-6">
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {/* Name */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                    <input
                                        type="text"
                                        name="name"
                                        value={profile.name}
                                        onChange={handleChange}
                                        placeholder="John Doe"
                                        className="w-full bg-gray-900/60 border border-gray-700/50 text-gray-200 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all placeholder-gray-600"/>
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                    <input
                                        type="email"
                                        name="email"
                                        value={profile.email}
                                        onChange={handleChange}
                                        placeholder="you@company.com"
                                        required
                                        className="w-full bg-gray-900/60 border border-gray-700/50 text-gray-200 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all placeholder-gray-600"/>
                                </div>
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-4 pt-2 border-t border-white/5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block">Password</label>
                                    <p className="text-xs text-gray-500 mb-2">Manage your account security</p>
                                </div>
                                {!isChangingPassword && (
                                    <button
                                        type="button"
                                        onClick={() => setIsChangingPassword(true)}
                                        className="text-sm px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors border border-gray-700">
                                        Change Password
                                    </button>
                                )}
                            </div>
                            
                            {isChangingPassword && (
                                <div className="grid grid-cols-1 gap-4 animate-fade-in p-4 bg-gray-800/30 rounded-xl border border-white/5">
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                        <input
                                            type="password"
                                            name="oldPassword"
                                            value={profile.oldPassword}
                                            onChange={handleChange}
                                            placeholder="Old Password"
                                            className="w-full bg-gray-900/60 border border-gray-700/50 text-gray-200 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all placeholder-gray-600"/>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                            <input
                                                type="password"
                                                name="newPassword"
                                                value={profile.newPassword}
                                                onChange={handleChange}
                                                placeholder="New Password"
                                                className="w-full bg-gray-900/60 border border-gray-700/50 text-gray-200 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all placeholder-gray-600"/>
                                        </div>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                            <input
                                                type="password"
                                                name="confirmPassword"
                                                value={profile.confirmPassword}
                                                onChange={handleChange}
                                                placeholder="Confirm New Password"
                                                className="w-full bg-gray-900/60 border border-gray-700/50 text-gray-200 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all placeholder-gray-600"/>
                                        </div>
                                    </div>
                                    <div className="flex justify-end mt-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsChangingPassword(false);
                                                setProfile(prev => ({ ...prev, oldPassword: '', newPassword: '', confirmPassword: '' }));
                                            }}
                                            className="text-xs text-gray-400 hover:text-white transition-colors">
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* API Key */}
                        <div className="space-y-2 pt-2 border-t border-white/5">
                            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center justify-between">
                                <span>Gemini API Key</span>
                                <span className="text-indigo-400 text-[10px] bg-indigo-500/10 px-2 py-0.5 rounded-full">Integration</span>
                            </label>
                            <p className="text-xs text-gray-500 mb-2">Override the default server key with your personal Gemini key for increased rate limits</p>
                            <div className="relative">
                                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                    type="password"
                                    name="api_key"
                                    value={profile.api_key === '__USE_SERVER_KEY__' ? '' : profile.api_key}
                                    onChange={handleChange}
                                    placeholder="AIzaSy... (Leave blank to use default)"
                                    className="w-full bg-gray-900/60 border border-gray-700/50 text-gray-200 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all placeholder-gray-600 font-mono text-sm"/>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="pt-4 flex items-center justify-between">
                            <div>
                                {saved && (
                                    <span className="flex items-center gap-1.5 text-sm text-emerald-400 animate-fade-in">
                                        <CheckCircle2 size={16} /> Profile saved successfully!
                                    </span>
                                )}
                            </div>
                            <button
                                type="submit"
                                className="py-2.5 px-6 rounded-xl font-medium text-white shadow-lg transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
                                style={{ background: 'linear-gradient(135deg, #4f46e5, #3b82f6)', boxShadow: '0 4px 14px rgba(79,70,229,0.25)' }}>
                                <Save size={18} /> Save Changes
                            </button>
                        </div>
                        
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
