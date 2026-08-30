export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: string
  text?: string
  fullScreen?: boolean
}

const sizeMap = {
  sm: { width: 24, height: 24 },
  md: { width: 40, height: 40 },
  lg: { width: 60, height: 60 },
}

export default function LoadingSpinner({
  size = 'md',
  color = '#667eea',
  text,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const { width, height } = sizeMap[size]

  const content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <svg
        width={width}
        height={height}
        viewBox="0 0 50 50"
        style={{
          animation: 'spin 1s linear infinite',
        }}
      >
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeOpacity="0.3"
        />
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray="31.4 62.8"
          strokeLinecap="round"
        />
      </svg>
      {text && (
        <p
          style={{
            margin: 0,
            fontSize: '14px',
            color: '#6b7280',
            fontWeight: 500,
          }}
        >
          {text}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(2px)',
          zIndex: 1000,
        }}
      >
        {content}
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      {content}
    </div>
  )
}
