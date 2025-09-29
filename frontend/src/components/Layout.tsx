import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import UploadModal from './UploadModal';

const Layout: React.FC = () => {
  const [showUploadModal, setShowUploadModal] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar onUploadClick={() => setShowUploadModal(true)} />
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
      
      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal onClose={() => setShowUploadModal(false)} />
      )}
    </div>
  );
};

export default Layout;