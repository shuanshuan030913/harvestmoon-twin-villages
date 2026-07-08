import { createHashRouter } from 'react-router'
import Layout from './Layout.jsx'
import Home from './pages/Home.jsx'
import CalendarPage from './pages/CalendarPage.jsx'
import TrackerPage from './pages/TrackerPage.jsx'
import RadixDemoPage from './pages/RadixDemoPage.jsx'
import CollectionConfigDemoPage from './pages/CollectionConfigDemoPage.jsx'

const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'calendar', element: <CalendarPage /> },
      { path: 'tracker', element: <TrackerPage /> },
      // 不進導覽列，僅供 GameDialog/GameToast 元件驗證用（T5.3）
      { path: 'demo/radix', element: <RadixDemoPage /> },
      // 不進導覽列，僅供 CollectionConfig 機制驗證用（T6.1）
      { path: 'demo/collection-config', element: <CollectionConfigDemoPage /> },
    ],
  },
])

export default router
