import SubmissionFeed from './components/SubmissionFeed'
import Icon from './components/Icon'
import { to } from './router'

export default function ProfileSidebar({ data, onConnect, busy }) {
  const name = data.profile.name || data.profile.login || 'Developer'
  const initials = name.split(' ').filter(Boolean).map(part => part[0]).slice(0, 2).join('').toUpperCase()
  const stats = [
    ['commits', data.summary.commits],
    ['active days', data.summary.active_days],
    ['tracked repos', data.summary.repositories],
    ['pull requests', data.summary.pull_requests],
  ]
  const activeSkills = data.skills.filter(skill => skill.share > 0)
  return <aside className="profile-sidebar" aria-label="Developer profile and activity summary">
    <section className="sidebar-profile">
      <div className="profile-avatar-wrap">
        <div className="profile-avatar">{data.mode === 'live' && data.profile.avatar_url
          ? <img src={data.profile.avatar_url} alt="" />
          : <span>{initials}</span>}</div>
        <span className={`profile-dot${data.mode === 'demo' ? ' demo' : ''}`} title={data.mode === 'demo' ? 'Demo profile' : 'GitHub profile loaded'} />
      </div>
      <h2 className="profile-name">{name}</h2>
      <small className="profile-handle">{data.mode === 'demo' ? 'Demo workspace' : `@${data.profile.login}`}</small>
      <p className="profile-bio">{data.profile.bio || (data.mode === 'demo' ? 'Fictional activity for exploring CodePulse. Connect GitHub to view your own data.' : 'GitHub activity and skill practice.')}</p>
      <div className="profile-links">
        {data.mode === 'live' && data.profile.html_url && <a className="btn" href={data.profile.html_url} target="_blank" rel="noreferrer">GitHub <Icon name="external" size={12} /></a>}
        <button className="btn" disabled={busy} onClick={onConnect}>{data.mode === 'demo' ? 'Connect GitHub' : 'Switch profile'}</button>
        <a className="btn" href={to('settings')}>Preferences</a>
      </div>
    </section>

    <section className="sidebar-stats" aria-labelledby="stats-heading">
      <div className="sidebar-block-head"><h2 className="block-label" id="stats-heading">Stats</h2><span>{data.window_days} days · UTC</span></div>
      <div className="stat-grid">{stats.map(([label, value]) => <div className="stat" key={label} title={label === 'tracked repos' ? 'Repositories included in the imported snapshot' : `Recorded in the last ${data.window_days} days`}>
        <strong className="stat-value">{value.toLocaleString()}</strong><span className="stat-label">{label}</span>
      </div>)}</div>
      {activeSkills.length > 0 && <div className="sidebar-distribution" aria-label="Skill practice distribution">
        <div className="split-bar">{activeSkills.map(skill => <span key={skill.id} style={{ flex: skill.share, background: skill.color }} title={`${skill.label}: ${skill.share}%`} />)}</div>
        <div className="split-legend">{activeSkills.map(skill => <span key={skill.id}><i className="dot" style={{ background: skill.color }} />{skill.label} <b>{Math.round(skill.share)}%</b></span>)}</div>
      </div>}
    </section>

    <section className="sidebar-recent" aria-labelledby="recent-heading"><h2 className="block-label" id="recent-heading">Recent</h2><SubmissionFeed events={data.feed} limit={5} compact /></section>
    <p className="sidebar-footnote">Activity records practice, not proficiency.</p>
  </aside>
}
