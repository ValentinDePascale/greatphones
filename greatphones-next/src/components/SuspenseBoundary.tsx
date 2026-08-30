import { Suspense, ReactNode } from 'react'
import LoadingSpinner from './LoadingSpinner'
import SkeletonList from './SkeletonList'

export interface SuspenseBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  variant?: 'spinner' | 'skeleton-list' | 'skeleton-grid' | 'skeleton-table' | 'custom'
  skeletonCount?: number
  spinnerText?: string
}

export default function SuspenseBoundary({
  children,
  fallback,
  variant = 'skeleton-list',
  skeletonCount = 5,
  spinnerText = 'Cargando...',
}: SuspenseBoundaryProps) {
  let defaultFallback: ReactNode

  if (fallback) {
    defaultFallback = fallback
  } else if (variant === 'spinner') {
    defaultFallback = <LoadingSpinner text={spinnerText} />
  } else if (variant === 'skeleton-list') {
    defaultFallback = <SkeletonList count={skeletonCount} variant="list" />
  } else if (variant === 'skeleton-grid') {
    defaultFallback = <SkeletonList count={skeletonCount} variant="grid" columns={3} />
  } else if (variant === 'skeleton-table') {
    defaultFallback = <SkeletonList count={skeletonCount} variant="table" columns={4} />
  } else {
    defaultFallback = <LoadingSpinner text={spinnerText} />
  }

  return <Suspense fallback={defaultFallback}>{children}</Suspense>
}
