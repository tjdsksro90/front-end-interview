import { Routes, Route } from 'react-router-dom';
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
        <Route path=":categoryId" element={<CategoryPage />} />
        <Route path=":categoryId/:slug" element={<QuestionPage />} />
        <Route path=":categoryId/:slug/deep/:deepSlug" element={<DeepPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
