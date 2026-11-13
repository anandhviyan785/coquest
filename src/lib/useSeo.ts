import { useEffect } from 'react'
import { SITE } from '../content/seo'

interface SeoOptions {
  title: string
  description: string
  /** Path of this page, used for the canonical URL. */
  path: string
  /** Keep the page out of search results. Used for sign-in and everything behind it. */
  noindex?: boolean
}

const upsert = (selector: string, create: () => HTMLElement, attribute: string, value: string): void => {
  const element = document.head.querySelector<HTMLElement>(selector) ?? document.head.appendChild(create())
  element.setAttribute(attribute, value)
}

const meta = (key: 'name' | 'property', name: string, content: string): void =>
  upsert(`meta[${key}="${name}"]`, () => {
    const el = document.createElement('meta')
    el.setAttribute(key, name)
    return el
  }, 'content', content)

/** Sets the title, description, canonical link, robots rule and social-card tags for the current page. */
export const applySeo = ({ title, description, path, noindex = false }: SeoOptions): void => {
  const url = `${SITE.origin}${path === '/' ? '' : path}`
  document.title = title
  meta('name', 'description', description)
  meta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large')
  upsert('link[rel="canonical"]', () => {
    const el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    return el
  }, 'href', url)
  meta('property', 'og:title', title)
  meta('property', 'og:description', description)
  meta('property', 'og:url', url)
  meta('name', 'twitter:title', title)
  meta('name', 'twitter:description', description)
}

/** Call at the top of a page component. Re-applies when the page changes. */
export function useSeo(options: SeoOptions): void {
  const { title, description, path, noindex } = options
  useEffect(() => applySeo({ title, description, path, noindex }), [title, description, path, noindex])
}
