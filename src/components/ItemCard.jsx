import { Link } from "react-router-dom";

export default function ItemCard({ item }) {
  const isLost = item.type === "Bị mất";

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-red-100 hover:shadow-xl">
      {/* Khung ảnh */}
      <div className="relative h-48 overflow-hidden bg-slate-100">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Không có ảnh
          </div>
        )}
        {/* Nhãn tag */}
        <span
          className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold shadow-sm ${isLost ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}
        >
          {item.type}
        </span>
      </div>

      {/* Nội dung */}
      <div className="flex flex-grow flex-col p-4">
        <h3 className="truncate font-bold text-slate-900" title={item.title}>
          {item.title}
        </h3>
        <p className="mt-1 truncate text-sm text-slate-500">{item.location}</p>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="text-xs text-slate-400">
            {new Date(item.created_at).toLocaleDateString("vi-VN")}
          </span>
          <Link
            to={`/item/${item.id}`}
            className="text-sm font-bold text-red-800 transition group-hover:text-red-600 hover:underline"
          >
            Chi tiết <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
