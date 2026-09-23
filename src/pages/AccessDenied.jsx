import { Link } from 'react-router-dom';

export default function AccessDenied() {
  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="bg-white p-8 rounded-lg shadow-sm border border-red-200 w-full max-w-md text-center">
        {/* Icon cảnh báo */}
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Truy cập bị từ chối!</h2>
        <p className="text-gray-600 mb-6">
          Chỉ tài khoản email có đuôi <b>@ftu.edu.vn</b> mới được phép đăng nhập vào hệ thống.
        </p>
        
        <Link to="/login" className="bg-red-800 text-white px-6 py-2.5 rounded-md font-semibold hover:bg-red-900 transition inline-block">
          Quay lại trang Đăng nhập
        </Link>
      </div>
    </div>
  );
}