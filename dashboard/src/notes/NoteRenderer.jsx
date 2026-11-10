import { memo, useMemo } from "react"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import CodeBlock from "./CodeBlock"
import ProblemList from "./ProblemList"
import { slugify, parseProblems } from "./parse"

// flatten React children back to plain text (for heading ids)
function textOf(children) {
    if (typeof children === "string" || typeof children === "number") return String(children)
    if (Array.isArray(children)) return children.map(textOf).join("")
    if (children?.props) return textOf(children.props.children)
    return ""
}

/**
 * renders one note's markdown. three kinds of fenced blocks get special treatment:
 *   ```python        highlighted code with a copy button (add title="..." after the language for a label)
 *   ```diagram       the block's text is a diagram id from diagrams/<slug>.jsx
 *   ```problems      a practice list (see parseProblems in parse.js)
 */
function NoteRenderer({ markdown, diagrams, solved }) {
    // useMemo keeps these the SAME functions between renders. react-markdown uses them as component types,
    // and a brand new function each render looks like a different component to React, which would
    // unmount and remount every diagram (resetting a stepper to step 1 whenever the page re-renders)
    const components = useMemo(() => ({
        h2: ({ children }) => <h2 id={slugify(textOf(children))}>{children}</h2>,
        h3: ({ children }) => <h3 id={slugify(textOf(children))}>{children}</h3>,
        a: ({ href, children }) => {
            const external = href?.startsWith("http")
            return <a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>{children}</a>
        },
        table: ({ children }) => <div className="table-wrap"><table>{children}</table></div>,
        blockquote: ({ children }) => <blockquote className="callout">{children}</blockquote>,
        // fenced code blocks arrive as <pre><code class="language-x">...</code></pre>
        pre: ({ node, children }) => {
            const code = children?.props || {}
            const lang = /language-(\w+)/.exec(code.className || "")?.[1]
            const text = textOf(code.children).replace(/\n$/, "")
            const meta = node?.children?.[0]?.data?.meta || ""
            const title = /title="([^"]+)"/.exec(meta)?.[1]

            if (lang === "diagram") {
                const Diagram = diagrams[text.trim()]
                return Diagram ? <Diagram /> : <div className="missing">missing diagram: {text}</div>
            }
            if (lang === "problems") {
                return <ProblemList problems={parseProblems(text)} solved={solved} />
            }
            return <CodeBlock code={text} language={lang || "text"} title={title} />
        },
    }), [diagrams, solved])

    return (
        <div className="prose">
            <Markdown remarkPlugins={[remarkGfm]} components={components}>
                {markdown}
            </Markdown>
        </div>
    )
}

// memo: skip re-rendering the whole note when only the parent changed (like the "on this page" highlight on scroll)
export default memo(NoteRenderer)
