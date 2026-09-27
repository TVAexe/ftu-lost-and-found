import { useState } from 'react';
import { supabase } from '../config/supabaseClient';
import { ITEM_STATUS } from '../constants/status';

export default function UpdateStatusModal({ item, onClose, onUpdated }) {
  const [status, setStatus] = useState(item.status);
  const [note, setNote] = useState(item.admin_note || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('items')
      .update({ status: status, admin_note: note })
      .eq('id', item.id);
      
    setLoading(false);
    if (!error) {
      onUpdated();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-xl">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-bold text-lg">Cập nhật trạng thái món đồ</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-black">✕</button>
        </div>
        
        <div className="p-4 space-y-4">
          {/* Header Info */}
          <div className="flex gap-3 items-center p-3 bg-gray-50 rounded-lg">
             <img src={item.image_url} className="w-12 h-12 rounded object-cover" alt="" />
             <div>
               <div className="font-bold">{item.title}</div>
               <div className="text-sm text-green-600">● {item.status}</div>
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Chọn trạng thái mới <span className="text-red-500">*</span></label>
            <select 
              value={status} 
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 focus:border-red-800 outline-none"
            >
              {Object.values(ITEM_STATUS).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Ghi chú</label>
            <textarea 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 h-24 focus:border-red-800 outline-none"
              placeholder="VD: Đã xác minh thông tin, người nhận..."
            />
          </div>
        </div>

        <div className="flex gap-3 p-4 border-t justify-end bg-gray-50">
          <button onClick={onClose} className="px-5 py-2 rounded-lg border border-gray-300 font-medium hover:bg-gray-100">Hủy</button>
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="px-5 py-2 rounded-lg bg-red-800 text-white font-medium hover:bg-red-900 disabled:opacity-50"
          >
            LƯU
          </button>
        </div>
      </div>
    </div>
  );
}