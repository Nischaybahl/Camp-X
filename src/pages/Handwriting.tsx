import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Type, Palette, Trash2, Copy, FileImage, FileText,
  Minus, Plus, RotateCcw, Eye, EyeOff, Upload, Sparkles, PenTool, Layout
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/* ─── Font definitions ─────────────────────────────────────────────────── */
const FONTS = [
  { id: 'caveat',       label: 'Cursive',         family: "'Caveat', cursive",                desc: 'Flowing cursive' },
  { id: 'patrick-hand', label: 'Student Neat',    family: "'Patrick Hand', cursive",          desc: 'Clean & neat' },
  { id: 'indie-flower', label: 'Messy',           family: "'Indie Flower', cursive",          desc: 'Natural & loose' },
  { id: 'shadows',      label: 'Bold',            family: "'Shadows Into Light', cursive",    desc: 'Bold strokes' },
  { id: 'kalam',        label: 'Exam Style',      family: "'Kalam', cursive",                 desc: 'Exam handwriting' },
  { id: 'dancing',      label: 'Elegant Script',  family: "'Dancing Script', cursive",        desc: 'Elegant style' },
  { id: 'architects',   label: 'Fast Writing',    family: "'Architects Daughter', cursive",   desc: 'Quick tilted strokes' },
  { id: 'great-vibes',  label: 'Calligraphy',     family: "'Great Vibes', cursive",           desc: 'Decorative script' },
  { id: 'reenie',       label: 'Pencil',          family: "'Reenie Beanie', cursive",         desc: 'Light pencil feel', opacity: 0.7 },
  { id: 'permanent',    label: 'Marker',          family: "'Permanent Marker', cursive",      desc: 'Thick marker strokes' },
  { id: 'nothing',      label: 'Left-Handed',     family: "'Nothing You Could Do', cursive",  desc: 'Slight tilt variation' },
  { id: 'covered',      label: 'Compact',         family: "'Covered By Your Grace', cursive", desc: 'Tight compact writing' },
] as Array<{ id: string; label: string; family: string; desc: string; opacity?: number }>;

const INK_COLORS = [
  { id: 'blue',  label: 'Blue Ink',  value: '#1a3a8a' },
  { id: 'black', label: 'Black Ink', value: '#1a1a2e' },
  { id: 'red',   label: 'Red Ink',   value: '#8b1a1a' },
  { id: 'green', label: 'Green Ink', value: '#1a6b3a' },
  { id: 'purple', label: 'Purple Ink', value: '#4a1a6b' },
];

const PAGE_SIZES: Record<string, { w: number; h: number; label: string }> = {
  A4:     { w: 794, h: 1123, label: 'A4' },
  Letter: { w: 816, h: 1056, label: 'US Letter' },
  Legal:  { w: 816, h: 1344, label: 'Legal' },
  A5:     { w: 559, h: 794,  label: 'A5' },
};

/* ─── Page type definitions ────────────────────────────────────────────── */
const PAGE_TYPES = [
  { id: 'ruled',   label: 'Ruled Notebook', emoji: '📓', bg: 'linear-gradient(180deg, #fefcf3 0%, #faf6e9 100%)' },
  { id: 'plain',   label: 'Plain White',    emoji: '📄', bg: '#ffffff' },
  { id: 'graph',   label: 'Graph Paper',    emoji: '📐', bg: '#f8f9fa' },
  { id: 'dotted',  label: 'Dotted Paper',   emoji: '⚬',  bg: '#fefefe' },
  { id: 'exam',    label: 'Exam Sheet',     emoji: '📝', bg: 'linear-gradient(180deg, #f5f5f0 0%, #eae8df 100%)' },
  { id: 'legal',   label: 'Yellow Legal',   emoji: '📒', bg: 'linear-gradient(180deg, #fff9c4 0%, #fff59d 100%)' },
  { id: 'vintage', label: 'Vintage Paper',  emoji: '📜', bg: 'linear-gradient(180deg, #f5e6d0 0%, #e8d5b7 100%)' },
  { id: 'spiral',  label: 'Spiral Notebook', emoji: '🗒️', bg: 'linear-gradient(180deg, #fefcf3 0%, #faf6e9 100%)' },
];

/* ─── Main component ───────────────────────────────────────────────────── */
export default function Handwriting() {
  /* State */
  const [text, setText] = useState('');
  const [font, setFont] = useState(FONTS[0]);
  const [fontSize, setFontSize] = useState(22);
  const [inkColor, setInkColor] = useState(INK_COLORS[0]);
  const [pageSize, setPageSize] = useState('A4');
  const [lineSpacing, setLineSpacing] = useState(2.2);
  const [wordSpacing, setWordSpacing] = useState(4);
  const [letterSpacing, setLetterSpacing] = useState(0.5);
  const [verticalOffset, setVerticalOffset] = useState(0);
  const [showLines, setShowLines] = useState(true);
  const [showMargin, setShowMargin] = useState(true);
  const [paperBg, setPaperBg] = useState<string | null>(null);
  const [shadowEffect, setShadowEffect] = useState(true);
  const [rotateEffect, setRotateEffect] = useState(false);
  const [highRes, setHighRes] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animatedText, setAnimatedText] = useState('');
  const [activeSection, setActiveSection] = useState<string>('fonts');
  const [downloading, setDownloading] = useState(false);
  const [pageType, setPageType] = useState(PAGE_TYPES[0]);

  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Animated typing */
  useEffect(() => {
    if (!isAnimating || !text) return;
    setAnimatedText('');
    let idx = 0;
    const iv = setInterval(() => {
      setAnimatedText(text.slice(0, idx + 1));
      idx++;
      if (idx >= text.length) { clearInterval(iv); setIsAnimating(false); }
    }, 35);
    return () => clearInterval(iv);
  }, [isAnimating, text]);

  const displayText = isAnimating ? animatedText : text;

  /* Paper line gap calculation */
  const lineGap = fontSize * lineSpacing;

  /* Export helpers */
  const captureCanvas = useCallback(async () => {
    if (!previewRef.current) return null;
    return html2canvas(previewRef.current, {
      scale: highRes ? 3 : 2,
      useCORS: true,
      backgroundColor: null,
      logging: false,
    });
  }, [highRes]);

  const downloadImage = useCallback(async (format: 'png' | 'jpeg') => {
    setDownloading(true);
    try {
      const canvas = await captureCanvas();
      if (!canvas) return;
      const link = document.createElement('a');
      link.download = `handwriting.${format}`;
      link.href = canvas.toDataURL(`image/${format}`, 0.95);
      link.click();
    } finally { setDownloading(false); }
  }, [captureCanvas]);

  const downloadPDF = useCallback(async () => {
    setDownloading(true);
    try {
      const canvas = await captureCanvas();
      if (!canvas) return;
      const ps = PAGE_SIZES[pageSize];
      const pdf = new jsPDF({ unit: 'px', format: [ps.w, ps.h], hotfixes: ['px_scaling'] });
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, ps.w, ps.h);
      pdf.save('handwriting.pdf');
    } finally { setDownloading(false); }
  }, [captureCanvas, pageSize]);

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPaperBg(reader.result as string);
    reader.readAsDataURL(file);
  };

  const copyText = () => { navigator.clipboard.writeText(text); };

  /* Page metrics */
  const ps = PAGE_SIZES[pageSize];
  const marginLeft = showMargin ? 80 : 30;
  const topPad = 50 + verticalOffset;

  /* Generate paper lines */
  const lineCount = Math.floor((ps.h - topPad - 30) / lineGap);
  const lines = Array.from({ length: lineCount }, (_, i) => topPad + i * lineGap);

  /* ─── STYLES ─────────────────────────────────────────────────────────── */
  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    padding: '6rem 1.5rem 3rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    maxWidth: '1600px',
    margin: '0 auto',
    width: '100%',
  };

  const splitStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 380px',
    gap: '1.5rem',
    flex: 1,
    minHeight: 0,
  };

  const panelStyle: React.CSSProperties = {
    background: 'linear-gradient(145deg, rgba(18,18,28,0.95), rgba(12,12,22,0.98))',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '20px',
    padding: '0',
    backdropFilter: 'blur(20px)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  };

  const glassCard: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '14px',
    padding: '1rem',
    transition: 'all 0.3s ease',
  };

  const sliderStyle: React.CSSProperties = {
    width: '100%',
    height: '6px',
    background: 'rgba(255,255,255,0.08)',
    borderRadius: '3px',
    outline: 'none',
    WebkitAppearance: 'none',
    cursor: 'pointer',
  };

  const sectionBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '0.6rem 1rem',
    borderRadius: '10px',
    border: 'none',
    background: active ? 'rgba(204,255,0,0.12)' : 'transparent',
    color: active ? '#ccff00' : 'rgba(255,255,255,0.5)',
    cursor: 'pointer',
    fontSize: '0.78rem',
    fontWeight: 600,
    transition: 'all 0.25s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    whiteSpace: 'nowrap',
  });

  /* ─── RENDER ─────────────────────────────────────────────────────────── */
  return (
    <main className="main-content" style={{ zIndex: 3, pointerEvents: 'auto', marginTop: 0, padding: 0, alignItems: 'stretch', justifyContent: 'flex-start' }}>
      <div style={containerStyle}>
        {/* Header */}
        <div className="fade-in-up" style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
            <div style={{
              width: 42, height: 42, borderRadius: '14px',
              background: 'linear-gradient(135deg, #ccff00, #88cc00)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(204,255,0,0.3)',
            }}>
              <PenTool size={22} color="#000" />
            </div>
            <h1 style={{
              fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-1px', color: 'var(--primary)',
              background: 'linear-gradient(135deg, #fff, rgba(255,255,255,0.7))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Text to Handwriting
            </h1>
          </div>
          <p style={{ color: 'var(--secondary)', fontSize: '0.95rem', maxWidth: 500, margin: '0 auto' }}>
            Convert your typed text into realistic handwritten notes instantly
          </p>
        </div>

        {/* Action bar */}
        <div className="fade-in-up delay-1" style={{
          display: 'flex', gap: '0.6rem', flexWrap: 'wrap', justifyContent: 'center',
        }}>
          {[
            { icon: <Sparkles size={15}/>, label: 'Animate', onClick: () => { if (text) setIsAnimating(true); }, accent: true },
            { icon: <Copy size={15}/>,     label: 'Copy',    onClick: copyText },
            { icon: <Trash2 size={15}/>,   label: 'Clear',   onClick: () => { setText(''); setAnimatedText(''); } },
          ].map(btn => (
            <button key={btn.label} onClick={btn.onClick} style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.55rem 1.1rem', borderRadius: '10px',
              border: btn.accent ? 'none' : '1px solid rgba(255,255,255,0.08)',
              background: btn.accent ? 'linear-gradient(135deg, #ccff00, #99cc00)' : 'rgba(255,255,255,0.04)',
              color: btn.accent ? '#000' : 'var(--secondary)',
              cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
              transition: 'all 0.25s ease',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                if (!btn.accent) e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                if (!btn.accent) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              }}
            >{btn.icon} {btn.label}</button>
          ))}

          <div style={{ width: 1, background: 'rgba(255,255,255,0.08)', margin: '0 0.3rem' }} />

          <button onClick={() => downloadImage('png')} disabled={downloading || !text} style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.55rem 1.1rem', borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.04)', color: '#4dabf7',
            cursor: (downloading || !text) ? 'not-allowed' : 'pointer',
            fontSize: '0.82rem', fontWeight: 600, opacity: (downloading || !text) ? 0.4 : 1,
            transition: 'all 0.25s ease',
          }}
            onMouseEnter={e => { if (text) e.currentTarget.style.background = 'rgba(77,171,247,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
          ><FileImage size={15}/> PNG</button>

          <button onClick={() => downloadImage('jpeg')} disabled={downloading || !text} style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.55rem 1.1rem', borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.04)', color: '#ffa94d',
            cursor: (downloading || !text) ? 'not-allowed' : 'pointer',
            fontSize: '0.82rem', fontWeight: 600, opacity: (downloading || !text) ? 0.4 : 1,
            transition: 'all 0.25s ease',
          }}
            onMouseEnter={e => { if (text) e.currentTarget.style.background = 'rgba(255,169,77,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
          ><FileImage size={15}/> JPG</button>

          <button onClick={downloadPDF} disabled={downloading || !text} style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.55rem 1.1rem', borderRadius: '10px',
            border: '1px solid rgba(204,255,0,0.2)',
            background: 'rgba(204,255,0,0.08)', color: '#ccff00',
            cursor: (downloading || !text) ? 'not-allowed' : 'pointer',
            fontSize: '0.82rem', fontWeight: 600, opacity: (downloading || !text) ? 0.4 : 1,
            transition: 'all 0.25s ease',
          }}
            onMouseEnter={e => { if (text) e.currentTarget.style.background = 'rgba(204,255,0,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(204,255,0,0.08)'; }}
          ><FileText size={15}/> PDF</button>
        </div>

        {/* Split layout */}
        <div className="fade-in-up delay-2" style={splitStyle} id="hw-split">
          {/* LEFT: Input + Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>
            {/* Text input */}
            <div style={{
              ...glassCard,
              display: 'flex', flexDirection: 'column', gap: '0.6rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                <Type size={14} color="#ccff00" />
                <span style={{ color: 'var(--secondary)', fontSize: '0.8rem', fontWeight: 600 }}>INPUT TEXT</span>
                <span style={{
                  marginLeft: 'auto', color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem',
                }}>{text.length} chars</span>
              </div>
              <textarea
                id="hw-input"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Start typing or paste your text here... ✍️"
                rows={5}
                style={{
                  width: '100%', padding: '1rem', borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.06)',
                  background: 'rgba(0,0,0,0.3)',
                  color: 'var(--primary)', outline: 'none', fontSize: '0.95rem',
                  resize: 'vertical', lineHeight: 1.7,
                  fontFamily: "'Inter', sans-serif",
                  transition: 'border-color 0.3s',
                  minHeight: '100px',
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'rgba(204,255,0,0.3)'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
              />
            </div>

            {/* Preview */}
            <div style={{
              ...glassCard,
              flex: 1,
              display: 'flex', flexDirection: 'column', gap: '0.6rem',
              overflow: 'hidden',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Eye size={14} color="#ccff00" />
                <span style={{ color: 'var(--secondary)', fontSize: '0.8rem', fontWeight: 600 }}>LIVE PREVIEW</span>
                <span style={{
                  marginLeft: 'auto', fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '6px'
                }}>{PAGE_SIZES[pageSize].label}</span>
              </div>

              <div style={{
                flex: 1,
                overflow: 'auto',
                display: 'flex',
                justifyContent: 'center',
                padding: '1rem',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '12px',
              }}>
                {/* Paper */}
                <div
                  ref={previewRef}
                  id="hw-paper"
                  style={{
                    width: ps.w,
                    minHeight: ps.h,
                    background: paperBg ? `url(${paperBg}) center/cover` : pageType.bg,
                    position: 'relative',
                    boxShadow: shadowEffect
                      ? '0 8px 40px rgba(0,0,0,0.4), 0 2px 10px rgba(0,0,0,0.2), inset 0 0 80px rgba(0,0,0,0.02)'
                      : '0 2px 10px rgba(0,0,0,0.15)',
                    transform: rotateEffect ? 'rotate(-0.4deg)' : 'none',
                    transition: 'transform 0.4s ease, box-shadow 0.4s ease',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  {/* Spiral holes */}
                  {pageType.id === 'spiral' && Array.from({ length: Math.floor(ps.h / 40) }, (_, i) => (
                    <div key={`hole-${i}`} style={{
                      position: 'absolute', left: 18, top: 30 + i * 40,
                      width: 14, height: 14, borderRadius: '50%',
                      background: 'rgba(0,0,0,0.12)', border: '1px solid rgba(0,0,0,0.08)',
                      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.15)',
                      zIndex: 3,
                    }} />
                  ))}

                  {/* Graph grid */}
                  {pageType.id === 'graph' && !paperBg && (
                    <div style={{ position: 'absolute', inset: 0, zIndex: 1,
                      backgroundImage: 'linear-gradient(rgba(100,140,200,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(100,140,200,0.15) 1px, transparent 1px)',
                      backgroundSize: '20px 20px',
                    }} />
                  )}

                  {/* Dotted grid */}
                  {pageType.id === 'dotted' && !paperBg && (
                    <div style={{ position: 'absolute', inset: 0, zIndex: 1,
                      backgroundImage: 'radial-gradient(circle, rgba(100,140,200,0.25) 1px, transparent 1px)',
                      backgroundSize: '20px 20px',
                    }} />
                  )}

                  {/* Vintage texture overlay */}
                  {pageType.id === 'vintage' && !paperBg && (
                    <div style={{ position: 'absolute', inset: 0, zIndex: 1, opacity: 0.06,
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
                    }} />
                  )}

                  {/* Paper margin line */}
                  {showMargin && (
                    <div style={{
                      position: 'absolute', top: 0, left: pageType.id === 'spiral' ? marginLeft + 6 : marginLeft - 8,
                      width: pageType.id === 'exam' ? 3 : 2, height: '100%',
                      background: pageType.id === 'exam' ? 'rgba(220, 80, 80, 0.5)' : 'rgba(220, 80, 80, 0.35)',
                    }} />
                  )}

                  {/* Horizontal lines (ruled, exam, legal, spiral) */}
                  {showLines && ['ruled','exam','legal','spiral'].includes(pageType.id) && lines.map((y, i) => (
                    <div key={i} style={{
                      position: 'absolute', left: 0, right: 0, top: y,
                      height: 1,
                      background: pageType.id === 'legal' ? 'rgba(180,160,100,0.25)' : 'rgba(100, 140, 200, 0.2)',
                    }} />
                  ))}

                  {/* Rendered text */}
                  <div style={{
                    position: 'relative',
                    paddingTop: topPad,
                    paddingLeft: marginLeft,
                    paddingRight: 30,
                    paddingBottom: 30,
                    fontFamily: font.family,
                    fontSize: `${fontSize}px`,
                    color: inkColor.value,
                    lineHeight: lineSpacing,
                    wordSpacing: `${wordSpacing}px`,
                    letterSpacing: `${letterSpacing}px`,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    textShadow: shadowEffect ? `0 0.5px 0.5px rgba(0,0,0,0.08)` : 'none',
                    opacity: font.opacity ?? 1,
                    zIndex: 2,
                  }}>
                    {displayText || (
                      <span style={{ color: 'rgba(0,0,0,0.15)', fontStyle: 'italic', fontSize: '18px', fontFamily: "'Caveat', cursive" }}>
                        Your handwritten text will appear here...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Customization Panel */}
          <div style={panelStyle} id="hw-panel">
            {/* Panel header */}
            <div style={{
              padding: '1.2rem 1.2rem 0.8rem',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.6rem' }}>
                Customize
              </h3>
              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                {[
                  { id: 'fonts',   icon: <Type size={13}/>,     label: 'Fonts' },
                  { id: 'ink',     icon: <Palette size={13}/>,   label: 'Ink' },
                  { id: 'spacing', icon: <Minus size={13}/>,     label: 'Spacing' },
                  { id: 'pages',   icon: <Layout size={13}/>,    label: 'Pages' },
                  { id: 'page',    icon: <FileText size={13}/>,  label: 'Settings' },
                  { id: 'effects', icon: <Sparkles size={13}/>,  label: 'Effects' },
                ].map(tab => (
                  <button key={tab.id}
                    onClick={() => setActiveSection(tab.id)}
                    style={sectionBtnStyle(activeSection === tab.id)}
                    onMouseEnter={e => {
                      if (activeSection !== tab.id) e.currentTarget.style.color = 'rgba(255,255,255,0.8)';
                    }}
                    onMouseLeave={e => {
                      if (activeSection !== tab.id) e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                    }}
                  >{tab.icon} {tab.label}</button>
                ))}
              </div>
            </div>

            {/* Scrollable sections */}
            <div style={{ flex: 1, overflow: 'auto', padding: '1rem 1.2rem 1.5rem' }}>
              {/* FONTS */}
              {activeSection === 'fonts' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Handwriting Style
                  </label>
                  {FONTS.map(f => (
                    <button key={f.id}
                      onClick={() => setFont(f)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.8rem',
                        padding: '0.8rem 1rem', borderRadius: '12px',
                        border: font.id === f.id ? '1px solid rgba(204,255,0,0.3)' : '1px solid rgba(255,255,255,0.05)',
                        background: font.id === f.id ? 'rgba(204,255,0,0.06)' : 'rgba(255,255,255,0.02)',
                        cursor: 'pointer', transition: 'all 0.25s ease',
                        width: '100%', textAlign: 'left',
                      }}
                      onMouseEnter={e => {
                        if (font.id !== f.id) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                        e.currentTarget.style.transform = 'translateX(4px)';
                      }}
                      onMouseLeave={e => {
                        if (font.id !== f.id) e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: '10px',
                        background: font.id === f.id
                          ? 'linear-gradient(135deg, rgba(204,255,0,0.2), rgba(204,255,0,0.05))'
                          : 'rgba(255,255,255,0.04)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: f.family, fontSize: '16px', color: font.id === f.id ? '#ccff00' : 'var(--secondary)',
                        flexShrink: 0,
                      }}>Aa</div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600, fontFamily: f.family }}>{f.label}</div>
                        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem' }}>{f.desc}</div>
                      </div>
                      {font.id === f.id && (
                        <div style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: '#ccff00', boxShadow: '0 0 8px rgba(204,255,0,0.5)' }} />
                      )}
                    </button>
                  ))}

                  {/* Font Size */}
                  <div style={{ marginTop: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Font Size
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <button onClick={() => setFontSize(s => Math.max(12, s - 1))} style={{
                          width: 24, height: 24, borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)',
                          background: 'transparent', color: 'var(--secondary)', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}><Minus size={12}/></button>
                        <span style={{
                          color: '#ccff00', fontSize: '0.85rem', fontWeight: 700, minWidth: 30, textAlign: 'center',
                        }}>{fontSize}</span>
                        <button onClick={() => setFontSize(s => Math.min(48, s + 1))} style={{
                          width: 24, height: 24, borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)',
                          background: 'transparent', color: 'var(--secondary)', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}><Plus size={12}/></button>
                      </div>
                    </div>
                    <input type="range" min={12} max={48} value={fontSize}
                      onChange={e => setFontSize(Number(e.target.value))}
                      style={sliderStyle}
                    />
                  </div>
                </div>
              )}

              {/* INK */}
              {activeSection === 'ink' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Ink Color
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                    {INK_COLORS.map(c => (
                      <button key={c.id} onClick={() => setInkColor(c)}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
                          padding: '0.8rem 0.4rem', borderRadius: '12px',
                          border: inkColor.id === c.id ? '1px solid rgba(204,255,0,0.3)' : '1px solid rgba(255,255,255,0.05)',
                          background: inkColor.id === c.id ? 'rgba(204,255,0,0.06)' : 'rgba(255,255,255,0.02)',
                          cursor: 'pointer', transition: 'all 0.25s ease',
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%', background: c.value,
                          boxShadow: inkColor.id === c.id ? `0 0 12px ${c.value}88` : 'none',
                          border: '2px solid rgba(255,255,255,0.1)',
                          transition: 'box-shadow 0.3s',
                        }} />
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.6rem', fontWeight: 600 }}>
                          {c.label.split(' ')[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* SPACING */}
              {activeSection === 'spacing' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  {[
                    { label: 'Line Spacing',   value: lineSpacing,   set: setLineSpacing,   min: 1.2, max: 4, step: 0.1 },
                    { label: 'Word Spacing',    value: wordSpacing,   set: setWordSpacing,   min: 0,   max: 20, step: 1 },
                    { label: 'Letter Spacing',  value: letterSpacing, set: setLetterSpacing, min: -2,  max: 8, step: 0.5 },
                    { label: 'Vertical Offset', value: verticalOffset, set: setVerticalOffset, min: -30, max: 60, step: 1 },
                  ].map(s => (
                    <div key={s.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                          {s.label}
                        </label>
                        <span style={{ color: '#ccff00', fontSize: '0.8rem', fontWeight: 700 }}>{s.value}</span>
                      </div>
                      <input type="range" min={s.min} max={s.max} step={s.step} value={s.value}
                        onChange={e => s.set(Number(e.target.value))}
                        style={sliderStyle}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* PAGE TYPES */}
              {activeSection === 'pages' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Paper Style
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                    {PAGE_TYPES.map(pt => (
                      <button key={pt.id} onClick={() => { setPageType(pt); if (['plain','graph','dotted','vintage'].includes(pt.id)) { setShowLines(false); } else { setShowLines(true); } }}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem',
                          padding: '0.7rem 0.4rem', borderRadius: '12px',
                          border: pageType.id === pt.id ? '1px solid rgba(204,255,0,0.3)' : '1px solid rgba(255,255,255,0.05)',
                          background: pageType.id === pt.id ? 'rgba(204,255,0,0.06)' : 'rgba(255,255,255,0.02)',
                          cursor: 'pointer', transition: 'all 0.25s ease',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; if (pageType.id !== pt.id) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; if (pageType.id !== pt.id) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                      >
                        <span style={{ fontSize: '1.3rem' }}>{pt.emoji}</span>
                        <span style={{ color: pageType.id === pt.id ? '#ccff00' : 'rgba(255,255,255,0.55)', fontSize: '0.68rem', fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>{pt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* PAGE SETTINGS */}
              {activeSection === 'page' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem', display: 'block' }}>
                      Page Size
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                      {Object.entries(PAGE_SIZES).map(([key, val]) => (
                        <button key={key} onClick={() => setPageSize(key)} style={{
                          padding: '0.7rem', borderRadius: '10px',
                          border: pageSize === key ? '1px solid rgba(204,255,0,0.3)' : '1px solid rgba(255,255,255,0.06)',
                          background: pageSize === key ? 'rgba(204,255,0,0.08)' : 'rgba(255,255,255,0.02)',
                          color: pageSize === key ? '#ccff00' : 'var(--secondary)',
                          cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                          transition: 'all 0.2s',
                        }}>{val.label}</button>
                      ))}
                    </div>
                  </div>

                  {/* Toggles */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {[
                      { label: 'Paper Lines',  value: showLines,  set: setShowLines, icon: <Eye size={14}/>, offIcon: <EyeOff size={14}/> },
                      { label: 'Page Margin',  value: showMargin, set: setShowMargin, icon: <Eye size={14}/>, offIcon: <EyeOff size={14}/> },
                    ].map(t => (
                      <button key={t.label} onClick={() => t.set(!t.value)} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0.8rem 1rem', borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.06)',
                        background: 'rgba(255,255,255,0.02)',
                        cursor: 'pointer', transition: 'all 0.2s',
                        width: '100%',
                      }}>
                        <span style={{ color: 'var(--secondary)', fontSize: '0.82rem', fontWeight: 600 }}>{t.label}</span>
                        <div style={{
                          width: 40, height: 22, borderRadius: '11px',
                          background: t.value ? '#ccff00' : 'rgba(255,255,255,0.1)',
                          transition: 'background 0.3s',
                          position: 'relative',
                        }}>
                          <div style={{
                            width: 16, height: 16, borderRadius: '50%',
                            background: t.value ? '#000' : 'rgba(255,255,255,0.4)',
                            position: 'absolute', top: 3,
                            left: t.value ? 21 : 3,
                            transition: 'left 0.3s, background 0.3s',
                          }} />
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Upload background */}
                  <div>
                    <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem', display: 'block' }}>
                      Custom Paper Background
                    </label>
                    <input ref={fileInputRef} type="file" accept="image/*"
                      onChange={handleBgUpload}
                      style={{ display: 'none' }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => fileInputRef.current?.click()} style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                        padding: '0.7rem', borderRadius: '10px',
                        border: '1px dashed rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.02)', color: 'var(--secondary)',
                        cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                        transition: 'all 0.2s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(204,255,0,0.3)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                      >
                        <Upload size={14}/> {paperBg ? 'Change' : 'Upload Image'}
                      </button>
                      {paperBg && (
                        <button onClick={() => setPaperBg(null)} style={{
                          padding: '0.7rem', borderRadius: '10px',
                          border: '1px solid rgba(255,50,50,0.2)',
                          background: 'rgba(255,50,50,0.06)', color: '#ff6b6b',
                          cursor: 'pointer', fontSize: '0.8rem',
                          display: 'flex', alignItems: 'center',
                        }}>
                          <RotateCcw size={14}/>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* EFFECTS */}
              {activeSection === 'effects' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <label style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Visual Effects
                  </label>
                  {[
                    { label: 'Paper Shadow',   desc: 'Adds depth to the paper',    value: shadowEffect,  set: setShadowEffect },
                    { label: 'Slight Rotation', desc: 'Tilts paper for realism',   value: rotateEffect,  set: setRotateEffect },
                    { label: 'High Resolution', desc: '3x export quality (slower)', value: highRes,       set: setHighRes },
                  ].map(fx => (
                    <button key={fx.label} onClick={() => fx.set(!fx.value)} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.8rem 1rem', borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.06)',
                      background: 'rgba(255,255,255,0.02)',
                      cursor: 'pointer', transition: 'all 0.2s',
                      width: '100%',
                    }}>
                      <div>
                        <div style={{ color: 'var(--secondary)', fontSize: '0.82rem', fontWeight: 600, textAlign: 'left' }}>{fx.label}</div>
                        <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.68rem', textAlign: 'left' }}>{fx.desc}</div>
                      </div>
                      <div style={{
                        width: 40, height: 22, borderRadius: '11px',
                        background: fx.value ? '#ccff00' : 'rgba(255,255,255,0.1)',
                        transition: 'background 0.3s',
                        position: 'relative', flexShrink: 0, marginLeft: '0.8rem',
                      }}>
                        <div style={{
                          width: 16, height: 16, borderRadius: '50%',
                          background: fx.value ? '#000' : 'rgba(255,255,255,0.4)',
                          position: 'absolute', top: 3,
                          left: fx.value ? 21 : 3,
                          transition: 'left 0.3s, background 0.3s',
                        }} />
                      </div>
                    </button>
                  ))}

                  {/* Quick reset */}
                  <button onClick={() => {
                    setFont(FONTS[0]); setFontSize(22); setInkColor(INK_COLORS[0]);
                    setLineSpacing(2.2); setWordSpacing(4); setLetterSpacing(0.5);
                    setVerticalOffset(0); setShowLines(true); setShowMargin(true);
                    setShadowEffect(true); setRotateEffect(false); setHighRes(false);
                    setPaperBg(null); setPageSize('A4'); setPageType(PAGE_TYPES[0]);
                  }} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                    padding: '0.8rem', borderRadius: '12px', marginTop: '0.5rem',
                    border: '1px solid rgba(255,50,50,0.15)',
                    background: 'rgba(255,50,50,0.04)',
                    color: '#ff6b6b', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                    transition: 'all 0.2s',
                    width: '100%',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,50,50,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,50,50,0.04)'}
                  >
                    <RotateCcw size={14}/> Reset All Settings
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Responsive override */}
      <style>{`
        #hw-split {
          grid-template-columns: 1fr 380px;
        }
        @media (max-width: 1024px) {
          #hw-split {
            grid-template-columns: 1fr !important;
          }
          #hw-panel {
            max-height: 500px;
          }
        }
        @media (max-width: 768px) {
          #hw-paper {
            transform: scale(0.5) !important;
            transform-origin: top left !important;
          }
        }
        /* Custom scrollbar for panel */
        #hw-panel::-webkit-scrollbar { width: 4px; }
        #hw-panel::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        #hw-panel *::-webkit-scrollbar { width: 4px; }
        #hw-panel *::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>
    </main>
  );
}
