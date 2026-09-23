import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';

export default function ItemDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);

  useEffect(() => {
    supabase.from('items').select('*').eq('id', id).single().then(({ data }) => setItem(data));
  }, [id]);

  if (!item) return <div className="text-center py-20 text-gray-500">Đang tải thông tin...</div>;

  const zaloLink = `https://zalo.me/${item.contact.replace(/^0+/, '84')}`;

  return (
    <div className="max-w-5xl mx-auto p-4 mt-6">
      <Link to="/" className="text-sm text-gray-500 hover:text-red-800 mb-4 inline-block">&larr; Quay lại trang chủ</Link>
      
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col md:flex-row gap-8">
        {/* Khung Ảnh */}
        <div className="md:w-5/12">
          <div className="w-full aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-100">
            {item.image_url ? (
              <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">Không có hình ảnh</div>
            )}
          </div>
        </div>
        
        {/* Khung Thông tin */}
        <div className="md:w-7/12 flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <h1 className="text-2xl font-bold text-gray-800">{item.title}</h1>
            <span className={`px-3 py-1 text-xs font-semibold rounded-md ${item.status === 'Đang tìm' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
              {item.status}
            </span>
          </div>
          
          <div className="text-sm text-gray-500 mb-6">
            Đăng ngày {new Date(item.created_at).toLocaleDateString('vi-VN')}
          </div>

          <div className="space-y-4 text-gray-700 bg-gray-50 p-5 rounded-md border border-gray-100 flex-grow">
            <div className="flex">
              <span className="font-semibold w-32 text-gray-500">Phân loại:</span>
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${item.type === 'Bị mất' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{item.type}</span>
            </div>
            <div className="flex">
              <span className="font-semibold w-32 text-gray-500">Danh mục:</span>
              <span>{item.category}</span>
            </div>
            <div className="flex">
              <span className="font-semibold w-32 text-gray-500">Địa điểm:</span>
              <span>{item.location}</span>
            </div>
          </div>

          <a href={zaloLink} target="_blank" rel="noreferrer" className="mt-6 block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-md transition shadow-sm">
            Liên hệ qua Zalo ngay
          </a>
        </div>
      </div>
    </div>
  );
}