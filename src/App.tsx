import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import NewPlanPage from './pages/NewPlanPage';
import PlanDetailPage from './pages/PlanDetailPage';
import LearningPage from './pages/LearningPage';
import FreeLearningPage from './pages/FreeLearningPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/new-plan" element={<NewPlanPage />} />
          <Route path="/plan/:planId" element={<PlanDetailPage />} />
          <Route path="/learn/:planId" element={<LearningPage />} />
          <Route path="/free" element={<FreeLearningPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
