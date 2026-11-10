const difficultyColor = {
    Easy: "var(--easy)",
    Medium: "var(--medium)",
    Hard: "var(--hard)",
}

// a practice list from a ```problems block in a note (parsed by parseProblems in parse.js).
// problems I've already solved get a check mark, using the slugs from my submissions
export default function ProblemList({ problems, solved }) {
    const done = problems.filter(p => solved.has(p.slug)).length
    return (
        <div className="problems">
            <div className="problems-head">
                <span>Practice</span>
                <span className="problems-count">{done} / {problems.length} solved</span>
            </div>
            <ul>
                {problems.map(p => {
                    const isSolved = solved.has(p.slug)
                    return (
                        <li key={p.slug} className={isSolved ? "solved" : ""}>
                            <span className="problem-check" aria-label={isSolved ? "solved" : "not solved"}>
                                {isSolved ? (
                                    <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                ) : null}
                            </span>
                            <span className="problem-num">{p.num}</span>
                            <div className="problem-main">
                                <a href={`https://leetcode.com/problems/${p.slug}/`} target="_blank" rel="noreferrer">{p.title}</a>
                                {p.note && <span className="problem-note">{p.note}</span>}
                            </div>
                            <span className="problem-diff" style={{ color: difficultyColor[p.difficulty] }}>{p.difficulty}</span>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}
