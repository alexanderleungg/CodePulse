export default function ReviewQueue({ skills = [] }) {
  const queue = [...skills].filter(skill => Number(skill.target) > 0).sort((a, b) => (b.days_since ?? 10000) - (a.days_since ?? 10000)).slice(0, 3)
  return <section className="card review-card"><div className="card-head"><div><h3 className="card-title">Worth revisiting</h3><p className="card-sub">Give these skills a little time</p></div><span className="cp-small-icon" aria-hidden="true">↗</span></div>
    <ul className="cp-review-list">{queue.map(skill => <li key={skill.id}><i className="dot" style={{ background: skill.color }} /><span>{skill.label}</span><span className="cp-review-recency">{skill.days_since == null ? 'No practice recorded' : skill.days_since === 0 ? 'Practiced today' : `${skill.days_since}d since practice`}</span></li>)}</ul>
    {!queue.length && <p className="empty">Add a target skill to get a practice reminder.</p>}
  </section>
}
