// small text helpers for the notes

// "Two Pointers: the idea" -> "two-pointers-the-idea", used for heading ids and the "on this page" links
export function slugify(text) {
    return String(text)
        .toLowerCase()
        .replace(/[`*_]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
}

// pull the ## headings out of a note for the table of contents (skipping anything inside ``` code fences)
export function extractHeadings(markdown) {
    const headings = []
    let inFence = false
    for (const line of markdown.split("\n")) {
        if (line.startsWith("```")) inFence = !inFence
        if (inFence) continue
        const m = /^(##)\s+(.*)$/.exec(line)
        if (m) headings.push({ text: m[2].replace(/[`*]/g, ""), id: slugify(m[2]) })
    }
    return headings
}

/**
 * a practice list is written inside a note as a ```problems block, one problem per line:
 *   46 | Permutations | permutations | Medium | the base template
 * (number | title | leetcode slug | difficulty | optional note)
 */
export function parseProblems(text) {
    return text
        .split("\n")
        .map(l => l.trim())
        .filter(Boolean)
        .map(line => {
            const [num, title, slug, difficulty, note] = line.split("|").map(s => s.trim())
            return { num, title, slug, difficulty, note }
        })
}
