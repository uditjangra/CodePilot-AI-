import { useState, useRef } from "react";

/* ─── Icons ─── */
const BugIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 2l1.88 1.88M14.12 3.88L16 2M9 7.13v-1a3.003 3.003 0 116 0v1" />
    <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 014-4h4a4 4 0 014 4v3c0 3.3-2.7 6-6 6z" />
    <path d="M12 20v-9M6.53 9C4.6 8.8 3 7.1 3 5M6 13H2M6 17l-4 1M17.47 9c1.93-.2 3.53-1.9 3.53-4M18 13h4M18 17l4 1" />
  </svg>
);

const SparklesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L13.09 8.26L18 6L14.74 10.91L21 12L14.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L9.26 13.09L3 12L9.26 10.91L6 6L10.91 8.26L12 2Z" />
  </svg>
);

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const Spinner = () => (
  <div className="animate-spin" style={{ width: 20, height: 20 }}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 2a10 10 0 010 20" strokeLinecap="round" />
    </svg>
  </div>
);

/* ─── Result Card ─── */
function ResultCard({ title, icon, children, delay, accentColor }) {
  return (
    <div
      className="animate-fade-in-up"
      style={{
        animationDelay: delay,
        background: "var(--color-bg-card)",
        borderRadius: 16,
        border: "1px solid var(--color-border)",
        overflow: "hidden",
        transition: "border-color 0.3s, box-shadow 0.3s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = accentColor || "var(--color-accent)";
        e.currentTarget.style.boxShadow = `0 0 30px ${accentColor || "var(--color-accent-glow)"}20`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--color-border)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div
        style={{
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-accent-subtle)",
        }}
      >
        <span style={{ color: accentColor || "var(--color-accent)", display: "flex" }}>
          {icon}
        </span>
        <h2
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "var(--color-text-primary)",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </h2>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}

/* ─── Code Block with Copy ─── */
function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const el = document.createElement("textarea");
      el.value = code;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={handleCopy}
        title="Copy code"
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          background: copied ? "rgba(34, 197, 94, 0.2)" : "rgba(139, 92, 246, 0.15)",
          border: `1px solid ${copied ? "rgba(34, 197, 94, 0.3)" : "rgba(139, 92, 246, 0.25)"}`,
          borderRadius: 8,
          padding: "6px 10px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 5,
          color: copied ? "var(--color-success)" : "var(--color-accent-hover)",
          fontSize: 12,
          fontWeight: 500,
          transition: "all 0.2s",
        }}
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
        {copied ? "Copied" : "Copy"}
      </button>
      <pre
        style={{
          background: "var(--color-bg-input)",
          borderRadius: 12,
          padding: "20px",
          paddingRight: 80,
          overflowX: "auto",
          border: "1px solid var(--color-border)",
          margin: 0,
        }}
      >
        <code
          style={{
            fontFamily: "var(--font-family-mono)",
            fontSize: 13,
            lineHeight: 1.7,
            color: "var(--color-text-primary)",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {code}
        </code>
      </pre>
    </div>
  );
}

/* ─── Main App ─── */
export default function App() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState("");
  const textareaRef = useRef(null);
  const resultsRef = useRef(null);

  const handleDebug = async () => {
    if (!code.trim()) {
      setError("Please paste some code before debugging.");
      return;
    }

    setError("");
    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch("/api/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Request failed (${res.status})`);
      }

      const data = await res.json();
      setResponse(data);

      // Scroll to results after a short delay for animation
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setCode("");
    setResponse(null);
    setError("");
    textareaRef.current?.focus();
  };

  const lineCount = code ? code.split("\n").length : 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "48px 20px 80px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* ── Header ── */}
      <header className="animate-fade-in-up" style={{ textAlign: "center", marginBottom: 40 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 12,
            color: "var(--color-accent)",
          }}
        >
          <BugIcon />
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--color-accent-hover)",
              background: "var(--color-accent-subtle)",
              padding: "4px 12px",
              borderRadius: 100,
              border: "1px solid rgba(139, 92, 246, 0.2)",
            }}
          >
            AI-Powered
          </span>
        </div>
        <h1
          style={{
            fontSize: "clamp(28px, 5vw, 42px)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            background: "linear-gradient(135deg, #e4e4ef 0%, #a78bfa 50%, #8b5cf6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            marginBottom: 10,
          }}
        >
          Debug Assistant
        </h1>
        <p
          style={{
            fontSize: 15,
            color: "var(--color-text-secondary)",
            maxWidth: 420,
            margin: "0 auto",
            lineHeight: 1.6,
          }}
        >
          Paste your code below and let AI analyze, explain, and fix it for you instantly.
        </p>
      </header>

      {/* ── Main Container ── */}
      <main style={{ width: "100%", maxWidth: 720, display: "flex", flexDirection: "column", gap: 20 }}>
        {/* ── Editor Section ── */}
        <div
          className="animate-fade-in-up delay-100"
          style={{
            background: "var(--color-bg-card)",
            borderRadius: 16,
            border: "1px solid var(--color-border)",
            overflow: "hidden",
            transition: "border-color 0.3s",
          }}
        >
          {/* Editor Header */}
          <div
            style={{
              padding: "12px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid var(--color-border)",
              background: "var(--color-accent-subtle)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", gap: 6 }}>
                <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#ef4444" }} />
                <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#eab308" }} />
                <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#22c55e" }} />
              </div>
              <span style={{ fontSize: 13, color: "var(--color-text-muted)", marginLeft: 8, fontWeight: 500 }}>
                code-editor
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {lineCount > 0 && (
                <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                  {lineCount} line{lineCount !== 1 ? "s" : ""}
                </span>
              )}
              {code && (
                <button
                  onClick={handleClear}
                  style={{
                    fontSize: 12,
                    color: "var(--color-text-muted)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "2px 8px",
                    borderRadius: 6,
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.target.style.color = "var(--color-error)")}
                  onMouseLeave={(e) => (e.target.style.color = "var(--color-text-muted)")}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              if (error) setError("");
            }}
            placeholder="// Paste your code here..."
            spellCheck={false}
            style={{
              width: "100%",
              minHeight: 260,
              padding: "20px",
              background: "var(--color-bg-input)",
              color: "var(--color-text-primary)",
              fontFamily: "var(--font-family-mono)",
              fontSize: 14,
              lineHeight: 1.7,
              border: "none",
              outline: "none",
              resize: "vertical",
              caretColor: "var(--color-accent)",
            }}
          />
        </div>

        {/* ── Error Message ── */}
        {error && (
          <div
            className="animate-fade-in"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 16px",
              background: "rgba(248, 113, 113, 0.08)",
              border: "1px solid rgba(248, 113, 113, 0.2)",
              borderRadius: 12,
              color: "var(--color-error)",
              fontSize: 14,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {error}
          </div>
        )}

        {/* ── Debug Button ── */}
        <button
          id="debug-button"
          onClick={handleDebug}
          disabled={loading}
          className="animate-fade-in-up delay-200"
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: 14,
            border: "none",
            fontFamily: "var(--font-family-sans)",
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            transition: "all 0.3s ease",
            background: loading
              ? "rgba(139, 92, 246, 0.3)"
              : "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
            color: loading ? "rgba(255,255,255,0.6)" : "#fff",
            boxShadow: loading ? "none" : "0 4px 24px var(--color-accent-glow)",
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 8px 32px var(--color-accent-glow)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            if (!loading) {
              e.currentTarget.style.boxShadow = "0 4px 24px var(--color-accent-glow)";
            }
          }}
        >
          {loading ? (
            <>
              <Spinner />
              Analyzing...
            </>
          ) : (
            <>
              <SparklesIcon />
              Debug Code
            </>
          )}
        </button>

        {/* ── Results ── */}
        {response && (
          <div ref={resultsRef} style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 8 }}>
            {/* Explanation */}
            <ResultCard
              title="Explanation"
              delay="0s"
              accentColor="#a78bfa"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              }
            >
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.75,
                  color: "var(--color-text-secondary)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {response.explanation}
              </p>
            </ResultCard>

            {/* Fix */}
            <ResultCard
              title="Suggested Fix"
              delay="0.1s"
              accentColor="#fbbf24"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
                </svg>
              }
            >
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.75,
                  color: "var(--color-text-secondary)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {response.fix}
              </p>
            </ResultCard>

            {/* Corrected Code */}
            <ResultCard
              title="Corrected Code"
              delay="0.2s"
              accentColor="#22c55e"
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
              }
            >
              <CodeBlock code={response.corrected_code} />
            </ResultCard>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer
        className="animate-fade-in delay-300"
        style={{
          marginTop: 60,
          fontSize: 12,
          color: "var(--color-text-muted)",
          textAlign: "center",
        }}
      >
        Powered by Gemini AI · Built with FastAPI & React
      </footer>
    </div>
  );
}
