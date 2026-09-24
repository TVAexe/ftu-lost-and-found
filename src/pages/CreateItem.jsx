import { useState, useEffect } from "react";
import { supabase } from "../config/supabaseClient";
import { useNavigate } from "react-router-dom";
import { usePopup } from "../components/PopupProvider";

export default function CreateItem() {
  const navigate = useNavigate();
  const { showPopup } = usePopup();
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // State lưu thông tin người dùng
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState(""); // Thêm state lưu tên

  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [customCategory, setCustomCategory] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    type: "Bị mất",
    category: "Giấy tờ",
    incident_time: "",
    location: "",
    identifying_features: "",
    contact: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUserEmail(session.user.email);

        // Lấy tên thật từ metadata của Google, nếu không có thì để rỗng
        const fullName =
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          "";
        setUserName(fullName);
      }
      setAuthLoading(false);
    });
  }, [navigate]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setPreviewUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!imageFile) {
      showPopup("Vui lòng chọn ảnh cho món đồ trước khi đăng tin.", "error");
      return;
    }
    if (formData.category === "Khác" && !customCategory.trim()) {
      showPopup("Vui lòng nhập danh mục món đồ.", "error");
      return;
    }

    setLoading(true);

    // 1. Upload ảnh lên Storage
    const fileExt = imageFile.name.split(".").pop();
    const filePath = `${Math.random()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("item-images")
      .upload(filePath, imageFile);

    if (uploadError) {
      setLoading(false);
      showPopup("Không thể tải ảnh lên: " + uploadError.message, "error");
      return;
    }

    // 2. Lấy URL ảnh public
    const { data: urlData } = supabase.storage
      .from("item-images")
      .getPublicUrl(filePath);

    const category =
      formData.category === "Khác" ? customCategory.trim() : formData.category;

    // 3. Đẩy toàn bộ dữ liệu vào Database (Bao gồm cả author_name)
    const { error } = await supabase.from("items").insert([
      {
        ...formData,
        category,
        image_url: urlData.publicUrl,
        user_email: userEmail,
        author_name: userName, // <--- LƯU TÊN NGƯỜI ĐĂNG Ở ĐÂY
        status: "Đang tìm",
      },
    ]);

    setLoading(false);
    if (!error) {
      showPopup("Đăng tin thành công!", "success");
      navigate("/");
    } else {
      showPopup("Lỗi: " + error.message, "error");
    }
  };

  // Màn hình chờ load Auth
  if (authLoading) {
    return (
      <div className="flex min-h-[calc(100vh-180px)] items-center justify-center px-4 py-12">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-100 border-t-red-800" />
      </div>
    );
  }

  // Yêu cầu đăng nhập
  if (!userEmail) {
    return (
      <div className="flex min-h-[calc(100vh-180px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-2xl text-red-800">
            F
          </div>
          <h1 className="mt-5 text-2xl font-bold text-slate-900">
            Đăng nhập để đăng tin
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Bạn cần đăng nhập để chia sẻ thông tin món đồ thất lạc.
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

  // Form Đăng Tin
  return (
    <div className="max-w-5xl mx-auto p-6 bg-white shadow-sm rounded-lg border border-gray-200 mt-8">
      <button
        type="button"
        onClick={() => navigate("/")}
        className="text-sm font-medium text-gray-600 hover:text-red-800 transition mb-4 flex items-center gap-1"
      >
        <span aria-hidden="true">&larr;</span> Về trang chủ
      </button>
      <h2 className="text-2xl font-bold border-b border-gray-100 pb-4 mb-6 text-gray-800">
        Đăng tin đồ thất lạc
      </h2>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-8"
      >
        {/* Cột trái: Form thông tin */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên đồ *
            </label>
            <input
              required
              type="text"
              name="title"
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2.5 outline-none focus:border-red-800 text-sm"
              placeholder="Ví dụ: Ví da màu đen"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loại tin *
              </label>
              <select
                name="type"
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2.5 outline-none focus:border-red-800 bg-white text-sm"
              >
                <option value="Bị mất">Tôi bị mất đồ</option>
                <option value="Nhặt được">Tôi nhặt được đồ</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loại đồ *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2.5 outline-none focus:border-red-800 bg-white text-sm"
              >
                <option value="Giấy tờ">Giấy tờ</option>
                <option value="Điện tử">Đồ điện tử</option>
                <option value="Đồ dùng cá nhân">Đồ dùng cá nhân</option>
                <option value="Khác">Khác</option>
              </select>
              {formData.category === "Khác" && (
                <input
                  required
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2.5 mt-2 outline-none focus:border-red-800 text-sm"
                  placeholder="Nhập loại đồ"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Thời gian (Ngày & Giờ) *
              </label>
              <input
                required
                type="datetime-local"
                name="incident_time"
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2.5 outline-none focus:border-red-800 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Địa điểm *
              </label>
              <input
                required
                type="text"
                name="location"
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md p-2.5 outline-none focus:border-red-800 text-sm"
                placeholder="VD: Sân bóng, Nhà A..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Đặc điểm nhận dạng
            </label>
            <textarea
              name="identifying_features"
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2.5 outline-none focus:border-red-800 text-sm h-20 resize-none"
              placeholder="Mô tả chi tiết: màu sắc, thương hiệu, vết xước... (Có thể che bớt thông tin nhạy cảm để xác minh)."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thông tin liên hệ (SĐT / Zalo) *
            </label>
            <input
              required
              type="text"
              name="contact"
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2.5 outline-none focus:border-red-800 text-sm"
              placeholder="Nhập SĐT để người khác liên hệ"
            />
          </div>
        </div>

        {/* Cột phải: Upload Ảnh & Nút Submit */}
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ảnh minh họa *
          </label>
          <div className="relative border-2 border-dashed border-gray-300 rounded-lg flex-grow flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition overflow-hidden min-h-[300px]">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-6 text-gray-400">
                <svg
                  className="w-12 h-12 mx-auto mb-2 text-gray-300"
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
                <p className="text-sm">Nhấn để chọn ảnh (JPG, PNG)</p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-800 text-white font-bold py-3 rounded-md mt-6 hover:bg-red-900 transition disabled:bg-gray-400 shadow-sm"
          >
            {loading ? "Đang xử lý..." : "Đăng bài ngay"}
          </button>
        </div>
      </form>
    </div>
  );
}
