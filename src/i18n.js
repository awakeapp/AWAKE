import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation files
import enCommon from './locales/en/common.json';
import arCommon from './locales/ar/common.json';
import mlCommon from './locales/ml/common.json';
import knCommon from './locales/kn/common.json';

i18n
  // detect user language
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  .init({
    resources: {
      en: { common: enCommon },
      ar: { common: arCommon },
      ml: { common: mlCommon },
      kn: { common: knCommon },
    },
    defaultNS: 'common',
    fallbackLng: 'en',
    supportedLngs: ['en', 'ar', 'ml', 'kn'],
    
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    }
  });

// Handle RTL and font syncing dynamically
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
});

// Immediately apply language attribute — read from localStorage directly because
// i18n.language may not yet be populated at module evaluation time.
(function () {
  try {
    const storedLng = window.localStorage.getItem('i18nextLng');
    const validLangs = ['en', 'ar', 'ml', 'kn'];
    // Strip subtag: 'ml-IN' → 'ml'
    const baseLng = storedLng ? storedLng.split('-')[0] : null;
    const lng = validLangs.includes(baseLng) ? baseLng : 'en';
    document.documentElement.lang = lng;
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
  } catch (e) {
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
  }
})();

export default i18n;
