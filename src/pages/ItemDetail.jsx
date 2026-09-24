import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "../config/supabaseClient";
import { usePopup } from "../components/PopupProvider";

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showPopup } = usePopup();
  const [item, setItem] = useState(null);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);

  useEffect(() => {
    supabase
      .from("items")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => setItem(data));
  }, [id]);

  if (!item)
    return (
      <div className="text-center py-20 text-gray-500">
        Đang tải thông tin...
      </div>
    );

  const zaloLink = `https://zalo.me/${item.contact?.replace(/^0+/, "84") || ""}`;
  const facebookShareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;

  // Format thời gian hiển thị (ví dụ: 10:30 (20/09/2026))
  const formatDateTime = (dateString) => {
    if (!dateString) return "Không có thông tin";
    const date = new Date(dateString);
    const time = date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const day = date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    return `${time} - ${day}`;
  };

  // Hàm xử lý nhắn tin Inbox nội bộ
  const handleContactInbox = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      showPopup("Vui lòng đăng nhập để nhắn tin.", "info");
      navigate("/login");
      return;
    }

    if (session.user.email === item.user_email) {
      showPopup(
        "Bạn không thể tự nhắn tin cho bài đăng của chính mình.",
        "error",
      );
      return;
    }

    // Mở cuộc trò chuyện, người dùng tự viết tin nhắn đầu tiên.
    navigate(`/inbox?contact=${encodeURIComponent(item.user_email)}`);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 mt-6 font-sans">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-red-800"
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
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          ></path>
        </svg>
        Quay lại
      </Link>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Cột Trái (Ảnh lớn 45%) */}
        <div className="md:w-[45%] flex flex-col gap-4">
          <div className="flex w-full justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-100 aspect-[4/3]">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.title}
                className="block h-full w-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                Không có hình ảnh
              </div>
            )}
          </div>
          {/* Thumbnails nhỏ */}
          <div className="flex gap-2">
            {item.image_url && (
              <div className="w-16 h-16 rounded-md border-2 border-red-800 overflow-hidden cursor-pointer">
                <img
                  src={item.image_url}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="w-16 h-16 rounded-md border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-300 text-xs cursor-not-allowed">
              +
            </div>
          </div>
        </div>

        {/* Cột Giữa (Thông tin chính 35%) */}
        <div className="md:w-[35%] flex flex-col">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {item.title}
          </h1>

          <div className="mb-6 flex items-center gap-2">
            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full border ${item.type === "Bị mất" ? "bg-red-50 text-red-600 border-red-200" : "bg-green-50 text-green-600 border-green-200"}`}
            >
              {item.type === "Bị mất" ? "Đã mất" : "Đã nhặt được"}
            </span>
          </div>

          <div className="space-y-5 text-gray-700 bg-white border border-gray-100 p-6 rounded-xl shadow-sm flex-grow">
            {/* Hàng: Đặc điểm */}
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                ></path>
              </svg>
              <div>
                <span className="font-semibold text-gray-900 block mb-1">
                  Đặc điểm:
                </span>
                <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                  {item.identifying_features || "Không có mô tả chi tiết."}
                </p>
              </div>
            </div>

            {/* Hàng: Thời gian */}
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-gray-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <div>
                <span className="font-semibold text-gray-900 mr-2">
                  Thời gian:
                </span>
                <span className="text-sm text-gray-600">
                  {formatDateTime(item.incident_time)}
                </span>
              </div>
            </div>

            {/* Hàng: Địa điểm */}
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-gray-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                ></path>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                ></path>
              </svg>
              <div>
                <span className="font-semibold text-gray-900 mr-2">
                  Địa điểm:
                </span>
                <span className="text-sm text-gray-600">{item.location}</span>
              </div>
            </div>

            {/* Hàng: Người đăng */}
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-gray-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                ></path>
              </svg>
              <div>
                <span className="font-semibold text-gray-900 mr-2">
                  Người đăng:
                </span>
                <span className="text-sm text-gray-600 font-medium">
                  {item.author_name || item.user_email?.split("@")[0]}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleContactInbox}
              className="flex-1 bg-red-800 hover:bg-red-900 text-white font-semibold py-3 rounded-lg text-center transition shadow-sm flex items-center justify-center gap-2"
            >
              Liên hệ qua Inbox
            </button>
            <div className="relative">
              <button
                type="button"
                aria-label="Mở thêm lựa chọn liên hệ và chia sẻ"
                aria-expanded={isShareMenuOpen}
                onClick={() => setIsShareMenuOpen((isOpen) => !isOpen)}
                className="px-4 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition bg-white shadow-sm"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
                  ></path>
                </svg>
              </button>
              {isShareMenuOpen && (
                <div className="absolute right-0 top-full z-10 mt-2 w-48 rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
                  <a
                    href={zaloLink}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Liên hệ Zalo
                  </a>
                  <a
                    href={facebookShareLink}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Chia sẻ Facebook
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cột Phải (Trạng thái & Chia sẻ 20%) */}
        <div className="md:w-[20%] flex flex-col gap-4">
          {/* Box Trạng thái */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-3 text-sm">Trạng thái</h3>
            <div
              className={`w-full text-center py-2.5 rounded-lg font-bold text-sm ${item.status === "Đang tìm" ? "bg-yellow-50 text-yellow-700 border border-yellow-200" : "bg-green-50 text-green-700 border border-green-200"}`}
            >
              {item.status}
            </div>
          </div>
        </div>
      </div>

      {/* Bình luận (Placeholder như thiết kế) */}
      <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-10 max-w-[80%]">
        <h3 className="font-bold text-gray-800 mb-4">Bình luận (0)</h3>
        <div className="flex gap-4 items-start">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0"></div>
          <input
            type="text"
            className="w-full bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 text-sm outline-none focus:border-red-300"
            placeholder="Viết bình luận..."
          />
        </div>
      </div>
    </div>
  );
}
