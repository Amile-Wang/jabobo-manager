// src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'zh', 
    debug: true, // 开发阶段开启，方便排查加载问题（生产时改false）
    interpolation: {
      escapeValue: false, 
    },
    supportedLngs: ['zh', 'en'],
    detection: {
      order: ['path', 'cookie', 'localStorage', 'navigator'],
      caches: ['localStorage', 'cookie'],
    },
    // 关键补充：指定翻译文件加载路径（匹配public/locales目录）
    backend: {
      loadPath: '/jabobo/locales/{{lng}}/{{ns}}.json',
    },
    defaultNS: 'translation', // 默认命名空间（对应translation.json）
  });

export default i18n;