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

  // States cho tính năng bình luận
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setCurrentUser(session.user);
    });

    supabase
      .from("items")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => setItem(data));

    const fetchComments = async () => {
      const { data } = await supabase
        .from("comments")
        .select("*")
        .eq("item_id", id)
        .order("created_at", { ascending: true });
      if (data) setComments(data);
    };
    fetchComments();

    const subscription = supabase
      .channel("public:comments")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `item_id=eq.${id}`,
        },
        (payload) => {
          setComments((current) => [...current, payload.new]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [id]);

  if (!item)
    return (
      <div className="text-center py-20 text-gray-500">
        Đang tải thông tin...
      </div>
    );

  const zaloLink = `https://zalo.me/${item.contact?.replace(/^0+/, "84") || ""}`;
  const facebookShareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    window.location.href,
  )}`;

  const formatDateTime = (dateString) => {
    if (!dateString) return "Không có thông tin";
    const date = new Date(dateString);
    return `${date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    })} - ${date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })}`;
  };

  const handleContactInbox = async () => {
    if (!currentUser) {
      showPopup("Vui lòng đăng nhập để liên hệ.", "info");
      navigate("/login");
      return;
    }

    if (currentUser.email === item.user_email) {
      const adminEmail = "k62.2314510067@ftu.edu.vn";
      navigate(`/inbox?contact=${encodeURIComponent(adminEmail)}`);
      return;
    }

    navigate(`/inbox?contact=${encodeURIComponent(item.user_email)}`);
  };

  const handleMessageCommenter = (commenterEmail) => {
    if (!currentUser) {
      showPopup("Vui lòng đăng nhập để nhắn tin.", "info");
      navigate("/login");
      return;
    }
    navigate(`/inbox?contact=${encodeURIComponent(commenterEmail)}`);
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      showPopup("Vui lòng đăng nhập để bình luận.", "info");
      navigate("/login");
      return;
    }
    if (!newComment.trim()) return;

    const userName =
      currentUser.user_metadata?.full_name || currentUser.email.split("@")[0];
    const parentId = replyingTo
      ? replyingTo.parent_id
        ? replyingTo.parent_id
        : replyingTo.id
      : null;

    const { error } = await supabase.from("comments").insert([
      {
        item_id: id,
        user_email: currentUser.email,
        user_name: userName,
        content: newComment.trim(),
        parent_id: parentId,
      },
    ]);

    if (error) {
      showPopup("Có lỗi khi gửi bình luận.", "error");
    } else {
      setNewComment("");
      setReplyingTo(null);
    }
  };

  // Logic màu sắc cho khối Trạng thái
  const getStatusBoxStyle = (status) => {
    if (status === "Đã trao trả" || status === "Đã tìm thấy")
      return "bg-green-50 text-green-700 border-green-200";
    if (status === "Đang xác minh")
      return "bg-blue-50 text-blue-700 border-blue-200";
    if (status === "Đã xác nhận chủ")
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    return "bg-yellow-50 text-yellow-700 border-yellow-200"; // Đang tìm
  };

  // Biến kiểm tra xem món đồ đã được giải quyết xong chưa
  const isResolved =
    item.status === "Đã trao trả" || item.status === "Đã tìm thấy";

  const rootComments = comments.filter((c) => !c.parent_id);
  const imageUrls =
    Array.isArray(item.image_urls) && item.image_urls.length
      ? item.image_urls
      : item.image_url
        ? [item.image_url]
        : [];

  const CommentNode = ({ comment, isReply }) => (
    <div className={`flex gap-3 items-start ${isReply ? "mt-4" : "mt-6"}`}>
      <div
        className={`${isReply ? "w-8 h-8 text-xs" : "w-10 h-10"} rounded-full bg-red-100 text-red-800 flex items-center justify-center font-bold flex-shrink-0`}
      >
        {comment.user_name?.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-gray-900 text-sm">
            {comment.user_name}
          </span>
          {comment.user_email === item.user_email && (
            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold">
              Tác giả
            </span>
          )}
          <span className="text-xs text-gray-500">
            {formatDateTime(comment.created_at)}
          </span>
        </div>
        <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-xl rounded-tl-none border border-gray-100 inline-block w-auto max-w-full break-words">
          {comment.content}
        </p>

        <div className="flex items-center gap-4 mt-1.5 ml-1">
          <button
            onClick={() => setReplyingTo(comment)}
            className="text-xs font-semibold text-gray-500 hover:text-red-700 transition"
          >
            Trả lời
          </button>

          {currentUser?.email !== comment.user_email && (
            <button
              onClick={() => handleMessageCommenter(comment.user_email)}
              className="text-xs font-semibold text-gray-500 hover:text-red-700 transition"
            >
              Nhắn tin
            </button>
          )}
        </div>

        {!isReply && (
          <div className="ml-4 border-l-2 border-gray-100 pl-4">
            {comments
              .filter((c) => c.parent_id === comment.id)
              .map((reply) => (
                <CommentNode key={reply.id} comment={reply} isReply={true} />
              ))}
          </div>
        )}
      </div>
    </div>
  );

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
        <div className="md:w-[45%] flex flex-col gap-4">
          <div className="flex w-full flex-col gap-3">
            <div className="flex aspect-[4/3] w-full justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
              {imageUrls.length ? (
                <img
                  src={imageUrls[0]}
                  alt={item.title}
                  className="block h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-400">
                  Không có hình ảnh
                </div>
              )}
            </div>
            {imageUrls.length > 1 && (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                {imageUrls.map((imageUrl, index) => (
                  <img
                    key={imageUrl}
                    src={imageUrl}
                    alt={`${item.title} ${index + 1}`}
                    className="h-16 w-full rounded-md border border-gray-200 object-cover"
                  />
                ))}
              </div>
            )}
          </div>
        </div>

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
            <div className="flex items-start gap-3">
              <div>
                <span className="font-semibold text-gray-900 block mb-1">
                  Đặc điểm:
                </span>
                <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                  {item.identifying_features || "Không có mô tả chi tiết."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div>
                <span className="font-semibold text-gray-900 mr-2">
                  Thời gian:
                </span>
                <span className="text-sm text-gray-600">
                  {formatDateTime(item.incident_time)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div>
                <span className="font-semibold text-gray-900 mr-2">
                  Địa điểm:
                </span>
                <span className="text-sm text-gray-600">{item.location}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
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
            {/* Vô hiệu hóa nút liên hệ nếu đã đóng luồng */}
            <button
              onClick={handleContactInbox}
              disabled={isResolved}
              className={`flex-1 font-semibold py-3 rounded-lg text-center transition shadow-sm flex items-center justify-center gap-2 ${isResolved ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-red-800 hover:bg-red-900 text-white"}`}
            >
              {isResolved
                ? "Đã hoàn tất kết nối"
                : currentUser?.email === item.user_email
                  ? "Liên hệ quản trị viên"
                  : "Liên hệ tác giả"}
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsShareMenuOpen((isOpen) => !isOpen)}
                className="px-4 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition bg-white shadow-sm"
              >
                Chia sẻ
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

        <div className="md:w-[20%] flex flex-col gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-3 text-sm">Trạng thái</h3>
            {/* Hiển thị box màu tương ứng với trạng thái */}
            <div
              className={`w-full text-center py-2.5 rounded-lg font-bold text-sm border ${getStatusBoxStyle(item.status)}`}
            >
              {item.status || "Đang tìm"}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-10 md:max-w-[80%]">
        <h3 className="font-bold text-gray-800 mb-2">
          Bình luận ({comments.length})
        </h3>

        <div className="mb-8">
          {rootComments.map((comment) => (
            <CommentNode key={comment.id} comment={comment} isReply={false} />
          ))}
          {comments.length === 0 && (
            <p className="text-gray-500 text-sm italic mt-4">
              Chưa có bình luận nào.
            </p>
          )}
        </div>

        <div className="border-t border-gray-100 pt-6">
          {replyingTo && (
            <div className="mb-3 ml-12 bg-gray-100 text-gray-700 text-xs px-3 py-2 rounded-lg flex justify-between items-center w-fit border border-gray-200">
              <span>
                Đang trả lời <b>{replyingTo.user_name}</b>:{" "}
                <i>
                  "{replyingTo.content.substring(0, 30)}
                  {replyingTo.content.length > 30 ? "..." : ""}"
                </i>
              </span>
              <button
                onClick={() => setReplyingTo(null)}
                className="ml-4 font-bold text-gray-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          )}

          <form
            onSubmit={handleSubmitComment}
            className="flex gap-4 items-start"
          >
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold flex-shrink-0 text-gray-500">
              {currentUser ? currentUser.email.charAt(0).toUpperCase() : "?"}
            </div>
            <div className="flex-1 flex gap-2 flex-col sm:flex-row">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-full px-5 py-3 text-sm outline-none focus:border-red-300 transition shadow-inner"
                placeholder={
                  currentUser
                    ? replyingTo
                      ? "Nhập câu trả lời..."
                      : "Viết bình luận mới..."
                    : "Đăng nhập để bình luận"
                }
                disabled={!currentUser}
              />
              <button
                type="submit"
                disabled={!currentUser || !newComment.trim()}
                className="bg-red-800 hover:bg-red-900 text-white px-6 py-3 rounded-full text-sm font-bold transition disabled:opacity-50 whitespace-nowrap shadow-sm"
              >
                Gửi
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
