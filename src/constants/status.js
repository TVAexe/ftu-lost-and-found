// Dựa trên luồng Thất lạc[cite: 3] và Nhặt được đồ[cite: 4]
export const ITEM_STATUS = {
  // Nhóm trạng thái ban đầu
  LOST: 'Thất lạc',
  FOUND_KEPT_BY_USER: 'Người nhặt đang giữ',
  FOUND_AT_LF: 'Đang lưu tại L&F',
  
  // Nhóm trạng thái xử lý
  VERIFYING: 'Đang xác minh',
  CONFIRMED: 'Đã tìm thấy', // hoặc 'Đã xác nhận chủ'
  
  // Trạng thái kết thúc
  RETURNED: 'Đã trao trả'
};

// Hàm map màu sắc cho trạng thái
export const getStatusColor = (status) => {
  switch (status) {
    case ITEM_STATUS.LOST: return 'bg-red-100 text-red-700';
    case ITEM_STATUS.FOUND_KEPT_BY_USER: return 'bg-orange-100 text-orange-700';
    case ITEM_STATUS.FOUND_AT_LF: return 'bg-blue-100 text-blue-700';
    case ITEM_STATUS.VERIFYING: return 'bg-purple-100 text-purple-700';
    case ITEM_STATUS.CONFIRMED: return 'bg-green-100 text-green-700';
    case ITEM_STATUS.RETURNED: return 'bg-teal-100 text-teal-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};