import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import MyPage from './pages/main/MyPage'
// 혹시 로그인 페이지나 다른 페이지 컴포넌트가 더 있다면 아래처럼 가져오시면 됩니다.
// import Login from './pages/auth/Login' 

function App() {
  return (
    <Routes>
      {/* 1. 기본 주소(/)로 들어오면 메인 레이아웃 안의 마이페이지로 연결 */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<MyPage />} />
        {/* 추가적인 메인 탭 페이지들(홈, 피드 등)이 있다면 여기에 <Route path="home" element={<Home />} /> 형태로 추가 */}
      </Route>

      {/* 2. 잘못된 주소로 접근하면 홈(/)으로 튕겨내기 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// 🚨 챗GPT 피셜 핵심 에러 방지: 무조건 default로 내보내기!
export default App