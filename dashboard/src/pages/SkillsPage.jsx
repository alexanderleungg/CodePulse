import { useState } from 'react'
import TopicRadar from '../components/RadarChart'
import ReviewQueue from '../components/ReviewQueue'
import Icon from '../components/Icon'
import { to } from '../router'

export default function SkillsPage({ data, onPractice, busy }) {
  const [skill, setSkill] = useState('backend')
  const [title, setTitle] = useState('')
  const today = new Date().toISOString().slice(0,10)
  const [date, setDate] = useState(today)
  async function submit(e) {
    e.preventDefault()
    const success = await onPractice({ skill_id: skill, title: title.trim(), date })
    if (success) setTitle('')
  }
  return <>
    <div className="info-banner"><Icon name="skills" /><p>Compare recorded practice with your targets. Adjust targets in Preferences.</p><a href={to('settings')} className="text-link">Edit targets <Icon name="arrow" size={14} /></a></div>
    <div className="skills-grid"><TopicRadar skills={data.skills} /><ReviewQueue skills={data.skills} /></div>
    <section className="card"><div className="card-head"><div><h3 className="card-title">Skill evidence</h3><p className="card-sub">Repository-level estimates. A commit may practice more than one area.</p></div><span className="badge">{data.window_days} day window</span></div>
      <div className="skill-evidence-grid">{data.skills.map(s => <article className="skill-evidence" key={s.id}>
        <div className="flex-between"><h3><i className="dot" style={{ background: s.color }} />{s.label}</h3><strong style={{ color: s.color }}>{Math.round(s.share)}%</strong></div>
        <div className="skill-track"><span style={{ width: `${Math.min(100,s.share)}%`, background: s.color }} /><i style={{ left: `${Math.min(99,s.target)}%` }} title={`Target ${s.target}%`} /></div>
        <p className="muted">Target {s.target}% <span className="separator">·</span> {s.days_since == null ? 'No recorded practice' : `Last practiced ${s.days_since === 0 ? 'today' : `${s.days_since} days ago`}`}</p>
        <ul>{s.evidence?.length ? s.evidence.map((v,i) => <li key={i}>{v}</li>) : <li>No matching evidence in this snapshot. Log practice below to add context.</li>}</ul>
        <div className="evidence-foot"><span>{s.confidence || 'Heuristic'} signal</span><span>{s.trend > 0 ? '+' : ''}{Number(s.trend || 0).toFixed(1)} pp vs. prior period</span></div>
      </article>)}</div>
    </section>
    <section className="card"><div className="card-head"><div><h3 className="card-title">Log practice</h3><p className="card-sub">Log a course, a coding challenge, or a local project. Manual entries are labeled separately.</p></div><Icon name="plus" /></div>
      <form className="practice-form" onSubmit={submit}>
        <label>Skill area<select value={skill} onChange={e => setSkill(e.target.value)}>{data.skills.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
        <label className="grow">What did you practice?<input required maxLength={160} minLength={3} placeholder="e.g. Practiced SQL joins and indexing" value={title} onChange={e => setTitle(e.target.value)} /></label>
        <label>Date<input type="date" value={date} max={today} required onChange={e => setDate(e.target.value)} /></label>
        <button className="btn primary" disabled={busy || title.trim().length < 3}>Log practice <Icon name="plus" size={15} /></button>
      </form>
    </section>
  </>
}
