import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { API_URL, getJSON, mutate, request } from './api'
import { useRoute, to } from './router'
import Icon from './components/Icon'
import ProfileSidebar from './ProfileSidebar'
import Dashboard from './pages/Dashboard'
import SkillsPage from './pages/SkillsPage'
import RepositoriesPage from './pages/RepositoriesPage'
import ProjectsPage from './pages/ProjectsPage'
import SettingsPage from './pages/SettingsPage'
const NotesPage = lazy(() => import('./pages/NotesPage'))

const NAV = [['dashboard','Dashboard'],['skills','Skills'],['repositories','Repositories'],['projects','Projects'],['notes','Notes']]
const TITLES = {
  dashboard: ['Today', ''],
  skills: ['Skill tracker', 'Practice distribution, targets, and supporting evidence.'],
  repositories: ['Repositories', 'Imported repositories and their skill signals.'],
  projects: ['Project recommendations', 'Choose a project, review its brief, and add it to your build list.'],
  settings: ['Preferences', 'Set your practice targets and manage your GitHub connection.'],
  notes: ['Learning notes', 'Algorithm notes and interactive diagrams from the original tracker.'],
}
const EMPTY_SUBMISSIONS = []

function ConnectDialog({ config, onClose, onConnect, busy }) {
  const dialog = useRef(null)
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  useEffect(() => { const el = dialog.current; el.showModal(); return () => el.close() }, [])
  async function connect(e) {
    e.preventDefault(); setError('')
    if (!/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(username.trim())) { setError('Enter a GitHub username, without @ or a URL.'); return }
    const success = await onConnect(username.trim())
    if (typeof success === 'string') setError(success)
  }
  return <dialog ref={dialog} className="connect-dialog" onCancel={e => { if (busy) e.preventDefault(); else onClose() }} aria-labelledby="connect-title">
    <div className="dialog-top"><span className="dialog-icon"><Icon name="github" size={25} /></span><button className="icon-btn" aria-label="Close connection dialog" disabled={busy} onClick={onClose}><Icon name="close" /></button></div>
    <h2 id="connect-title">Connect GitHub</h2><p className="muted">Start with a public GitHub profile. CodePulse reads its repositories, authored commits, languages, and pull requests.</p>
    <form onSubmit={connect}><label htmlFor="github-username">GitHub username</label><div className="username-input"><span>@</span><input id="github-username" autoFocus autoComplete="off" placeholder="your-username" value={username} onChange={e => setUsername(e.target.value)} disabled={busy} required maxLength={39} /></div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="btn primary full-width" disabled={busy || !username.trim()}>{busy ? 'Reading GitHub activity…' : 'Explore public activity'}<Icon name={busy ? 'refresh' : 'arrow'} size={16} className={busy ? 'spin' : ''} /></button>
    </form><p className="fine-print">Connecting starts a fresh workspace. Export your current build list and manual entries first if you want to keep them.</p><p className="fine-print">Public profile browsing does not verify account ownership. The first import may take a minute; GitHub API limits can reduce coverage.</p>
    {config.oauth_enabled && <><div className="dialog-divider">or connect your own account</div><a className="btn full-width" href={`${API_URL}/api/auth/github`}><Icon name="github" /> Sign in with GitHub</a><p className="fine-print">GitHub handles sign-in. Credentials stay on the backend.</p></>}
  </dialog>
}

export default function App() {
  const route = useRoute()
  const page = TITLES[route.page] ? route.page : 'dashboard'
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [days, setDays] = useState(30)
  const [busy, setBusy] = useState(false)
  const [config, setConfig] = useState({ oauth_enabled:false })
  const [connecting, setConnecting] = useState(false)
  const [toast, setToast] = useState(null)
  const [difficulty, setDifficulty] = useState('intermediate')
  const [recommendations, setRecommendations] = useState([])
  const [retry, setRetry] = useState(0)
  const requestVersion = useRef(0)
  const seenProjects = useRef({})
  const lastActionError = useRef('')

  useEffect(() => {
    const controller = new AbortController()
    const version = ++requestVersion.current
    request(`/dashboard?days=${days}`, { signal:controller.signal }).then(result => {
      if (version === requestVersion.current) {setData(result);setError('');setRecommendations(result.recommendations);setDifficulty('intermediate');seenProjects.current={}}
    }).catch(err => { if (err.name !== 'AbortError' && version === requestVersion.current) setError(err.message) })
    return () => controller.abort()
  }, [days,retry])
  useEffect(() => {getJSON('/config').then(setConfig).catch(() => {})}, [])
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(null), 6500); return () => clearTimeout(timer) }, [toast])
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.has('error') || params.has('auth_error')) {setToast({text:params.get('error') || 'GitHub sign-in was cancelled. You can try again or browse a public username.',error:true}); window.history.replaceState(null,'',window.location.pathname+window.location.hash)}
  }, [])

  async function action(path, body, method = 'POST', message = 'Saved') {
    if (busy) return false
    setBusy(true)
    try {
      await mutate(path,body,method)
      seenProjects.current={}
      const refreshed = await getJSON(`/dashboard?days=${days}`)
      setData(refreshed)
      const recs = await getJSON(`/recommendations?days=${days}&difficulty=${difficulty}`)
      setRecommendations(recs)
      setToast({text:message})
      return true
    } catch (err) {lastActionError.current=err.message;setToast({text:err.message,error:true});return false}
    finally {setBusy(false)}
  }
  async function connect(username) {
    const ok = await action('/connect',{username},'POST','GitHub snapshot imported')
    if (ok) setConnecting(false)
    return ok ? true : lastActionError.current
  }
  async function changeDifficulty(value) {
    setBusy(true)
    try {const result=await getJSON(`/recommendations?days=${days}&difficulty=${value}`);setDifficulty(value);setRecommendations(result);seenProjects.current={}}
    catch(err){setToast({text:err.message,error:true})}finally{setBusy(false)}
  }
  async function reroll(project) {
    if (busy) return
    setBusy(true)
    try {
      const key = `${project.skill_id}:${project.difficulty}`
      const seen = new Set([...(seenProjects.current[key] || []),project.id,...data.projects.map(p=>p.id)])
      let alternatives = await getJSON(`/recommendations?days=${days}&difficulty=${project.difficulty}&exclude=${encodeURIComponent([...seen].join(','))}`)
      let candidate = alternatives.find(p=>p.skill_id === project.skill_id)
      if (!candidate) {
        seen.clear(); [project.id,...data.projects.map(p=>p.id)].forEach(id=>seen.add(id))
        alternatives=await getJSON(`/recommendations?days=${days}&difficulty=${project.difficulty}&exclude=${encodeURIComponent([...seen].join(','))}`)
        candidate=alternatives.find(p=>p.skill_id===project.skill_id)
      }
      seenProjects.current[key]=[...seen]
      if (candidate) setRecommendations(current => current.map(p => p.skill_id === project.skill_id ? candidate : p))
      else setToast({text:'You’ve explored every project for this area and difficulty. Try another difficulty.'})
    } catch(err){setToast({text:err.message,error:true})}finally{setBusy(false)}
  }
  async function exportData() {
    try {
      const payload = await getJSON('/export')
      const url = URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}))
      const link = document.createElement('a');link.href=url;link.download='codepulse-export.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
      setToast({text:'Your snapshot has been exported'})
    }catch(err){setToast({text:err.message,error:true})}
  }
  const saveProject = p => action(`/projects?days=${days}`,{project_id:p.id},'POST','Project added to your build list')
  const disconnect = () => action('/disconnect',undefined,'POST','Disconnected. You’re back in demo mode.')

  if (!data) return <div className="initial-state"><div className="brand-icon"><PulseLogo /></div><h1>CodePulse<span>.</span></h1>{error ? <><p role="alert">{error}</p><p className="muted">Start the FastAPI backend, then try again.</p><button className="btn primary" onClick={()=>setRetry(n=>n+1)}>Try again <Icon name="refresh" /></button></> : <p className="muted">Loading dashboard…</p>}</div>
  const [title,subtitle] = TITLES[page]
  const synced = new Date(data.synced_at)
  const syncLabel = Number.isNaN(synced.getTime()) ? 'Not synced' : `synced ${synced.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}`
  const controls = <div className="page-actions">
    <select aria-label="Activity time range" disabled={busy} value={days} onChange={e => setDays(Number(e.target.value))}><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option><option value={180}>Last 6 months</option></select>
    <button className="icon-btn" title="Export snapshot" aria-label="Export snapshot" onClick={exportData}><Icon name="download" size={16} /></button>
    <button className="icon-btn" title="Sync GitHub" aria-label="Sync GitHub" disabled={busy} onClick={() => action('/sync', undefined, 'POST', data.mode === 'demo' ? 'Demo snapshot refreshed' : 'GitHub snapshot refreshed')}><Icon name="refresh" size={16} className={busy ? 'spin' : ''} /></button>
  </div>
  return <div className="app">
    <a href="#main-content" className="skip-link" onClick={e => { e.preventDefault(); document.getElementById('main-content')?.focus() }}>Skip to content</a>
    <header className="topbar">
      <a className="wordmark" href={to()} aria-label="CodePulse home">CODE <span>·</span> PULSE</a>
      <nav className="main-nav" aria-label="Main navigation">{NAV.map(([key,label]) => <a key={key} href={to(key === 'dashboard' ? '' : key)} className={page === key ? 'active' : ''} aria-current={page === key ? 'page' : undefined}>{label}</a>)}</nav>
      <div className="topbar-actions"><span className={`connection-status ${data.mode === 'demo' ? 'demo' : ''}`} title={data.mode === 'demo' ? 'Fictional sample activity' : syncLabel}><i />{data.mode === 'demo' ? 'Demo data' : data.connection?.verified ? syncLabel : 'Public profile'}</span><a className={`icon-btn preferences-link${page === 'settings' ? ' active' : ''}`} href={to('settings')} aria-label="Preferences"><Icon name="settings" size={17} /></a></div>
    </header>
    <div className="workspace-shell">
      <ProfileSidebar data={data} busy={busy} onConnect={() => setConnecting(true)} />
      <main className={`page-content page-${page}`} id="main-content" tabIndex={-1}>
        <div className="page-heading"><div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{page !== 'settings' && page !== 'notes' && controls}</div>
        {data.mode === 'demo' && <div className="demo-notice"><span className="badge">Demo</span><p>Viewing a fictional developer’s activity.</p><button className="text-link" disabled={busy} onClick={() => setConnecting(true)}>Connect your GitHub</button></div>}
        {error && <div className="notice error" role="alert">{error}<button className="text-link" onClick={()=>setRetry(n=>n+1)}>Try again</button></div>}
        {data.notices?.length > 0 && data.mode==='live' && <details className="coverage-notice"><summary>About this GitHub snapshot · {data.notices.length} coverage notes</summary><ul>{data.notices.map((n,i)=><li key={i}>{n}</li>)}</ul></details>}
        {page==='dashboard' && <Dashboard data={data} onSave={saveProject} onReroll={reroll} busy={busy} recommendations={recommendations} />}
        {page==='skills' && <SkillsPage data={data} busy={busy} onPractice={entry=>action('/practice',entry,'POST','Practice recorded')} />}
        {page==='repositories' && <RepositoriesPage data={data} />}
        {page==='projects' && <ProjectsPage data={data} recommendations={recommendations} difficulty={difficulty} onDifficulty={changeDifficulty} onSave={saveProject} onReroll={reroll} onUpdate={(id,value)=>action(`/projects/${encodeURIComponent(id)}`,value,'PATCH','Project updated')} onRemove={id=>action(`/projects/${encodeURIComponent(id)}`,undefined,'DELETE','Project removed')} busy={busy} />}
        {page==='settings' && <SettingsPage key={`${data.mode}-${data.profile.login}-${JSON.stringify(data.settings)}`} data={data} busy={busy} onConnect={()=>setConnecting(true)} onDisconnect={disconnect} onSave={value=>action('/settings',value,'PUT','Preferences saved')} />}
        {page==='notes' && <Suspense fallback={<div className="card">Loading the learning library…</div>}><NotesPage slug={route.param} submissions={EMPTY_SUBMISSIONS} now={new Date(data.coverage.window_end).getTime()} /></Suspense>}
        <footer className="page-footer"><span>CodePulse</span><span>GitHub activity · UTC</span></footer>
      </main>
    </div>
    {busy && <div className="busy-bar" role="status">Working on your snapshot…</div>}
    {toast && <div className={`toast ${toast.error?'error':''}`} role={toast.error?'alert':'status'}><Icon name={toast.error?'close':'check'} size={18} /><span>{toast.text}</span><button aria-label="Dismiss notification" onClick={()=>setToast(null)}><Icon name="close" size={14} /></button></div>}
    {connecting && <ConnectDialog config={config} busy={busy} onClose={()=>setConnecting(false)} onConnect={connect} />}
  </div>
}
function PulseLogo() {return <svg width="23" height="23" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M2 12h5l3-8 4 16 3-8h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
