import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getRequests,
  acceptRequest,
  rejectRequest,
  getMessages,
  sendMessage,
  markAsRead,
} from "../services/requestService";
import { useAuth } from "../context/AuthContext";
import {
  Inbox,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  MessageCircle,
  X,
  Activity,
  Flame,
  MessageSquare,
  Loader2,
  AlertCircle,
} from "lucide-react";

export default function Requests() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const chatRequestId = searchParams.get("chatRequestId");

  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [activeTab, setActiveTab] = useState("incoming");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ text: "", isError: false });

  // State untuk Real-time Database Private Chat
  const [activeChat, setActiveChat] = useState(null); // { request_id, partner_name, partner_email }
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);
  const messagesEndRef = useRef(null);
  const pollingRef = useRef(null);

  useEffect(() => {
    loadRequests();
  }, []);

  // Otomatis buka chat jika diarahkan dari Notifikasi Lonceng
  useEffect(() => {
    if (chatRequestId && (incoming.length > 0 || outgoing.length > 0)) {
      const targetReq =
        incoming.find((r) => Number(r.request_id) === Number(chatRequestId)) ||
        outgoing.find((r) => Number(r.request_id) === Number(chatRequestId));

      if (targetReq) {
        const partnerName = targetReq.sender_name || targetReq.receiver_name;
        const partnerEmail = targetReq.sender_email || targetReq.receiver_email;
        openPrivateChat(partnerName, partnerEmail, targetReq.request_id);
      }
    }
  }, [chatRequestId, incoming, outgoing]);

  // Polling interval untuk update pesan chat otomatis saat modal terbuka
  useEffect(() => {
    if (activeChat) {
      loadChatMessages(activeChat.request_id);
      pollingRef.current = setInterval(() => {
        loadChatMessages(activeChat.request_id, true);
      }, 2000); // Polling otomatis setiap 2 detik
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [activeChat]);

  const loadRequests = async () => {
    try {
      const res = await getRequests();
      setIncoming(res.incoming || []);
      setOutgoing(res.outgoing || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadChatMessages = async (requestId, isBackground = false) => {
    if (!isBackground) setChatLoading(true);
    try {
      const msgs = await getMessages(requestId);
      setChatMessages(msgs || []);
      if (!isBackground) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } catch (err) {
      console.error("Gagal memuat pesan:", err);
    } finally {
      if (!isBackground) setChatLoading(false);
    }
  };

  const handleAction = async (id, type) => {
    try {
      if (type === "accept") {
        await acceptRequest(id);
        setToast({ text: "Ajakan kolaborasi diterima! Silakan buka Private Chat.", isError: false });
      } else {
        await rejectRequest(id);
        setToast({ text: "Ajakan kolaborasi ditolak.", isError: false });
      }
      loadRequests();
    } catch (err) {
      setToast({ text: err.response?.data?.message || "Gagal memproses permintaan.", isError: true });
    }
  };

  // Buka Private Chat
  const openPrivateChat = (partnerName, partnerEmail, requestId) => {
    setActiveChat({
      request_id: requestId,
      partner_name: partnerName,
      partner_email: partnerEmail,
    });
    // Tandai pesan sebagai dibaca agar lonceng notifikasi berkurang
    markAsRead(requestId).catch((err) => console.error(err));
  };

  // Kirim Pesan Real-time ke Database
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim() || !activeChat || sendingMsg) return;

    const messageText = newMessage.trim();
    setNewMessage("");
    setSendingMsg(true);

    try {
      await sendMessage(activeChat.request_id, messageText);
      await loadChatMessages(activeChat.request_id, true);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 80);
    } catch (err) {
      setToast({
        text: err.response?.data?.message || "Gagal mengirim pesan. Pastikan backend sudah di-restart.",
        isError: true,
      });
    } finally {
      setSendingMsg(false);
    }
  };

  const sendQuickIcebreaker = (text) => {
    setNewMessage(text);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Ajakan Main & Real-time Chat
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              Pesan di Private Chat tersinkronisasi langsung ke akun partner melalui database!
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-800 mb-6 gap-6">
        <button
          onClick={() => setActiveTab("incoming")}
          className={`pb-3 text-xs sm:text-sm font-bold tracking-wide transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "incoming"
              ? "text-emerald-400 border-b-2 border-emerald-500"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Inbox size={16} /> Ajakan Masuk ({incoming.length})
        </button>
        <button
          onClick={() => setActiveTab("outgoing")}
          className={`pb-3 text-xs sm:text-sm font-bold tracking-wide transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "outgoing"
              ? "text-emerald-400 border-b-2 border-emerald-500"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Send size={15} /> Ajakan Terkirim ({outgoing.length})
        </button>
      </div>

      {/* Content List */}
      {loading ? (
        <div className="text-center py-16 text-slate-500 text-sm">Memuat riwayat ajakan hobi...</div>
      ) : activeTab === "incoming" ? (
        incoming.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-slate-800 rounded-3xl text-slate-500 text-xs p-6">
            Belum ada ajakan latihan olahraga yang masuk.
          </div>
        ) : (
          <div className="space-y-3.5">
            {incoming.map((req) => (
              <div
                key={req.request_id}
                className="sport-card rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-base shrink-0 shadow-md shadow-emerald-500/20">
                    {req.sender_name ? req.sender_name.slice(0, 2).toUpperCase() : "U"}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-sm">{req.sender_name}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Mail size={12} className="text-slate-500" /> {req.sender_email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {req.status === "pending" ? (
                    <>
                      <button
                        onClick={() => handleAction(req.request_id, "accept")}
                        className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                      >
                        <CheckCircle2 size={15} /> Terima
                      </button>
                      <button
                        onClick={() => handleAction(req.request_id, "reject")}
                        className="flex items-center gap-1.5 bg-slate-900 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-800 text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
                      >
                        <XCircle size={15} /> Tolak
                      </button>
                    </>
                  ) : req.status === "accepted" ? (
                    <button
                      onClick={() =>
                        openPrivateChat(req.sender_name, req.sender_email, req.request_id)
                      }
                      className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/25 transition-all cursor-pointer animate-pulse"
                    >
                      <MessageCircle size={16} />
                      Buka Private Chat
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-400/10 px-3 py-1 rounded-full border border-rose-400/20 text-xs font-medium">
                      <XCircle size={13} /> Ditolak
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : outgoing.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-800 rounded-3xl text-slate-500 text-xs p-6">
          Belum ada ajakan yang kamu kirimkan ke orang lain.
        </div>
      ) : (
        <div className="space-y-3.5">
          {outgoing.map((req) => (
            <div
              key={req.request_id}
              className="sport-card rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-slate-300 text-base shrink-0">
                  {req.receiver_name ? req.receiver_name.slice(0, 2).toUpperCase() : "U"}
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-sm">{req.receiver_name}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <Mail size={12} className="text-slate-500" /> {req.receiver_email}
                  </p>
                </div>
              </div>

              <div>
                {req.status === "pending" && (
                  <span className="inline-flex items-center gap-1 text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20 text-xs font-semibold">
                    <Clock size={13} /> Menunggu Jawaban
                  </span>
                )}
                {req.status === "accepted" && (
                  <button
                    onClick={() =>
                      openPrivateChat(req.receiver_name, req.receiver_email, req.request_id)
                    }
                    className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-black px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/25 transition-all cursor-pointer animate-pulse"
                  >
                    <MessageCircle size={16} />
                    Buka Private Chat
                  </button>
                )}
                {req.status === "rejected" && (
                  <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-400/10 px-3 py-1 rounded-full border border-rose-400/20 text-xs font-medium">
                    <XCircle size={13} /> Ditolak
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PRIVATE CHAT MODAL DENGAN DATABASE SINKRON */}
      {activeChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg h-[620px] flex flex-col sport-card border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden">
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-sm">
                    {activeChat.partner_name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full"></span>
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-sm leading-tight flex items-center gap-1.5">
                    {activeChat.partner_name}
                    <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold uppercase">
                      Live Sync
                    </span>
                  </h3>
                  <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Tersambung ke Database
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Halo ${activeChat.partner_name}, ini partner kamu dari PartnerUp Sport!`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  title="Lanjut Chat di WhatsApp"
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 transition-all"
                >
                  <MessageSquare size={13} /> WA
                </a>
                <button
                  onClick={() => setActiveChat(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/60">
              {chatLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs gap-2">
                  <Loader2 className="animate-spin text-emerald-400" size={20} />
                  Memuat riwayat percakapan...
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 text-xs px-6">
                  <Flame size={28} className="text-emerald-500/40 mb-2" />
                  <p className="font-bold text-slate-300">Mulai percakapan pertamamu!</p>
                  <p className="text-[11px] mt-1">
                    Ketik pesan atau klik opsi cepat di bawah untuk membuat jadwal latihan.
                  </p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMe = Number(msg.sender_id) === Number(user?.user_id);
                  const formattedTime = new Date(msg.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  return (
                    <div
                      key={msg.message_id || Math.random()}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                          isMe
                            ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-semibold rounded-br-none shadow-md shadow-emerald-500/15"
                            : "bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none"
                        }`}
                      >
                        {msg.message}
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 px-1">
                        {isMe ? "Kamu" : msg.sender_name || activeChat.partner_name} • {formattedTime}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Icebreakers */}
            <div className="px-3 py-2 bg-slate-900/50 border-t border-slate-800 flex gap-1.5 overflow-x-auto text-[11px] scrollbar-none">
              <span className="text-slate-500 text-[10px] shrink-0 self-center">Pesan Cepat:</span>
              <button
                type="button"
                onClick={() => sendQuickIcebreaker("Halo! Kapan ada waktu luang buat latihan bareng?")}
                className="px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-emerald-300 shrink-0 cursor-pointer"
              >
                🏸 Kapan bisa main?
              </button>
              <button
                type="button"
                onClick={() => sendQuickIcebreaker("Boleh share nomor WhatsApp kamu biar gampang koordinasi?")}
                className="px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-emerald-300 shrink-0 cursor-pointer"
              >
                📱 Minta nomor WA
              </button>
              <button
                type="button"
                onClick={() => sendQuickIcebreaker("Weekend ini gas latihan bareng?")}
                className="px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-emerald-300 shrink-0 cursor-pointer"
              >
                🔥 Weekend gas main?
              </button>
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={`Ketik pesan untuk ${activeChat.partner_name}...`}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sendingMsg}
                className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 transition-all cursor-pointer disabled:opacity-40"
              >
                {sendingMsg ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>
          </div>
        </div>
      )}

      {toast.text && (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-2xl border px-4 py-3 text-xs shadow-2xl flex items-center gap-2 animate-bounce ${
            toast.isError
              ? "bg-rose-950/90 border-rose-500/40 text-rose-300"
              : "bg-slate-900 border-emerald-500/40 text-emerald-300"
          }`}
        >
          {toast.isError ? <AlertCircle size={16} className="text-rose-400" /> : <CheckCircle2 size={16} className="text-emerald-400" />}
          {toast.text}
        </div>
      )}
    </div>
  );
}