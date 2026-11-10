import { useEffect, useState } from "react"

// a tiny hash router. the part of the url after "#" picks the page:
//   #/                   -> dashboard
//   #/notes              -> notes home
//   #/notes/backtracking -> one topic's notes
// hash urls need no server config, so this works on vercel as is and links can be shared
function parse() {
    const parts = window.location.hash.replace(/^#\/?/, "").split("/").filter(Boolean)
    return { page: parts[0] || "dashboard", param: parts[1] || null }
}

export function useRoute() {
    const [route, setRoute] = useState(parse)
    useEffect(() => {
        const onChange = () => {
            setRoute(parse())
            window.scrollTo(0, 0) // new page starts at the top, like a normal link
        }
        window.addEventListener("hashchange", onChange)
        return () => window.removeEventListener("hashchange", onChange)
    }, [])
    return route
}

// build a link, e.g. href={to("notes", "backtracking")}
export const to = (...parts) => "#/" + parts.filter(Boolean).join("/")
