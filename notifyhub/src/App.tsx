import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const SendNotification = lazy(() => import('./pages/SendNotification'));
const Templates = lazy(() => import('./pages/Templates'));
const TemplateCreate = lazy(() => import('./pages/TemplateCreate'));
const TemplateEdit = lazy(() => import('./pages/TemplateEdit'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Settings = lazy(() => import('./pages/Settings'));
const QueueManager = lazy(() => import('./pages/QueueManager'));
import Layout from './components/Layout';

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="flex h-screen items-center justify-center text-slate-500 font-medium">Loading app...</div>}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Redirect root to login for now */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          <Route element={<Layout />}>
            {/* Dashboard Route */}
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Send Notification Route */}
            <Route path="/send" element={<SendNotification />} />
            
            {/* Templates Route */}
            <Route path="/templates" element={<Templates />} />
            
            {/* Create Template Route */}
            <Route path="/templates/create" element={<TemplateCreate />} />
            
            {/* Edit Template Route */}
            <Route path="/templates/edit/:id" element={<TemplateEdit />} />
            
            {/* Analytics Route */}
            <Route path="/analytics" element={<Analytics />} />
            
            {/* Settings Route */}
            <Route path="/settings" element={<Settings />} />
            
            {/* Queue Manager Route */}
            <Route path="/queue" element={<QueueManager />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
