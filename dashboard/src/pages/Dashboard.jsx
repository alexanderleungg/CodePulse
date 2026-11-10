import ProgressChart from '../components/ProgressChart'
import ActivityHeatmap from '../components/ActivityHeatmap'
import TopicChart from '../components/TopicChart'
import WeeklyGoal from '../components/WeeklyGoal'
import SubmissionFeed from '../components/SubmissionFeed'
import ProjectCard from '../components/ProjectCard'
import Icon from '../components/Icon'
import { to } from '../router'

export default function Dashboard({ data, onSave, onReroll, busy, recommendation }) {
  const stats = [
    ['Commits', data.summary.commits, 'commit', 'Authored in this period'],
    ['Repositories', data.summary.repositories, 'repos', 'Included in your snapshot'],
    ['Active days', data.summary.active_days, 'calendar', 'Days with recorded practice'],
    ['Pull requests', data.summary.pull_requests, 'branch', 'Opened in this period'],
  ]
  const selected = recommendation || data.recommendations[0]
  return <>
    <div className="stat-row">{stats.map(([label, value, icon, sub]) => <div className="stat-card" key={label}>
      <div className="stat-top"><span>{label}</span><Icon name={icon} /></div>
      <strong>{value.toLocaleString()}</strong><small>{sub}</small>
    </div>)}</div>
    <div className="overview-primary">
      <ProgressChart weekly={data.weekly} />
      <section className="next-project"><div className="eyebrow"><Icon name="sparkle" size={14} /> YOUR NEXT CHALLENGE</div>
        {selected ? <ProjectCard project={selected} onSave={onSave} saved={data.projects.some(p => p.id === selected.id)} onReroll={onReroll} busy={busy} compact /> : <p className="muted">Set a skill target to find your next project.</p>}
      </section>
    </div>
    <ActivityHeatmap activity={data.activity} now={new Date(data.coverage.window_end).getTime()} windowDays={data.window_days} />
    <div className="overview-secondary"><TopicChart skills={data.skills} /><WeeklyGoal goal={data.goal} /></div>
    <section className="card"><div className="card-head"><div><h3 className="card-title">Recent activity</h3><p className="card-sub">A little progress, one commit at a time.</p></div><a className="text-link" href={to('repositories')}>View repositories <Icon name="arrow" size={14} /></a></div><SubmissionFeed events={data.feed} limit={5} /></section>
    <div className="method-note"><Icon name="shield" size={16} /><p>Activity is evidence of practice, not a measure of proficiency. Skills are inferred from repository signals and your manual entries. <a href={to('skills')}>See the evidence <span aria-hidden="true">↗</span></a></p></div>
  </>
}
