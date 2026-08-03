import { Suspense, lazy, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { Layout } from '@/components/layout'
import { findSeriesBySlug } from '@/content/series'
import { Home } from '@/pages/Home'

// Only the article routes pull in KaTeX, Prism and the 49 canvas figures —
// keeping them out of the home-page bundle.
const BlogHub = lazy(() => import('@/pages/BlogHub').then((m) => ({ default: m.BlogHub })))
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

/** Carries the slug across the /writing -> /blog rename. */
function RedirectArticle() {
  const { slug } = useParams()
  return <Navigate to={`/blog/${slug}`} replace />
}

/**
 * Resolves a bare /blog/:slug against the registry.
 *
 * Before the multi-series registry, every LLM Atlas part lived at /blog/<slug>
 * with no series segment. Those URLs are published and may have been shared, so
 * a known slug redirects to its canonical /blog/<series>/<slug>. Anything else
 * is a genuine 404 — and notably, a *series* id also lands here, which is why
 * this route sits after the series routes rather than shadowing them.
 */
function ResolveLegacyArticle() {
  const { slug } = useParams<{ slug: string }>()
  const series = slug ? findSeriesBySlug(slug) : undefined
  if (series) return <Navigate to={`/blog/${series.id}/${slug}`} replace />
  return <NotFound />
}

function App() {
  return (
    <Layout>
      <ScrollToTop />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Home />} />

          {/* The Atlas hub, then one landing page per series, then articles.
              Order matters: /blog/:slug must come last or it would swallow
              /blog/llm-atlas and every future series id. */}
          <Route path="/blog" element={<BlogHub />} />
          <Route path="/blog/llm-atlas" element={<WritingIndex />} />
          <Route path="/blog/:series/:slug" element={<ArticlePage />} />
          <Route path="/blog/:slug" element={<ResolveLegacyArticle />} />
          {/* /writing was the original path and is already linked from the
              deployed site. Redirect rather than rename, so anything shared
              externally keeps resolving instead of 404ing. */}
          <Route path="/writing" element={<Navigate to="/blog" replace />} />
          <Route path="/writing/:slug" element={<RedirectArticle />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Layout>
  )
}

export default App
