import Skeleton from './Skeleton'

export interface SkeletonListProps {
  count?: number
  height?: number
  gap?: number
  variant?: 'list' | 'grid' | 'table'
  columns?: number
}

export default function SkeletonList({
  count = 5,
  height = 16,
  gap = 12,
  variant = 'list',
  columns = 3,
}: SkeletonListProps) {
  const items = Array.from({ length: count }, (_, i) => i)

  if (variant === 'grid') {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: `${gap}px`,
        }}
      >
        {items.map(i => (
          <div key={i} style={{ padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
            <Skeleton height={200} borderRadius="8px" style={{ marginBottom: '12px' }} />
            <Skeleton width="80%" height={height} style={{ marginBottom: '8px' }} />
            <Skeleton width="60%" height={height} />
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'table') {
    return (
      <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: '12px',
            padding: '12px',
            borderBottom: '1px solid #e5e7eb',
            background: '#f9fafb',
          }}
        >
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} height={height} width="80%" />
          ))}
        </div>
        {items.map(i => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${columns}, 1fr)`,
              gap: '12px',
              padding: '12px',
              borderBottom: '1px solid #e5e7eb',
            }}
          >
            {Array.from({ length: columns }).map((_, j) => (
              <Skeleton key={j} height={height} width={j === 0 ? '100%' : '80%'} />
            ))}
          </div>
        ))}
      </div>
    )
  }

  // Default: list
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: `${gap}px` }}>
      {items.map(i => (
        <div key={i}>
          <Skeleton height={height} width="100%" style={{ marginBottom: '8px' }} />
          <Skeleton height={height - 4} width="85%" />
        </div>
      ))}
    </div>
  )
}
