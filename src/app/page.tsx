'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Sparkles, Store, X, MessageSquare, Send, Bot, Phone, Navigation, CheckCircle2, Copy, Check, TrendingUp, Zap, ShieldCheck, MapPinned, Loader2, ArrowDownUp, Filter } from 'lucide-react';

type Message = {
  role: 'user' | 'ai';
  content: string;
  shops?: any[]; 
};

export default function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // 👈 استیت‌های فیلتر
  const [sortBy, setSortBy] = useState<'default' | 'cheapest' | 'expensive'>('default');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [aiAnalyses, setAiAnalyses] = useState<Record<string, any>>({});
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const [callModal, setCallModal] = useState<{name: string, phone: string, product: string} | null>(null);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'message'>('idle');
  const [isCopied, setIsCopied] = useState(false);
  const [mapModal, setMapModal] = useState<{name: string, address: string, lat: number, lon: number} | null>(null);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Message[]>([
    { role: 'ai', content: 'سلام! من دستیار خرید شما هستم. چی می‌خوای بخری؟' }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isChatOpen) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatOpen, isChatLoading]);

  const executeSearch = async (searchQuery: string) => {
    if (searchQuery.length < 2) return;
    setQuery(searchQuery);
    setLoading(true);
    setHasSearched(true);
    setResults([]);
    // ریست فیلترها هنگام سرچ جدید
    setSortBy('default');
    setMinPrice('');
    setMaxPrice('');

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success) setResults(data.data);
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query);
  };

  const openAiModal = async (product: any) => {
    setSelectedProduct(product);
    if (!aiAnalyses[product.id]) {
      setAnalyzingId(product.id);
      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: product.id })
        });
        const data = await res.json();
        if (data.success) setAiAnalyses(prev => ({ ...prev, [product.id]: data }));
      } catch (error) { console.error(error); }
      setAnalyzingId(null);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput);
  };

  const sendChatMessage = async (msgText: string) => {
    const userMsg = msgText;
    const updatedMessages = [...chatMessages, { role: 'user' as const, content: userMsg }];
    setChatMessages(updatedMessages);
    setChatInput('');
    setIsChatLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }) 
      });
      const data = await res.json();
      if (data.success) {
        setChatMessages(prev => [...prev, { role: 'ai', content: data.reply, shops: data.shops }]);
      }
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'ai', content: 'ارتباط با سرور برقرار نشد.' }]);
    }
    setIsChatLoading(false);
  };

  // 👈 منطق فیلتر و مرتب‌سازی
  const processedResults = results
    .filter((product) => {
      const price = product.offers?.[0]?.priceToman;
      if (!price) return true; // محصولات بدون قیمت هم نمایش داده شوند
      
      const min = minPrice ? parseInt(minPrice) : 0;
      const max = maxPrice ? parseInt(maxPrice) : Infinity;
      
      return price >= min && price <= max;
    })
    .sort((a, b) => {
      if (sortBy === 'default') return 0;
      const priceA = a.offers?.[0]?.priceToman || Infinity;
      const priceB = b.offers?.[0]?.priceToman || Infinity;
      if (sortBy === 'cheapest') return priceA - priceB;
      if (sortBy === 'expensive') return priceB - priceA;
      return 0;
    });

  return (
    <main dir="rtl" className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#09090b] text-zinc-50 font-sans relative selection:bg-rose-500/30 flex flex-col">
      
      {/* هدر */}
      <header className={`relative px-4 md:px-8 overflow-hidden transition-all duration-500 ${hasSearched ? 'pt-6 pb-4' : 'pt-20 md:pt-24 pb-12 flex-1 flex flex-col justify-center'}`}>
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-200 h-125 bg-linear-to-b from-rose-600/15 via-rose-900/10 to-transparent blur-[120px] rounded-full pointer-events-none transition-opacity duration-500 ${hasSearched ? 'opacity-30' : 'opacity-100'}`}></div>

        <div className={`max-w-3xl w-full mx-auto relative z-10 text-center transition-all duration-500 ${hasSearched ? 'mb-4' : 'mb-8 md:mb-12'}`}>
          <h1 className={`font-black bg-linear-to-r from-rose-400 via-rose-500 to-indigo-400 bg-clip-text text-transparent mb-2 md:mb-4 tracking-tight leading-tight transition-all duration-500 ${hasSearched ? 'text-xl md:text-3xl' : 'text-3xl md:text-5xl lg:text-6xl'}`}>
            دستیار هوشمند خرید حضوری
          </h1>
          {!hasSearched && (
            <p className="text-zinc-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
              ارزان‌ترین فروشگاه‌های تهران را پیدا کنید، با هوش مصنوعی مقایسه کنید و حضوری خرید کنید.
            </p>
          )}
        </div>

        <div className="max-w-3xl w-full mx-auto relative z-10">
          <form onSubmit={handleSearch} className="relative flex items-center w-full bg-zinc-900/60 backdrop-blur-2xl border border-zinc-700/60 rounded-2xl md:rounded-3xl p-1.5 md:p-2 shadow-[0_0_50px_-10px_rgba(244,63,94,0.2)] focus-within:border-rose-500/80 focus-within:ring-4 focus-within:ring-rose-500/10 transition-all">
            <Search className="w-4 h-4 md:w-6 md:h-6 text-zinc-500 ml-2 right-4 md:right-5 absolute" />
            <input 
              type="text" 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              placeholder="جستجوی محصول..." 
              className="w-full bg-transparent border-none outline-none text-zinc-100 pr-10 md:pr-14 pl-24 md:pl-32 py-3 md:py-4 placeholder:text-zinc-600 text-sm md:text-lg" 
            />
            <button 
              type="submit" 
              disabled={loading} 
              className="absolute left-1.5 md:left-2 px-4 md:px-8 py-2 md:py-3.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl md:rounded-2xl transition-all font-bold shadow-lg shadow-rose-600/30 hover:shadow-rose-600/50 flex items-center gap-2 disabled:opacity-70 text-sm md:text-base"
            >
              {loading ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : 'جستجو'}
            </button>
          </form>

          {!hasSearched && (
            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-2.5 mt-4 md:mt-6">
              <span className="text-[10px] md:text-xs font-medium text-zinc-500 flex items-center gap-1 ml-1"><TrendingUp className="w-3 h-3 md:w-4 md:h-4" /> پرطرفدار:</span>
              {['لامپ LED', 'دوربین مدار بسته', 'هدفون بلوتوثی'].map((item) => (
                <button key={item} onClick={() => executeSearch(item)} className="text-[10px] md:text-xs bg-zinc-800/40 hover:bg-zinc-700/60 text-zinc-300 px-2 md:px-4 py-1 md:py-2 rounded-lg md:rounded-xl border border-zinc-700/50 transition-all">
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* راهنما (فقط صفحه اول) */}
      {!hasSearched && !loading && (
        <section className="w-full px-4 md:px-8 pb-24 pt-4 z-10 relative">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="group bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-5 text-center backdrop-blur-sm">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mx-auto mb-3 md:mb-4 border border-indigo-500/20">
                <Search className="w-5 h-5 md:w-6 md:h-6 text-indigo-400" />
              </div>
              <h3 className="font-bold text-white mb-1 md:mb-2 text-sm md:text-base">۱. جستجو کنید</h3>
              <p className="text-xs text-zinc-400 leading-relaxed hidden md:block">محصول مورد نظرتان را در بین هزاران کالای تهران پیدا کنید.</p>
            </div>
            <div className="group bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-5 text-center backdrop-blur-sm">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-rose-500/10 rounded-xl flex items-center justify-center mx-auto mb-3 md:mb-4 border border-rose-500/20">
                <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-rose-400" />
              </div>
              <h3 className="font-bold text-white mb-1 md:mb-2 text-sm md:text-base">۲. تحلیل هوشمند</h3>
              <p className="text-xs text-zinc-400 leading-relaxed hidden md:block">هوش مصنوعی مشخصات، قیمت و بهترین فروشنده را مقایسه می‌کند.</p>
            </div>
            <div className="group bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-5 text-center backdrop-blur-sm">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mx-auto mb-3 md:mb-4 border border-emerald-500/20">
                <MapPinned className="w-5 h-5 md:w-6 md:h-6 text-emerald-400" />
              </div>
              <h3 className="font-bold text-white mb-1 md:mb-2 text-sm md:text-base">۳. خرید حضوری</h3>
              <p className="text-xs text-zinc-400 leading-relaxed hidden md:block">با دکمه تماس و مسیریابی، سریع به فروشگاه بروید و خرید کنید.</p>
            </div>
          </div>
        </section>
      )}

      {/* نتایج */}
      {hasSearched && (
        <section className="flex-1 px-4 md:px-8 pb-12 w-full max-w-7xl mx-auto overflow-y-auto custom-scrollbar">
          
                    {/* 👈 نوار فیلترها */}
          {!loading && results.length > 0 && (
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-6 pt-2 bg-zinc-900/60 backdrop-blur-md p-3 rounded-2xl border border-zinc-800/80">
              
              {/* مرتب‌سازی */}
              <div className="flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden shrink-0">
                <span className="text-xs text-zinc-400 flex items-center gap-1.5 shrink-0 ml-1">
                  <ArrowDownUp className="w-4 h-4 text-zinc-500"/> مرتب‌سازی:
                </span>
                <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 shrink-0">
                  <button onClick={() => setSortBy('default')} className={`text-xs px-3 py-1.5 rounded-lg transition-all ${sortBy === 'default' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}>پیش‌فرض</button>
                  <button onClick={() => setSortBy('cheapest')} className={`text-xs px-3 py-1.5 rounded-lg transition-all ${sortBy === 'cheapest' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}>ارزان‌ترین</button>
                  <button onClick={() => setSortBy('expensive')} className={`text-xs px-3 py-1.5 rounded-lg transition-all ${sortBy === 'expensive' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'}`}>گران‌ترین</button>
                </div>
              </div>

              {/* بازه قیمت */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-xs text-zinc-400 flex items-center gap-1.5 shrink-0">
                  <Filter className="w-4 h-4 text-zinc-500"/> بودجه:
                </span>
                
                {/* 
                  👈 جادوی Tailwind: 
                  در موبایل flex-wrap (دو خطی) و در دسکتاپ (lg) به حالت یک خطی با اسکرول برمی‌گرده 
                */}
                <div className="flex flex-wrap lg:flex-nowrap gap-2 lg:overflow-x-auto lg:[&::-webkit-scrollbar]:hidden pb-1 lg:pb-0">
                  {[
                    { label: 'همه', min: '', max: '' },
                    { label: 'زیر ۵۰۰ هزار', min: '', max: '500000' },
                    { label: '۵۰۰ هزار تا ۲ میلیون', min: '500000', max: '2000000' },
                    { label: '۲ تا ۱۰ میلیون', min: '2000000', max: '10000000' },
                    { label: 'بالای ۱۰ میلیون', min: '10000000', max: '' }
                  ].map((range, idx) => {
                    const isActive = minPrice === range.min && maxPrice === range.max;
                    return (
                      <button 
                        key={idx}
                        onClick={() => { setMinPrice(range.min); setMaxPrice(range.max); }}
                        className={`text-[11px] md:text-xs px-2.5 md:px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap ${
                          isActive 
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/50' 
                            : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-800'
                        }`}
                      >
                        {range.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 pt-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-40 md:h-48 w-full bg-zinc-800/50"></div>
                  <div className="p-4 md:p-5 space-y-3 md:space-y-4">
                    <div className="h-4 bg-zinc-800 rounded w-3/4"></div>
                    <div className="h-10 bg-zinc-800 rounded w-full mt-4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : processedResults.length > 0 ? ( // 👈 استفاده از processedResults
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 items-stretch pt-2">
              {processedResults.map((product) => {
                const cheapestOffer = product.offers?.[0];
                const imageUrl = product.imageUrls?.[0] || 'https://via.placeholder.com/150?text=No+Image';
                
                return (
                  <div key={product.id} className="group bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-600 transition-all flex flex-col h-full shadow-lg duration-300">
                    <div className="h-40 md:h-48 w-full bg-white p-4 md:p-5 flex items-center justify-center shrink-0 relative overflow-hidden">
                      <img src={imageUrl} alt={product.persianTitle} className="max-h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    
                    <div className="p-4 flex flex-col flex-1 bg-linear-to-b from-zinc-900 to-zinc-950/80">
                      <h2 className="text-xs md:text-sm font-semibold text-zinc-100 line-clamp-2 mb-2 md:mb-3 h-8 md:h-10 leading-relaxed" title={product.persianTitle}>
                        {product.persianTitle}
                      </h2>
                      
                      <div className="mt-auto pt-3 md:pt-4 border-t border-zinc-800/80 min-h-15 md:min-h-17.5 flex flex-col justify-end">
                        {cheapestOffer ? (
                          <>
                            <p className="text-[10px] md:text-xs text-zinc-400 mb-1 flex items-center gap-1">
                              <Store className="w-3 h-3 text-zinc-500" />
                              {cheapestOffer.shop?.name || 'نامشخص'}
                            </p>
                            <p className="text-lg md:text-xl font-black text-emerald-400 tracking-tight">
                              {cheapestOffer.priceToman.toLocaleString()} <span className="text-[10px] md:text-xs font-normal text-zinc-500">تومان</span>
                            </p>
                          </>
                        ) : (
                          <div className="text-center py-1 md:py-2">
                            <span className="text-[10px] md:text-xs text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded-md border border-zinc-700/50">فروشنده‌ای ثبت نشده</span>
                          </div>
                        )}
                      </div>
                      
                      <button 
                        onClick={() => openAiModal(product)}
                        className="mt-3 md:mt-4 w-full flex items-center justify-center gap-2 py-2.5 md:py-3 bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white rounded-xl transition-all text-xs md:text-sm font-bold border border-rose-500/20 hover:border-rose-500 shrink-0"
                      >
                        <Sparkles className="w-4 h-4" />
                        تحلیل و فروشگاه‌ها
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                <Search className="w-6 h-6 md:w-8 md:h-8 text-zinc-700" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-white mb-2">نتیجه‌ای یافت نشد</h3>
              <p className="text-zinc-400 text-xs md:text-sm max-w-md">با این فیلترها محصولی پیدا نکردیم. لطفاً بازه قیمتی را تغییر دهید.</p>
            </div>
          )}
        </section>
      )}

      {/* مودال تحلیل */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-900 border-t md:border border-zinc-700 rounded-t-3xl md:rounded-3xl w-full max-w-2xl max-h-[85vh] md:max-h-[90vh] overflow-y-auto shadow-2xl relative [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-zinc-700 animate-in slide-in-from-bottom-5 md:zoom-in-95">
            
            <div className="md:hidden w-full flex items-center justify-between px-4 pt-3 pb-2 sticky top-0 bg-zinc-900/90 backdrop-blur-sm z-30 border-b border-zinc-800/50">
              <button onClick={() => setSelectedProduct(null)} className="p-2 bg-zinc-800/80 hover:bg-zinc-700 rounded-full text-zinc-300 transition-colors border border-zinc-700/50">
                <X className="w-5 h-5" />
              </button>
              <div className="w-12 h-1.5 bg-zinc-700 rounded-full absolute left-1/2 -translate-x-1/2"></div>
              <div className="w-9"></div>
            </div>

            <button onClick={() => setSelectedProduct(null)} className="hidden md:flex absolute top-5 left-5 p-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-full text-zinc-300 z-10 transition-colors border border-zinc-700/50">
              <X className="w-5 h-5" />
            </button>
            
            <div className="p-4 md:p-10 pt-2 md:pt-10">
              <div className="flex items-center gap-4 md:gap-6 mb-6 md:mb-10 pr-0 md:pr-14 border-b border-zinc-800 pb-5 md:pb-6">
                <div className="w-16 h-16 md:w-24 md:h-24 bg-white rounded-xl md:rounded-2xl flex items-center justify-center p-2 md:p-3 shrink-0 shadow-inner">
                  <img src={selectedProduct.imageUrls?.[0] || 'https://via.placeholder.com/150'} alt="" className="max-h-full object-contain mix-blend-multiply" />
                </div>
                <h3 className="text-sm md:text-2xl font-bold text-white leading-relaxed">{selectedProduct.persianTitle}</h3>
              </div>
              
              {analyzingId === selectedProduct.id ? (
                <div className="flex flex-col items-center justify-center py-16 md:py-20 text-rose-400">
                  <Sparkles className="w-10 h-10 md:w-14 md:h-14 animate-pulse mb-4 md:mb-6" />
                  <p className="animate-pulse font-medium text-sm md:text-lg">در حال بررسی ...</p>
                </div>
              ) : aiAnalyses[selectedProduct.id] ? (
                <div className="space-y-6 md:space-y-10">
                  <div className="bg-linear-to-br from-zinc-800/60 to-zinc-900 p-4 md:p-8 rounded-xl md:rounded-2xl border border-zinc-700/60 shadow-inner relative overflow-hidden">
                    <p className="text-sm md:text-lg font-medium text-zinc-100 leading-relaxed mb-4 md:mb-8 flex gap-2 md:gap-4 relative z-10">
                      <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-rose-400 shrink-0 mt-0.5 md:mt-1" />
                      {aiAnalyses[selectedProduct.id].analysis.verdict}
                    </p>
                    <ul className="text-xs md:text-base space-y-3 md:space-y-5 relative z-10">
                      <li className="flex items-start gap-2 md:gap-3 text-zinc-300 bg-zinc-950/30 p-2 md:p-3 rounded-lg md:rounded-xl"><span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-emerald-500 shrink-0 mt-1.5 md:mt-2"></span><span className="leading-relaxed"><strong className="text-emerald-400 mr-1">قوت:</strong> {aiAnalyses[selectedProduct.id].analysis.pro}</span></li>
                      <li className="flex items-start gap-2 md:gap-3 text-zinc-300 bg-zinc-950/30 p-2 md:p-3 rounded-lg md:rounded-xl"><span className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-rose-500 shrink-0 mt-1.5 md:mt-2"></span><span className="leading-relaxed"><strong className="text-rose-400 mr-1">ضعف:</strong> {aiAnalyses[selectedProduct.id].analysis.con}</span></li>
                    </ul>
                  </div>

                  {aiAnalyses[selectedProduct.id].topOffers && aiAnalyses[selectedProduct.id].topOffers.length > 0 ? (
                    <div className="pt-2">
                      <h4 className="flex items-center gap-2 text-base md:text-lg font-bold text-white mb-4 md:mb-6">
                        <Store className="w-5 h-5 md:w-6 md:h-6 text-rose-400" /> فروشگاه‌های حضوری
                      </h4>
                      <div className="space-y-3 md:space-y-4">
                        {aiAnalyses[selectedProduct.id].topOffers.map((offer: any, idx: number) => {
                          let phoneStr = "";
                          if (Array.isArray(offer.shop?.contacts)) {
                            const p = offer.shop.contacts.find((c: any) => c.channel === 'phone' || c.channel === 'mobile');
                            if (p) phoneStr = p.display_number; 
                          }

                          return (
                            <div key={idx} className="bg-zinc-950/80 border border-zinc-800 rounded-xl md:rounded-2xl p-4 md:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-5">
                              <div className="flex-1 w-full">
                                <p className="font-bold text-white text-sm md:text-base flex items-center gap-2 mb-1.5 md:mb-2">
                                  <Store className="w-4 h-4 md:w-5 md:h-5 text-zinc-500" /> {offer.shop?.name || 'فروشگاه'}
                                </p>
                                <p className="text-xs md:text-sm text-zinc-400 flex items-start gap-1.5 leading-6">
                                  <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 mt-1 shrink-0 text-zinc-500" /> {offer.shop?.address || 'آدرس ثبت نشده'}
                                </p>
                                {phoneStr && <p className="text-xs md:text-sm text-emerald-400 mt-2 flex items-center gap-1.5 font-mono bg-emerald-500/5 w-fit px-2 py-1 rounded" dir="ltr"><Phone className="w-3 h-3" /> {phoneStr}</p>}
                              </div>
                              <div className="flex flex-col items-start md:items-end gap-3 w-full md:w-auto mt-2 md:mt-0 bg-zinc-900/50 p-3 md:p-4 rounded-lg md:rounded-xl border border-zinc-800/50">
                                <p className="font-black text-emerald-400 text-lg md:text-xl">
                                  {offer.priceToman.toLocaleString()} <span className="text-[10px] md:text-xs font-normal text-zinc-500">تومان</span>
                                </p>
                                <div className="flex gap-2 w-full md:w-auto">
                                  <button onClick={() => { setCallModal({ name: offer.shop?.name || 'فروشگاه', phone: phoneStr, product: selectedProduct.persianTitle }); setCallStatus('idle'); }} className="flex-1 md:flex-none flex items-center justify-center gap-1.5 md:gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors border border-zinc-700"><Phone className="w-3.5 h-3.5" /> تماس</button>
                                  <button onClick={() => { setMapModal({ name: offer.shop?.name || 'فروشگاه', address: offer.shop?.address || 'آدرس نامشخص', lat: offer.shop?.lat || 35.6892, lon: offer.shop?.lon || 51.3890 }); }} className="flex-1 md:flex-none flex items-center justify-center gap-1.5 md:gap-2 bg-rose-600 hover:bg-rose-500 text-white px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors"><Navigation className="w-3.5 h-3.5" /> مسیریابی</button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 md:pt-4">
                      <div className="bg-zinc-900 border border-zinc-800 rounded-xl md:rounded-2xl p-6 md:p-8 text-center">
                        <Store className="w-8 h-8 md:w-12 md:h-12 text-zinc-700 mx-auto mb-3 md:mb-4" />
                        <h4 className="text-sm md:text-lg font-bold text-zinc-300 mb-2">فروشگاهی یافت نشد</h4>
                        <p className="text-xs md:text-sm text-zinc-500 max-w-sm mx-auto">برای این محصول در دیتابیس ترب فروشگاهی ثبت نشده است.</p>
                      </div>
                    </div>
                  )}

                  {aiAnalyses[selectedProduct.id].analysis.reviews && (
                    <div className="pt-2 md:pt-4 pb-6 md:pb-0">
                      <h4 className="flex items-center gap-2 text-base md:text-lg font-bold text-white mb-3 md:mb-5"><MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" /> نظرات</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        {aiAnalyses[selectedProduct.id].analysis.reviews.map((rev: any, index: number) => (
                          <div key={index} className="bg-zinc-950/60 p-4 md:p-5 rounded-xl border border-zinc-800/80">
                            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3"><div className="w-7 h-7 md:w-9 md:h-9 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 text-xs md:text-sm">👤</div><p className="text-xs md:text-sm font-bold text-zinc-200">{rev.name}</p></div>
                            <p className="text-xs md:text-sm text-zinc-400 leading-relaxed">{rev.comment}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* مودال تماس */}
      {callModal && (
        <div className="fixed inset-0 z-60 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-900 border-t md:border border-zinc-700 rounded-t-3xl md:rounded-3xl w-full max-w-sm p-6 md:p-8 text-center relative animate-in slide-in-from-bottom-5 md:zoom-in-95 shadow-2xl">
            
            {/* حالت ۱: تأیید تماس */}
            {callStatus === 'idle' && (
              <>
                <div className="w-20 h-20 md:w-24 md:h-24 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6 border border-zinc-700">
                  <Phone className="w-8 h-8 md:w-10 md:h-10 text-zinc-400" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2">{callModal.name}</h3>
                <p className="text-zinc-400 font-mono text-lg md:text-xl mb-6 tracking-wider" dir="ltr">{callModal.phone}</p>
                
                <p className="text-sm text-zinc-300 mb-8 bg-zinc-800/50 p-3 rounded-xl border border-zinc-700/50">
                  آیا می‌خواهید با این فروشگاه تماس بگیرید؟
                </p>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => {
                      setCallStatus('calling');
                      setTimeout(() => {
                        setCallStatus('message');
                      }, 3000); 
                    }} 
                    className="w-full bg-green-500 hover:bg-green-400 text-white py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
                  >
                    <Phone className="w-5 h-5" /> بله، تماس بگیر
                  </button>
                  <button 
                    onClick={() => setCallModal(null)} 
                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-3.5 rounded-xl font-bold transition-all"
                  >
                    لغو
                  </button>
                </div>
              </>
            )}

            {/* حالت ۲: در حال زنگ زدن */}
            {callStatus === 'calling' && (
              <>
                <div className="relative w-20 h-20 md:w-24 md:h-24 mx-auto mb-6">
                  <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping"></div>
                  <div className="relative w-full h-full bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/30">
                    <Store className="w-8 h-8 md:w-10 md:h-10 text-green-400" />
                  </div>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white mb-1 md:mb-2">{callModal.name}</h3>
                <p className="text-zinc-400 font-mono text-lg md:text-xl mb-2 tracking-wider" dir="ltr">{callModal.phone}</p>
                <p className="text-sm text-green-400 animate-pulse mb-8 md:mb-10">در حال برقراری تماس...</p>
                
                <div className="flex flex-col items-center gap-2">
                  <button 
                    onClick={() => setCallModal(null)} 
                    className="w-16 h-16 md:w-18 md:h-18 bg-red-500 hover:bg-red-400 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-transform hover:scale-110"
                  >
                    <Phone className="w-7 h-7 md:w-8 md:h-8 text-white rotate-135" />
                  </button>
                  <span className="text-[10px] md:text-xs text-zinc-500">قطع تماس</span>
                </div>
              </>
            )}

            {/* حالت ۳: پیام آماده */}
            {callStatus === 'message' && (
              <>
                <div className="w-16 h-16 md:w-20 md:h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 border border-amber-500/20">
                  <MessageSquare className="w-6 h-6 md:w-8 md:h-8 text-amber-400" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-white mb-1.5 md:mb-2">پیام آماده</h3>
                <p className="text-[10px] md:text-xs text-zinc-400 mb-4 md:mb-5">فروشنده پاسخ داد. این پیام را کپی کرده و در واتساپ بفرستید.</p>
                <div className="relative bg-zinc-950 p-3 md:p-4 rounded-xl text-right text-xs md:text-sm text-zinc-300 border border-zinc-800 mb-4 md:mb-6 group">
                  <div className="pl-8 md:pl-10 leading-6 md:leading-7">
                    سلام، من از ترب مزاحم میشم. آیا محصول «{callModal.product}» رو موجود دارید؟ گارانتی و شرایط نصبش چطوره؟
                  </div>
                  <button 
                    onClick={() => { 
                      navigator.clipboard.writeText(`سلام، من از ترب مزاحم میشم. آیا محصول «${callModal.product}» رو موجود دارید؟ گارانتی و شرایط نصبش چطوره؟`); 
                      setIsCopied(true); 
                      setTimeout(() => setIsCopied(false), 2000); 
                    }} 
                    className="absolute top-2 left-2 p-1.5 md:p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <button onClick={() => setCallModal(null)} className="w-full bg-rose-600 hover:bg-rose-500 text-white py-2.5 md:py-3 rounded-xl font-bold text-sm md:text-base transition-colors">بستن</button>
              </>
            )}
            
          </div>
        </div>
      )}

      {/* مودال نقشه */}
      {mapModal && (
        <div className="fixed inset-0 z-60 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-900 border-t md:border border-zinc-700 rounded-t-3xl md:rounded-3xl w-full max-w-lg overflow-hidden relative animate-in slide-in-from-bottom-5 md:zoom-in-95 flex flex-col shadow-2xl">
            <div className="p-4 md:p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/80 backdrop-blur z-10 relative">
              <div>
                <h3 className="font-bold text-white text-sm md:text-lg flex items-center gap-2"><MapPin className="w-4 h-4 md:w-5 md:h-5 text-rose-400"/> {mapModal.name}</h3>
                <p className="text-[10px] md:text-sm text-zinc-400 mt-1">{mapModal.address}</p>
              </div>
              <button onClick={() => setMapModal(null)} className="p-1.5 md:p-2 bg-zinc-800 rounded-full"><X className="w-4 h-4 md:w-5 md:h-5" /></button>
            </div>
            <div className="h-48 md:h-64 bg-zinc-800 relative flex items-center justify-center overflow-hidden">
               <MapPin className="w-10 h-10 md:w-14 md:h-14 text-rose-500 animate-bounce" />
            </div>
            <div className="p-4 md:p-6 bg-zinc-900">
              <a href={`https://maps.google.com/?q=${mapModal.lat},${mapModal.lon}`} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white py-3 md:py-3.5 rounded-xl font-bold text-sm md:text-base"><Navigation className="w-4 h-4 md:w-5 md:h-5" /> باز کردن در نقشه گوگل</a>
            </div>
          </div>
        </div>
      )}

      {/* دکمه شناور چت (با تول‌تیپ) */}
      <div className="fixed bottom-4 left-4 md:bottom-6 md:left-6 z-40 group">
        <button 
          onClick={() => setIsChatOpen(true)} 
          className="relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-rose-600 hover:bg-rose-500 text-white rounded-full shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all hover:scale-105"
        >
          <Bot className="w-5 h-5 md:w-7 md:h-7" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3 md:h-3.5 md:w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 md:h-3.5 md:w-3.5 bg-emerald-500 border-2 border-[#09090b]"></span>
          </span>
        </button>
        
        {/* تول‌تیپ */}
        <div className="absolute bottom-full left-0 mb-3 w-max opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="bg-zinc-800 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg border border-zinc-700 flex items-center gap-2 relative">
            مشاور هوشمند خرید
            <div className="absolute -bottom-1 left-6 w-2 h-2 bg-zinc-800 border-b border-r border-zinc-700 transform rotate-45"></div>
          </div>
        </div>
      </div>

      {/* مودال چت */}
      {isChatOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-900 border-t md:border border-zinc-700 rounded-t-3xl md:rounded-3xl w-full max-w-lg h-[90vh] md:h-162.5 flex flex-col shadow-2xl relative animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between p-4 md:p-5 border-b border-zinc-800 bg-zinc-900/50 rounded-t-3xl">
              <div className="flex items-center gap-2 md:gap-3 text-rose-400">
                <div className="p-1.5 md:p-2 bg-rose-500/10 rounded-lg md:rounded-xl"><Bot className="w-4 h-4 md:w-5 md:h-5" /></div>
                <h3 className="font-bold text-white text-sm md:text-base">دستیار مشاور خرید</h3>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="p-1.5 md:p-2 text-zinc-400 hover:text-white bg-zinc-800 rounded-full transition-colors"><X className="w-4 h-4" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-5 md:space-y-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-zinc-700">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex gap-3 md:gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  
                  {msg.role === 'user' ? (
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-linear-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shrink-0 mt-1 shadow-md">
                      <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                    </div>
                  ) : (
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0 mt-1 shadow-md">
                      <Bot className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                  )}

                  <div className="flex flex-col gap-2 max-w-[80%] md:max-w-[85%]">
                    {/* ✅ گوشه‌های تیز اصلاح شد */}
                    <div className={`p-3.5 md:p-4 rounded-2xl text-xs md:text-sm leading-6 md:leading-7 shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-rose-600 text-white rounded-tl-none' 
                        : 'bg-zinc-800 border border-zinc-700/50 text-zinc-200 rounded-tr-none'
                    }`}>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                    
                    {i === 0 && msg.role === 'ai' && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {['لامپ LED', 'هدفون بلوتوثی', 'دوربین مدار بسته'].map((suggestion) => (
                          <button 
                            key={suggestion}
                            onClick={() => sendChatMessage(suggestion)}
                            className="text-[10px] md:text-xs bg-zinc-800/80 hover:bg-rose-500/10 text-zinc-300 hover:text-rose-300 px-3 py-1.5 rounded-lg border border-zinc-700 hover:border-rose-500/30 transition-all"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}

                    {msg.shops && msg.shops.length > 0 && (
                      <div className="space-y-3 mt-2">
                        {msg.shops.map((shop: any, idx: number) => (
                          <div key={idx} className="bg-zinc-950 border border-rose-500/20 rounded-xl p-4 shadow-lg">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-bold text-rose-400 flex items-center gap-2 text-sm"><Store className="w-4 h-4" /> {shop.shopName}</p>
                              {shop.price && <span className="text-emerald-400 font-bold text-sm bg-emerald-500/10 px-2 py-1 rounded">{shop.price.toLocaleString()} تومان</span>}
                            </div>
                            <p className="text-xs text-zinc-400 flex items-start gap-1.5 leading-6"><MapPin className="w-3.5 h-3.5 mt-1 shrink-0" /> {shop.address}</p>
                            <div className="mt-3 pt-3 border-t border-zinc-800 flex justify-end gap-2">
                                <button onClick={() => { setCallModal({ name: shop.shopName, phone: shop.phone || 'نامشخص', product: 'محصول' }); setCallStatus('idle'); }} className="flex items-center gap-1.5 bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-lg text-xs hover:bg-zinc-700"><Phone className="w-3.5 h-3.5"/> تماس</button>
                                <button onClick={() => setMapModal({ name: shop.shopName, address: shop.address, lat: 35.6892, lon: 51.3890 })} className="flex items-center gap-1.5 bg-rose-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-rose-500"><Navigation className="w-3.5 h-3.5"/> مسیریابی</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isChatLoading && (
                <div className="flex gap-3 md:gap-4 flex-row">
                   <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0"><Bot className="w-4 h-4 md:w-5 md:h-5" /></div>
                   <div className="bg-zinc-800/80 p-3 md:p-4 rounded-2xl rounded-tr-none flex items-center gap-2 border border-zinc-700/50">
                     <span className="text-[11px] md:text-xs text-zinc-400">در حال پردازش</span>
                     <div className="flex gap-1">
                       <div className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce"></div>
                       <div className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                       <div className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                     </div>
                   </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-3 md:p-4 border-t border-zinc-800 bg-zinc-900/80 rounded-b-3xl">
              <form onSubmit={handleChatSubmit} className="flex gap-2 relative">
                <input 
                  type="text" 
                  value={chatInput} 
                  onChange={(e) => setChatInput(e.target.value)} 
                  placeholder="مثلاً: یک لامپ ۴۰۰ وات می‌خوام..." 
                  className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl pl-12 md:pl-14 pr-4 md:pr-5 py-3 md:py-4 text-xs md:text-sm text-white focus:outline-none focus:border-rose-500 transition-colors" 
                />
                <button 
                  type="submit" 
                  disabled={isChatLoading} 
                  className="absolute left-1.5 md:left-2 top-1.5 md:top-2 bottom-1.5 md:bottom-2 bg-rose-600 hover:bg-rose-500 text-white px-3 md:px-4 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4 md:w-5 md:h-5 transform rotate-228" />
                </button>
              </form>
            </div>
            
          </div>
        </div>
      )}
    </main>
  );
}