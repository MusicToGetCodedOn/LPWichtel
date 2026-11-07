import { FormEvent, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, CalendarDays, Check, ChevronDown, Gift, Languages, Link2, Menu, ShieldCheck, Sparkles, X } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

type CreatedGroup = { groupId: string; adminToken: string; inviteCode: string; participantToken: string };
type Language = "en" | "de" | "it";

const translations = {
  en: {
    how: "How it works", why: "Why LPWichtel", login: "Log in", eyebrow: "Secret Santa made simple",
    heroTitle: "Give with care.", heroTitleAccent: "Receive with joy.",
    heroText: "LPWichtel keeps your Secret Santa simple. Create a group, share one link, and let everyone add a few gift ideas.",
    create: "Create a group", ready: "Made for small moments", loved: "and the people you love",
    noteTop: "Ready when you are", noteBottom: "A surprise is waiting", promiseKicker: "A simple way to exchange gifts",
    promiseTitle: "Less planning.", promiseAccent: "More excitement.",
    features: [
      ["One simple link", "Share it in your group chat. Everyone joins in seconds with no account or email needed."],
      ["Private by design", "Each person gets a private link. Only you can see who you are buying for."],
      ["Helpful wish lists", "Add a few ideas and no-gos so every gift feels personal."],
    ],
    stepsKicker: "Three easy steps", stepsTitle: "From \"who is in?\"", stepsAccent: "to \"what a surprise!\"",
    steps: [["Create your group", "Name your group, add the date and budget, then share your invite."], ["Everyone joins", "Friends add their name and save their private link."], ["See the result", "Draw names when you are ready, then choose a thoughtful gift."]],
    footer: "A simple way to share gifts this holiday season.", createHeading: "Create your group", createIntro: "Set up the details, then share one link with your people.",
    groupName: "Group name", creatorName: "Your name", budget: "Budget", eventDate: "Event date", createSuccess: "Creating...", done: "Done",
  },
  de: {
    how: "So funktioniert es", why: "Warum LPWichtel", login: "Anmelden", eyebrow: "Wichteln leicht gemacht",
    heroTitle: "Mit Freude schenken.", heroTitleAccent: "Mit Spannung empfangen.",
    heroText: "LPWichtel macht Wichteln einfach. Gruppe erstellen, einen Link teilen und gemeinsam Geschenkideen sammeln.",
    create: "Gruppe erstellen", ready: "Für kleine Momente", loved: "und die Menschen, die dir wichtig sind",
    noteTop: "Bereit, wenn du es bist", noteBottom: "Eine Überraschung wartet", promiseKicker: "Einfach Geschenke austauschen",
    promiseTitle: "Weniger Planung.", promiseAccent: "Mehr Vorfreude.",
    features: [["Ein einfacher Link", "Teile ihn im Gruppenchat. Alle machen ohne Konto oder E-Mail in wenigen Sekunden mit."], ["Privat und sicher", "Jede Person erhält einen privaten Link. Nur du siehst, für wen du ein Geschenk kaufst."], ["Hilfreiche Wunschlisten", "Teile einige Ideen und No-Gos, damit jedes Geschenk persönlich wird."]],
    stepsKicker: "Drei einfache Schritte", stepsTitle: "Von \"Wer macht mit?\"", stepsAccent: "zu \"Was für eine Überraschung!\"", steps: [["Gruppe erstellen", "Gruppennamen, Datum und Budget eintragen und die Einladung teilen."], ["Alle machen mit", "Freunde tragen ihren Namen ein und speichern ihren privaten Link."], ["Ergebnis ansehen", "Namen ziehen, sobald alle bereit sind, und ein passendes Geschenk auswählen."]],
    footer: "Eine einfache Art, in dieser Saison Geschenke zu teilen.", createHeading: "Gruppe erstellen", createIntro: "Details eintragen und anschliessend einen Link teilen.",
    groupName: "Gruppenname", creatorName: "Dein Name", budget: "Budget", eventDate: "Datum", createSuccess: "Wird erstellt...", done: "Fertig",
  },
  it: {
    how: "Come funziona", why: "Perché LPWichtel", login: "Accedi", eyebrow: "Secret Santa, in modo semplice",
    heroTitle: "Regala con cura.", heroTitleAccent: "Ricevi con gioia.",
    heroText: "LPWichtel rende il Secret Santa semplice. Crea un gruppo, condividi un link e raccogli qualche idea regalo.",
    create: "Crea un gruppo", ready: "Per i piccoli momenti", loved: "e per le persone a cui vuoi bene",
    noteTop: "Pronto quando vuoi", noteBottom: "Una sorpresa ti aspetta", promiseKicker: "Un modo semplice per scambiarsi regali",
    promiseTitle: "Meno organizzazione.", promiseAccent: "Piu attesa.",
    features: [["Un solo link", "Condividilo nella chat del gruppo. Tutti partecipano in pochi secondi senza account o email."], ["Privato per scelta", "Ogni persona riceve un link privato. Solo tu puoi vedere per chi comprerai il regalo."], ["Liste dei desideri", "Aggiungi qualche idea e alcune cose da evitare per un regalo personale."]],
    stepsKicker: "Tre semplici passi", stepsTitle: "Da \"chi partecipa?\"", stepsAccent: "a \"che sorpresa!\"", steps: [["Crea il gruppo", "Inserisci nome, data e budget, poi condividi l'invito."], ["Tutti partecipano", "Gli amici inseriscono il loro nome e salvano il link privato."], ["Scopri il risultato", "Estrai i nomi quando siete pronti e scegli un regalo pensato con cura."]],
    footer: "Un modo semplice per condividere regali durante le feste.", createHeading: "Crea il tuo gruppo", createIntro: "Inserisci i dettagli e condividi un solo link.",
    groupName: "Nome del gruppo", creatorName: "Il tuo nome", budget: "Budget", eventDate: "Data", createSuccess: "Creazione...", done: "Fatto",
  },
} as const;

function App() {
  const path = window.location.pathname.split("/").filter(Boolean);
  if (path[0] === "join" && path[1]) return <JoinPage inviteCode={path[1]} />;
  if (path[0] === "my-santa" && path[1]) return <PersonalPage token={path[1]} />;
  if (path[0] === "register") return <RegisterPage />;
  if (path[0] === "login") return <LoginPage />;
  if (path[0] === "group" && path[1] && path[2] === "admin") return <AdminPage groupId={path[1]} />;
  const [menuOpen, setMenuOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [created, setCreated] = useState<CreatedGroup | null>(null);
  const [form, setForm] = useState({ name: "", creator: "", budget: "", date: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem("lpwichtel-language") as Language) || "en");
  const copy = translations[language];
  function changeLanguage(value: Language) {
    setLanguage(value);
    localStorage.setItem("lpwichtel-language", value);
  }

  async function createGroup(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/groups`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error((await response.json()).error ?? "Something went wrong");
      setCreated(await response.json());
    } catch (requestError) {
      setError(requestError instanceof TypeError
        ? "The API is not reachable. Start the backend with: cd backend, npm run dev"
        : requestError instanceof Error ? requestError.message : "Could not create group");
    } finally { setSaving(false); }
  }

  function JoinPage({ inviteCode }: { inviteCode: string }) {
    const [name, setName] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
    async function join(e: FormEvent) { e.preventDefault(); setBusy(true); setError(""); try { const r = await fetch(`${API_URL}/api/groups/join`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ inviteCode, name }) }); const data = await r.json(); if (!r.ok) throw new Error(data.error); window.location.href = `/my-santa/${data.participantToken}`; } catch (x) { setError(x instanceof Error ? x.message : "Could not join"); } finally { setBusy(false); } }
    return <SimpleShell><div className="link-card"><div className="success-icon"><Gift size={22} /></div><span className="section-kicker">You are invited</span><h2>Join the LPWichtel group</h2><p>Enter your first name to get your personal link.</p><form onSubmit={join}><label>Your name<input autoFocus required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Alex" /></label>{error && <p className="form-error">{error}</p>}<button className="primary-button submit-button" disabled={busy}>{busy ? "Joining..." : "Join group"} <ArrowRight size={17} /></button></form></div></SimpleShell>;
  }

  function RegisterPage() {
    const participantToken = new URLSearchParams(window.location.search).get("token") ?? "";
    const [username, setUsername] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
    async function register(event: FormEvent) {
      event.preventDefault(); setBusy(true); setError("");
      try {
        const result = await fetch(`${API_URL}/api/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ participantToken, username, password }) });
        const data = await result.json(); if (!result.ok) throw new Error(data.error);
        window.location.href = `/my-santa/${data.participantToken}`;
      } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Could not create account"); } finally { setBusy(false); }
    }
    return <SimpleShell><div className="link-card"><div className="success-icon"><Gift size={22} /></div><span className="section-kicker">Create an account</span><h2>Keep your draw handy.</h2><p>Choose a username and password. No email is needed.</p>{participantToken ? <form onSubmit={register}><label>Username<input autoFocus required minLength={3} value={username} onChange={event => setUsername(event.target.value)} placeholder="alex" /></label><label>Password<input required minLength={8} type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="At least 8 characters" /></label>{error && <p className="form-error">{error}</p>}<button className="primary-button submit-button" disabled={busy}>{busy ? "Creating..." : "Create account"} <ArrowRight size={17} /></button></form> : <p className="form-error">Open your personal page first, then use the account link there.</p>}<p className="auth-switch">Already registered? <a href="/login">Log in</a></p></div></SimpleShell>;
  }

  function LoginPage() {
    const [username, setUsername] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
    async function login(event: FormEvent) {
      event.preventDefault(); setBusy(true); setError("");
      try {
        const result = await fetch(`${API_URL}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
        const data = await result.json(); if (!result.ok) throw new Error(data.error);
        window.location.href = `/my-santa/${data.participantToken}`;
      } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Could not log in"); } finally { setBusy(false); }
    }
    return <SimpleShell><div className="link-card"><div className="success-icon"><Gift size={22} /></div><span className="section-kicker">Welcome back</span><h2>Log in to your draw.</h2><p>Use your username and password to see your group.</p><form onSubmit={login}><label>Username<input autoFocus required value={username} onChange={event => setUsername(event.target.value)} placeholder="alex" /></label><label>Password<input required type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Your password" /></label>{error && <p className="form-error">{error}</p>}<button className="primary-button submit-button" disabled={busy}>{busy ? "Logging in..." : "Log in"} <ArrowRight size={17} /></button></form><p className="auth-switch">No account yet? <a href="/register">Register with a personal link</a></p></div></SimpleShell>;
  }

  function PersonalPage({ token }: { token: string }) {
    const [data, setData] = useState<any>(null); const [wishes, setWishes] = useState(""); const [saved, setSaved] = useState(false); const [revealed, setRevealed] = useState(false);
    useEffect(() => { fetch(`${API_URL}/api/me/${token}`).then(r => r.json()).then(value => { setData(value); setWishes(value.wishes ?? ""); }); }, [token]);
    if (!data) return <SimpleShell><div className="loading">Loading your personal page...</div></SimpleShell>;
    async function save() { await fetch(`${API_URL}/api/me/${token}/wishes`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ wishes }) }); setSaved(true); setTimeout(() => setSaved(false), 1800); }
    return <SimpleShell><div className="personal-overview"><div className="personal-card"><div className="personal-heading"><div><span className="section-kicker">Hello, {data.name}</span><h2>{data.status === "DRAWN" ? "Your secret is ready." : "The draw is not ready yet."}</h2></div><span className={`status ${data.status.toLowerCase()}`}>{data.status === "DRAWN" ? "READY" : "OPEN"}</span></div><div className="group-summary"><div><span>Group</span><strong>{data.group.name}</strong></div>{data.group.budget && <div><span>Budget</span><strong>{data.group.budget}</strong></div>}{data.group.eventDate && <div><span>Date</span><strong>{new Date(data.group.eventDate).toLocaleDateString()}</strong></div>}</div>{data.status === "DRAWN" && data.recipient ? revealed ? <div className="recipient"><div className="recipient-icon"><Gift /></div><span className="section-kicker">You are gifting to</span><h3>{data.recipient.name}</h3><p>{data.group.budget ? `Budget: ${data.group.budget}` : "Choose a thoughtful gift"}</p><div className="wishes-read"><strong>Wish list</strong><p>{data.recipient.wishes || "No wishes shared yet. Choose a surprise."}</p></div></div> : <button className="reveal-box" onClick={() => setRevealed(true)}><Gift size={42} /><span>Tap to reveal your recipient</span></button> : <div className="status-message"><span className="status-step">1</span><p><strong>Your wish list</strong><br />Add a few ideas below. You can update them until the draw.</p></div>}<div className="wish-section"><label className="wish-label">Your wishes and no-gos<textarea value={wishes} onChange={e => setWishes(e.target.value)} placeholder={"A book by...\nNo scented candles, please."} rows={5} /></label><button className="primary-button submit-button" onClick={save}>{saved ? "Saved" : "Save wishes"}</button></div>{!data.account && <a className="account-link" href={`/register?token=${token}`}>Create a username and password so you can log in next time</a>}</div></div></SimpleShell>;
  }

  function AdminPage({ groupId }: { groupId: string }) {
    const [data, setData] = useState<any>(null); const [error, setError] = useState(""); const adminToken = new URLSearchParams(window.location.search).get("token") ?? ""; 
    const load = () => fetch(`${API_URL}/api/groups/${groupId}/admin?token=${adminToken}`).then(r => r.ok ? r.json() : Promise.reject(new Error("Invalid admin link"))).then(setData).catch(x => setError(x.message));
    useEffect(() => { load(); }, [groupId]);
    async function draw() { const r = await fetch(`${API_URL}/api/groups/draw`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ groupId, adminToken }) }); const value = await r.json(); if (!r.ok) setError(value.error); else load(); }
    if (error) return <SimpleShell><div className="link-card"><span className="form-error">{error}</span></div></SimpleShell>;
    if (!data) return <SimpleShell><div className="loading">Loading your dashboard...</div></SimpleShell>;
    return <SimpleShell><div className="admin-card"><div className="admin-top"><div><span className="section-kicker">Organizer dashboard</span><h2>{data.name}</h2></div><span className={`status ${data.status.toLowerCase()}`}>{data.status}</span></div><div className="admin-meta">{data.budget && <span>Budget | {data.budget}</span>}{data.eventDate && <span><CalendarDays size={14} /> {new Date(data.eventDate).toLocaleDateString()}</span>}</div><h3>Participants <small>{data.participants.length}</small></h3><div className="participants">{data.participants.map((p: any) => <div className="participant" key={p.id}><span>{p.name.slice(0, 1).toUpperCase()}</span><strong>{p.name}</strong>{p.wishes && <Check size={16} />}</div>)}</div>{data.status === "OPEN" && <button className="primary-button submit-button" disabled={data.participants.length < 3} onClick={draw}>Run the draw <Sparkles size={16} /></button>}<p className="admin-hint">{data.participants.length < 3 ? "You need at least 3 participants to draw." : data.status === "OPEN" ? "Everyone is ready? The draw cannot be undone." : "The draw is complete. You can now share the result."}</p></div></SimpleShell>;
  }

  function SimpleShell({ children }: { children: React.ReactNode }) { return <main><header className="nav shell"><a className="brand" href="/"><span className="brand-mark"><Gift size={18} /></span> LPWichtel</a></header><section className="simple-shell shell">{children}</section></main>; }

  const inviteUrl = created ? `${window.location.origin}/join/${created.inviteCode}` : "";
  return (
    <main>
      <header className="nav shell">
        <a className="brand" href="/"><span className="brand-mark"><Gift size={18} /></span> LPWichtel</a>
        <nav className={menuOpen ? "nav-links mobile-open" : "nav-links"}>
          <a href="#how">{copy.how}</a><a href="#why">{copy.why}</a>
          <a className="text-button" href="/login">{copy.login} <ArrowRight size={15} /></a>
          <label className="language-picker" title="Change language"><Languages size={15} /><select value={language} onChange={(event) => changeLanguage(event.target.value as Language)} aria-label="Change language"><option value="en">EN</option><option value="de">DE</option><option value="it">IT</option></select></label>
        </nav>
        <button className="menu-button" aria-label="Toggle navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
      </header>

      <section className="hero shell">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> {copy.eyebrow}</div>
          <h1>{copy.heroTitle}<br /><em>{copy.heroTitleAccent}</em></h1>
          <p>{copy.heroText}</p>
          <button className="primary-button hero-button" onClick={() => setShowCreate(true)}>{copy.create} <ArrowRight size={17} /></button>
          <div className="trust"><div className="avatar-stack"><span>J</span><span>M</span><span>R</span><span>+</span></div><span>{copy.ready}<br /><strong>{copy.loved}</strong></span></div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="halo" /><div className="line line-one" /><div className="line line-two" />
          <motion.div className="gift-illustration" initial={{ y: 8 }} animate={{ y: [8, -8, 8] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
            <div className="bow"><i /><i /></div><div className="lid" /><div className="box"><div className="ribbon" /><div className="shine" /></div>
          </motion.div>
          <div className="art-note note-top"><Sparkles size={14} /> {copy.noteTop}</div>
          <div className="art-note note-bottom"><Gift size={14} /> {copy.noteBottom}</div>
        </div>
      </section>

      <section className="promise shell" id="why">
        <span className="section-kicker">{copy.promiseKicker}</span>
        <h2>{copy.promiseTitle}<br /><em>{copy.promiseAccent}</em></h2>
        <div className="promise-grid">
          {copy.features.map(([title, text], index) => <Feature key={title} icon={[<Link2 />, <ShieldCheck />, <Sparkles />][index]} title={title} text={text} />)}
        </div>
      </section>

      <section className="steps shell" id="how">
        <div><span className="section-kicker">{copy.stepsKicker}</span><h2>{copy.stepsTitle}<br /><em>{copy.stepsAccent}</em></h2></div>
        <div className="step-list">{copy.steps.map(([title, text], index) => <Step key={title} number={`0${index + 1}`} title={title} text={text} />)}</div>
      </section>

      <footer className="footer shell"><a className="brand" href="/"><span className="brand-mark"><Gift size={16} /></span> LPWichtel</a><span>{copy.footer}</span></footer>

      {showCreate && <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setShowCreate(false)}>
        <div className="modal">{created ?         <Success inviteUrl={inviteUrl} adminUrl={`${window.location.origin}/group/${created.groupId}/admin?token=${created.adminToken}`} participantToken={created.participantToken} onClose={() => { setCreated(null); setShowCreate(false); }} /> : <form onSubmit={createGroup}>
          <button type="button" className="modal-close" onClick={() => setShowCreate(false)}><X size={18} /></button>
          <span className="section-kicker">LPWichtel</span><h2>{copy.createHeading}</h2><p className="modal-intro">{copy.createIntro}</p>
          <label>{copy.groupName}<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Family 2026" /></label>
          <label>{copy.creatorName}<input required value={form.creator} onChange={(e) => setForm({ ...form, creator: e.target.value })} placeholder="Your first name" /></label>
          <div className="form-row"><label>{copy.budget} <input value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="30 EUR" /></label><label>{copy.eventDate} <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label></div>
          {error && <p className="form-error">{error}</p>}<button className="primary-button submit-button" disabled={saving}>{saving ? copy.createSuccess : copy.create} <ArrowRight size={17} /></button>
        </form>}</div>
      </div>}
    </main>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) { return <article className="feature"><div className="feature-icon">{icon}</div><h3>{title}</h3><p>{text}</p></article>; }
function Step({ number, title, text }: { number: string; title: string; text: string }) { return <article className="step"><span>{number}</span><div><h3>{title}</h3><p>{text}</p></div><ChevronDown className="step-arrow" size={18} /></article>; }
function Success({ inviteUrl, adminUrl, participantToken, onClose }: { inviteUrl: string; adminUrl: string; participantToken: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => { await navigator.clipboard.writeText(inviteUrl); setCopied(true); setTimeout(() => setCopied(false), 1800); };
  return <div className="success"><div className="success-icon"><Check /></div><span className="section-kicker">Your group is ready</span><h2>Time to invite everyone.</h2><p>Share this link with everyone who is joining your LPWichtel group.</p><div className="copy-box"><span>{inviteUrl}</span><button onClick={copy}>{copied ? <Check size={16} /> : <Link2 size={16} />} {copied ? "Copied" : "Copy"}</button></div><div className="success-links"><a className="personal-link" href={`/my-santa/${participantToken}`}>Open my personal page <ArrowRight size={15} /></a><a className="personal-link" href={adminUrl}>Open organizer dashboard <ArrowRight size={15} /></a></div><button className="close-success" onClick={onClose}>Done</button></div>;
}

export default App;