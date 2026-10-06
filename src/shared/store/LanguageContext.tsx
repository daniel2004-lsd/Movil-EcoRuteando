// src/shared/store/LanguageContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from '../../i18n/translations';
type LangCode = 'es' | 'en' | 'fr' | 'pt';
const messages = translations;

type LanguageContextType = {
  lang: LangCode;
  setLang: (code: LangCode) => void;
  t: (path: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LangCode>('es');

  useEffect(() => {
    AsyncStorage.getItem('eco_lang').then(stored => {
      if(
  stored === 'es' ||
  stored === 'en' ||
  stored === 'fr' ||
  stored === 'pt'
)  {
        setLangState(stored);
      }
    });
  }, []);

  const setLang = (code: LangCode) => {
    setLangState(code);
    AsyncStorage.setItem('eco_lang', code).catch(() => {});
  };

  const t = (path: string) => {
    const getFrom = (code: LangCode) => {
      const parts = path.split('.');
      let current: any = messages[code];
      for (const p of parts) {
        current = current?.[p];
        if (current == null) return undefined;
      }
      return typeof current === 'string' ? current : undefined;
    };

    const fromCurrent = getFrom(lang);
    if (fromCurrent) return fromCurrent;

    const fromEs = getFrom('es');
    if (fromEs) return fromEs;

    return path;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
}