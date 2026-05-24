import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  submitSupportRequest,
  getMySupportTickets,
  getSupportContact,
  sendChatMessage,
} from "../api";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  HelpCircle, Send, CheckCircle2, FileSpreadsheet, Ticket,
  RefreshCw, Phone, Mail, MessageCircle, Bot, User as UserIcon,
  Sparkles, Clock, ChevronRight, Copy, ExternalLink, X,
  AlertCircle, Zap,
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

// ─── Confetti burst (CSS-only, no library needed) ────────────────────────────
const ConfettiPiece = ({ style }) => (
  <div className="absolute w-2 h-2 rounded-sm animate-bounce" style={style} />
);

const Confetti = ({ active }) => {
  if (!active) return null;
  const colors = ["#782B90", "#FFF200", "#E6D800", "#A855F7", "#06B6D4", "#10B981"];
  const pieces = Array.from({ length: 24 }, (_, i) => ({
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 60}%`,
    backgroundColor: colors[i % colors.length],
    animationDelay: `${Math.random() * 0.5}s`,
    animationDuration: `${0.6 + Math.random() * 0.8}s`,
    transform: `rotate(${Math.random() * 360}deg)`,
  }));
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl z-10">
      {pieces.map((s, i) => <ConfettiPiece key={i} style={s} />)}
    </div>
  );
};

// ─── Dynamic wait time ────────────────────────────────────────────────────────
function getWaitTime() {
  const hour = new Date().getHours();
  if (hour >= 9 && hour < 13) return "~2 hours";
  if (hour >= 13 && hour < 18) return "~4 hours";
  if (hour >= 18 && hour < 21) return "~6 hours";
  return "~12 hours (next business day)";
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
const TypingIndicator = () => (
  <div className="flex items-end gap-2 mb-3">
    <div className="w-7 h-7 rounded-full bg-savomart-purple flex items-center justify-center shrink-0">
      <span className="text-white text-[10px] font-black">S</span>
    </div>
    <div className="bg-savomart-purple-light/70 border border-savomart-purple/15 rounded-2xl rounded-bl-sm px-4 py-3">
      <div className="flex gap-1 items-center h-4">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 bg-savomart-purple/60 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  </div>
);

// ─── Chat Bubble ──────────────────────────────────────────────────────────────
const ChatBubble = ({ msg }) => {
  const isBot = msg.role === "bot";

  if (msg.type === "ticket-success") {
    return (
      <div className="flex items-end gap-2 mb-3">
        <div className="w-7 h-7 rounded-full bg-savomart-purple flex items-center justify-center shrink-0">
          <span className="text-white text-[10px] font-black">S</span>
        </div>
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl rounded-bl-sm p-4 max-w-[80%]">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span className="font-black text-emerald-700 text-sm">Ticket Created!</span>
          </div>
          <p className="text-xs text-emerald-800 font-bold mb-1">🎫 ID: {msg.ticketId}</p>
          <p className="text-[11px] text-emerald-600">We'll contact you within 24 hours.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-end gap-2 mb-3 ${isBot ? "" : "flex-row-reverse"}`}>
      {isBot ? (
        <div className="w-7 h-7 rounded-full bg-savomart-purple flex items-center justify-center shrink-0">
          <span className="text-white text-[10px] font-black">S</span>
        </div>
      ) : (
        <div className="w-7 h-7 rounded-full bg-slate-300 flex items-center justify-center shrink-0">
          <UserIcon className="w-4 h-4 text-slate-600" />
        </div>
      )}
      <div
        className={`max-w-[78%] px-4 py-3 text-xs leading-relaxed ${
          isBot
            ? "bg-savomart-purple-light/70 border border-savomart-purple/15 text-slate-700 rounded-2xl rounded-bl-sm"
            : "bg-savomart-purple text-white rounded-2xl rounded-br-sm"
        }`}
        style={{ whiteSpace: "pre-wrap" }}
        dangerouslySetInnerHTML={{
          __html: msg.text
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/`(.*?)`/g, "<code class='bg-black/10 px-1 rounded font-mono'>$1</code>"),
        }}
      />
    </div>
  );
};

// ─── FAQ Data ─────────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    q: "How do I redeem points?",
    a: "You can redeem your loyalty points by visiting any Savomart store and asking the cashier to apply your points at checkout. Each 10 points = ₹1 off your bill. Minimum 100 points needed to redeem.",
  },
  {
    q: "Why was my coupon rejected?",
    a: "Coupons may be rejected if: (1) they've expired, (2) your cart total is below the minimum purchase, (3) the coupon is for a specific store not applicable at your location, or (4) the coupon was already used.",
  },
  {
    q: "How to find nearest store?",
    a: 'Open the Stores tab in the app and tap "Find Nearest". Allow location access and we\'ll instantly show you the 3 closest Savomart outlets with distance and hours.',
  },
];

// ─── Main Page ────────────────────────────────────────────────────────────────
export const Support = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("contact");

  // ── Contact Tab state ──────────────────────────────────────────────────────
  const [contact, setContact] = useState(null);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone_number || "");
  const [email, setEmail] = useState(user?.email || "");
  const [category, setCategory] = useState("Points Issue");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successTicket, setSuccessTicket] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [isTicketsLoading, setIsTicketsLoading] = useState(false);

  // ── Chat Tab state ─────────────────────────────────────────────────────────
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [sessionId] = useState(() => `savo-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const [chatStarted, setChatStarted] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [chatComplete, setChatComplete] = useState(false);
  const messagesEndRef = useRef(null);

  const CATEGORIES = ["Points Issue", "Coupon Issue", "Store Issue", "App Issue", "Other"];

  // Pre-fill form when user loads
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone_number || "");
      setEmail(user.email || "");
    }
  }, [user]);

  // Fetch contact info
  useEffect(() => {
    getSupportContact()
      .then(setContact)
      .catch(() => setContact({
        phone: "1800-123-4567",
        phone_hours: "Mon–Sat, 9:00 AM – 7:00 PM IST",
        email: "support@savomart.in",
        email_response: "We respond within 24 hours",
        whatsapp: "9876543210",
      }));
  }, []);

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    setIsTicketsLoading(true);
    try {
      const data = await getMySupportTickets();
      setTickets(Array.isArray(data) ? data : (data?.tickets || []));
    } catch {
      /* silently fail */
    } finally {
      setIsTicketsLoading(false);
    }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isBotTyping]);

  // ── Form submit ───────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(phone)) {
      toast.error("Please enter a valid 10-digit phone number.");
      return;
    }
    if (description.trim().length < 10) {
      toast.error("Please describe your issue in at least 10 characters.");
      return;
    }
    setIsSubmitting(true);
    try {
      const data = await submitSupportRequest({ name, phone, email: email || null, issue_category: category, description });
      const ticketId = `SAV-${new Date().getFullYear()}-${String(data.id).padStart(3, "0")}`;
      setSuccessTicket(ticketId);
      setShowConfetti(true);
      setDescription("");
      setTimeout(() => setShowConfetti(false), 2500);
      fetchTickets();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Chat helpers ──────────────────────────────────────────────────────────
  const addMessage = (role, text, extra = {}) => {
    setMessages((prev) => [...prev, { role, text, id: Date.now() + Math.random(), ...extra }]);
  };

  const sendToBot = useCallback(async (text) => {
    if (!text.trim()) return;
    addMessage("user", text);
    setChatInput("");
    setIsBotTyping(true);

    // Simulate 1s typing delay
    await new Promise((r) => setTimeout(r, 900 + Math.random() * 400));

    try {
      const res = await sendChatMessage(text, sessionId, []);
      setIsBotTyping(false);

      if (res.is_complete && res.ticket_id) {
        addMessage("bot", res.reply);
        addMessage("bot", "", { type: "ticket-success", ticketId: res.ticket_id });
        setChatComplete(true);
        fetchTickets(); // refresh ticket list
      } else {
        addMessage("bot", res.reply, { quickReplies: res.quick_replies || [] });
      }
    } catch {
      setIsBotTyping(false);
      addMessage("bot", "Oops! Something went wrong. Please try again in a moment.");
    }
  }, [sessionId, fetchTickets]);

  // Start chat when tab opens
  useEffect(() => {
    if (activeTab === "chat" && !chatStarted) {
      setChatStarted(true);
      // Send a dummy "start" message to initialize the session
      (async () => {
        setIsBotTyping(true);
        await new Promise((r) => setTimeout(r, 800));
        try {
          const res = await sendChatMessage("__init__", sessionId, []);
          setIsBotTyping(false);
          addMessage("bot", res.reply, { quickReplies: res.quick_replies || [] });
        } catch {
          setIsBotTyping(false);
          addMessage("bot", "Hi! 👋 I'm Savo, your support assistant. How can I help you today?");
        }
      })();
    }
  }, [activeTab, chatStarted, sessionId]);

  const handleChatSend = (e) => {
    e?.preventDefault();
    if (chatInput.trim()) sendToBot(chatInput.trim());
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 pb-24 md:py-8 space-y-5 animate-fade-in">

      {/* ── Page Header ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-savomart-purple/10 pb-5">
        <div>
          <h1 className="font-extrabold text-2xl text-slate-800 tracking-tight flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-savomart-purple" />
            Support Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Get help with points, coupons, stores, or anything else.
          </p>
        </div>
        {/* Wait time badge */}
        <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-[11px] font-semibold text-amber-700">
          <Clock className="w-3.5 h-3.5" />
          Current wait: <span className="font-black">{getWaitTime()}</span>
        </div>
      </div>

      {/* ── Open Ticket Banner ─────────────────────────────────────── */}
      {tickets.filter(t => t.status === "Open").length > 0 && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-blue-500 shrink-0" />
          <p className="text-xs font-semibold text-blue-700 flex-1">
            You have <span className="font-black">{tickets.filter(t => t.status === "Open").length}</span> open ticket{tickets.filter(t => t.status === "Open").length > 1 ? "s" : ""}.
            {tickets[0] && (
              <span className="ml-1 text-blue-500">
                Latest: <span className="font-mono">SAV-{new Date().getFullYear()}-{String(tickets[0].id).padStart(3, "0")}</span> — {tickets[0].status}
              </span>
            )}
          </p>
        </div>
      )}

      {/* ── Tabs ───────────────────────────────────────────────────── */}
      <div className="flex bg-slate-100 rounded-2xl p-1 gap-1">
        {[
          { id: "contact", label: "Contact Us", icon: Phone },
          { id: "chat", label: "AI Assistant", icon: Bot },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 text-sm font-bold py-2.5 rounded-xl transition-all duration-200 ${
              activeTab === id
                ? "bg-white text-savomart-purple shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {id === "chat" && (
              <span className="bg-savomart-purple text-savomart-yellow text-[9px] font-black px-1.5 py-0.5 rounded-full">NEW</span>
            )}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════ */}
      {/* TAB 1 — CONTACT US                                          */}
      {/* ════════════════════════════════════════════════════════════ */}
      {activeTab === "contact" && (
        <div className="space-y-6">

          {/* Contact Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Phone Card */}
            <div className="bg-white border border-savomart-purple/10 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-savomart-purple-light flex items-center justify-center">
                  <Phone className="w-5 h-5 text-savomart-purple" />
                </div>
                <span className="font-black text-slate-700 text-sm">Call Us</span>
              </div>
              <p className="text-xl font-black text-savomart-yellow bg-savomart-purple rounded-xl px-3 py-2 inline-block mb-2 tracking-wide">
                {contact?.phone || "1800-123-4567"}
              </p>
              <p className="text-[11px] text-slate-400 mb-4">{contact?.phone_hours}</p>
              <a
                href={`tel:${contact?.phone?.replace(/-/g, "")}`}
                className="flex items-center justify-center gap-2 bg-savomart-purple hover:bg-savomart-purple-dark text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors w-full"
              >
                <Phone className="w-3.5 h-3.5" /> Call Now
              </a>
            </div>

            {/* Email Card */}
            <div className="bg-white border border-savomart-purple/10 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-500" />
                </div>
                <span className="font-black text-slate-700 text-sm">Email Us</span>
              </div>
              <p className="text-sm font-black text-savomart-purple mb-1">{contact?.email || "support@savomart.in"}</p>
              <p className="text-[11px] text-slate-400 mb-4">{contact?.email_response || "Responds within 24 hours"}</p>
              <a
                href={`mailto:${contact?.email}`}
                className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors w-full"
              >
                <Mail className="w-3.5 h-3.5" /> Send Email
              </a>
            </div>

            {/* WhatsApp Card — full width */}
            <div className="sm:col-span-2 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-black text-slate-700 text-sm">Chat on WhatsApp</p>
                    <p className="text-[11px] text-slate-400">Quick replies, typically within 1 hour</p>
                  </div>
                </div>
                <a
                  href={`https://wa.me/91${contact?.whatsapp || "9876543210"}?text=Hi%20Savomart%20Support%2C%20I%20need%20help%20with`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors"
                >
                  <MessageCircle className="w-4 h-4" /> Open WhatsApp
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              </div>
            </div>
          </div>

          {/* ── Submit a Request Form ──────────────────────────────── */}
          <div className="bg-white border border-savomart-purple/10 rounded-3xl p-6 shadow-sm relative overflow-hidden">
            <Confetti active={showConfetti} />
            <h3 className="font-extrabold text-slate-800 text-base mb-5 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-savomart-purple" />
              Submit a Request
            </h3>

            {/* Success card */}
            {successTicket && (
              <div className="mb-5 bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-black text-emerald-700 text-sm">Ticket raised successfully! 🎉</p>
                  <p className="text-xs text-emerald-600 mt-0.5">
                    Your ticket ID is <span className="font-mono font-black">{successTicket}</span>.
                    Expected response within 24 hours.
                  </p>
                  <button onClick={() => setSuccessTicket(null)} className="mt-2 text-[11px] text-emerald-500 hover:underline font-bold">Dismiss</button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-savomart-purple uppercase tracking-wider block">Full Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-savomart-purple focus:ring-1 focus:ring-savomart-purple/20"
                  required />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-savomart-purple uppercase tracking-wider block">Phone</label>
                <input type="tel" maxLength="10" value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-savomart-purple focus:ring-1 focus:ring-savomart-purple/20"
                  required />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-savomart-purple uppercase tracking-wider block">Email (Optional)</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-savomart-purple focus:ring-1 focus:ring-savomart-purple/20" />
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-savomart-purple uppercase tracking-wider block">Issue Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-savomart-purple focus:ring-1 focus:ring-savomart-purple/20 cursor-pointer text-slate-700">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Description */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] font-extrabold text-savomart-purple uppercase tracking-wider block">
                  Description <span className="text-slate-400 normal-case font-medium">(min 10 chars)</span>
                </label>
                <textarea rows="4" value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your issue clearly…"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-savomart-purple focus:ring-1 focus:ring-savomart-purple/20 resize-none leading-relaxed"
                  required />
                <p className="text-[10px] text-slate-400 text-right">{description.length} chars</p>
              </div>

              {/* Submit */}
              <div className="sm:col-span-2">
                <button type="submit" disabled={isSubmitting}
                  className="w-full bg-savomart-yellow hover:bg-savomart-yellow-dark text-savomart-purple font-black text-sm py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all duration-150 disabled:opacity-60">
                  <Send className="w-4 h-4" />
                  {isSubmitting ? "Submitting…" : "Submit Request"}
                </button>
              </div>
            </form>
          </div>

          {/* ── My Tickets ────────────────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-savomart-purple" />
                My Tickets ({tickets.length})
              </h3>
              <button onClick={fetchTickets} disabled={isTicketsLoading}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-savomart-purple bg-white transition-all">
                <RefreshCw className={`w-3.5 h-3.5 ${isTicketsLoading ? "animate-spin" : ""}`} />
              </button>
            </div>

            {isTicketsLoading && tickets.length === 0 ? (
              <div className="py-8 flex justify-center"><LoadingSpinner /></div>
            ) : tickets.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border border-savomart-purple/10">
                <CheckCircle2 className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-400">No tickets yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.map((t) => (
                  <div key={t.id} className="bg-white rounded-2xl border border-savomart-purple/10 p-4 shadow-sm space-y-3">
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400">
                          SAV-{new Date().getFullYear()}-{String(t.id).padStart(3, "0")}
                        </span>
                        <h4 className="font-bold text-slate-800 text-sm mt-0.5">{t.issue_category}</h4>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        {t.saved_to_excel && (
                          <span className="flex items-center gap-1 text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100 font-extrabold uppercase">
                            <FileSpreadsheet className="w-2.5 h-2.5" /> Excel
                          </span>
                        )}
                        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          t.status === "Open" ? "bg-blue-100 text-blue-700 border border-blue-200" :
                          t.status === "InProgress" ? "bg-amber-100 text-amber-700 border border-amber-200" :
                          "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        }`}>{t.status}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl leading-relaxed">{t.description}</p>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>{t.name} · {t.phone}</span>
                      <span>{format(new Date(t.created_at), "dd MMM yyyy, hh:mm a")}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* TAB 2 — AI ASSISTANT                                        */}
      {/* ════════════════════════════════════════════════════════════ */}
      {activeTab === "chat" && (
        <div className="space-y-4">

          {/* ── FAQ Quick Answers ──────────────────────────────────── */}
          {!chatStarted || messages.length < 2 ? (
            <div className="bg-white border border-savomart-purple/10 rounded-3xl p-5 shadow-sm">
              <h4 className="font-black text-slate-700 text-sm flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-savomart-yellow" />
                Quick Answers
              </h4>
              <div className="space-y-2">
                {FAQ_ITEMS.map((faq, i) => (
                  <div key={i} className="border border-savomart-purple/10 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                      className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-slate-700 hover:bg-savomart-purple-light/30 transition-colors text-left"
                    >
                      <span>{faq.q}</span>
                      <ChevronRight className={`w-3.5 h-3.5 text-savomart-purple transition-transform ${expandedFaq === i ? "rotate-90" : ""}`} />
                    </button>
                    {expandedFaq === i && (
                      <div className="px-4 pb-3 text-[11px] text-slate-500 leading-relaxed border-t border-savomart-purple/10 bg-savomart-purple-light/20">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* ── Chat Window ────────────────────────────────────────── */}
          <div className="bg-white border border-savomart-purple/10 rounded-3xl shadow-sm overflow-hidden flex flex-col" style={{ height: "520px" }}>
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-savomart-purple to-savomart-purple-dark px-5 py-4 flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 rounded-full bg-savomart-yellow flex items-center justify-center shadow-md">
                <span className="text-savomart-purple font-black text-sm">S</span>
              </div>
              <div>
                <p className="font-black text-white text-sm leading-tight">Savo — AI Support Assistant</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-[10px] text-white/70">Online · Typically replies in seconds</span>
                </div>
              </div>
              <div className="ml-auto">
                <Sparkles className="w-5 h-5 text-savomart-yellow/70" />
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
              {messages.length === 0 && !isBotTyping && (
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 gap-2">
                  <Bot className="w-10 h-10 text-savomart-purple-light" />
                  <p className="text-xs">Starting conversation…</p>
                </div>
              )}

              {messages.map((msg) => (
                <ChatBubble key={msg.id} msg={msg} />
              ))}

              {isBotTyping && <TypingIndicator />}

              {/* Quick reply chips from last bot message */}
              {!isBotTyping && messages.length > 0 && (() => {
                const lastBot = [...messages].reverse().find(m => m.role === "bot" && m.quickReplies?.length > 0);
                if (!lastBot) return null;
                return (
                  <div className="flex flex-wrap gap-2 mt-2 pl-9">
                    {lastBot.quickReplies.map((qr, i) => (
                      <button key={i} onClick={() => sendToBot(qr)}
                        className="text-[11px] font-bold text-savomart-purple bg-savomart-purple-light/60 border border-savomart-purple/20 hover:bg-savomart-purple hover:text-white px-3 py-1.5 rounded-full transition-all">
                        {qr}
                      </button>
                    ))}
                  </div>
                );
              })()}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-savomart-purple/10 px-4 py-3 shrink-0">
              <form onSubmit={handleChatSend} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={chatComplete ? "Chat ended. Start over?" : "Type your message…"}
                  disabled={isBotTyping}
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-savomart-purple focus:ring-1 focus:ring-savomart-purple/20 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isBotTyping || !chatInput.trim()}
                  className="bg-savomart-purple hover:bg-savomart-purple-dark disabled:opacity-40 text-white w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <p className="text-[10px] text-slate-400 text-center mt-2">
                Savo is an AI assistant. For urgent issues, call <span className="font-bold">1800-123-4567</span>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Support;
