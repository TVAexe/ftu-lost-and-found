import { useState, useEffect } from "react";
import { supabase } from "../../config/supabaseClient";

export default function AdminStats() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    returned: 0,
    lost: 0,
    found: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await supabase.from("items").select("*");
      if (data) {
        setStats({
          total: data.length,
          pending: data.filter((i) => i.approval_status === "pending").length,
          returned: data.filter((i) => i.status === "Đã trao trả").length,
          lost: data.filter((i) => i.type === "Bị mất").length,
          found: data.filter((i) => i.type === "Nhặt được").length,
        });
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="mb-6 text-xl font-bold text-gray-800 sm:text-2xl">
        Thống kê hệ thống Lost & Found
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-5 rounded-xl bg-blue-50 border border-blue-100">
          <div className="text-sm font-medium text-blue-600">
            Tổng số bài đăng
          </div>
          <div className="text-3xl font-bold text-blue-900 mt-2">
            {stats.total}
          </div>
        </div>
        <div className="p-5 rounded-xl bg-amber-50 border border-amber-100">
          <div className="text-sm font-medium text-amber-600">
            Đang chờ duyệt
          </div>
          <div className="text-3xl font-bold text-amber-900 mt-2">
            {stats.pending}
          </div>
        </div>
        <div className="p-5 rounded-xl bg-green-50 border border-green-100">
          <div className="text-sm font-medium text-green-600">
            Đã trao trả thành công
          </div>
          <div className="text-3xl font-bold text-green-900 mt-2">
            {stats.returned}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl border border-gray-200 bg-gray-50">
          <h3 className="font-bold text-gray-800 mb-3">Phân loại tin đăng</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Đồ bị mất:</span>
              <span className="font-bold text-gray-800">{stats.lost}</span>
            </div>
            <div className="flex justify-between">
              <span>Đồ nhặt được:</span>
              <span className="font-bold text-gray-800">{stats.found}</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-gray-200 bg-gray-50">
          <h3 className="font-bold text-gray-800 mb-3">Hiệu suất xử lý</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Hệ thống đang hoạt động ổn định. Tỷ lệ đồ vật được kết nối và trao
            trả thành công chiếm đa số nhờ quy trình xác minh qua văn phòng L&F.
          </p>
        </div>
      </div>
    </div>
  );
}
