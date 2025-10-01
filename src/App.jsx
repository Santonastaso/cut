import React from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import SideNav from './components/layout/SideNav';
import Header from './components/layout/Header';
import LoadingOverlay from './components/layout/LoadingOverlay';
import HomePage from './pages/HomePage';
import MaterialsListPage from './pages/MaterialsListPage';
import MaterialsFormPage from './pages/MaterialsFormPage';
import StockListPage from './pages/StockListPage';
import StockFormPage from './pages/StockFormPage';
import RequestsListPage from './pages/RequestsListPage';
import RequestsFormPage from './pages/RequestsFormPage';
import OptimizationPage from './pages/OptimizationPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProtectedRoute from './auth/ProtectedRoute';
import { useOptimizationStore } from './store';
import { useSupabaseSync } from './hooks/useSupabaseSync';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// This component creates the main layout with the sidebar
const AppLayout = () => {
  const { optimizationResult, isLoading, loadingMessage, setOptimizationResult } = useOptimizationStore();
  
  // Sync Supabase data with Zustand stores
  const { isLoading: isSyncing } = useSupabaseSync();

  const handleSave = () => {
    if (!optimizationResult) return;
    
    // Create data object with all current state
    const data = {
      optimizationResult,
      timestamp: new Date().toISOString()
    };
    
    // Convert to JSON and create blob
    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OptiCUT-Piano-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = async () => {
    if (confirm('Vuoi davvero eliminare tutti i dati?')) {
      try {
        await setOptimizationResult(null);
      } catch (error) {
        console.error('Error resetting data:', error);
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <SideNav />
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          onSave={handleSave}
          onReset={handleReset}
          hasResults={!!optimizationResult}
        />
        <main className="flex-1 overflow-auto pt-0 min-w-0">
          <Outlet />
        </main>
      </div>
      <LoadingOverlay 
        isLoading={isLoading || isSyncing}
        message={isSyncing ? "Sincronizzazione dati..." : "Calcolo in corso..."}
        details={isSyncing ? "Caricamento dati da Supabase" : loadingMessage}
      />
      <Toaster 
        position="top-right"
        richColors
        closeButton
        duration={4000}
      />
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        {/* Public authentication routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        
        {/* Protected application routes */}
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<HomePage />} />
          <Route path="materials/list" element={<MaterialsListPage />} />
          <Route path="materials/new" element={<MaterialsFormPage />} />
          <Route path="materials/edit/:id" element={<MaterialsFormPage />} />
          <Route path="stock/list" element={<StockListPage />} />
          <Route path="stock/new" element={<StockFormPage />} />
          <Route path="stock/edit/:id" element={<StockFormPage />} />
          <Route path="requests/list" element={<RequestsListPage />} />
          <Route path="requests/new" element={<RequestsFormPage />} />
          <Route path="requests/edit/:id" element={<RequestsFormPage />} />
          <Route path="optimization" element={<OptimizationPage />} />
        </Route>
      </Routes>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;

