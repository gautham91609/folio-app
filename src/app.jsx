import { useState, useEffect, useRef, useCallback } from "react";

const QUOTES = [
  { text: "A reader lives a thousand lives before he dies. The man who never reads lives only one.", author: "George R.R. Martin" },
  { text: "Not all those who wander are lost — but a reader always finds their way home.", author: "After Tolkien" },
  { text: "There is no friend as loyal as a book.", author: "Ernest Hemingway" },
  { text: "Reading is dreaming with open eyes.", author: "Yolanda King" },
  { text: "Books are a uniquely portable magic.", author: "Stephen King" },
  { text: "The reading of all good books is like conversation with the finest minds of past centuries.", author: "René Descartes" },
  { text: "I am part of everything that I have read.", author: "Theodore Roosevelt" },
  { text: "To read is to voyage through time.", author: "Carl Sagan" },
  { text: "Books are mirrors: we only see in them what we already have inside us.", author: "Carlos Ruiz Zafón" },
  { text: "The world belongs to those who read.", author: "Rick Holland" },
  { text: "A book must be the axe for the frozen sea within us.", author: "Franz Kafka" },
  { text: "Reading gives us someplace to go when we have to stay where we are.", author: "Mason Cooley" },
  { text: "The more that you read, the more things you will know.", author: "Dr. Seuss" },
  { text: "A word after a word after a word is power.", author: "Margaret Atwood" },
  { text: "We read to know we are not alone.", author: "C.S. Lewis" },
  { text: "Once you learn to read, you will be forever free.", author: "Frederick Douglass" },
  { text: "Reading is an act of civilization.", author: "Ben Okri" },
  { text: "Books choose their authors; the act of creation is not entirely rational.", author: "Salman Rushdie" },
  { text: "Good books don't give up all their secrets at once.", author: "Stephen King" },
  { text: "Books were my pass to personal freedom.", author: "Oprah Winfrey" },
  { text: "Reading is an exercise in empathy — walking in someone else's shoes.", author: "Malorie Blackman" },
  { text: "You can never get a cup of tea large enough or a book long enough to suit me.", author: "C.S. Lewis" },
  { text: "Reading without reflecting is like eating without digesting.", author: "Edmund Burke" },
  { text: "My alma mater was books, a good library.", author: "Malcolm X" },
  { text: "Think before you speak. Read before you think.", author: "Fran Lebowitz" },
  { text: "If you don't like to read, you haven't found the right book.", author: "J.K. Rowling" },
  { text: "No matter how busy you are, you must find time for reading.", author: "Confucius" },
  { text: "To acquire the habit of reading is to construct a refuge from almost all miseries.", author: "W. Somerset Maugham" },
  { text: "A good book is like a garden carried in the pocket.", author: "Chinese Proverb" },
  { text: "The book you don't read can't help you.", author: "Jim Rohn" },
  { text: "Stories are a communal currency of humanity.", author: "Tahir Shah" },
  { text: "Words can be like X-rays — they go through anything.", author: "Aldous Huxley" },
  { text: "A great book should leave you with many experiences.", author: "William Styron" },
  { text: "People say that life is the thing, but I prefer reading.", author: "Logan Pearsall Smith" },
  { text: "Books and doors are the same thing. Open them and go through.", author: "Jeanette Winterson" },
  { text: "A book is a dream that you hold in your hand.", author: "Neil Gaiman" },
  { text: "Reading is a discount ticket to everywhere.", author: "Mary Schmich" },
  { text: "Good friends, good books, and a sleepy conscience: this is the ideal life.", author: "Mark Twain" },
  { text: "You're never alone when you're reading a book.", author: "Susan Wiggs" },
  { text: "The unread story is not a story. The reader makes it live.", author: "Ursula K. Le Guin" },
  { text: "Some books leave us free and some books make us free.", author: "Ralph Waldo Emerson" },
  { text: "To read is to be alive twice.", author: "Anonymous" },
];

function getDailyQuote() {
  const today = new Date();
  const day = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
  return QUOTES[(today.getFullYear() * 1000 + day) % QUOTES.length];
}

async function searchOpenLibrary(query) {
  if (!query || query.trim().length < 2) return [];
  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=7&fields=key,title,author_name,cover_i,number_of_pages_median,first_publish_year,subject`
    );
    const data = await res.json();
    return (data.docs || []).map(doc => ({
      key: doc.key,
      title: doc.title,
      author: doc.author_name?.[0] || "Unknown Author",
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

function StarRating({ rating, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} onClick={() => onChange?.(s)}
          onMouseEnter={() => onChange && setHover(s)}
          onMouseLeave={() => onChange && setHover(0)}
          style={{ color: s <= (hover || rating) ? "#f59e0b" : "#2a2a4a", fontSize: 13, cursor: onChange ? "pointer" : "default", transition: "color 0.15s" }}>
          ★
        </span>
      ))}
    </div>
  );
}

function ProgressRing({ p, size = 52, stroke = 5, color = "#7c6af7" }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e1e30" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - p / 100)}
        strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease" }} />
    </svg>
  );
}

function BookCover({ url, title, size = 48 }) {
  const [err, setErr] = useState(false);
  const cols = ["#2a1a4a","#1a2a4a","#1a3a2a","#3a1a1a","#2a2a1a"];
  const col = cols[(title?.charCodeAt(0) || 0) % 5];
  const initials = title ? title.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase() : "?";
  if (url && !err) {
    return <img src={url} alt={title} onError={() => setErr(true)}
      style={{ width: size, height: size*1.45, objectFit: "cover", borderRadius: 5, flexShrink: 0, boxShadow: "2px 3px 10px rgba(0,0,0,0.5)" }} />;
  }
  return (
    <div style={{ width: size, height: size*1.45, background: `linear-gradient(135deg,${col},#0e0e1a)`, borderRadius: 5,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size*0.28, color: "rgba(255,255,255,0.45)", fontWeight: 700, flexShrink: 0,
      boxShadow: "2px 3px 10px rgba(0,0,0,0.5)", letterSpacing: 1 }}>
      {initials}
    </div>
  );
}

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
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#5a5a7a", pointerEvents: "none" }}>🔍</span>
        <input value={q} onChange={e => setQ(e.target.value)} onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder || "Search books…"}
          style={{ width: "100%", padding: "11px 38px 11px 34px", background: "#1a1a2e", border: "1px solid #3a3a55",
            borderRadius: open ? "10px 10px 0 0" : 10, color: "#e8e8f8", fontSize: 13, outline: "none", fontFamily: "inherit" }}
          onKeyDown={e => e.key === "Escape" && setOpen(false)} />
        {loading && (
          <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}>
            <div style={{ width: 13, height: 13, border: "2px solid #3a3a55", borderTopColor: "#7c6af7", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          </div>
        )}
      </div>
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 200, background: "#1a1a2e",
          border: "1px solid #3a3a55", borderTop: "none", borderRadius: "0 0 10px 10px",
          boxShadow: "0 12px 40px rgba(0,0,0,0.7)", maxHeight: 380, overflowY: "auto" }}>
          {results.map((book, i) => (
            <div key={book.key+i} onClick={() => { onSelect(book); setQ(""); setResults([]); setOpen(false); }}
              style={{ display: "flex", gap: 12, padding: "10px 14px", cursor: "pointer",
                borderBottom: i < results.length-1 ? "1px solid #2a2a3a" : "none", alignItems: "center" }}
              onMouseEnter={e => e.currentTarget.style.background = "#24243a"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <BookCover url={book.coverUrl} title={book.title} size={34} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: "#e8e8f8", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{book.title}</div>
                <div style={{ fontSize: 11, color: "#7a7a9a", marginTop: 1 }}>{book.author}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                  {book.year && <span style={{ fontSize: 9, color: "#5a5a7a" }}>{book.year}</span>}
                  {book.pages && <span style={{ fontSize: 9, color: "#5a5a7a" }}>· {book.pages}p</span>}
                </div>
              </div>
              <span style={{ fontSize: 10, color: "#7c6af7", flexShrink: 0 }}>+ Add</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LogModal({ book, onSave, onClose }) {
  const [mode, setMode] = useState("pages");
  const [pagesRead, setPagesRead] = useState("");
  const [absPage, setAbsPage] = useState(String(book.currentPage));

  const handleSave = () => {
    let newPage;
    if (mode === "pages") {
      const n = parseInt(pagesRead); if (isNaN(n) || n <= 0) return;
      newPage = Math.min(book.currentPage + n, book.pages);
    } else {
      const n = parseInt(absPage); if (isNaN(n) || n < 0) return;
      newPage = Math.min(n, book.pages);
    }
    onSave(book.id, newPage, Math.max(0, newPage - book.currentPage));
  };

  const inp = { width: "100%", padding: "10px 12px", background: "#1a1a2e", border: "1px solid #3a3a55",
    borderRadius: 8, color: "#e8e8f8", fontSize: 15, outline: "none", fontFamily: "inherit", textAlign: "center" };

  const previewPage = mode === "pages"
    ? (pagesRead && !isNaN(parseInt(pagesRead)) ? Math.min(book.currentPage + parseInt(pagesRead), book.pages) : null)
    : (absPage && !isNaN(parseInt(absPage)) ? Math.min(parseInt(absPage), book.pages) : null);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500, padding: 20 }} onClick={onClose}>
      <div style={{ background: "#16162a", border: "1px solid #3a3a55", borderRadius: 18, padding: 24, width: "100%", maxWidth: 340, animation: "fadeUp 0.25s ease" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 18 }}>
          <BookCover url={book.coverUrl} title={book.title} size={38} />
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, color: "#e8e8f8", lineHeight: 1.3 }}>{book.title}</div>
            <div style={{ fontSize: 11, color: "#7a7a9a", marginTop: 2 }}>Page {book.currentPage} of {book.pages} · {pct(book.currentPage, book.pages)}%</div>
          </div>
        </div>

        <div style={{ display: "flex", background: "#0e0e1a", borderRadius: 8, padding: 3, marginBottom: 16 }}>
          {[["pages","Pages I Read"],["abs","Jump to Page"]].map(([m,label]) => (
            <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: "7px 4px", border: "none", borderRadius: 6,
              background: mode===m ? "#7c6af7" : "transparent", color: mode===m ? "#fff" : "#6a6a8a",
              fontSize: 11, cursor: "pointer", fontWeight: mode===m ? 700 : 400, transition: "all 0.2s" }}>
              {label}
            </button>
          ))}
        </div>

        {mode === "pages" ? (
          <>
            <label style={{ fontSize: 11, color: "#7a7a9a", display: "block", marginBottom: 8 }}>Pages read in this session</label>
            <input style={inp} type="number" min="1" placeholder="e.g. 30" value={pagesRead}
              onChange={e => setPagesRead(e.target.value)} autoFocus />
          </>
        ) : (
          <>
            <label style={{ fontSize: 11, color: "#7a7a9a", display: "block", marginBottom: 8 }}>Current page number (1–{book.pages})</label>
            <input style={inp} type="number" min="0" max={book.pages} placeholder={String(book.currentPage)}
              value={absPage} onChange={e => setAbsPage(e.target.value)} autoFocus />
          </>
        )}

        {previewPage !== null && (
          <div style={{ marginTop: 10, padding: "8px 12px", background: "#1a1a2e", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#7a7a9a" }}>New position</span>
            <span style={{ fontSize: 12, color: "#a78bfa", fontWeight: 700 }}>
              p.{previewPage} / {book.pages} ({pct(previewPage, book.pages)}%)
              {mode==="pages" && previewPage > book.currentPage && ` +${previewPage-book.currentPage}`}
            </span>
          </div>
        )}

        <div style={{ height: 4, background: "#1e1e30", borderRadius: 2, overflow: "hidden", margin: "14px 0 18px" }}>
          <div style={{ height: "100%", background: "linear-gradient(90deg,#7c6af7,#a78bfa)", borderRadius: 2,
            width: `${previewPage !== null ? pct(previewPage,book.pages) : pct(book.currentPage,book.pages)}%`,
            transition: "width 0.4s ease" }} />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 10, background: "#1e1e30", border: "1px solid #3a3a55", borderRadius: 8, color: "#7a7a9a", fontSize: 13, cursor: "pointer" }}>Cancel</button>
          <button onClick={handleSave} style={{ flex: 2, padding: 10, background: "linear-gradient(135deg,#7c6af7,#5b4fd4)", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            Save Progress ✓
          </button>
        </div>
      </div>
    </div>
  );
}

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
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 500, padding: "50px 16px 20px", overflowY: "auto" }} onClick={onClose}>
      <div style={{ background: "#16162a", border: "1px solid #3a3a55", borderRadius: 18, padding: 22, width: "100%", maxWidth: 380, animation: "fadeUp 0.25s ease" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, color: "#e8e8f8" }}>
            {step===1 ? "Search for a Book" : "Confirm & Add"}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#5a5a7a", fontSize: 20, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        {step === 1 && (
          <>
            <div style={{ fontSize: 11, color: "#6a6a8a", marginBottom: 12 }}>
              Type a title or author — covers and page counts load automatically from Open Library.
            </div>
            <BookSearchInput onSelect={handleSelect} placeholder="e.g. Atomic Habits, Dune, Andy Weir…" />
            <div style={{ fontSize: 9, color: "#3a3a5a", marginTop: 8, textAlign: "center" }}>
              Powered by Open Library · openlibrary.org
            </div>
          </>
        )}

        {step === 2 && selected && (
          <>
            <button onClick={() => setStep(1)} style={{ background: "none", border: "none", color: "#7c6af7", fontSize: 12, cursor: "pointer", padding: "0 0 14px", display: "block" }}>← Search again</button>
            <div style={{ display: "flex", gap: 14, marginBottom: 18, alignItems: "flex-start" }}>
              <BookCover url={selected.coverUrl} title={selected.title} size={56} />
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: "#e8e8f8", lineHeight: 1.3, marginBottom: 4 }}>{selected.title}</div>
                <div style={{ fontSize: 12, color: "#7a7a9a", marginBottom: 3 }}>{selected.author}</div>
                {selected.year && <div style={{ fontSize: 10, color: "#5a5a7a" }}>First published {selected.year}</div>}
                {selected.genre && <div style={{ display: "inline-block", fontSize: 9, padding: "2px 7px", background: "#2a2a3a", color: "#7a7a9a", borderRadius: 4, marginTop: 5 }}>{selected.genre}</div>}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: "#7a7a9a", display: "block", marginBottom: 6 }}>
                Total pages {selected.pages ? `(suggested: ${selected.pages})` : "(enter manually)"}
              </label>
              <input type="number" value={customPages} onChange={e => setCustomPages(e.target.value)} placeholder="e.g. 320"
                style={{ width: "100%", padding: "9px 12px", background: "#1a1a2e", border: "1px solid #3a3a55", borderRadius: 8, color: "#e8e8f8", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 11, color: "#7a7a9a", display: "block", marginBottom: 8 }}>Add to shelf</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[["reading","📖 Reading","#7c6af7"],["wantToRead","🔖 Want to Read","#60a5fa"]].map(([v,label,col]) => (
                  <button key={v} onClick={() => setShelf(v)} style={{ flex: 1, padding: "9px 6px",
                    background: shelf===v ? col+"22" : "#1e1e30", border: `1px solid ${shelf===v ? col : "#3a3a55"}`,
                    borderRadius: 8, color: shelf===v ? col : "#6a6a8a", fontSize: 11, cursor: "pointer", fontWeight: shelf===v ? 700 : 400 }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleAdd} style={{ width: "100%", padding: 12, background: "linear-gradient(135deg,#7c6af7,#5b4fd4)",
              border: "none", borderRadius: 10, color: "#fff", fontSize: 14, cursor: "pointer", fontWeight: 700 }}>
              Add to My Library
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function SessionLog({ sessions }) {
  if (!sessions?.length) return <div style={{ fontSize: 10, color: "#4a4a6a" }}>No sessions logged yet. Tap "Log Pages" to start.</div>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {[...sessions].reverse().slice(0,5).map((s,i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 10, color: "#6a6a8a" }}>{s.date}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ height: 3, width: Math.min(80, Math.max(16, s.pagesRead*1.2)), background: "linear-gradient(90deg,#7c6af7,#a78bfa)", borderRadius: 2 }} />
            <span style={{ fontSize: 10, color: "#a78bfa", minWidth: 52, textAlign: "right" }}>+{s.pagesRead} pages</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ReadingCard({ book, onLog, onMarkDone }) {
  const [expanded, setExpanded] = useState(false);
  const p = pct(book.currentPage, book.pages);
  return (
    <div style={{ background: "#16162a", border: "1px solid #2a2a3a", borderRadius: 14, overflow: "hidden", transition: "border-color 0.2s" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "#7c6af7"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "#2a2a3a"}>
      <div style={{ display: "flex", gap: 14, padding: 14, cursor: "pointer" }} onClick={() => setExpanded(x => !x)}>
        <BookCover url={book.coverUrl} title={book.title} size={48} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, color: "#e8e8f8", fontWeight: 600, lineHeight: 1.3, marginBottom: 2 }}>{book.title}</div>
          <div style={{ fontSize: 11, color: "#7a7a9a", marginBottom: 8 }}>{book.author}</div>
          <div style={{ height: 3, background: "#2a2a3a", borderRadius: 2, overflow: "hidden", marginBottom: 4 }}>
            <div style={{ height: "100%", width: `${p}%`, background: "linear-gradient(90deg,#7c6af7,#a78bfa)", borderRadius: 2, transition: "width 0.8s ease" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 10, color: "#7c6af7" }}>pg {book.currentPage} / {book.pages}</span>
            <span style={{ fontSize: 10, color: "#5a5a7a" }}>{p}% · {book.pages - book.currentPage} left</span>
          </div>
        </div>
        <div style={{ position: "relative", flexShrink: 0, display: "flex", alignItems: "center" }}>
          <ProgressRing p={p} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#a78bfa", fontWeight: 700 }}>{p}%</div>
        </div>
      </div>

      <div style={{ padding: "0 14px 12px" }}>
        {expanded && (
          <div style={{ borderTop: "1px solid #1e1e30", paddingTop: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: "#5a5a7a", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Reading Sessions</div>
            <SessionLog sessions={book.sessions} />
            {book.addedDate && <div style={{ fontSize: 9, color: "#3a3a5a", marginTop: 8 }}>Added {book.addedDate}</div>}
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={e => { e.stopPropagation(); onLog(book); }} style={{ flex: 2, padding: "9px 0", background: "linear-gradient(135deg,#7c6af7,#5b4fd4)", border: "none", borderRadius: 8, color: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 700 }}>
            📖 Log Pages
          </button>
          <button onClick={e => { e.stopPropagation(); setExpanded(x=>!x); }} style={{ flex: 1, padding: "9px 0", background: "#1e1e30", border: "1px dashed #3a3a55", borderRadius: 8, color: "#7a7a9a", fontSize: 11, cursor: "pointer" }}>
            {expanded ? "▲ Less" : "▼ More"}
          </button>
          <button onClick={e => { e.stopPropagation(); onMarkDone(book); }} style={{ flex: 1, padding: "9px 0", background: "#1e1e30", border: "1px solid #2a2a3a", borderRadius: 8, color: "#5a5a7a", fontSize: 10, cursor: "pointer" }}>
            ✓ Done
          </button>
        </div>
      </div>
    </div>
  );
}

function ShelfCard({ book, compact, showRating, onRate }) {
  return (
    <div style={{ display: "flex", gap: 12, padding: compact ? 10 : 14, background: "#16162a", border: "1px solid #2a2a3a", borderRadius: 12, transition: "border-color 0.2s" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "#7c6af7"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "#2a2a3a"}>
      <BookCover url={book.coverUrl} title={book.title} size={compact ? 34 : 44} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: compact ? 12 : 13, color: "#e8e8f8", fontWeight: 600, lineHeight: 1.3, marginBottom: 2 }}>{book.title}</div>
        <div style={{ fontSize: 10, color: "#7a7a9a" }}>{book.author}</div>
        {showRating && <div style={{ marginTop: 4 }}><StarRating rating={book.rating||0} onChange={r => onRate?.(book.id,r)} /></div>}
        {book.finishedDate && <div style={{ fontSize: 9, color: "#4a4a6a", marginTop: 3 }}>✓ Finished {book.finishedDate}</div>}
        <div style={{ display: "inline-block", fontSize: 9, padding: "2px 6px", background: "#2a2a3a", color: "#6a6a8a", borderRadius: 4, marginTop: 4 }}>{book.genre}</div>
      </div>
    </div>
  );
}

function MiniBar({ data }) {
  const max = Math.max(...data.map(d => d.pages));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 80 }}>
      {data.map((d, i) => {
        const isLast = i === data.length - 1;
        const h = Math.max(4, Math.round((d.pages/max)*64));
        return (
          <div key={d.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ position: "relative", width: "100%" }}>
              {isLast && <div style={{ position: "absolute", top: -16, left: "50%", transform: "translateX(-50%)", fontSize: 9, color: "#a78bfa", whiteSpace: "nowrap", fontWeight: 700 }}>{d.pages}p</div>}
              <div style={{ height: h, background: isLast ? "linear-gradient(180deg,#7c6af7,#a78bfa)" : "#2a2a3a", borderRadius: "3px 3px 0 0", transition: "height 0.8s ease" }} />
            </div>
            <div style={{ fontSize: 9, color: "#5a5a7a" }}>{d.month}</div>
          </div>
        );
      })}
    </div>
  );
}

const DEMO_READING = [
  { id: 1, title: "The Great Mental Models", author: "Shane Parrish", pages: 280, currentPage: 187, genre: "Non-fiction",
    coverUrl: null, addedDate: "May 1",
    sessions: [{ date: "May 10", pagesRead: 32 }, { date: "May 13", pagesRead: 24 }, { date: "May 15", pagesRead: 18 }] },
  { id: 2, title: "Anxious People", author: "Fredrik Backman", pages: 352, currentPage: 64, genre: "Fiction",
    coverUrl: null, addedDate: "May 8",
    sessions: [{ date: "May 12", pagesRead: 40 }, { date: "May 14", pagesRead: 24 }] },
];
const DEMO_READ = [
  { id: 3,  title: "Atomic Habits",          author: "James Clear",       pages: 320, rating: 5, genre: "Self-help", finishedDate: "Apr 28", coverUrl: null },
  { id: 4,  title: "Project Hail Mary",      author: "Andy Weir",         pages: 476, rating: 5, genre: "Sci-Fi",    finishedDate: "Apr 12", coverUrl: null },
  { id: 5,  title: "Shoe Dog",               author: "Phil Knight",       pages: 400, rating: 4, genre: "Memoir",    finishedDate: "Mar 30", coverUrl: null },
  { id: 6,  title: "The Midnight Library",   author: "Matt Haig",         pages: 304, rating: 4, genre: "Fiction",   finishedDate: "Mar 15", coverUrl: null },
  { id: 7,  title: "Sapiens",               author: "Yuval Noah Harari", pages: 443, rating: 5, genre: "History",   finishedDate: "Feb 28", coverUrl: null },
  { id: 8,  title: "The Psychology of Money",author: "Morgan Housel",     pages: 256, rating: 5, genre: "Finance",   finishedDate: "Feb 10", coverUrl: null },
];
const DEMO_WANT = [
  { id: 12, title: "Fourth Wing",        author: "Rebecca Yarros",       genre: "Fantasy",     coverUrl: null },
  { id: 13, title: "The Creative Act",   author: "Rick Rubin",           genre: "Art",         coverUrl: null },
  { id: 14, title: "Poor Charlie's Almanack", author: "Charlie Munger",  genre: "Finance",     coverUrl: null },
  { id: 15, title: "Empire of Pain",     author: "Patrick Radden Keefe", genre: "Non-fiction", coverUrl: null },
];
const MONTHLY = [
  { month: "Jan", pages: 1384 }, { month: "Feb", pages: 755 },
  { month: "Mar", pages: 704 },  { month: "Apr", pages: 663 },
  { month: "May", pages: 251 },
];

export default function Folio() {
  const [tab, setTab] = useState("dashboard");
  const [quote] = useState(getDailyQuote);
  const [readingBooks, setReadingBooks] = useState(DEMO_READING);
  const [readBooks, setReadBooks] = useState(DEMO_READ);
  const [wantBooks, setWantBooks] = useState(DEMO_WANT);
  const [logTarget, setLogTarget] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [notif, setNotif] = useState(null);

  const booksRead = readBooks.length;
  const yearGoal = 24;
  const goalPct = Math.min(100, Math.round((booksRead / yearGoal) * 100));
  const totalPages = MONTHLY.reduce((a, b) => a + b.pages, 0);

  const showNotif = useCallback(msg => { setNotif(msg); setTimeout(() => setNotif(null), 3000); }, []);

  const handleLogSave = (id, newPage, pagesLogged) => {
    const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
    let finished = null;
    setReadingBooks(prev => {
      return prev.map(b => {
        if (b.id !== id) return b;
        const sessions = [...(b.sessions||[])];
        if (pagesLogged > 0) sessions.push({ date: today, pagesRead: pagesLogged });
        if (newPage >= b.pages) finished = { ...b, sessions, currentPage: b.pages };
        return { ...b, currentPage: newPage, sessions };
      });
    });
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
    if (shelf === "reading") {
      setReadingBooks(prev => [...prev, book]);
      showNotif(`"${book.title}" added to Currently Reading!`);
      setTab("reading");
    } else {
      setWantBooks(prev => [...prev, book]);
      showNotif(`"${book.title}" added to Want to Read!`);
    }
  };

  const handleRate = (id, rating) => setReadBooks(prev => prev.map(b => b.id===id ? {...b, rating} : b));

  const TABS = [
    { id: "dashboard", icon: "◈", label: "Home" },
    { id: "reading",   icon: "📖", label: "Reading" },
    { id: "shelves",   icon: "🗂",  label: "Shelves" },
    { id: "quote",     icon: "✦",  label: "Quote" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0e0e1a", color: "#e8e8f8", fontFamily: "'DM Sans', sans-serif", paddingBottom: 80 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0e0e1a; }
        ::-webkit-scrollbar-thumb { background: #3a3a60; border-radius: 2px; }
        input::placeholder { color: #4a4a6a; }
        input:focus { border-color: #7c6af7 !important; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {notif && (
        <div style={{ position: "fixed", top: 14, left: "50%", transform: "translateX(-50%)",
          background: "linear-gradient(135deg,#7c6af7,#5b4fd4)", color: "#fff",
          padding: "10px 22px", borderRadius: 24, fontSize: 13, zIndex: 1000,
          boxShadow: "0 6px 24px rgba(124,106,247,0.5)", whiteSpace: "nowrap",
          animation: "slideDown 0.25s ease" }}>
          {notif}
        </div>
      )}

      {logTarget && <LogModal book={logTarget} onSave={handleLogSave} onClose={() => setLogTarget(null)} />}
      {addOpen && <AddBookModal onAdd={handleAddBook} onClose={() => setAddOpen(false)} />}

      {/* Header */}
      <div style={{ padding: "16px 18px 12px", background: "linear-gradient(180deg,#12122a,#0e0e1a)", borderBottom: "1px solid #1a1a2e", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, letterSpacing: "-0.3px" }}>Folio</div>
            <div style={{ fontSize: 9, color: "#5a5a7a", letterSpacing: "1.2px", textTransform: "uppercase" }}>Reading Companion</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button onClick={() => setAddOpen(true)} style={{ background: "linear-gradient(135deg,#7c6af7,#5b4fd4)", border: "none", borderRadius: 20, color: "#fff", fontSize: 12, padding: "7px 14px", cursor: "pointer", fontWeight: 700 }}>+ Add Book</button>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#7c6af7,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15 }}>G</div>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 16px", maxWidth: 480, margin: "0 auto" }}>

        {tab === "dashboard" && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            <div style={{ margin: "18px 0 14px", background: "linear-gradient(135deg,#1a1a3a,#1e1630)", border: "1px solid #3a2a60", borderRadius: 16, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, marginBottom: 4 }}>2025 Reading Goal</div>
                  <div><span style={{ fontSize: 26, fontWeight: 700, color: "#a78bfa" }}>{booksRead}</span><span style={{ fontSize: 13, color: "#5a5a7a" }}> / {yearGoal} books</span></div>
                </div>
                <div style={{ position: "relative" }}>
                  <ProgressRing p={goalPct} size={68} stroke={6} color="#a78bfa" />
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#a78bfa", fontWeight: 700 }}>{goalPct}%</div>
                </div>
              </div>
              <div style={{ height: 4, background: "#2a2a40", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${goalPct}%`, background: "linear-gradient(90deg,#7c6af7,#c4b5fd)", borderRadius: 2, transition: "width 1.2s" }} />
              </div>
              <div style={{ fontSize: 10, color: "#5a5a7a", marginTop: 6 }}>{yearGoal - booksRead} more to go · 12-day streak 🔥</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 18 }}>
              {[["📄","Pages Read",totalPages.toLocaleString()],["📅","Avg/Month",Math.round(totalPages/5).toLocaleString()],["","Day Streak","12🔥"]].map(([icon,label,val]) => (
                <div key={label} style={{ background: "#16162a", border: "1px solid #2a2a3a", borderRadius: 12, padding: "12px 8px", textAlign: "center" }}>
                  {icon && <div style={{ fontSize: 17, marginBottom: 4 }}>{icon}</div>}
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#e8e8f8" }}>{val}</div>
                  <div style={{ fontSize: 9, color: "#5a5a7a", marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>

            <div style={{ background: "#16162a", border: "1px solid #2a2a3a", borderRadius: 14, padding: 16, marginBottom: 18 }}>
              <div style={{ fontSize: 11, color: "#7a7a9a", marginBottom: 8, fontWeight: 500 }}>Pages by Month</div>
              <MiniBar data={MONTHLY} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16 }}>Currently Reading</div>
                <button onClick={() => setTab("reading")} style={{ background: "none", border: "none", color: "#7c6af7", fontSize: 11, cursor: "pointer", padding: 0 }}>See all →</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {readingBooks.slice(0,1).map(b => <ReadingCard key={b.id} book={b} onLog={setLogTarget} onMarkDone={handleMarkDone} />)}
                {readingBooks.length === 0 && (
                  <div style={{ textAlign: "center", padding: 20, color: "#5a5a7a", fontSize: 12 }}>
                    No books in progress. <button onClick={() => setAddOpen(true)} style={{ background: "none", border: "none", color: "#7c6af7", cursor: "pointer", fontSize: 12, padding: 0 }}>Add one →</button>
                  </div>
                )}
              </div>
            </div>

            <div onClick={() => setTab("quote")} style={{ background: "linear-gradient(135deg,#1a1028,#1c1432)", border: "1px solid #3a2a55", borderRadius: 14, padding: 16, cursor: "pointer" }}>
              <div style={{ fontSize: 9, color: "#7c6af7", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 8 }}>✦ Today's Quote</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 13, color: "#c8c8e8", fontStyle: "italic", lineHeight: 1.6 }}>
                "{quote.text.substring(0,90)}{quote.text.length>90?"…":""}"
              </div>
              <div style={{ fontSize: 10, color: "#5a5a7a", marginTop: 6 }}>— {quote.author} · Tap to read more</div>
            </div>
          </div>
        )}

        {tab === "reading" && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            <div style={{ padding: "18px 0 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18 }}>Currently Reading</div>
              <span style={{ fontSize: 11, color: "#5a5a7a" }}>{readingBooks.length} book{readingBooks.length!==1?"s":""}</span>
            </div>
            <div style={{ marginBottom: 16 }}>
              <BookSearchInput onSelect={book => handleAddBook({ id: Date.now(), title: book.title, author: book.author,
                pages: book.pages||200, currentPage: 0, coverUrl: book.coverUrl, genre: book.genre||"General",
                addedDate: new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"}), sessions: [] }, "reading")}
                placeholder="Quick-add: search by title or author…" />
              <div style={{ fontSize: 9, color: "#3a3a5a", marginTop: 5, paddingLeft: 2 }}>Covers &amp; page counts auto-filled from Open Library</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {readingBooks.map(b => <ReadingCard key={b.id} book={b} onLog={setLogTarget} onMarkDone={handleMarkDone} />)}
            </div>
            {readingBooks.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, marginBottom: 6 }}>Your shelf is empty</div>
                <div style={{ fontSize: 12, color: "#5a5a7a" }}>Search for a book above to get started</div>
              </div>
            )}
          </div>
        )}

        {tab === "shelves" && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            <div style={{ padding: "18px 0 14px", fontFamily: "'Playfair Display', serif", fontSize: 18 }}>My Shelves</div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ width: 3, height: 16, background: "#a78bfa", borderRadius: 2 }} />
                <div style={{ fontSize: 12, fontWeight: 600, color: "#a78bfa" }}>Read ({readBooks.length})</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {readBooks.map(b => <ShelfCard key={b.id} book={b} showRating compact onRate={handleRate} />)}
              </div>
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ width: 3, height: 16, background: "#60a5fa", borderRadius: 2 }} />
                <div style={{ fontSize: 12, fontWeight: 600, color: "#60a5fa" }}>Want to Read ({wantBooks.length})</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {wantBooks.map(b => <ShelfCard key={b.id} book={b} compact />)}
              </div>
            </div>
          </div>
        )}

        {tab === "quote" && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            <div style={{ padding: "18px 0 20px", fontFamily: "'Playfair Display', serif", fontSize: 18 }}>Today's Reading Quote</div>
            <div style={{ background: "linear-gradient(160deg,#1a1028,#0e1828)", border: "1px solid #3a2a55", borderRadius: 20, padding: "28px 24px", position: "relative", overflow: "hidden", marginBottom: 14 }}>
              <div style={{ position: "absolute", top: -30, right: -30, width: 180, height: 180, background: "radial-gradient(circle,rgba(124,106,247,0.12),transparent 70%)", borderRadius: "50%" }} />
              <div style={{ fontSize: 64, color: "rgba(124,106,247,0.1)", fontFamily: "'Playfair Display', serif", lineHeight: 1, marginBottom: 10, marginTop: -8 }}>"</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, color: "#e8e8f8", fontStyle: "italic", lineHeight: 1.65, marginBottom: 22 }}>{quote.text}</div>
              <div style={{ width: 28, height: 2, background: "#7c6af7", marginBottom: 10 }} />
              <div style={{ fontSize: 13, color: "#a78bfa", fontWeight: 600 }}>— {quote.author}</div>
            </div>
            <div style={{ background: "#16162a", border: "1px solid #2a2a3a", borderRadius: 12, padding: "12px 16px" }}>
              <div style={{ fontSize: 10, color: "#4a4a6a", marginBottom: 4 }}>💡 Refreshes daily</div>
              <div style={{ fontSize: 11, color: "#6a6a8a", lineHeight: 1.6 }}>42 curated quotes rotate by calendar date — a fresh one every day.</div>
            </div>
          </div>
        )}
      </div>

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(14,14,26,0.96)", backdropFilter: "blur(12px)", borderTop: "1px solid #1a1a2e", display: "flex", justifyContent: "space-around", padding: "10px 0 16px", zIndex: 50 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", padding: "4px 16px", borderRadius: 10 }}>
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.5px", color: tab===t.id ? "#a78bfa" : "#3a3a5a", fontWeight: tab===t.id ? 700 : 400 }}>{t.label}</span>
            {tab === t.id && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#a78bfa" }} />}
          </button>
        ))}
      </div>
    </div>
  );
}
