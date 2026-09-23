/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { supabase } from "../config/supabaseClient";
import ItemCard from "../components/ItemCard";

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
  const [searchTerm, setSearchTerm] = useState("");

  const fetchItems = async (search = searchTerm) => {
    setLoading(true);
    let query = supabase
      .from("items")
      .select("*")
      .order("created_at", { ascending: false });

    if (filter !== "Tất cả") {
      query = query.eq("type", filter);
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
  }, [filter]);

  const handleSearch = (event) => {
    event.preventDefault();
    fetchItems(searchTerm);
  };

  return (
    <div className="bg-[#f7f8fa] pb-14">
      {/* Banner */}
      <div
        className="relative flex min-h-[20rem] w-full items-center justify-center bg-[#7f1118] bg-cover bg-center text-white"
        // style={{
        //   backgroundImage: `linear-gradient(90deg, rgba(80, 8, 14, .88), rgba(127, 17, 24, .48)), url("${import.meta.env.BASE_URL}banner-ftu.jpeg")`,
        // }}
      >
        <div className="relative z-10 w-full max-w-3xl px-5 text-center sm:px-8">
          <h1 className="text-4xl font-bold tracking-tight drop-shadow-sm sm:text-5xl">
            FTU Lost & Found
          </h1>
          <p className="mt-3 text-xl font-semibold text-red-50 sm:text-2xl">
            Kết nối - Tìm lại - Trao gửi
          </p>
          <p className="mx-auto mb-8 mt-3 max-w-xl text-sm text-red-100 sm:text-base">
            Nền tảng tìm đồ thất lạc dành riêng cho sinh viên FTU
          </p>

          <form
            onSubmit={handleSearch}
            className="mx-auto flex min-h-14 max-w-2xl overflow-hidden rounded-xl bg-white p-1.5 shadow-2xl"
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
              className="rounded-lg bg-[#a51d24] px-5 text-sm font-bold transition hover:bg-[#781219] sm:px-7"
            >
              Tìm kiếm
            </button>
          </form>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-10">
        {/* Bộ lọc */}
        <div className="mb-7 flex flex-col justify-between gap-5 border-b border-slate-200 pb-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-red-700">
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
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
