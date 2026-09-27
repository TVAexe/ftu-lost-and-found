import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../config/supabaseClient";
import ItemCard from "../components/ItemCard";

const PAGE_SIZE = 8;

const normalizeText = (value = "") =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase();

const filterOptions = {
  type: ["Tất cả", "Bị mất", "Nhặt được"],
  date: ["Mọi thời gian", "24 giờ qua", "7 ngày qua", "30 ngày qua"],
};

function FilterSelect({ label, value, options, onChange }) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-xs font-semibold text-slate-500">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-red-700 focus:ring-2 focus:ring-red-100"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("Tất cả");
  const [category, setCategory] = useState("Tất cả");
  const [categoryOptions, setCategoryOptions] = useState(["Tất cả"]);
  const [dateRange, setDateRange] = useState("Mọi thời gian");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from("items")
        .select("category")
        .not("category", "is", null);

      if (error) {
        console.error("Lỗi tải danh mục:", error);
        return;
      }

      const categories = [
        ...new Set(data.map((item) => item.category?.trim()).filter(Boolean)),
      ];
      setCategoryOptions(["Tất cả", ...categories]);
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      let query = supabase.from("items").select("*");

      if (type !== "Tất cả") query = query.eq("type", type);
      if (category !== "Tất cả") query = query.eq("category", category);

      if (dateRange !== "Mọi thời gian") {
        const days =
          dateRange === "24 giờ qua" ? 1 : dateRange === "7 ngày qua" ? 7 : 30;
        const since = new Date();
        since.setDate(since.getDate() - days);
        query = query.gte("created_at", since.toISOString());
      }

      const { data, error } = await query;
      if (error) {
        console.error("Lỗi tìm kiếm:", error);
        setItems([]);
      } else {
        const normalizedSearch = normalizeText(searchTerm.trim());
        const normalizedLocation = normalizeText(location.trim());
        const filteredItems = data.filter((item) => {
          const matchesSearch =
            !normalizedSearch ||
            [item.title, item.location].some((value) =>
              normalizeText(value).includes(normalizedSearch),
            );
          const matchesLocation =
            !normalizedLocation ||
            normalizeText(item.location).includes(normalizedLocation);
          return matchesSearch && matchesLocation;
        });

        filteredItems.sort((first, second) => {
          if (sortBy === "oldest")
            return new Date(first.created_at) - new Date(second.created_at);
          return new Date(second.created_at) - new Date(first.created_at);
        });
        setItems(filteredItems);
      }
      setLoading(false);
    };

    fetchItems();
  }, [category, dateRange, location, searchTerm, sortBy, type]);

  useEffect(() => {
    setPage(1);
  }, [category, dateRange, location, searchTerm, sortBy, type]);

  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const visibleItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearch = (event) => {
    event.preventDefault();
    const nextParams = new URLSearchParams(searchParams);
    if (searchTerm.trim()) nextParams.set("q", searchTerm.trim());
    else nextParams.delete("q");
    setSearchParams(nextParams);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setLocation("");
    setType("Tất cả");
    setCategory("Tất cả");
    setDateRange("Mọi thời gian");
    setSortBy("newest");
    setSearchParams({});
  };

  return (
    <div className="min-h-[calc(100vh-120px)] bg-[#f7f8fa] pb-14">
      <div className="h-64 w-full overflow-hidden bg-slate-100 sm:h-80">
        <img
          src={`${import.meta.env.BASE_URL}banner.jpeg`}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>

      <div className="border-b border-slate-200 bg-white px-4 py-5">
        <form
          onSubmit={handleSearch}
          className="mx-auto flex min-h-14 max-w-3xl overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm"
        >
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Nhập tên món đồ, ví dụ: Ví da, AirPods..."
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

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-bold text-slate-800">Bộ lọc tìm kiếm</h2>
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-semibold text-red-700 hover:underline"
            >
              Xóa bộ lọc
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <FilterSelect
              label="Loại tin"
              value={type}
              options={filterOptions.type}
              onChange={setType}
            />
            <FilterSelect
              label="Danh mục"
              value={category}
              options={categoryOptions}
              onChange={setCategory}
            />
            <FilterSelect
              label="Thời gian"
              value={dateRange}
              options={filterOptions.date}
              onChange={setDateRange}
            />
            <label className="flex min-w-0 flex-col gap-1.5 text-xs font-semibold text-slate-500">
              Địa điểm
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Ví dụ: Nhà A"
                className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-red-700 focus:ring-2 focus:ring-red-100"
              />
            </label>
          </div>
        </div>

        <div className="mt-8 flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Kết quả tìm kiếm{" "}
              <span className="text-red-700">({items.length})</span>
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Các bài đăng phù hợp với tiêu chí của bạn
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-500">
            Sắp xếp:
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="rounded-md border border-slate-200 bg-white px-2 py-2 font-semibold text-slate-700 outline-none"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
            </select>
          </label>
        </div>

        {loading ? (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-72 animate-pulse rounded-xl bg-slate-200"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <p className="font-semibold text-slate-700">
              Không tìm thấy món đồ phù hợp
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Thử đổi từ khóa hoặc nới rộng bộ lọc tìm kiếm.
            </p>
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
