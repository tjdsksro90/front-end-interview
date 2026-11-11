import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App.jsx';
import './styles.css';

// StrictMode는 개발 모드에서 렌더를 두 번 실행해 데모의 "렌더 횟수" 카운터가 2배로 보이므로 쓰지 않는다.
// <ScrollRestoration />(Layout)은 데이터 라우터에서만 동작하므로 createBrowserRouter를 쓴다.
// 라우트 정의는 그대로 App의 <Routes>에 두고, 모든 주소를 App으로 보낸다.
const router = createBrowserRouter([{ path: '*', element: <App /> }]);

createRoot(document.getElementById('root')).render(<RouterProvider router={router} />);
