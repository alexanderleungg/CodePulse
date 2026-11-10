import { useState } from 'react'

export default function ProjectCard({ project, onSave, saved = false, onReroll, busy = false, compact = false }) {
  const [expanded, setExpanded] = useState(false)
  if (!project) return null
  const detailId = `project-detail-${project.id}`
  return <article className={`cp-project-card${compact ? ' compact' : ''}`}>
    <div className="cp-project-top"><span className="cp-project-skill">{project.skill || project.skill_id}</span><span className="cp-project-difficulty">{project.difficulty} <span aria-hidden="true">·</span> {project.hours}h</span></div>
    <h3 className="cp-project-title">{project.title}</h3>
    <p className="cp-project-description">{project.description}</p>
    {project.reason && <div className="cp-project-reason"><span className="cp-reason-label">Why this project</span><p>{project.reason}</p></div>}
    <div className="cp-project-tags">{(project.tags || []).map(tag => <span key={tag}>{tag}</span>)}</div>
    {expanded && <div id={detailId} className="cp-project-details"><h4>Make it yours</h4><ol>{(project.milestones || []).map(step => <li key={step}>{step}</li>)}</ol>{project.resources?.length > 0 && <div className="cp-project-resources">{project.resources.map(resource => <a href={resource.url} key={resource.url} target="_blank" rel="noreferrer">{resource.label} ↗</a>)}</div>}</div>}
    <div className="cp-project-actions"><button type="button" className="cp-project-detail-btn" onClick={() => setExpanded(value => !value)} aria-expanded={expanded} aria-controls={detailId}>{expanded ? 'Hide brief' : 'View project brief'} <span aria-hidden="true">↗</span></button><div>{onReroll && <button type="button" className="cp-project-reroll" onClick={() => onReroll(project)} disabled={busy} title="Find another project" aria-label={`Find another ${project.skill || project.skill_id} project`}>↻</button>}{onSave && <button type="button" className="btn cp-project-save" disabled={saved || busy} onClick={() => onSave(project)}>{saved ? '✓ Saved' : '+ Save project'}</button>}</div></div>
  </article>
}
