export default function WeeklyGoal({ goal, focus = [] }) {
  const target = Math.max(1, Number(goal?.target) || 4)
  const completed = Math.max(0, Number(goal?.completed) || 0)
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(1, completed / target)
  return <section className="card goal-card">
    <div className="card-head"><div><h3 className="card-title">Weekly goal</h3><p className="card-sub">Practice on {target} days this week. GitHub activity and manual entries count toward your goal.</p></div></div>
    <div className="cp-goal-body"><div className="cp-goal-ring" role="img" aria-label={`${completed} of ${target} active days this week`}><svg width="100" height="100" viewBox="0 0 88 88" aria-hidden="true"><circle cx="44" cy="44" r={radius} fill="none" stroke="#19191d" strokeWidth="6" /><circle cx="44" cy="44" r={radius} fill="none" stroke="#22c55e" strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress)} transform="rotate(-90 44 44)" /></svg><div className="cp-goal-ring-label"><strong>{completed}</strong><span>of {target} days</span></div></div>
      <div><p className="cp-goal-message">{completed >= target ? 'Weekly goal reached.' : `${target - completed} more ${target - completed === 1 ? 'day' : 'days'} to your goal.`}</p><div className="cp-goal-days">{(goal?.days || []).map(day => <span key={day.day} className={`cp-goal-day${day.active ? ' on' : ''}${day.today ? ' today' : ''}`} title={`${day.day}${day.active ? ': active' : ': no activity'}`}>{day.label?.slice(0, 1) || new Date(`${day.day}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'narrow', timeZone: 'UTC' })}</span>)}</div></div>
    </div>
    {focus.length > 0 && <div className="cp-goal-focus"><span>FOCUS</span><div>{focus.map(label => <span className="chip" key={label}>{label}</span>)}</div></div>}
  </section>
}
