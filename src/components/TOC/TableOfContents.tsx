import React, { useEffect, useState, useRef } from 'react'
import { List } from 'lucide-react'

interface TocItem {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  contentRef: React.RefObject<HTMLDivElement>
}

const TableOfContents: React.FC<TableOfContentsProps> = ({ contentRef }) => {
  const [toc, setToc] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [isOpen, setIsOpen] = useState(true)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // 解析文章内容中的标题
  useEffect(() => {
    if (!contentRef.current) return

    const headings = contentRef.current.querySelectorAll('h1, h2, h3, h4')
    const items: TocItem[] = []

    headings.forEach((heading, index) => {
      const id = heading.id || `heading-${index}`
      if (!heading.id) heading.id = id
      items.push({
        id,
        text: heading.textContent || '',
        level: parseInt(heading.tagName[1]),
      })
    })

    setToc(items)
  }, [contentRef])

  // IntersectionObserver 高亮当前阅读位置
  useEffect(() => {
    if (toc.length === 0) return

    observerRef.current?.disconnect()

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // 找到最靠近顶部的可见标题
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length > 0) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    )

    toc.forEach(item => {
      const el = document.getElementById(item.id)
      if (el) observerRef.current?.observe(el)
    })

    return () => observerRef.current?.disconnect()
  }, [toc])

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 80
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  if (toc.length < 2) return null

  return (
    <div className="hidden xl:block fixed right-6 top-24 w-56 z-30">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
        {/* 标题栏 */}
        <button
          onClick={() => setIsOpen(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <span className="flex items-center gap-2">
            <List className="w-4 h-4" />
            目录
          </span>
          <span className="text-gray-400">{isOpen ? '▲' : '▼'}</span>
        </button>

        {isOpen && (
          <nav className="px-3 pb-3 max-h-[60vh] overflow-y-auto">
            {toc.map(item => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`block w-full text-left text-xs py-1 px-2 rounded transition-colors truncate ${
                  item.level === 1 ? 'pl-2' :
                  item.level === 2 ? 'pl-4' :
                  item.level === 3 ? 'pl-6' : 'pl-8'
                } ${
                  activeId === item.id
                    ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 font-medium'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                title={item.text}
              >
                {item.text}
              </button>
            ))}
          </nav>
        )}
      </div>
    </div>
  )
}

export default TableOfContents
