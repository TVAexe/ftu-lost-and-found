import { useState, useEffect, useRef } from "react";
import { supabase } from "../config/supabaseClient";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePopup } from "../components/PopupProvider";

export default function Inbox() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showPopup } = usePopup();
  const [currentUser, setCurrentUser] = useState(null);

  // Danh sách những người đã nhắn tin
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);

  // Tin nhắn của cuộc hội thoại đang mở
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);
  
  // State quản lý Reply
  const [replyingTo, setReplyingTo] = useState(null);

  // State quản lý Swipe to Reply trên Mobile
  const [swipeState, setSwipeState] = useState({ id: null, offset: 0 });
  const touchStartRef = useRef(0);

  const loadMessages = async (contactEmail) => {
    setActiveContact(contactEmail);
    const myEmail = currentUser.email;

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_email.eq.${myEmail},receiver_email.eq.${contactEmail}),and(sender_email.eq.${contactEmail},receiver_email.eq.${myEmail})`,
      )
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data);
      scrollToBottom();
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const fetchContacts = async (myEmail) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_email.eq.${myEmail},receiver_email.eq.${myEmail}`)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const uniqueEmails = new Set();
      data.forEach((msg) => {
        const contactEmail =
          msg.sender_email === myEmail ? msg.receiver_email : msg.sender_email;
        uniqueEmails.add(contactEmail);
      });
      setContacts(Array.from(uniqueEmails));
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setCurrentUser(session.user);
        fetchContacts(session.user.email);
      } else {
        navigate("/login");
      }
    });
  }, [navigate]);

  useEffect(() => {
    const contactEmail = searchParams.get("contact");
    if (currentUser && contactEmail && contactEmail !== currentUser.email) {
      const initLoad = async () => {
        await loadMessages(contactEmail);
      };
      initLoad();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, searchParams]);

  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel("realtime-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMsg = payload.new;
          if (
            newMsg.sender_email === currentUser.email ||
            newMsg.receiver_email === currentUser.email
          ) {
            if (
              activeContact &&
              (newMsg.sender_email === activeContact ||
                newMsg.receiver_email === activeContact)
            ) {
              setMessages((prev) => [...prev, newMsg]);
              scrollToBottom();
            } else {
              fetchContacts(currentUser.email);
            }
          }
        },
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [currentUser, activeContact]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeContact) return;

    const newMsg = {
      sender_email: currentUser.email,
      receiver_email: activeContact,
      content: inputText.trim(),
      reply_to_id: replyingTo ? replyingTo.id : null, // Gắn ID tin nhắn gốc
    };

    setInputText("");
    setReplyingTo(null); // Xóa state reply sau khi gửi

    const { error } = await supabase.from("messages").insert([newMsg]);
    if (error) showPopup("Lỗi gửi tin: " + error.message, "error");
  };

  // --- Xử lý sự kiện vuốt (Swipe) ---
  const handleTouchStart = (e, msgId) => {
    touchStartRef.current = e.targetTouches[0].clientX;
    setSwipeState({ id: msgId, offset: 0 });
  };

  const handleTouchMove = (e, msgId) => {
    if (swipeState.id !== msgId) return;
    const currentX = e.targetTouches[0].clientX;
    const diff = currentX - touchStartRef.current;
    
    // Giới hạn chỉ cho phép vuốt sang phải tối đa 60px
    if (diff > 0 && diff <= 60) {
      setSwipeState({ id: msgId, offset: diff });
    }
  };

  const handleTouchEnd = (msg) => {
    if (swipeState.id === msg.id && swipeState.offset > 40) {
      setReplyingTo(msg);
    }
    setSwipeState({ id: null, offset: 0 });
  };

  if (!currentUser) return null;

  return (
    <div className="max-w-6xl mx-auto p-4 h-[calc(100vh-100px)] flex">
      {/* Khung bên ngoài */}
      <div className="w-full bg-white border border-gray-200 rounded-xl shadow-sm flex overflow-hidden">
        {/* Cột trái: Sidebar */}
        <div className="hidden md:flex w-1/3 border-r border-gray-200 flex-col bg-white">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Tin nhắn</h2>
            <div className="relative">
              <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              <input type="text" placeholder="Tìm kiếm người dùng..." className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm outline-none focus:border-red-300" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {contacts.length === 0 ? (
              <p className="text-center text-sm text-gray-400 mt-10">Chưa có cuộc trò chuyện nào</p>
            ) : (
              contacts.map((contactEmail) => (
                <div
                  key={contactEmail}
                  onClick={() => loadMessages(contactEmail)}
                  className={`p-4 flex items-center gap-3 cursor-pointer transition ${activeContact === contactEmail ? "bg-red-50 border-l-4 border-red-800" : "hover:bg-gray-50 border-l-4 border-transparent"}`}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex-shrink-0 flex items-center justify-center text-white font-bold">
                    {contactEmail.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-semibold truncate ${activeContact === contactEmail ? "text-red-900" : "text-gray-900"}`}>{contactEmail.split("@")[0]}</h4>
                    <p className="text-xs text-gray-500 truncate">Nhấn để xem tin nhắn</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cột phải: Khung Chat */}
        {activeContact ? (
          <div className="w-full md:w-2/3 flex flex-col bg-gray-50/50">
            {/* Header */}
            <div className="p-4 bg-white border-b border-gray-200 flex items-center gap-3">
              <button className="md:hidden p-2 text-gray-500" onClick={() => setActiveContact(null)}>
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
              </button>
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold">
                {activeContact.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-gray-800">{activeContact.split("@")[0]}</h3>
                <span className="text-xs text-green-500 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span> Đang online
                </span>
              </div>
            </div>

            {/* Khung Tin Nhắn */}
            <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 overflow-x-hidden">
              {messages.map((msg) => {
                const isMe = msg.sender_email === currentUser.email;
                const isSwiping = swipeState.id === msg.id;
                
                // Tìm tin nhắn gốc nếu có reply_to_id
                const repliedMsg = msg.reply_to_id ? messages.find(m => m.id === msg.reply_to_id) : null;

                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} group relative items-center`}>
                    
                    {/* Nút Reply (Desktop) - Cho người khác */}
                    {!isMe && (
                      <button 
                        onClick={() => setReplyingTo(msg)}
                        title="Trả lời" 
                        className="hidden md:flex opacity-0 group-hover:opacity-100 transition-all p-2 mx-2 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-700 flex-shrink-0 items-center justify-center cursor-pointer"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
                      </button>
                    )}

                    {/* Icon mũi tên hiện ra khi vuốt (Mobile) */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400 opacity-0 transition-opacity" style={{ opacity: isSwiping ? swipeState.offset / 40 : 0 }}>
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
                    </div>

                    {/* Khối tin nhắn có thể vuốt */}
                    <div 
                      className="flex flex-col max-w-[75%] transition-transform duration-75 ease-out"
                      style={{ transform: `translateX(${isSwiping ? swipeState.offset : 0}px)` }}
                      onTouchStart={(e) => handleTouchStart(e, msg.id)}
                      onTouchMove={(e) => handleTouchMove(e, msg.id)}
                      onTouchEnd={() => handleTouchEnd(msg)}
                    >
                      {/* Box Trích dẫn */}
                      {repliedMsg && (
                        <div className={`mb-1 p-2 rounded-lg text-xs opacity-75 border-l-2 ${isMe ? "bg-red-900/20 border-white text-white" : "bg-gray-200 border-gray-400 text-gray-600"}`}>
                          <span className="font-bold block mb-1">
                            {repliedMsg.sender_email === currentUser.email ? "Bạn" : repliedMsg.sender_email.split('@')[0]}
                          </span>
                          <span className="truncate block">{repliedMsg.content}</span>
                        </div>
                      )}

                      {/* Nội dung tin nhắn chính */}
                      <div className={`p-3 text-sm rounded-2xl ${isMe ? "bg-red-800 text-white rounded-tr-sm" : "bg-gray-100 text-gray-800 rounded-tl-sm"}`}>
                        {msg.content}
                      </div>
                    </div>

                    {/* Nút Reply (Desktop) - Cho chính mình */}
                    {isMe && (
                      <button 
                        onClick={() => setReplyingTo(msg)}
                        title="Trả lời" 
                        className="hidden md:flex opacity-0 group-hover:opacity-100 transition-all p-2 mx-2 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-700 flex-shrink-0 items-center justify-center cursor-pointer"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
                      </button>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Vùng nhập liệu */}
            <div className="bg-white border-t border-gray-200 flex flex-col">
              
              {/* Thanh báo "Đang trả lời" */}
              {replyingTo && (
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex justify-between items-center text-sm">
                  <div className="flex flex-col overflow-hidden pr-2">
                    <span className="font-semibold text-gray-700 text-xs">
                      Đang trả lời {replyingTo.sender_email === currentUser.email ? "chính bạn" : replyingTo.sender_email.split('@')[0]}
                    </span>
                    <span className="text-gray-500 truncate">{replyingTo.content}</span>
                  </div>
                  <button onClick={() => setReplyingTo(null)} className="p-1 text-gray-400 hover:text-red-500 transition">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>
              )}

              {/* Ô Input */}
              <div className="p-3 md:p-4">
                <form onSubmit={handleSend} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 md:px-5 md:py-3 text-sm outline-none focus:border-red-300 transition"
                  />
                  <button type="submit" disabled={!inputText.trim()} className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 rounded-full bg-red-800 flex items-center justify-center text-white hover:bg-red-900 transition disabled:bg-gray-300 shadow-sm">
                    <svg className="w-4 h-4 md:w-5 md:h-5 ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex w-2/3 flex-col items-center justify-center bg-gray-50/50 text-gray-400">
             <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
             <p>Chọn một cuộc trò chuyện để bắt đầu</p>
          </div>
        )}
      </div>
    </div>
  );
}