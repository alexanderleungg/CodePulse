import { useEffect, useMemo, useState } from "react"
import { GROUPS, NOTES, noteBySlug } from "../notes/catalog"
import { loadNote } from "../notes/load"
import { extractHeadings } from "../notes/parse"
import NoteRenderer from "../notes/NoteRenderer"
import { to } from "../router"

const DAY = 86400000

// per LeetCode tag: how many unique problems I've solved and how long since I last touched it
function useTopicStats(submissions, now) {
    return useMemo(() => {
        const stats = {}
        for (const s of submissions) {
            for (const t of s.topics || []) {
                const st = stats[t] || (stats[t] = { titles: new Set(), last: 0 })
                st.titles.add(s.title)
                st.last = Math.max(st.last, new Date(s.submitted_at).getTime())
            }
        }
        const out = {}
        for (const [t, st] of Object.entries(stats)) {
            out[t] = { count: st.titles.size, daysAgo: Math.floor((now - st.last) / DAY) }
        }
        return out
    }, [submissions, now])
}

const statLine = st => (st ? `${st.count} solved · ${st.daysAgo}d ago` : "Reference material")

// phones: the sidebar is hidden, so a dropdown jumps between notes instead
function NotesPicker({ current }) {
    return (
        <label className="notes-picker">
            <span className="block-label">Topic</span>
            <select value={current || ""} onChange={e => { window.location.hash = to("notes", e.target.value) }}>
                <option value="">All notes</option>
                {GROUPS.map(g => (
                    <optgroup key={g.name} label={g.name}>
                        {g.notes.map(n => <option key={n.slug} value={n.slug}>{n.title}</option>)}
                    </optgroup>
                ))}
            </select>
        </label>
    )
}

function NotesNav({ current, stats }) {
    return (
        <aside className="notes-nav">
            <a className={`notes-nav-home${current ? "" : " on"}`} href={to("notes")}>All notes</a>
            {GROUPS.map(g => (
                <div key={g.name} className="notes-nav-group">
                    <div className="block-label">{g.name}</div>
                    {g.notes.map(n => (
                        <a key={n.slug} href={to("notes", n.slug)} className={`notes-nav-link${current === n.slug ? " on" : ""}`}>
                            <span>{n.title}</span>

                        </a>
                    ))}
                </div>
            ))}
        </aside>
    )
}

// the notes landing page: topics worth rereading first, then everything by group
function NotesHome({ stats }) {
    // "worth rereading": topics I've practiced before but not in over a month, stalest first.
    // e.g. lots of greedy problems but nothing in 200 days means the patterns are fading
    const stale = NOTES
        .filter(n => stats[n.topic] && stats[n.topic].daysAgo > 30)
        .sort((a, b) => stats[b.topic].daysAgo - stats[a.topic].daysAgo)
        .slice(0, 4)

    return (
        <div className="notes-home">
            <header className="notes-header">
                <div className="block-label">LEARNING LIBRARY</div>
                <h1>Revisit the fundamentals.</h1>
                <p>The original tracker’s algorithm library, kept intact: core ideas, interactive diagrams, commented templates, and worked examples. GitHub activity does not verify LeetCode solves; practice lists are reference material. Log completed practice on the Skill tracker page.</p>
            </header>

            {stale.length > 0 && (
                <section className="notes-section">
                    <h2 className="section-title">Worth rereading</h2>
                    <p className="section-sub">Topics I've practiced before but haven't touched in over a month.</p>
                    <div className="note-grid">
                        {stale.map(n => (
                            <a key={n.slug} href={to("notes", n.slug)} className="note-card stale">
                                <span className="note-card-title">{n.title}</span>
                                <span className="note-card-summary">{n.summary}</span>
                                <span className="note-card-stat">{statLine(stats[n.topic])}</span>
                            </a>
                        ))}
                    </div>
                </section>
            )}

            {GROUPS.map(g => (
                <section key={g.name} className="notes-section">
                    <h2 className="section-title">{g.name}</h2>
                    <div className="note-grid">
                        {g.notes.map(n => (
                            <a key={n.slug} href={to("notes", n.slug)} className="note-card">
                                <span className="note-card-title">{n.title}</span>
                                <span className="note-card-summary">{n.summary}</span>
                                <span className="note-card-stat">{statLine(stats[n.topic])}</span>
                            </a>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    )
}

// highlights the section I'm reading in the "on this page" list
function useActiveHeading(ids) {
    const [active, setActive] = useState(null)
    useEffect(() => {
        const onScroll = () => {
            let current = ids[0] || null
            for (const id of ids) {
                const el = document.getElementById(id)
                if (el && el.getBoundingClientRect().top < 140) current = id
            }
            setActive(current)
        }
        onScroll()
        window.addEventListener("scroll", onScroll, { passive: true })
        return () => window.removeEventListener("scroll", onScroll)
    }, [ids])
    return active
}

function NoteArticle({ slug, stats, solved }) {
    const note = noteBySlug(slug)
    // loaded = { slug, markdown, diagrams } for whichever note finished loading last
    const [loaded, setLoaded] = useState(null)

    useEffect(() => {
        let cancelled = false // ignore a slow load if I've already clicked to another note
        loadNote(slug).then(result => { if (!cancelled) setLoaded({ slug, ...result }) })
        return () => { cancelled = true }
    }, [slug])

    const ready = loaded?.slug === slug
    const headings = useMemo(() => (ready && loaded.markdown ? extractHeadings(loaded.markdown) : []), [ready, loaded])
    const ids = useMemo(() => headings.map(h => h.id), [headings])
    const active = useActiveHeading(ids)

    if (!note) return <div className="empty">No note called "{slug}". <a href={to("notes")}>Back to all notes</a></div>

    const index = NOTES.findIndex(n => n.slug === slug)
    const prev = NOTES[index - 1]
    const next = NOTES[index + 1]
    const st = stats[note.topic]

    return (
        <div className="notes-article-wrap">
            <article className="notes-article">
                <header className="notes-header">
                    <div className="block-label">{note.group}</div>
                    <h1>{note.title}</h1>
                    <p>{note.summary}</p>
                    <div className="chips">
                        <span className="chip">{st ? `${st.count} solved` : "Reference material"}</span>
                        {st && <span className="chip">last practiced {st.daysAgo}d ago</span>}
                        <span className="chip">LeetCode tag: {note.topic}</span>
                    </div>
                </header>

                {!ready && <p className="empty">loading notes…</p>}
                {ready && !loaded.markdown && <p className="empty">This note hasn't been written yet.</p>}
                {ready && loaded.markdown && (
                    <NoteRenderer markdown={loaded.markdown} diagrams={loaded.diagrams} solved={solved} />
                )}

                <nav className="notes-pager">
                    {prev ? (
                        <a href={to("notes", prev.slug)}><small>Previous</small>{prev.title}</a>
                    ) : <span />}
                    {next && (
                        <a href={to("notes", next.slug)} className="next"><small>Next</small>{next.title}</a>
                    )}
                </nav>
            </article>

            {headings.length > 0 && (
                <nav className="notes-toc" aria-label="On this page">
                    <div className="block-label">On this page</div>
                    {headings.map(h => (
                        <a
                            key={h.id}
                            className={active === h.id ? "on" : ""}
                            onClick={e => {
                                // the url hash is used by the router, so scroll by hand instead of jumping with #id
                                e.preventDefault()
                                document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth", block: "start" })
                            }}
                            href={to("notes", slug)}
                        >
                            {h.text}
                        </a>
                    ))}
                </nav>
            )}
        </div>
    )
}

export default function NotesPage({ slug, submissions, now }) {
    const stats = useTopicStats(submissions, now)
    const solved = useMemo(() => new Set(submissions.map(s => s.title_slug)), [submissions])

    return (
        <div className="notes-shell">
            <NotesNav current={slug} stats={stats} />
            <main className="notes-main">
                <NotesPicker current={slug} />
                {slug
                    ? <NoteArticle key={slug} slug={slug} stats={stats} solved={solved} />
                    : <NotesHome stats={stats} />}
            </main>
        </div>
    )
}
