import { useState } from 'react'

export default function ProjectCard({ project, onSave, saved = false, onReroll, busy = false, compact = false, rank, skillData }) {
  const [expanded, setExpanded] = useState(false)
  if (!project) return null
  const detailId = `project-detail-${project.id}`
  const belowTarget = skillData && Number(skillData.share) < Number(skillData.target)
  const freshness = skillData?.days_since == null ? 'No recent evidence' : skillData.days_since > 30 ? 'Been a while' : belowTarget ? 'Below target' : 'Keep practicing'
  const stale = skillData && (skillData.days_since == null || skillData.days_since > 30)
  return <article className={`cp-project-card${compact ? ' compact' : ''}`}>
    <div className="cp-project-top"><div><span className="cp-project-rank">{String(rank || 1).padStart(2, '0')}</span><h3 className="cp-project-topic">{project.skill || project.skill_id}</h3></div><span className={`cp-project-status${stale ? ' stale' : belowTarget ? ' gap' : ''}`}><i />{skillData ? freshness : project.difficulty}</span></div>
    {skillData && <p className="cp-project-meta">{Number(skillData.share || 0).toFixed(0)}% of practice · {skillData.target}% target · {skillData.days_since == null ? 'no recorded practice' : `last practiced ${skillData.days_since}d ago`}</p>}
    {project.reason && <p className="cp-project-reason">{project.reason}</p>}
    <div className="cp-project-assignment"><span className="cp-assignment-label">PROJECT</span><h4 className="cp-project-title"><button type="button" onClick={() => setExpanded(value => !value)} aria-expanded={expanded} aria-controls={detailId}>{project.title}</button></h4></div>
    <p className="cp-project-description">{project.description}</p>
    <div className="cp-project-tags">{(project.tags || []).map(tag => <span key={tag}>{tag}</span>)}</div>
    {expanded && <div id={detailId} className="cp-project-details"><h4>Milestones</h4><ol>{(project.milestones || []).map(step => <li key={step}>{step}</li>)}</ol>{project.resources?.length > 0 && <div className="cp-project-resources">{project.resources.map(resource => <a href={resource.url} key={resource.url} target="_blank" rel="noreferrer">{resource.label} ↗</a>)}</div>}</div>}
    <div className="cp-project-actions"><button type="button" className="cp-project-detail-btn" onClick={() => setExpanded(value => !value)} aria-expanded={expanded} aria-controls={detailId}>{expanded ? 'Hide brief' : 'View project brief'}</button><div><span className="cp-project-difficulty">{project.difficulty} · {project.hours}h</span>{onReroll && <button type="button" className="cp-project-reroll" onClick={() => onReroll(project)} disabled={busy} title="Find another project" aria-label={`Find another ${project.skill || project.skill_id} project`}>↻</button>}{onSave && <button type="button" className="btn cp-project-save" disabled={saved || busy} onClick={() => onSave(project)}>{saved ? '✓ Saved' : '+ Save project'}</button>}</div></div>
  </article>
}
