import { useState, useEffect, useRef, useCallback } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signInWithPopup,
  GoogleAuthProvider, signOut, updateProfile,
} from "firebase/auth";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot,
} from "firebase/firestore";

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
const db = getFirestore(firebaseApp);
const googleProvider = new GoogleAuthProvider();

/* ─── FIRESTORE HELPERS ─────────────────────────────────── */
// Each user gets a single document: users/{uid}
// Shape: { reading: [...], read: [...], want: [...], yearGoal: 24 }
async function loadUserData(uid) {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? snap.data() : null;
  } catch(e) { console.error("loadUserData", e); return null; }
}

async function saveUserData(uid, data) {
  try {
    await setDoc(doc(db, "users", uid), data, { merge: true });
  } catch(e) { console.error("saveUserData", e); }
}

/* ─── STYLES ─────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@300;400&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#050508;--bg1:#0a0a10;--bg2:#0f0f18;--bg3:#14141f;
    --border:rgba(255,255,255,0.06);--border2:rgba(255,255,255,0.12);
    --gold:#c9a84c;--gold2:#e8cc7a;--gold3:rgba(201,168,76,0.12);
    --cyan:#4cc9c9;--violet:#7c5cbf;
    --text:#e8e8f0;--text2:#9090a8;--text3:#505068;
    --ok:#4caf82;--err:#cf6679;
  }
  html,body{background:var(--bg);color:var(--text);font-family:'Syne',sans-serif;min-height:100vh;overflow-x:hidden}
  ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:var(--border2);border-radius:2px}
  ::selection{background:rgba(201,168,76,0.3)}
  input,button,textarea,select{font-family:inherit}
  input::placeholder,textarea::placeholder{color:var(--text3)}
  input:focus,textarea:focus,select:focus{outline:none}
  button{cursor:pointer;border:none;background:none}

  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes glow{0%,100%{text-shadow:0 0 20px rgba(201,168,76,0.5)}50%{text-shadow:0 0 40px rgba(201,168,76,0.9),0 0 80px rgba(201,168,76,0.3)}}
  @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(201,168,76,0.4)}70%{box-shadow:0 0 0 8px rgba(201,168,76,0)}}

  .fadeUp{animation:fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both}
  .fadeIn{animation:fadeIn 0.3s ease both}
  .ch{transition:border-color 0.2s,transform 0.2s,box-shadow 0.2s}
  .ch:hover{border-color:rgba(201,168,76,0.3)!important;transform:translateY(-1px);box-shadow:0 6px 24px rgba(0,0,0,0.4)}
  .btn-g{background:linear-gradient(135deg,#c9a84c,#a8833a);color:#050508;font-weight:700;border-radius:6px;transition:all 0.2s;letter-spacing:0.5px;font-family:'Syne',sans-serif}
  .btn-g:hover{background:linear-gradient(135deg,#e8cc7a,#c9a84c);box-shadow:0 4px 20px rgba(201,168,76,0.4);transform:translateY(-1px)}
  .btn-g:disabled{opacity:0.6;cursor:not-allowed;transform:none}
  .btn-o{border:1px solid var(--border2);color:var(--text2);border-radius:6px;transition:all 0.2s;background:transparent}
  .btn-o:hover{border-color:var(--gold);color:var(--gold);background:var(--gold3)}
  .inp{width:100%;padding:11px 14px;background:var(--bg2);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:14px;transition:border-color 0.2s}
  .inp:focus{border-color:var(--gold);box-shadow:0 0 0 3px rgba(201,168,76,0.1)}
  .lbl{font-size:10px;color:var(--text3);display:block;margin-bottom:6px;font-family:'JetBrains Mono',monospace;letter-spacing:1px;text-transform:uppercase}
`;

/* ─── HELPERS ────────────────────────────────────────────── */
function useDebounce(v, d) {
  const [dv, setDv] = useState(v);
  useEffect(() => { const t = setTimeout(() => setDv(v), d); return () => clearTimeout(t); }, [v, d]);
  return dv;
}
function pct(c, t) { return t ? Math.min(100, Math.round((c / t) * 100)) : 0; }
function today() { return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }); }

const QUOTES = [
  { text: "A reader lives a thousand lives before he dies. The man who never reads lives only one.", author: "George R.R. Martin" },
  { text: "There is no friend as loyal as a book.", author: "Ernest Hemingway" },
  { text: "We read to know we are not alone.", author: "C.S. Lewis" },
  { text: "A book is a dream that you hold in your hand.", author: "Neil Gaiman" },
  { text: "Books are a uniquely portable magic.", author: "Stephen King" },
  { text: "To read is to voyage through time.", author: "Carl Sagan" },
  { text: "A word after a word after a word is power.", author: "Margaret Atwood" },
  { text: "If you don't like to read, you haven't found the right book.", author: "J.K. Rowling" },
  { text: "Good books don't give up all their secrets at once.", author: "Stephen King" },
  { text: "Books were my pass to personal freedom.", author: "Oprah Winfrey" },
  { text: "A book must be the axe for the frozen sea within us.", author: "Franz Kafka" },
  { text: "Once you learn to read, you will be forever free.", author: "Frederick Douglass" },
  { text: "The reading of all good books is like conversation with the finest minds of past centuries.", author: "René Descartes" },
  { text: "Literature is the most agreeable way of ignoring life.", author: "Fernando Pessoa" },
  { text: "Think before you speak. Read before you think.", author: "Fran Lebowitz" },
  { text: "The unread story is not a story; it is little black marks on wood pulp.", author: "Ursula K. Le Guin" },
  { text: "Reading without reflecting is like eating without digesting.", author: "Edmund Burke" },
  { text: "I cannot live without books.", author: "Thomas Jefferson" },
  { text: "A room without books is like a body without a soul.", author: "Marcus Tullius Cicero" },
  { text: "The books that the world calls immoral are the books that show the world its own shame.", author: "Oscar Wilde" },
  { text: "It is what you read when you don't have to that determines what you will be.", author: "Oscar Wilde" },
  { text: "I am part of everything that I have read.", author: "Theodore Roosevelt" },
  { text: "Books are the mirrors of the soul.", author: "Virginia Woolf" },
  { text: "You don't have to burn books to destroy a culture. Just get people to stop reading them.", author: "Ray Bradbury" },
  { text: "A book is a loaded gun in the house next door.", author: "Ray Bradbury" },
  { text: "Without books, history is silent, literature dumb, science crippled.", author: "Barbara Tuchman" },
  { text: "Books are the carriers of civilization.", author: "Barbara Tuchman" },
  { text: "I kept always two books in my pocket, one to read, one to write in.", author: "Robert Louis Stevenson" },
  { text: "The greatest part of a writer's time is spent in reading.", author: "Samuel Johnson" },
  { text: "No entertainment is so cheap as reading, nor any pleasure so lasting.", author: "Mary Wortley Montagu" },
  { text: "Reading is to the mind what exercise is to the body.", author: "Joseph Addison" },
  { text: "The love of learning, the sequestered nooks, and all the sweet serenity of books.", author: "Henry Wadsworth Longfellow" },
  { text: "My alma mater was books, a good library.", author: "Malcolm X" },
  { text: "In books I have traveled, not only to other worlds, but into my own.", author: "Anna Quindlen" },
  { text: "Books are the plane, and the train, and the road. They are the destination and the journey.", author: "Anna Quindlen" },
  { text: "Reading is the sole means by which we slip, involuntarily, often helplessly, into another's skin.", author: "Joyce Carol Oates" },
  { text: "Literature is the art of discovering something extraordinary about ordinary people.", author: "Boris Pasternak" },
  { text: "Stories are a communal currency of humanity.", author: "Tahir Shah" },
  { text: "Words can be like X-rays if you use them properly — they'll go through anything.", author: "Aldous Huxley" },
  { text: "Every burned book enlightens the world.", author: "Ralph Waldo Emerson" },
  { text: "Some books leave us free and some books make us free.", author: "Ralph Waldo Emerson" },
  { text: "If we encounter a man of rare intellect, we should ask him what books he reads.", author: "Ralph Waldo Emerson" },
  { text: "I find television very educating. Every time somebody turns it on, I go into the other room and read.", author: "Groucho Marx" },
  { text: "Outside of a dog, a book is a man's best friend. Inside of a dog it's too dark to read.", author: "Groucho Marx" },
  { text: "The man who does not read has no advantage over the man who cannot read.", author: "Mark Twain" },
  { text: "Classic: a book which people praise and don't read.", author: "Mark Twain" },
  { text: "Good friends, good books, and a sleepy conscience: this is the ideal life.", author: "Mark Twain" },
  { text: "Be careful about reading health books. You may die of a misprint.", author: "Mark Twain" },
  { text: "The more that you read, the more things you will know.", author: "Dr. Seuss" },
  { text: "You're never alone when you're reading a book.", author: "Susan Wiggs" },
  { text: "Reading is a discount ticket to everywhere.", author: "Mary Schmich" },
  { text: "People say that life is the thing, but I prefer reading.", author: "Logan Pearsall Smith" },
  { text: "Reading is an act of civilization.", author: "Ben Okri" },
  { text: "Wherever I am, if I've got a book with me, I have a place I can go and be happy.", author: "J.K. Rowling" },
  { text: "Words are our most inexhaustible source of magic.", author: "J.K. Rowling" },
  { text: "No matter how busy you may think you are, you must find time for reading.", author: "Confucius" },
  { text: "The book you don't read can't help you.", author: "Jim Rohn" },
  { text: "Show me a family of readers, and I will show you the people who move the world.", author: "Napoleon Bonaparte" },
  { text: "To acquire the habit of reading is to construct for yourself a refuge from almost all the miseries of life.", author: "W. Somerset Maugham" },
  { text: "Books are the quietest and most constant of friends.", author: "Charles W. Eliot" },
  { text: "What really knocks me out is a book that makes you wish the author was a terrific friend.", author: "J.D. Salinger" },
  { text: "A great book should leave you with many experiences, and slightly exhausted at the end.", author: "William Styron" },
  { text: "Reading is a basic tool in the living of a good life.", author: "Mortimer J. Adler" },
  { text: "In the case of good books, the point is not how many you get through, but how many get through to you.", author: "Mortimer J. Adler" },
  { text: "Reading gave us someplace to go when we had to stay where we were.", author: "Mason Cooley" },
  { text: "A book is a gift you can open again and again.", author: "Garrison Keillor" },
  { text: "If there's a book that you want to read, but it hasn't been written yet, you must write it.", author: "Toni Morrison" },
  { text: "There is no greater agony than bearing an untold story inside you.", author: "Maya Angelou" },
  { text: "The world was hers for the reading.", author: "Betty Smith" },
  { text: "A book is a version of the world. If you do not like it, offer your own version in return.", author: "Salman Rushdie" },
  { text: "Books choose their authors; the act of creation is not entirely rational.", author: "Salman Rushdie" },
  { text: "Literature is where I go to explore the highest and lowest places in human society.", author: "Jeanette Winterson" },
  { text: "Books and doors are the same thing. You open them, and you go through into another world.", author: "Jeanette Winterson" },
  { text: "I took a speed-reading course and read War and Peace in twenty minutes. It involves Russia.", author: "Woody Allen" },
  { text: "A good novel tells us the truth about its hero; a bad novel tells us the truth about its author.", author: "G.K. Chesterton" },
  { text: "Literature is news that stays news.", author: "Ezra Pound" },
  { text: "I have always imagined that Paradise will be a kind of library.", author: "Jorge Luis Borges" },
  { text: "If you only read the books that everyone else is reading, you can only think what everyone else thinks.", author: "Haruki Murakami" },
  { text: "Every time I read a great book I felt I was reading a kind of map, a treasure map.", author: "Markus Zusak" },
  { text: "When you read a great book, you don't escape from life. You plunge deeper into it.", author: "Julian Barnes" },
  { text: "A good reader, a major reader, an active and creative reader is a rereader.", author: "Vladimir Nabokov" },
  { text: "In reading, one should notice and fondle details.", author: "Vladimir Nabokov" },
  { text: "We don't need tables of dos and don'ts: we need books.", author: "Philip Pullman" },
  { text: "Reading is not escapism: it's the deepest form of engagement with the world.", author: "Philip Pullman" },
  { text: "Some books you read. Some books you enjoy. But some books just swallow you whole.", author: "John Green" },
  { text: "Great books help you understand, and they help you feel understood.", author: "John Green" },
  { text: "You think your pain is unprecedented in the history of the world, but then you read.", author: "James Baldwin" },
  { text: "It was books that taught me that the things that tormented me were the things that connected me with everyone.", author: "James Baldwin" },
  { text: "Until I feared I would lose it, I never loved to read. One does not love breathing.", author: "Harper Lee" },
  { text: "I am not afraid of storms, for I am learning how to sail my ship.", author: "Louisa May Alcott" },
  { text: "I declare after all there is no enjoyment like reading!", author: "Jane Austen" },
  { text: "The person who has not pleasure in a good novel must be intolerably stupid.", author: "Jane Austen" },
  { text: "If a book is well written, I always find it too short.", author: "Jane Austen" },
  { text: "A woman must have money and a room of her own if she is to write fiction.", author: "Virginia Woolf" },
  { text: "Lock up your libraries if you like; but there is no gate you can set upon the freedom of my mind.", author: "Virginia Woolf" },
  { text: "You cannot find peace by avoiding life.", author: "Virginia Woolf" },
  { text: "Literature is strewn with the wreckage of men who have minded beyond reason the opinions of others.", author: "Virginia Woolf" },
  { text: "Every secret of a writer's soul is written large in his works.", author: "Virginia Woolf" },
  { text: "The genuine lover of reading will brave anything to find suitable conditions for it.", author: "Virginia Woolf" },
  { text: "A library is thought in cold storage.", author: "Herbert Samuel" },
  { text: "Knowledge is of two kinds. We know a subject ourselves, or we know where to find information about it.", author: "Samuel Johnson" },
  { text: "What is written without effort is in general read without pleasure.", author: "Samuel Johnson" },
  { text: "A writer only begins a book. A reader finishes it.", author: "Samuel Johnson" },
  { text: "The greatest thing in the world is to know how to belong to oneself.", author: "Michel de Montaigne" },
  { text: "I have never known any distress that an hour's reading did not relieve.", author: "Montesquieu" },
  { text: "To learn to read is to light a fire; every syllable that is spelled out is a spark.", author: "Victor Hugo" },
  { text: "He who has not the habit of reading is imprisoned in one world as regards time and place.", author: "Lin Yutang" },
  { text: "Books can never be killed by fire. People die, but books never die.", author: "Franklin D. Roosevelt" },
  { text: "A book not read is a life not lived.", author: "Italian Proverb" },
  { text: "Tell me what you read and I'll tell you who you are.", author: "François Mauriac" },
  { text: "There are books so alive that you're always afraid that while you weren't reading, the book has changed.", author: "Marina Tsvetaeva" },
  { text: "The more I read, the more I'm certain that I know nothing.", author: "Voltaire" },
  { text: "Judge a man by his questions rather than his answers.", author: "Voltaire" },
  { text: "Let us read and let us dance — two amusements that will never do any harm to the world.", author: "Voltaire" },
  { text: "Writing is the painting of the voice.", author: "Voltaire" },
  { text: "Reading is thinking with someone else's head instead of one's own.", author: "Arthur Schopenhauer" },
  { text: "Buying books would be a good thing if one could also buy the time to read them.", author: "Arthur Schopenhauer" },
  { text: "A man only learns in two ways: one by reading, and the other by association with smarter people.", author: "Will Rogers" },
  { text: "The world is a book, and those who do not travel read only one page.", author: "Saint Augustine" },
  { text: "Reading furnishes the mind only with materials of knowledge; it is thinking that makes what we read ours.", author: "John Locke" },
  { text: "Read not to contradict and confute, but to weigh and consider.", author: "Francis Bacon" },
  { text: "Some books are to be tasted, others to be swallowed, and some few to be chewed and digested.", author: "Francis Bacon" },
  { text: "Knowledge is power.", author: "Francis Bacon" },
  { text: "He who reads much and walks much, sees much and knows much.", author: "Miguel de Cervantes" },
  { text: "Study without desire spoils the memory, and it retains nothing that it takes in.", author: "Leonardo da Vinci" },
  { text: "Learning without thought is labor lost; thought without learning is perilous.", author: "Confucius" },
  { text: "You cannot open a book without learning something.", author: "Confucius" },
  { text: "The wisest mind has something yet to learn.", author: "George Santayana" },
  { text: "It is not enough to have a good mind; the main thing is to use it well.", author: "René Descartes" },
  { text: "The more I read, the more I acquire, the more certain I am that I know nothing.", author: "Voltaire" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "The soul that sees beauty may sometimes walk alone.", author: "Johann Wolfgang von Goethe" },
  { text: "All the knowledge I possess everyone else can acquire, but my heart is all my own.", author: "Johann Wolfgang von Goethe" },
  { text: "The limits of my language mean the limits of my world.", author: "Ludwig Wittgenstein" },
  { text: "The purpose of literature is to turn blood into ink.", author: "T.S. Eliot" },
  { text: "Genuine poetry can communicate before it is understood.", author: "T.S. Eliot" },
  { text: "A book is a fragile creature, it suffers the wear of time.", author: "Umberto Eco" },
  { text: "I love the smell of book ink in the morning.", author: "Umberto Eco" },
  { text: "Everything in the world exists in order to end up as a book.", author: "Stéphane Mallarmé" },
  { text: "The best effect of any book is that it excites the reader to self-activity.", author: "Thomas Carlyle" },
  { text: "The true university of these days is a collection of books.", author: "Thomas Carlyle" },
  { text: "In the highest civilization, the book is still the highest delight.", author: "Ralph Waldo Emerson" },
  { text: "Books are the bees which carry the quickening pollen from one to another mind.", author: "James Russell Lowell" },
  { text: "Literature is the art of writing something that will be read twice.", author: "Cyril Connolly" },
  { text: "The more books we read, the sooner we perceive that the function of a writer is to produce a masterpiece.", author: "Cyril Connolly" },
  { text: "Man reading should be man intensely alive.", author: "Ezra Pound" },
  { text: "A library is an arsenal of liberty.", author: "Unknown" },
  { text: "Books support us in our solitude and keep us from being a burden to ourselves.", author: "Jeremy Collier" },
  { text: "Reading is a means of thinking with another person's mind; it forces you to stretch your own.", author: "Charles Scribner Jr." },
  { text: "He who destroys a good book kills reason itself.", author: "John Milton" },
  { text: "There are no faster or firmer friendships than those formed between people who love the same books.", author: "Irving Stone" },
  { text: "Books are not made for furniture, but there is nothing that so beautifully furnishes a house.", author: "Henry Ward Beecher" },
  { text: "Where is human nature so weak as in the bookstore?", author: "Henry Ward Beecher" },
  { text: "A library is not a luxury but one of the necessities of life.", author: "Henry Ward Beecher" },
  { text: "In science, read by preference the newest works. In literature, the oldest.", author: "Edward Bulwer-Lytton" },
  { text: "Reading well is one of the great pleasures that solitude can afford you.", author: "Harold Bloom" },
  { text: "Reading a great book is like having an intense love affair.", author: "Norman Mailer" },
  { text: "The book to read is not the one that thinks for you but the one which makes you think.", author: "Harper Lee" },
  { text: "Books are embalmed minds.", author: "Bovee" },
  { text: "Books are the legacies that a great genius leaves to mankind.", author: "Joseph Addison" },
  { text: "I would rather be a poor man in a garret with plenty of books than a king who did not love reading.", author: "Thomas Macaulay" },
  { text: "No one who can read, ever looks at a book unopened on a shelf, like one who cannot.", author: "Charles Dickens" },
  { text: "Some books are undeservedly forgotten; none are undeservedly remembered.", author: "W.H. Auden" },
  { text: "I always read the last page of a book first so that if I die before I finish I'll know how it turned out.", author: "Nora Ephron" },
  { text: "Once you have read a book you care about, some part of it is always with you.", author: "Louis L'Amour" },
  { text: "Books are good company, in sad times and happy times, for books are people.", author: "E.B. White" },
  { text: "Reading is an exercise in empathy; an exercise in walking in someone else's shoes for a while.", author: "Malorie Blackman" },
  { text: "There are worse crimes than burning books. One of them is not reading them.", author: "Joseph Brodsky" },
  { text: "A book lying idle on a shelf is wasted ammunition.", author: "Henry Miller" },
  { text: "I think we ought to read only the kind of books that wound or stab us.", author: "Franz Kafka" },
  { text: "Literature adds to reality, it does not simply describe it.", author: "C.S. Lewis" },
  { text: "You can never get a cup of tea large enough or a book long enough to suit me.", author: "C.S. Lewis" },
  { text: "Good literature continually read for pleasure must work on the reader.", author: "C.S. Lewis" },
  { text: "A mind needs books as a sword needs a whetstone, if it is to keep its edge.", author: "George R.R. Martin" },
  { text: "Sleep is good, he said, and books are better.", author: "George R.R. Martin" },
  { text: "Reading is the gateway skill that makes all other learning possible.", author: "Barack Obama" },
  { text: "I was made for the library, not the classroom.", author: "Ta-Nehisi Coates" },
  { text: "Books showed me there were possibilities in life, that there were actually people like me living in a world I could attain.", author: "Oprah Winfrey" },
  { text: "Books are a form of political action. Books are knowledge. Books are reflection.", author: "Toni Morrison" },
  { text: "A well-read woman is a dangerous creature.", author: "Lisa Kleypas" },
  { text: "Never trust anyone who has not brought a book with them.", author: "Lemony Snicket" },
  { text: "Every book is a children's book if the kid is brave enough to read it.", author: "Lemony Snicket" },
  { text: "Books may well be the only true magic.", author: "Alice Hoffman" },
  { text: "The greatest gift you can give to someone is the love of reading.", author: "Unknown" },
  { text: "Books make us better people.", author: "Unknown" },
  { text: "Reading is dreaming with open eyes.", author: "Yolanda King" },
  { text: "You must read, you must persevere, you must sit up nights, you must inquire.", author: "Giovanni Boccaccio" },
  { text: "He who reads lives many lives.", author: "Unknown" },
  { text: "The future belongs to those who read today.", author: "Unknown" },
  { text: "Literature is the conversation humanity has with itself.", author: "Unknown" },
  { text: "Every author is a reader who could no longer stay silent.", author: "Unknown" },
  { text: "To love books is to love the best of what humanity has produced.", author: "Unknown" },
  { text: "A bookmark is a promise to return.", author: "Unknown" },
  { text: "Reading requires nothing but time and desire.", author: "Unknown" },
  { text: "To read is to rebel against ignorance.", author: "Unknown" },
  { text: "A library is the delivery room for the birth of ideas.", author: "Norman Cousins" },
  { text: "Whatever the cost of our libraries, the price is cheap compared to that of an ignorant nation.", author: "Walter Cronkite" },
  { text: "Books serve to show a man that those original thoughts of his aren't very new after all.", author: "Abraham Lincoln" },
  { text: "Resolve to edge in a little reading every day. If you gain fifteen minutes a day, it will make itself felt.", author: "Horace Mann" },
  { text: "A house without books is like a room without windows.", author: "Horace Mann" },
  { text: "I go to books and to nature as a bee goes to a flower, for a nectar that I can make into my own honey.", author: "John Burroughs" },
  { text: "Just the knowledge that a good book is awaiting one at the end of a long day makes that day happier.", author: "Kathleen Norris" },
  { text: "When I am reading a book, whether wise or silly, it seems to me to be alive and talking to me.", author: "Jonathan Swift" },
  { text: "I have lived a thousand lives and I've loved a thousand loves. Because I read.", author: "George R.R. Martin" },
  { text: "Books are good enough in their own way, but they are a mighty bloodless substitute for life.", author: "Robert Louis Stevenson" },
  { text: "We tell ourselves stories in order to live.", author: "Joan Didion" },
  { text: "The universe is made of stories, not atoms.", author: "Muriel Rukeyser" },
  { text: "Fiction reveals truths that reality obscures.", author: "Jessamyn West" },
  { text: "Writing is an exploration. You start from nothing and learn as you go.", author: "E.L. Doctorow" },
  { text: "We are all apprentices in a craft where no one ever becomes a master.", author: "Ernest Hemingway" },
  { text: "If you want to be a writer, you must do two things: read a lot and write a lot.", author: "Stephen King" },
  { text: "The worst thing about new books is that they keep us from reading the old ones.", author: "Joseph Joubert" },
  { text: "The true alchemists do not change lead into gold; they change the world into words.", author: "William H. Gass" },
  { text: "To read poetry is to hear it with our eyes; to hear it is to see it with our ears.", author: "Octavio Paz" },
  { text: "Not everything that is faced can be changed, but nothing can be changed until it is faced.", author: "James Baldwin" },
  { text: "Children are made readers on the laps of their parents.", author: "Emilie Buchwald" },
  { text: "I find that there is nothing so fine for the mind as the perusal of a good book.", author: "Unknown" },
  { text: "When I discovered libraries, it was like having Christmas every day.", author: "Jean Fritz" },
  { text: "The library is the temple of learning, and learning has liberated more people than all the wars in history.", author: "Carl T. Rowan" },
  { text: "I was born with a reading list I will never finish.", author: "Maud Casey" },
  { text: "Reading is sometimes an ingenious device for avoiding thought.", author: "Arthur Helps" },
  { text: "A bookstore is one of the only pieces of evidence we have that people are still thinking.", author: "Jerry Seinfeld" },
  { text: "No two persons ever read the same book.", author: "Edmund Wilson" },
  { text: "A good library will never be too neat, or too dusty, because somebody will always be in it.", author: "Neil Gaiman" },
  { text: "Reading is the work of the alert mind, is demanding, and under ideal conditions produces finally a sort of ecstasy.", author: "E.B. White" },
  { text: "Books are the food of youth, the delight of old age; the ornament of prosperity, the refuge and comfort of adversity.", author: "Cicero" },
  { text: "Give me books, French wine, fruit, fine weather and a little music out of doors.", author: "John Keats" },
  { text: "The greatest gift is a passion for reading.", author: "Elizabeth Hardwick" },
  { text: "Reading makes immigrants of us all. It takes us away from home, but more important, it finds homes for us everywhere.", author: "Jean Rhys" },
  { text: "Every man who knows how to read has it in his power to magnify himself.", author: "Aldous Huxley" },
  { text: "A great book is an education of the heart.", author: "Ludwig Tieck" },
  { text: "I am convinced that the truest act of courage is to sacrifice our today for our children's tomorrow.", author: "Coretta Scott King" },
  { text: "Don't join the book burners. Don't think you're going to conceal faults by concealing evidence.", author: "Dwight D. Eisenhower" },
  { text: "In a very real sense, people who have read good literature have lived more than people who cannot or will not read.", author: "S.I. Hayakawa" },
  { text: "Read a lot. Expect something big, something exhilarating and free.", author: "Patti Smith" },
  { text: "Reading the classics is the surest shortcut to wisdom.", author: "Unknown" },
  { text: "Books have been humanity's most reliable technology for 2,500 years.", author: "Unknown" },
  { text: "Literature keeps alive what history forgets.", author: "Unknown" },
  { text: "Great books resist summarizing.", author: "Unknown" },
  { text: "The best writers are the best readers first.", author: "Unknown" },
  { text: "One great book can rewrite the rest of your life.", author: "Unknown" },
  { text: "Books reduce loneliness without reducing solitude.", author: "Unknown" },
  { text: "Reading widely is the cheapest education available.", author: "Unknown" },
  { text: "A day without reading is a day less lived.", author: "Unknown" },
  { text: "Reading is the art of concentration in an age of distraction.", author: "Unknown" },
  { text: "Literacy is freedom.", author: "Unknown" },
  { text: "Every reader is an explorer.", author: "Unknown" },
  { text: "Words are the seeds of thought.", author: "Unknown" },
  { text: "A library is civilization's nervous system.", author: "Unknown" },
  { text: "Every great thinker was a voracious reader first.", author: "Unknown" },
  { text: "Books are the accumulated wisdom of our species.", author: "Unknown" },
  { text: "The story is the cure for despair.", author: "Unknown" },
  { text: "A sentence can change your life.", author: "Unknown" },
  { text: "Words are the currency of ideas.", author: "Unknown" },
  { text: "Every library is a testament to human civilization.", author: "Unknown" },
  { text: "In books we find the thoughts of the greatest minds of all time.", author: "Unknown" },
  { text: "Reading is how we pay attention to life.", author: "Unknown" },
  { text: "Great literature asks questions that cannot be Googled.", author: "Unknown" },
  { text: "The best stories are the ones that haunt you.", author: "Unknown" },
  { text: "All literature is one continuous conversation.", author: "Unknown" },
  { text: "Reading well is a superpower available to everyone.", author: "Unknown" },
  { text: "The books we love become part of our autobiography.", author: "Unknown" },
  { text: "The story is the oldest technology.", author: "Unknown" },
  { text: "Books make us smarter, kinder, and more alive.", author: "Unknown" },
  { text: "Stories are the software of civilization.", author: "Unknown" },
  { text: "Literature is the art of saying the unsayable.", author: "Unknown" },
  { text: "Reading builds empathy faster than any other activity.", author: "Unknown" },
  { text: "Words given freely become the common wealth of civilization.", author: "Unknown" },
  { text: "Books are the technology that never becomes obsolete.", author: "Unknown" },
  { text: "Reading is the most intimate act between strangers.", author: "Unknown" },
  { text: "The writer reaches across time; the reader reaches back.", author: "Unknown" },
  { text: "Every page is a new country.", author: "Unknown" },
  { text: "The mind that reads grows; the mind that stops reading shrinks.", author: "Unknown" },
  { text: "Reading is the art of paying attention.", author: "Unknown" },
  { text: "The reader transforms the book; the book transforms the reader.", author: "Unknown" },
  { text: "Words are seeds; books are gardens.", author: "Unknown" },
  { text: "The best readers are the best questioners.", author: "Unknown" },
  { text: "A library is the geography of the possible.", author: "Unknown" },
  { text: "Reading is a habit that pays compound interest.", author: "Unknown" },
  { text: "Great literature earns its difficulty.", author: "Unknown" },
  { text: "Stories are the architecture of meaning.", author: "Unknown" },
  { text: "Through reading we discover we are not exceptions — we are the rule.", author: "Unknown" },
  { text: "A sentence is a miniature universe of meaning.", author: "Unknown" },
  { text: "To read is to think alongside the greatest minds in history.", author: "Unknown" },
  { text: "The library is where every question meets a possible answer.", author: "Unknown" },
  { text: "Reading gives us the longest view of the shortest life.", author: "Unknown" },
  { text: "Literature is where philosophy goes to be human.", author: "Unknown" },
  { text: "Words have a permanence that buildings do not.", author: "Unknown" },
  { text: "The love of reading is a love that grows with age.", author: "Unknown" },
  { text: "Books make us more curious and curiosity makes us more alive.", author: "Unknown" },
  { text: "The greatest luxury is an afternoon with a great book.", author: "Unknown" },
  { text: "A bookmark is a small act of optimism.", author: "Unknown" },
  { text: "To read a book twice is to know it fully.", author: "Unknown" },
  { text: "Literature is the most honest mirror we have.", author: "Unknown" },
  { text: "The reader and the writer are collaborators across time.", author: "Unknown" },
  { text: "Every story is an experiment in being someone else.", author: "Unknown" },
  { text: "Reading is the opposite of ignorance.", author: "Unknown" },
  { text: "A book unread is a universe unexplored.", author: "Unknown" },
  { text: "Words, once read, can never be unread. That is their power.", author: "Unknown" },
  { text: "Literature teaches us that every life matters.", author: "Unknown" },
  { text: "The novel is the most human of art forms.", author: "Unknown" },
  { text: "To read a biography is to live another life.", author: "Unknown" },
  { text: "Books are how we slow down time.", author: "Unknown" },
  { text: "A well-read mind is never small.", author: "Unknown" },
  { text: "Reading is both the journey and the destination.", author: "Unknown" },
  { text: "The page does not judge. It simply receives.", author: "Unknown" },
  { text: "Through books, the solitary find community.", author: "Unknown" },
  { text: "Books are the most patient form of teaching.", author: "Unknown" },
  { text: "Every reader creates a different book.", author: "Unknown" },
  { text: "The measure of civilization is the size of its libraries.", author: "Unknown" },
  { text: "A good story changes nothing and changes everything.", author: "Unknown" },
  { text: "Literature is the science of the human heart.", author: "Unknown" },
  { text: "Reading is how we commune with our own depth.", author: "Unknown" },
  { text: "A book that asks questions is worth ten that give answers.", author: "Unknown" },
  { text: "To read widely is to become cosmopolitan in the deepest sense.", author: "Unknown" },
  { text: "Every word you read is a word someone labored to write.", author: "Unknown" },
  { text: "The story that haunts you is the one you needed most.", author: "Unknown" },
  { text: "A book is an invitation to the best conversation of your life.", author: "Unknown" },
  { text: "Literature holds what logic cannot contain.", author: "Unknown" },
  { text: "Reading is not a luxury — it is a necessity disguised as pleasure.", author: "Unknown" },
  { text: "A great library is a monument to human curiosity.", author: "Unknown" },
  { text: "Every word ever written was an act of hope.", author: "Unknown" },
  { text: "Reading is how civilization passes its lessons forward.", author: "Unknown" },
  { text: "Great books do not explain the world — they expand it.", author: "Unknown" },
  { text: "A reader's solitude is never lonely.", author: "Unknown" },
  { text: "To read is to become more human, one page at a time.", author: "Unknown" },
  { text: "Reading is the habit that quietly changes everything.", author: "Unknown" },
  { text: "Every great writer was first a great reader.", author: "Unknown" },
  { text: "Books are the most efficient vessel of accumulated wisdom.", author: "Unknown" },
  { text: "The library is the most democratic institution ever created.", author: "Unknown" },
  { text: "Words arranged with art can outlast civilizations.", author: "Unknown" },
  { text: "A reader is someone who has never stopped growing.", author: "Unknown" },
  { text: "Great stories do not end when you close the book.", author: "Unknown" },
  { text: "Reading is how we live beyond the boundaries of our own lives.", author: "Unknown" },
  { text: "To read is to invite transformation.", author: "Unknown" },
  { text: "Through literature we inherit the wisdom of all ages.", author: "Unknown" },
  { text: "A library is the university of the self-educated.", author: "Unknown" },
  { text: "The act of reading is an act of trust.", author: "Unknown" },
  { text: "Books reduce the terror of the unknown.", author: "Unknown" },
  { text: "Reading is one of the few truly private pleasures.", author: "Unknown" },
  { text: "In literature we see ourselves from the outside.", author: "Unknown" },
  { text: "The best stories make us more ourselves.", author: "Unknown" },
  { text: "A great novel solves nothing but illuminates everything.", author: "Unknown" },
  { text: "Every shelf of books is a life's work.", author: "Unknown" },
  { text: "Reading is the gateway to all other learning.", author: "Unknown" },
  { text: "A sentence that says more than it means — that is literature.", author: "Unknown" },
  { text: "We are the books we've read.", author: "Unknown" },
  { text: "Literature is the memory of nations.", author: "Unknown" },
  { text: "A good library is never finished.", author: "Unknown" },
  { text: "Reading widely is the safest form of daring.", author: "Unknown" },
  { text: "Books carry the echoes of all the readers who came before.", author: "Unknown" },
  { text: "Great reading asks something of us — and that is why it matters.", author: "Unknown" },
  { text: "A library is a place where silence and words coexist in perfect harmony.", author: "Unknown" },
  { text: "Between the pages of a book is a lovely place to be.", author: "Unknown" },
  { text: "Reading at night is one of the secret pleasures of being human.", author: "Unknown" },
  { text: "The page is a stage on which the imagination performs.", author: "Unknown" },
  { text: "Great books repay rereading with compound interest.", author: "Unknown" },
  { text: "Every library card is a passport to the world.", author: "Unknown" },
  { text: "Reading is a form of listening — to the voice inside the text.", author: "Unknown" },
  { text: "Literature is language stretched to its limits.", author: "Unknown" },
  { text: "To read a great poem is to feel the language sing.", author: "Unknown" },
  { text: "Books are where lost people are found.", author: "Unknown" },
  { text: "The story taught what the law cannot enforce.", author: "Unknown" },
  { text: "A well-chosen bookshelf is a self-portrait.", author: "Unknown" },
  { text: "Every book is an act of faith in the reader.", author: "Unknown" },
  { text: "The library is the democracy of knowledge.", author: "Unknown" },
  { text: "A book read aloud becomes twice the experience.", author: "Unknown" },
  { text: "Reading is the conversation we have with the past.", author: "Unknown" },
  { text: "Words are how we make the invisible visible.", author: "Unknown" },
  { text: "Stories make us citizens of the world.", author: "Unknown" },
  { text: "Good books are honest in a way that life rarely is.", author: "Unknown" },
  { text: "The greatest journey is from the first page to the last.", author: "Unknown" },
  { text: "Books hold civilizations in their pages.", author: "Unknown" },
  { text: "A great library is the autobiography of a civilization.", author: "Unknown" },
  { text: "The book that challenges you most is the book you need most.", author: "Unknown" },
  { text: "Words are the original virtual reality.", author: "Unknown" },
  { text: "Reading teaches us what experience alone cannot.", author: "Unknown" },
  { text: "A sentence written with care can outlast its author by centuries.", author: "Unknown" },
  { text: "The reader is the other half of the writer.", author: "Unknown" },
  { text: "Reading is how we think beyond the limits of our own experience.", author: "Unknown" },
  { text: "To read is to participate in the longest conversation in human history.", author: "Unknown" },
  { text: "A great reader asks questions the author didn't know to answer.", author: "Unknown" },
  { text: "The depth of a reader is the depth of their library.", author: "Unknown" },
  { text: "Reading is the most direct path from where you are to where you want to be.", author: "Unknown" },
  { text: "Great literature doesn't offer answers; it illuminates the questions.", author: "Unknown" },
  { text: "Reading is slow travel — but the richest kind.", author: "Unknown" },
  { text: "A great story lives in the space between the lines.", author: "Unknown" },
  { text: "When all else fails, read.", author: "Unknown" },
  { text: "The shelf of unread books is a road not yet traveled.", author: "Unknown" },
  { text: "Reading cultivates patience — the rarest virtue.", author: "Unknown" },
  { text: "A good story can survive centuries of telling.", author: "Unknown" },
  { text: "Reading is an act of generosity — toward the author and toward oneself.", author: "Unknown" },
  { text: "A dog-eared page means a reader was here.", author: "Unknown" },
  { text: "Finishing a great book is a little like losing a dear friend.", author: "Unknown" },
  { text: "Books earn their weight in wisdom.", author: "Unknown" },
  { text: "Reading is how we borrow the experiences of others.", author: "Unknown" },
  { text: "Every great reader was once someone who couldn't stop turning pages.", author: "Unknown" },
  { text: "Reading sharpens the sword of thought.", author: "Unknown" },
  { text: "No story is truly finished until it finds its reader.", author: "Unknown" },
  { text: "Words do what swords cannot: they civilize.", author: "Unknown" },
  { text: "A well-read person can walk any room in the world.", author: "Unknown" },
  { text: "The printed word endures when everything else fades.", author: "Unknown" },
  { text: "To finish a great book is to grieve and celebrate at once.", author: "Unknown" },
  { text: "The reader meets the author halfway — that is the magic.", author: "Unknown" },
  { text: "Books are invitations to transformation.", author: "Unknown" },
  { text: "Reading is the nourishment that lets you do everything else.", author: "Unknown" },
  { text: "Behind every word is a world.", author: "Unknown" },
  { text: "Every sentence is a small universe.", author: "Unknown" },
  { text: "Books give us the gift of other people's lives.", author: "Unknown" },
  { text: "Reading is rebellion against the limits of a single life.", author: "Unknown" },
  { text: "When you read, you are never truly alone.", author: "Unknown" },
  { text: "A book half-read is a door half-open.", author: "Unknown" },
  { text: "The life of the mind begins on the page.", author: "Unknown" },
  { text: "A sentence that surprises you is a gift.", author: "Unknown" },
  { text: "Words outlast marble.", author: "Unknown" },
  { text: "A library is the autobiography of civilization.", author: "Unknown" },
  { text: "To read deeply is the beginning of wisdom.", author: "Unknown" },
  { text: "Literature is the longest argument ever made.", author: "Unknown" },
  { text: "Reading is a gift we give ourselves and no one can take back.", author: "Unknown" },
  { text: "The page turns, and so does time.", author: "Unknown" },
  { text: "Libraries are the DNA of civilization.", author: "Unknown" },
  { text: "Reading is the compass that guides us through life.", author: "Unknown" },
  { text: "The writer's job is to hold a mirror up to the human condition.", author: "Unknown" },
  { text: "Good literature is the autobiography of the human race.", author: "Unknown" },
  { text: "Books are patient, they wait.", author: "Unknown" },
  { text: "A story well told is a life well shared.", author: "Unknown" },
  { text: "The book is the only medium that travels with us through time unchanged.", author: "Unknown" },
  { text: "Reading is not the accumulation of words but the absorption of worlds.", author: "Unknown" },
  { text: "Words, once written, live forever.", author: "Unknown" },
  { text: "To read deeply is to live more fully.", author: "Unknown" },
  { text: "A reader is never truly lost.", author: "Unknown" },
  { text: "Every story begins with a single word.", author: "Unknown" },
  { text: "Reading slows time down, and in doing so, extends a life.", author: "Unknown" },
  { text: "A book is a world unto itself.", author: "Unknown" },
  { text: "There are no books so bad that there is nothing good to be gained from them.", author: "Pliny the Younger" },
  { text: "Books are the windows of the soul.", author: "Unknown" },
  { text: "The reading group is civilization's oldest book club.", author: "Unknown" },
  { text: "A book is a garden, an orchard, a storehouse, a party, a counselor.", author: "Henry Ward Beecher" },
  { text: "A truly great book should be read in youth, again in maturity and once more in old age.", author: "Robertson Davies" },
  { text: "If the book is good, is about something that you do not know, and is beautifully written — read it.", author: "Ernest Hemingway" },
  { text: "Wherever you go, go with all your heart — and a good book.", author: "After Confucius" },
  { text: "Reading is a means of thinking with another person's mind.", author: "Charles Scribner Jr." },
  { text: "A good book has no ending.", author: "R.D. Cumming" },
  { text: "There is no substitute for books in the life of a child.", author: "Mary Ellen Chase" },
  { text: "The great thing about new friends is that they bring new energy to your soul.", author: "Shanna Rodriguez" },
  { text: "You can judge a book by its cover but not a reader by their shelf.", author: "Unknown" },
  { text: "To read is to wear another's shoes for a while.", author: "Unknown" },
  { text: "Every reader is a traveler without a passport.", author: "Unknown" },
  { text: "A library is a place where the past lives in the present.", author: "Unknown" },
  { text: "Books are the frames through which we see the world differently.", author: "Unknown" },
  { text: "Reading is the most democratic form of time travel.", author: "Unknown" },
  { text: "A child who reads will be an adult who thinks.", author: "Unknown" },
  { text: "The love of a good story is the most human thing there is.", author: "Unknown" },
  { text: "To read is to receive the gift of another mind.", author: "Unknown" },
  { text: "Books are how we remember what we were never there to witness.", author: "Unknown" },
  { text: "Literature is the art of making sense of what makes no sense.", author: "Unknown" },
  { text: "A great book reads you as much as you read it.", author: "Unknown" },
  { text: "Reading is how we resist the narrowing of the world.", author: "Unknown" },
  { text: "Through stories, every human experience becomes universal.", author: "Unknown" },
  { text: "A sentence is the smallest complete act of meaning.", author: "Unknown" },
  { text: "Books are where we go to be understood.", author: "Unknown" },
  { text: "Great literature is a revolution that happens quietly, on the page.", author: "Unknown" },
  { text: "The library is proof that humanity believes in tomorrow.", author: "Unknown" },
  { text: "Every page of a great book is a small act of courage.", author: "Unknown" },
  { text: "To read is to never run out of things to think about.", author: "Unknown" },
  { text: "A well-read person can see further than their own horizon.", author: "Unknown" },
  { text: "Books connect us across all the barriers that would divide us.", author: "Unknown" },
  { text: "The love of reading is both inherited and cultivated.", author: "Unknown" },
  { text: "A book is the only place you can hold a conversation with genius.", author: "Unknown" },
  { text: "Reading is the quietest form of revolution.", author: "Unknown" },
  { text: "Words matter because people matter.", author: "Unknown" },
  { text: "A library is built one book at a time, just like a life.", author: "Unknown" },
  { text: "The habit of reading is the habit of improvement.", author: "Unknown" },
  { text: "Stories are how we make peace with the world as it is.", author: "Unknown" },
  { text: "To read is to add to one's capacity for wonder.", author: "Unknown" },
  { text: "Great books grow with their readers.", author: "Unknown" },
  { text: "Reading is the surest way to feel less alone.", author: "Unknown" },
  { text: "A bookshelf is a biography of the mind.", author: "Unknown" },
  { text: "Words carefully chosen can outlive empires.", author: "Unknown" },
  { text: "Reading is the bridge between who you are and who you could become.", author: "Unknown" },
  { text: "The best education is a well-stocked library and the time to use it.", author: "Unknown" },
  { text: "Every book ever written was someone's attempt to make sense of existence.", author: "Unknown" },
  { text: "A library is where every question is welcome.", author: "Unknown" },
  { text: "To read broadly is to think freely.", author: "Unknown" },
  { text: "Books do not impose — they invite.", author: "Unknown" },
  { text: "The joy of reading is the joy of being surprised by another mind.", author: "Unknown" },
  { text: "Literature is how we argue with mortality.", author: "Unknown" },
  { text: "A good story gives language to the unspeakable.", author: "Unknown" },
  { text: "To read is to choose depth over distraction.", author: "Unknown" },
  { text: "The love of books is a form of love that never disappoints.", author: "Unknown" },
  { text: "A book club is a conspiracy in the best sense.", author: "Unknown" },
  { text: "Stories are civilization's immune system against forgetting.", author: "Unknown" },
  { text: "Reading teaches us what we don't know we needed to learn.", author: "Unknown" },
  { text: "A library card is the most empowering credential you can carry.", author: "Unknown" },
  { text: "To finish a book is to say goodbye to a world.", author: "Unknown" },
  { text: "Every book you've ever read is still inside you.", author: "Unknown" },
  { text: "Literature proves that the past is never truly past.", author: "Unknown" },
  { text: "Words are the thread that stitches human experience together.", author: "Unknown" },
  { text: "Reading is the sport of the intellect.", author: "Unknown" },
  { text: "A great writer makes the impossible feel inevitable.", author: "Unknown" },
  { text: "Books are the longest letters ever written.", author: "Unknown" },
  { text: "Reading is how we stay curious in a world that discourages it.", author: "Unknown" },
  { text: "A library is built from questions, not just answers.", author: "Unknown" },
  { text: "The truly well-read person wears their knowledge lightly.", author: "Unknown" },
  { text: "Books are the original social network.", author: "Unknown" },
  { text: "To read is to choose to be informed rather than assumed.", author: "Unknown" },
  { text: "Great books don't just change your mind — they change your eyes.", author: "Unknown" },
  { text: "Reading is the most reliable cure for a narrow mind.", author: "Unknown" },
  { text: "Every story ever told was someone trying to reach across the dark.", author: "Unknown" },
  { text: "A library is where the best of humanity is preserved.", author: "Unknown" },
  { text: "To read deeply is to live deeply.", author: "Unknown" },
  { text: "Literature is the longest standing argument that humanity matters.", author: "Unknown" },
  { text: "Words written with honesty can travel any distance in time.", author: "Unknown" },
  { text: "A great story makes you want to be a better person.", author: "Unknown" },
  { text: "Reading is how we remember that we are more than our circumstances.", author: "Unknown" },
  { text: "Books are proof that one person's inner world can become another's.", author: "Unknown" },
  { text: "The love of reading is a love that multiplies the more you give it.", author: "Unknown" },
  { text: "Every line ever read has been part of making you who you are.", author: "Unknown" },
];

// Shuffled rotation — never shows same quote twice in a row across sessions
let _quotePool = [];
function getRandomQuote() {
  if (_quotePool.length === 0) {
    // Refill and shuffle the full list
    _quotePool = [...QUOTES].sort(() => Math.random() - 0.5);
  }
  return _quotePool.pop();
}

// Fallback: pick a random quote from the database (used while API loads)
function fallbackQuote() {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

async function fetchAIQuote(mood = "") {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout
    const res = await fetch("/api/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mood: mood || "" }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error("API error " + res.status);
    const data = await res.json();
    if (data?.text && data?.author) return data;
  } catch (e) {
    console.error("Quote API failed, using local library:", e.message);
  }
  // Always return something — fall back to local 518-quote database
  return getRandomQuote();
}

// Fetch a cover URL for a single book by title + author from Open Library
async function fetchCoverForBook(title, author) {
  try {
    const q = encodeURIComponent(`${title} ${author}`.trim());
    const res = await fetch(`https://openlibrary.org/search.json?q=${q}&limit=1&fields=cover_i`);
    const data = await res.json();
    const coverId = data.docs?.[0]?.cover_i;
    return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null;
  } catch { return null; }
}

// Fetch covers for an array of books in batches — returns updated books array
// Fires requests in parallel but rate-limits to avoid hammering Open Library
async function enrichBooksWithCovers(books, onProgress) {
  const BATCH = 5; // parallel requests per batch
  const result = [...books];
  for (let i = 0; i < result.length; i += BATCH) {
    const batch = result.slice(i, i + BATCH);
    await Promise.all(batch.map(async (book, bi) => {
      const url = await fetchCoverForBook(book.title, book.author);
      if (url) result[i + bi] = { ...result[i + bi], coverUrl: url };
    }));
    if (onProgress) onProgress(Math.min(i + BATCH, result.length), result.length);
    // Small delay between batches to be polite to Open Library
    if (i + BATCH < result.length) await new Promise(r => setTimeout(r, 300));
  }
  return result;
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

// Robust CSV field parser — handles quoted fields, commas inside quotes, escaped quotes
function parseCSVRow(row) {
  const fields = [];
  let cur = "", inQuote = false;
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') {
      if (inQuote && row[i + 1] === '"') { cur += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      fields.push(cur.trim()); cur = "";
    } else { cur += ch; }
  }
  fields.push(cur.trim());
  return fields;
}

// Parse Goodreads CSV export — handles all edge cases
function parseGoodreadsCSV(rawText) {
  const text = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  // Split into rows respecting quoted newlines
  const rows = [];
  let cur = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') { if (inQ && text[i+1] === '"') { cur += '""'  ; i++; } else inQ = !inQ; cur += ch; }
    else if (ch === '\n' && !inQ) { if (cur.trim()) rows.push(cur); cur = ""; }
    else cur += ch;
  }
  if (cur.trim()) rows.push(cur);
  if (rows.length < 2) return { reading: [], read: [], wantToRead: [] };

  const headers = parseCSVRow(rows[0]).map(h => h.replace(/"/g,"").toLowerCase().trim());
  const find = (...names) => { for (const n of names) { const i = headers.findIndex(h => h === n || h.includes(n)); if (i !== -1) return i; } return -1; };

  const TI = find("title");
  const AI = find("author");
  const PI = find("number of pages", "pages");
  const SI = find("exclusive shelf", "bookshelves");
  const RI = find("my rating", "rating");
  const DI = find("date read");

  const books = [];
  for (let i = 1; i < rows.length; i++) {
    const cols = parseCSVRow(rows[i]);
    const get = ix => (ix >= 0 && ix < cols.length) ? cols[ix].replace(/^"|"$/g,"").replace(/""/g,'"').trim() : "";
    const title = get(TI);
    if (!title) continue;
    const shelf = get(SI).toLowerCase().trim();
    books.push({
      id: Date.now() + i + Math.random(),
      title: title.replace(/\s*\(.*?\)\s*$/, "").trim() || title,
      author: get(AI),
      pages: parseInt(get(PI)) || 300,
      currentPage: 0, shelf,
      rating: parseInt(get(RI)) || 0,
      finishedDate: get(DI) || null,
      coverUrl: null, genre: "General",
      sessions: [], addedDate: today(), fromGoodreads: true,
    });
  }
  return {
    reading:    books.filter(b => b.shelf === "currently-reading" || b.shelf.includes("current")),
    read:       books.filter(b => b.shelf === "read"),
    wantToRead: books.filter(b => b.shelf === "to-read" || b.shelf.includes("want")),
  };
}

/* ─── SMALL COMPONENTS ───────────────────────────────────── */
function Spinner({ size = 14 }) {
  return <div style={{ width: size, height: size, border: "2px solid rgba(201,168,76,0.2)", borderTopColor: "var(--gold)", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />;
}
function Divider({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "18px 0" }}>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      {label && <span style={{ fontSize: 9, color: "var(--text3)", fontFamily: "'JetBrains Mono',monospace", letterSpacing: "1px" }}>{label}</span>}
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
  );
}
function Tag({ children, color = "var(--text3)" }) {
  return <span style={{ fontSize: 9, padding: "2px 7px", border: `1px solid ${color}44`, color, borderRadius: 3, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.5px", textTransform: "uppercase" }}>{children}</span>;
}
function Stars({ rating, onChange }) {
  const [h, setH] = useState(0);
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} onClick={() => onChange?.(s)} onMouseEnter={() => onChange && setH(s)} onMouseLeave={() => onChange && setH(0)}
          style={{ color: s <= (h || rating) ? "var(--gold)" : "var(--border2)", fontSize: 13, cursor: onChange ? "pointer" : "default", transition: "color 0.15s", textShadow: s <= (h || rating) ? "0 0 6px var(--gold)" : "none" }}>★</span>
      ))}
    </div>
  );
}
function Ring({ p, size = 52, stroke = 4 }) {
  const r = (size - stroke) / 2, circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <defs><linearGradient id="gr" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#c9a84c"/><stop offset="100%" stopColor="#e8cc7a"/></linearGradient></defs>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg3)" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="url(#gr)" strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - p/100)} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease" }}/>
    </svg>
  );
}
function Cover({ url, title, size = 48 }) {
  const [err, setErr] = useState(false);
  const cols = [["#1a0f2e","#c9a84c"],["#0f1a2e","#4cc9c9"],["#0f2e1a","#4caf82"],["#2e0f1a","#cf6679"],["#1a1a0f","#e8cc7a"]];
  const [bg, ac] = cols[(title?.charCodeAt(0)||0) % 5];
  const ini = title ? title.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase() : "?";
  if (url && !err) return <img src={url} alt={title} onError={() => setErr(true)} style={{ width: size, height: size*1.5, objectFit: "cover", borderRadius: 4, flexShrink: 0, boxShadow: "2px 4px 16px rgba(0,0,0,0.6)" }} />;
  return <div style={{ width: size, height: size*1.5, background: `linear-gradient(135deg,${bg},var(--bg))`, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size*0.26, color: ac, fontWeight: 700, flexShrink: 0, boxShadow: "2px 4px 16px rgba(0,0,0,0.5)", letterSpacing: 1, border: `1px solid ${ac}22`, fontFamily: "'Cormorant Garamond',serif" }}>{ini}</div>;
}

/* ─── BOOK SEARCH ────────────────────────────────────────── */
function BookSearch({ onSelect, placeholder }) {
  const [q, setQ] = useState(""), [results, setResults] = useState([]), [loading, setLoading] = useState(false), [open, setOpen] = useState(false);
  const dq = useDebounce(q, 350), ref = useRef(null);
  useEffect(() => {
    if (dq.length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    searchOpenLibrary(dq).then(r => { setResults(r); setOpen(r.length > 0); setLoading(false); });
  }, [dq]);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--text3)", pointerEvents: "none" }}>⌕</span>
        <input value={q} onChange={e => setQ(e.target.value)} onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder || "Search books…"} className="inp"
          style={{ paddingLeft: 36, paddingRight: 36, borderRadius: open ? "8px 8px 0 0" : 8 }}
          onKeyDown={e => e.key === "Escape" && setOpen(false)} />
        {loading && <div style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)" }}><Spinner /></div>}
      </div>
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 200, background: "var(--bg1)", border: "1px solid var(--border2)", borderTop: "none", borderRadius: "0 0 8px 8px", boxShadow: "0 16px 48px rgba(0,0,0,0.8)", maxHeight: 340, overflowY: "auto" }}>
          {results.map((book, i) => (
            <div key={book.key+i} onClick={() => { onSelect(book); setQ(""); setResults([]); setOpen(false); }}
              style={{ display: "flex", gap: 12, padding: "10px 14px", cursor: "pointer", borderBottom: i < results.length-1 ? "1px solid var(--border)" : "none", alignItems: "center", transition: "background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--bg2)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <Cover url={book.coverUrl} title={book.title} size={30} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'Cormorant Garamond',serif" }}>{book.title}</div>
                <div style={{ fontSize: 11, color: "var(--text2)", marginTop: 1 }}>{book.author}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                  {book.year && <span style={{ fontSize: 9, color: "var(--text3)", fontFamily: "'JetBrains Mono',monospace" }}>{book.year}</span>}
                  {book.pages && <span style={{ fontSize: 9, color: "var(--text3)", fontFamily: "'JetBrains Mono',monospace" }}>· {book.pages}p</span>}
                </div>
              </div>
              <span style={{ fontSize: 10, color: "var(--gold)", flexShrink: 0, fontFamily: "'JetBrains Mono',monospace" }}>+ add</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── AUTH SCREEN ────────────────────────────────────────── */
function AuthScreen() {
  const [mode, setMode] = useState("login"), [name, setName] = useState(""), [email, setEmail] = useState(""), [password, setPassword] = useState(""), [error, setError] = useState(""), [loading, setLoading] = useState(false), [gLoading, setGLoading] = useState(false);
  const friendly = code => ({ "auth/user-not-found":"No account with that email.","auth/wrong-password":"Incorrect password.","auth/email-already-in-use":"Email already in use.","auth/weak-password":"Password must be 6+ characters.","auth/invalid-email":"Invalid email address.","auth/popup-closed-by-user":"Google sign-in cancelled.","auth/network-request-failed":"Network error.","auth/invalid-credential":"Invalid email or password." }[code] || "Something went wrong.");
  const handleEmail = async () => {
    setError(""); setLoading(true);
    try {
      if (mode === "signup") { if (!name.trim()) { setError("Please enter your name."); setLoading(false); return; } const c = await createUserWithEmailAndPassword(auth, email, password); await updateProfile(c.user, { displayName: name.trim() }); }
      else await signInWithEmailAndPassword(auth, email, password);
    } catch(e) { setError(friendly(e.code)); }
    setLoading(false);
  };
  const handleGoogle = async () => { setError(""); setGLoading(true); try { await signInWithPopup(auth, googleProvider); } catch(e) { setError(friendly(e.code)); } setGLoading(false); };
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "fixed", top: "-20%", left: "-10%", width: 500, height: 500, background: "radial-gradient(circle,rgba(201,168,76,0.06),transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: "-20%", right: "-10%", width: 600, height: 600, background: "radial-gradient(circle,rgba(76,201,201,0.04),transparent 70%)", pointerEvents: "none" }} />
      <div className="fadeUp" style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 52, fontWeight: 300, color: "var(--gold)", letterSpacing: 8, animation: "glow 3s ease-in-out infinite" }}>FOLIO</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: "var(--text3)", letterSpacing: "4px", textTransform: "uppercase", marginTop: 6 }}>Reading · Reimagined</div>
          <div style={{ width: 60, height: 1, background: "linear-gradient(90deg,transparent,var(--gold),transparent)", margin: "14px auto 0" }} />
        </div>
        <div style={{ background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: 16, padding: 32, boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>
          <div style={{ display: "flex", background: "var(--bg)", borderRadius: 8, padding: 3, marginBottom: 24, border: "1px solid var(--border)" }}>
            {[["login","Sign In"],["signup","Create Account"]].map(([m,l]) => (
              <button key={m} onClick={() => { setMode(m); setError(""); }} style={{ flex: 1, padding: "8px 0", borderRadius: 6, fontSize: 12, fontWeight: 600, background: mode===m ? "var(--bg3)" : "transparent", color: mode===m ? "var(--gold)" : "var(--text3)", border: mode===m ? "1px solid var(--border2)" : "1px solid transparent", transition: "all 0.2s" }}>{l}</button>
            ))}
          </div>
          <button onClick={handleGoogle} disabled={gLoading || loading} style={{ width: "100%", padding: "12px 0", marginBottom: 16, borderRadius: 8, background: "var(--bg2)", border: "1px solid var(--border2)", color: "var(--text)", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; e.currentTarget.style.background = "var(--bg3)"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.background = "var(--bg2)"; }}>
            {gLoading ? <Spinner /> : <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>}
            {gLoading ? "Connecting…" : `${mode==="login"?"Sign in":"Sign up"} with Google`}
          </button>
          <Divider label="OR EMAIL" />
          {mode === "signup" && <div style={{ marginBottom: 14 }}><label className="lbl">Full Name</label><input className="inp" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} /></div>}
          <div style={{ marginBottom: 14 }}><label className="lbl">Email</label><input className="inp" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key==="Enter" && handleEmail()} /></div>
          <div style={{ marginBottom: 20 }}><label className="lbl">Password</label><input className="inp" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key==="Enter" && handleEmail()} /></div>
          {error && <div style={{ background: "rgba(207,102,121,0.1)", border: "1px solid rgba(207,102,121,0.3)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "var(--err)", marginBottom: 16 }}>{error}</div>}
          <button className="btn-g" onClick={handleEmail} disabled={loading || gLoading} style={{ width: "100%", padding: "13px 0", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {loading ? <Spinner /> : (mode==="login" ? "Sign In with Email" : "Create Account")}
          </button>
          <Divider />
          <div style={{ fontSize: 11, color: "var(--text3)", textAlign: "center", lineHeight: 1.7 }}>By continuing you agree to Folio's Terms.<br/>Your data stays private and secure.</div>
        </div>
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 9, color: "var(--text3)", fontFamily: "'JetBrains Mono',monospace", letterSpacing: "1px" }}>FOLIO © 2025 · ALL RIGHTS RESERVED</div>
      </div>
    </div>
  );
}

/* ─── LOG MODAL ──────────────────────────────────────────── */
function LogModal({ book, onSave, onClose }) {
  const [mode, setMode] = useState("pages"), [pages, setPages] = useState(""), [abs, setAbs] = useState(String(book.currentPage));
  const save = () => {
    let np; if (mode==="pages") { const n=parseInt(pages); if(isNaN(n)||n<=0) return; np=Math.min(book.currentPage+n,book.pages); } else { const n=parseInt(abs); if(isNaN(n)||n<0) return; np=Math.min(n,book.pages); }
    onSave(book.id, np, Math.max(0, np - book.currentPage));
  };
  const prev = mode==="pages" ? (pages&&!isNaN(parseInt(pages)) ? Math.min(book.currentPage+parseInt(pages),book.pages) : null) : (abs&&!isNaN(parseInt(abs)) ? Math.min(parseInt(abs),book.pages) : null);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 500, padding: 20, backdropFilter: "blur(8px)" }} onClick={onClose}>
      <div className="fadeUp" style={{ background: "var(--bg1)", border: "1px solid var(--border2)", borderRadius: 16, padding: 26, width: "100%", maxWidth: 340 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 20 }}>
          <Cover url={book.coverUrl} title={book.title} size={36} />
          <div><div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, color: "var(--text)", lineHeight: 1.3 }}>{book.title}</div><div style={{ fontSize: 11, color: "var(--text2)", marginTop: 2 }}>p.{book.currentPage} of {book.pages} · {pct(book.currentPage,book.pages)}%</div></div>
        </div>
        <div style={{ display: "flex", background: "var(--bg)", borderRadius: 8, padding: 3, marginBottom: 16, border: "1px solid var(--border)" }}>
          {[["pages","Pages Read"],["abs","Jump to Page"]].map(([m,l]) => (
            <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: "7px 4px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: mode===m?"var(--bg3)":"transparent", color: mode===m?"var(--gold)":"var(--text3)", border: mode===m?"1px solid var(--border2)":"1px solid transparent", transition: "all 0.2s" }}>{l}</button>
          ))}
        </div>
        <label className="lbl">{mode==="pages" ? "Pages read this session" : `Current page (max ${book.pages})`}</label>
        <input className="inp" type="number" min="0" max={book.pages} placeholder={mode==="pages"?"e.g. 30":String(book.currentPage)} value={mode==="pages"?pages:abs} onChange={e => mode==="pages"?setPages(e.target.value):setAbs(e.target.value)} style={{ textAlign: "center", fontSize: 20, fontFamily: "'Cormorant Garamond',serif", marginBottom: 12 }} autoFocus />
        {prev !== null && <div style={{ padding: "8px 12px", background: "var(--gold3)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 8, display: "flex", justifyContent: "space-between", marginBottom: 12 }}><span style={{ fontSize: 11, color: "var(--text2)" }}>New position</span><span style={{ fontSize: 12, color: "var(--gold)", fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>p.{prev} · {pct(prev,book.pages)}%</span></div>}
        <div style={{ height: 3, background: "var(--bg3)", borderRadius: 2, overflow: "hidden", marginBottom: 18 }}><div style={{ height: "100%", background: "linear-gradient(90deg,var(--gold),var(--gold2))", borderRadius: 2, width: `${prev!==null?pct(prev,book.pages):pct(book.currentPage,book.pages)}%`, transition: "width 0.4s ease", boxShadow: "0 0 8px rgba(201,168,76,0.4)" }} /></div>
        <div style={{ display: "flex", gap: 8 }}><button className="btn-o" onClick={onClose} style={{ flex: 1, padding: 11, fontSize: 12 }}>Cancel</button><button className="btn-g" onClick={save} style={{ flex: 2, padding: 11, fontSize: 13 }}>Save Progress</button></div>
      </div>
    </div>
  );
}

/* ─── ADD BOOK MODAL ─────────────────────────────────────── */
function AddBookModal({ onAdd, onClose }) {
  const [sel, setSel] = useState(null), [customPages, setCustomPages] = useState(""), [shelf, setShelf] = useState("reading"), [step, setStep] = useState(1);
  const pick = book => { setSel(book); setCustomPages(String(book.pages||"")); setStep(2); };
  const add = () => {
    if (!sel) return;
    const pages = parseInt(customPages) || sel.pages || 200;
    onAdd({ id: Date.now(), title: sel.title, author: sel.author, pages, currentPage: 0, coverUrl: sel.coverUrl, genre: sel.genre||"General", addedDate: today(), sessions: [], rating: 0, finishedDate: null }, shelf);
    onClose();
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 500, padding: "48px 16px 20px", overflowY: "auto", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <div className="fadeUp" style={{ background: "var(--bg1)", border: "1px solid var(--border2)", borderRadius: 16, padding: 24, width: "100%", maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20 }}>{step===1?"Search Library":"Confirm Book"}</div>
          <button onClick={onClose} style={{ color: "var(--text3)", fontSize: 20, lineHeight: 1 }}>×</button>
        </div>
        {step===1 && (
          <>
            <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 14, lineHeight: 1.6 }}>Covers, pages and metadata load automatically from Open Library.</div>
            <BookSearch onSelect={pick} placeholder="e.g. Atomic Habits, Dune, Andy Weir…" />
            <div style={{ fontSize: 9, color: "var(--text3)", marginTop: 8, textAlign: "center", fontFamily: "'JetBrains Mono',monospace" }}>POWERED BY OPEN LIBRARY</div>
          </>
        )}
        {step===2 && sel && (
          <>
            <button onClick={() => setStep(1)} style={{ color: "var(--gold)", fontSize: 12, marginBottom: 16 }}>← Search again</button>
            <div style={{ display: "flex", gap: 14, marginBottom: 18 }}>
              <Cover url={sel.coverUrl} title={sel.title} size={52} />
              <div><div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 17, lineHeight: 1.3, marginBottom: 4 }}>{sel.title}</div><div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 6 }}>{sel.author}</div><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{sel.year && <Tag>{sel.year}</Tag>}{sel.genre && <Tag color="var(--gold)">{sel.genre}</Tag>}</div></div>
            </div>
            <div style={{ marginBottom: 14 }}><label className="lbl">Total Pages {sel.pages?`(suggested: ${sel.pages})`:""}</label><input type="number" value={customPages} onChange={e => setCustomPages(e.target.value)} placeholder="e.g. 320" className="inp" /></div>
            <div style={{ marginBottom: 20 }}>
              <label className="lbl">Add to Shelf</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[["reading","📖 Reading","var(--gold)"],["wantToRead","🔖 Want to Read","var(--cyan)"]].map(([v,l,c]) => (
                  <button key={v} onClick={() => setShelf(v)} style={{ flex: 1, padding: "9px 6px", background: shelf===v?`${c.includes("gold")?"rgba(201,168,76,0.1)":"rgba(76,201,201,0.1)"}` : "var(--bg2)", border: `1px solid ${shelf===v?c:"var(--border)"}`, borderRadius: 8, color: shelf===v?c:"var(--text3)", fontSize: 11, fontWeight: shelf===v?700:400 }}>{l}</button>
                ))}
              </div>
            </div>
            <button className="btn-g" onClick={add} style={{ width: "100%", padding: 13, fontSize: 14 }}>Add to My Library</button>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── READING CARD ───────────────────────────────────────── */
function ReadingCard({ book, onLog, onDone }) {
  const [exp, setExp] = useState(false);
  const p = pct(book.currentPage, book.pages);
  return (
    <div className="ch" style={{ background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
      <div style={{ display: "flex", gap: 14, padding: 16, cursor: "pointer" }} onClick={() => setExp(x=>!x)}>
        <Cover url={book.coverUrl} title={book.title} size={46} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, color: "var(--text)", lineHeight: 1.3, marginBottom: 2 }}>{book.title}</div>
          <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 10 }}>{book.author}</div>
          <div style={{ height: 2, background: "var(--bg3)", borderRadius: 1, overflow: "hidden", marginBottom: 5 }}><div style={{ height: "100%", width: `${p}%`, background: "linear-gradient(90deg,var(--gold),var(--gold2))", borderRadius: 1, boxShadow: "0 0 8px rgba(201,168,76,0.4)", transition: "width 0.8s ease" }} /></div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 10, color: "var(--gold)", fontFamily: "'JetBrains Mono',monospace" }}>p.{book.currentPage}/{book.pages}</span>
            <span style={{ fontSize: 10, color: "var(--text3)", fontFamily: "'JetBrains Mono',monospace" }}>{book.pages-book.currentPage} left</span>
          </div>
        </div>
        <div style={{ position: "relative", flexShrink: 0, display: "flex", alignItems: "center" }}>
          <Ring p={p} /><div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "var(--gold)", fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{p}%</div>
        </div>
      </div>
      {exp && book.sessions?.length > 0 && (
        <div style={{ padding: "0 16px 12px", borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: 9, color: "var(--text3)", fontFamily: "'JetBrains Mono',monospace", letterSpacing: "1px", textTransform: "uppercase", padding: "12px 0 8px" }}>Reading Sessions</div>
          {[...book.sessions].reverse().slice(0,5).map((s,i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
              <span style={{ fontSize: 10, color: "var(--text3)", fontFamily: "'JetBrains Mono',monospace" }}>{s.date}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ height: 2, width: Math.min(80, Math.max(12, s.pagesRead*1.2)), background: "linear-gradient(90deg,var(--gold),var(--gold2))", borderRadius: 1, boxShadow: "0 0 4px rgba(201,168,76,0.3)" }} />
                <span style={{ fontSize: 10, color: "var(--gold)", fontFamily: "'JetBrains Mono',monospace", minWidth: 44, textAlign: "right" }}>+{s.pagesRead}p</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={{ padding: "0 16px 16px", display: "flex", gap: 8 }}>
        <button className="btn-g" onClick={e => { e.stopPropagation(); onLog(book); }} style={{ flex: 2, padding: "9px 0", fontSize: 12 }}>📖 Log Pages</button>
        <button className="btn-o" onClick={e => { e.stopPropagation(); setExp(x=>!x); }} style={{ flex: 1, padding: "9px 0", fontSize: 11 }}>{exp?"▲":"Sessions"}</button>
        <button className="btn-o" onClick={e => { e.stopPropagation(); onDone(book); }} style={{ flex: 1, padding: "9px 0", fontSize: 10, borderColor: "rgba(76,175,130,0.3)", color: "var(--ok)" }}>✓ Done</button>
      </div>
    </div>
  );
}

/* ─── SHELF CARD ─────────────────────────────────────────── */
function ShelfCard({ book, showRating, onRate, onMove }) {
  return (
    <div className="ch" style={{ display: "flex", gap: 12, padding: 14, background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: 12 }}>
      <Cover url={book.coverUrl} title={book.title} size={36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 13, color: "var(--text)", lineHeight: 1.3, marginBottom: 2 }}>{book.title}</div>
        <div style={{ fontSize: 10, color: "var(--text2)", marginBottom: showRating?4:3 }}>{book.author}</div>
        {showRating && <Stars rating={book.rating||0} onChange={r => onRate?.(book.id,r)} />}
        {book.finishedDate && <div style={{ fontSize: 9, color: "var(--text3)", marginTop: 3, fontFamily: "'JetBrains Mono',monospace" }}>✓ {book.finishedDate}</div>}
        <div style={{ marginTop: 5, display: "flex", gap: 5, alignItems: "center" }}>
          <Tag color="var(--text3)">{book.genre}</Tag>
          {book.fromGoodreads && <Tag color="var(--cyan)">goodreads</Tag>}
          {onMove && <button onClick={() => onMove(book)} style={{ fontSize: 9, color: "var(--gold)", marginLeft: 4, fontFamily: "'JetBrains Mono',monospace" }}>→ Start Reading</button>}
        </div>
      </div>
      {book.pages && <div style={{ fontSize: 9, color: "var(--text3)", fontFamily: "'JetBrains Mono',monospace", alignSelf: "flex-start", paddingTop: 2, flexShrink: 0 }}>{book.pages}p</div>}
    </div>
  );
}

/* ─── FEATURES: AI RECOMMEND, READING TIMER, PACE CALC ──── */
function ReadingPace({ book }) {
  if (!book.sessions || book.sessions.length < 2) return null;
  const totalPages = book.sessions.reduce((a, s) => a + s.pagesRead, 0);
  const avgPerSession = Math.round(totalPages / book.sessions.length);
  const remaining = book.pages - book.currentPage;
  const sessionsLeft = remaining > 0 ? Math.ceil(remaining / avgPerSession) : 0;
  const p = pct(book.currentPage, book.pages);
  return (
    <div style={{ padding: "12px 14px", background: "var(--gold3)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 10, marginTop: 8 }}>
      <div style={{ fontSize: 9, color: "var(--gold)", fontFamily: "'JetBrains Mono',monospace", letterSpacing: "1px", marginBottom: 8, textTransform: "uppercase" }}>📊 Reading Pace</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[["Avg/session", `${avgPerSession}p`],["Sessions left",`~${sessionsLeft}`],["Progress",`${p}%`]].map(([l,v]) => (
          <div key={l}><div style={{ fontSize: 16, color: "var(--gold)", fontFamily: "'Cormorant Garamond',serif", fontWeight: 300 }}>{v}</div><div style={{ fontSize: 9, color: "var(--text3)", marginTop: 2, fontFamily: "'JetBrains Mono',monospace" }}>{l.toUpperCase()}</div></div>
        ))}
      </div>
    </div>
  );
}

function AIRecommendPanel({ reading, read }) {
  const [recs, setRecs] = useState(null), [loading, setLoading] = useState(false);
  const getRecommendations = async () => {
    setLoading(true);
    const readTitles = read.slice(0,5).map(b => b.title).join(", ");
    const readingTitles = reading.map(b => b.title).join(", ");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          messages: [{ role: "user", content: `Based on someone who has read: ${readTitles} and is currently reading: ${readingTitles}, recommend 4 books they would love. Return ONLY valid JSON array: [{"title":"Book Title","author":"Author Name","reason":"one sentence why they'd love it","genre":"Genre"}]` }]
        })
      });
      const data = await res.json();
      const raw = data.content?.[0]?.text?.trim().replace(/```json|```/g,"").trim()||"";
      setRecs(JSON.parse(raw));
    } catch { setRecs([]); }
    setLoading(false);
  };
  return (
    <div style={{ background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
      <div style={{ padding: "14px 16px", borderBottom: recs ? "1px solid var(--border)" : "none" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, marginBottom: 2 }}>AI Book Recommendations</div>
            <div style={{ fontSize: 10, color: "var(--text3)" }}>Personalized to your reading history</div>
          </div>
          <button className="btn-g" onClick={getRecommendations} disabled={loading} style={{ padding: "8px 14px", fontSize: 11, display: "flex", alignItems: "center", gap: 6 }}>
            {loading ? <Spinner /> : "✦ Get Recs"}
          </button>
        </div>
      </div>
      {loading && (
        <div style={{ padding: 20, display: "flex", alignItems: "center", gap: 12, color: "var(--text3)", fontSize: 12 }}>
          <Spinner size={16} /> Analyzing your reading taste…
        </div>
      )}
      {recs && recs.length > 0 && (
        <div style={{ padding: "4px 0" }}>
          {recs.map((r, i) => (
            <div key={i} style={{ padding: "12px 16px", borderBottom: i < recs.length-1 ? "1px solid var(--border)" : "none", display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 32, height: 48, borderRadius: 3, background: `linear-gradient(135deg,hsl(${i*60},30%,15%),var(--bg))`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "var(--gold)", flexShrink: 0, border: "1px solid rgba(201,168,76,0.15)" }}>✦</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 14, color: "var(--text)", marginBottom: 2 }}>{r.title}</div>
                <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 4 }}>{r.author}</div>
                <div style={{ fontSize: 11, color: "var(--text3)", lineHeight: 1.5, fontStyle: "italic" }}>{r.reason}</div>
                <div style={{ marginTop: 5 }}><Tag color="var(--gold)">{r.genre}</Tag></div>
              </div>
            </div>
          ))}
        </div>
      )}
      {recs && recs.length === 0 && <div style={{ padding: 16, fontSize: 12, color: "var(--text3)" }}>Add some books to your Read shelf first to get personalized recommendations.</div>}
    </div>
  );
}

function ReadingTimer() {
  const [running, setRunning] = useState(false), [seconds, setSeconds] = useState(0), [pages, setPages] = useState(0);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSeconds(s => s+1), 1000);
    return () => clearInterval(t);
  }, [running]);
  const fmt = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const ppm = seconds > 0 && pages > 0 ? ((pages / seconds) * 60).toFixed(1) : null;
  return (
    <div style={{ background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: 14, padding: 18 }}>
      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, marginBottom: 4 }}>Reading Timer</div>
      <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 16 }}>Track your reading speed and session length</div>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 40, color: running ? "var(--gold)" : "var(--text2)", fontWeight: 300, letterSpacing: 2, textShadow: running ? "0 0 20px rgba(201,168,76,0.4)" : "none", transition: "all 0.3s" }}>{fmt(seconds)}</div>
        {ppm && <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 6, fontFamily: "'JetBrains Mono',monospace" }}>{ppm} pages/min · {pages} pages read</div>}
      </div>
      <div style={{ marginBottom: 14 }}>
        <label className="lbl">Pages read so far this session</label>
        <input className="inp" type="number" min="0" placeholder="0" value={pages||""} onChange={e => setPages(parseInt(e.target.value)||0)} style={{ textAlign: "center" }} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn-g" onClick={() => setRunning(x=>!x)} style={{ flex: 2, padding: "10px 0", fontSize: 13 }}>{running ? "⏸ Pause" : (seconds > 0 ? "▶ Resume" : "▶ Start Session")}</button>
        <button className="btn-o" onClick={() => { setRunning(false); setSeconds(0); setPages(0); }} style={{ flex: 1, padding: "10px 0", fontSize: 12 }}>Reset</button>
      </div>
    </div>
  );
}

function GoodreadsImport({ onImport }) {
  const [dragging, setDragging] = useState(false), [loading, setLoading] = useState(false), [done, setDone] = useState(null);
  const fileRef = useRef(null);
  const process = (file) => {
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const result = parseGoodreadsCSV(e.target.result);
        const total = result.reading.length + result.read.length + result.wantToRead.length;
        if (total === 0) {
          alert("No books were found in this file. Make sure you uploaded the Goodreads export CSV (goodreads_library_export.csv).");
          setLoading(false);
          return;
        }
        onImport(result);
        setDone({ total, reading: result.reading.length, read: result.read.length, want: result.wantToRead.length });
      } catch(err) {
        alert("Could not read the file. Make sure it is the Goodreads CSV export.");
      }
      setLoading(false);
    };
    reader.readAsText(file, "UTF-8");
  };
  return (
    <div style={{ background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: 14, padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: "#553B08", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>📚</div>
        <div><div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16 }}>Import from Goodreads</div><div style={{ fontSize: 10, color: "var(--text3)" }}>Upload your CSV export to sync your real shelves</div></div>
      </div>
      {done !== null ? (
        <div style={{ padding: "14px 16px", background: "rgba(76,175,130,0.1)", border: "1px solid rgba(76,175,130,0.3)", borderRadius: 10, textAlign: "center" }}>
          <div style={{ fontSize: 20, marginBottom: 6 }}>🎉</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, color: "var(--ok)", marginBottom: 8 }}>{done.total} books imported!</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 8 }}>
            {done.reading > 0 && <div style={{ fontSize: 11, color: "var(--text2)" }}>📖 {done.reading} reading</div>}
            {done.read > 0 && <div style={{ fontSize: 11, color: "var(--text2)" }}>✓ {done.read} read</div>}
            {done.want > 0 && <div style={{ fontSize: 11, color: "var(--text2)" }}>🔖 {done.want} want to read</div>}
          </div>
          <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 10 }}>Go to Shelves to see your library.</div>
          <button onClick={() => setDone(null)} style={{ color: "var(--gold)", fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }}>Import again</button>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 14, lineHeight: 1.7 }}>
            To export: <strong style={{ color: "var(--text2)" }}>goodreads.com</strong> → My Books → Import and Export → Export Library → download the CSV file, then upload it here.
          </div>
          <div
            style={{ border: `2px dashed ${dragging ? "var(--gold)" : "var(--border2)"}`, borderRadius: 10, padding: "24px 16px", textAlign: "center", cursor: "pointer", transition: "all 0.2s", background: dragging ? "var(--gold3)" : "transparent" }}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); process(e.dataTransfer.files[0]); }}>
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                <Spinner size={20} />
                <div style={{ fontSize: 12, color: "var(--text3)" }}>Reading your library…</div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📂</div>
                <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 4 }}>Drop your CSV here or click to browse</div>
                <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "'JetBrains Mono',monospace" }}>goodreads_library_export.csv</div>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={e => process(e.target.files[0])} />
        </>
      )}
    </div>
  );
}

function ReadingChallenge({ books }) {
  const byGenre = books.reduce((acc, b) => { acc[b.genre] = (acc[b.genre]||0)+1; return acc; }, {});
  const topGenre = Object.entries(byGenre).sort((a,b) => b[1]-a[1])[0];
  const longestBook = books.reduce((a,b) => b.pages > (a?.pages||0) ? b : a, null);
  const totalPages = books.reduce((a,b) => a + (b.pages||0), 0);
  return (
    <div style={{ background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: 14, padding: 18 }}>
      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, marginBottom: 4 }}>Reading Insights</div>
      <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 16 }}>Patterns from your read shelf</div>
      {books.length === 0 ? (
        <div style={{ fontSize: 12, color: "var(--text3)", fontStyle: "italic" }}>Finish some books to see your reading insights.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            ["📚","Books completed", `${books.length}`],
            ["📄","Total pages read", totalPages.toLocaleString()],
            topGenre ? ["🏷","Favourite genre", topGenre[0]] : null,
            longestBook ? ["🏆","Longest book read", longestBook.title] : null,
            ["⭐","Highly rated (4-5★)", `${books.filter(b=>b.rating>=4).length} books`],
          ].filter(Boolean).map(([icon, label, val]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "var(--bg2)", borderRadius: 8, border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}><span>{icon}</span><span style={{ fontSize: 12, color: "var(--text2)" }}>{label}</span></div>
              <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, color: "var(--gold)", maxWidth: 140, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{val}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MiniBar({ data }) {
  const max = Math.max(...data.map(d=>d.pages), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 72 }}>
      {data.map((d,i) => {
        const isLast = i === data.length-1;
        const h = Math.max(4, Math.round((d.pages/max)*58));
        return (
          <div key={d.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
            <div style={{ position: "relative", width: "100%" }}>
              {isLast && <div style={{ position: "absolute", top: -16, left: "50%", transform: "translateX(-50%)", fontSize: 9, color: "var(--gold)", whiteSpace: "nowrap", fontFamily: "'JetBrains Mono',monospace", fontWeight: 700 }}>{d.pages}</div>}
              <div style={{ height: h, background: isLast ? "linear-gradient(180deg,var(--gold2),var(--gold))" : "var(--bg3)", borderRadius: "3px 3px 0 0", boxShadow: isLast ? "0 0 10px rgba(201,168,76,0.3)" : "none" }} />
            </div>
            <div style={{ fontSize: 9, color: "var(--text3)", fontFamily: "'JetBrains Mono',monospace" }}>{d.month}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── USER MENU ──────────────────────────────────────────── */
function UserMenu({ user, onSettings, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => { const h = e => { if(ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener("mousedown",h); return () => document.removeEventListener("mousedown",h); }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(x=>!x)} style={{ width: 38, height: 38, borderRadius: "50%", background: user.photoURL ? "transparent" : "linear-gradient(135deg,#c9a84c,#a8833a)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, color: "var(--bg)", fontFamily: "'Cormorant Garamond',serif", boxShadow: "0 4px 12px rgba(0,0,0,0.4)", animation: "pulse 3s ease-in-out infinite", border: "none", overflow: "hidden" }}>
        {user.photoURL ? <img src={user.photoURL} alt="" style={{ width: 38, height: 38, objectFit: "cover" }} /> : user.avatar}
      </button>
      {open && (
        <div className="fadeIn" style={{ position: "absolute", top: "calc(100% + 10px)", right: 0, background: "var(--bg1)", border: "1px solid var(--border2)", borderRadius: 12, minWidth: 210, boxShadow: "0 16px 48px rgba(0,0,0,0.8)", overflow: "hidden", zIndex: 100 }}>
          <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 15, color: "var(--text)", marginBottom: 2 }}>{user.name}</div>
            <div style={{ fontSize: 11, color: "var(--text3)" }}>{user.email}</div>
          </div>
          {[["◉","Account","account"],["◈","Profile","profile"],["⟡","Integrations","integrations"],["?","Help","help"]].map(([icon,label,tab]) => (
            <button key={tab} onClick={() => { onSettings(tab); setOpen(false); }} style={{ width: "100%", padding: "10px 16px", textAlign: "left", fontSize: 13, color: "var(--text2)", display: "flex", alignItems: "center", gap: 10, transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.background="var(--bg2)"; e.currentTarget.style.color="var(--text)"; }} onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="var(--text2)"; }}>
              <span style={{ color: "var(--gold)", fontSize: 13, width: 16 }}>{icon}</span>{label}
            </button>
          ))}
          <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
          <button onClick={() => { onLogout(); setOpen(false); }} style={{ width: "100%", padding: "10px 16px", textAlign: "left", fontSize: 13, color: "var(--err)", display: "flex", alignItems: "center", gap: 10, transition: "all 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.background="rgba(207,102,121,0.08)"} onMouseLeave={e => e.currentTarget.style.background="transparent"}>
            <span style={{ fontSize: 13, width: 16 }}>⎋</span> Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── SETTINGS MODAL ─────────────────────────────────────── */
function SettingsModal({ user, onUpdate, onClose, onLogout, initialTab = "account", onImport }) {
  const [stab, setStab] = useState(initialTab), [name, setName] = useState(user.name), [goal, setGoal] = useState(String(user.yearGoal||24)), [saved, setSaved] = useState(false);
  const save = () => { onUpdate({ ...user, name, yearGoal: parseInt(goal)||24 }); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const STABS = [["◉","Account","account"],["◈","Profile","profile"],["⟡","Integrations","integrations"],["?","Help","help"]];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 600, padding: 16, backdropFilter: "blur(12px)" }} onClick={onClose}>
      <div className="fadeUp" style={{ background: "var(--bg1)", border: "1px solid var(--border2)", borderRadius: 20, width: "100%", maxWidth: 520, maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20 }}>Settings</div>
          <button onClick={onClose} style={{ color: "var(--text3)", fontSize: 20, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "var(--bg3)" }}>×</button>
        </div>
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <div style={{ width: 130, borderRight: "1px solid var(--border)", padding: "12px 0", flexShrink: 0 }}>
            {STABS.map(([icon,label,id]) => (
              <button key={id} onClick={() => setStab(id)} style={{ width: "100%", padding: "10px 16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: stab===id?"var(--gold)":"var(--text3)", background: stab===id?"var(--gold3)":"transparent", borderLeft: stab===id?"2px solid var(--gold)":"2px solid transparent", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13 }}>{icon}</span>{label}
              </button>
            ))}
            <div style={{ margin: "12px 10px 0", height: 1, background: "var(--border)" }} />
            <button onClick={onLogout} style={{ width: "100%", padding: "10px 16px", textAlign: "left", fontSize: 12, color: "var(--err)", marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}
              onMouseEnter={e => e.currentTarget.style.background="rgba(207,102,121,0.1)"} onMouseLeave={e => e.currentTarget.style.background="transparent"}>
              <span>⎋</span> Sign Out
            </button>
          </div>
          <div style={{ flex: 1, padding: "20px 22px", overflowY: "auto" }}>
            {stab === "account" && (
              <div className="fadeIn">
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22, padding: 16, background: "var(--bg2)", borderRadius: 12, border: "1px solid var(--border)" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg,var(--gold),#a8833a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "var(--bg)", fontFamily: "'Cormorant Garamond',serif", flexShrink: 0, overflow: "hidden" }}>
                    {user.photoURL ? <img src={user.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : user.avatar}
                  </div>
                  <div><div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 17 }}>{user.name}</div><div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{user.email}</div></div>
                </div>
                <label className="lbl">Display Name</label>
                <input className="inp" value={name} onChange={e => setName(e.target.value)} style={{ marginBottom: 16 }} />
                <label className="lbl">Email</label>
                <input className="inp" value={user.email} disabled style={{ marginBottom: 20, opacity: 0.5 }} />
                <button className="btn-g" onClick={save} style={{ padding: "11px 24px", fontSize: 13 }}>{saved ? "✓ Saved!" : "Save Changes"}</button>
              </div>
            )}
            {stab === "profile" && (
              <div className="fadeIn">
                <label className="lbl">Annual Reading Goal (books)</label>
                <input className="inp" type="number" value={goal} onChange={e => setGoal(e.target.value)} style={{ marginBottom: 20 }} />
                <button className="btn-g" onClick={save} style={{ padding: "11px 24px", fontSize: 13 }}>{saved ? "✓ Saved!" : "Save Profile"}</button>
              </div>
            )}
            {stab === "integrations" && (
              <div className="fadeIn">
                <GoodreadsImport onImport={onImport} />
                <div style={{ marginTop: 14, padding: 16, background: "var(--bg2)", borderRadius: 12, border: "1px solid rgba(76,201,201,0.2)", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "#0a2a2a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🔍</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Open Library</div>
                    <div style={{ fontSize: 11, color: "var(--text3)" }}>Book search, covers & metadata</div>
                  </div>
                  <Tag color="var(--cyan)">ACTIVE</Tag>
                </div>
              </div>
            )}
            {stab === "help" && (
              <div className="fadeIn">
                {[["📖 Adding Books","Tap '+ Add Book' or the search bar in the Reading tab. Covers and pages auto-fill from Open Library."],["📊 Logging Progress","Tap 'Log Pages' on any book — choose pages read today or jump directly to a page number."],["⏱ Reading Timer","In the Discover tab, use the Reading Timer to track session length and calculate pages-per-minute."],["📚 Goodreads Import","Settings → Integrations → upload your Goodreads CSV export to sync your real shelves."],["✦ AI Recommendations","In the Discover tab, tap 'Get Recs' for personalized book recommendations based on what you've read."],["⭐ Rating Books","In your Read shelf, tap any star to rate a finished book."]].map(([t,d]) => (
                  <div key={t} style={{ marginBottom: 14, padding: 14, background: "var(--bg2)", borderRadius: 10, border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 5 }}>{t}</div>
                    <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.6 }}>{d}</div>
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

/* ─── MAIN APP ───────────────────────────────────────────── */
const MONTHLY = [{ month: "Jan", pages: 0 },{ month: "Feb", pages: 0 },{ month: "Mar", pages: 0 },{ month: "Apr", pages: 0 },{ month: "May", pages: 0 }];

export default function Folio() {
  const [user, setUser] = useState(null), [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [quote, setQuote] = useState(fallbackQuote()), [qLoading, setQLoading] = useState(false), [qMood, setQMood] = useState(""), [qHistory, setQHistory] = useState([]);
  const [reading, setReading] = useState([]), [read, setRead] = useState([]), [want, setWant] = useState([]);
  const [yearGoal, setYearGoal] = useState(24);
  const [logTarget, setLogTarget] = useState(null), [addOpen, setAddOpen] = useState(false), [settingsOpen, setSettingsOpen] = useState(false), [settingsTab, setSettingsTab] = useState("account");
  const [notif, setNotif] = useState(null);
  const saveTimeout = useRef(null);

  // ── Auth listener ─────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async fu => {
      if (fu) {
        setUser({ name: fu.displayName||fu.email.split("@")[0], email: fu.email, avatar: (fu.displayName||fu.email).charAt(0).toUpperCase(), photoURL: fu.photoURL, joinedDate: new Date().toLocaleDateString("en-US",{month:"long",year:"numeric"}), uid: fu.uid });
        // Load persisted data from Firestore
        setDataLoading(true);
        const data = await loadUserData(fu.uid);
        if (data) {
          if (data.reading)  setReading(data.reading);
          if (data.read)     setRead(data.read);
          if (data.want)     setWant(data.want);
          if (data.yearGoal) setYearGoal(data.yearGoal);
        }
        setDataLoading(false);
      } else {
        setUser(null);
        setReading([]); setRead([]); setWant([]);
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // ── Debounced save to Firestore whenever books change ─────
  const persistData = useCallback((r, rd, w, goal) => {
    if (!auth.currentUser) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      saveUserData(auth.currentUser.uid, { reading: r, read: rd, want: w, yearGoal: goal });
    }, 800); // debounce: wait 800ms after last change before writing
  }, []);

  useEffect(() => { persistData(reading, read, want, yearGoal); }, [reading, read, want, yearGoal]);

  useEffect(() => {
    if (!user) return;
    // Show a random local quote instantly, then try to upgrade to AI quote
    const instant = getRandomQuote();
    setQuote(instant);
    setQHistory([instant]);
    setQLoading(true);
    setQHistory([]);
    fetchAIQuote().then(q => {
      if (q) { setQuote(q); setQHistory([q]); }
      else { setQuote(instant); setQHistory([instant]); }
      setQLoading(false);
    });
  }, [user?.uid]);

  const newQuote = async (mood = "") => { setQLoading(true); setQMood(mood); const q = await fetchAIQuote(mood); if (q) { setQuote(q); setQHistory(p => [q,...p].slice(0,10)); } setQLoading(false); };
  const notify = useCallback(msg => { setNotif(msg); setTimeout(() => setNotif(null), 3500); }, []);
  const handleLogout = async () => { await signOut(auth); setReading([]); setRead([]); setWant([]); };

  const handleLogSave = (id, newPage, pagesLogged) => {
    const dt = today(); let finished = null;
    setReading(prev => prev.map(b => {
      if (b.id !== id) return b;
      const sessions = [...(b.sessions||[])];
      if (pagesLogged > 0) sessions.push({ date: dt, pagesRead: pagesLogged });
      if (newPage >= b.pages) finished = { ...b, sessions, currentPage: b.pages };
      return { ...b, currentPage: newPage, sessions };
    }));
    setTimeout(() => {
      if (finished) { setRead(p => [{ ...finished, rating: 0, finishedDate: dt }, ...p]); setReading(p => p.filter(b => b.id !== finished.id)); notify("🎉 Finished! Moved to Read shelf."); }
      else notify(`✓ Progress saved — page ${newPage}!`);
    }, 50);
    setLogTarget(null);
  };

  const handleDone = book => { const dt = today(); setRead(p => [{ ...book, rating: 0, finishedDate: dt, currentPage: book.pages }, ...p]); setReading(p => p.filter(b => b.id !== book.id)); notify(`"${book.title}" finished! 🎉`); };
  const handleAdd = (book, shelf) => { if (shelf==="reading") { setReading(p => [...p, book]); notify("Added to Reading!"); setTab("reading"); } else { setWant(p => [...p, book]); notify("Added to Want to Read!"); } };
  const handleRate = (id, rating) => setRead(p => p.map(b => b.id===id ? {...b, rating} : b));
  const handleMoveToReading = book => { setWant(p => p.filter(b => b.id !== book.id)); setReading(p => [...p, { ...book, currentPage: 0, sessions: [] }]); setTab("reading"); notify(`Started reading "${book.title}"!`); };
  const handleGoodreadsImport = async ({ reading: r, read: rd, wantToRead: w }) => {
    const total = r.length + rd.length + w.length;
    if (total === 0) {
      notify("No books found — check the CSV format");
      return;
    }
    // First: load books immediately without covers so user sees them right away
    setReading(p => [...p, ...r]);
    setRead(p => [...p, ...rd]);
    setWant(p => [...p, ...w]);
    const parts = [];
    if (r.length) parts.push(`${r.length} reading`);
    if (rd.length) parts.push(`${rd.length} read`);
    if (w.length) parts.push(`${w.length} want to read`);
    notify(`Imported ${total} books! Fetching covers...`);
    setSettingsOpen(false);
    setTab("shelves");

    // Second: fetch covers in the background and update state as they come in
    const allBooks = [...r, ...rd, ...w];
    let fetched = 0;
    const BATCH = 4;
    for (let i = 0; i < allBooks.length; i += BATCH) {
      const batch = allBooks.slice(i, i + BATCH);
      await Promise.all(batch.map(async (book) => {
        const url = await fetchCoverForBook(book.title, book.author);
        if (url) {
          // Update whichever shelf this book is on
          const updater = prev => prev.map(b => b.id === book.id ? { ...b, coverUrl: url } : b);
          setReading(updater);
          setRead(updater);
          setWant(updater);
        }
        fetched++;
      }));
      // Progress notification every 10 books
      if (fetched % 10 === 0 && fetched < allBooks.length) {
        notify(`Loading covers... ${fetched}/${allBooks.length}`);
      }
      if (i + BATCH < allBooks.length) await new Promise(res => setTimeout(res, 250));
    }
    notify(`✓ All covers loaded for ${total} books!`);
  };
  const openSettings = (t = "account") => { setSettingsTab(t); setSettingsOpen(true); };

  const booksRead = read.length, goalPct = Math.min(100, Math.round((booksRead/yearGoal)*100));
  const totalPages = read.reduce((a,b) => a+(b.pages||0), 0) + reading.reduce((a,b) => a+(b.currentPage||0), 0);

  const TABS = [{ id:"dashboard",icon:"◈",label:"Home" },{ id:"reading",icon:"◎",label:"Reading" },{ id:"shelves",icon:"⊟",label:"Shelves" },{ id:"discover",icon:"✦",label:"Discover" }];

  if (authLoading || dataLoading) return (
    <><style>{CSS}</style>
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20 }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 36, color: "var(--gold)", letterSpacing: 6, animation: "glow 2s ease-in-out infinite" }}>FOLIO</div>
        <Spinner size={24} />
        {dataLoading && <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "'JetBrains Mono',monospace", letterSpacing: "2px" }}>LOADING YOUR LIBRARY...</div>}
      </div>
    </>
  );

  if (!user) return <><style>{CSS}</style><AuthScreen /></>;

  return (
    <><style>{CSS}</style>
      <div style={{ minHeight: "100vh", paddingBottom: 80, position: "relative" }}>
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", zIndex: 0 }}>
          <div style={{ position: "absolute", top: "-30%", right: "-20%", width: 600, height: 600, background: "radial-gradient(circle,rgba(201,168,76,0.04),transparent 65%)", borderRadius: "50%" }} />
          <div style={{ position: "absolute", bottom: "-20%", left: "-20%", width: 500, height: 500, background: "radial-gradient(circle,rgba(76,201,201,0.03),transparent 65%)", borderRadius: "50%" }} />
        </div>

        {notif && <div style={{ position: "fixed", top: 14, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,var(--bg2),var(--bg3))", color: "var(--gold)", padding: "11px 22px", borderRadius: 24, fontSize: 13, zIndex: 1000, border: "1px solid rgba(201,168,76,0.3)", boxShadow: "0 8px 32px rgba(0,0,0,0.6)", whiteSpace: "nowrap", animation: "slideDown 0.3s ease", fontWeight: 600 }}>{notif}</div>}

        {logTarget && <LogModal book={logTarget} onSave={handleLogSave} onClose={() => setLogTarget(null)} />}
        {addOpen && <AddBookModal onAdd={handleAdd} onClose={() => setAddOpen(false)} />}
        {settingsOpen && <SettingsModal user={user} onUpdate={u => { setUser(u); if (u.yearGoal) setYearGoal(u.yearGoal); }} onClose={() => setSettingsOpen(false)} onLogout={() => { handleLogout(); setSettingsOpen(false); }} initialTab={settingsTab} onImport={handleGoodreadsImport} />}

        {/* Header */}
        <div style={{ padding: "14px 18px", background: "rgba(5,5,8,0.94)", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(20px)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 480, margin: "0 auto" }}>
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, color: "var(--gold)", letterSpacing: 4, lineHeight: 1, fontWeight: 300 }}>FOLIO</div>
              <div style={{ fontSize: 8, color: "var(--text3)", letterSpacing: "3px", fontFamily: "'JetBrains Mono',monospace", textTransform: "uppercase", marginTop: 1 }}>Reading Companion</div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button onClick={() => setAddOpen(true)} className="btn-g" style={{ padding: "8px 14px", fontSize: 11, display: "flex", alignItems: "center", gap: 5 }}>+ Add Book</button>
              <UserMenu user={user} onSettings={openSettings} onLogout={handleLogout} />
            </div>
          </div>
        </div>

        <div style={{ padding: "0 16px", maxWidth: 480, margin: "0 auto", position: "relative", zIndex: 1 }}>

          {/* ── DASHBOARD ── */}
          {tab === "dashboard" && (
            <div className="fadeUp">
              <div style={{ padding: "18px 0 14px" }}>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 12, color: "var(--text3)", fontStyle: "italic" }}>Good {new Date().getHours()<12?"morning":new Date().getHours()<17?"afternoon":"evening"},</div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, color: "var(--text)", fontWeight: 300, letterSpacing: "-0.3px" }}>{user.name}</div>
              </div>

              {/* Goal card */}
              <div style={{ background: "var(--bg1)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 16, padding: 20, marginBottom: 12, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, background: "radial-gradient(circle,rgba(201,168,76,0.07),transparent 70%)", pointerEvents: "none" }} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 9, color: "var(--text3)", fontFamily: "'JetBrains Mono',monospace", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 6 }}>2025 Goal</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                      <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 40, color: "var(--gold)", fontWeight: 300, lineHeight: 1, animation: "glow 4s ease-in-out infinite" }}>{booksRead}</span>
                      <span style={{ fontSize: 13, color: "var(--text3)" }}>/ {yearGoal} books</span>
                    </div>
                  </div>
                  <div style={{ position: "relative" }}>
                    <Ring p={goalPct} size={68} stroke={5} />
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "var(--gold)", fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{goalPct}%</div>
                  </div>
                </div>
                <div style={{ height: 2, background: "var(--bg3)", borderRadius: 1, overflow: "hidden", marginBottom: 6 }}><div style={{ height: "100%", width: `${goalPct}%`, background: "linear-gradient(90deg,var(--gold),var(--gold2))", borderRadius: 1, boxShadow: "0 0 10px rgba(201,168,76,0.4)", transition: "width 1.2s ease" }} /></div>
                <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "'JetBrains Mono',monospace" }}>{yearGoal-booksRead} more to go</div>
              </div>

              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
                {[["◻","Pages",totalPages.toLocaleString()],["◈","Reading",reading.length],["◉","Finished",read.length]].map(([icon,label,val]) => (
                  <div key={label} className="ch" style={{ background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 8px", textAlign: "center" }}>
                    <div style={{ fontSize: 14, color: "var(--gold)", marginBottom: 5 }}>{icon}</div>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, color: "var(--text)" }}>{val}</div>
                    <div style={{ fontSize: 9, color: "var(--text3)", marginTop: 2, fontFamily: "'JetBrains Mono',monospace" }}>{label.toUpperCase()}</div>
                  </div>
                ))}
              </div>

              {/* Currently reading preview */}
              {reading.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16 }}>Currently Reading</div>
                    <button onClick={() => setTab("reading")} style={{ color: "var(--gold)", fontSize: 11, fontFamily: "'JetBrains Mono',monospace" }}>see all →</button>
                  </div>
                  <ReadingCard book={reading[0]} onLog={setLogTarget} onDone={handleDone} />
                  {reading[0]?.sessions?.length >= 2 && <ReadingPace book={reading[0]} />}
                </div>
              )}

              {/* Empty state */}
              {reading.length === 0 && read.length === 0 && want.length === 0 && (
                <div style={{ background: "var(--bg1)", border: "1px solid rgba(201,168,76,0.1)", borderRadius: 14, padding: 28, textAlign: "center", marginBottom: 12 }}>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, color: "var(--gold)", marginBottom: 10, opacity: 0.5 }}>◎</div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, color: "var(--text2)", marginBottom: 8 }}>Your library awaits</div>
                  <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 18, lineHeight: 1.6 }}>Add your first book, or import your entire<br/>Goodreads library in one click.</div>
                  <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                    <button className="btn-g" onClick={() => setAddOpen(true)} style={{ padding: "9px 18px", fontSize: 12 }}>+ Add a Book</button>
                    <button className="btn-o" onClick={() => openSettings("integrations")} style={{ padding: "9px 18px", fontSize: 12 }}>📚 Import from Goodreads</button>
                  </div>
                </div>
              )}

              {/* Quote teaser */}
              <div onClick={() => setTab("discover")} className="ch" style={{ background: "linear-gradient(135deg,rgba(201,168,76,0.05),rgba(124,92,191,0.05))", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 14, padding: 18, cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontSize: 9, color: "var(--gold)", fontFamily: "'JetBrains Mono',monospace", letterSpacing: "2px", textTransform: "uppercase" }}>✦ Today's Quote</div>
                  <div style={{ fontSize: 8, color: "var(--text3)", fontFamily: "'JetBrains Mono',monospace" }}>AI · LIVE</div>
                </div>
                {qLoading ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Spinner /><span style={{ fontSize: 12, color: "var(--text3)", fontStyle: "italic", fontFamily: "'Cormorant Garamond',serif" }}>Generating…</span></div>
                ) : (
                  <>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 14, color: "var(--text2)", fontStyle: "italic", lineHeight: 1.7 }}>"{quote.text.substring(0,90)}{quote.text.length>90?"…":""}"</div>
                    <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 8, fontFamily: "'JetBrains Mono',monospace" }}>— {quote.author} · tap to explore →</div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── READING ── */}
          {tab === "reading" && (
            <div className="fadeUp">
              <div style={{ padding: "18px 0 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 300 }}>Currently Reading</div>
                <Tag color="var(--gold)">{reading.length} books</Tag>
              </div>
              <div style={{ marginBottom: 14 }}>
                <BookSearch onSelect={book => handleAdd({ id: Date.now(), title: book.title, author: book.author, pages: book.pages||200, currentPage: 0, coverUrl: book.coverUrl, genre: book.genre||"General", addedDate: today(), sessions: [], rating: 0 }, "reading")} placeholder="Quick-add by title or author…" />
                <div style={{ fontSize: 9, color: "var(--text3)", marginTop: 5, fontFamily: "'JetBrains Mono',monospace" }}>COVERS AUTO-FILLED FROM OPEN LIBRARY</div>
              </div>
              {reading.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: 14 }}>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 36, color: "var(--text3)", marginBottom: 10 }}>◎</div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, color: "var(--text2)", marginBottom: 6 }}>No books in progress</div>
                  <div style={{ fontSize: 12, color: "var(--text3)" }}>Search above to start tracking</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {reading.map(b => (
                    <div key={b.id}><ReadingCard book={b} onLog={setLogTarget} onDone={handleDone} />{b.sessions?.length >= 2 && <ReadingPace book={b} />}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── SHELVES ── */}
          {tab === "shelves" && (
            <div className="fadeUp">
              <div style={{ padding: "18px 0 14px", fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 300 }}>My Library</div>

              {read.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 2, height: 14, background: "var(--gold)", borderRadius: 1, boxShadow: "0 0 6px var(--gold)" }} />
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--gold)", fontFamily: "'JetBrains Mono',monospace", letterSpacing: "1px" }}>READ · {read.length}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {read.map(b => <ShelfCard key={b.id} book={b} showRating onRate={handleRate} />)}
                  </div>
                </div>
              )}

              {want.length > 0 && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 2, height: 14, background: "var(--cyan)", borderRadius: 1, boxShadow: "0 0 6px var(--cyan)" }} />
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--cyan)", fontFamily: "'JetBrains Mono',monospace", letterSpacing: "1px" }}>WANT TO READ · {want.length}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {want.map(b => <ShelfCard key={b.id} book={b} onMove={handleMoveToReading} />)}
                  </div>
                </div>
              )}

              {read.length === 0 && want.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 20px", background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: 14 }}>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, color: "var(--text2)", marginBottom: 8 }}>Your shelves are empty</div>
                  <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 16 }}>Import your Goodreads library or add books manually</div>
                  <button className="btn-o" onClick={() => openSettings("integrations")} style={{ padding: "9px 18px", fontSize: 12 }}>📚 Import from Goodreads</button>
                </div>
              )}
            </div>
          )}

          {/* ── DISCOVER (replaces old Quote tab) ── */}
          {tab === "discover" && (
            <div className="fadeUp">
              <div style={{ padding: "18px 0 16px", fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 300 }}>Discover</div>

              {/* AI Quote */}
              <div style={{ background: "linear-gradient(160deg,rgba(201,168,76,0.06),rgba(124,92,191,0.06))", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 18, padding: "28px 24px", marginBottom: 14, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -30, right: -30, width: 160, height: 160, background: "radial-gradient(circle,rgba(201,168,76,0.08),transparent 70%)", pointerEvents: "none" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ fontSize: 9, color: "var(--gold)", fontFamily: "'JetBrains Mono',monospace", letterSpacing: "2px", textTransform: "uppercase" }}>✦ Reading Quote</div>
                  <div style={{ fontSize: 8, color: "var(--text3)", fontFamily: "'JetBrains Mono',monospace" }}>AI · LIVE</div>
                </div>
                {qLoading ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "20px 0" }}>
                    <Spinner size={22} />
                    <div style={{ fontSize: 11, color: "var(--text3)", fontFamily: "'JetBrains Mono',monospace" }}>{qMood ? `FINDING ${qMood.toUpperCase()}…` : "GENERATING…"}</div>
                  </div>
                ) : (
                  <>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 60, color: "rgba(201,168,76,0.1)", lineHeight: 0.8, marginBottom: 14 }}>"</div>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, color: "var(--text)", fontStyle: "italic", lineHeight: 1.75, marginBottom: 18 }}>{quote.text}</div>
                    <div style={{ width: 32, height: 1, background: "var(--gold)", marginBottom: 10, boxShadow: "0 0 6px var(--gold)" }} />
                    <div style={{ fontSize: 12, color: "var(--gold)", fontFamily: "'Cormorant Garamond',serif", fontWeight: 600, marginBottom: quote.context?6:0 }}>— {quote.author}</div>
                    {quote.context && <div style={{ fontSize: 10, color: "var(--text3)", fontStyle: "italic", lineHeight: 1.5 }}>{quote.context}</div>}
                  </>
                )}
              </div>

              {/* Mood picker */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                {[["✦","Inspiring"],["◎","Philosophical"],["◈","Humorous"],["❧","Poetic"],["⟡","Adventurous"],["◉","Timeless"]].map(([icon,mood]) => (
                  <button key={mood} onClick={() => newQuote(mood.toLowerCase())} disabled={qLoading} style={{ padding: "6px 12px", background: "var(--bg1)", border: "1px solid var(--border2)", borderRadius: 20, color: "var(--text2)", fontSize: 11, display: "flex", alignItems: "center", gap: 5, transition: "all 0.2s", opacity: qLoading?0.5:1 }}
                    onMouseEnter={e => { if(!qLoading){e.currentTarget.style.borderColor="var(--gold)";e.currentTarget.style.color="var(--gold)";e.currentTarget.style.background="var(--gold3)";} }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border2)";e.currentTarget.style.color="var(--text2)";e.currentTarget.style.background="var(--bg1)"; }}>
                    <span style={{ fontSize: 10 }}>{icon}</span>{mood}
                  </button>
                ))}
              </div>
              <button className="btn-g" onClick={() => newQuote()} disabled={qLoading} style={{ width: "100%", padding: "12px 0", fontSize: 13, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {qLoading ? <><Spinner /> Generating…</> : "✦ New Quote"}
              </button>

              <Divider label="TOOLS" />

              {/* Reading Timer */}
              <div style={{ marginBottom: 12 }}><ReadingTimer /></div>

              {/* AI Recommendations */}
              <div style={{ marginBottom: 12 }}><AIRecommendPanel reading={reading} read={read} /></div>

              {/* Insights */}
              <div style={{ marginBottom: 12 }}><ReadingChallenge books={read} /></div>

              {/* Quote history */}
              {qHistory.length > 1 && (
                <div>
                  <div style={{ fontSize: 9, color: "var(--text3)", fontFamily: "'JetBrains Mono',monospace", letterSpacing: "2px", textTransform: "uppercase", marginBottom: 10 }}>Recent Quotes</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {qHistory.slice(1,5).map((q,i) => (
                      <div key={i} className="ch" style={{ background: "var(--bg1)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px", cursor: "pointer" }} onClick={() => setQuote(q)}>
                        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 12, color: "var(--text2)", fontStyle: "italic", lineHeight: 1.6, marginBottom: 4 }}>"{q.text.substring(0,80)}{q.text.length>80?"…":""}"</div>
                        <div style={{ fontSize: 9, color: "var(--gold)", fontFamily: "'JetBrains Mono',monospace" }}>— {q.author}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom nav */}
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(5,5,8,0.96)", backdropFilter: "blur(20px)", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-around", padding: "10px 0 18px", zIndex: 50 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "4px 16px", borderRadius: 10, background: "none", border: "none" }}>
              <span style={{ fontSize: 16, color: tab===t.id?"var(--gold)":"var(--text3)", textShadow: tab===t.id?"0 0 10px var(--gold)":"none", transition: "all 0.2s" }}>{t.icon}</span>
              <span style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: "1.5px", fontFamily: "'JetBrains Mono',monospace", color: tab===t.id?"var(--gold)":"var(--text3)", fontWeight: tab===t.id?700:400, transition: "all 0.2s" }}>{t.label}</span>
              {tab===t.id && <div style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--gold)", boxShadow: "0 0 6px var(--gold)" }} />}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
