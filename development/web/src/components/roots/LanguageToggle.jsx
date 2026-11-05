import { Globe } from 'lucide-react';
import { useRootsI18n } from '../../lib/roots-i18n';
import { LANGUAGES } from '../../lib/roots-translations';

export default function LanguageToggle() {
  const { lang, setLang, t } = useRootsI18n();

  return (
    <div className="flex items-center gap-1">
      <button
        title={t('selectLanguage')}
        className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-700"
        onClick={() => document.getElementById('lang-menu')?.classList.toggle('hidden')}
      >
        <Globe size={20} />
      </button>
      <div
        id="lang-menu"
        className="hidden absolute top-14 right-4 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50"
      >
        {Object.entries(LANGUAGES).map(([code, label]) => (
          <button
            key={code}
            onClick={() => {
              setLang(code);
              document.getElementById('lang-menu')?.classList.add('hidden');
            }}
            className={`block w-full px-4 py-2 text-left text-sm transition ${
              lang === code ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
