import { useLang } from '@/context/LanguageContext';

const RuFlag = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 rounded-sm overflow-hidden shrink-0" aria-hidden="true">
    <rect width="24" height="8" y="0" fill="#fff" />
    <rect width="24" height="8" y="8" fill="#0039A6" />
    <rect width="24" height="8" y="16" fill="#D52B1E" />
  </svg>
);

const EnFlag = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 rounded-sm overflow-hidden shrink-0" aria-hidden="true">
    <rect width="24" height="24" fill="#012169" />
    <path d="M0 0L24 24M24 0L0 24" stroke="#fff" strokeWidth="4" />
    <path d="M0 0L24 24M24 0L0 24" stroke="#C8102E" strokeWidth="2" />
    <path d="M12 0V24M0 12H24" stroke="#fff" strokeWidth="6" />
    <path d="M12 0V24M0 12H24" stroke="#C8102E" strokeWidth="3" />
  </svg>
);

export default function LangSwitcher() {
  const { lang, toggleLang } = useLang();

  return (
    <button
      onClick={toggleLang}
      className="flex items-center gap-1.5 p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
      aria-label={lang === 'ru' ? 'Switch to English' : 'Переключить на русский'}
      title={lang === 'ru' ? 'English' : 'Русский'}
    >
      {lang === 'ru' ? <RuFlag /> : <EnFlag />}
      <span className="text-xs font-semibold uppercase dark:text-neutral-300 hidden sm:inline">
        {lang === 'ru' ? 'RU' : 'EN'}
      </span>
    </button>
  );
}
