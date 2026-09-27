import { useState, useEffect } from "react";
import { supabase } from "../../config/supabaseClient";
import UpdateStatusModal from "../../components/UpdateStatusModal";

export default function AdminItems() {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchApprovedItems = async () => {
    const { data } = await supabase
      .from("items")
      .select("*")
      .eq("approval_status", "approved")
      .order("created_at", { ascending: false });
    if (data) setItems(data);
  };

  useEffect(() => {
    let isCurrent = true;

    supabase
      .from("items")
      .select("*")
      .eq("approval_status", "approved")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (isCurrent && data) setItems(data);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="mb-2 text-xl font-bold text-gray-800 sm:text-2xl">
        Quản lý kho đồ & Cập nhật trạng thái
      </h2>
      <p className="text-sm text-gray-500 mb-6">
        Cập nhật tiến trình xác minh và trao trả món đồ theo lưu đồ thực tế.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="border border-gray-200 rounded-xl p-4 flex flex-col justify-between shadow-sm bg-white"
          >
            <div>
              <img
                src={item.image_url}
                alt=""
                className="w-full h-40 object-cover rounded-lg mb-3 bg-gray-100"
              />
              <h3 className="font-bold text-lg text-gray-800">{item.title}</h3>
              <p className="text-xs text-gray-500 mb-2">
                Địa điểm: {item.location}
              </p>
              <div className="inline-block px-2.5 py-1 text-xs font-bold rounded bg-blue-50 text-blue-700 border border-blue-100 mb-4">
                {item.status}
              </div>
            </div>
            <button
              onClick={() => setSelectedItem(item)}
              className="w-full bg-red-800 hover:bg-red-900 text-white text-sm font-semibold py-2 rounded-lg transition"
            >
              Cập nhật trạng thái
            </button>
          </div>
        ))}
      </div>

      {selectedItem && (
        <UpdateStatusModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onUpdated={fetchApprovedItems}
        />
      )}
    </div>
  );
}
