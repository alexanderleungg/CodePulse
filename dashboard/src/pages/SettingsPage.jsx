import { useState } from 'react'
import Icon from '../components/Icon'
const PRESETS = {
  'Full-stack': {frontend:30,backend:25,databases:20,algorithms:15,systems:10},
  'Frontend': {frontend:60,backend:15,databases:10,algorithms:10,systems:5},
  'Backend': {frontend:5,backend:40,databases:30,algorithms:15,systems:10},
  'Systems': {frontend:0,backend:15,databases:10,algorithms:25,systems:50},
}
export default function SettingsPage({ data, onSave, onConnect, onDisconnect, busy }) {
  const [targets, setTargets] = useState(data.settings.targets)
  const [goal, setGoal] = useState(data.settings.weekly_goal)
  const total = Object.values(targets).reduce((a,b) => a + Number(b), 0)
  return <>
    <section className="card settings-card"><div className="card-head"><div><h3 className="card-title">Practice targets</h3><p className="card-sub">Choose the share of practice you want to spend on each skill. Targets must total 100%.</p></div><Icon name="skills" /></div>
      <div className="presets">{Object.entries(PRESETS).map(([name,value]) => <button className="btn" key={name} disabled={busy} onClick={() => setTargets(value)}>{name}</button>)}</div>
      <form onSubmit={e => { e.preventDefault(); onSave({targets, weekly_goal:Number(goal)}) }}>
        <div className="target-inputs">{data.skills.map(s => <div className="target-row" key={s.id}><label htmlFor={`target-${s.id}`}><i className="dot" style={{ background: s.color }} />{s.label}</label><input aria-label={`${s.label} target slider`} type="range" min="0" max="100" step="5" value={targets[s.id] || 0} onChange={e => setTargets({...targets,[s.id]:Number(e.target.value)})} /><div className="percent-input"><input id={`target-${s.id}`} type="number" min="0" max="100" required value={targets[s.id] ?? 0} onChange={e => setTargets({...targets,[s.id]:e.target.value === '' ? '' : Number(e.target.value)})} /><span>%</span></div></div>)}</div>
        <p className={total === 100 ? 'target-total valid' : 'target-total'}>Total: {total}% <span>{total === 100 ? '✓ Ready to save' : 'Targets must add up to 100%'}</span></p>
        <div className="weekly-setting"><div><label htmlFor="weekly-goal">Weekly practice goal</label><p className="muted">Days with GitHub activity or manual practice.</p></div><select id="weekly-goal" value={goal} onChange={e => setGoal(e.target.value)}>{[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n} days / week</option>)}</select></div>
        <button className="btn primary" disabled={busy || total !== 100}>Save preferences <Icon name="check" size={15} /></button>
      </form>
    </section>
    <section className="card settings-card"><div className="card-head"><div><h3 className="card-title">GitHub connection</h3><p className="card-sub">{data.mode === 'demo' ? 'You’re exploring a fictional developer snapshot.' : `Viewing @${data.profile.login}. Your snapshot is stored server-side for this browser session.`}</p></div><Icon name="github" /></div><div className="connection-actions"><button className="btn" disabled={busy} onClick={onConnect}>{data.mode === 'demo' ? 'Connect GitHub' : 'Switch profile'}</button>{data.mode === 'live' && <button className="btn danger" disabled={busy} onClick={onDisconnect}>Disconnect & clear session</button>}</div></section>
    <section className="card settings-card"><h3 className="card-title">How CodePulse reads your activity</h3><div className="methodology"><p>Commits and pull requests show what you have practiced. Repository languages, dependencies, and file paths provide hints about skill areas. These are estimates; a commit can touch several skills and its weight is split between them.</p><p>Recommendations prioritize the difference between your desired practice mix and recorded activity, adjusted for recency. Language bytes describe the imported repositories, not your personal contribution or coding time.</p><p>GitHub’s REST API provides a bounded snapshot. Missing private work, activity outside imported repositories, unmerged branches, and local learning can leave gaps. Manual entries help fill those gaps.</p><p>Preferences and build lists are tied to this browser’s session cookie. CodePulse does not infer programming proficiency or verify ownership when you browse a public username.</p></div></section>
  </>
}
