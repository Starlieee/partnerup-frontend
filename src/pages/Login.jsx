import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, Mail, Lock, AlertCircle, CheckCircle2, Eye, EyeOff, Flame, KeyRound, X, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { resetPassword } from "../services/authService";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // State untuk Modal Lupa Password
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resetForm, setResetForm] = useState({ email: "", newPassword: "" });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetStatus, setResetStatus] = useState({ loading: false, error: "", success: "" });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      navigate("/partners");
    } catch (err) {
      setError(err.response?.data?.message || "Gagal masuk. Periksa email dan password.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetStatus({ loading: true, error: "", success: "" });
    try {
      const res = await resetPassword({
        email: resetForm.email,
        newPassword: resetForm.newPassword,
      });
      setResetStatus({ loading: false, error: "", success: res.message });
      setTimeout(() => {
        setIsModalOpen(false);
        setResetForm({ email: "", newPassword: "" });
        setResetStatus({ loading: false, error: "", success: "" });
      }, 2500);
    } catch (err) {
      setResetStatus({
        loading: false,
        error: err.response?.data?.message || "Gagal mereset password.",
        success: "",
      });
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-70px)] max-w-md items-center px-4 py-8">
      <div className="w-full sport-card rounded-3xl p-7 sm:p-8 shadow-2xl border border-slate-800">
        <div className="mb-6 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-3">
            <Flame size={26} className="fill-emerald-400" />
          </div>
          <h2 className="text-xl font-black tracking-tight text-white">Selamat Datang Kembali</h2>
          <p className="text-xs text-slate-400 mt-1">Masuk untuk mencari partner hobi & sparring</p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-400">
            <AlertCircle size={15} className="shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-300">Email Akun</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="nama@email.com"
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-2xl py-2.5 pl-10 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">Password</label>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer transition-colors"
              >
                Lupa kata sandi?
              </button>
            </div>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-2xl py-2.5 pl-10 pr-10 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 py-3 text-xs font-black text-slate-950 uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/25 cursor-pointer disabled:opacity-60"
          >
            <LogIn size={15} />
            {submitting ? "Memverifikasi..." : "Masuk ke Akun"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Belum punya akun?{" "}
          <Link to="/register" className="font-bold text-emerald-400 hover:underline">
            Daftar Sekarang
          </Link>
        </p>
      </div>

      {/* MODAL LUPA PASSWORD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm sport-card border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <KeyRound size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Reset Password</h3>
                <p className="text-[11px] text-slate-400">Atur ulang password akun PartnerUp kamu</p>
              </div>
            </div>

            {resetStatus.error && (
              <div className="mb-3.5 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-400">
                <AlertCircle size={14} className="shrink-0" />
                {resetStatus.error}
              </div>
            )}

            {resetStatus.success && (
              <div className="mb-3.5 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-400">
                <CheckCircle2 size={14} className="shrink-0" />
                {resetStatus.success}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Email Akun Terdaftar
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={resetForm.email}
                    onChange={(e) => setResetForm({ ...resetForm, email: e.target.value })}
                    placeholder="nama@email.com"
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Password Baru (Min. 6 Karakter)
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={resetForm.newPassword}
                    onChange={(e) => setResetForm({ ...resetForm, newPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl py-2 pl-9 pr-9 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-800 text-xs text-slate-400 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={resetStatus.loading}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-xs font-black text-slate-950 transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {resetStatus.loading ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Memproses...
                    </>
                  ) : (
                    "Simpan Baru"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}