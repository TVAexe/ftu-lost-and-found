/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { supabase } from "../config/supabaseClient";
import ItemCard from "../components/ItemCard";

const PAGE_SIZE = 8;

const normalizeText = (value = "") =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase();

export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Tất cả");
  const [category, setCategory] = useState("Tất cả");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const fetchItems = async (search = searchTerm) => {
    setLoading(true);
    let query = supabase
      .from("items")
      .select("*")
      .order("created_at", { ascending: false })
      .eq("approval_status", "approved") // Chỉ hiện bài đã duyệt
      .neq("status", "Đã trao trả"); // Ẩn các bài đã trao trả[cite: 3, 4];

    if (filter !== "Tất cả") {
      query = query.eq("type", filter);
    }
    if (category !== "Tất cả") {
      query = query.eq("category", category);
    }

    const { data, error } = await query;
    if (error) console.error("Lỗi:", error);
    else {
      const normalizedSearch = normalizeText(search.trim());
      const filteredItems = normalizedSearch
        ? data.filter((item) =>
            [item.title, item.location].some((value) =>
              normalizeText(value).includes(normalizedSearch),
            ),
          )
        : data;
      setItems(filteredItems);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, [category, filter]);

  useEffect(() => {
    setPage(1);
  }, [category, filter, searchTerm]);

  const categoryOptions = [
    "Tất cả",
    ...new Set(items.map((item) => item.category?.trim()).filter(Boolean)),
  ];
  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const visibleItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = (event) => {
    event.preventDefault();
    fetchItems(searchTerm);
  };

  return (
    <div className="bg-[#f7f8fa] pb-14">
      {/* Banner */}
      <div className="h-64 w-full overflow-hidden bg-slate-100 sm:h-80">
        <img
          src={`${import.meta.env.BASE_URL}banner.jpeg`}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>

      {/* Tìm kiếm */}
      <div className="border-b border-slate-200 bg-white px-4 py-5">
        <form
          onSubmit={handleSearch}
          className="mx-auto flex min-h-14 max-w-3xl overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm"
        >
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Tìm kiếm tên món đồ, địa điểm..."
            className="min-w-0 flex-grow rounded-lg px-4 text-sm text-gray-800 outline-none"
          />
          <button
            type="submit"
            className="rounded-lg bg-[#a51d24] px-5 text-sm font-bold text-white transition hover:bg-[#781219] sm:px-7"
          >
            Tìm kiếm
          </button>
        </form>
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-10">
        {/* Bộ lọc */}
        <div className="mb-7 flex flex-col justify-between gap-5 border-b border-slate-200 pb-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-1 text-2xl font-bold tracking-tight text-red-700">
              Khám phá bài đăng
            </p>
            <h2 className="mb-4 text-2xl font-bold tracking-tight text-slate-900">
              Bài đăng mới nhất
            </h2>
            <div className="flex flex-wrap gap-2">
              {["Tất cả", "Bị mất", "Nhặt được"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${filter === f ? "border-red-200 bg-red-50 text-red-800" : "border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:text-red-700"}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <span className="text-sm text-slate-500">
            Hiển thị {items.length} kết quả
          </span>
        </div>

        {/* Lưới sản phẩm */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-gray-500 py-10">
            Chưa có dữ liệu phù hợp.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
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
      </div>
    </div>
  );
}
