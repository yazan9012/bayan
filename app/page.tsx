'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const [handle, setHandle] = useState('');
  const [profileUrl, setProfileUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [categoryId, setCategoryId] = useState('');
  const [gender, setGender] = useState('رجل');
  const [bio, setBio] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [urlErrorMsg, setUrlErrorMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: catData, error: catError } = await supabase.from('categories').select('*');
    if (catError) console.error("خطأ في جلب التصنيفات:", catError.message);

    const { data: accData, error: accError } = await supabase.from('accounts').select('*').eq('status', 'approved');
    if (accError) console.error("خطأ في جلب الحسابات:", accError.message);
    
    if (catData) setCategories(catData);
    if (accData) setAccounts(accData);
    setLoading(false);
  }

  function handleHandleChange(val: string) {
    const clean = val.replace('@', '').trim();
    setHandle(val);
    if (clean) {
      setProfileUrl(`https://www.threads.net/@${clean}`);
    } else {
      setProfileUrl('');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUrlErrorMsg('');

    const cleanHandle = handle.replace('@', '').trim().toLowerCase();
    const cleanUrl = profileUrl.trim().toLowerCase();

    const expectedPattern = `/@${cleanHandle}`;
    if (!cleanUrl.includes(expectedPattern)) {
      setUrlErrorMsg(`خطأ: رابط ثريدز المدخل لا يتطابق مع اليوزر (@${cleanHandle}).`);
      return;
    }

    setSubmitting(true);

    let uploadedAvatarUrl = '';

    if (avatarFile) {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${cleanHandle}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
        uploadedAvatarUrl = publicUrlData.publicUrl;
      }
    }

    const { error } = await supabase.from('accounts').insert([
      {
        display_name: cleanHandle,
        handle: cleanHandle,
        profile_url: profileUrl.trim(),
        avatar_url: uploadedAvatarUrl || null,
        category_id: categoryId || null,
        gender: gender,
        bio: bio,
        status: 'pending'
      }
    ]);

    setSubmitting(false);
    if (!error) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setShowModal(false);
        setHandle('');
        setProfileUrl('');
        setAvatarFile(null);
        setBio('');
        setGender('رجل');
        setUrlErrorMsg('');
        fetchData();
      }, 2000);
    }
  }

  const filteredAccounts = accounts.filter(acc => {
    const matchesCat = selectedCat === 'all' || acc.category_id === selectedCat;
    const matchesGender = selectedGender === 'all' || acc.gender === selectedGender;
    return matchesCat && matchesGender;
  });

  return (
    <div className={`min-h-screen selection:bg-emerald-500/20 transition-colors duration-300 ${darkMode ? 'bg-[#0a0a0c] text-zinc-100' : 'bg-[#fcfcfd] text-zinc-900'}`} dir="rtl">
      
      {/* رأس الصفحة */}
      <header className={`sticky top-0 z-40 backdrop-blur-xl border-b transition-colors ${darkMode ? 'border-zinc-800/60 bg-[#0a0a0c]/80' : 'border-zinc-200/80 bg-white/80'}`}>
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-emerald-500">
              <rect width="32" height="32" rx="8" className="fill-emerald-500/10" />
              <path d="M10 21V11C10 9.89543 10.8954 9 12 9H18C20.2091 9 22 10.7909 22 13C22 14.3811 21.285 15.5925 20.211 16.29C21.564 17.02 22.5 18.47 22.5 20.12C22.5 22.54 20.54 24.5 18.12 24.5H11.5C10.6716 24.5 10 23.8284 10 23V21Z" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13.5 13.5H17.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M13.5 18.5H18.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <div>
              <span className="font-extrabold tracking-tight text-lg">بـيـان</span>
              <span className="text-[10px] block text-zinc-500 font-medium tracking-wider uppercase font-sans">دليل ثريدز</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2.5 rounded-xl border transition-all ${darkMode ? 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-600'}`}
              aria-label="تبديل المظهر"
            >
              {darkMode ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
              )}
            </button>
            
            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-emerald-600/25 transition-all active:scale-95"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg> 
              اقترح حساباً
            </button>
          </div>
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        
        <div className="mb-8 text-center sm:text-right flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b pb-8 border-zinc-800/40">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 mb-3 border border-emerald-500/20">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.2 1.2L3 12l5.8 1.9a2 2 0 0 1 1.2 1.2L12 21l1.9-5.8a2 2 0 0 1 1.2-1.2L21 12l-5.8-1.9a2 2 0 0 1-1.2-1.2Z"/></svg>
              دليل أصوات ونقاشات منصة ثريدز العربية
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">استكشف أفضل صناع المحتوى</h1>
            <p className="text-sm text-zinc-400 max-w-xl">مجموعة منتقاة بعناية من حسابات ثريدز المميزة في مختلف المجالات.</p>
          </div>

          {/* فلتر النوع (مع أيقونات الرجل والمرأة والكل) */}
          <div className={`flex items-center p-1 rounded-xl border ${darkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-100 border-zinc-200'}`}>
            <button
              onClick={() => setSelectedGender('all')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs rounded-lg font-medium transition-all ${selectedGender === 'all' ? 'bg-emerald-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/></svg>
              الكل
            </button>
            
            <button
              onClick={() => setSelectedGender('رجل')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs rounded-lg font-medium transition-all ${selectedGender === 'رجل' ? 'bg-emerald-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="14" r="5"/><path d="M19 5l-5.4 5.4"/><path d="M15 5h4v4"/></svg>
              رجل
            </button>

            <button
              onClick={() => setSelectedGender('امرأة')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs rounded-lg font-medium transition-all ${selectedGender === 'امرأة' ? 'bg-emerald-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'}`}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="9" r="5"/><path d="M12 14v7"/><path d="M9 18h6"/></svg>
              امرأة
            </button>
          </div>
        </div>

        {/* شريط التصنيفات */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          <button
            onClick={() => setSelectedCat('all')}
            className={`px-4 py-2 text-xs rounded-xl border transition-all whitespace-nowrap shrink-0 font-medium ${
              selectedCat === 'all' 
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20' 
                : darkMode ? 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700' : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
            }`}
          >
            كل التصنيفات
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id)}
              className={`px-4 py-2 text-xs rounded-xl border transition-all whitespace-nowrap shrink-0 font-medium ${
                selectedCat === cat.id 
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20' 
                  : darkMode ? 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700' : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* شبكة الحسابات */}
        {loading ? (
          <div className="text-sm text-zinc-500 py-24 text-center">جاري تحميل البيانات...</div>
        ) : filteredAccounts.length === 0 ? (
          <div className="text-sm text-zinc-500 py-20 text-center border border-dashed border-zinc-800 rounded-2xl">لا توجد حسابات مطابقة لهذا الاختيار حالياً.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAccounts.map(acc => (
              <div 
                key={acc.id} 
                className={`group p-5 rounded-2xl border flex flex-col justify-between transition-all duration-200 ${darkMode ? 'border-zinc-800/80 bg-zinc-900/30 hover:border-zinc-700' : 'border-zinc-200 bg-white'}`}
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    {acc.avatar_url ? (
                      <img src={acc.avatar_url} alt={acc.handle} className="w-11 h-11 rounded-full object-cover border border-zinc-700/50 shrink-0" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                        {acc.handle.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-lg truncate group-hover:text-emerald-400 transition-colors" dir="ltr">@{acc.handle}</h3>
                        {/* أيقونة صنف الحساب (رجل/امرأة) بجانب اليوزر */}
                        {acc.gender === 'رجل' ? (
                          <svg className="text-zinc-500 shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="14" r="5"/><path d="M19 5l-5.4 5.4"/><path d="M15 5h4v4"/></svg>
                        ) : (
                          <svg className="text-zinc-500 shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="9" r="5"/><path d="M12 14v7"/><path d="M9 18h6"/></svg>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 truncate">حساب موثق في ثريدز</p>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-400 line-clamp-3 mb-6 leading-relaxed">
                    {acc.bio || 'لا يوجد نبذة تعريفية.'}
                  </p>
                </div>
                
                <a 
                  href={acc.profile_url} 
                  target="_blank" 
                  rel="noreferrer"
                  className={`flex items-center justify-center gap-1.5 text-xs py-2.5 rounded-xl border transition-all font-medium ${darkMode ? 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-emerald-500/50 hover:text-emerald-400' : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-emerald-500'}`}
                >
                  زيارة الحساب (تطبيق / ويب) 
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                </a>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* نافذة الاقتراح */}
      {showModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar ${darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'}`}>
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-xl font-bold">اقتراح حساب جديد</h2>
              <button 
                onClick={() => { setShowModal(false); setUrlErrorMsg(''); }}
                className="text-zinc-400 hover:text-white p-1"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <p className="text-xs text-zinc-400 mb-6">اكتب اليوزر وسيتم توليد رابط التوجيه المباشر للتطبيق تلقائياً.</p>
            
            {success ? (
              <div className="flex flex-col items-center justify-center gap-2 text-emerald-500 text-sm py-8 text-center">
                <span className="font-bold text-base">تم إرسال الاقتراح بنجاح!</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {urlErrorMsg && (
                  <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">
                    {urlErrorMsg}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">اسم المستخدم (اليوزر الشخصي)</label>
                  <input 
                    type="text" 
                    required
                    value={handle}
                    onChange={e => handleHandleChange(e.target.value)}
                    className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500 transition font-sans ${darkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200 text-black'}`}
                    placeholder="rn3vs"
                    dir="ltr"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-medium text-zinc-400">رابط ثريدز (توليد تلقائي للتطبيق)</label>
                    <span className="text-[10px] text-emerald-400">دعم Android & iOS</span>
                  </div>
                  <input 
                    type="url" 
                    required
                    value={profileUrl}
                    onChange={e => setProfileUrl(e.target.value)}
                    className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500 transition font-sans ${darkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200 text-black'}`}
                    placeholder="https://www.threads.net/@rn3vs"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">صورة البروفايل (PNG / JPEG)</label>
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg"
                    onChange={e => setAvatarFile(e.target.files ? e.target.files[0] : null)}
                    className={`w-full text-xs border rounded-xl px-3.5 py-2 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-500/10 file:text-emerald-400 cursor-pointer ${darkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-400' : 'bg-zinc-50 border-zinc-200 text-zinc-600'}`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">نبذة تعريفية</label>
                  <textarea 
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    rows={2}
                    className={`w-full border rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-emerald-500 transition resize-none ${darkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200 text-black'}`}
                    placeholder="اكتب نبذة مختصرة..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">التصنيف</label>
                    <select 
                      value={categoryId}
                      onChange={e => setCategoryId(e.target.value)}
                      className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 transition ${darkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200 text-black'}`}
                    >
                      <option value="">اختر...</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">النوع</label>
                    <select 
                      value={gender}
                      onChange={e => setGender(e.target.value)}
                      className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 transition ${darkMode ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200 text-black'}`}
                    >
                      <option value="رجل">رجل</option>
                      <option value="امرأة">امرأة</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-zinc-800/40">
                  <button 
                    type="button" 
                    onClick={() => { setShowModal(false); setUrlErrorMsg(''); }}
                    className={`px-4 py-2.5 text-xs border rounded-xl transition ${darkMode ? 'border-zinc-800 text-zinc-300' : 'border-zinc-200 text-zinc-700'}`}
                  >
                    إلغاء
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="px-5 py-2.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition font-semibold shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                  >
                    {submitting ? 'جاري الإرسال...' : 'إرسال الاقتراح'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}