import ProjectCard from './ProjectCard'

export default function RecommendationPanel({ recommendations = [], onSave, savedIds = [], onReroll, busy = false }) {
  if (!recommendations.length) return <div className="card"><p className="empty">No project suggestions for these filters. Try another difficulty or set a skill target.</p></div>
  return <div className="cp-project-grid">{recommendations.map(project => <ProjectCard key={project.id} project={project} onSave={onSave} saved={savedIds.includes(project.id)} onReroll={onReroll} busy={busy} />)}</div>
}
