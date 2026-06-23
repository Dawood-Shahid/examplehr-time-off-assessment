import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { OptimisticFeedback } from '@/components/request/OptimisticFeedback'

describe('OptimisticFeedback', () => {
  it('renders insufficient balance message for HCM rejection', () => {
    render(createElement(OptimisticFeedback, { error: 'insufficient_balance' }))

    expect(
      screen.getByText(/insufficient balance for this request/i)
    ).toBeInTheDocument()
  })
})
