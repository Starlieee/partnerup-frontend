import { useEffect, useState } from "react";
import {
  Search,
  MapPin,
  Send,
  CheckCircle2,
  Loader2,
  Users,
  Flame,
  X,
  Trophy,
  Activity,
  Zap,
  Sparkles,
} from "lucide-react";
import * as partnerService from "../services/partnerService";
import * as requestService from "../services/requestService";
import { getProfile } from "../services/profileService";

const SPORT_FILTERS = [
  "Semua",
  "Badminton",
  "Futsal",
  "Lari",
  "Gym",
  "Basket",
  "Sepeda",
  "Tenis",
  "Renang",
  "Outdoor",
  "Esports",
  "Voli",
];

// Format waktu terakhir aktif pengguna
const formatActiveStatus = (lastActive, isOnline) => {
  if (isOnline) return { text: "Online", isOnline: true };
  if (!lastActive) return { text: "Offline", isOnline: false };
  const diffMs = Date.now() - new Date(lastActive).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return { text: "Baru saja", isOnline: false };
  if (diffMins < 60) return { text: `${diffMins} mnt lalu`, isOnline: false };
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return { text: `${diffHours} jam lalu`, isOnline: false };
  return { text: "Offline", isOnline: false };
};

const PartnerCard = ({ partner, onSend, isSent, myHobbies = [], onFilterHobby, activeFilter = "Semua" }) => {
  const [sending, setSending] = useState(false);

  const handleClick = async () => {
    setSending(true);
    await onSend(partner.user_id);
    setSending(false);
  };

  // Cek apakah ada hobi yang sama dengan profil pengguna saat ini
  const matchingHobbies = (partner.interests || []).filter((item) =>
    myHobbies.some((myHobby) =>
      item.name.toLowerCase().includes(myHobby.toLowerCase()) ||
      myHobby.toLowerCase().includes(item.name.toLowerCase())
    )
  );

  const activeStatus = formatActiveStatus(partner.last_active, partner.is_online);

  return (
    <div className={`sport-card sport-card-hover rounded-3xl p-5 flex flex-col justify-between relative overflow-hidden transition-all ${
      matchingHobbies.length > 0 ? "border-emerald-500/40 shadow-lg shadow-emerald-500/10" : ""
    }`}>
      <div>
        {/* Header Kartu */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Avatar dengan Indikator Online/Offline Mengambang */}
            <div className="relative">
              <div className="h-12 w-12 shrink-0 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-base shadow-md shadow-emerald-500/20">
                {partner.name ? partner.name.slice(0, 2).toUpperCase() : "SP"}
              </div>
              {partner.is_online ? (
                <span
                  title="Sedang Online"
                  className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-950 border-2 border-slate-900"
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                </span>
              ) : (
                <span
                  title={`Terakhir dilihat ${activeStatus.text}`}
                  className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-950 border-2 border-slate-900"
                >
                  <span className="h-2 w-2 rounded-full bg-slate-500"></span>
                </span>
              )}
            </div>

            <div>
              <h3 className="font-extrabold text-white text-base leading-tight">
                {partner.name}
              </h3>
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                <MapPin size={12} className="text-emerald-400" />
                {partner.location || "Lokasi fleksibel"}
              </p>
            </div>
          </div>

          {/* Indikator Status Online & Match Hobi */}
          <div className="flex flex-col items-end gap-1.5">
            {partner.is_online ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/20">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800/90 text-slate-400 border border-slate-700/60">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-500"></span>
                {activeStatus.text}
              </span>
            )}

            {matchingHobbies.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-sm shadow-emerald-500/20">
                <Sparkles size={10} /> {matchingHobbies.length} Cocok
              </span>
            )}
          </div>
        </div>

        {/* Bio / Level / Deskripsi Hobi */}
        <p className="mt-3.5 text-xs text-slate-300 line-clamp-3 leading-relaxed">
          {partner.description || "Mencari teman olahraga dan partner sparring untuk latihan rutin bersama."}
        </p>

        {/* Tags Minat Olahraga - Interaktif & Klikable untuk Memfilter */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {partner.interests && partner.interests.length > 0 ? (
            partner.interests.map((item) => {
              const isFilteredTarget =
                activeFilter !== "Semua" &&
                item.name.toLowerCase().includes(activeFilter.toLowerCase());
              const isMatchWithMe = myHobbies.some((myHobby) =>
                item.name.toLowerCase().includes(myHobby.toLowerCase())
              );
              return (
                <button
                  key={item.interest_id}
                  type="button"
                  onClick={() => onFilterHobby(item.name)}
                  title={`Klik untuk melihat semua partner yang hobi ${item.name}`}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                    isFilteredTarget
                      ? "bg-emerald-400 text-slate-950 border-emerald-300 ring-2 ring-emerald-400/40 shadow-md shadow-emerald-500/20 font-black"
                      : isMatchWithMe
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow-sm shadow-emerald-500/20 hover:bg-emerald-500/30"
                      : "bg-slate-900/90 text-slate-300 border-slate-700/80 hover:border-emerald-500/40 hover:text-emerald-300"
                  }`}
                >
                  #{item.name}
                  {isFilteredTarget ? (
                    <span className="text-[10px] bg-slate-950 text-emerald-400 px-1 rounded-full">Dipilih</span>
                  ) : isMatchWithMe ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  ) : null}
                </button>
              );
            })
          ) : (
            <span className="px-2.5 py-0.5 rounded-xl text-[11px] font-bold bg-slate-900 text-slate-400 border border-slate-800">
              #Sport & Hobby
            </span>
          )}
        </div>
      </div>

      {/* Action Button Ajak Mabar */}
      <div className="mt-5 pt-3 border-t border-slate-800/80">
        <button
          onClick={handleClick}
          disabled={isSent || sending}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            isSent
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 cursor-default"
              : "bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-lg shadow-emerald-500/25"
          }`}
        >
          {isSent ? (
            <>
              <CheckCircle2 size={15} /> Ajakan Terkirim
            </>
          ) : sending ? (
            <>
              <Loader2 size={15} className="animate-spin" /> Mengirim...
            </>
          ) : (
            <>
              <Flame size={15} className="fill-slate-950" /> Ajak Main / Sparring
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default function PartnerList() {
  const [partners, setPartners] = useState([]);
  const [myHobbies, setMyHobbies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Semua");
  const [sentIds, setSentIds] = useState(new Set());
  const [toast, setToast] = useState("");

  const loadPartners = async (interest = "") => {
    setLoading(true);
    try {
      const data = interest
        ? await partnerService.searchByInterest(interest)
        : await partnerService.getPartners();
      setPartners(data || []);
    } catch (err) {
      setToast(err.response?.data?.message || "Gagal memuat daftar partner.");
    } finally {
      setLoading(false);
    }
  };

  // Muat hobi akun saya sendiri untuk smart matching
  const loadMyProfileHobbies = async () => {
    try {
      const res = await getProfile();
      const desc = res.profile?.description || res.description || "";
      const matched = SPORT_FILTERS.filter(
        (s) => s !== "Semua" && desc.toLowerCase().includes(s.toLowerCase())
      );
      setMyHobbies(matched);
    } catch (err) {
      console.error("Gagal membaca profil sendiri:", err);
    }
  };

  useEffect(() => {
    loadPartners();
    loadMyProfileHobbies();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) {
      setActiveFilter("Semua");
      loadPartners();
      return;
    }
    setActiveFilter(query.trim());
    loadPartners(query.trim());
  };

  const handleFilterClick = (tag) => {
    setActiveFilter(tag);
    setQuery("");
    if (tag === "Semua") {
      loadPartners();
    } else {
      loadPartners(tag);
    }
  };

  const handleSend = async (receiver_id) => {
    try {
      await requestService.sendRequest(receiver_id);
      setSentIds((prev) => new Set(prev).add(receiver_id));
      setToast("Ajakan kolaborasi olahraga berhasil dikirim! Menunggu konfirmasi.");
    } catch (err) {
      setToast(err.response?.data?.message || "Gagal mengirim ajakan.");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Header Sporty */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-400 mb-3">
          <Flame size={13} className="fill-emerald-400" /> Komunitas Olahraga & Sparring Partner
        </div>
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
          Temukan Rekan Olahraga & Mabar Hobimu
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          Klik hobi untuk memfilter pemain dengan minat yang sama atau cari teman sparring di kotamu.
        </p>

        {myHobbies.length > 0 && (
          <div className="mt-3 flex items-center gap-2 flex-wrap text-xs text-slate-400">
            <span className="font-semibold text-emerald-400 flex items-center gap-1">
              <Sparkles size={13} /> Hobimu saat ini:
            </span>
            {myHobbies.map((h) => (
              <button
                key={h}
                onClick={() => handleFilterClick(h)}
                className={`px-2.5 py-0.5 rounded-lg border text-[11px] font-bold cursor-pointer transition-all ${
                  activeFilter.toLowerCase() === h.toLowerCase()
                    ? "bg-emerald-500 text-slate-950 border-emerald-400"
                    : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
                }`}
              >
                #{h}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search Bar & Quick Sport Filters */}
      <div className="space-y-3 mb-8">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ketik cabang olahraga, kota, atau level (mis. Badminton, Bandung, Pemula)..."
              className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl py-3 pl-10 pr-10 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setActiveFilter("Semua");
                  loadPartners();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                <X size={15} />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm px-6 py-3 rounded-2xl transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            Cari
          </button>
        </form>

        {/* Quick Tag Pills Olahraga */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs text-slate-500 font-bold shrink-0 mr-1">Filter Hobi:</span>
          {SPORT_FILTERS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleFilterClick(tag)}
              className={`shrink-0 text-xs font-bold px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                activeFilter.toLowerCase() === tag.toLowerCase()
                  ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20"
                  : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Info Status Filter Aktif */}
        {activeFilter !== "Semua" && (
          <div className="flex items-center justify-between text-xs bg-slate-900/60 border border-slate-800 rounded-xl px-3.5 py-2">
            <span className="text-slate-300">
              Menampilkan partner untuk hobi: <strong className="text-emerald-400">"{activeFilter}"</strong> ({partners.length} orang ditemukan)
            </span>
            <button
              onClick={() => handleFilterClick("Semua")}
              className="text-slate-400 hover:text-white underline cursor-pointer"
            >
              Reset ke Semua
            </button>
          </div>
        )}
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-2">
          <Loader2 className="animate-spin w-6 h-6 text-emerald-400" />
          <p className="text-sm">Mencari rekan olahraga dengan hobi yang cocok...</p>
        </div>
      ) : partners.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-800 rounded-3xl p-8">
          <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-300">Belum ada partner untuk hobi "{activeFilter}"</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Coba klik tombol "Semua" atau pilih kategori hobi lain untuk menjelajahi teman olahraga lainnya.
          </p>
          <button
            onClick={() => handleFilterClick("Semua")}
            className="mt-4 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 transition-all cursor-pointer"
          >
            Lihat Semua Partner
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {partners.map((partner) => (
            <PartnerCard
              key={partner.user_id}
              partner={partner}
              onSend={handleSend}
              isSent={sentIds.has(partner.user_id)}
              myHobbies={myHobbies}
              onFilterHobby={handleFilterClick}
              activeFilter={activeFilter}
            />
          ))}
        </div>
      )}

      {/* Toast Feedback */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-slate-900 border border-emerald-500/40 px-4 py-3 text-xs text-emerald-300 shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 size={16} className="text-emerald-400" />
          {toast}
        </div>
      )}
    </div>
  );
}