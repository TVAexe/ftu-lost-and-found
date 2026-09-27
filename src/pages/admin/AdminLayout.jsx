import { Outlet, Link, useLocation } from 'react-router-dom';

export default function AdminLayout() {
  const location = useLocation();
  
  const menuItems = [
    { path: '/admin', label: 'Tổng quan' },
    { path: '/admin/posts', label: 'Bài đăng (Duyệt bài)' },
    { path: '/admin/items', label: 'Quản lý đồ & Trạng thái' },
    { path: '/admin/inbox', label: 'Tin nhắn (Inbox)' },
    { path: '/admin/stats', label: 'Thống kê' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
      {/* Sidebar đỏ đặc trưng */}
      <aside className="w-64 bg-[#7a1217] text-white flex flex-col shadow-md">
        <div className="p-5 border-b border-red-900 flex items-center gap-3">
          <div className="w-8 h-8 bg-white text-red-800 rounded-full flex items-center justify-center font-bold">F</div>
          <span className="font-bold text-lg">FTU Admin L&F</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition ${isActive ? 'bg-red-900 text-white font-bold shadow-inner' : 'text-red-100 hover:bg-red-800/60'}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-red-900">
          <Link to="/" className="block text-sm text-red-200 hover:text-white transition">← Về trang chủ website</Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}