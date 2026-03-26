// src/screens/LandingPage.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
// 导入 Font Awesome 官方图标（安卓/苹果）
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAndroid, faApple } from '@fortawesome/free-brands-svg-icons';

import productImg from '../assets/login.png'; 
import '../i18n';

// 下载链接配置（替换为你的真实服务器域名）
const DOWNLOAD_LINKS = {
  android: 'https://jabobo.com/api/app/download?platform=android', // 安卓APK下载链接
  ios: 'itms-services://?action=download-manifest&url=https://jabobo.com/api/app/ios-plist' // iOS安装链接
};

const LandingPage: React.FC = () => {
  const { t, i18n } = useTranslation(); // 获取翻译函数和i18n实例

  // 切换语言的函数
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="font-sans">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen flex flex-col">
        <header className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img 
              src={productImg} 
              alt={`${t('landing.brand')} Logo`} 
              className="w-10 h-10 rounded-full object-cover"
            />
            <h1 className="text-2xl font-bold text-gray-900">{t('landing.brand')}</h1>
          </div>
          <div className="flex items-center space-x-8">
            <nav className="hidden md:block">
              <ul className="flex space-x-8 text-gray-600">
                <li>{t('landing.nav.product')}</li>
                <li>{t('landing.nav.safety')}</li>
                <li>{t('landing.nav.story')}</li>
                <li>{t('landing.nav.support')}</li>
              </ul>
            </nav>
            {/* 语言切换按钮 */}
            <div className="flex space-x-2">
              <button 
                onClick={() => changeLanguage('zh')}
                className={`px-3 py-1 rounded ${i18n.language === 'zh' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}
              >
                {t('language.zh')}
              </button>
              <button 
                onClick={() => changeLanguage('en')}
                className={`px-3 py-1 rounded ${i18n.language === 'en' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}
              >
                {t('language.en')}
              </button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 flex-grow flex flex-col md:flex-row items-center justify-between py-12">
          <div className="md:w-1/2 mb-12 md:mb-0">
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight">
              {t('landing.hero.title1')}
              <br />
              <span className="text-indigo-600">{t('landing.hero.titleHighlight')}</span>
            </h1>
            <p className="mt-6 text-lg text-gray-700 max-w-lg">
              {t('landing.hero.desc')}
            </p>
            
            {/* 核心：下载按钮区域（Font Awesome 官方安卓/苹果图标） */}
            <div className="mt-10 flex flex-wrap gap-4">
              {/* 安卓下载按钮（官方机器人图标） */}
              <a 
                href={DOWNLOAD_LINKS.android}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-md transition"
              >
                <FontAwesomeIcon icon={faAndroid} className="mr-2" size="lg" />
                {t('landing.download.android')}
              </a>
              
              {/* iOS下载按钮（官方苹果Logo图标） */}
              <a 
                href={DOWNLOAD_LINKS.ios}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center px-6 py-3 bg-gray-800 hover:bg-gray-900 text-white rounded-lg shadow-md transition"
              >
                <FontAwesomeIcon icon={faApple} className="mr-2" size="lg" />
                {t('landing.download.ios')}
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">{t('landing.hero.cert1')}</span>
              </div>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">{t('landing.hero.cert2')}</span>
              </div>
            </div>
          </div>
          <div className="md:w-2/5 flex justify-center">
            {/* 使用真实产品图 */}
            <div className="relative">
              <div className="w-64 h-64 md:w-80 md:h-80 bg-white rounded-3xl shadow-xl border-8 border-white overflow-hidden transform rotate-3">
                <img 
                  src={productImg} 
                  alt={`${t('landing.brand')} 智能机器人`} 
                  className="w-full h-full object-contain p-4"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{t('landing.features.title')}</h2>
            <p className="mt-4 text-gray-600">
              {t('landing.features.desc')}
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "🧠",
                titleKey: "landing.features.item1.title",
                descKey: "landing.features.item1.desc"
              },
              {
                icon: "📚",
                titleKey: "landing.features.item2.title",
                descKey: "landing.features.item2.desc"
              },
              {
                icon: "🔒",
                titleKey: "landing.features.item3.title",
                descKey: "landing.features.item3.desc"
              }
            ].map((item, i) => (
              <div key={i} className="bg-gray-50 p-6 rounded-2xl hover:shadow-md transition">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900">{t(item.titleKey)}</h3>
                <p className="mt-2 text-gray-600">{t(item.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-6 md:mb-0">
              <img 
                src={productImg} 
                alt={t('landing.brand')} 
                className="w-8 h-8 rounded-full object-cover"
              />
              <span className="text-xl font-bold">{t('landing.brand')}</span>
            </div>
            <div className="text-gray-400 text-sm">
              {t('landing.footer.copyright')}
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
            {t('landing.footer.privacyNote')}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;