import Skeleton from './Skeleton'

export default function AdminLoading() {
  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#f9fafb',
      }}
    >
      {/* Sidebar skeleton */}
      <aside
        style={{
          width: 240,
          minHeight: '100vh',
          background: 'white',
          padding: '1rem 0',
          borderRight: '1px solid #e5e7eb',
        }}
      >
        <div style={{ padding: '0 1rem 1.5rem' }}>
          <Skeleton width="120px" height="24px" borderRadius="4px" style={{ marginBottom: '8px' }} />
          <Skeleton width="100px" height="12px" borderRadius="4px" />
        </div>

        <div style={{ padding: '0 0.5rem' }}>
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} style={{ padding: '0 8px' }}>
              <Skeleton
                width="100%"
                height="32px"
                borderRadius="8px"
                style={{ marginBottom: '4px' }}
              />
            </div>
          ))}
        </div>
      </aside>

      {/* Main content skeleton */}
      <main
        style={{
          flex: 1,
          padding: '20px',
          minHeight: '100vh',
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 16px',
            background: 'white',
            borderBottom: '1px solid #e5e7eb',
            borderRadius: '8px',
            marginBottom: '20px',
          }}
        >
          <Skeleton width="24px" height="24px" borderRadius="4px" />
          <Skeleton width="120px" height="16px" borderRadius="4px" />
        </div>

        {/* Content area */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
          <Skeleton
            width="200px"
            height="28px"
            borderRadius="4px"
            style={{ marginBottom: '20px' }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <Skeleton width="100%" height="150px" borderRadius="8px" style={{ marginBottom: '12px' }} />
                <Skeleton width="80%" height="16px" borderRadius="4px" style={{ marginBottom: '8px' }} />
                <Skeleton width="60%" height="14px" borderRadius="4px" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
