import React from 'react';

export default function SimpleIDCard() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="relative w-64 h-96 bg-white rounded-xl shadow-2xl overflow-hidden transform hover:rotate-3 transition-transform duration-300" style={{ perspective: '1000px' }}>
        {/* ID Card with lanyard animation */}
        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 w-40 h-32 overflow-hidden animate-sway">
          {/* Lanyard */}
          <div className="w-8 h-full mx-auto bg-gradient-to-b from-blue-700 to-blue-600 rounded-md"></div>
        </div>

        {/* Card content */}
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-blue-700 text-white p-3 flex items-center justify-center">
            <div className="font-bold text-lg tracking-wider">VDart</div>
          </div>
          
          {/* Photo */}
          <div className="mt-6 mx-auto w-32 h-32 bg-gray-200 rounded-md flex items-center justify-center">
            <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
            </svg>
          </div>
          
          {/* Details */}
          <div className="mt-4 px-4 text-center">
            <h3 className="text-lg font-bold text-gray-800">John Doe</h3>
            <p className="text-sm text-blue-700 font-medium">Software Developer</p>
            <p className="mt-1 text-xs text-gray-600">ID: VD-2025-07</p>
          </div>
          
          {/* Barcode */}
          <div className="mt-auto mb-4 mx-auto w-4/5 h-10 bg-barcode bg-contain bg-no-repeat bg-center"></div>
        </div>
      </div>
    </div>
  );
}