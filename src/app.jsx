import { useState, useEffect, useRef, useCallback } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
} from "firebase/auth";

/* ── Firebase config ── */
const firebaseConfig = {
  apiKey: "AIzaSyC-9-HjxA_mRywzOPCg__oer4T0N8DSaEQ",
  authDomain: "folio-app-bef5d.firebaseapp.com",
  projectId: "folio-app-bef5d",
  storageBucket: "folio-app-bef5d.firebasestorage.app",
  messagingSenderId: "74190229536",
  appId: "1:74190229536:web:969451373db5e008e0ec45",
  measurementId: "G-3466YTEQD5",
};
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();

/* ═══════════════════════════════════════════════════════════
   GLOBAL STYLES
═══════════════════════════════════════════════════════════ */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@300;400&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg:       #050508;
    --bg1:      #0a0a10;
    --bg2:      #0f0f18;
    --bg3:      #14141f;
    --border:   rgba(255,255,255,0.06);
    --border2:  rgba(255,255,255,0.12);
    --gold:     #c9a84c;
    --gold2:    #e8cc7a;
    --gold3:    rgba(201,168,76,0.15);
    --cyan:     #4cc9c9;
    --violet:   #7c5cbf;
    --text:     #e8e8f0;
    --text2:    #9090a8;
    --text3:    #505068;
    --success:  #4caf82;
    --error:    #cf6679;
  }
  html, body { background: var(--bg); color: var(--text); font-family: 'Syne', sans-serif; min-height: 100vh; overflow-x: hidden; }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }
  ::selection { background: rgba(201,168,76,0.3); }
  input, button, textarea { font-family: inherit; }
  input::placeholder { color: var(--text3); }
  input:focus { outline: none; }
  button { cursor: pointer; border: none; background: none; }

  @keyframes fadeUp    { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn    { from { opacity:0; } to { opacity:1; } }
  @keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
  @keyframes spin      { to { transform:rotate(360deg); } }
  @keyframes shimmer   { 0%,100% { opacity:0.4; } 50% { opacity:1; } }
  @keyframes pulse     { 0%,100% { box-shadow: 0 0 0 0 rgba(201,168,76,0.4); } 70% { box-shadow: 0 0 0 8px rgba(201,168,76,0); } }
  @keyframes scanline  { 0% { transform:translateY(-100%); } 100% { transform:translateY(100vh); } }
  @keyframes glow      { 0%,100% { text-shadow: 0 0 20px rgba(201,168,76,0.5); } 50% { text-shadow: 0 0 40px rgba(201,168,76,0.9), 0 0 80px rgba(201,168,76,0.3); } }

  .fadeUp   { animation: fadeUp   0.4s cubic-bezier(0.16,1,0.3,1) both; }
  .fadeIn   { animation: fadeIn   0.3s ease both; }
  .card-hover { transition: border-color 0.25s, transform 0.25s, box-shadow 0.25s; }
  .card-hover:hover { border-color: rgba(201,168,76,0.3) !important; transform: translateY(-1px); box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
  .btn-gold {
    background: linear-gradient(135deg, #c9a84c, #a8833a);
    color: #050508; font-weight: 700; font-family: 'Syne', sans-serif;
    border-radius: 6px; transition: all 0.2s; letter-spacing: 0.5px;
  }
  .btn-gold:hover { background: linear-gradient(135deg, #e8cc7a, #c9a84c); box-shadow: 0 4px 20px rgba(201,168,76,0.4); transform: translateY(-1px); }
  .btn-ghost {
    border: 1px solid var(--border2); color: var(--text2); border-radius: 6px;
    transition: all 0.2s; background: transparent;
  }
  .btn-ghost:hover { border-color: var(--gold); color: var(--gold); background: var(--gold3); }
  .input-field {
    width: 100%; padding: 11px 14px;
    background: var(--bg2); border: 1px solid var(--border);
    border-radius: 8px; color: var(--text); font-size: 14px;
    transition: border-color 0.2s;
  }
  .input-field:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(201,168,76,0.1); }
  .noise::after {
    content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 999;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
    opacity: 0.4;
  }
`;

/* ═══════════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════════ */
// Fallback quotes used while AI loads or if fetch fails
const FALLBACK_QUOTES = [
  { text: "A reader lives a thousand lives before he dies. The man who never reads lives only one.", author: "George R.R. Martin" },
  { text: "There is no friend as loyal as a book.", author: "Ernest Hemingway" },
  { text: "To read is to voyage through time.", author: "Carl Sagan" },
  { text: "A book must be the axe for the frozen sea within us.", author: "Franz Kafka" },
  { text: "We read to know we are not alone.", author: "C.S. Lewis" },
  { text: "Once you learn to read, you will be forever free.", author: "Frederick Douglass" },
  { text: "A book is a dream that you hold in your hand.", author: "Neil Gaiman" },
  { text: "The unread story is not a story. The reader makes it live.", author: "Ursula K. Le Guin" },
  { text: "Good friends, good books, and a sleepy conscience: this is the ideal life.", author: "Mark Twain" },
  { text: "If you don't like to read, you haven't found the right book.", author: "J.K. Rowling" },
];

function getFallbackQuote() {
  const t = new Date();
  const d = Math.floor((t - new Date(t.getFullYear(), 0, 0)) / 86400000);
  return FALLBACK_QUOTES[(t.getFullYear() * 1000 + d) % FALLBACK_QUOTES.length];
}

// Fetch a unique AI-generated reading quote from Claude
async function fetchAIQuote(mood = "") {
  const moods = ["inspiring", "philosophical", "humorous", "poetic", "motivational", "contemplative", "adventurous", "timeless"];
  const pick = mood || moods[Math.floor(Math.random() * moods.length)];
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: `Today is ${today}. Generate one unique, genuine ${pick} quote about reading, books, or literature. It must be a REAL quote from a real author, thinker, or historical figure — not invented. Choose someone unexpected and lesser-known if possible, avoiding the most overused quotes. Return ONLY valid JSON in this exact format with no other text:
{"text": "the quote text here", "author": "First Last", "context": "one short sentence about who this person was and why this quote matters"}`
        }]
      })
    });
    const data = await res.json();
    const raw = data.content?.[0]?.text?.trim() || "";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (parsed.text && parsed.author) return parsed;
    return null;
  } catch { return null; }
}

async function searchOpenLibrary(query) {
  if (!query || query.trim().length < 2) return [];
  try {
    const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=7&fields=key,title,author_name,cover_i,number_of_pages_median,first_publish_year,subject`);
    const data = await res.json();
    return (data.docs || []).map(doc => ({
      key: doc.key, title: doc.title,
      author: doc.author_name?.[0] || "Unknown",
      coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
      pages: doc.number_of_pages_median || null,
      year: doc.first_publish_year || null,
      genre: doc.subject?.[0] || "General",
    }));
  } catch { return []; }
}

function useDebounce(val, delay) {
  const [dv, setDv] = useState(val);
  useEffect(() => { const t = setTimeout(() => setDv(val), delay); return () => clearTimeout(t); }, [val, delay]);
  return dv;
}

function pct(cur, total) { return total ? Math.min(100, Math.round((cur / total) * 100)) : 0; }

const DEMO_READING = [
  { id: 1, title: "The Great Mental Models", author: "Shane Parrish", pages: 280, currentPage: 187, genre: "Non-fiction", coverUrl: null, addedDate: "May 1", sessions: [{ date: "May 10", pagesRead: 32 }, { date: "May 13", pagesRead: 24 }, { date: "May 15", pagesRead: 18 }] },
  { id: 2, title: "Anxious People", author: "Fredrik Backman", pages: 352, currentPage: 64, genre: "Fiction", coverUrl: null, addedDate: "May 8", sessions: [{ date: "May 12", pagesRead: 40 }, { date: "May 14", pagesRead: 24 }] },
];
const DEMO_READ = [
  { id: 3,  title: "Atomic Habits",           author: "James Clear",       pages: 320, rating: 5, genre: "Self-help", finishedDate: "Apr 28", coverUrl: null },
  { id: 4,  title: "Project Hail Mary",       author: "Andy Weir",         pages: 476, rating: 5, genre: "Sci-Fi",    finishedDate: "Apr 12", coverUrl: null },
  { id: 5,  title: "Shoe Dog",                author: "Phil Knight",       pages: 400, rating: 4, genre: "Memoir",    finishedDate: "Mar 30", coverUrl: null },
  { id: 6,  title: "The Midnight Library",    author: "Matt Haig",         pages: 304, rating: 4, genre: "Fiction",   finishedDate: "Mar 15", coverUrl: null },
  { id: 7,  title: "Sapiens",                 author: "Yuval Noah Harari", pages: 443, rating: 5, genre: "History",   finishedDate: "Feb 28", coverUrl: null },
  { id: 8,  title: "The Psychology of Money", author: "Morgan Housel",     pages: 256, rating: 5, genre: "Finance",   finishedDate: "Feb 10", coverUrl: null },
];
const DEMO_WANT = [
  { id: 12, title: "Fourth Wing",         author: "Rebecca Yarros",       genre: "Fantasy",     coverUrl: null },
  { id: 13, title: "The Creative Act",    author: "Rick Rubin",           genre: "Art",         coverUrl: null },
  { id: 14, title: "Poor Charlie's Almanack", author: "Charlie Munger",   genre: "Finance",     coverUrl: null },
  { id: 15, title: "Empire of Pain",      author: "Patrick Radden Keefe", genre: "Non-fiction", coverUrl: null },
];
const MONTHLY = [
  { month: "Jan", pages: 1384 }, { month: "Feb", pages: 755 },
  { month: "Mar", pages: 704 },  { month: "Apr", pages: 663 },
  { month: "May", pages: 251 },
];

/* ═══════════════════════════════════════════════════════════
   SMALL COMPONENTS
═══════════════════════════════════════════════════════════ */
function Spinner() {
  return <div style={{ width: 14, height: 14, border: "2px solid var(--border2)", borderTopColor: "var(--gold)", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />;
}

function GoldDivider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      <div style={{ width: 4, height: 4, background: "var(--gold)", borderRadius: "50%", boxShadow: "0 0 8px var(--gold)" }} />
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
  );
}

function StarRating({ rating, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} onClick={() => onChange?.(s)}
          onMouseEnter={() => onChange && setHover(s)}
          onMouseLeave={() => onChange && setHover(0)}
          style={{ color: s <= (hover||rating) ? "var(--gold)" : "var(--border2)", fontSize: 12, cursor: onChange ? "pointer" : "default", transition: "color 0.15s, text-shadow 0.15s", textShadow: s <= (hover||rating) ? "0 0 8px var(--gold)" : "none" }}>
          ★
        </span>
      ))}
    </div>
  );
}

function ProgressRing({ p, size = 52, stroke = 4 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg3)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="url(#goldGrad)" strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - p/100)}
        strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease" }} />
      <defs>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c9a84c" />
          <stop offset="100%" stopColor="#e8cc7a" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function BookCover({ url, title, size = 48 }) {
  const [err, setErr] = useState(false);
  const cols = [["#1a0f2e","#c9a84c"],["#0f1a2e","#4cc9c9"],["#0f2e1a","#4caf82"],["#2e0f1a","#cf6679"],["#1a1a0f","#e8cc7a"]];
  const [bg, acc] = cols[(title?.charCodeAt(0)||0) % 5];
  const initials = title ? title.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase() : "?";
  if (url && !err) {
    return <img src={url} alt={title} onError={() => setErr(true)}
      style={{ width: size, height: size*1.5, objectFit: "cover", borderRadius: 4, flexShrink: 0, boxShadow: "2px 4px 16px rgba(0,0,0,0.6)" }} />;
  }
  return (
    <div style={{ width: size, height: size*1.5, background: `linear-gradient(135deg,${bg},var(--bg))`, borderRadius: 4,
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: size*0.26,
      color: acc, fontWeight: 700, flexShrink: 0, boxShadow: "2px 4px 16px rgba(0,0,0,0.6)",
      letterSpacing: 1, border: `1px solid ${acc}22`, fontFamily: "'Cormorant Garamond', serif" }}>
      {initials}
    </div>
  );
}

function Tag({ children, color = "var(--text3)" }) {
  return (
    <span style={{ fontSize: 9, padding: "2px 7px", border: `1px solid ${color}44`, color, borderRadius: 3,
      fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.5px", textTransform: "uppercase" }}>
      {children}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   AUTH SCREEN  (Firebase)
═══════════════════════════════════════════════════════════ */
function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const friendlyError = (code) => {
    const map = {
      "auth/user-not-found":       "No account found with that email.",
      "auth/wrong-password":       "Incorrect password. Please try again.",
      "auth/email-already-in-use": "An account with that email already exists.",
      "auth/weak-password":        "Password must be at least 6 characters.",
      "auth/invalid-email":        "Please enter a valid email address.",
      "auth/popup-closed-by-user": "Google sign-in was cancelled.",
      "auth/network-request-failed": "Network error. Check your connection.",
      "auth/invalid-credential":   "Invalid email or password.",
    };
    return map[code] || "Something went wrong. Please try again.";
  };

  const handleEmail = async () => {
    setError(""); setLoading(true);
    try {
      if (mode === "signup") {
        if (!name.trim()) { setError("Please enter your name."); setLoading(false); return; }
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name.trim() });
        onLogin(cred.user);
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        onLogin(cred.user);
      }
    } catch (e) {
      setError(friendlyError(e.code));
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError(""); setGoogleLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      onLogin(cred.user);
    } catch (e) {
      setError(friendlyError(e.code));
    }
    setGoogleLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "fixed", top: "-20%", left: "-10%", width: 500, height: 500, background: "radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "-20%", right: "-10%", width: 600, height: 600, background: "radial-gradient(circle, rgba(76,201,201,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", top: "40%", right: "20%", width: 300, height: 300, background: "radial-gradient(circle, rgba(124,92,191,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div className="fadeUp" style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 52, fontWeight: 300, color: "var(--gold)", letterSpacing: 8, animation: "glow 3s ease-in-out infinite", marginBottom: 4 }}>
            FOLIO
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--text3)", letterSpacing: "4px", textTransform: "uppercase" }}>
            Reading · Reimagined
          </div>
          <div style={{ width: 60, height: 1, background: "linear-gradient(90deg, transparent, var(--gold), transparent)", margin: "16px auto 0" }} />
        </div>

        {/* Card */}
        <div style={{ background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: 16, padding: 32, backdropFilter: "blur(20px)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>

          {/* Toggle */}
          <div style={{ display: "flex", background: "var(--bg)", borderRadius: 8, padding: 3, marginBottom: 24, border: "1px solid var(--border)" }}>
            {[["login","Sign In"],["signup","Create Account"]].map(([m, label]) => (
              <button key={m} onClick={() => { setMode(m); setError(""); }} style={{
                flex: 1, padding: "8px 0", borderRadius: 6, fontSize: 12, fontWeight: 600, letterSpacing: "0.5px",
                background: mode === m ? "var(--bg3)" : "transparent",
                color: mode === m ? "var(--gold)" : "var(--text3)",
                border: mode === m ? "1px solid var(--border2)" : "1px solid transparent",
                transition: "all 0.2s"
              }}>{label}</button>
            ))}
          </div>

          {/* Google button */}
          <button onClick={handleGoogle} disabled={googleLoading || loading}
            style={{ width: "100%", padding: "12px 0", marginBottom: 16, borderRadius: 8,
              background: "var(--bg2)", border: "1px solid var(--border2)",
              color: "var(--text)", fontSize: 13, fontWeight: 600,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              cursor: "pointer", transition: "all 0.2s", opacity: (googleLoading || loading) ? 0.7 : 1 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; e.currentTarget.style.background = "var(--bg3)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.background = "var(--bg2)"; }}>
            {googleLoading ? <Spinner /> : (
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
            )}
            {googleLoading ? "Connecting…" : `${mode === "login" ? "Sign in" : "Sign up"} with Google`}
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={{ fontSize: 10, color: "var(--text3)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "1px" }}>OR EMAIL</span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          {/* Email fields */}
          {mode === "signup" && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 10, color: "var(--text3)", display: "block", marginBottom: 6, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "1px", textTransform: "uppercase" }}>Full Name</label>
              <input className="input-field" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 10, color: "var(--text3)", display: "block", marginBottom: 6, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "1px", textTransform: "uppercase" }}>Email</label>
            <input className="input-field" type="email" placeholder="you@example.com" value={email}
              onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleEmail()} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 10, color: "var(--text3)", display: "block", marginBottom: 6, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "1px", textTransform: "uppercase" }}>Password</label>
            <input className="input-field" type="password" placeholder="••••••••" value={password}
              onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleEmail()} />
          </div>

          {error && (
            <div style={{ background: "rgba(207,102,121,0.1)", border: "1px solid rgba(207,102,121,0.3)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "var(--error)", marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button className="btn-gold" onClick={handleEmail} disabled={loading || googleLoading}
            style={{ width: "100%", padding: "13px 0", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: (loading || googleLoading) ? 0.7 : 1 }}>
            {loading ? <Spinner /> : (mode === "login" ? "Sign In with Email" : "Create Account")}
          </button>

          <GoldDivider />

          <div style={{ fontSize: 11, color: "var(--text3)", textAlign: "center", lineHeight: 1.7 }}>
            By continuing, you agree to Folio's Terms of Service.<br/>
            Your reading data stays private and secure.
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 24, fontSize: 10, color: "var(--text3)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "1px" }}>
          FOLIO © 2025 · ALL RIGHTS RESERVED
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   BOOK SEARCH
═══════════════════════════════════════════════════════════ */
function BookSearchInput({ onSelect, placeholder }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const dq = useDebounce(q, 350);
  const ref = useRef(null);

  useEffect(() => {
    if (dq.length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    searchOpenLibrary(dq).then(r => { setResults(r); setOpen(r.length > 0); setLoading(false); });
  }, [dq]);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--text3)", pointerEvents: "none" }}>⌕</span>
        <input value={q} onChange={e => setQ(e.target.value)} onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder || "Search books…"} className="input-field"
          style={{ paddingLeft: 36, paddingRight: 36, borderRadius: open ? "8px 8px 0 0" : 8 }}
          onKeyDown={e => e.key === "Escape" && setOpen(false)} />
        {loading && <div style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)" }}><Spinner /></div>}
      </div>
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 200,
          background: "var(--bg1)", border: "1px solid var(--border2)", borderTop: "none",
          borderRadius: "0 0 8px 8px", boxShadow: "0 16px 48px rgba(0,0,0,0.8)", maxHeight: 360, overflowY: "auto" }}>
          {results.map((book, i) => (
            <div key={book.key+i} onClick={() => { onSelect(book); setQ(""); setResults([]); setOpen(false); }}
              style={{ display: "flex", gap: 12, padding: "11px 14px", cursor: "pointer",
                borderBottom: i < results.length-1 ? "1px solid var(--border)" : "none", alignItems: "center",
                transition: "background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--bg2)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <BookCover url={book.coverUrl} title={book.title} size={30} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'Cormorant Garamond', serif" }}>{book.title}</div>
                <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 1 }}>{book.author}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 3 }}>
                  {book.year && <span style={{ fontSize: 9, color: "var(--text3)", fontFamily: "'JetBrains Mono', monospace" }}>{book.year}</span>}
                  {book.pages && <span style={{ fontSize: 9, color: "var(--text3)", fontFamily: "'JetBrains Mono', monospace" }}>· {book.pages}p</span>}
                </div>
              </div>
              <span style={{ fontSize: 11, color: "var(--gold)", flexShrink: 0, fontFamily: "'JetBrains Mono', monospace" }}>+ add</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   LOG MODAL
═══════════════════════════════════════════════════════════ */
function LogModal({ book, onSave, onClose }) {
  const [mode, setMode] = useState("pages");
  const [pagesRead, setPagesRead] = useState("");
  const [absPage, setAbsPage] = useState(String(book.currentPage));

  const handleSave = () => {
    let newPage;
    if (mode === "pages") { const n = parseInt(pagesRead); if (isNaN(n)||n<=0) return; newPage = Math.min(book.currentPage+n, book.pages); }
    else { const n = parseInt(absPage); if (isNaN(n)||n<0) return; newPage = Math.min(n, book.pages); }
    onSave(book.id, newPage, Math.max(0, newPage - book.currentPage));
  };

  const previewPage = mode === "pages"
    ? (pagesRead && !isNaN(parseInt(pagesRead)) ? Math.min(book.currentPage+parseInt(pagesRead), book.pages) : null)
    : (absPage && !isNaN(parseInt(absPage)) ? Math.min(parseInt(absPage), book.pages) : null);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500, padding: 20, backdropFilter: "blur(8px)" }} onClick={onClose}>
      <div className="fadeUp" style={{ background: "var(--bg1)", border: "1px solid var(--border2)", borderRadius: 16, padding: 28, width: "100%", maxWidth: 360 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 22 }}>
          <BookCover url={book.coverUrl} title={book.title} size={38} />
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: "var(--text)", lineHeight: 1.3 }}>{book.title}</div>
            <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>p.{book.currentPage} of {book.pages} · {pct(book.currentPage,book.pages)}%</div>
          </div>
        </div>

        <div style={{ display: "flex", background: "var(--bg)", borderRadius: 8, padding: 3, marginBottom: 18, border: "1px solid var(--border)" }}>
          {[["pages","Pages I Read"],["abs","Jump to Page"]].map(([m,label]) => (
            <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: "7px 4px", borderRadius: 6, fontSize: 11, fontWeight: 600,
              background: mode===m ? "var(--bg3)" : "transparent", color: mode===m ? "var(--gold)" : "var(--text3)",
              border: mode===m ? "1px solid var(--border2)" : "1px solid transparent", transition: "all 0.2s" }}>{label}</button>
          ))}
        </div>

        <label style={{ fontSize: 10, color: "var(--text3)", display: "block", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "1px", textTransform: "uppercase" }}>
          {mode === "pages" ? "Pages read in this session" : `Current page (max ${book.pages})`}
        </label>
        <input className="input-field" type="number" min="0" max={book.pages}
          placeholder={mode === "pages" ? "e.g. 30" : String(book.currentPage)}
          value={mode === "pages" ? pagesRead : absPage}
          onChange={e => mode === "pages" ? setPagesRead(e.target.value) : setAbsPage(e.target.value)}
          style={{ textAlign: "center", fontSize: 22, fontFamily: "'Cormorant Garamond', serif", fontWeight: 300 }}
          autoFocus />

        {previewPage !== null && (
          <div style={{ marginTop: 10, padding: "8px 14px", background: "var(--gold3)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 8, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, color: "var(--text2)" }}>New position</span>
            <span style={{ fontSize: 12, color: "var(--gold)", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
              p.{previewPage} · {pct(previewPage, book.pages)}%
            </span>
          </div>
        )}

        <div style={{ height: 3, background: "var(--bg3)", borderRadius: 2, overflow: "hidden", margin: "16px 0 20px", position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,var(--gold),var(--gold2))", borderRadius: 2, width: `${previewPage !== null ? pct(previewPage,book.pages) : pct(book.currentPage,book.pages)}%`, transition: "width 0.4s ease" }} />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-ghost" onClick={onClose} style={{ flex: 1, padding: 11, fontSize: 12 }}>Cancel</button>
          <button className="btn-gold" onClick={handleSave} style={{ flex: 2, padding: 11, fontSize: 13 }}>Save Progress</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ADD BOOK MODAL
═══════════════════════════════════════════════════════════ */
function AddBookModal({ onAdd, onClose }) {
  const [selected, setSelected] = useState(null);
  const [customPages, setCustomPages] = useState("");
  const [shelf, setShelf] = useState("reading");
  const [step, setStep] = useState(1);

  const handleSelect = book => { setSelected(book); setCustomPages(String(book.pages||"")); setStep(2); };
  const handleAdd = () => {
    if (!selected) return;
    const pages = parseInt(customPages) || selected.pages || 200;
    onAdd({ id: Date.now(), title: selected.title, author: selected.author, pages,
      currentPage: 0, coverUrl: selected.coverUrl, genre: selected.genre||"General",
      addedDate: new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"}), sessions: [] }, shelf);
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 500, padding: "48px 16px 20px", overflowY: "auto", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <div className="fadeUp" style={{ background: "var(--bg1)", border: "1px solid var(--border2)", borderRadius: 16, padding: 26, width: "100%", maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "var(--text)" }}>
            {step === 1 ? "Search Library" : "Confirm Book"}
          </div>
          <button onClick={onClose} style={{ color: "var(--text3)", fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        {step === 1 && (
          <>
            <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 14, lineHeight: 1.6 }}>
              Search any title or author — covers, pages and metadata load automatically from Open Library.
            </div>
            <BookSearchInput onSelect={handleSelect} placeholder="e.g. Atomic Habits, Dune, Haruki Murakami…" />
            <div style={{ fontSize: 9, color: "var(--text3)", marginTop: 10, textAlign: "center", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.5px" }}>
              POWERED BY OPEN LIBRARY · OPENLIBRARY.ORG
            </div>
          </>
        )}

        {step === 2 && selected && (
          <>
            <button onClick={() => setStep(1)} style={{ color: "var(--gold)", fontSize: 12, marginBottom: 18, display: "flex", alignItems: "center", gap: 6 }}>← Search again</button>
            <div style={{ display: "flex", gap: 16, marginBottom: 20, alignItems: "flex-start" }}>
              <BookCover url={selected.coverUrl} title={selected.title} size={54} />
              <div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: "var(--text)", lineHeight: 1.3, marginBottom: 4 }}>{selected.title}</div>
                <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 6 }}>{selected.author}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {selected.year && <Tag>{selected.year}</Tag>}
                  {selected.genre && <Tag color="var(--gold)">{selected.genre}</Tag>}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 10, color: "var(--text3)", display: "block", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "1px", textTransform: "uppercase" }}>
                Total Pages {selected.pages ? `(suggested: ${selected.pages})` : "(enter manually)"}
              </label>
              <input type="number" value={customPages} onChange={e => setCustomPages(e.target.value)}
                placeholder="e.g. 320" className="input-field" />
            </div>

            <div style={{ marginBottom: 22 }}>
              <label style={{ fontSize: 10, color: "var(--text3)", display: "block", marginBottom: 10, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "1px", textTransform: "uppercase" }}>Add to Shelf</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[["reading","📖 Reading","var(--gold)"],["wantToRead","🔖 Want to Read","var(--cyan)"]].map(([v,label,col]) => (
                  <button key={v} onClick={() => setShelf(v)} style={{ flex: 1, padding: "10px 6px",
                    background: shelf===v ? `${col.replace("var(--","").replace(")","") === "gold" ? "rgba(201,168,76,0.12)" : "rgba(76,201,201,0.1)"}` : "var(--bg2)",
                    border: `1px solid ${shelf===v ? col : "var(--border)"}`,
                    borderRadius: 8, color: shelf===v ? col : "var(--text3)", fontSize: 11, fontWeight: shelf===v ? 700 : 400, transition: "all 0.2s" }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <button className="btn-gold" onClick={handleAdd} style={{ width: "100%", padding: 13, fontSize: 14 }}>
              Add to My Library
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SETTINGS MODAL
═══════════════════════════════════════════════════════════ */
function SettingsModal({ user, onUpdate, onClose, onLogout }) {
  const [settingsTab, setSettingsTab] = useState("account");
  const [name, setName] = useState(user.name);
  const [goal, setGoal] = useState(String(user.yearGoal));
  const [goodreadsUser, setGoodreadsUser] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onUpdate({ ...user, name, yearGoal: parseInt(goal)||24 });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleGoodreads = async () => {
    if (!goodreadsUser) return;
    setConnecting(true);
    await new Promise(r => setTimeout(r, 1800));
    setConnecting(false);
    onUpdate({ ...user, goodreadsConnected: true, goodreadsUsername: goodreadsUser });
  };

  const STABS = [
    { id: "account", label: "Account", icon: "◉" },
    { id: "profile", label: "Profile", icon: "◈" },
    { id: "integrations", label: "Integrations", icon: "⟡" },
    { id: "help", label: "Help", icon: "?" },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 600, padding: 16, backdropFilter: "blur(12px)" }} onClick={onClose}>
      <div className="fadeUp" style={{ background: "var(--bg1)", border: "1px solid var(--border2)", borderRadius: 20, width: "100%", maxWidth: 520, maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: "20px 24px 0", borderBottom: "1px solid var(--border)", paddingBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--text)" }}>Settings</div>
          <button onClick={onClose} style={{ color: "var(--text3)", fontSize: 22, lineHeight: 1, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "var(--bg3)", transition: "all 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--text)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--text3)"}>×</button>
        </div>

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Sidebar */}
          <div style={{ width: 140, borderRight: "1px solid var(--border)", padding: "16px 0", flexShrink: 0 }}>
            {STABS.map(s => (
              <button key={s.id} onClick={() => setSettingsTab(s.id)} style={{ width: "100%", padding: "10px 18px", textAlign: "left", fontSize: 12, fontWeight: 600,
                color: settingsTab === s.id ? "var(--gold)" : "var(--text3)",
                background: settingsTab === s.id ? "var(--gold3)" : "transparent",
                borderLeft: settingsTab === s.id ? "2px solid var(--gold)" : "2px solid transparent",
                transition: "all 0.2s", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14 }}>{s.icon}</span>{s.label}
              </button>
            ))}
            <div style={{ margin: "16px 12px 0", height: 1, background: "var(--border)" }} />
            <button onClick={onLogout} style={{ width: "100%", padding: "10px 18px", textAlign: "left", fontSize: 12, color: "var(--error)", marginTop: 8, transition: "all 0.2s", display: "flex", alignItems: "center", gap: 8 }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(207,102,121,0.1)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <span>⎋</span> Sign Out
            </button>
          </div>

          {/* Content */}
          <div style={{ flex: 1, padding: "20px 24px", overflowY: "auto" }}>

            {settingsTab === "account" && (
              <div className="fadeIn">
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, padding: 18, background: "var(--bg2)", borderRadius: 12, border: "1px solid var(--border)" }}>
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,var(--gold),#a8833a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: "var(--bg)", fontFamily: "'Cormorant Garamond', serif", flexShrink: 0 }}>
                    {user.avatar}
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: "var(--text)" }}>{user.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{user.email}</div>
                    <div style={{ fontSize: 9, color: "var(--text3)", marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>Member since {user.joinedDate}</div>
                  </div>
                </div>

                <label style={{ fontSize: 10, color: "var(--text3)", display: "block", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "1px", textTransform: "uppercase" }}>Display Name</label>
                <input className="input-field" value={name} onChange={e => setName(e.target.value)} style={{ marginBottom: 16 }} />

                <label style={{ fontSize: 10, color: "var(--text3)", display: "block", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "1px", textTransform: "uppercase" }}>Email Address</label>
                <input className="input-field" value={user.email} disabled style={{ marginBottom: 20, opacity: 0.5 }} />

                <button className="btn-gold" onClick={handleSave} style={{ padding: "11px 24px", fontSize: 13 }}>
                  {saved ? "✓ Saved!" : "Save Changes"}
                </button>
              </div>
            )}

            {settingsTab === "profile" && (
              <div className="fadeIn">
                <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 20, lineHeight: 1.7 }}>
                  Customize your reading profile and annual goals.
                </div>

                <label style={{ fontSize: 10, color: "var(--text3)", display: "block", marginBottom: 8, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "1px", textTransform: "uppercase" }}>Annual Reading Goal (books)</label>
                <input className="input-field" type="number" value={goal} onChange={e => setGoal(e.target.value)} style={{ marginBottom: 20 }} />

                <div style={{ padding: 16, background: "var(--bg2)", borderRadius: 12, border: "1px solid var(--border)", marginBottom: 20 }}>
                  <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 10, fontWeight: 600 }}>Reading Stats Preview</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {[["Books Read","6"],["Goal",""+goal],["Pages","3,757"],["Streak","12 days"]].map(([l,v]) => (
                      <div key={l} style={{ padding: "10px 12px", background: "var(--bg3)", borderRadius: 8, border: "1px solid var(--border)" }}>
                        <div style={{ fontSize: 9, color: "var(--text3)", fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{l.toUpperCase()}</div>
                        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "var(--gold)" }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <button className="btn-gold" onClick={handleSave} style={{ padding: "11px 24px", fontSize: 13 }}>
                  {saved ? "✓ Saved!" : "Save Profile"}
                </button>
              </div>
            )}

            {settingsTab === "integrations" && (
              <div className="fadeIn">
                {/* Goodreads */}
                <div style={{ padding: 20, background: "var(--bg2)", borderRadius: 12, border: `1px solid ${user.goodreadsConnected ? "rgba(76,175,130,0.3)" : "var(--border)"}`, marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "#553B08", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📚</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Goodreads</div>
                      <div style={{ fontSize: 11, color: "var(--text3)" }}>Sync shelves, ratings & reading history</div>
                    </div>
                    {user.goodreadsConnected && <div style={{ marginLeft: "auto", fontSize: 10, color: "var(--success)", fontFamily: "'JetBrains Mono', monospace", background: "rgba(76,175,130,0.1)", padding: "3px 8px", borderRadius: 4, border: "1px solid rgba(76,175,130,0.3)" }}>CONNECTED</div>}
                  </div>

                  {user.goodreadsConnected ? (
                    <div style={{ fontSize: 12, color: "var(--success)", display: "flex", alignItems: "center", gap: 6 }}>
                      ✓ Connected as @{user.goodreadsUsername} · Shelves synced
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 12, lineHeight: 1.6 }}>
                        Note: Goodreads closed their public API in 2020. Enter your Goodreads username to enable manual shelf sync when the API becomes available again.
                      </div>
                      <input className="input-field" placeholder="Your Goodreads username" value={goodreadsUser} onChange={e => setGoodreadsUser(e.target.value)} style={{ marginBottom: 12 }} />
                      <button className="btn-gold" onClick={handleGoodreads} disabled={connecting || !goodreadsUser}
                        style={{ padding: "10px 20px", fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}>
                        {connecting ? <><Spinner /> Connecting…</> : "Connect Goodreads"}
                      </button>
                    </>
                  )}
                </div>

                {/* Open Library */}
                <div style={{ padding: 20, background: "var(--bg2)", borderRadius: 12, border: "1px solid rgba(76,201,201,0.2)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "#0a2a2a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🔍</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Open Library</div>
                      <div style={{ fontSize: 11, color: "var(--text3)" }}>Book search, covers & metadata</div>
                    </div>
                    <div style={{ fontSize: 10, color: "var(--cyan)", fontFamily: "'JetBrains Mono', monospace", background: "rgba(76,201,201,0.1)", padding: "3px 8px", borderRadius: 4, border: "1px solid rgba(76,201,201,0.2)" }}>ACTIVE</div>
                  </div>
                </div>
              </div>
            )}

            {settingsTab === "help" && (
              <div className="fadeIn">
                <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 20, lineHeight: 1.8 }}>
                  Welcome to Folio — your personal reading companion.
                </div>
                {[
                  ["📖 Adding Books", "Tap '+ Add Book' or use the search bar in the Reading tab. Covers and page counts load automatically from Open Library."],
                  ["📊 Logging Progress", "On any book card, tap 'Log Pages' to record your reading session. Choose between 'pages read today' or 'jump to page'."],
                  ["✓ Finishing a Book", "Tap the '✓ Done' button on a book card. It moves to your Read shelf automatically."],
                  ["⭐ Rating Books", "In the Shelves tab, tap any star on a finished book to rate it."],
                  ["🔖 Want to Read", "When adding a book, select 'Want to Read' shelf instead of 'Reading'."],
                  ["📅 Daily Quote", "The Quote tab shows a fresh reading quote every day, rotating from a curated collection."],
                ].map(([title, desc]) => (
                  <div key={title} style={{ marginBottom: 16, padding: 16, background: "var(--bg2)", borderRadius: 10, border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>{title}</div>
                    <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.6 }}>{desc}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   USER MENU DROPDOWN
═══════════════════════════════════════════════════════════ */
function UserMenu({ user, onSettings, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(x => !x)} style={{
        width: 38, height: 38, borderRadius: "50%",
        background: open ? "linear-gradient(135deg,#e8cc7a,#c9a84c)" : "linear-gradient(135deg,#c9a84c,#a8833a)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 700, fontSize: 16, color: "var(--bg)",
        fontFamily: "'Cormorant Garamond', serif",
        boxShadow: open ? "0 0 0 3px rgba(201,168,76,0.3), 0 4px 16px rgba(201,168,76,0.3)" : "0 4px 12px rgba(0,0,0,0.4)",
        transition: "all 0.2s", animation: "pulse 3s ease-in-out infinite",
        border: "none",
      }}>
        {user.avatar}
      </button>

      {open && (
        <div className="slideDown" style={{
          position: "absolute", top: "calc(100% + 10px)", right: 0,
          background: "var(--bg1)", border: "1px solid var(--border2)",
          borderRadius: 12, minWidth: 220, boxShadow: "0 16px 48px rgba(0,0,0,0.8)",
          overflow: "hidden", zIndex: 100,
        }}>
          {/* User info */}
          <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: "var(--text)", marginBottom: 2 }}>{user.name}</div>
            <div style={{ fontSize: 11, color: "var(--text3)" }}>{user.email}</div>
            {user.goodreadsConnected && (
              <div style={{ fontSize: 9, color: "var(--success)", marginTop: 6, fontFamily: "'JetBrains Mono', monospace", background: "rgba(76,175,130,0.1)", padding: "2px 6px", borderRadius: 3, display: "inline-block" }}>
                ✓ GOODREADS CONNECTED
              </div>
            )}
          </div>

          {/* Menu items */}
          {[
            { icon: "◉", label: "Account", action: () => { onSettings("account"); setOpen(false); } },
            { icon: "◈", label: "Profile", action: () => { onSettings("profile"); setOpen(false); } },
            { icon: "⟡", label: "Integrations", action: () => { onSettings("integrations"); setOpen(false); } },
            { icon: "?", label: "Help & Guide", action: () => { onSettings("help"); setOpen(false); } },
          ].map(item => (
            <button key={item.label} onClick={item.action} style={{
              width: "100%", padding: "11px 16px", textAlign: "left", fontSize: 13,
              color: "var(--text2)", display: "flex", alignItems: "center", gap: 10,
              transition: "all 0.15s", background: "transparent",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--bg2)"; e.currentTarget.style.color = "var(--text)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text2)"; }}>
              <span style={{ color: "var(--gold)", fontSize: 14, width: 18 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}

          <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
          <button onClick={() => { onLogout(); setOpen(false); }} style={{
            width: "100%", padding: "11px 16px", textAlign: "left", fontSize: 13,
            color: "var(--error)", display: "flex", alignItems: "center", gap: 10,
            transition: "all 0.15s", background: "transparent",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(207,102,121,0.08)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <span style={{ fontSize: 14, width: 18 }}>⎋</span> Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   READING CARD
═══════════════════════════════════════════════════════════ */
function ReadingCard({ book, onLog, onMarkDone }) {
  const [expanded, setExpanded] = useState(false);
  const p = pct(book.currentPage, book.pages);
  return (
    <div className="card-hover" style={{ background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
      <div style={{ display: "flex", gap: 14, padding: 16, cursor: "pointer" }} onClick={() => setExpanded(x=>!x)}>
        <BookCover url={book.coverUrl} title={book.title} size={48} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: "var(--text)", lineHeight: 1.3, marginBottom: 2 }}>{book.title}</div>
          <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 10 }}>{book.author}</div>
          <div style={{ height: 2, background: "var(--bg3)", borderRadius: 1, overflow: "hidden", marginBottom: 5 }}>
            <div style={{ height: "100%", width: `${p}%`, background: "linear-gradient(90deg,var(--gold),var(--gold2))", borderRadius: 1, transition: "width 0.8s ease", boxShadow: "0 0 8px rgba(201,168,76,0.4)" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 10, color: "var(--gold)", fontFamily: "'JetBrains Mono', monospace" }}>p.{book.currentPage} / {book.pages}</span>
            <span style={{ fontSize: 10, color: "var(--text3)", fontFamily: "'JetBrains Mono', monospace" }}>{book.pages - book.currentPage} remaining</span>
          </div>
        </div>
        <div style={{ position: "relative", flexShrink: 0, display: "flex", alignItems: "center" }}>
          <ProgressRing p={p} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "var(--gold)", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{p}%</div>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "0 16px 14px", borderTop: "1px solid var(--border)", paddingTop: 14 }}>
          <div style={{ fontSize: 9, color: "var(--text3)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 10 }}>Reading Sessions</div>
          {book.sessions?.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[...book.sessions].reverse().slice(0,5).map((s,i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: "var(--text3)", fontFamily: "'JetBrains Mono', monospace" }}>{s.date}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ height: 2, width: Math.min(80,Math.max(12,s.pagesRead*1.2)), background: "linear-gradient(90deg,var(--gold),var(--gold2))", borderRadius: 1, boxShadow: "0 0 6px rgba(201,168,76,0.3)" }} />
                    <span style={{ fontSize: 10, color: "var(--gold)", minWidth: 52, textAlign: "right", fontFamily: "'JetBrains Mono', monospace" }}>+{s.pagesRead}p</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 11, color: "var(--text3)" }}>No sessions yet. Log your first read!</div>
          )}
        </div>
      )}

      <div style={{ padding: "0 16px 16px", display: "flex", gap: 8 }}>
        <button className="btn-gold" onClick={e => { e.stopPropagation(); onLog(book); }} style={{ flex: 2, padding: "9px 0", fontSize: 12 }}>
          📖 Log Pages
        </button>
        <button className="btn-ghost" onClick={e => { e.stopPropagation(); setExpanded(x=>!x); }} style={{ flex: 1, padding: "9px 0", fontSize: 11 }}>
          {expanded ? "▲" : "Sessions"}
        </button>
        <button className="btn-ghost" onClick={e => { e.stopPropagation(); onMarkDone(book); }} style={{ flex: 1, padding: "9px 0", fontSize: 11, borderColor: "rgba(76,175,130,0.3)", color: "var(--success)" }}>
          ✓ Done
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SHELF CARD
═══════════════════════════════════════════════════════════ */
function ShelfCard({ book, showRating, onRate }) {
  return (
    <div className="card-hover" style={{ display: "flex", gap: 14, padding: 14, background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: 12 }}>
      <BookCover url={book.coverUrl} title={book.title} size={38} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, color: "var(--text)", fontWeight: 400, lineHeight: 1.3, marginBottom: 2 }}>{book.title}</div>
        <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 6 }}>{book.author}</div>
        {showRating && <StarRating rating={book.rating||0} onChange={r => onRate?.(book.id,r)} />}
        {book.finishedDate && <div style={{ fontSize: 9, color: "var(--text3)", marginTop: 4, fontFamily: "'JetBrains Mono', monospace" }}>✓ {book.finishedDate}</div>}
        <div style={{ marginTop: 6 }}><Tag color="var(--text3)">{book.genre}</Tag></div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MINI BAR CHART
═══════════════════════════════════════════════════════════ */
function MiniBar({ data }) {
  const max = Math.max(...data.map(d => d.pages));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 80 }}>
      {data.map((d, i) => {
        const isLast = i === data.length - 1;
        const h = Math.max(4, Math.round((d.pages/max)*64));
        return (
          <div key={d.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ position: "relative", width: "100%" }}>
              {isLast && <div style={{ position: "absolute", top: -18, left: "50%", transform: "translateX(-50%)", fontSize: 9, color: "var(--gold)", whiteSpace: "nowrap", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>{d.pages}</div>}
              <div style={{ height: h, background: isLast ? "linear-gradient(180deg,var(--gold2),var(--gold))" : "var(--bg3)", borderRadius: "3px 3px 0 0", transition: "height 0.8s ease", boxShadow: isLast ? "0 0 12px rgba(201,168,76,0.3)" : "none" }} />
            </div>
            <div style={{ fontSize: 9, color: "var(--text3)", fontFamily: "'JetBrains Mono', monospace" }}>{d.month}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN APP
═══════════════════════════════════════════════════════════ */
export default function Folio() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true); // wait for Firebase to check session
  const [tab, setTab] = useState("dashboard");
  const [quote, setQuote] = useState(getFallbackQuote());
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteMood, setQuoteMood] = useState("");
  const [quoteHistory, setQuoteHistory] = useState([]);

  // Listen to Firebase auth state — persists across page refreshes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          name: firebaseUser.displayName || firebaseUser.email.split("@")[0],
          email: firebaseUser.email,
          avatar: (firebaseUser.displayName || firebaseUser.email).charAt(0).toUpperCase(),
          photoURL: firebaseUser.photoURL,
          joinedDate: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
          goodreadsConnected: false,
          yearGoal: 24,
          uid: firebaseUser.uid,
        });
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // Fetch AI quote once user logs in
  useEffect(() => {
    if (!user) return;
    setQuoteLoading(true);
    fetchAIQuote().then(q => {
      if (q) { setQuote(q); setQuoteHistory([q]); }
      setQuoteLoading(false);
    });
  }, [user?.uid]);

  const handleNewQuote = async (mood = "") => {
    setQuoteLoading(true);
    setQuoteMood(mood);
    const q = await fetchAIQuote(mood);
    if (q) {
      setQuote(q);
      setQuoteHistory(prev => [q, ...prev].slice(0, 10));
    }
    setQuoteLoading(false);
  };

  const handleFirebaseLogin = (firebaseUser) => {
    // onAuthStateChanged will pick this up automatically — no manual setUser needed
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };
  const [readingBooks, setReadingBooks] = useState(DEMO_READING);
  const [readBooks, setReadBooks] = useState(DEMO_READ);
  const [wantBooks, setWantBooks] = useState(DEMO_WANT);
  const [logTarget, setLogTarget] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState("account");
  const [notif, setNotif] = useState(null);

  const booksRead = readBooks.length;
  const yearGoal = user?.yearGoal || 24;
  const goalPct = Math.min(100, Math.round((booksRead / yearGoal) * 100));
  const totalPages = MONTHLY.reduce((a, b) => a + b.pages, 0);

  const showNotif = useCallback(msg => { setNotif(msg); setTimeout(() => setNotif(null), 3000); }, []);

  const handleLogSave = (id, newPage, pagesLogged) => {
    const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
    let finished = null;
    setReadingBooks(prev => prev.map(b => {
      if (b.id !== id) return b;
      const sessions = [...(b.sessions||[])];
      if (pagesLogged > 0) sessions.push({ date: today, pagesRead: pagesLogged });
      if (newPage >= b.pages) finished = { ...b, sessions, currentPage: b.pages };
      return { ...b, currentPage: newPage, sessions };
    }));
    setTimeout(() => {
      if (finished) {
        setReadBooks(prev => [{ ...finished, rating: 0, finishedDate: today }, ...prev]);
        setReadingBooks(prev => prev.filter(b => b.id !== id));
        showNotif("🎉 Finished! Moved to your Read shelf.");
      } else {
        showNotif(`✓ Progress saved — page ${newPage}!`);
      }
    }, 50);
    setLogTarget(null);
  };

  const handleMarkDone = book => {
    const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
    setReadBooks(prev => [{ ...book, rating: 0, finishedDate: today, currentPage: book.pages }, ...prev]);
    setReadingBooks(prev => prev.filter(b => b.id !== book.id));
    showNotif(`"${book.title}" marked finished! 🎉`);
  };

  const handleAddBook = (book, shelf) => {
    if (shelf === "reading") { setReadingBooks(prev => [...prev, book]); showNotif(`Added to Reading!`); setTab("reading"); }
    else { setWantBooks(prev => [...prev, book]); showNotif(`Added to Want to Read!`); }
  };

  const handleRate = (id, rating) => setReadBooks(prev => prev.map(b => b.id===id ? {...b, rating} : b));

  const openSettings = (tab = "account") => { setSettingsTab(tab); setSettingsOpen(true); };

  const TABS = [
    { id: "dashboard", icon: "◈", label: "Home" },
    { id: "reading",   icon: "◎", label: "Reading" },
    { id: "shelves",   icon: "⊟",  label: "Shelves" },
    { id: "quote",     icon: "✦",  label: "Quote" },
  ];

  // Show loading spinner while Firebase checks session
  if (authLoading) return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20 }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, color: "var(--gold)", letterSpacing: 6, animation: "glow 2s ease-in-out infinite" }}>FOLIO</div>
        <div style={{ width: 24, height: 24, border: "2px solid rgba(201,168,76,0.2)", borderTopColor: "var(--gold)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      </div>
    </>
  );

  // Show auth screen if not logged in
  if (!user) return (
    <>
      <style>{GLOBAL_CSS}</style>
      <AuthScreen onLogin={handleFirebaseLogin} />
    </>
  );

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div className="noise" style={{ minHeight: "100vh", paddingBottom: 80 }}>

        {/* Background ambience */}
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "-30%", right: "-20%", width: 600, height: 600, background: "radial-gradient(circle, rgba(201,168,76,0.04) 0%, transparent 65%)", borderRadius: "50%" }} />
          <div style={{ position: "absolute", bottom: "-20%", left: "-20%", width: 500, height: 500, background: "radial-gradient(circle, rgba(76,201,201,0.03) 0%, transparent 65%)", borderRadius: "50%" }} />
        </div>

        {/* Notification */}
        {notif && (
          <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
            background: "linear-gradient(135deg,var(--bg2),var(--bg3))", color: "var(--gold)",
            padding: "11px 24px", borderRadius: 24, fontSize: 13, zIndex: 1000,
            border: "1px solid rgba(201,168,76,0.3)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.1)",
            whiteSpace: "nowrap", animation: "slideDown 0.3s ease", fontWeight: 600 }}>
            {notif}
          </div>
        )}

        {/* Modals */}
        {logTarget && <LogModal book={logTarget} onSave={handleLogSave} onClose={() => setLogTarget(null)} />}
        {addOpen && <AddBookModal onAdd={handleAddBook} onClose={() => setAddOpen(false)} />}
        {settingsOpen && (
          <SettingsModal
            user={user}
            onUpdate={u => setUser(u)}
            onClose={() => setSettingsOpen(false)}
            onLogout={() => { handleLogout(); setSettingsOpen(false); }}
            initialTab={settingsTab}
          />
        )}

        {/* Header */}
        <div style={{ padding: "14px 18px", background: "rgba(5,5,8,0.92)", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(20px)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 480, margin: "0 auto" }}>
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "var(--gold)", letterSpacing: 4, lineHeight: 1, fontWeight: 300 }}>FOLIO</div>
              <div style={{ fontSize: 8, color: "var(--text3)", letterSpacing: "3px", fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", marginTop: 2 }}>Reading Companion</div>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button onClick={() => setAddOpen(true)} className="btn-gold" style={{ padding: "8px 16px", fontSize: 11, display: "flex", alignItems: "center", gap: 6, letterSpacing: "0.5px" }}>
                <span style={{ fontSize: 14, lineHeight: 1 }}>+</span> Add Book
              </button>
              <UserMenu user={user} onSettings={openSettings} onLogout={handleLogout} />
            </div>
          </div>
        </div>

        {/* Main content */}
        <div style={{ padding: "0 16px", maxWidth: 480, margin: "0 auto", position: "relative", zIndex: 1 }}>

          {/* ── DASHBOARD ── */}
          {tab === "dashboard" && (
            <div className="fadeUp">
              {/* Welcome */}
              <div style={{ padding: "20px 0 16px" }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: "var(--text3)", fontStyle: "italic" }}>Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: "var(--text)", fontWeight: 300, letterSpacing: "-0.5px" }}>{user.name}</div>
              </div>

              {/* Goal Card */}
              <div style={{ background: "var(--bg1)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 16, padding: 22, marginBottom: 14, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, background: "radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 9, color: "var(--text3)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8 }}>2025 Reading Goal</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, color: "var(--gold)", fontWeight: 300, lineHeight: 1, animation: "glow 4s ease-in-out infinite" }}>{booksRead}</span>
                      <span style={{ fontSize: 14, color: "var(--text3)" }}>/ {yearGoal}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 4 }}>books read this year</div>
                  </div>
                  <div style={{ position: "relative" }}>
                    <ProgressRing p={goalPct} size={72} stroke={5} />
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "var(--gold)", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{goalPct}%</div>
                  </div>
                </div>
                <div style={{ height: 2, background: "var(--bg3)", borderRadius: 1, overflow: "hidden", marginBottom: 8 }}>
                  <div style={{ height: "100%", width: `${goalPct}%`, background: "linear-gradient(90deg,var(--gold),var(--gold2))", borderRadius: 1, boxShadow: "0 0 12px rgba(201,168,76,0.4)", transition: "width 1.2s ease" }} />
                </div>
                <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "'JetBrains Mono', monospace" }}>
                  {yearGoal - booksRead} more books to reach your goal · 12-day streak 🔥
                </div>
              </div>

              {/* Stats Row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
                {[
                  { label: "Pages Read",  value: totalPages.toLocaleString(), icon: "◻" },
                  { label: "Avg / Month", value: Math.round(totalPages/5).toLocaleString(), icon: "◈" },
                  { label: "Day Streak",  value: "12", sub: "days 🔥", icon: "◉" },
                ].map(s => (
                  <div key={s.label} className="card-hover" style={{ background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 10px", textAlign: "center" }}>
                    <div style={{ fontSize: 16, color: "var(--gold)", marginBottom: 6 }}>{s.icon}</div>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "var(--text)", fontWeight: 400 }}>{s.value}{s.sub && <span style={{ fontSize: 12 }}> {s.sub}</span>}</div>
                    <div style={{ fontSize: 9, color: "var(--text3)", marginTop: 3, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.5px" }}>{s.label.toUpperCase()}</div>
                  </div>
                ))}
              </div>

              {/* Pages Chart */}
              <div style={{ background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: 14, padding: 18, marginBottom: 14 }}>
                <div style={{ fontSize: 9, color: "var(--text3)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 12 }}>Pages by Month</div>
                <MiniBar data={MONTHLY} />
              </div>

              {/* Currently Reading */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: "var(--text)" }}>Currently Reading</div>
                  <button onClick={() => setTab("reading")} style={{ color: "var(--gold)", fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}>see all →</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {readingBooks.slice(0,1).map(b => <ReadingCard key={b.id} book={b} onLog={setLogTarget} onMarkDone={handleMarkDone} />)}
                  {readingBooks.length === 0 && (
                    <div style={{ textAlign: "center", padding: 24, color: "var(--text3)", fontSize: 13, background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: 14, fontFamily: "'Cormorant Garamond', serif" }}>
                      No books in progress. <button onClick={() => setAddOpen(true)} style={{ color: "var(--gold)", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontFamily: "'Cormorant Garamond', serif" }}>Add one →</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Quote Teaser */}
              <div onClick={() => setTab("quote")} className="card-hover" style={{ background: "linear-gradient(135deg,rgba(201,168,76,0.05),rgba(124,92,191,0.05))", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 14, padding: 20, cursor: "pointer", marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontSize: 9, color: "var(--gold)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "2px", textTransform: "uppercase" }}>✦ Today's Quote</div>
                  <div style={{ fontSize: 8, color: "var(--text3)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "1px" }}>AI · LIVE</div>
                </div>
                {quoteLoading ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
                    <Spinner />
                    <span style={{ fontSize: 12, color: "var(--text3)", fontStyle: "italic", fontFamily: "'Cormorant Garamond', serif" }}>Finding today's quote…</span>
                  </div>
                ) : (
                  <>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: "var(--text2)", fontStyle: "italic", lineHeight: 1.7 }}>
                      "{quote.text.substring(0,100)}{quote.text.length>100?"…":""}"
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 10, fontFamily: "'JetBrains Mono', monospace" }}>— {quote.author} · tap to explore →</div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── READING ── */}
          {tab === "reading" && (
            <div className="fadeUp">
              <div style={{ padding: "20px 0 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "var(--text)", fontWeight: 300 }}>Currently Reading</div>
                <Tag color="var(--gold)">{readingBooks.length} books</Tag>
              </div>

              <div style={{ marginBottom: 16 }}>
                <BookSearchInput onSelect={book => handleAddBook({
                  id: Date.now(), title: book.title, author: book.author,
                  pages: book.pages||200, currentPage: 0, coverUrl: book.coverUrl,
                  genre: book.genre||"General",
                  addedDate: new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"}), sessions: []
                }, "reading")} placeholder="Quick-add by title or author…" />
                <div style={{ fontSize: 9, color: "var(--text3)", marginTop: 6, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.5px" }}>
                  COVERS &amp; PAGE COUNTS AUTO-FILLED FROM OPEN LIBRARY
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {readingBooks.map(b => <ReadingCard key={b.id} book={b} onLog={setLogTarget} onMarkDone={handleMarkDone} />)}
              </div>
              {readingBooks.length === 0 && (
                <div style={{ textAlign: "center", padding: "48px 20px" }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 40, color: "var(--text3)", marginBottom: 12 }}>◎</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "var(--text2)", marginBottom: 6 }}>Your shelf awaits</div>
                  <div style={{ fontSize: 12, color: "var(--text3)" }}>Search for a book above to begin tracking</div>
                </div>
              )}
            </div>
          )}

          {/* ── SHELVES ── */}
          {tab === "shelves" && (
            <div className="fadeUp">
              <div style={{ padding: "20px 0 16px", fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "var(--text)", fontWeight: 300 }}>My Library</div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 2, height: 16, background: "var(--gold)", borderRadius: 1, boxShadow: "0 0 8px var(--gold)" }} />
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--gold)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "1px" }}>READ · {readBooks.length}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {readBooks.map(b => <ShelfCard key={b.id} book={b} showRating onRate={handleRate} />)}
                </div>
              </div>

              <GoldDivider />

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 2, height: 16, background: "var(--cyan)", borderRadius: 1, boxShadow: "0 0 8px var(--cyan)" }} />
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--cyan)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "1px" }}>WANT TO READ · {wantBooks.length}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {wantBooks.map(b => <ShelfCard key={b.id} book={b} />)}
                </div>
              </div>
            </div>
          )}

          {/* ── QUOTE ── */}
          {tab === "quote" && (
            <div className="fadeUp">
              <div style={{ padding: "20px 0 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "var(--text)", fontWeight: 300 }}>Today's Verse</div>
                <div style={{ fontSize: 9, color: "var(--text3)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "1px" }}>AI · LIVE</div>
              </div>

              {/* Main quote card */}
              <div style={{ background: "linear-gradient(160deg,rgba(201,168,76,0.06),rgba(124,92,191,0.06))", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 20, padding: "36px 28px", position: "relative", overflow: "hidden", marginBottom: 14, minHeight: 220 }}>
                <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, background: "radial-gradient(circle,rgba(201,168,76,0.08),transparent 70%)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: -40, left: -40, width: 200, height: 200, background: "radial-gradient(circle,rgba(124,92,191,0.06),transparent 70%)", pointerEvents: "none" }} />

                {quoteLoading ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 160, gap: 16 }}>
                    <div style={{ width: 28, height: 28, border: "2px solid rgba(201,168,76,0.2)", borderTopColor: "var(--gold)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                    <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "1px" }}>
                      {quoteMood ? `FINDING ${quoteMood.toUpperCase()} QUOTE…` : "GENERATING UNIQUE QUOTE…"}
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 80, color: "rgba(201,168,76,0.1)", lineHeight: 0.8, marginBottom: 20 }}>"</div>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "var(--text)", fontStyle: "italic", lineHeight: 1.75, marginBottom: 24 }}>
                      {quote.text}
                    </div>
                    <div style={{ width: 40, height: 1, background: "var(--gold)", marginBottom: 12, boxShadow: "0 0 8px var(--gold)" }} />
                    <div style={{ fontSize: 13, color: "var(--gold)", fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, marginBottom: quote.context ? 8 : 0 }}>— {quote.author}</div>
                    {quote.context && (
                      <div style={{ fontSize: 11, color: "var(--text3)", fontStyle: "italic", lineHeight: 1.6, marginTop: 4 }}>{quote.context}</div>
                    )}
                  </>
                )}
              </div>

              {/* Mood selector */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 9, color: "var(--text3)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 10 }}>Generate by Mood</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {[
                    { label: "Inspiring", icon: "✦" },
                    { label: "Philosophical", icon: "◎" },
                    { label: "Humorous", icon: "◈" },
                    { label: "Poetic", icon: "❧" },
                    { label: "Adventurous", icon: "⟡" },
                    { label: "Timeless", icon: "◉" },
                  ].map(m => (
                    <button key={m.label} onClick={() => handleNewQuote(m.label.toLowerCase())}
                      disabled={quoteLoading}
                      style={{ padding: "7px 12px", background: "var(--bg1)", border: "1px solid var(--border2)",
                        borderRadius: 20, color: "var(--text2)", fontSize: 11, display: "flex", alignItems: "center", gap: 5,
                        transition: "all 0.2s", opacity: quoteLoading ? 0.5 : 1 }}
                      onMouseEnter={e => { if (!quoteLoading) { e.currentTarget.style.borderColor = "var(--gold)"; e.currentTarget.style.color = "var(--gold)"; e.currentTarget.style.background = "var(--gold3)"; }}}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.color = "var(--text2)"; e.currentTarget.style.background = "var(--bg1)"; }}>
                      <span style={{ fontSize: 10 }}>{m.icon}</span> {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate new button */}
              <button className="btn-gold" onClick={() => handleNewQuote()} disabled={quoteLoading}
                style={{ width: "100%", padding: "13px 0", fontSize: 13, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: quoteLoading ? 0.7 : 1 }}>
                {quoteLoading ? <><Spinner /> Generating…</> : "✦ Generate New Quote"}
              </button>

              {/* Quote history */}
              {quoteHistory.length > 1 && (
                <div>
                  <div style={{ fontSize: 9, color: "var(--text3)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 10 }}>Recent Quotes</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {quoteHistory.slice(1, 5).map((q, i) => (
                      <div key={i} className="card-hover" style={{ background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 16px", cursor: "pointer" }}
                        onClick={() => setQuote(q)}>
                        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: "var(--text2)", fontStyle: "italic", lineHeight: 1.6, marginBottom: 6 }}>
                          "{q.text.substring(0, 90)}{q.text.length > 90 ? "…" : ""}"
                        </div>
                        <div style={{ fontSize: 10, color: "var(--gold)", fontFamily: "'JetBrains Mono', monospace" }}>— {q.author}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 18px", marginTop: 14 }}>
                <div style={{ fontSize: 9, color: "var(--text3)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "1px", marginBottom: 6 }}>ABOUT FOLIO QUOTES</div>
                <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.7 }}>
                  Every quote is sourced live from AI — real quotes from real authors, thinkers and writers. Each one is unique, verified, and chosen to match the mood you select. No repeats, no static lists.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Nav */}
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(5,5,8,0.95)", backdropFilter: "blur(20px)", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-around", padding: "10px 0 18px", zIndex: 50 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "4px 20px", borderRadius: 10, transition: "all 0.2s", background: "none", border: "none" }}>
              <span style={{ fontSize: 16, color: tab===t.id ? "var(--gold)" : "var(--text3)", transition: "all 0.2s", textShadow: tab===t.id ? "0 0 12px var(--gold)" : "none" }}>{t.icon}</span>
              <span style={{ fontSize: 8, letterSpacing: "1.5px", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", color: tab===t.id ? "var(--gold)" : "var(--text3)", fontWeight: tab===t.id ? 700 : 400, transition: "all 0.2s" }}>{t.label}</span>
              {tab === t.id && <div style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--gold)", boxShadow: "0 0 6px var(--gold)" }} />}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
