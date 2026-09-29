import { useState, useEffect } from "react";
import { getProfile, updateProfile } from "../services/profileService";
import {
  User,
  MapPin,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  Trophy,
  Clock,
  Activity,
  Flame,
  Check,
} from "lucide-react";

// Kategori Olahraga & Hobi Populer untuk Dipilih Cepat (Tanpa Ketik Manual)
const SPORT_CATEGORIES = [
  { id: "badminton", name: "Badminton", emoji: "🏸" },
  { id: "futsal", name: "Futsal / Sepakbola", emoji: "⚽" },
  { id: "running", name: "Lari & Marathon", emoji: "🏃" },
  { id: "gym", name: "Gym & Fitness", emoji: "🏋️" },
  { id: "basket", name: "Basket", emoji: "🏀" },
  { id: "cycling", name: "Sepeda / Gowes", emoji: "🚴" },
  { id: "tennis", name: "Tenis & Padel", emoji: "🎾" },
  { id: "swimming", name: "Renang", emoji: "🏊" },
  { id: "outdoor", name: "Mendaki & Outdoor", emoji: "🧗" },
  { id: "esports", name: "Esports & Gaming", emoji: "🎮" },
  { id: "volleyball", name: "Voli", emoji: "🏐" },
  { id: "tabletennis", name: "Tenis Meja", emoji: "🏓" },
];

const SKILL_LEVELS = [
  { id: "casual", label: "Pemula / Casual", desc: "Main santai untuk cari keringat & teman baru" },
  { id: "intermediate", label: "Menengah (Regular)", desc: "Rutin bermain mingguan & paham aturan dasar" },
  { id: "advanced", label: "Lanjutan / Mahir", desc: "Siap sparring intens & teknik matang" },
  { id: "competitive", label: "Kompetitif / Atlet", desc: "Siap turnamen, sparing antar komunitas" },
];

const SCHEDULE_PRESETS = [
  "Weekend Pagi (06:00 - 10:00)",
  "Weekday Sore (16:00 - 19:00)",
  "Malam Hari (19:00 - 22:00)",
  "Fleksibel / Sesuai Kesepakatan",
];

const POPULAR_LOCATIONS = [
  "Jakarta",
  "Bandung",
  "Surabaya",
  "Yogyakarta",
  "Malang",
  "Semarang",
  "Tangerang",
  "Bekasi",
  "Bali",
  "Medan",
];

export default function Profile() {
  const [userData, setUserData] = useState({ name: "", email: "" });
  const [selectedSports, setSelectedSports] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState(SKILL_LEVELS[0].label);
  const [selectedSchedule, setSelectedSchedule] = useState(SCHEDULE_PRESETS[0]);
  const [selectedLocation, setSelectedLocation] = useState(POPULAR_LOCATIONS[0]);

  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await getProfile();
      setUserData({
        name: res.name || "",
        email: res.email || "",
      });

      const loc = res.profile?.location || res.location || "";
      if (loc && POPULAR_LOCATIONS.includes(loc)) {
        setSelectedLocation(loc);
      } else if (loc) {
        setSelectedLocation(loc);
      }

      const desc = res.profile?.description || res.description || "";
      // Otomatis deteksi olahraga yang tersimpan dari teks sebelumnya
      const matched = SPORT_CATEGORIES.filter((c) =>
        desc.toLowerCase().includes(c.name.toLowerCase())
      ).map((c) => c.name);

      if (matched.length > 0) {
        setSelectedSports(matched);
      } else {
        setSelectedSports(["Badminton", "Lari & Marathon"]);
      }
    } catch (err) {
      console.error("Gagal memuat data profil", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSport = (sportName) => {
    if (selectedSports.includes(sportName)) {
      if (selectedSports.length === 1) return; // minimal 1 hobi terpilih
      setSelectedSports(selectedSports.filter((s) => s !== sportName));
    } else {
      setSelectedSports([...selectedSports, sportName]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    setIsError(false);

    // Otomatis rangkai deskripsi terstruktur tanpa perlu mengetik manual
    const autoDescription = `Cabang Hobi: ${selectedSports.join(", ")}. Level: ${selectedLevel}. Jadwal Favorit: ${selectedSchedule}. Terbuka untuk sparing & latihan bareng.`;

    try {
      await updateProfile({
        location: selectedLocation,
        description: autoDescription,
        sports: selectedSports,
      });
      setMsg("Profil hobi olahraga berhasil diperbarui!");
    } catch (err) {
      setIsError(true);
      setMsg("Gagal menyimpan profil olahraga.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24 text-slate-400 text-sm">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-400 mr-2.5"></div>
        Memuat profil olahraga...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-800">
        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Pengaturan Profil Olahraga & Hobi
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Pilih kategori hobi dan level kemampuanmu cukup dengan klik (tanpa mengetik manual)
          </p>
        </div>
      </div>

      {msg && (
        <div
          className={`mb-6 p-3.5 rounded-2xl border flex items-center gap-2 text-xs transition-all ${
            isError
              ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
          }`}
        >
          {isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Pilihan Interaktif Tanpa Ketik Manual */}
        <form onSubmit={handleSave} className="lg:col-span-2 sport-card rounded-3xl p-6 sm:p-7 space-y-6">
          {/* 1. Pilih Cabang Olahraga */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Flame size={14} /> 1. Pilih Minat & Hobi Olahraga ({selectedSports.length} dipilih)
              </label>
              <span className="text-[11px] text-slate-500">Klik untuk memilih</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SPORT_CATEGORIES.map((sport) => {
                const isActive = selectedSports.includes(sport.name);
                return (
                  <button
                    key={sport.id}
                    type="button"
                    onClick={() => toggleSport(sport.name)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-md shadow-emerald-500/10"
                        : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                    }`}
                  >
                    <span className="text-base">{sport.emoji}</span>
                    <span className="truncate flex-1 text-left">{sport.name}</span>
                    {isActive && <Check size={13} className="text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Pilih Level Kemahiran */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-2.5">
              <Trophy size={14} /> 2. Level Kemahiran / Skill
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SKILL_LEVELS.map((lvl) => {
                const isActive = selectedLevel === lvl.label;
                return (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setSelectedLevel(lvl.label)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      isActive
                        ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-md shadow-emerald-500/10"
                        : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">{lvl.label}</span>
                      {isActive && <Check size={14} className="text-emerald-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{lvl.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Pilih Jadwal Favorit */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-2.5">
              <Clock size={14} /> 3. Waktu Latihan / Mabar Favorit
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SCHEDULE_PRESETS.map((sched) => {
                const isActive = selectedSchedule === sched;
                return (
                  <button
                    key={sched}
                    type="button"
                    onClick={() => setSelectedSchedule(sched)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer flex items-center justify-between ${
                      isActive
                        ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-300"
                        : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                    }`}
                  >
                    <span>{sched}</span>
                    {isActive && <Check size={13} className="text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Pilih Wilayah / Kota */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-2.5">
              <MapPin size={14} /> 4. Kota / Wilayah Bermain
            </label>
            <div className="flex flex-wrap gap-2">
              {POPULAR_LOCATIONS.map((loc) => {
                const isActive = selectedLocation === loc;
                return (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setSelectedLocation(loc)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? "bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-md shadow-emerald-500/20"
                        : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                    }`}
                  >
                    {loc}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black py-3 rounded-2xl transition-all shadow-lg shadow-emerald-500/25 text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Menyimpan Profil..." : "Simpan Profil Olahraga"}
          </button>
        </form>

        {/* Live Preview Card Atletik */}
        <div className="space-y-4 sticky top-24">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold uppercase tracking-wider px-1">
            <Eye size={14} /> Live Preview Kartu Pemain
          </div>
          <div className="sport-card rounded-3xl p-6 border border-emerald-500/30 relative overflow-hidden shadow-2xl">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>

            <div className="flex items-center gap-3.5 mb-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-base shadow-md shadow-emerald-500/30">
                {userData.name ? userData.name.slice(0, 2).toUpperCase() : "ME"}
              </div>
              <div>
                <h4 className="font-extrabold text-white text-base leading-tight">
                  {userData.name || "Nama Atlet"}
                </h4>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin size={12} className="text-emerald-400" />
                  {selectedLocation}
                </p>
              </div>
            </div>

            <div className="space-y-2.5 py-3 border-y border-slate-800/80 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Skill Level:</span>
                <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                  {selectedLevel}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Jadwal:</span>
                <span className="font-medium text-slate-300">{selectedSchedule}</span>
              </div>
            </div>

            <div className="mt-4">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Hobi Terpilih:
              </span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selectedSports.map((s) => (
                  <span
                    key={s}
                    className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-900 border border-emerald-500/30 text-emerald-300"
                  >
                    #{s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}