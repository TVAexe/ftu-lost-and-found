import {
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./config/supabaseClient";
import CreateItem from "./pages/CreateItem";
import Home from "./pages/Home";
import ItemDetail from "./pages/ItemDetail";
import Login from "./pages/Login";
import Search from "./pages/Search";

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState(null);

  // Lắng nghe trạng thái đăng nhập
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
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
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex h-[4.5rem] max-w-6xl items-center justify-between gap-4 px-4">
          {/* Logo */}
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#8f171d] text-lg font-bold text-white shadow-sm">
              F
            </div>
            <span className="truncate text-base font-bold tracking-tight text-[#8f171d] sm:text-lg">
              FTU Lost & Found
            </span>
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              to="/"
              className={`hidden rounded-lg px-3 py-2 text-sm font-semibold transition sm:block ${location.pathname === "/" ? "bg-red-50 text-[#8f171d]" : "text-slate-600 hover:bg-slate-50 hover:text-[#8f171d]"}`}
            >
              Trang chủ
            </Link>
            <Link
              to="/tim-kiem"
              className={`hidden rounded-lg px-3 py-2 text-sm font-semibold transition sm:block ${location.pathname === "/tim-kiem" ? "bg-red-50 text-[#8f171d]" : "text-slate-600 hover:bg-slate-50 hover:text-[#8f171d]"}`}
            >
              Tìm kiếm
            </Link>

            {/* Nút Đăng tin (Chỉ nổi bật) */}
            <Link
              to="/dang-tin"
              className="flex items-center gap-1 rounded-lg bg-[#8f171d] px-3 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#741219] sm:px-4"
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

            {/* Logic hiển thị nút Đăng nhập / Đăng xuất */}
            {session ? (
              <div className="ml-1 flex items-center gap-3 border-l border-slate-200 pl-3 sm:ml-2 sm:pl-4">
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
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/item/:id" element={<ItemDetail />} />
          <Route path="/tim-kiem" element={<Search />} />
          <Route path="/dang-tin" element={<CreateItem />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>

      {/* Footer (Thêm cho giống thật) */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <p className="mb-3 text-sm text-slate-500">
            Nền tảng tìm đồ thất lạc dành riêng cho cộng đồng Ngoại thương.
          </p>
          <div className="text-xs text-slate-400">
            © 2026 Bản quyền thuộc về dự án FTU Lost & Found.
          </div>
        </div>
      </footer>
    </div>
  );
}
export default App;
