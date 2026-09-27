import { useState, useEffect, useRef } from "react";
import { supabase } from "../../config/supabaseClient";

export default function AdminInbox() {
  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null); // Quản lý trạng thái Reply

  const messagesEndRef = useRef(null);

  // Lấy danh sách hội thoại và map với bảng users để lấy full_name
  const fetchConversations = async (adminEmail) => {
    const { data: messagesData, error: messagesError } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_email.eq.${adminEmail},receiver_email.eq.${adminEmail}`)
      .order("created_at", { ascending: false });

    if (messagesData && !messagesError) {
      const convosMap = new Map();
      const uniqueEmails = new Set();

      messagesData.forEach((msg) => {
        const otherEmail =
          msg.sender_email === adminEmail
            ? msg.receiver_email
            : msg.sender_email;
        uniqueEmails.add(otherEmail);

        if (!convosMap.has(otherEmail)) {
          convosMap.set(otherEmail, {
            email: otherEmail,
            name: otherEmail.split("@")[0], // Fallback name
            lastMessage: msg.content,
            created_at: msg.created_at,
            isUnread: false,
          });
        }
      });

      // Truy vấn bảng users để lấy full_name
      if (uniqueEmails.size > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("email, full_name")
          .in("email", Array.from(uniqueEmails));

        if (usersData && !usersError) {
          usersData.forEach((user) => {
            if (convosMap.has(user.email) && user.full_name) {
              const convoInfo = convosMap.get(user.email);
              convoInfo.name = user.full_name;
            }
          });
        }
      }

      setConversations(Array.from(convosMap.values()));
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setCurrentUser(session.user);
        fetchConversations(session.user.email);
      }
    });
  }, []);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    if (!currentUser) return;

    const subscription = supabase
      .channel("public:messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMessage = payload.new;

          if (
            activeContact &&
            ((newMessage.sender_email === activeContact.email &&
              newMessage.receiver_email === currentUser.email) ||
              (newMessage.sender_email === currentUser.email &&
                newMessage.receiver_email === activeContact.email))
          ) {
            setChatMessages((prev) => [...prev, newMessage]);
          }

          fetchConversations(currentUser.email);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [currentUser, activeContact]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeContact || !currentUser) return;

    const newMsgObj = {
      sender_email: currentUser.email,
      receiver_email: activeContact.email,
      content: replyText.trim(),
      reply_to_id: replyingTo ? replyingTo.id : null, // Gắn ID tin nhắn được reply
    };

    setReplyText("");
    setReplyingTo(null);

    const { error } = await supabase.from("messages").insert([newMsgObj]);
    if (error) console.error("Lỗi gửi tin nhắn:", error);
  };

  return (
    <div className="flex h-[80vh] min-h-[32rem] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm md:flex-row">
      {/* Cột trái: Danh sách hội thoại */}
      <div className="flex h-2/5 w-full flex-col border-b border-gray-200 bg-white md:h-auto md:w-1/3 md:border-b-0 md:border-r">
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
      <div className="min-h-0 flex-1 flex flex-col bg-gray-50">
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
                  const repliedMsg = m.reply_to_id
                    ? chatMessages.find((msg) => msg.id === m.reply_to_id)
                    : null;

                  return (
                    <div
                      key={m.id}
                      className={`flex ${isAdminSending ? "justify-end" : "justify-start"} group relative items-center`}
                    >
                      {/* Nút Reply - Cho tin nhắn của khách */}
                      {!isAdminSending && (
                        <button
                          onClick={() => setReplyingTo(m)}
                          className="opacity-0 group-hover:opacity-100 transition-all p-2 mx-2 rounded-full hover:bg-gray-200 text-gray-400 flex-shrink-0"
                          title="Trả lời"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                            ></path>
                          </svg>
                        </button>
                      )}

                      <div className="flex flex-col max-w-[70%]">
                        {/* Khối trích dẫn (Reply) */}
                        {repliedMsg && (
                          <div
                            className={`mb-1 p-2 rounded-lg text-xs opacity-75 border-l-2 ${isAdminSending ? "bg-red-900/20 border-white text-white" : "bg-gray-200 border-gray-400 text-gray-600"}`}
                          >
                            <span className="font-bold block mb-1">
                              {repliedMsg.sender_email === currentUser.email
                                ? "Quản trị viên"
                                : activeContact.name}
                            </span>
                            <span className="truncate block">
                              {repliedMsg.content}
                            </span>
                          </div>
                        )}

                        {/* Nội dung tin nhắn chính */}
                        <div
                          className={`p-3 rounded-xl text-sm shadow-sm ${isAdminSending ? "bg-red-800 text-white rounded-br-none" : "bg-white border border-gray-200 text-gray-800 rounded-bl-none"}`}
                        >
                          {m.content}
                        </div>
                      </div>

                      {/* Nút Reply - Cho tin nhắn của admin */}
                      {isAdminSending && (
                        <button
                          onClick={() => setReplyingTo(m)}
                          className="opacity-0 group-hover:opacity-100 transition-all p-2 mx-2 rounded-full hover:bg-gray-200 text-gray-400 flex-shrink-0"
                          title="Trả lời"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                            ></path>
                          </svg>
                        </button>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="bg-white border-t border-gray-200 flex flex-col">
              {/* Thanh báo đang trả lời */}
              {replyingTo && (
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex justify-between items-center text-sm">
                  <div className="flex flex-col overflow-hidden pr-2">
                    <span className="font-semibold text-gray-700 text-xs">
                      Đang trả lời{" "}
                      {replyingTo.sender_email === currentUser.email
                        ? "chính bạn"
                        : activeContact.name}
                    </span>
                    <span className="text-gray-500 truncate">
                      {replyingTo.content}
                    </span>
                  </div>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="p-1 text-gray-400 hover:text-red-500 transition"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      ></path>
                    </svg>
                  </button>
                </div>
              )}

              <form
                onSubmit={handleSendReply}
                className="p-3 flex gap-2 items-center"
              >
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Nhập câu trả lời..."
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
            </div>
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
