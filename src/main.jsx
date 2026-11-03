import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles.css';

// StrictMode는 개발 모드에서 렌더를 두 번 실행해 데모의 "렌더 횟수" 카운터가 2배로 보이므로 쓰지 않는다.
createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
