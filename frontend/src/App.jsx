import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Rocket, Code, Clock, Loader2, Sparkles, CheckCircle2, 
  MessageSquare, Plus, PanelLeft, Clock3, Trash2, Send, ChevronDown
} from 'lucide-react';

function App() {
  const [formData, setFormData] = useState({
    title: '',
    level: 'Beginner',
    duration: '4 Weeks'
  });
  
  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Chat State & Refs
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  
  // Custom Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDurationDropdownOpen, setIsDurationDropdownOpen] = useState(false);
  const levels = ['Beginner', 'Intermediate', 'Advanced'];
  const weeks = Array.from({ length: 26 }, (_, i) => `${i + 1} Week${i === 0 ? '' : 's'}`);

  const currentProject = projects.find(p => p.id === currentProjectId);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('projectpilot_history');
    if (saved) {
      try {
        setProjects(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save to local storage whenever projects change
  useEffect(() => {
    localStorage.setItem('projectpilot_history', JSON.stringify(projects));
  }, [projects]);

  // Scroll to bottom of chat ONLY when chat history updates
  useEffect(() => {
    if (chatEndRef.current && currentProject?.chatHistory?.length > 0) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentProject?.chatHistory, chatLoading]);

  // Scroll to top of the page when project changes or after generation
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [currentProjectId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const startNewProject = () => {
    setCurrentProjectId(null);
    setFormData({ title: '', level: 'Beginner', duration: '4 Weeks' });
  };

  const deleteProject = (e, id) => {
    e.stopPropagation();
    const newProjects = projects.filter(p => p.id !== id);
    setProjects(newProjects);
    if (currentProjectId === id) {
      setCurrentProjectId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate project plan');
      }

      const newProject = {
        id: Date.now().toString(),
        title: formData.title,
        level: formData.level,
        duration: formData.duration,
        result: data.result,
        date: new Date().toLocaleDateString(),
        chatHistory: [] // Initialize empty chat history
      };

      setProjects([newProject, ...projects]);
      setCurrentProjectId(newProject.id);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !currentProject || chatLoading) return;

    const question = chatInput.trim();
    setChatInput('');
    setChatLoading(true);

    const userMessage = { role: 'user', content: question };
    let updatedProject = {
      ...currentProject,
      chatHistory: [...(currentProject.chatHistory || []), userMessage]
    };
    
    setProjects(projects.map(p => p.id === currentProject.id ? updatedProject : p));

    try {
      const response = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: currentProject.result,
          question: question
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get chat response');
      }

      const aiMessage = { role: 'ai', content: data.result };
      updatedProject = {
        ...updatedProject,
        chatHistory: [...updatedProject.chatHistory, aiMessage]
      };
      
      setProjects(projects.map(p => p.id === currentProject.id ? updatedProject : p));

    } catch (err) {
      const errorMessage = { role: 'ai', content: `**Error:** ${err.message}` };
      updatedProject = {
        ...updatedProject,
        chatHistory: [...updatedProject.chatHistory, errorMessage]
      };
      setProjects(projects.map(p => p.id === currentProject.id ? updatedProject : p));
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#030303] text-gray-100 font-sans overflow-hidden relative">
      
      {/* Ambient Background Glow matching the reference image */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none flex items-center justify-center">
        <div className="absolute top-[-20%] w-[80vw] h-[60vh] bg-emerald-900/30 blur-[150px] rounded-full"></div>
        <div className="absolute top-[10%] w-[60vw] h-[60vh] bg-[#022c22]/40 blur-[150px] rounded-full mix-blend-screen"></div>
      </div>
      
      {/* Sidebar */}
      <aside className={`z-10 \${isSidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 flex-shrink-0 bg-black/20 backdrop-blur-xl border-r border-emerald-900/30 flex flex-col overflow-hidden`}>
        <div className="p-4 border-b border-emerald-900/30 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg cursor-pointer" onClick={startNewProject}>
            <Rocket className="w-5 h-5 text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
            <span className="truncate tracking-wide">Project Pilot</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-emerald-400 hover:text-emerald-300 p-1">
            <PanelLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3">
          <button 
            onClick={startNewProject}
            className="w-full flex items-center gap-2 bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-100 border border-emerald-800/50 hover:border-emerald-500/50 py-2.5 px-3 rounded-lg transition-all font-medium text-sm shadow-[0_0_15px_rgba(16,185,129,0.05)]"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            New Project
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-hide">
          <h3 className="text-xs font-semibold text-emerald-600/70 uppercase tracking-widest mb-3 px-2 mt-2">Recent Searches</h3>
          
          {projects.length === 0 ? (
            <div className="px-2 text-sm text-emerald-700/50 italic">No recent projects</div>
          ) : (
            projects.map(project => (
              <div 
                key={project.id}
                onClick={() => setCurrentProjectId(project.id)}
                className={`group flex flex-col gap-1 p-3 rounded-lg cursor-pointer transition-all duration-300 \${currentProjectId === project.id ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'hover:bg-emerald-950/20 border border-transparent hover:border-emerald-900/30 text-emerald-100/60'}`}
              >
                <div className="flex justify-between items-start">
                  <span className="font-medium text-sm truncate flex-1">{project.title}</span>
                  <button onClick={(e) => deleteProject(e, project.id)} className="opacity-0 group-hover:opacity-100 text-emerald-600 hover:text-red-400 transition-opacity">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2 text-[11px] opacity-70">
                  <span className="flex items-center gap-1"><Clock3 className="w-3 h-3" /> {project.date}</span>
                  <span className="w-1 h-1 rounded-full bg-emerald-800"></span>
                  <span>{project.level}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="z-10 flex-1 flex flex-col h-screen overflow-hidden relative" onClick={() => {
        if (isDropdownOpen) setIsDropdownOpen(false);
        if (isDurationDropdownOpen) setIsDurationDropdownOpen(false);
      }}>
        
        {/* Top Navbar */}
        <header className="h-14 border-b border-emerald-900/20 flex items-center px-4 shrink-0 bg-black/20 backdrop-blur-md z-10">
          {!isSidebarOpen && (
            <button onClick={() => setIsSidebarOpen(true)} className="text-emerald-500/70 hover:text-emerald-400 mr-4 transition-colors">
              <PanelLeft className="w-5 h-5" />
            </button>
          )}
          <div className="font-semibold text-emerald-100/80 tracking-wide">
            {currentProject ? currentProject.title : "New Project Setup"}
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto scroll-smooth pb-32">
          
          {!currentProject ? (
            // HOME / NEW PROJECT VIEW
            <div className="max-w-3xl mx-auto px-4 py-12 md:py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center p-5 bg-emerald-950/40 rounded-2xl mb-6 ring-1 ring-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.15)] relative group">
                  <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <Rocket className="w-12 h-12 text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)] relative z-10" />
                </div>
                <h1 className="text-4xl md:text-6xl font-extrabold mb-4 text-white tracking-tight drop-shadow-lg">
                  What are we building?
                </h1>
                <p className="text-lg text-emerald-100/60 max-w-xl mx-auto font-light">
                  Describe your idea, and your AI architect will craft a complete roadmap, architecture, and tech stack instantly.
                </p>
              </div>

              {/* Glassy Form Container */}
              <div className="bg-[#021810]/60 backdrop-blur-3xl border border-emerald-500/20 rounded-3xl p-6 md:p-8 relative overflow-visible shadow-[0_0_60px_rgba(16,185,129,0.05)]">
                {/* Glowing Top Line */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-80"></div>
                {/* Subtle inner glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-emerald-500/10 blur-[60px] pointer-events-none"></div>

                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                  <div>
                    <label className="block text-sm font-medium text-emerald-200/80 mb-2 tracking-wide">Project Name or Idea</label>
                    <div className="relative">
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g. A social media app for pet owners"
                        required
                        className="w-full bg-black/60 border border-emerald-900/50 focus:border-emerald-400/80 focus:ring-1 focus:ring-emerald-400/80 focus:bg-emerald-950/20 rounded-xl px-4 py-4 text-emerald-50 placeholder-emerald-800 transition-all shadow-inner outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Custom Dropdown for Skill Level */}
                    <div className="relative">
                      <label className="block text-sm font-medium text-emerald-200/80 mb-2 tracking-wide">My Skill Level</label>
                      <div className="relative">
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsDropdownOpen(!isDropdownOpen);
                          }}
                          className={`w-full bg-black/60 border \${isDropdownOpen ? 'border-emerald-400/80 ring-1 ring-emerald-400/80 bg-emerald-950/20' : 'border-emerald-900/50 hover:bg-emerald-950/20 hover:border-emerald-700/50'} rounded-xl px-4 py-4 text-emerald-50 cursor-pointer transition-all shadow-inner outline-none flex justify-between items-center`}
                        >
                          <span>{formData.level}</span>
                          <ChevronDown className={`w-4 h-4 text-emerald-600 transition-transform duration-200 \${isDropdownOpen ? 'rotate-180 text-emerald-400' : ''}`} />
                        </div>
                        
                        {isDropdownOpen && (
                          <div className="absolute top-[calc(100%+0.5rem)] left-0 w-full bg-[#021810]/95 backdrop-blur-2xl border border-emerald-800/50 rounded-xl overflow-hidden shadow-[0_15px_50px_rgba(0,0,0,0.8)] z-50 animate-in fade-in zoom-in-95 duration-150">
                            {levels.map(lvl => (
                              <div 
                                key={lvl}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFormData({...formData, level: lvl});
                                  setIsDropdownOpen(false);
                                }}
                                className={`px-4 py-3.5 cursor-pointer transition-all border-b border-emerald-900/20 last:border-0 \${formData.level === lvl ? 'bg-emerald-600/20 text-emerald-300 font-medium' : 'text-emerald-100 hover:bg-emerald-900/40 hover:pl-5'}`}
                              >
                                {lvl}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Custom Dropdown for Duration */}
                    <div className="relative">
                      <label className="block text-sm font-medium text-emerald-200/80 mb-2 tracking-wide">Time Available</label>
                      <div className="relative">
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsDropdownOpen(false);
                            setIsDurationDropdownOpen(!isDurationDropdownOpen);
                          }}
                          className={`w-full bg-black/60 border ${isDurationDropdownOpen ? 'border-emerald-400/80 ring-1 ring-emerald-400/80 bg-emerald-950/20' : 'border-emerald-900/50 hover:bg-emerald-950/20 hover:border-emerald-700/50'} rounded-xl px-4 py-4 text-emerald-50 cursor-pointer transition-all shadow-inner outline-none flex justify-between items-center`}
                        >
                          <span>{formData.duration}</span>
                          <ChevronDown className={`w-4 h-4 text-emerald-600 transition-transform duration-200 ${isDurationDropdownOpen ? 'rotate-180 text-emerald-400' : ''}`} />
                        </div>
                        
                        {isDurationDropdownOpen && (
                          <div className="absolute top-[calc(100%+0.5rem)] left-0 w-full max-h-56 overflow-y-auto custom-scrollbar bg-[#021810]/95 backdrop-blur-2xl border border-emerald-800/50 rounded-xl shadow-[0_15px_50px_rgba(0,0,0,0.8)] z-50 animate-in fade-in zoom-in-95 duration-150">
                            {weeks.map(week => (
                              <div 
                                key={week}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFormData({...formData, duration: week});
                                  setIsDurationDropdownOpen(false);
                                }}
                                className={`px-4 py-3.5 cursor-pointer transition-all border-b border-emerald-900/20 last:border-0 ${formData.duration === week ? 'bg-emerald-600/20 text-emerald-300 font-medium' : 'text-emerald-100 hover:bg-emerald-900/40 hover:pl-5'}`}
                              >
                                {week}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-black font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] active:scale-[0.98] flex items-center justify-center gap-3 mt-6"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin text-black" />
                        Generating Blueprint...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 text-black" />
                        Generate Project Blueprint
                      </>
                    )}
                  </button>
                </form>

                {error && (
                  <div className="mt-6 p-4 bg-red-950/50 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2 backdrop-blur-md">
                    <span className="font-bold">Error:</span> {error}
                  </div>
                )}
              </div>
            </div>
          ) : (
            // RESULTS VIEW
            <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in duration-700">
              <div className="glass-panel p-8 mb-8 border-t-[3px] border-t-emerald-500">
                <div className="flex items-center gap-4 mb-8 border-b border-emerald-900/40 pb-6">
                  <div className="p-3 bg-emerald-950/50 rounded-xl text-emerald-400 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                    <CheckCircle2 className="w-8 h-8 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight">{currentProject.title}</h2>
                    <p className="text-emerald-400/80 mt-2 flex items-center gap-3 text-sm font-medium">
                      <span className="px-2.5 py-1 rounded-md bg-emerald-950/60 border border-emerald-800/50">{currentProject.level}</span>
                      <span className="px-2.5 py-1 rounded-md bg-emerald-950/60 border border-emerald-800/50">{currentProject.duration}</span>
                    </p>
                  </div>
                </div>
                <div className="markdown-body text-[15.5px] leading-relaxed">
                  <ReactMarkdown>{currentProject.result}</ReactMarkdown>
                </div>
              </div>

              {/* Chat History Section */}
              {(currentProject.chatHistory && currentProject.chatHistory.length > 0) && (
                <div className="space-y-6 mt-8">
                  {currentProject.chatHistory.map((msg, idx) => (
                    <div key={idx} className={`flex \${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                      <div className={`max-w-[85%] rounded-2xl px-5 py-4 \${
                        msg.role === 'user' 
                          ? 'bg-emerald-600 text-white rounded-br-sm shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                          : 'bg-black/60 backdrop-blur-md border border-emerald-900/50 text-emerald-100 rounded-bl-sm markdown-body'
                      }`}>
                        {msg.role === 'user' ? (
                          <p className="m-0 leading-relaxed">{msg.content}</p>
                        ) : (
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Loading Indicator for Chat */}
              {chatLoading && (
                <div className="flex justify-start mt-6 animate-in fade-in">
                  <div className="bg-black/60 backdrop-blur-md border border-emerald-900/50 rounded-2xl rounded-bl-sm px-5 py-4 flex items-center gap-2">
                    <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                    <span className="text-emerald-200/80 text-sm">Thinking...</span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} className="h-4"></div>
            </div>
          )}
        </div>

        {/* Floating Chat Input (Only visible in Results View) */}
        {currentProject && (
          <form onSubmit={handleChatSubmit} className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#020202] via-[#020202]/90 to-transparent pt-16 pb-6 px-4">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center bg-black/80 backdrop-blur-2xl border border-emerald-900/60 rounded-full px-3 py-2 transition-all duration-300 shadow-[0_0_30px_rgba(16,185,129,0.05)] group cursor-text focus-within:border-emerald-500/60 focus-within:ring-1 focus-within:ring-emerald-500/30 focus-within:bg-emerald-950/10">
                <div className="text-emerald-600 transition-colors ml-2 mr-1">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={chatLoading}
                  placeholder="Ask anything about this project..."
                  className="flex-1 bg-transparent text-emerald-50 placeholder-emerald-800/80 focus:outline-none text-[15.5px] px-3 disabled:opacity-50"
                />
                <button 
                  type="submit" 
                  disabled={!chatInput.trim() || chatLoading}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900/50 disabled:text-emerald-700/50 text-white transition-all p-2.5 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:shadow-none"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-center text-xs text-emerald-800/60 mt-4 tracking-wide">
                Project Pilot can provide code snippets, debug errors, or explain architecture details.
              </p>
            </div>
          </form>
        )}

      </main>
    </div>
  );
}

export default App;
