import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import Skeleton from './Skeleton'

describe('Skeleton', () => {
  it('debe renderizar con props por defecto', () => {
    const { container } = render(<Skeleton />)
    const skeleton = container.querySelector('div')

    expect(skeleton).toBeInTheDocument()
    expect(skeleton).toHaveStyle({ width: '100%', height: '20px' })
  })

  it('debe renderizar con ancho y alto custom', () => {
    const { container } = render(<Skeleton width={200} height={50} />)
    const skeleton = container.querySelector('div')

    expect(skeleton).toHaveStyle({ width: '200px', height: '50px' })
  })

  it('debe renderizar con variante text', () => {
    const { container } = render(<Skeleton variant="text" />)
    const skeleton = container.querySelector('div')

    expect(skeleton).toBeInTheDocument()
  })

  it('debe renderizar con variante circular', () => {
    const { container } = render(<Skeleton variant="circular" />)
    const skeleton = container.querySelector('div')

    expect(skeleton).toHaveStyle({ borderRadius: '50%' })
  })

  it('debe renderizar con animación pulse', () => {
    const { container } = render(<Skeleton animation="pulse" />)

    expect(container.querySelector('style')).toBeInTheDocument()
  })

  it('debe renderizar con animación wave', () => {
    const { container } = render(<Skeleton animation="wave" />)

    expect(container.querySelector('style')).toBeInTheDocument()
  })

  it('debe aceptar className', () => {
    const { container } = render(<Skeleton className="custom-class" />)
    const skeleton = container.querySelector('div')

    expect(skeleton).toHaveClass('custom-class')
  })
})
