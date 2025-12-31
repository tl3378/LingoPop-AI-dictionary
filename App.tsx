import React, { useState, useEffect, useRef } from 'react';
import { Language, WordEntry, AppState, ViewMode, ScanResult, PragmaticVariant } from './types';
import { lookupWord, generateWordImage, speakText, generateStory, chatWithAi, scanAndTranslateImage } from './services/geminiService';
import { Button } from './components/Button';
import { 
  Search, Book, Settings, Sparkles, Volume2, 
  ArrowRight, Heart, Brain, X, Send, 
  RotateCw, MessageCircle, Camera, Quote, Languages, Lightbulb, AlertCircle
} from 'lucide-react';

const translations: Record<string, Record<string, string>> = {
  [Language.CHINESE]: {
    discover: "地道表达",
    searchPlaceholder: "想表达什么？输入意思或词汇...",
    myNotebook: "生词本",
    noSavedWords: "还没有保存。",
    goFindSome: "去搜一些！",
    storyMode: "故事模式",
    studyMode: "复习闪卡",
    aiMagic: "AI 魔法",
    savedWords: "已存记录",
    askAi: "深入追问教练",
    chatTitle: "探讨",
    chatPlaceholder: "输入你的问题...",
    lingoTip: "教练私房话",
    variations: "看场合，怎么说？",
    iSpeak: "我的母语",
    iWantToLearn: "我想学",
    letsGo: "开启探索",
    consulting: "正在解析地道潜台词...",
    startTyping: "输入你想表达的意思，看看地道方案",
    search: "搜索",
    notebook: "记忆",
    scan: "扫描",
    scanTitle: "视觉翻译",
    analyzingImage: "识别中...",
    noTextFound: "未识别到文字。",
    internetMemeWarning: "互联网冲浪风险提示",
    oops: "哎呀，出了点问题",
    scenario_academic: "学术",
    scenario_formal: "正式",
    scenario_social: "社交",
    scenario_meme: "梗/俚语",
    scenario_daily: "日常",
    posture_neutral: "中性",
    posture_friendly: "亲切",
    posture_ironic: "阴阳怪气",
    posture_reserved: "委婉",
    posture_direct: "直白",
    posture_confident: "自信",
    cultural_logic: "文化逻辑"
  },
  [Language.ENGLISH]: {
    discover: "Authentic Expressions",
    searchPlaceholder: "What's on your mind? Type a concept or word...",
    myNotebook: "Notebook",
    noSavedWords: "Nothing saved yet.",
    goFindSome: "Go find some!",
    storyMode: "Story Mode",
    studyMode: "Flashcards",
    aiMagic: "AI Magic",
    savedWords: "Saved Records",
    askAi: "Deep Dive with Coach",
    chatTitle: "Discuss",
    chatPlaceholder: "Ask the coach anything...",
    lingoTip: "Coach's Pro Tips",
    variations: "Situational 'How-to'?",
    iSpeak: "My Native Language",
    iWantToLearn: "I want to learn",
    letsGo: "Start Exploring",
    consulting: "Analyzing cultural nuances...",
    startTyping: "Describe an intent or word to see authentic options",
    search: "Search",
    notebook: "Memory",
    scan: "Scan",
    scanTitle: "Visual Scan",
    analyzingImage: "Analyzing...",
    noTextFound: "No text detected.",
    internetMemeWarning: "Internet Meme Risk Warning",
    oops: "Oops, something went wrong",
    scenario_academic: "Academic",
    scenario_formal: "Formal",
    scenario_social: "Social",
    scenario_meme: "Meme",
    scenario_daily: "Daily",
    posture_neutral: "Neutral",
    posture_friendly: "Friendly",
    posture_ironic: "Ironic",
    posture_reserved: "Reserved",
    posture_direct: "Direct",
    posture_confident: "Confident",
    cultural_logic: "CULTURAL LOGIC"
  }
};

const getTranslation = (lang: Language, key: string) => {
  const dict = translations[lang] || translations[Language.ENGLISH];
  return dict[key] || translations[Language.ENGLISH][key] || translations[Language.CHINESE][key] || key;
};

const LanguageSelector = ({ label, value, onChange }: { label: string, value: Language, onChange: (l: Language) => void }) => (
  <div className="flex flex-col gap-2 w-full">
    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{label}</label>
    <div className="relative">
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value as Language)}
        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-lg font-bold text-slate-800 focus:outline-none focus:border-indigo-500 appearance-none shadow-sm"
      >
        {Object.values(Language).map((lang) => (
          <option key={lang} value={lang}>{lang}</option>
        ))}
      </select>
      <Languages className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={20} />
    </div>
  </div>
);

const ScenarioBadge = ({ type, t }: { type: string | undefined, t: (k: string) => string }) => {
  if (!type) return null;
  // AI may return a sentence, extract the first word if it matches our keys
  const cleanType = type.split(/[ /]/)[0];
  const styles: Record<string, string> = {
    Academic: 'bg-blue-50 text-blue-600 border-blue-100',
    Formal: 'bg-slate-50 text-slate-600 border-slate-100',
    Social: 'bg-pink-50 text-pink-600 border-pink-100',
    Meme: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    Daily: 'bg-green-50 text-green-600 border-green-100'
  };
  const translationKey = `scenario_${cleanType.toLowerCase()}`;
  const label = t(translationKey);
  // If translation equals key, it means no translation found, use clean original text
  const displayText = label === translationKey ? cleanType : label;
  return <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${styles[cleanType] || styles.Daily}`}>{displayText}</span>;
}

const PostureBadge = ({ type, t }: { type: string | undefined, t: (k: string) => string }) => {
  if (!type) return null;
  const cleanType = type.split(/[ /]/)[0];
  const styles: Record<string, string> = {
    Neutral: 'bg-gray-100 text-gray-500',
    Friendly: 'bg-orange-100 text-orange-600',
    Ironic: 'bg-purple-100 text-purple-600',
    Reserved: 'bg-indigo-100 text-indigo-600',
    Direct: 'bg-red-100 text-red-600',
    Confident: 'bg-blue-100 text-blue-700'
  };
  const translationKey = `posture_${cleanType.toLowerCase()}`;
  const label = t(translationKey);
  const displayText = label === translationKey ? cleanType : label;
  return <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${styles[cleanType] || styles.Neutral}`}>{displayText}</span>;
}

export default function App() {
  const [view, setView] = useState<ViewMode>('SEARCH');
  const [config, setConfig] = useState<AppState>(() => {
    const saved = localStorage.getItem('lingopop_config');
    return saved ? JSON.parse(saved) : {
      nativeLang: Language.CHINESE,
      targetLang: Language.ENGLISH,
      hasOnboarded: false,
    };
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<WordEntry | null>(null);
  
  const t = (key: string) => getTranslation(config.nativeLang, key);

  useEffect(() => {
    localStorage.setItem('lingopop_config', JSON.stringify(config));
  }, [config]);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchTerm.trim()) return;
    setLoading(true);
    setCurrentResult(null);
    try {
      const textData = await lookupWord(searchTerm, config.nativeLang, config.targetLang);
      const imageUrl = await generateWordImage(textData.term);
      setCurrentResult({
        id: Date.now().toString(),
        ...textData,
        imageUrl,
        createdAt: Date.now()
      });
    } catch (error) { 
      console.error("handleSearch error:", error);
      alert(`${t('oops')}: ${error instanceof Error ? error.message : 'Unknown error'}`); 
    }
    setLoading(false);
  };

  if (!config.hasOnboarded) return (
    <div className="min-h-screen bg-indigo-600 flex flex-col items-center justify-center p-6 text-white overflow-y-auto">
      <div className="w-full max-w-md space-y-8 animate-[fadeIn_0.5s_ease-out]">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 bg-white/20 rounded-[2.5rem] mx-auto flex items-center justify-center backdrop-blur-md shadow-2xl">
            <Sparkles size={48} className="text-yellow-300" />
          </div>
          <h1 className="text-5xl font-black tracking-tighter italic">LingoPop</h1>
          <p className="text-indigo-100 font-bold opacity-80">教你换个脑子地道说话</p>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 text-slate-800 space-y-8 shadow-2xl">
          <div className="space-y-6">
            <LanguageSelector label={t('iSpeak')} value={config.nativeLang} onChange={l => setConfig({...config, nativeLang: l})} />
            <div className="flex justify-center -my-2">
              <div className="bg-indigo-50 p-2 rounded-full"><ArrowRight className="text-indigo-400 rotate-90" size={20} /></div>
            </div>
            <LanguageSelector label={t('iWantToLearn')} value={config.targetLang} onChange={l => setConfig({...config, targetLang: l})} />
          </div>
          <Button size="lg" onClick={() => setConfig({...config, hasOnboarded: true})} className="w-full h-16 rounded-2xl shadow-xl shadow-indigo-100 text-xl">
            {t('letsGo')} <ArrowRight className="ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );

  const isMemeTerm = currentResult?.variants?.some(v => v.scenario?.includes('Meme'));

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="max-w-xl mx-auto w-full pb-24">
          <div className="sticky top-0 bg-slate-50/95 backdrop-blur z-10 p-4 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center"><Sparkles size={16} className="text-white" /></div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tighter italic">LingoPop</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setConfig({...config, hasOnboarded: false})} className="bg-white border border-slate-100 rounded-full px-4 shadow-sm">
                <span className="text-indigo-600 font-bold text-sm">{config.targetLang}</span>
                <Settings size={14} className="ml-2 text-slate-400"/>
              </Button>
            </div>
            <form onSubmit={handleSearch} className="relative group">
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t('searchPlaceholder')}
                className="w-full p-5 pl-14 bg-white rounded-3xl shadow-xl border-2 border-transparent focus:border-indigo-500 focus:outline-none text-lg font-bold text-slate-800 transition-all placeholder:text-slate-300" />
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-400 group-focus-within:text-indigo-600 transition-colors" size={24} />
              <div className="absolute right-3 top-1/2 -translate-y-1/2"><Button size="sm" type="submit" disabled={loading || !searchTerm}>GO</Button></div>
            </form>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="w-16 h-16 bg-indigo-600 rounded-3xl animate-bounce flex items-center justify-center shadow-lg shadow-indigo-200"><Sparkles className="text-white" /></div>
                <p className="font-bold text-indigo-400 animate-pulse">{t('consulting')}</p>
              </div>
            ) : currentResult ? (
              <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
                <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-100">
                  <div className="p-8 pb-6">
                     <div className="flex justify-between items-start mb-2">
                        <h1 className="text-4xl font-black text-indigo-900 tracking-tight leading-tight">{currentResult.term}</h1>
                        <Button variant="secondary" size="icon" onClick={() => speakText(currentResult.term)}><Volume2 size={20} /></Button>
                     </div>
                     <p className="text-slate-500 font-bold mb-8 text-lg">{currentResult.nativeDefinition}</p>
                     
                     {currentResult.usageNote && (
                       <div className={`rounded-2xl p-5 border mb-2 relative overflow-hidden transition-all duration-500 ${isMemeTerm ? 'bg-yellow-50 border-yellow-200 shadow-inner' : 'bg-amber-50/50 border-amber-100'}`}>
                         <div className="absolute top-0 right-0 p-4 opacity-10">{isMemeTerm ? <Sparkles size={40} className="text-yellow-500" /> : <Lightbulb size={40} className="text-amber-500" />}</div>
                         <div className="flex items-center gap-2 mb-2">
                           {isMemeTerm ? <AlertCircle size={14} className="text-yellow-600" /> : <Quote size={14} className="text-amber-500" />}
                           <span className={`text-[10px] font-black uppercase tracking-widest ${isMemeTerm ? 'text-yellow-700' : 'text-amber-600'}`}>{isMemeTerm ? t('internetMemeWarning') : t('lingoTip')}</span>
                         </div>
                         <p className={`text-sm font-bold leading-relaxed ${isMemeTerm ? 'text-yellow-900' : 'text-amber-900/80'}`}>{currentResult.usageNote}</p>
                       </div>
                     )}
                  </div>

                  <div className="bg-slate-50/50 p-6 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2 my-4">
                      <div className="h-px flex-1 bg-slate-200"></div>
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('variations')}</h3>
                      <div className="h-px flex-1 bg-slate-200"></div>
                    </div>
                    
                    <div className="space-y-4">
                      {currentResult.variants?.map((v, i) => (
                        <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/50 group hover:border-indigo-200 transition-all hover:shadow-md">
                          <div className="flex items-center gap-2 mb-3">
                            <ScenarioBadge type={v.scenario} t={t} />
                            <PostureBadge type={v.posture} t={t} />
                          </div>
                          <div className="flex justify-between items-start gap-4 mb-4">
                            <p className="text-xl font-black text-slate-900 leading-tight tracking-tight">{v.expression}</p>
                            <button onClick={() => speakText(v.expression)} className="shrink-0 text-slate-300 hover:text-indigo-500 bg-slate-50 p-2 rounded-full transition-colors"><Volume2 size={18} /></button>
                          </div>
                          {v.pragmaticNote && (
                            <div className="bg-indigo-50/30 p-4 rounded-xl border border-indigo-100/50 relative mt-2">
                              <div className="absolute -top-2 left-3 bg-white px-2 text-[8px] font-black text-indigo-400 border border-indigo-50 rounded italic">{t('cultural_logic')}</div>
                              <p className="text-xs text-indigo-900/70 leading-relaxed font-bold">{v.pragmaticNote}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <Button className="w-full h-16 rounded-[2rem] shadow-2xl shadow-indigo-100 text-lg"><MessageCircle className="mr-2" /> {t('askAi')}</Button>
              </div>
            ) : (
              <div className="text-center mt-20 space-y-6">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto"><Search size={40} className="text-slate-200" /></div>
                <p className="font-bold text-slate-300 max-w-[200px] mx-auto leading-relaxed">{t('startTyping')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <nav className="h-20 bg-white border-t border-slate-100 flex items-center justify-around px-6 pb-2 shrink-0 z-20">
        <button onClick={() => setView('SEARCH')} className={`flex flex-col items-center gap-1 p-2 ${view === 'SEARCH' ? 'text-indigo-600' : 'text-slate-400'}`}><Search size={22} strokeWidth={3} /><span className="text-[10px] font-black uppercase tracking-tighter">{t('search')}</span></button>
        <button onClick={() => setView('SCAN')} className={`flex flex-col items-center gap-1 p-2 ${view === 'SCAN' ? 'text-indigo-600' : 'text-slate-400'}`}><Camera size={22} /><span className="text-[10px] font-black uppercase tracking-tighter">{t('scan')}</span></button>
        <button onClick={() => setView('NOTEBOOK')} className={`flex flex-col items-center gap-1 p-2 ${view === 'NOTEBOOK' ? 'text-indigo-600' : 'text-slate-400'}`}><Book size={22} /><span className="text-[10px] font-black uppercase tracking-tighter">{t('notebook')}</span></button>
      </nav>
    </div>
  );
}