import React, { useState } from "react";
import { motion } from "motion/react";
import { Eye, EyeOff, Key, ShieldCheck, User } from "lucide-react";

interface LoginViewProps {
  onLogin: (username: string, password: string, rememberMe: boolean) => boolean;
  libraryName: string;
  schoolName: string;
  logo?: string;
}

export default function LoginView({ onLogin, libraryName, schoolName, logo }: LoginViewProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Custom tooltips for validations
  const [usernameError, setUsernameError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUsernameError(false);
    setPasswordError(false);

    let hasError = false;
    if (!username.trim()) {
      setUsernameError(true);
      hasError = true;
    }
    if (!password) {
      setPasswordError(true);
      hasError = true;
    }

    if (hasError) return;

    const success = onLogin(username.trim(), password, rememberMe);
    if (!success) {
      setError("Username atau password salah! (Default: admin / admin)");
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center bg-[#070b13] font-sans">
      {/* Aesthetic glowing background layers imitating the uploaded picture's sunset-mountain vibe */}
      <div className="absolute inset-0 bg-cover bg-center opacity-30 select-none pointer-events-none" />
      
      {/* Abstract Sun/Mountain glowing spheres */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[720px] rounded-full bg-gradient-to-b from-amber-500/20 via-rose-500/10 to-transparent blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-[480px] h-[480px] rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="absolute -bottom-20 -right-20 w-[480px] h-[480px] rounded-full bg-indigo-500/15 blur-3xl" />

      {/* Styled vector mountain peaks in background */}
      <div className="absolute bottom-0 inset-x-0 h-96 flex items-end opacity-20 pointer-events-none select-none">
        <svg viewBox="0 0 1440 320" className="w-full text-slate-900 fill-current">
          <path d="M0,224L120,192C240,160,480,96,720,112C960,128,1200,224,1320,272L1440,320L1440,320L1320,320C1200,320,960,320,720,320C480,320,240,320,120,320L0,320Z"></path>
        </svg>
      </div>

      {/* Main glassmorphism login panel */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="bg-[#0e1626]/40 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 md:p-10 shadow-[0_24px_64px_rgba(0,0,0,0.6)] space-y-8 relative overflow-hidden">
          
          {/* Subtle light leak shine */}
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-white/5 to-transparent rounded-full rotate-45 pointer-events-none" />

          {/* Library Logo & Name Header */}
          <div className="flex flex-col items-center text-center space-y-3">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center p-1 border border-white/20 shadow-inner"
            >
              {logo && logo.startsWith("data:") ? (
                <img src={logo} alt="Library Logo" className="w-full h-full object-contain rounded-xl" />
              ) : (
                <span className="text-3xl">🏫</span>
              )}
            </motion.div>
            
            <div className="space-y-1">
              <h1 className="text-xs font-bold text-emerald-400 tracking-widest uppercase leading-none">
                Sistem Informasi Perpustakaan
              </h1>
              <h2 className="text-lg font-black text-white leading-snug tracking-tight">
                {libraryName}
              </h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {schoolName}
              </p>
            </div>
          </div>

          <div className="space-y-1.5 text-center">
            <h3 className="text-3xl font-extralight tracking-wide text-white font-sans capitalize">
              login
            </h3>
          </div>

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} className="space-y-6 relative">
            
            {/* Username Field */}
            <div className="space-y-1.5 relative">
              <label className="text-[11px] font-bold text-slate-400 tracking-wider block">
                Username
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (usernameError) setUsernameError(false);
                    if (error) setError(null);
                  }}
                  autoFocus
                  placeholder="Masukkan username admin..."
                  className="w-full bg-transparent border-b border-slate-700/80 focus:border-white py-2 text-sm text-white focus:outline-none transition-colors font-medium placeholder:text-slate-600 tracking-wide"
                />
                <User className="absolute right-1 top-2.5 w-4 h-4 text-slate-500 group-focus-within:text-white transition-colors" />
              </div>
              
              {/* Username Error Tooltip */}
              {usernameError && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute z-20 left-1/2 -translate-x-1/2 -bottom-10 bg-slate-800 text-slate-200 text-[10px] px-3 py-1.5 rounded-lg shadow-xl flex items-center space-x-1 border border-slate-700 whitespace-nowrap"
                >
                  <span className="text-amber-400">⚠️</span>
                  <span>Harap isi kolom username!</span>
                </motion.div>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5 relative">
              <label className="text-[11px] font-bold text-slate-400 tracking-wider block">
                Password
              </label>
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError(false);
                    if (error) setError(null);
                  }}
                  placeholder="Masukkan password..."
                  className="w-full bg-transparent border-b border-slate-700/80 focus:border-white py-2 pr-8 text-sm text-white focus:outline-none transition-colors font-medium placeholder:text-slate-600 tracking-wide"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-2 w-5 h-5 text-slate-500 hover:text-white transition-colors cursor-pointer"
                  title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Error Tooltip */}
              {passwordError && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute z-20 left-1/2 -translate-x-1/2 -bottom-10 bg-slate-800 text-slate-200 text-[10px] px-3 py-1.5 rounded-lg shadow-xl flex items-center space-x-1 border border-slate-700 whitespace-nowrap"
                >
                  <span className="text-amber-400">⚠️</span>
                  <span>Harap isi kolom password!</span>
                </motion.div>
              )}
            </div>

            {/* Validation Failed Alert Banner */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-3 bg-rose-950/40 border border-rose-900/30 rounded-xl text-[11px] text-rose-300 flex items-start space-x-2.5 leading-normal"
              >
                <span className="text-xs">❌</span>
                <span>{error}</span>
              </motion.div>
            )}

            {/* Remember Me and Forgot Password bar */}
            <div className="flex items-center justify-between text-xs pt-1 select-none">
              <label className="flex items-center space-x-2 text-slate-400 cursor-pointer hover:text-slate-200 transition-colors">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-950 text-emerald-800 focus:ring-emerald-500 w-3.5 h-3.5"
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  alert(
                    "Bantuan Akses:\n\nPassword standard bawaan sistem adalah:\n- Username: admin\n- Password: admin\n\nJika Anda telah merubah password, silakan periksa tab Pengaturan -> Akun Admin di dalam aplikasi atau hapus cache browser jika lupa."
                  );
                }}
                className="text-slate-400 hover:text-emerald-400 transition-colors font-medium cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>

            {/* Submit Login Button */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-white hover:bg-slate-100 text-slate-950 font-extrabold text-sm py-3 rounded-2xl transition-all shadow-lg active:scale-[0.98] cursor-pointer flex items-center justify-center space-x-2 font-sans"
              >
                <span>Login</span>
              </button>
            </div>
          </form>

          {/* Social connection info overlay footer */}
          <div className="pt-4 border-t border-slate-800/40 text-center">
            <p className="text-[10px] text-slate-500 font-medium">
              Sistem Otentikasi Terenkripsi Lokal Aman • Karsa Cendekia Pustaka
            </p>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
