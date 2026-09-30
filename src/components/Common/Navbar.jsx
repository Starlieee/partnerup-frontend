import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Users,
  Inbox,
  UserCircle,
  LogOut,
  Flame,
  Menu,
  X,
  Bell,
  MessageCircle,
  CheckCheck,
  Sparkles,
  ExternalLink,
  Check,
  Volume2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getNotifications,
  markAsRead,
  markAllNotificationsRead,
} from "../../services/requestService";

// Efek audio notifikasi berbasis Web Audio API (ringan & instan tanpa file MP3)
const playChime = (type = "ring") => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === "ring") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === "read") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    }
  } catch (e) {
    // browser audio policy handling
  }
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // State Notifikasi
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'chat' | 'request'
  const [isRinging, setIsRinging] = useState(false);
  const notifRef = useRef(null);
  const prevCountRef = useRef(0);

  // Polling notifikasi setiap 3.5 detik saat user login
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const fetchNotifs = async () => {
      try {
        const data = await getNotifications();
        const count = data.unreadCount || 0;
        setNotifications(data.notifications || []);
        setUnreadCount(count);

        // Jika ada notifikasi baru yang masuk, getarkan lonceng & bunyikan suara
        if (count > prevCountRef.current && prevCountRef.current >= 0) {
          setIsRinging(true);
          playChime("ring");
          setTimeout(() => setIsRinging(false), 700);
        }
        prevCountRef.current = count;
      } catch (err) {
        // Backend silent polling
      }
    };

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 3500);
    return () => clearInterval(interval);
  }, [user]);

  // Tutup panel jika klik di luar
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifPanel(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handler klik tombol lonceng utama
  const handleToggleBell = () => {
    setIsRinging(true);
    playChime("ring");
    setTimeout(() => setIsRinging(false), 600);
    setShowNotifPanel((prev) => !prev);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Navigasi langsung saat item notifikasi diklik
  const handleNotificationClick = async (notif) => {
    setShowNotifPanel(false);
    playChime("read");

    if (notif.type === "message") {
      try {
        await markAsRead(notif.request_id);
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setNotifications((prev) =>
          prev.filter((item) => item.message_id !== notif.message_id)
        );
      } catch (err) {
        console.error(err);
      }
      navigate(`/requests?chatRequestId=${notif.request_id}`);
    } else {
      navigate("/requests");
    }
  };

  // Tandai satu pesan sebagai dibaca langsung dari kartu
  const handleMarkSingleRead = async (e, notif) => {
    e.stopPropagation();
    playChime("read");
    try {
      if (notif.type === "message") {
        await markAsRead(notif.request_id);
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setNotifications((prev) =>
          prev.filter((item) => item.message_id !== notif.message_id)
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Tandai semua dibaca
  const handleMarkAllRead = async () => {
    playChime("read");
    try {
      await markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: 1 }))
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Filter notifikasi sesuai tab aktif
  const filteredNotifs = notifications.filter((notif) => {
    if (activeTab === "chat") return notif.type === "message";
    if (activeTab === "request") return notif.type === "request";
    return true;
  });

  const chatCount = notifications.filter((n) => n.type === "message").length;
  const requestCount = notifications.filter((n) => n.type === "request").length;

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-semibold tracking-wide transition-all ${
      isActive
        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 glow-pill-active"
        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand Logo Sporty */}
        <NavLink to="/partners" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Flame size={20} className="fill-slate-950" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-extrabold tracking-tight text-white flex items-center gap-1 leading-none">
              Partner<span className="text-emerald-400">Up</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ml-1 border border-emerald-500/30">
                Sport
              </span>
            </span>
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-0.5">
              Hobby & Sparring Hub
            </span>
          </div>
        </NavLink>

        {/* Desktop Menu */}
        {user ? (
          <>
            <nav className="hidden md:flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-slate-800/80">
              <NavLink to="/partners" className={navLinkClass}>
                <Users size={15} /> Cari Teman Hobi
              </NavLink>
              <NavLink to="/requests" className={navLinkClass}>
                <Inbox size={15} /> Ajakan Main & Chat
              </NavLink>
              <NavLink to="/profile" className={navLinkClass}>
                <UserCircle size={15} /> Profil Olahraga
              </NavLink>
            </nav>

            <div className="hidden md:flex items-center gap-3">
              {/* TOMBOL LONCENG NOTIFIKASI INTERAKTIF */}
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={handleToggleBell}
                  className={`relative p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-center ${
                    showNotifPanel
                      ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-lg shadow-emerald-500/20 scale-105"
                      : unreadCount > 0
                      ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-md shadow-emerald-500/15 hover:scale-105"
                      : "bg-slate-900/90 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 hover:bg-slate-800"
                  }`}
                  title="Notifikasi Lonceng"
                >
                  <Bell
                    size={19}
                    className={`transition-transform ${isRinging ? "animate-bell-ring text-emerald-400" : ""}`}
                  />

                  {/* Badge Angka Notifikasi Mengambang */}
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 text-[10px] font-black text-white shadow-lg shadow-rose-500/40 animate-pulse">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* PANEL POPUP NOTIFIKASI INTERAKTIF */}
                {showNotifPanel && (
                  <div className="absolute right-0 mt-3 w-84 sm:w-[420px] sport-card border border-slate-700/90 rounded-3xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                    {/* Header Panel */}
                    <div className="p-4 bg-slate-900/95 border-b border-slate-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                            <Bell size={15} />
                          </div>
                          <div>
                            <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                              Pemberitahuan
                              {unreadCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  {unreadCount} Baru
                                </span>
                              )}
                            </h3>
                          </div>
                        </div>

                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={handleMarkAllRead}
                            className="text-[11px] font-bold text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700/60 cursor-pointer"
                          >
                            <CheckCheck size={13} className="text-emerald-400" /> Tandai Semua Dibaca
                          </button>
                        )}
                      </div>

                      {/* Tab Filter Notifikasi */}
                      <div className="mt-3 flex items-center gap-1.5 p-1 bg-slate-950/70 rounded-xl border border-slate-800">
                        <button
                          type="button"
                          onClick={() => setActiveTab("all")}
                          className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            activeTab === "all"
                              ? "bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          Semua ({notifications.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab("chat")}
                          className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            activeTab === "chat"
                              ? "bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          💬 Chat ({chatCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab("request")}
                          className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            activeTab === "request"
                              ? "bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30"
                              : "text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          🔥 Ajakan ({requestCount})
                        </button>
                      </div>
                    </div>

                    {/* Body Daftar Notifikasi */}
                    <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-800/60 bg-slate-950/90">
                      {filteredNotifs.length === 0 ? (
                        <div className="py-12 px-6 text-center text-slate-500">
                          <Sparkles size={28} className="mx-auto mb-2 text-slate-600" />
                          <p className="text-xs font-bold text-slate-300">Tidak ada notifikasi baru</p>
                          <p className="text-[11px] text-slate-500 mt-1">
                            {activeTab === "all"
                              ? "Semua pesan dan ajakan latihan sudah terbaca rapi!"
                              : `Belum ada ${activeTab === "chat" ? "pesan chat" : "ajakan sparring"} yang masuk.`}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setShowNotifPanel(false);
                              navigate("/partners");
                            }}
                            className="mt-3 px-3.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 text-[11px] font-bold transition-all cursor-pointer"
                          >
                            Temukan Partner Sekarang ➔
                          </button>
                        </div>
                      ) : (
                        filteredNotifs.map((notif, idx) => {
                          const isMessage = notif.type === "message";
                          const formattedTime = new Date(notif.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          });

                          return (
                            <div
                              key={notif.message_id || `notif_${idx}`}
                              onClick={() => handleNotificationClick(notif)}
                              className="p-3.5 hover:bg-slate-900/90 transition-all cursor-pointer flex items-start justify-between gap-3 group relative border-l-2 border-l-emerald-500 bg-emerald-500/[0.03]"
                            >
                              <div className="flex items-start gap-3 min-w-0">
                                <div
                                  className={`h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center font-black text-xs shadow-md ${
                                    isMessage
                                      ? "bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-emerald-500/15"
                                      : "bg-gradient-to-tr from-amber-500 to-orange-400 text-slate-950 shadow-amber-500/15"
                                  }`}
                                >
                                  {isMessage ? (
                                    <MessageCircle size={18} />
                                  ) : (
                                    <Flame size={18} className="fill-slate-950" />
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-xs font-black text-white truncate">
                                      {notif.sender_name}
                                    </h4>
                                    <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider bg-slate-800 text-slate-400">
                                      {isMessage ? "Pesan Chat" : "Ajakan"}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-200 line-clamp-2 mt-1 font-medium leading-snug">
                                    {isMessage ? `"${notif.message}"` : notif.message}
                                  </p>
                                  <div className="mt-2 flex items-center gap-2">
                                    <span className="text-[10px] text-emerald-400 font-bold group-hover:underline flex items-center gap-1">
                                      {isMessage ? "Buka Obrolan" : "Buka Permintaan"}
                                      <ExternalLink size={10} />
                                    </span>
                                    <span className="text-[10px] text-slate-500">• {formattedTime}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Tombol aksi cepat tandai dibaca per item */}
                              {isMessage && (
                                <button
                                  type="button"
                                  onClick={(e) => handleMarkSingleRead(e, notif)}
                                  title="Tandai telah dibaca"
                                  className="shrink-0 p-1.5 rounded-xl text-slate-500 hover:text-emerald-400 hover:bg-slate-800 transition-all cursor-pointer"
                                >
                                  <Check size={14} />
                                </button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Footer Panel */}
                    <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 px-4">
                      <span className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Volume2 size={12} className="text-emerald-400" /> Efek suara aktif
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNotifPanel(false);
                          navigate("/requests");
                        }}
                        className="font-bold text-emerald-400 hover:text-emerald-300 cursor-pointer"
                      >
                        Lihat Halaman Chat ➔
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Widget */}
              <div className="flex items-center gap-2 pl-2">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-xs font-bold text-emerald-400">
                  {user.name ? user.name.slice(0, 2).toUpperCase() : "SP"}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-200 max-w-[120px] truncate leading-tight">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Siap Mabar
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                title="Keluar"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-medium text-slate-400 hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <LogOut size={14} />
                <span>Keluar</span>
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2.5">
            <NavLink
              to="/login"
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Masuk
            </NavLink>
            <NavLink
              to="/register"
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
            >
              Gabung Sekarang
            </NavLink>
          </div>
        )}

        {/* Mobile menu button */}
        {user && (
          <div className="flex items-center gap-2 md:hidden">
            {/* Lonceng Mobile Interaktif */}
            <button
              type="button"
              onClick={handleToggleBell}
              className={`relative p-2.5 rounded-xl border transition-all cursor-pointer ${
                showNotifPanel
                  ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <Bell size={18} className={isRinging ? "animate-bell-ring text-emerald-400" : ""} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-md animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white cursor-pointer"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        )}
      </div>

      {/* Panel Notifikasi Mobile (Modal Pop-in jika di Layar Kecil) */}
      {user && showNotifPanel && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col justify-end p-3 animate-in fade-in duration-150">
          <div className="sport-card border border-slate-700 rounded-3xl overflow-hidden max-h-[80vh] flex flex-col">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-white text-sm">
                <Bell size={16} className="text-emerald-400" />
                Notifikasi ({unreadCount} baru)
              </div>
              <button
                type="button"
                onClick={() => setShowNotifPanel(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tab Filter Mobile */}
            <div className="p-2 bg-slate-900/50 border-b border-slate-800 flex gap-1 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`flex-1 py-1.5 rounded-xl font-bold ${
                  activeTab === "all" ? "bg-emerald-500 text-slate-950" : "text-slate-400"
                }`}
              >
                Semua ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("chat")}
                className={`flex-1 py-1.5 rounded-xl font-bold ${
                  activeTab === "chat" ? "bg-emerald-500 text-slate-950" : "text-slate-400"
                }`}
              >
                💬 Chat ({chatCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("request")}
                className={`flex-1 py-1.5 rounded-xl font-bold ${
                  activeTab === "request" ? "bg-emerald-500 text-slate-950" : "text-slate-400"
                }`}
              >
                🔥 Ajakan ({requestCount})
              </button>
            </div>

            <div className="overflow-y-auto p-2 space-y-2 flex-1">
              {filteredNotifs.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-500">
                  Tidak ada notifikasi baru 🎉
                </div>
              ) : (
                filteredNotifs.map((notif, idx) => (
                  <div
                    key={notif.message_id || `mobile_notif_${idx}`}
                    onClick={() => handleNotificationClick(notif)}
                    className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white">{notif.sender_name}</h4>
                      <p className="text-xs text-slate-300 line-clamp-1 mt-0.5">{notif.message}</p>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-bold shrink-0">Buka ➔</span>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-xs font-bold text-emerald-400"
                >
                  Tandai Semua Dibaca
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowNotifPanel(false);
                  navigate("/requests");
                }}
                className="text-xs font-bold text-slate-400 hover:text-white ml-auto"
              >
                Ke Halaman Chat ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Drawer */}
      {user && mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950 px-4 py-3 space-y-2">
          <NavLink
            to="/partners"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800"
          >
            <Users size={16} className="text-emerald-400" /> Cari Teman Hobi
          </NavLink>
          <NavLink
            to="/requests"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800"
          >
            <div className="flex items-center gap-2.5">
              <Inbox size={16} className="text-emerald-400" /> Ajakan Main & Chat
            </div>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-[10px] font-bold text-white">
                {unreadCount} baru
              </span>
            )}
          </NavLink>
          <NavLink
            to="/profile"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800"
          >
            <UserCircle size={16} className="text-emerald-400" /> Profil Olahraga
          </NavLink>
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">{user.name}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-semibold text-rose-400"
            >
              <LogOut size={14} /> Keluar
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;