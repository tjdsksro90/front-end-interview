import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { questions } from './data/questions.js';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import CategoryPage from './pages/CategoryPage.jsx';
import QuestionPage from './pages/QuestionPage.jsx';
import DeepPage from './pages/DeepPage.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        {['project', 'project/:slug', 'project/:slug/deep/:deepSlug'].map((path) => (
          <Route key={path} path={path} element={<ProjectRedirect />} />
        ))}
        <Route path=":categoryId" element={<CategoryPage />} />
        <Route path=":categoryId/:slug" element={<QuestionPage />} />
        <Route path=":categoryId/:slug/deep/:deepSlug" element={<DeepPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

// 프로젝트 카테고리는 없어지고 질문들이 Web·JavaScript·React·CSS로 옮겨졌다. 예전 주소(/project/...)로 오면 새 위치로 보낸다.
function ProjectRedirect() {
  const { slug, deepSlug } = useParams();
  const moved = slug && questions.find((q) => q.slug === slug);
  if (!moved) return <Navigate to="/" replace />;
  return <Navigate to={`/${moved.categoryId}/${slug}${deepSlug ? `/deep/${deepSlug}` : ''}`} replace />;
}
