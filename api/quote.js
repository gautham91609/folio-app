export const config = { runtime: "edge" };

const FALLBACKS = [
  { text: "A reader lives a thousand lives before he dies. The man who never reads lives only one.", author: "George R.R. Martin", context: "Fantasy author famous for A Song of Ice and Fire." },
  { text: "There is no friend as loyal as a book.", author: "Ernest Hemingway", context: "Nobel Prize-winning American novelist and short story writer." },
  { text: "We read to know we are not alone.", author: "C.S. Lewis", context: "British writer and theologian, author of The Chronicles of Narnia." },
  { text: "Once you learn to read, you will be forever free.", author: "Frederick Douglass", context: "American abolitionist and writer who escaped slavery." },
  { text: "A book is a dream that you hold in your hand.", author: "Neil Gaiman", context: "English author of novels, short stories, and comic books." },
  { text: "Not all those who wander are lost.", author: "J.R.R. Tolkien", context: "English author who created the legendary world of Middle-earth." },
  { text: "To read is to voyage through time.", author: "Carl Sagan", context: "Astronomer and science communicator who made cosmos accessible to all." },
  { text: "Reading without reflecting is like eating without digesting.", author: "Edmund Burke", context: "18th-century Irish statesman and philosopher." },
  { text: "The more that you read, the more things you will know.", author: "Dr. Seuss", context: "American children's book author whose works have sold over 600 million copies." },
  { text: "A good book is an event in my life.", author: "Stendhal", context: "19th-century French author known for his psychological novels." },
  { text: "Books are the quietest and most constant of friends.", author: "Charles W. Eliot", context: "President of Harvard University for 40 years, who democratized education." },
  { text: "Reading is to the mind what exercise is to the body.", author: "Joseph Addison", context: "English essayist and playwright of the early 18th century." },
  { text: "I cannot live without books.", author: "Thomas Jefferson", context: "Founding Father and third President of the United States." },
  { text: "The reading of all good books is like conversation with the finest minds of past centuries.", author: "René Descartes", context: "French philosopher and mathematician, father of modern philosophy." },
  { text: "A book must be the axe for the frozen sea within us.", author: "Franz Kafka", context: "Bohemian novelist whose surreal stories influenced 20th century literature." },
  { text: "Literature is the most agreeable way of ignoring life.", author: "Fernando Pessoa", context: "Portuguese poet who wrote under many different personas." },
  { text: "Books were my pass to personal freedom.", author: "Oprah Winfrey", context: "Media executive and philanthropist who made reading a cultural phenomenon." },
  { text: "Think before you speak. Read before you think.", author: "Fran Lebowitz", context: "American author and public speaker known for her sardonic social commentary." },
  { text: "The unread story is not a story; it is little black marks on wood pulp.", author: "Ursula K. Le Guin", context: "American author who elevated science fiction and fantasy to literary art." },
  { text: "No matter how busy you may think you are, you must find time for reading.", author: "Confucius", context: "Chinese philosopher whose teachings have influenced civilizations for 2,500 years." },
];

function getFallback(mood) {
  const seed = Date.now() + (mood?.length || 0);
  return FALLBACKS[seed % FALLBACKS.length];
}

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  let mood = "";
  try {
    const body = await req.json();
    mood = body.mood || "";
  } catch {}

  const moods = ["inspiring","philosophical","humorous","poetic","motivational","contemplative","adventurous","timeless"];
  const pick = mood || moods[Math.floor(Math.random() * moods.length)];

  if (!apiKey) {
    return new Response(JSON.stringify(getFallback(mood)), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        messages: [{
          role: "user",
          content: `Generate one unique, genuine ${pick} quote about reading, books, or literature. It MUST be a real verified quote from a real historical author, thinker, philosopher, or writer — not invented. Avoid extremely famous overused quotes. Prefer lesser-known but meaningful voices from world literature. Return ONLY this exact JSON with no other text or markdown:
{"text":"the exact quote","author":"Full Name","context":"one sentence: who this person was and why this quote matters"}`
        }],
      }),
    });

    const data = await anthropicRes.json();
    const raw = data.content?.[0]?.text?.trim().replace(/```json|```/g, "").trim() || "";

    let parsed;
    try { parsed = JSON.parse(raw); } catch { parsed = null; }

    if (parsed?.text && parsed?.author) {
      return new Response(JSON.stringify(parsed), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }
  } catch (e) {
    console.error("Anthropic API error:", e);
  }

  // Fallback if anything fails
  return new Response(JSON.stringify(getFallback(mood)), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
