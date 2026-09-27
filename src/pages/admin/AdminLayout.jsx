import { Outlet, Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function AdminLayout() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { path: "/admin", label: "Tổng quan" },
    { path: "/admin/posts", label: "Bài đăng (Duyệt bài)" },
    { path: "/admin/items", label: "Quản lý đồ & Trạng thái" },
    { path: "/admin/inbox", label: "Tin nhắn (Inbox)" },
    { path: "/admin/stats", label: "Thống kê" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-gray-100 font-sans lg:flex-row">
      {/* Sidebar đỏ đặc trưng */}
      <aside className="flex w-full flex-none flex-col bg-[#7a1217] text-white shadow-md lg:w-64">
        <div className="flex items-center justify-between gap-3 border-b border-red-900 p-4 lg:p-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white text-red-800 rounded-full flex items-center justify-center font-bold">
              F
            </div>
            <span className="text-lg font-bold">FTU Admin L&F</span>
          </div>
          <button
            type="button"
            aria-label={isMobileMenuOpen ? "Đóng menu admin" : "Mở menu admin"}
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-white transition hover:bg-red-900 lg:hidden"
          >
            {isMobileMenuOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
        <nav
          className={`${isMobileMenuOpen ? "flex" : "hidden"} flex-col gap-1 p-3 lg:flex lg:flex-1 lg:space-y-1 lg:p-4`}
        >
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block shrink-0 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition ${isActive ? "bg-red-900 font-bold text-white shadow-inner" : "text-red-100 hover:bg-red-800/60"}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div
          className={`${isMobileMenuOpen ? "block" : "hidden"} border-t border-red-900 p-4 lg:block`}
        >
          <Link
            to="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block text-sm text-red-200 transition hover:text-white"
          >
            ← Về trang chủ website
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="min-w-0 flex-1 overflow-y-auto p-3 sm:p-5 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
