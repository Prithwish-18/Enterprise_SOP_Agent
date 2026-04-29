import React, { useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChatContext } from '../context/ChatContext';
import { Key, Mail, LogIn, ChevronRight, SkipForward, Sparkles, User, Lock, Eye, EyeOff, Bot, Loader2, AlertCircle } from 'lucide-react';
import { loginUser, signupUser } from '../services/api';

const LoginPage = () => {
    const { userEmail, login, apiKey, saveApiKey } = useContext(ChatContext);
    const location = useLocation();
    const [step, setStep] = useState(userEmail ? 2 : 1);
    const [isLogin, setIsLogin] = useState(location.state?.isLogin ?? true);
    const navigate = useNavigate();

    useEffect(() => {
        if (location.state?.isLogin !== undefined) {
            setIsLogin(location.state.isLogin);
        }
        
        // If they are already fully authenticated and configured, don't let them sit on the login page
        if (userEmail && apiKey) {
            navigate('/', { replace: true });
        }
    }, [location.state, userEmail, apiKey, navigate]);
    
    const [nameInput, setNameInput] = useState(localStorage.getItem('opsmind_user_name') || '');
    const [emailInput, setEmailInput] = useState(userEmail || '');
    const [passwordInput, setPasswordInput] = useState('');
    const [keyInput, setKeyInput] = useState(apiKey || '');
    
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [authError, setAuthError] = useState('');

    const handleAuth = async (e) => {
        e.preventDefault();
        setAuthError('');
        if (emailInput.trim() && passwordInput.trim()) {
            if (!isLogin && !nameInput.trim()) {
                setAuthError('Name is required for sign up.');
                return;
            }
            
            setIsLoading(true);
            try {
                if (!isLogin) {
                    await signupUser(nameInput.trim(), emailInput.trim(), passwordInput.trim());
                    localStorage.setItem('opsmind_user_name', nameInput.trim());
                } else {
                    const data = await loginUser(emailInput.trim(), passwordInput.trim());
                    if (data.user?.name) {
                        localStorage.setItem('opsmind_user_name', data.user.name);
                    }
                }
                login(emailInput.trim());
                setStep(2);
            } catch (err) {
                setAuthError(err.message);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleKeySubmit = (e) => {
        e.preventDefault();
        if (keyInput.trim()) {
            saveApiKey(keyInput.trim());
            navigate('/');
        }
    };

    const handleSkipApiKey = () => {
        saveApiKey('__USE_SERVER_KEY__');
        navigate('/');
    };

    return (
        <div className="w-full h-[calc(100vh-64px)] flex items-center justify-center p-4 sm:p-6"
             style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(59,130,246,0.12), transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(99,102,241,0.08), transparent 50%)' }}>
            <div className="w-full max-w-md glass rounded-3xl overflow-hidden shadow-2xl border border-white/10 animate-fade-in relative z-20">
                {/* Top gradient bar */}
                <div className="h-1.5 w-full bg-linear-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

                <div className="p-8">
                    <div className="text-center mb-8 justify-center">
                        <img src="/logo.png" className="h-16 w-16 object-contain mx-auto"/>
                        <h2 className="text-2xl font-bold mb-2">
                            {step === 1 ? (isLogin ? 'Welcome Back' : 'Create an Account') : 'API Configuration'}
                        </h2>
                        <p className="text-gray-400 text-sm">
                            {step === 1 ? (isLogin ? 'Log in to access your enterprise knowledge' : 'Sign up to access your enterprise knowledge') : 'Optionally provide your own Gemini API Key'}
                        </p>
                    </div>

                    {/* Step indicator */}
                    <div className="flex items-center justify-center gap-2 mb-8">
                        <div className={`w-10 h-1.5 rounded-full transition-colors ${step >= 1 ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-gray-800'}`}></div>
                        <div className={`w-10 h-1.5 rounded-full transition-colors ${step >= 2 ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-gray-800'}`}></div>
                    </div>

                    {step === 1 ? (
                        <div className="space-y-6">
                            <div className="flex p-1.5 bg-gray-900/80 rounded-xl border border-gray-800">
                                <button 
                                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${isLogin ? 'bg-gray-800 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
                                    onClick={() => { setIsLogin(true); setAuthError(''); }}>
                                    Log In
                                </button>
                                <button 
                                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${!isLogin ? 'bg-gray-800 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
                                    onClick={() => { setIsLogin(false); setAuthError(''); }}>
                                    Sign Up
                                </button>
                            </div>
                            
                            {authError && (
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
                                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                    <span>{authError}</span>
                                </div>
                            )}

                            <form onSubmit={handleAuth} className="space-y-5 animate-fade-in">
                                {!isLogin && (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                                            <input
                                                type="text"
                                                value={nameInput}
                                                onChange={(e) => setNameInput(e.target.value)}
                                                placeholder="John Doe"
                                                className="w-full bg-gray-900/60 border border-gray-700 text-gray-100 rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-gray-600"/>
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                                        <input
                                            type="email"
                                            value={emailInput}
                                            onChange={(e) => setEmailInput(e.target.value)}
                                            placeholder="you@company.com"
                                            className="w-full bg-gray-900/60 border border-gray-700 text-gray-100 rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-gray-600"
                                            required/>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={passwordInput}
                                            onChange={(e) => setPasswordInput(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full bg-gray-900/60 border border-gray-700 text-gray-100 rounded-xl py-3.5 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-gray-600"
                                            required/>
                                        <button 
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
                                            title={showPassword ? "Hide password" : "Show password"}>
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-4 px-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 group cursor-pointer hover:scale-[1.02] disabled:opacity-70 disabled:hover:scale-100 mt-2"
                                    style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)', boxShadow: '0 8px 25px rgba(37,99,235,0.4)' }}>
                                    {isLoading ? (
                                        <Loader2 size={20} className="animate-spin" />
                                    ) : (
                                        <>
                                            {isLogin ? 'Log In' : 'Create Account'} 
                                            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <form onSubmit={handleKeySubmit} className="space-y-6 animate-fade-in">
                            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 flex items-start gap-3 text-indigo-200 text-sm">
                                <Bot className="shrink-0 text-indigo-400" size={20} />
                                <p>You can use the server's shared Gemini API key or provide your own to increase your rate limits</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                    Gemini API Key <span className="text-gray-600 normal-case ml-1">(Optional)</span>
                                </label>
                                <div className="relative group">
                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={keyInput}
                                        onChange={(e) => setKeyInput(e.target.value)}
                                        placeholder="AIza . . ."
                                        className="w-full bg-gray-900/60 border border-gray-700 text-gray-100 rounded-xl py-3.5 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder-gray-600"/>
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-colors">
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={handleSkipApiKey}
                                    className="flex-1 py-4 px-4 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border border-gray-700 group cursor-pointer">
                                    <SkipForward size={18} className="text-gray-400 group-hover:text-gray-200" /> Skip
                                </button>
                                <button
                                    type="submit"
                                    disabled={!keyInput.trim()}
                                    className="flex-1 py-4 px-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed group cursor-pointer"
                                    style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)', boxShadow: '0 8px 25px rgba(79,70,229,0.3)' }}>
                                    Start <LogIn size={18} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
