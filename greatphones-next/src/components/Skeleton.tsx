export interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: string | number
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
  animation?: 'pulse' | 'wave'
}

export default function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 4,
  className = '',
  variant = 'rectangular',
  animation = 'pulse',
}: SkeletonProps) {
  const baseStyle: React.CSSProperties = {
    display: 'inline-block',
    background: '#e5e7eb',
    borderRadius:
      variant === 'circular' ? '50%' : variant === 'text' ? '4px' : String(borderRadius),
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  }

  const animationStyle =
    animation === 'pulse'
      ? `
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        animation: skeleton-pulse 1.5s ease-in-out infinite;
      `
      : `
        @keyframes skeleton-wave {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        background: linear-gradient(
          90deg,
          #e5e7eb 25%,
          #f3f4f6 50%,
          #e5e7eb 75%
        );
        background-size: 1000px 100%;
        animation: skeleton-wave 2s infinite;
      `

  return (
    <>
      <style>{animationStyle}</style>
      <div style={baseStyle} className={className} />
    </>
  )
}
