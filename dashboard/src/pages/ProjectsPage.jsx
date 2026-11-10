import { useState } from 'react'
import RecommendationPanel from '../components/RecommendationPanel'
import Icon from '../components/Icon'

function PlannedProject({ project, onUpdate, onRemove, busy }) {
  const [url, setUrl] = useState(project.repo_url || '')
  return <article className="card planned-project">
    <div className="flex-between"><span className={`status-badge ${project.status}`}>{project.status.replace('_',' ')}</span><button type="button" className="icon-btn" aria-label={`Remove ${project.title} from plan`} disabled={busy} onClick={() => onRemove(project.id)}><Icon name="close" size={15} /></button></div>
    <h3>{project.title}</h3><p className="muted">{project.description}</p><div className="chips"><span className="chip">{project.skill}</span><span className="chip">{project.difficulty}</span><span className="chip">{project.hours}h estimate</span></div>
    <details><summary>Project milestones</summary><ol className="milestones">{project.milestones.map(m => <li key={m}>{m}</li>)}</ol></details>
    <div className="planner-controls"><label>Status<select value={project.status} disabled={busy} onChange={e => onUpdate(project.id, { status: e.target.value })}><option value="planned">Planned</option><option value="in_progress">In progress</option><option value="completed">Completed</option></select></label>
      <form onSubmit={e => {e.preventDefault(); onUpdate(project.id, { status: project.status, repo_url: url })}}><label>Project repository<input type="url" placeholder="https://github.com/you/project" value={url} onChange={e => setUrl(e.target.value)} /></label><button type="submit" className="btn" disabled={busy}>Link</button></form>
    </div>
  </article>
}
export default function ProjectsPage({ data, recommendations, difficulty, onDifficulty, onSave, onReroll, onUpdate, onRemove, busy }) {
  const [tab, setTab] = useState('discover')
  return <>
    <div className="projects-toolbar"><div className="segment"><button className={tab === 'discover' ? 'active' : ''} onClick={() => setTab('discover')}>Discover projects</button><button className={tab === 'plan' ? 'active' : ''} onClick={() => setTab('plan')}>My build list <span>{data.projects.length}</span></button></div>{tab === 'discover' && <label className="inline-label">Difficulty<select value={difficulty} onChange={e => onDifficulty(e.target.value)} disabled={busy}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label>}</div>
    {tab === 'discover' ? <><div className="info-banner"><Icon name="sparkle" /><p>Small projects with a purpose. Ranked using your target practice mix, recent gaps, and time since you last practiced.</p></div><RecommendationPanel recommendations={recommendations} onSave={onSave} onReroll={onReroll} savedIds={data.projects.map(p => p.id)} busy={busy} /></> : <>
      {!data.projects.length ? <div className="empty-state"><Icon name="projects" size={36} /><h3>Make room for your next idea.</h3><p>Save a recommendation to keep its brief and milestones here.</p><button className="btn primary" onClick={() => setTab('discover')}>Find a project <Icon name="arrow" size={15} /></button></div> : <div className="planned-grid">{data.projects.map(p => <PlannedProject key={p.id} project={p} onUpdate={onUpdate} onRemove={onRemove} busy={busy} />)}</div>}
      <p className="method-note">Completing a plan records your project status. Log practice on the Skills page or sync its GitHub activity to include it in your analytics.</p>
    </>}
  </>
}
