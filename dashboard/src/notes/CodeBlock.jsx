import { useState } from "react"
import { Highlight } from "prism-react-renderer"

// syntax colors tuned for the dark cards. prism tags each piece of code with a type
// (keyword, function, string, ...) and this maps each type to a color
const theme = {
    plain: { color: "#d4d4d8", backgroundColor: "transparent" },
    styles: [
        { types: ["comment"], style: { color: "#6b7280", fontStyle: "italic" } },
        { types: ["keyword", "builtin"], style: { color: "#c4a7ff" } },
        { types: ["function", "class-name"], style: { color: "#7cb4ff" } },
        { types: ["string", "char"], style: { color: "#86efac" } },
        { types: ["number", "boolean", "constant"], style: { color: "#fbbf77" } },
        { types: ["operator"], style: { color: "#a8a8b0" } },
        { types: ["punctuation"], style: { color: "#7d7d86" } },
        { types: ["decorator", "attr-name"], style: { color: "#fcd34d" } },
    ],
}

export default function CodeBlock({ code, language = "python", title }) {
    const [copied, setCopied] = useState(false)

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(code)
            setCopied(true)
            setTimeout(() => setCopied(false), 1400)
        } catch {
            // clipboard can be blocked (http, iframes); nothing useful to do
        }
    }

    return (
        <div className="code">
            <div className="code-head">
                <span>{title || language}</span>
                <button onClick={copy} className="code-copy">{copied ? "copied" : "copy"}</button>
            </div>
            <Highlight theme={theme} code={code} language={language}>
                {({ tokens, getLineProps, getTokenProps }) => (
                    <pre>
                        {tokens.map((line, i) => (
                            <div key={i} {...getLineProps({ line })}>
                                {line.map((token, k) => <span key={k} {...getTokenProps({ token })} />)}
                            </div>
                        ))}
                    </pre>
                )}
            </Highlight>
        </div>
    )
}
