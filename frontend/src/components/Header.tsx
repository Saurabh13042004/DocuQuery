import React from 'react';
import { motion } from 'framer-motion';

interface HeaderProps {
  fileName: string | null;
  onUploadClick: () => void;
  uploading: boolean;
}

const Header: React.FC<HeaderProps> = ({ fileName, onUploadClick, uploading }) => {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="flex flex-wrap gap-5 justify-between items-center px-4 sm:px-8 lg:px-14 py-3 sm:py-4 w-full bg-white shadow-[0px_-8px_25px_rgba(0,0,0,0.22)] fixed top-0 left-0 w-full z-10"
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="flex items-center gap-2 text-xl sm:text-2xl font-bold"
      >
        <span role="img" aria-label="Magnifying Glass">🔍</span>
        <span>DocuQuery</span>
      </motion.div>
      <nav className="flex flex-col sm:flex-row gap-4 sm:gap-10 items-center">
        {fileName && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 bg-gray-100 text-gray-800 px-3 py-1 rounded-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium truncate max-w-[120px] sm:max-w-none">
              {fileName}
            </span>
          </motion.div>
        )}

        {uploading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center text-gray-600"
          >
            <span>Uploading...</span>
            <svg className="animate-spin ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </motion.div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onUploadClick}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg font-semibold text-sm transition duration-300 hover:bg-gray-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            Upload PDF
          </motion.button>
        )}
      </nav>
    </motion.header>
  );
};

export default Header;

