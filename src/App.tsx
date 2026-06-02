import { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { DashboardView } from './components/DashboardView';
import { CRMView } from './components/CRMView';
import { OperationsView } from './components/OperationsView';
import { AttendanceView } from './components/AttendanceView';
import { ApprovalHierarchyView } from './components/ApprovalHierarchyView';
import { DocumentsView } from './components/DocumentsView';
import { VerificationPortalView } from './components/VerificationPortalView';
import { BackofficeView } from './components/BackofficeView';

function AppContent() {
  const { currentUser } = useApp();
  const [currentView, setCurrentView] = useState<string>('dashboard');

  // Detect token params in URL to redirect straight to the Verification Portal
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('token') || params.get('verify') || window.location.pathname.startsWith('/verify')) {
      setCurrentView('verification');
    }
  }, []);

  // Simple router based on selected view
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'crm':
        return <CRMView />;
      case 'operations':
        return <OperationsView />;
      case 'attendance':
        return <AttendanceView />;
      case 'documents':
        return <DocumentsView />;
      case 'backoffice':
        return <BackofficeView />;
      case 'verification':
        return <VerificationPortalView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <Layout currentView={currentView} onViewChange={setCurrentView}>
      {renderView()}
    </Layout>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
