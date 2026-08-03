import { Suspense, lazy, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Layout } from '@/components/layout'
import { Home } from '@/pages/Home'

// Only the article routes pull in KaTeX, Prism and the 49 canvas figures —
// keeping them out of the home-page bundle.
const WritingIndex = lazy(() =>
  import('@/pages/WritingIndex').then((m) => ({ default: m.WritingIndex }))
)
const ArticlePage = lazy(() =>
  import('@/pages/ArticlePage').then((m) => ({ default: m.ArticlePage }))
)
const NotFound = lazy(() => import('@/pages/NotFound').then((m) => ({ default: m.NotFound })))

/** How long to keep looking for a hash target before giving up. */
const HASH_SETTLE_MS = 2000

/**
 * Browsers restore scroll position on navigation, which is wrong for a client
 * router: landing halfway down a new article is disorienting.
 *
 * With a hash, scroll to that element instead — but the home page's sections
 * are lazy-loaded, so the target often does not exist on the first frame after
 * navigating in from /writing. Poll until it mounts, then give up quietly.
 */
function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0)
      return
    }

    const id = hash.slice(1)
    const deadline = performance.now() + HASH_SETTLE_MS
    let frame = 0

    const tryScroll = () => {
      const el = document.getElementById(id)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
      if (performance.now() < deadline) frame = requestAnimationFrame(tryScroll)
    }

    frame = requestAnimationFrame(tryScroll)
    return () => cancelAnimationFrame(frame)
  }, [pathname, hash])

  return null
}

function App() {
  return (
    <Layout>
      <ScrollToTop />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/writing" element={<WritingIndex />} />
          <Route path="/writing/:slug" element={<ArticlePage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Layout>
  )
}

export default App
