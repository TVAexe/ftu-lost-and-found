import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../config/supabaseClient";
import ItemCard from "../components/ItemCard";

const PAGE_SIZE = 8;

export default function MyPosts() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [type, setType] = useState("Tất cả");
  const [category, setCategory] = useState("Tất cả");
  const [status, setStatus] = useState("Tất cả");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchMyPosts = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setLoading(false);
        return;
      }

      const email = session.user.email;
      setUserEmail(email);

      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("user_email", email)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Lỗi tải bài đăng của tôi:", error);
        setItems([]);
      } else {
        setItems(data || []);
      }
      setLoading(false);
    };

    fetchMyPosts();
  }, []);

  const filteredItems = items.filter((item) => {
    const matchesType = type === "Tất cả" || item.type === type;
    const matchesCategory = category === "Tất cả" || item.category === category;
    const matchesStatus =
      status === "Tất cả" || (item.status || "Đang tìm") === status;
    return matchesType && matchesCategory && matchesStatus;
  });
  const categoryOptions = [
    "Tất cả",
    ...new Set(items.map((item) => item.category?.trim()).filter(Boolean)),
  ];
  const statusOptions = [
    "Tất cả",
    ...new Set(items.map((item) => item.status || "Đang tìm")),
  ];
  const totalPages = Math.ceil(filteredItems.length / PAGE_SIZE);
  const visibleItems = filteredItems.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  if (!loading && !userEmail) {
    return (
      <div className="flex min-h-[calc(100vh-180px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-2xl text-red-800">
            F
          </div>
          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Đăng nhập để xem bài đăng
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Các bài đăng của bạn sẽ được hiển thị tại đây.
          </p>
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="mt-6 rounded-lg bg-[#8f171d] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#741219]"
          >
            Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-180px)] bg-[#f7f8fa] px-4 py-10">
      <main className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-700">
              Tài khoản của bạn
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Bài đăng của tôi
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Quản lý các món đồ bạn đã đăng trên FTU Lost & Found.
            </p>
          </div>
          <Link
            to="/dang-tin"
            className="inline-flex items-center justify-center rounded-lg bg-[#8f171d] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#741219]"
          >
            <span aria-hidden="true" className="mr-2 text-lg leading-none">
              +
            </span>
            Đăng tin mới
          </Link>
        </div>

        <div className="mt-8 flex items-center justify-between border-b border-slate-200 pb-4">
          <h2 className="font-bold text-slate-800">Danh sách bài đăng</h2>
          {!loading && (
            <span className="text-sm text-slate-500">
              {filteredItems.length} bài đăng
            </span>
          )}
        </div>

        {!loading && items.length > 0 && (
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <select
              value={type}
              onChange={(event) => {
                setType(event.target.value);
                setPage(1);
              }}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-red-700"
            >
              {["Tất cả", "Bị mất", "Nhặt được"].map((option) => (
                <option key={option} value={option}>
                  Loại: {option}
                </option>
              ))}
            </select>
            <select
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setPage(1);
              }}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-red-700"
            >
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  Danh mục: {option}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-red-700"
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  Trạng thái: {option}
                </option>
              ))}
            </select>
          </div>
        )}

        {loading ? (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-72 animate-pulse rounded-xl bg-slate-200"
              />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <p className="font-semibold text-slate-700">
              Không có bài đăng phù hợp
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Thử thay đổi bộ lọc hoặc đăng món đồ đầu tiên để bắt đầu kết nối.
            </p>
            <Link
              to="/dang-tin"
              className="mt-5 inline-flex rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-800 transition hover:bg-red-100"
            >
              Đăng tin ngay
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {visibleItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((currentPage) => currentPage - 1)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Trước
            </button>
            <span className="text-sm font-semibold text-slate-500">
              Trang {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => setPage((currentPage) => currentPage + 1)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Sau
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
