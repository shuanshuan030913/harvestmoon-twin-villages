import { createHashRouter } from 'react-router'
import Layout from './Layout.jsx'
import Home from './pages/Home.jsx'
import CalendarPage from './pages/CalendarPage.jsx'
import TrackerPage from './pages/TrackerPage.jsx'

const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'calendar', element: <CalendarPage /> },
      { path: 'tracker', element: <TrackerPage /> },
    ],
  },
])

export default router
