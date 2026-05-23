import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { OnboardingPage } from '@/features/auth/onboarding-page'

describe('critical UI flows', () => {
  it('renders onboarding entry point', () => {
    render(
      <BrowserRouter>
        <OnboardingPage />
      </BrowserRouter>,
    )
    expect(screen.getByText(/set up your profile/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start in guest mode/i })).toBeInTheDocument()
  })
})
