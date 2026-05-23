import { BrowserRouter } from 'react-router-dom'

import { AppProviders } from '@/app/providers'
import { AppRoutes } from '@/routes/router'

export function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProviders>
  )
}
