import { createHashRouter } from 'react-router'
import Layout from './Layout.jsx'
import Home from './pages/Home.jsx'
import CalendarPage from './pages/CalendarPage.jsx'
import TrackerPage from './pages/TrackerPage.jsx'
import RadixDemoPage from './pages/RadixDemoPage.jsx'
import CollectionPage from './pages/CollectionPage.jsx'
import EntryPage from './pages/EntryPage.jsx'

const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'calendar', element: <CalendarPage /> },
      { path: 'tracker', element: <TrackerPage /> },
      { path: 'c/:collection', element: <CollectionPage /> },
      { path: 'c/:collection/:slug', element: <EntryPage /> },
      // 不進導覽列，僅供 GameDialog/GameToast 元件驗證用（T5.3）
      { path: 'demo/radix', element: <RadixDemoPage /> },
    ],
  },
])

export default router
