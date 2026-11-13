/**
 * Runs after `vite build`. CoQuest is a single-page app, so without this step a search crawler would
 * get an empty page for every address. This writes a real HTML file for each public page (title,
 * description, canonical link, social tags, structured data and the page text), plus sitemap.xml
 * and robots.txt. React then takes over in the browser exactly as before.
 *   node scripts/prerender.ts
 */
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { HOME, HOME_DESCRIPTION, HOME_TITLE, PRIVATE_PATHS, PUBLIC_PAGES, SITE } from '../src/content/seo.ts'
import type { PublicPage } from '../src/content/seo.ts'

const DIST = 'dist'
const HEAD_MARK = /<!--seo:head-->[\s\S]*?<!--\/seo:head-->/
const BODY_MARK = /<!--seo:body-->[\s\S]*?<!--\/seo:body-->/

const esc = (text: string): string => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const url = (path: string): string => `${SITE.origin}${path === '/' ? '' : path}`
const jsonLd = (data: unknown): string => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`

const ORGANIZATION = { '@type': 'Organization', '@id': `${SITE.origin}/#organization`, name: SITE.name, url: SITE.origin, logo: `${SITE.origin}${SITE.logo}` }

const structuredData = (page: PublicPage | null): string => {
  if (!page) {
    return [
      jsonLd({ '@context': 'https://schema.org', ...ORGANIZATION }),
      jsonLd({ '@context': 'https://schema.org', '@type': 'WebSite', '@id': `${SITE.origin}/#website`, name: SITE.name, url: SITE.origin, description: HOME_DESCRIPTION, inLanguage: 'en', publisher: { '@id': `${SITE.origin}/#organization` } }),
    ].join('\n    ')
  }
  const blocks: unknown[] = [
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: SITE.name, item: SITE.origin },
      { '@type': 'ListItem', position: 2, name: page.label, item: url(page.path) },
    ] },
    { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: page.faq.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })) },
  ]
  if (page.course) {
    blocks.push({ '@context': 'https://schema.org', '@type': 'Course', name: page.course.name, description: page.course.description, url: url(page.path), provider: { '@type': 'Organization', name: SITE.name, sameAs: SITE.origin } })
  }
  return blocks.map(jsonLd).join('\n    ')
}

const headTags = (title: string, description: string, path: string, page: PublicPage | null): string => `<!--seo:head-->
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href="${url(path)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${SITE.name}" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${url(path)}" />
    <meta property="og:image" content="${SITE.origin}${SITE.ogImage}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="CoQuest: learn coding through play" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <meta name="twitter:image" content="${SITE.origin}${SITE.ogImage}" />
    ${structuredData(page)}
    <!--/seo:head-->`

const nav = `<nav aria-label="Courses and guides"><ul>${PUBLIC_PAGES.map((p) => `<li><a href="${p.path}">${esc(p.label)}</a></li>`).join('')}</ul></nav>`

const homeBody = (): string => `<!--seo:body-->
    <div id="seo-static">
      <header><img src="/favicon.svg" alt="" width="40" height="40" /> <strong>${SITE.name}</strong></header>
      <main>
        <h1>${esc(HOME.h1)}</h1>
        <p>${esc(SITE.subTagline)}</p>
        <p>${esc(HOME.lead)}</p>
        <p><a href="/login?signup=1">${esc(HOME.primaryCta)}</a> &middot; <a href="/learn-coding-online">${esc(HOME.secondaryCta)}</a></p>
        <h2>Why learners like CoQuest</h2>
        <ul>${HOME.points.map((p) => `<li><strong>${esc(p.title)}.</strong> ${esc(p.text)}</li>`).join('')}</ul>
        <h2>Start with a course</h2>
        ${nav}
      </main>
    </div>
    <!--/seo:body-->`

const pageBody = (page: PublicPage): string => {
  const related = page.related.map((path) => PUBLIC_PAGES.find((p) => p.path === path)).filter((p): p is PublicPage => p !== undefined)
  return `<!--seo:body-->
    <div id="seo-static">
      <header><a href="/"><img src="/favicon.svg" alt="" width="40" height="40" /> <strong>${SITE.name}</strong></a></header>
      <main>
        <h1>${esc(page.h1)}</h1>
        <p>${esc(page.lead)}</p>
        <p><a href="/login?signup=1">${esc(page.cta)}</a></p>
        ${page.sections.map((s) => `<section><h2>${esc(s.heading)}</h2>${s.body.map((b) => `<p>${esc(b)}</p>`).join('')}${s.bullets ? `<ul>${s.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}</section>`).join('\n        ')}
        <section><h2>Frequently asked questions</h2>${page.faq.map((f) => `<h3>${esc(f.question)}</h3><p>${esc(f.answer)}</p>`).join('')}</section>
        <section><h2>Keep exploring</h2><ul>${related.map((p) => `<li><a href="${p.path}">${esc(p.label)}</a></li>`).join('')}</ul></section>
      </main>
    </div>
    <!--/seo:body-->`
}

const write = (file: string, content: string): void => {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, content)
}

const template = readFileSync(join(DIST, 'index.html'), 'utf8')
if (!HEAD_MARK.test(template) || !BODY_MARK.test(template)) throw new Error('dist/index.html is missing the seo:head / seo:body markers.')

const build = (title: string, description: string, path: string, page: PublicPage | null, body: string): string =>
  template.replace(HEAD_MARK, () => headTags(title, description, path, page)).replace(BODY_MARK, () => body)

write(join(DIST, 'index.html'), build(HOME_TITLE, HOME_DESCRIPTION, '/', null, homeBody()))
for (const page of PUBLIC_PAGES) write(join(DIST, page.path, 'index.html'), build(page.title, page.description, page.path, page, pageBody(page)))

// 404.html: Vercel serves it, with a real 404 status, for any address that is not a page or an app route.
const notFoundHead = `<!--seo:head-->
    <title>Page not found | ${SITE.name}</title>
    <meta name="description" content="This page does not exist." />
    <meta name="robots" content="noindex, nofollow" />
    <!--/seo:head-->`
const notFoundBody = `<!--seo:body-->
    <div id="seo-static">
      <header><a href="/"><img src="/favicon.svg" alt="" width="40" height="40" /> <strong>${SITE.name}</strong></a></header>
      <main>
        <h1>This quest path does not exist</h1>
        <p>The page you wanted is not here. It may have moved, or the address may have a typo.</p>
        <p><a href="/">Back to the start</a></p>
      </main>
    </div>
    <!--/seo:body-->`
write(join(DIST, '404.html'), template.replace(HEAD_MARK, () => notFoundHead).replace(BODY_MARK, () => notFoundBody))

// sitemap.xml: public pages only. The date is when the page copy last changed.
const lastmod = statSync('src/content/seo.ts').mtime.toISOString().slice(0, 10)
const entries = [{ path: '/', priority: '1.0' }, ...PUBLIC_PAGES.map((p) => ({ path: p.path, priority: '0.8' }))]
write(join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.map((e) => `  <url>\n    <loc>${url(e.path)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <priority>${e.priority}</priority>\n  </url>`).join('\n')}\n</urlset>\n`)

// robots.txt: crawl the public pages, keep out the sign-in page and the signed-in app.
const disallow = PRIVATE_PATHS.flatMap((p) => (p === '/learn' ? ['Disallow: /learn$', 'Disallow: /learn/'] : [`Disallow: ${p}`]))
write(join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n${disallow.join('\n')}\n\nSitemap: ${SITE.origin}/sitemap.xml\n`)

console.log(`prerendered ${PUBLIC_PAGES.length + 1} pages, sitemap.xml and robots.txt`)
