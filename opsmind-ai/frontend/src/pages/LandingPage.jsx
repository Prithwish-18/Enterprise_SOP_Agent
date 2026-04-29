import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Zap, Shield, FileText, ChevronRight, MessageSquare, Upload, X, History, User, Lock, Key, Trash2, Clock } from 'lucide-react';

const LandingPage = () => {
    const [modalContent, setModalContent] = useState(null);
    return (
        <div className="w-full min-h-[calc(100vh-64px)] flex flex-col bg-[#0f172a] text-white selection:bg-blue-500/30 overflow-x-hidden relative">
            
            {/* Background effects */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-800px h-800px bg-blue-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3"></div>
                <div className="absolute bottom-0 left-0 w-600px h-600px bg-indigo-600/10 rounded-full blur-[120px] translate-y-1/3 -translate-x-1/3"></div>
            </div>

            {/* Main Hero Section */}
            <main className="flex-1 flex flex-col items-center justify-center relative z-10 w-full max-w-7xl mx-auto px-6 py-12 md:py-24 text-center">                
                <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold leading-tight mb-8 tracking-tight max-w-4xl">
                    Transform your documents into an <br className="hidden md:block"/>
                    <span className="bg-clip-text text-transparent bg-linear-to-r from-blue-400 via-indigo-400 to-purple-400">Intelligent Assistant</span>
                </h1>
                <p className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl leading-relaxed">
                    OpsMind Ai is an enterprise-grade Retrieval-Augmented Generation (RAG) platform. Ingest your company's Standard Operating Procedures, manuals and protocols to give your team instant, accurate and cited answers securely powered by Google's Gemini models
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in w-full sm:w-auto px-4">
                    <Link 
                        to="/login"
                        state={{ isLogin: false }}
                        className="w-full sm:w-auto py-4 px-8 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 group hover:scale-105"
                        style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)', boxShadow: '0 8px 25px rgba(37,99,235,0.4)' }}>
                        Get Started <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link 
                        to="/login"
                        state={{ isLogin: true }}
                        className="w-full sm:w-auto py-4 px-8 rounded-xl font-bold text-gray-300 transition-all flex items-center justify-center gap-2 border border-gray-700 bg-gray-900/50 hover:bg-gray-800 hover:text-white hover:border-gray-600">
                        Log In
                    </Link>
                </div>

                {/* Features Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 text-left w-full max-w-5xl">
                    <div className="glass p-8 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-colors group">
                        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20 group-hover:scale-110 transition-transform">
                            <Zap className="text-blue-400" size={28} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-gray-100">Instant Retrieval</h3>
                        <p className="text-gray-400 leading-relaxed">Stop digging through endless folders. Ask questions in natural language and get cited answers instantly</p>
                    </div>
                
                    <div className="glass p-8 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-colors group">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                            <Shield className="text-emerald-400" size={28} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-gray-100">Enterprise Security</h3>
                        <p className="text-gray-400 leading-relaxed">Your documents are scoped to your account. Bring your own Gemini API key for complete data control</p>
                    </div>

                    <div className="glass p-8 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-colors group">
                        <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 border border-purple-500/20 group-hover:scale-110 transition-transform">
                            <FileText className="text-purple-400" size={28} />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-gray-100">Multi-Format</h3>
                        <p className="text-gray-400 leading-relaxed">Upload PDF, DOCX and PPTX files effortlessly. Our AI engine processes and indexes them automatically</p>
                    </div>
                </div>

                {/* How It Works - Visual Walkthrough */}
                <div className="w-full max-w-6xl mt-32 text-left">
                    <div className="text-center mb-16 animate-fade-in">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4">How it works</h2>
                        <p className="text-gray-400 text-lg">As simple as uploading a file and sending a message</p>
                    </div>

                    <div className="space-y-24">
                        {/* Step 1: Upload */}
                        <div className="flex flex-col md:flex-row items-center gap-12">
                            <div className="flex-1 space-y-6">
                                <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center font-bold text-xl border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]">1</div>
                                <h3 className="text-2xl sm:text-3xl font-bold">Upload your enterprise documents</h3>
                                <p className="text-gray-400 leading-relaxed text-base sm:text-lg">
                                    Head to the <strong>Uploads</strong> dashboard. Drag and drop your company's PDFs, Word docs or Text files. OpsMind Ai automatically breaks them into chunks, creates secure vector embeddings and stores them in your private vault
                                </p>
                            </div>
                            <div className="flex-1 w-full glass rounded-2xl p-4 sm:p-6 border border-white/10 shadow-2xl relative overflow-hidden group">
                                {/* Accurate Mock of Upload Panel */}
                                <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 flex flex-col items-center justify-center bg-gray-900/50 hover:bg-gray-800/50 transition-colors">
                                    <Upload size={36} className="text-blue-400 mb-4 group-hover:-translate-y-2 transition-transform duration-300" />
                                    <p className="font-semibold text-gray-200 text-center">Drag & drop files or Browse</p>
                                    <p className="text-xs text-gray-500 mt-2">Supports PDF, DOCX, TXT</p>
                                </div>
                                <div className="mt-4 space-y-2">
                                    <div className="bg-gray-800/80 p-3 rounded-xl flex items-center justify-between border border-white/5 shadow-md">
                                        <div className="flex items-center gap-3">
                                            <FileText size={18} className="text-indigo-400" />
                                            <span className="text-sm font-medium text-gray-200">Employee_Handbook_2026.pdf</span>
                                        </div>
                                        <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md border border-emerald-400/20">Completed</span>
                                    </div>
                                    <div className="bg-gray-800/80 p-3 rounded-xl flex items-center justify-between border border-white/5 shadow-md">
                                        <div className="flex items-center gap-3">
                                            <FileText size={18} className="text-purple-400" />
                                            <span className="text-sm font-medium text-gray-200">IT_Security_Protocols.docx</span>
                                        </div>
                                        <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md border border-emerald-400/20">Completed</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Step 2: Chat */}
                        <div className="flex flex-col md:flex-row-reverse items-center gap-12">
                            <div className="flex-1 space-y-6 md:pl-12">
                                <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center font-bold text-xl border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.3)]">2</div>
                                <h3 className="text-2xl sm:text-3xl font-bold">Ask questions in plain English</h3>
                                <p className="text-gray-400 leading-relaxed text-base sm:text-lg">
                                    Switch to the <strong>Chat</strong> interface. Ask any question. The AI instantly scans your uploaded documents, retrieves the exact context needed and generates a perfect answer — complete with source citations so you can verify the information
                                </p>
                            </div>
                            <div className="flex-1 w-full glass rounded-2xl p-4 border border-white/10 shadow-2xl flex flex-col h-400px">
                                {/* Accurate Mock of Chat */}
                                <div className="flex-1 p-2 sm:p-4 space-y-6 overflow-hidden flex flex-col justify-end">
                                    <div className="flex justify-end animate-fade-in" style={{ animationDelay: '0.2s' }}>
                                        <div className="bg-blue-600 text-white p-3 sm:p-4 rounded-2xl rounded-tr-sm max-w-[90%] sm:max-w-[85%] text-sm shadow-md">
                                            What is our work from home policy for new hires?
                                        </div>
                                    </div>
                                    <div className="flex justify-start gap-3 animate-fade-in" style={{ animationDelay: '0.8s' }}>
                                        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0 shadow-lg mt-1">
                                            <Sparkles size={16} className="text-white" />
                                        </div>
                                        <div className="bg-gray-800 text-gray-200 p-3 sm:p-4 rounded-2xl rounded-tl-sm max-w-[90%] sm:max-w-[85%] text-sm shadow-md border border-gray-700/50">
                                            <p className="leading-relaxed">According to the <strong>Employee_Handbook_2026.pdf</strong>, new hires are eligible for hybrid work (3 days in-office, 2 days remote) after their first 30 days of employment.</p>
                                            <div className="mt-3 pt-3 border-t border-gray-700/50 flex flex-wrap gap-2">
                                                <span className="text-[10px] sm:text-xs text-gray-400 bg-gray-900 px-2 py-1 rounded border border-gray-700">Source: Employee_Handbook_2026.pdf</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 p-2 sm:p-3 border-t border-gray-800/50">
                                    <div className="bg-gray-900/80 rounded-xl p-2 flex items-center gap-2 border border-gray-700 shadow-inner">
                                        <div className="flex-1 bg-transparent px-2 text-sm text-gray-500">Ask a question...</div>
                                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white cursor-pointer hover:bg-blue-500 transition-colors">
                                            <MessageSquare size={14} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Step 3: History */}
                        <div className="flex flex-col md:flex-row items-center gap-12">
                            <div className="flex-1 space-y-6">
                                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center font-bold text-xl border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]">3</div>
                                <h3 className="text-2xl sm:text-3xl font-bold">Pick up where you left off</h3>
                                <p className="text-gray-400 leading-relaxed text-base sm:text-lg">
                                    Every question you ask is saved securely in your <strong>Chat History</strong>. You can easily access past conversations from any device, rename them or delete them when they are no longer needed
                                </p>
                            </div>
                            <div className="flex-1 w-full glass rounded-2xl p-4 sm:p-6 border border-white/10 shadow-2xl relative overflow-hidden group">
                                {/* Accurate Mock of Chat History Sidebar */}
                                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col h-300px">
                                    <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                                        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                            <Clock size={14} /> Chat History
                                        </h2>
                                    </div>
                                    <div className="p-3 space-y-2 flex-1 bg-gray-900/50">
                                        <div className="group/item p-3 rounded-xl flex items-center justify-between bg-gray-800 border border-gray-700/50 shadow-sm cursor-pointer hover:bg-gray-700/80 transition-colors">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <MessageSquare size={16} className="text-blue-400 shrink-0" />
                                                <span className="text-sm font-medium text-gray-200 truncate">Onboarding Policies</span>
                                            </div>
                                            <Trash2 size={14} className="text-gray-500 hover:text-red-400 transition-colors" />
                                        </div>
                                        <div className="group/item p-3 rounded-xl flex items-center justify-between bg-gray-800/50 border border-gray-800 shadow-sm cursor-pointer hover:bg-gray-800 transition-colors">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <MessageSquare size={16} className="text-gray-500 shrink-0" />
                                                <span className="text-sm font-medium text-gray-400 truncate">Q3 Financials Query</span>
                                            </div>
                                            <Trash2 size={14} className="text-gray-600" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Step 4: Profile */}
                        <div className="flex flex-col md:flex-row-reverse items-center gap-12">
                            <div className="flex-1 space-y-6 md:pl-12">
                                <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center font-bold text-xl border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.3)]">4</div>
                                <h3 className="text-2xl sm:text-3xl font-bold">Manage your security</h3>
                                <p className="text-gray-400 leading-relaxed text-base sm:text-lg">
                                    Your <strong>Profile</strong> gives you total control. Change your password securely using an industry-standard reset flow. More importantly, you can attach your own <strong>Gemini API Key</strong> to bypass server rate limits and guarantee lightning-fast answers for your team
                                </p>
                            </div>
                            <div className="flex-1 w-full glass rounded-2xl p-4 sm:p-6 border border-white/10 shadow-2xl relative overflow-hidden flex flex-col justify-center">
                                {/* Accurate Mock of Profile Settings */}
                                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-5">
                                    <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
                                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-200">Jane Doe</h4>
                                            <p className="text-xs text-gray-500">jane@company.com</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                                                <span>Gemini API Key</span>
                                                <span className="text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">Integration</span>
                                            </label>
                                            <div className="bg-gray-800 border border-gray-700 rounded-lg p-2.5 flex items-center gap-3">
                                                <Key size={16} className="text-gray-500" />
                                                <span className="text-sm font-mono text-gray-300 flex-1">AIzaSyB8x . . .</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Security</label>
                                            <div className="bg-gray-800 border border-gray-700 rounded-lg p-2.5 flex items-center justify-between hover:bg-gray-700/50 transition-colors cursor-pointer">
                                                <div className="flex items-center gap-3">
                                                    <Lock size={16} className="text-gray-500" />
                                                    <span className="text-sm text-gray-300">Password Settings</span>
                                                </div>
                                                <div className="text-xs px-3 py-1 bg-gray-700 rounded-md text-gray-300 border border-gray-600">Change</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/10 bg-[#0f172a] mt-auto">
                <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                            <img src="/logo.png" className="h-8 w-8 object-contain"/>
                        <span className="font-semibold tracking-tight">OpsMind Ai</span>
                    </div>
                    <p className="text-gray-500 text-sm">© {new Date().getFullYear()} OpsMind Ai <br></br> All rights are reserved</p>
                    <div className="flex items-center gap-6 text-sm text-gray-500 font-medium">
                        <button onClick={() => setModalContent('privacy')} className="hover:text-white transition-colors cursor-pointer">Privacy</button>
                        <button onClick={() => setModalContent('terms')} className="hover:text-white transition-colors cursor-pointer">Terms</button>
                        <button onClick={() => setModalContent('docs')} className="hover:text-white transition-colors cursor-pointer">Docs</button>
                    </div>
                </div>
            </footer>

            {/* Modals for Footer Links */}
            {modalContent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl relative">
                        <div className="flex items-center justify-between p-4 border-b border-white/10">
                            <h3 className="text-xl font-bold text-white capitalize">
                                {modalContent === 'docs' ? 'Documentation' : modalContent + ' Policy'}
                            </h3>
                            <button onClick={() => setModalContent(null)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto text-gray-300 space-y-4 text-sm sm:text-base leading-relaxed scrollbar-thin">
                            {modalContent === 'privacy' && (
                                <>
                                    <h4 className="text-white font-semibold text-lg">1. Data Collection</h4>
                                    <p>OpsMind Ai collects your email address and name solely for authentication and account scoping. We do not sell your personal data to third parties.</p>
                                    <h4 className="text-white font-semibold text-lg">2. Document Privacy</h4>
                                    <p>All documents you upload are securely stored and isolated via multi-tenant scoping. Only your authenticated account can access, search or delete your uploaded Standard Operating Procedures.</p>
                                    <h4 className="text-white font-semibold text-lg">3. AI Processing</h4>
                                    <p>Document embeddings and AI generations are processed via Google's Gemini models. Your data is passed securely and is not used to train global public models without consent, as per Google Cloud's enterprise terms.</p>
                                </>
                            )}
                            {modalContent === 'terms' && (
                                <>
                                    <h4 className="text-white font-semibold text-lg">1. Usage Agreement</h4>
                                    <p>By using OpsMind Ai, you agree to not upload malicious code, illegal content or information that violates copyright laws. You are fully responsible for the content you upload.</p>
                                    <h4 className="text-white font-semibold text-lg">2. API Rate Limits</h4>
                                    <p>Free tier users share a server-level API key which is subject to global rate limits. For enterprise reliability, you must provide your own Gemini API key in the Profile Settings.</p>
                                    <h4 className="text-white font-semibold text-lg">3. Account Termination</h4>
                                    <p>We reserve the right to suspend or terminate accounts that abuse the platform, spam the AI endpoints or attempt to breach the data isolation boundaries.</p>
                                </>
                            )}
                            {modalContent === 'docs' && (
                                <>
                                    <h4 className="text-white font-semibold text-lg">Getting Started</h4>
                                    <p>1. Create an account or log in to access your dashboard.<br/>
                                       2. Navigate to <strong>Uploads</strong> and drag-and-drop your company SOPs (PDF, DOCX, PPTX).<br/>
                                       3. Wait for the processing status to show "Completed".<br/>
                                       4. Navigate to <strong>Chat</strong> and ask natural language questions about your documents.</p>
                                    <h4 className="text-white font-semibold text-lg">Managing API Keys</h4>
                                    <p>Go to the Profile section to inject your own Google Gemini API key. This will bypass server-level rate limits and guarantee 100% uptime for your organization.</p>
                                    <h4 className="text-white font-semibold text-lg">Vector Search Details</h4>
                                    <p>OpsMind utilizes cosine similarity over high-dimensional embeddings to match your queries. If embeddings fail, a built-in TF-IDF keyword search fallback ensures you always get results.</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LandingPage;
