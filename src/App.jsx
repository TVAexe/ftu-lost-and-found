import {
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { supabase } from "./config/supabaseClient";
import CreateItem from "./pages/CreateItem";
import Home from "./pages/Home";
import ItemDetail from "./pages/ItemDetail";
import Login from "./pages/Login";
import Search from "./pages/Search";
import MyPosts from "./pages/MyPosts";
import Inbox from "./pages/Inbox";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminPosts from "./pages/admin/AdminPost";
import AdminItems from "./pages/admin/AdminItem";
import AdminInbox from "./pages/admin/AdminInbox";
import AdminStats from "./pages/admin/AdminStat";
import AccessDenied from "./pages/AccessDenied";

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isAdminRoute = location.pathname.startsWith("/admin");

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const loadAdminStatus = async (nextSession) => {
    if (!nextSession?.user) {
      setIsAdmin(false);
      return;
    }

    const userRole =
      nextSession.user.app_metadata?.role ||
      nextSession.user.user_metadata?.role;

    if (userRole === "admin") {
      setIsAdmin(true);
      return;
    }

    const { data } = await supabase
      .from("users")
      .select("role")
      .eq("email", nextSession.user.email)
      .maybeSingle();

    setIsAdmin(data?.role === "admin");
  };

  // Lắng nghe trạng thái đăng nhập
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      loadAdminStatus(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      loadAdminStatus(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const displayName =
    session?.user?.user_metadata?.full_name ||
    session?.user?.user_metadata?.name ||
    session?.user?.email?.split("@")[0];

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f8fa] font-sans text-slate-800">
      {/* Header */}
      {!isAdminRoute && (
        <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur">
          <div className="mx-auto flex h-[4.5rem] max-w-6xl items-center justify-between gap-2 px-4">
            {/* Logo */}
            <Link to="/" className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#8f171d] shadow-sm">
                <img
                  src="/FTU-logo.png"
                  alt="FTU Lost & Found"
                  className="h-full w-full object-contain"
                />
              </div>
              <span className="truncate text-base font-bold tracking-tight text-[#8f171d] sm:text-lg">
                FTU Lost & Found
              </span>
            </Link>

            {/* Navigation */}
            <div className="hidden items-center gap-1 sm:flex sm:gap-2">
              <Link
                to="/"
                className={`hidden whitespace-nowrap rounded-lg  py-2 text-sm font-semibold transition sm:block ${location.pathname === "/" ? "bg-red-50 text-[#8f171d]" : "text-slate-600 hover:bg-slate-50 hover:text-[#8f171d]"}`}
              >
                Trang chủ
              </Link>
              <Link
                to="/tim-kiem"
                className={`hidden whitespace-nowrap rounded-lg px-2 py-2 text-sm font-semibold transition sm:block ${location.pathname === "/tim-kiem" ? "bg-red-50 text-[#8f171d]" : "text-slate-600 hover:bg-slate-50 hover:text-[#8f171d]"}`}
              >
                Tìm kiếm
              </Link>
              <Link
                to="/bai-dang-cua-toi"
                className={`hidden whitespace-nowrap rounded-lg px-2 py-2 text-sm font-semibold transition lg:block ${location.pathname === "/bai-dang-cua-toi" ? "bg-red-50 text-[#8f171d]" : "text-slate-600 hover:bg-slate-50 hover:text-[#8f171d]"}`}
              >
                Bài đăng của tôi
              </Link>
              <Link
                to="/inbox"
                className={`hidden whitespace-nowrap rounded-lg px-2 py-2 text-sm font-semibold transition sm:block ${location.pathname === "/inbox" ? "bg-red-50 text-[#8f171d]" : "text-slate-600 hover:bg-slate-50 hover:text-[#8f171d]"}`}
              >
                Tin nhắn
              </Link>

              {/* Nút Đăng tin (Chỉ nổi bật) */}
              <Link
                to="/dang-tin"
                className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg bg-[#8f171d] px-2 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#741219] sm:px-4"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4v16m8-8H4"
                  ></path>
                </svg>
                Đăng tin
              </Link>

              {isAdmin && (
                <Link
                  to="/admin"
                  className="hidden shrink-0 whitespace-nowrap rounded-lg border border-[#8f171d] px-2 py-2 text-sm font-bold text-[#8f171d] transition hover:bg-red-50 sm:block"
                >
                  Trang quản trị viên
                </Link>
              )}

              {/* Logic hiển thị nút Đăng nhập / Đăng xuất */}
              {session ? (
                <div className="ml-1 flex shrink-0 items-center gap-3 whitespace-nowrap border-l border-slate-200 pl-3 sm:ml-2 sm:pl-4">
                  <span
                    className="hidden max-w-32 truncate text-sm text-slate-600 md:block"
                    title={session.user.email}
                  >
                    {displayName}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-xs font-bold text-slate-500 transition hover:text-red-700 sm:text-sm"
                  >
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <div className="ml-1 border-l border-slate-200 pl-3 sm:ml-2 sm:pl-4">
                  <Link
                    to="/login"
                    className="text-xs font-bold text-slate-600 transition hover:text-red-800 sm:text-sm"
                  >
                    Đăng nhập
                  </Link>
                </div>
              )}
            </div>

            <button
              type="button"
              aria-label={isMobileMenuOpen ? "Đóng menu" : "Mở menu"}
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#8f171d] transition hover:bg-red-50 sm:hidden"
            >
              {isMobileMenuOpen ? <X size={23} /> : <Menu size={23} />}
            </button>
          </div>

          {isMobileMenuOpen && (
            <nav className="border-t border-slate-100 bg-white px-4 pb-4 pt-2 sm:hidden">
              <div className="flex flex-col gap-1">
                <Link
                  to="/"
                  className={`rounded-lg px-3 py-2.5 text-sm font-semibold ${location.pathname === "/" ? "bg-red-50 text-[#8f171d]" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  Trang chủ
                </Link>
                <Link
                  to="/tim-kiem"
                  className={`rounded-lg px-3 py-2.5 text-sm font-semibold ${location.pathname === "/tim-kiem" ? "bg-red-50 text-[#8f171d]" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  Tìm kiếm
                </Link>
                <Link
                  to="/bai-dang-cua-toi"
                  className={`rounded-lg px-3 py-2.5 text-sm font-semibold ${location.pathname === "/bai-dang-cua-toi" ? "bg-red-50 text-[#8f171d]" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  Bài đăng của tôi
                </Link>
                <Link
                  to="/inbox"
                  className={`rounded-lg px-3 py-2.5 text-sm font-semibold ${location.pathname === "/inbox" ? "bg-red-50 text-[#8f171d]" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  Tin nhắn
                </Link>
                <Link
                  to="/dang-tin"
                  className="rounded-lg px-3 py-2.5 text-sm font-semibold text-[#8f171d] hover:bg-red-50"
                >
                  Đăng tin
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="rounded-lg px-3 py-2.5 text-sm font-semibold text-[#8f171d] hover:bg-red-50"
                  >
                    Trang quản trị viên
                  </Link>
                )}
                {session ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="border-t border-slate-100 px-3 pt-3 text-left text-sm font-bold text-slate-500"
                  >
                    Đăng xuất
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="border-t border-slate-100 px-3 pt-3 text-sm font-bold text-slate-600"
                  >
                    Đăng nhập
                  </Link>
                )}
              </div>
            </nav>
          )}
        </header>
      )}

      {/* Main Content */}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/item/:id" element={<ItemDetail />} />
          <Route path="/tim-kiem" element={<Search />} />
          <Route path="/bai-dang-cua-toi" element={<MyPosts />} />
          <Route element={<Inbox />} path="/inbox" />
          <Route path="/dang-tin" element={<CreateItem />} />
          <Route path="/login" element={<Login />} />
          <Route path="/access-denied" element={<AccessDenied />} />

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminStats />} />
            <Route path="posts" element={<AdminPosts />} />
            <Route path="items" element={<AdminItems />} />
            <Route path="inbox" element={<AdminInbox />} />
            <Route path="stats" element={<AdminStats />} />
          </Route>
        </Routes>
      </main>

      {/* Footer (Thêm cho giống thật) */}
      {!isAdminRoute && (
        <footer className="mt-auto border-t border-slate-200 bg-white py-8">
          <div className="mx-auto max-w-7xl px-4 text-center">
            <p className="mb-3 text-sm text-slate-500">
              Nền tảng tìm đồ thất lạc dành cho cộng đồng Ngoại thương.
            </p>
            <div className="text-xs text-slate-400">
              © 2026 Bản quyền thuộc về dự án FTU Lost & Found.
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
export default App;
