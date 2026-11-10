import ProgressChart from '../components/ProgressChart'
import ActivityHeatmap from '../components/ActivityHeatmap'
import TopicChart from '../components/TopicChart'
import TopicRadar from '../components/RadarChart'
import WeeklyGoal from '../components/WeeklyGoal'
import ReviewQueue from '../components/ReviewQueue'
import ProjectCard from '../components/ProjectCard'
import SubmissionFeed from '../components/SubmissionFeed'
import { to } from '../router'

function Section({ title, description, action, children }) {
  return <section className="dashboard-section">
    <div className="section-head"><div><h2 className="section-title">{title}</h2>{description && <p className="section-sub">{description}</p>}</div>{action}</div>
    {children}
  </section>
}

export default function Dashboard({ data, onSave, onReroll, busy, recommendations }) {
  const projects = (recommendations || data.recommendations).slice(0, 4)
  return <>
    <section aria-label="This week's practice" className="today-grid">
      <WeeklyGoal goal={data.goal} focus={projects.slice(0, 3).map(project => project.skill)} />
      <ReviewQueue skills={data.skills} />
    </section>

    <Section title="What to build next" description="Projects ranked by your target skill mix, recent practice, and time since you last used each skill."
      action={<a className="text-link" href={to('projects')}>All projects →</a>}>
      <div className="recommendation-grid">{projects.map((project, index) => <ProjectCard
        key={project.id} project={project} rank={index + 1}
        skillData={data.skills.find(skill => skill.id === project.skill_id)}
        onSave={onSave} onReroll={onReroll} busy={busy}
        saved={data.projects.some(saved => saved.id === project.id)}
      />)}</div>
      {!projects.length && <p className="empty">Set a skill target in Preferences to get project suggestions.</p>}
    </Section>

    <Section title="Skill coverage"><div className="coverage-grid"><TopicRadar skills={data.skills} /><TopicChart skills={data.skills} /></div></Section>
    <Section title="Activity"><div className="activity-grid"><ActivityHeatmap activity={data.activity} now={new Date(data.coverage.window_end).getTime()} windowDays={data.window_days} /><ProgressChart weekly={data.weekly} /></div></Section>
    <Section title="Recent activity" action={<a className="text-link" href={to('repositories')}>Repositories →</a>}><div className="card"><SubmissionFeed events={data.feed} limit={6} /></div></Section>
    <p className="method-note">Skill categories are inferred from repository signals and manual entries. They describe practice, not proficiency. <a href={to('skills')}>View the evidence</a></p>
  </>
}
