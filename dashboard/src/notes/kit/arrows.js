import { useId } from "react"

// arrowhead markers are <marker> elements with an id; lines point at them with markerEnd="url(#id)".
// every diagram gets its own id prefix (useId) so two diagrams on one page never clash

export function useArrowBase() {
    return useId().replace(/:/g, "")
}

export const markerUrl = (base, color) => `url(#${base}-${color.replace("#", "")})`
