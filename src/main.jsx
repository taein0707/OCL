import React from 'react'
import ReactDOM from 'react-dom/client'
// 🚨 기존 BrowserRouter를 HashRouter로 교체합니다.
import { HashRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
// ★ 경로를 프로젝트에 맞게 './styles/index.css'로 올바르게 수정했습니다!
import './styles/index.css'

// 예시용 더미 컴포넌트 (실제 프로젝트의 컴포넌트로 대체하세요)
// import Home from './pages/Home.jsx'
// import Login from './pages/Login.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 🔥 BrowserRouter 대신 HashRouter로 전체 앱을 감쌉니다. */}
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />} />
        {/* 아래와 같이 라우트들이 정의되어 있다면 그대로 유지하되 HashRouter 안에 두면 됩니다. */}
        {/* <Route path="/login" element={<Login />} /> */}
      </Routes>
    </HashRouter>
  </React.StrictMode>,
)