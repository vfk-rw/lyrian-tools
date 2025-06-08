"use client"

import React, { useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { RulebookSidebar } from "@/components/rulebook-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

interface TocItem {
  id: string
  title: string
  level: number
  children?: TocItem[]
}

export default function RulebookPage() {
  const [markdownContent, setMarkdownContent] = useState("")
  const [toc, setToc] = useState<TocItem[]>([])
  const [activeSection, setActiveSection] = useState("")

  useEffect(() => {
    // Load markdown content with cache busting to ensure fresh content
    fetch(`/rulebook.md?v=${Date.now()}`)
      .then(response => response.text())
      .then(content => {
        console.log("Rulebook content loaded, length:", content.length)
        setMarkdownContent(content)
        
        // Generate table of contents from markdown
        const tocItems = generateTOC(content)
        console.log("Generated TOC items:", tocItems.length)
        setToc(tocItems)
      })
      .catch(error => console.error("Error loading rulebook:", error))
  }, [])

  useEffect(() => {
    // Set up intersection observer for active section tracking
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter(entry => entry.isIntersecting)
        if (visibleEntries.length > 0) {
          const mostVisible = visibleEntries.reduce((prev, current) =>
            prev.intersectionRatio > current.intersectionRatio ? prev : current
          )
          const id = mostVisible.target.id
          if (id) setActiveSection(id)
        }
      },
      { rootMargin: "-20% 0px -70% 0px" }
    )

    // Observe all headings after markdown is rendered
    const timer = setTimeout(() => {
      document.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach(heading => {
        if (heading.id) observer.observe(heading)
      })
    }, 100)

    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [markdownContent])

  const generateTOC = (content: string): TocItem[] => {
    const lines = content.split('\n')
    const tocItems: TocItem[] = []
    const stack: TocItem[] = []
    let headerCount = 0

    for (const line of lines) {
      const match = line.match(/^(#{1,6})\s+(.+)$/)
      if (match) {
        headerCount++
        const level = match[1].length
        const title = match[2].trim()
        
        // Skip the main document title (H1)
        if (level === 1) continue
        
        // Clean up title by removing markdown formatting
        const cleanTitle = title
          .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
          .replace(/\*(.*?)\*/g, '$1')     // Remove italic
          .replace(/`(.*?)`/g, '$1')       // Remove code
          .trim()
        
        // Generate a clean ID
        const id = cleanTitle.toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
        
        // Skip if we don't have a meaningful title
        if (!cleanTitle || cleanTitle.length < 2) continue
        
        // Treat H2 as top-level items for navigation
        const adjustedLevel = level - 1
        const item: TocItem = { id, title: cleanTitle, level: adjustedLevel, children: [] }
        
        // Find the appropriate parent
        while (stack.length > 0 && stack[stack.length - 1].level >= adjustedLevel) {
          stack.pop()
        }
        
        if (stack.length === 0) {
          tocItems.push(item)
        } else {
          const parent = stack[stack.length - 1]
          if (!parent.children) parent.children = []
          parent.children.push(item)
        }
        
        stack.push(item)
      }
    }
    
    console.log(`Found ${headerCount} headers, generated ${tocItems.length} top-level TOC items`)
    console.log("First few TOC items:", tocItems.slice(0, 3))
    
    return tocItems
  }

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }


  const customComponents = {
    h1: ({children, ...props}: React.HTMLProps<HTMLHeadingElement>) => (
      <h1 id={children?.toString().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')} 
          className="text-4xl font-bold mb-6 mt-8 scroll-mt-20" {...props}>
        {children}
      </h1>
    ),
    h2: ({children, ...props}: React.HTMLProps<HTMLHeadingElement>) => (
      <h2 id={children?.toString().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')} 
          className="text-3xl font-semibold mb-4 mt-8 scroll-mt-20" {...props}>
        {children}
      </h2>
    ),
    h3: ({children, ...props}: React.HTMLProps<HTMLHeadingElement>) => (
      <h3 id={children?.toString().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')} 
          className="text-2xl font-semibold mb-3 mt-6 scroll-mt-20" {...props}>
        {children}
      </h3>
    ),
    h4: ({children, ...props}: React.HTMLProps<HTMLHeadingElement>) => (
      <h4 id={children?.toString().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')} 
          className="text-xl font-semibold mb-3 mt-4 scroll-mt-20" {...props}>
        {children}
      </h4>
    ),
    h5: ({children, ...props}: React.HTMLProps<HTMLHeadingElement>) => (
      <h5 id={children?.toString().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')} 
          className="text-lg font-semibold mb-2 mt-4 scroll-mt-20" {...props}>
        {children}
      </h5>
    ),
    h6: ({children, ...props}: React.HTMLProps<HTMLHeadingElement>) => (
      <h6 id={children?.toString().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')} 
          className="text-base font-semibold mb-2 mt-3 scroll-mt-20" {...props}>
        {children}
      </h6>
    ),
    table: ({children, ...props}: React.HTMLProps<HTMLTableElement>) => (
      <div className="my-6 w-full overflow-auto">
        <table className="w-full border-collapse border border-border" {...props}>
          {children}
        </table>
      </div>
    ),
    th: ({children, ...props}: React.HTMLProps<HTMLTableCellElement>) => (
      <th className="border border-border px-4 py-2 text-left font-semibold bg-muted" {...props}>
        {children}
      </th>
    ),
    td: ({children, ...props}: React.HTMLProps<HTMLTableCellElement>) => (
      <td className="border border-border px-4 py-2" {...props}>
        {children}
      </td>
    ),
    p: ({children, ...props}: React.HTMLProps<HTMLParagraphElement>) => (
      <p className="mb-4 leading-7" {...props}>
        {children}
      </p>
    ),
    ul: ({children, ...props}: React.HTMLProps<HTMLUListElement>) => (
      <ul className="list-disc pl-6 mb-4 space-y-1" {...props}>
        {children}
      </ul>
    ),
    ol: ({children, ...props}: React.OlHTMLAttributes<HTMLOListElement>) => (
      <ol className="list-decimal pl-6 mb-4 space-y-1" {...props}>
        {children}
      </ol>
    ),
    blockquote: ({children, ...props}: React.HTMLProps<HTMLQuoteElement>) => (
      <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground" {...props}>
        {children}
      </blockquote>
    ),
    code: ({children, ...props}: React.HTMLProps<HTMLElement>) => (
      <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props}>
        {children}
      </code>
    ),
    pre: ({children, ...props}: React.HTMLProps<HTMLPreElement>) => (
      <pre className="bg-muted p-4 rounded-lg overflow-x-auto my-4" {...props}>
        {children}
      </pre>
    ),
  }

  return (
    <SidebarProvider>
      <RulebookSidebar 
        toc={toc} 
        activeSection={activeSection} 
        onSectionClick={scrollToSection} 
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Rulebook</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        
        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto p-6">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={customComponents}
              >
                {markdownContent}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}