import { useState, useEffect } from "react";
import { supabase } from "../../config/supabaseClient";

export default function AdminPosts() {
  const [activeTab, setActiveTab] = useState("pending"); // 'pending', 'approved', 'rejected'
  const [posts, setPosts] = useState([]);

  // State dùng để "đánh thức" useEffect tải lại dữ liệu
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true; // Tránh lỗi set state khi component đã unmount

    // 1. Định nghĩa hàm fetch hoàn toàn nằm TRONG useEffect
    const loadPosts = async () => {
      const { data } = await supabase
        .from("items")
        .select("*")
        .eq("approval_status", activeTab)
        .order("created_at", { ascending: false });

      if (data && isMounted) {
        setPosts(data);
      }
    };

    loadPosts();

    return () => {
      isMounted = false;
    };
  }, [activeTab, refreshTrigger]); // Chạy lại khi chuyển tab hoặc khi refreshTrigger thay đổi

  const handleApprove = async (id) => {
    const { error } = await supabase
      .from("items")
      .update({ approval_status: "approved" })
      .eq("id", id);
    if (!error) {
      // 2. Chỉ cần tăng số này lên 1, useEffect bên trên sẽ tự động chạy lại để lấy data mới
      setRefreshTrigger((prev) => prev + 1);
    }
  };

  const handleReject = async (id) => {
    const { error } = await supabase
      .from("items")
      .update({ approval_status: "rejected" })
      .eq("id", id);
    if (!error) {
      setRefreshTrigger((prev) => prev + 1);
    }
  };

  return (
    <div className="mx-auto mt-0 max-w-6xl rounded-lg bg-white p-4 shadow sm:mt-8 sm:p-6">
      <h2 className="mb-6 text-xl font-bold text-gray-800 sm:text-2xl">
        Quản lý bài đăng (Dành cho L&F)
      </h2>

      {/* Tabs */}
      <div className="mb-6 flex gap-6 overflow-x-auto border-b">
        <button
          className={`shrink-0 whitespace-nowrap pb-3 text-sm font-semibold transition-colors ${activeTab === "pending" ? "border-b-2 border-red-800 text-red-800" : "text-gray-500 hover:text-gray-700"}`}
          onClick={() => setActiveTab("pending")}
        >
          Chờ duyệt
        </button>
        <button
          className={`shrink-0 whitespace-nowrap pb-3 text-sm font-semibold transition-colors ${activeTab === "approved" ? "border-b-2 border-red-800 text-red-800" : "text-gray-500 hover:text-gray-700"}`}
          onClick={() => setActiveTab("approved")}
        >
          Đã duyệt
        </button>
        <button
          className={`shrink-0 whitespace-nowrap pb-3 text-sm font-semibold transition-colors ${activeTab === "rejected" ? "border-b-2 border-red-800 text-red-800" : "text-gray-500 hover:text-gray-700"}`}
          onClick={() => setActiveTab("rejected")}
        >
          Đã từ chối
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[44rem] border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 text-sm">
              <th className="py-3 px-4 font-medium rounded-tl-lg">Ảnh</th>
              <th className="py-3 px-4 font-medium">Tiêu đề</th>
              <th className="py-3 px-4 font-medium">Loại</th>
              <th className="py-3 px-4 font-medium">Người đăng</th>
              <th className="py-3 px-4 font-medium">Thời gian</th>
              <th className="py-3 px-4 font-medium rounded-tr-lg">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-gray-500">
                  Không có bài đăng nào trong mục này.
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr
                  key={post.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition"
                >
                  <td className="py-3 px-4">
                    <img
                      src={post.image_url || "/placeholder.png"}
                      className="w-12 h-12 rounded-md object-cover border border-gray-200"
                      alt="Item thumbnail"
                    />
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-800">
                    {post.title}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded ${post.type === "Bị mất" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}
                    >
                      {post.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {post.author_name || post.user_email?.split("@")[0]}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {new Date(post.created_at).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="py-3 px-4">
                    {activeTab === "pending" ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(post.id)}
                          className="px-3 py-1.5 bg-green-50 text-green-700 rounded-md border border-green-200 hover:bg-green-100 text-sm font-semibold transition"
                        >
                          Duyệt
                        </button>
                        <button
                          onClick={() => handleReject(post.id)}
                          className="px-3 py-1.5 bg-red-50 text-red-700 rounded-md border border-red-200 hover:bg-red-100 text-sm font-semibold transition"
                        >
                          Từ chối
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm italic">
                        Đã xử lý
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
