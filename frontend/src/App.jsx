import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';

import LandingPage from './pages/LandingPage';

import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Settings from './pages/Settings';

import Portfolio from './pages/Portfolio';
import Recommendations from './pages/Recommendations';
import CreateCourse from './pages/CreateCourse';
import ManageCourses from './pages/ManageCourses';
import StudentList from './pages/StudentList';
import Projects from './pages/Projects';

import LearningPlan from './pages/LearningPlan';

import ResumeReview from './pages/ResumeReview';
import StudentCourses from './pages/StudentCourses';
import MentorChat from './pages/MentorChat';
import AiResources from './pages/AiResources';
import Notifications from './pages/Notifications';
import ProtectedRoute from './components/ProtectedRoute';
import { ThemeProvider } from './context/ThemeContext';

// Layout component for authenticated/dashboard pages
const DashboardLayout = ({ children }) => (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">
    <Sidebar />
    <main className="">
      <Header />
      <div className="ml-64 p-8 pt-24 max-w-[1920px] mx-auto">
        <PageTransition>
          {children}
        </PageTransition>
      </div>
    </main>
  </div>
);

// Reusable Page Transition Wrapper
const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          } />
          <Route path="/settings" element={
            <DashboardLayout>
              <Settings />
            </DashboardLayout>
          } />
          <Route path="/portfolio" element={
            <DashboardLayout>
              <Portfolio />
            </DashboardLayout>
          } />
          <Route path="/recommendations" element={
            <DashboardLayout>
              <Recommendations />
            </DashboardLayout>
          } />
          <Route path="/courses/create" element={
            <DashboardLayout>
              <CreateCourse />
            </DashboardLayout>
          } />
          <Route path="/courses/manage" element={
            <DashboardLayout>
              <ManageCourses />
            </DashboardLayout>
          } />
          <Route path="/students" element={
            <DashboardLayout>
              <StudentList />
            </DashboardLayout>
          } />
          <Route path="/projects" element={
            <DashboardLayout>
              <Projects />
            </DashboardLayout>
          } />

          <Route path="/learning-plan" element={
            <DashboardLayout>
              <LearningPlan />
            </DashboardLayout>
          } />

          <Route path="/courses" element={
            <DashboardLayout>
              <StudentCourses />
            </DashboardLayout>
          } />
          <Route path="/resume-review" element={
            <DashboardLayout>
              <ResumeReview />
            </DashboardLayout>
          } />
          <Route path="/mentor-chat" element={
            <DashboardLayout>
              <MentorChat />
            </DashboardLayout>
          } />
          <Route path="/ai-resources" element={
            <DashboardLayout>
              <AiResources />
            </DashboardLayout>
          } />
          <Route path="/notifications" element={
            <DashboardLayout>
              <Notifications />
            </DashboardLayout>
          } />
        </Route>
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AnimatedRoutes />
      </Router>
    </ThemeProvider>
  );
}

export default App;