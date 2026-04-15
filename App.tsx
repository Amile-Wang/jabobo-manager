// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './screens/LandingPage';
import AppShell from './AppShell'; // 把你原来的 App 逻辑移到这里

const App: React.FC = () => {
  return (
    <Router basename="/jabobo">
      <Routes>
        {/* 纯宣传页 - 对外公开 */}
        <Route path="/" element={<LandingPage />} />

        {/* 应用入口 - 内部使用 */}
        <Route path="/app/*" element={<AppShell />} />

        {/* 其他路径也指向宣传页（可选） */}
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </Router>
  );
};

export default App;