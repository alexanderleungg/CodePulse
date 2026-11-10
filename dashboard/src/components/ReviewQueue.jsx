import { to } from '../router'

export default function ReviewQueue({ skills = [] }) {
  const queue = [...skills].filter(skill => Number(skill.target) > 0).sort((a, b) => (b.days_since ?? 10000) - (a.days_since ?? 10000)).slice(0, 5)
  const gaps = queue.filter(skill => Number(skill.share) < Number(skill.target)).length
  return <section className="card review-card"><div className="card-head"><div><h3 className="card-title">Practice reminders</h3><p className="card-sub">Target skills ordered by time since last recorded practice.</p></div>{gaps > 0 && <span className="cp-review-count">{gaps} below target</span>}</div>
    <ul className="cp-review-list">{queue.map(skill => <li key={skill.id}><i className="dot" style={{ background: skill.color }} /><div className="cp-review-copy"><a href={to('projects')}>{skill.label}</a><span>{Number(skill.share || 0).toFixed(0)}% of practice · {skill.target}% target</span></div><span className={`cp-review-recency${skill.days_since == null || skill.days_since > 30 ? ' stale' : ''}`}>{skill.days_since == null ? 'No evidence yet' : skill.days_since === 0 ? 'Practiced today' : `${skill.days_since}d since practice`}</span></li>)}</ul>
    {!queue.length && <p className="empty">Add a target skill to get a practice reminder.</p>}
  </section>
}
