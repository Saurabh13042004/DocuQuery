import React from 'react';

interface HeaderProps {
  fileName: string | null;
  onUploadClick: () => void;
  uploading: boolean;  
}

const Header: React.FC<HeaderProps> = ({ fileName, onUploadClick, uploading }) => {
  return (
    <header className="flex flex-wrap gap-5 justify-between px-4 sm:px-8 lg:px-14 py-3 sm:py-5 w-full bg-white shadow-[0px_-8px_25px_rgba(0,0,0,0.22)] fixed top-0 left-0 w-full z-10">
      <img loading="lazy" src="https://cdn.builder.io/api/v1/image/assets/TEMP/e9f4676a157d13980ce5a926f6a5b17ead6f066e7dd73b7f52d9235c25cd4da3?placeholderIfAbsent=true&apiKey=c3b1bc105c9143f1b7f25c77e5c1b16e" alt="" className="object-contain shrink-0 max-w-full aspect-[2.56] w-[80px] sm:w-[105px]" />
      <nav className="flex flex-col sm:flex-row gap-4 sm:gap-10 items-center">
        {fileName && (
          <div className="md:flex md:gap-2.5 md:items-center hidden">
            <div className="flex overflow-hidden gap-2 items-start self-stretch p-2 bg-white rounded border border-solid border-green-600 border-opacity-40 w-[29px]">
              <img loading="lazy" src="https://cdn.builder.io/api/v1/image/assets/TEMP/bbe25d9c2fa8c0cec8abf89569453099967eedf71c70d0002730e2aa9ab8887d?placeholderIfAbsent=true&apiKey=c3b1bc105c9143f1b7f25c77e5c1b16e" alt="" className="object-contain aspect-[0.76] w-[13px]" />
            </div>
            <div className="md:pt-2 self-stretch text-sm font-medium leading-none text-green-600 whitespace-nowrap truncate max-w-[120px] sm:max-w-none">
              {fileName}
            </div>
          </div>
        )}
        
 
        {uploading ? (
          <div className="flex items-center">
            <span>Uploading...</span>
            <div className="ml-2 border-t-2 border-green-600 rounded-full w-6 h-6 animate-spin"></div> 
          </div>
        ) : (
          <button onClick={onUploadClick} className="flex relative justify-center text-sm font-semibold text-black w-full sm:w-auto">
            <div className="flex z-0 self-center max-w-full rounded-lg border border-black border-solid min-h-[39px] w-full sm:w-[180px] px-4 py-2">
              <div className="flex gap-3 items-center justify-center w-full">
                <img loading="lazy" src="https://cdn.builder.io/api/v1/image/assets/TEMP/def960fb18406bf2220c409cf706093a85769f3a9eb3ff7ec41b1badb54d3f10?placeholderIfAbsent=true&apiKey=c3b1bc105c9143f1b7f25c77e5c1b16e" alt="" className="object-contain shrink-0 self-stretch my-auto aspect-square w-[18px]" />
                <span>Upload PDF</span>
              </div>
            </div>
          </button>
        )}
      </nav>
    </header>
  );
};

export default Header;
