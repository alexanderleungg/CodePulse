export default function TopicChart({ skills = [] }) {
  return <section className="card topic-card" aria-label="Coding activity by skill area">
    <div className="card-head"><div><h3 className="card-title">Where your code takes you</h3><p className="card-sub">Share of classified practice · marker shows your target</p></div><span className="subtle-label">Practice mix</span></div>
    <div className="cp-skill-bars">
      {skills.map(skill => <div className="cp-skill-row" key={skill.id}>
        <div className="cp-skill-label"><span><i className="dot" style={{ background: skill.color }} />{skill.label}</span><strong>{Number(skill.share || 0).toFixed(0)}<small>%</small></strong></div>
        <div className="cp-skill-track" role="meter" aria-label={`${skill.label} practice share`} aria-valuenow={Number(skill.share) || 0} aria-valuemin={0} aria-valuemax={100} aria-valuetext={`${Number(skill.share || 0).toFixed(1)} percent practice, ${skill.target} percent target`}><span className="cp-skill-fill" style={{ width: `${Math.min(100, Math.max(0, skill.share || 0))}%`, background: skill.color }} /><i className="cp-target-marker" style={{ left: `${Math.min(99, Math.max(0, skill.target || 0))}%` }} title={`Target: ${skill.target}%`} /></div>
      </div>)}
      {!skills.length && <p className="empty">No classified practice in this period yet.</p>}
    </div>
    <p className="cp-chart-note">A view of what you practiced, not a measure of proficiency.</p>
  </section>
}
