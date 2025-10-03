import React from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
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
import { useAuth } from './auth/AuthContext';

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
  const { user } = useAuth();
  
  // Sync Supabase data with Zustand stores
  const { isLoading: isSyncing } = useSupabaseSync();

  const handleSave = async () => {
    if (!optimizationResult) return;
    
    try {
      // Import jsPDF dynamically
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      
      // Create new PDF document
      const doc = new jsPDF();
      
      // Add logo (top left)
      try {
        // Try to load the PNG logo as base64 with correct base path
        const logoResponse = await fetch('/cut/logo.png');
        const logoBlob = await logoResponse.blob();
        const logoBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(logoBlob);
        });
        
        doc.addImage(logoBase64, 'PNG', 14, 8, 35, 16);
      } catch (error) {
        console.log('Logo not found, continuing without it');
      }
      
      // Add title
      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text('Piano di Taglio', 14, 35);
      
      // Add intro line
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text('Processo di ottimizzazione del taglio materiali con minimizzazione degli sfridi', 14, 45);
      
      // Add intro details
      const now = new Date();
      const randomNumber = Math.floor(Math.random() * 9000) + 1000; // 4-digit random number
      const operator = user?.email || user?.user_metadata?.name || 'Operatore Sistema';
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Timestamp: ${now.toISOString()}`, 14, 55);
      doc.text(`Numero Processo: ${randomNumber}`, 14, 62);
      doc.text(`Operatore: ${operator}`, 14, 69);
      
      // Get used bobinas data
      const usedBobinas = [];
      const usedBobinaCodes = new Set();
      
      optimizationResult.cuttingPlans.forEach((materialPlan) => {
        materialPlan.patterns.forEach((pattern) => {
          if (!usedBobinaCodes.has(pattern.roll.code)) {
            usedBobinaCodes.add(pattern.roll.code);
            usedBobinas.push({
              code: pattern.roll.code,
              material: pattern.roll.material,
              width: pattern.roll.width,
              length: pattern.roll.length,
              weight: pattern.roll.weight || 'N/A',
              batch: pattern.roll.batch || 'N/A'
            });
          }
        });
      });
      
      // Add used bobinas table
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Bobine Utilizzate', 14, 80);
      
      const bobinasTableData = usedBobinas.map(bobina => [
        bobina.code,
        bobina.material,
        `${bobina.width}mm`,
        `${bobina.length}m`,
        bobina.weight,
        bobina.batch
      ]);
      
      autoTable(doc, {
        head: [['Codice', 'Materiale', 'Larghezza', 'Lunghezza', 'Peso', 'Lotto']],
        body: bobinasTableData,
        startY: 90,
        styles: {
          fontSize: 9,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [59, 130, 246], // blue-500
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251], // gray-50
        },
        columnStyles: {
          0: { cellWidth: 25 }, // Codice
          1: { cellWidth: 30 }, // Materiale
          2: { cellWidth: 25 }, // Larghezza
          3: { cellWidth: 25 }, // Lunghezza
          4: { cellWidth: 20 }, // Peso
          5: { cellWidth: 25 }, // Lotto
        },
      });
      
      // Get final Y position after bobinas table
      const finalY = doc.lastAutoTable.finalY + 10;
      
      // Add outputs table
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Risultati del Taglio', 14, finalY);
      
      // Prepare outputs table data
      const outputsTableData = [];
      optimizationResult.cuttingPlans.forEach((materialPlan) => {
        materialPlan.patterns.forEach((pattern, index) => {
          // Add cut pieces as "Product"
          pattern.cuts.forEach((cut, cutIndex) => {
            outputsTableData.push([
              pattern.roll.code,
              materialPlan.material,
              'Product',
              `${cut.request.orderNumber} - ${cut.width}mm × ${cut.length}m`
            ]);
          });
          
          // Add remaining pieces as "Back to Storage"
          pattern.remainingPieces.forEach((piece, pieceIndex) => {
            outputsTableData.push([
              pattern.roll.code,
              materialPlan.material,
              'Back to Storage',
              `${piece.width}mm × ${piece.length}m`
            ]);
          });
        });
      });
      
      autoTable(doc, {
        head: [['Bobina', 'Materiale', 'Tipo', 'Pezzo']],
        body: outputsTableData,
        startY: finalY + 10,
        styles: {
          fontSize: 9,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [34, 197, 94], // green-500
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251], // gray-50
        },
        columnStyles: {
          0: { cellWidth: 25 }, // Bobina
          1: { cellWidth: 30 }, // Materiale
          2: { cellWidth: 30 }, // Tipo
          3: { cellWidth: 85 }, // Pezzo
        },
      });
      
      // Add cuts visualization
      const visualY = doc.lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Visualizzazione Tagli', 14, visualY);
      
      let currentVisualY = visualY + 10;
      
      optimizationResult.cuttingPlans.forEach((materialPlan, materialIndex) => {
        // Add material header
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(`Materiale: ${materialPlan.material}`, 14, currentVisualY);
        currentVisualY += 8;
        
        materialPlan.patterns.forEach((pattern, patternIndex) => {
          // Add roll header
          doc.setFontSize(10);
          doc.setFont(undefined, 'normal');
          doc.text(`Bobina: ${pattern.roll.code} (${pattern.roll.width}mm × ${pattern.roll.length}m)`, 14, currentVisualY);
          currentVisualY += 6;
          
          // Draw roll outline
          const rollWidth = 120; // Fixed width for visualization
          const rollHeight = 40; // Fixed height for visualization
          const startX = 14;
          const startY = currentVisualY;
          
          // Roll border
          doc.setDrawColor(100, 100, 100);
          doc.setLineWidth(0.5);
          doc.rect(startX, startY, rollWidth, rollHeight);
          
          // Roll background
          doc.setFillColor(240, 240, 240);
          doc.rect(startX, startY, rollWidth, rollHeight, 'F');
          
          // Draw cuts
          if (pattern.cuts.length > 0) {
            const scale = rollWidth / pattern.roll.width;
            
            pattern.cuts.forEach((cut, cutIndex) => {
              const cutWidth = cut.width * scale;
              const cutHeight = (cut.length / pattern.roll.length) * rollHeight;
              const cutX = startX + (cut.position?.x || 0) * scale;
              const cutY = startY + (cut.position?.y || 0) * (rollHeight / pattern.roll.length);
              
              // Cut rectangle
              doc.setFillColor(173, 216, 230); // Light blue
              doc.setDrawColor(0, 0, 255); // Blue border
              doc.rect(cutX, cutY, cutWidth, cutHeight, 'FD');
              
              // Cut label
              doc.setFontSize(6);
              doc.setFont(undefined, 'bold');
              doc.setTextColor(0, 0, 0);
              const textX = cutX + cutWidth / 2;
              const textY = cutY + cutHeight / 2;
              doc.text(cut.request.orderNumber, textX, textY, { align: 'center' });
            });
          }
          
          currentVisualY += rollHeight + 10;
          
          // Check if we need a new page
          if (currentVisualY > 250) {
            doc.addPage();
            currentVisualY = 20;
          }
        });
      });
      
      // Add footer with date
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      doc.text(`Generato il: ${new Date().toLocaleDateString('it-IT')} alle ${new Date().toLocaleTimeString('it-IT')}`, 14, pageHeight - 10);
      
      // Save the PDF
      const fileName = `Piano-Taglio-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Errore durante la generazione del PDF');
    }
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

