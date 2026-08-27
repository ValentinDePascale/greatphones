'use client'

interface Props {
  step: number
  total: number
  steps: string[]
  maxStep: number
  onGo: (n: number) => void
  errRef: React.RefObject<HTMLDivElement | null>
  errors: Record<string, string>
  serverMsg: string | null
  children: React.ReactNode
  footer: React.ReactNode
}

export default function AdminWizardShell({ step, total, steps, maxStep, onGo, errRef, errors, serverMsg, children, footer }: Props) {
  return (
    <>
      <style>{`
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
        .cw-input:focus { border-color: #FF6B2C !important; outline: none; }
        .cw-btn:focus-visible { outline: 2px solid #FF6B2C; outline-offset: 2px; }
        .cw-primary:not(:disabled):hover { filter: brightness(.94); }
        .cw-back:not(:disabled):hover { background: #F4F6F9; }
        .cw-dot-btn:focus-visible { outline: 2px solid #FF6B2C; outline-offset: 2px; }
        .cw-spin { animation: cws 1s linear infinite; }
        @keyframes cws { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) {
          .cw-spin { animation: none !important; }
          .cw-bar, .cw-dot-btn, .cw-btn { transition: none !important; }
        }
      `}</style>

      <nav aria-label="Progreso del formulario">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
          <p style={{ fontSize: 12.5, fontWeight: 700, color: '#181B2E', margin: 0 }} aria-hidden="true">
            Paso {step} de {total} · {steps[step - 1]}
          </p>
          <p style={{ fontSize: 11.5, color: '#94A3B8', margin: 0 }} aria-hidden="true">
            {Math.round((step / total) * 100)}%
          </p>
        </div>
        <div style={{ height: 5, background: '#EDF0F6', borderRadius: 99, overflow: 'hidden' }} aria-hidden="true">
          <div className="cw-bar" style={{ height: '100%', width: `${(step / total) * 100}%`, background: 'linear-gradient(90deg,#FF6B2C,#FF8A50)', borderRadius: 99, transition: 'width .25s ease' }} />
        </div>
        <ol style={{ display: 'flex', alignItems: 'center', listStyle: 'none', margin: '14px 0 0', padding: 0 }}>
          {steps.map((label, i) => {
            const n = i + 1
            const completo = n < step
            const activo = n === step
            const alcanzable = n <= maxStep
            return (
              <li key={label} style={{ display: 'flex', alignItems: 'center', flex: n < total ? 1 : '0 0 auto', minWidth: 0 }}>
                <button
                  type="button"
                  className="cw-dot-btn"
                  onClick={() => alcanzable && onGo(n)}
                  disabled={!alcanzable}
                  aria-label={`Paso ${n}: ${label}${activo ? ' (actual)' : completo ? ' (completado)' : ''}`}
                  aria-current={activo ? 'step' : undefined}
                  title={label}
                  style={{
                    flexShrink: 0, width: 30, height: 30, borderRadius: '50%',
                    border: activo ? '2.5px solid #FF6B2C' : '2px solid ' + (completo ? '#FFD3BC' : '#E6E7F0'),
                    background: activo ? '#FF6B2C' : completo ? '#FFF1E8' : '#FBFBFD',
                    color: activo ? '#fff' : completo ? '#FF6B2C' : '#B6BCCB',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 700,
                    cursor: alcanzable ? 'pointer' : 'default', transition: 'background .15s, border-color .15s',
                  }}
                >
                  {completo ? <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden="true">check</span> : n}
                </button>
                {n < total && (
                  <>
                    <span className="cw-steplabel" style={{ fontSize: 11, fontWeight: activo ? 700 : 500, color: activo ? '#FF6B2C' : completo ? '#F08A4B' : '#B6BCCB', marginLeft: 6, marginRight: 8, whiteSpace: 'nowrap' }} aria-hidden="true">{label}</span>
                    <span aria-hidden="true" style={{ flex: 1, minWidth: 8, height: 2, background: completo ? '#FFD3BC' : '#EDF0F6', borderRadius: 2, marginRight: 6 }} />
                  </>
                )}
              </li>
            )
          })}
        </ol>
        <p style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }} role="status">{`Paso ${step} de ${total}: ${steps[step - 1]}`}</p>
      </nav>

      <div style={{ background: '#fff', border: '1px solid #E6E7F0', borderRadius: 14, padding: 24, marginTop: 16, boxShadow: '0 1px 2px rgba(23,23,45,.04),0 6px 20px rgba(23,23,45,.06)' }}>
        {Object.keys(errors).length > 0 && (
          <div ref={errRef} tabIndex={-1} role="alert" aria-labelledby="cw-error-title" style={{ background: '#FEF2F2', borderLeft: '4px solid #DC2626', borderRadius: 8, padding: '12px 14px', marginBottom: 16, outline: 'none' }}>
            <p id="cw-error-title" style={{ fontSize: 13, fontWeight: 700, color: '#B91C1C', margin: '0 0 6px' }}>Revisá estos datos para continuar:</p>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {Object.entries(errors).map(([id, txt]) => (
                <li key={id}><a href={`#${id}`} style={{ fontSize: 12.5, color: '#DC2626' }}>{txt}</a></li>
              ))}
            </ul>
          </div>
        )}
        {serverMsg && (
          <div role="alert" style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '11px 14px', marginBottom: 16, color: '#B91C1C', fontWeight: 600, fontSize: 13 }}>{serverMsg}</div>
        )}
        {children}
        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>{footer}</div>
        <p style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center', margin: '12px 0 0' }}>Podés volver a los pasos anteriores con el menú superior para corregir cualquier dato.</p>
      </div>
    </>
  )
}
