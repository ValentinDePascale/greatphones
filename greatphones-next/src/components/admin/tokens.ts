export const COLORS = {
  primary: '#FF6B2C',
  primaryLight: '#FF8A50',
  primarySoft: '#FFF1E8',
  primaryBorder: '#FFD3BC',
  border: '#E6E7F0',
  borderLight: '#EDF0F6',
  inputBg: '#FBFBFD',
  surface: '#fff',
  surfaceAlt: '#F4F6F9',
  surfaceMuted: '#FAFBFD',
  text: '#181B2E',
  textMuted: '#6B7280',
  textSoft: '#94A3B8',
  label: '#3D4356',
  success: '#0F9D58',
  successBg: '#D5F5E3',
  error: '#DC2626',
  errorBg: '#FEF2F2',
  errorBgInput: '#FEF6F6',
  overlay: 'rgba(15,23,42,.45)',
} as const

export const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: 9,
  border: '1.5px solid #E6E7F0',
  borderRadius: 9,
  fontSize: 13,
  background: '#FBFBFD',
  color: '#181B2E',
  transition: 'border-color .15s',
}

export const inputErrorStyle: React.CSSProperties = {
  borderColor: '#DC2626',
  background: '#FEF6F6',
}

export const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#3D4356',
  marginBottom: 4,
}

export const cardStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #E6E7F0',
  borderRadius: 14,
  boxShadow: '0 1px 2px rgba(23,23,45,.04),0 6px 20px rgba(23,23,45,.06)',
}

export const ADMIN_CSS = `
  .pe-input:focus, .cw-input:focus { border-color: #FF6B2C !important; outline: none; }
  .pe-btn:focus-visible, .cw-btn:focus-visible { outline: 2px solid #FF6B2C; outline-offset: 2px; }
  .pe-add:not(:disabled):hover, .cw-primary:not(:disabled):hover { filter: brightness(.94); }
  .pe-iconbtn:hover:not(:disabled) { filter: brightness(.94); }
  .pe-cancel:hover:not(:disabled), .cw-back:not(:disabled):hover { background: #E4E7EF !important; }
  .pm-card, .cw-card { animation: pmin .16s ease-out; }
  @keyframes pmin { from { opacity: 0; transform: translateY(8px) scale(.985); } to { opacity: 1; transform: none; } }
  .pe-spin, .cw-spin { animation: pes 1s linear infinite; }
  @keyframes pes { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) {
    .pe-spin, .cw-spin { animation: none !important; }
    .pm-card, .cw-card { animation: none !important; }
  }
`

export const GRID_CSS = `
  .pm-grid, .te-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .pm-grid .pm-full, .te-grid .te-full { grid-column: 1 / -1; }
  @media (max-width: 520px) { .pm-grid, .te-grid { grid-template-columns: 1fr; } }
  .cw-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .cw-grid-4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; }
  .cw-acc-grid { display: grid; grid-template-columns: 2fr 1fr auto; gap: 8px; align-items: start; }
  .cw-radio-grid{ display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:12px; }
  @media (max-width: 640px) {
    .cw-grid { grid-template-columns: 1fr; }
    .cw-grid-4 { grid-template-columns: repeat(2,1fr); }
    .cw-steplabel { display: none; }
  }
  @media (max-width: 420px){
    .cw-grid-4{ grid-template-columns: 1fr; }
    .cw-acc-grid { grid-template-columns: 1fr; }
    .cw-acc-grid button{ width: 100%; height: 41px; margin-top: 0 !important; }
    .cw-cat-grid{ grid-template-columns: 1fr !important; }
    .cw-radio-grid{ grid-template-columns:1fr; }
  }
`
