import { useState, useEffect, useRef } from "react";
import { supabase } from "../../config/supabaseClient";

export default function AdminInbox() {
  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [replyText, setReplyText] = useState("");

  const messagesEndRef = useRef(null); // Dùng để auto-scroll xuống tin nhắn mới nhất
  const fetchConversations = async (adminEmail) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_email.eq.${adminEmail},receiver_email.eq.${adminEmail}`)
      .order("created_at", { ascending: false });

    if (data && !error) {
      const convosMap = new Map();

      data.forEach((msg) => {
        // Xác định ai là người đang chat với admin
        const otherEmail =
          msg.sender_email === adminEmail
            ? msg.receiver_email
            : msg.sender_email;

        // Chỉ lưu tin nhắn đầu tiên gặp (tin nhắn mới nhất) của mỗi người
        if (!convosMap.has(otherEmail)) {
          convosMap.set(otherEmail, {
            email: otherEmail,
            name: otherEmail.split("@")[0], // Lấy phần trước @ làm tên tạm
            lastMessage: msg.content,
            created_at: msg.created_at,
            isUnread: false,
          });
        }
      });

      setConversations(Array.from(convosMap.values()));
    }
  };

  // 1. Khởi tạo: Lấy thông tin user hiện tại và load danh sách hội thoại
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setCurrentUser(session.user);
        fetchConversations(session.user.email);
      }
    });
  }, []);

  // Hàm tự động gom nhóm tin nhắn để tạo list hội thoại bên trái

  // 2. Load lịch sử chat chi tiết khi chọn 1 người ở cột trái
  const fetchChatMessages = async (contactEmail, userEmail) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_email.eq.${userEmail},receiver_email.eq.${contactEmail}),and(sender_email.eq.${contactEmail},receiver_email.eq.${userEmail})`,
      )
      .order("created_at", { ascending: true });

    return data;
  };

  useEffect(() => {
    if (!activeContact || !currentUser) return;

    let isCurrent = true;
    fetchChatMessages(activeContact.email, currentUser.email).then((data) => {
      if (isCurrent) setChatMessages(data ?? []);
    });

    return () => {
      isCurrent = false;
    };
  }, [activeContact, currentUser]);

  // 3. Auto-scroll xuống cuối khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // 4. Lắng nghe Realtime từ Supabase (Có người nhắn là nổi lên ngay)
  useEffect(() => {
    if (!currentUser) return;

    const subscription = supabase
      .channel("public:messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMessage = payload.new;

          // Nếu tin nhắn mới thuộc về cuộc trò chuyện đang mở -> Thêm vào khung chat
          if (
            activeContact &&
            ((newMessage.sender_email === activeContact.email &&
              newMessage.receiver_email === currentUser.email) ||
              (newMessage.sender_email === currentUser.email &&
                newMessage.receiver_email === activeContact.email))
          ) {
            setChatMessages((prev) => [...prev, newMessage]);
          }

          // Cập nhật lại list hội thoại bên trái để hiển thị lastMessage mới
          fetchConversations(currentUser.email);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [currentUser, activeContact]);

  // 5. Xử lý Gửi tin nhắn
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeContact || !currentUser) return;

    const newMsgObj = {
      sender_email: currentUser.email,
      receiver_email: activeContact.email,
      content: replyText.trim(),
    };

    setReplyText(""); // Xóa khung nhập ngay cho mượt

    const { error } = await supabase.from("messages").insert([newMsgObj]);
    if (error) console.error("Lỗi gửi tin nhắn:", error);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-[80vh] flex overflow-hidden">
      {/* Cột trái: Danh sách hội thoại */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col bg-white">
        <div className="p-4 border-b font-bold text-gray-800 bg-gray-50 flex items-center justify-between">
          <span>Hộp thư Inbox</span>
          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
            {conversations.length}
          </span>
        </div>
        <div className="overflow-y-auto flex-1">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400">
              Chưa có tin nhắn nào.
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.email}
                onClick={() => setActiveContact(conv)}
                className={`p-4 border-b cursor-pointer transition ${activeContact?.email === conv.email ? "bg-red-50 border-l-4 border-red-800" : "hover:bg-gray-50"}`}
              >
                <div className="font-bold text-gray-800 text-sm flex justify-between">
                  {conv.name}
                </div>
                <div className="text-xs text-gray-500 truncate mt-1">
                  {conv.lastMessage}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Cột phải: Khung chat chi tiết */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {activeContact ? (
          <>
            <div className="p-4 border-b bg-white font-semibold text-gray-800 shadow-sm flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 text-red-800 rounded-full flex items-center justify-center font-bold">
                {activeContact.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span>{activeContact.name}</span>
                <span className="text-xs text-gray-500 font-normal">
                  {activeContact.email}
                </span>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-400 text-sm mt-4">
                  Bắt đầu cuộc trò chuyện...
                </div>
              ) : (
                chatMessages.map((m) => {
                  const isAdminSending = m.sender_email === currentUser?.email;
                  return (
                    <div
                      key={m.id}
                      className={`flex ${isAdminSending ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`p-3 rounded-xl text-sm max-w-[70%] shadow-sm ${isAdminSending ? "bg-red-800 text-white rounded-br-none" : "bg-white border border-gray-200 text-gray-800 rounded-bl-none"}`}
                      >
                        {m.content}
                      </div>
                    </div>
                  );
                })
              )}
              {/* Thẻ div rỗng để auto-scroll focus vào cuối */}
              <div ref={messagesEndRef} />
            </div>

            <form
              onSubmit={handleSendReply}
              className="p-3 bg-white border-t flex gap-2 items-center"
            >
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Nhập tin nhắn..."
                className="flex-1 border border-gray-300 rounded-full px-5 py-2.5 text-sm outline-none focus:border-red-800 transition shadow-inner"
              />
              <button
                type="submit"
                disabled={!replyText.trim()}
                className="bg-red-800 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-red-900 transition disabled:opacity-50"
              >
                Gửi
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <svg
              className="w-16 h-16 text-gray-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              ></path>
            </svg>
            <p className="text-sm">Chọn một cuộc trò chuyện để xem chi tiết</p>
          </div>
        )}
      </div>
    </div>
  );
}
