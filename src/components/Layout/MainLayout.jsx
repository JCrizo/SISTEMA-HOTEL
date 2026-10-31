import { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function MainLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-gray-800">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="flex-1 flex flex-col lg:ml-64 min-w-0 transition-all duration-300">
        <TopBar setMobileOpen={setMobileOpen} />

        {/* Main Content Area */}
        <main className="flex-1 p-3 sm:p-6 md:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
