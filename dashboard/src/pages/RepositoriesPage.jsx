import { useState } from 'react'
import Icon from '../components/Icon'
export default function RepositoriesPage({ data }) {
  const [query, setQuery] = useState('')
  const [language, setLanguage] = useState('all')
  const languages = [...new Set(data.repositories.map(r => r.language).filter(Boolean))].sort()
  const repos = data.repositories.filter(r => `${r.name} ${r.description || ''}`.toLowerCase().includes(query.toLowerCase()) && (language === 'all' || r.language === language))
  const colors = Object.fromEntries(data.skills.map(s => [s.id,s.color]))
  return <>
    <div className="repository-toolbar"><label className="search-field"><Icon name="search" /><input aria-label="Search repositories" placeholder="Find a repository…" value={query} onChange={e => setQuery(e.target.value)} /></label><select aria-label="Filter by language" value={language} onChange={e => setLanguage(e.target.value)}><option value="all">All languages</option>{languages.map(l => <option key={l}>{l}</option>)}</select><span className="muted">{repos.length} repositories</span></div>
    <div className="repo-grid">{repos.map(repo => <article className="card repo-card" key={repo.id}>
      <div className="flex-between"><Icon name="repos" /><span className="badge">{repo.fork ? 'Fork' : repo.archived ? 'Archived' : 'Source'}</span></div>
      <h3>{repo.html_url ? <a className="repo-name" href={repo.html_url} target="_blank" rel="noreferrer">{repo.name}<Icon name="external" size={15} /></a> : <span className="repo-name">{repo.name}</span>}</h3><p className="muted repo-description">{repo.description || 'No description added yet.'}</p>
      <div className="chips">{repo.skills.map(id => <span className="chip" key={id} style={{ color: colors[id] }}>{data.skills.find(s => s.id === id)?.label || id}</span>)}</div>
      <div className="language-bar">{Object.entries(repo.languages || {}).map(([name,bytes],i) => <span key={name} title={`${name}: ${bytes.toLocaleString()} bytes`} style={{ flex: bytes, background: data.languages.find(l => l.name === name)?.color || ['#80e7b4','#b5a2f3','#e7c783','#87b9ed'][i%4] }} />)}</div>
      <div className="repo-footer"><span><i className="dot" style={{ background: data.languages.find(l => l.name === repo.language)?.color || '#80e7b4' }} />{repo.language || 'Unspecified'}</span><span>☆ {repo.stars || 0}</span><span>{repo.commits || 0} commits</span></div>
    </article>)}</div>
    {!repos.length && <div className="empty-state"><Icon name="repos" size={32} /><h3>No repositories found</h3><p>Try a different filter, or connect a GitHub profile to import public repositories.</p></div>}
    <section className="card"><div className="card-head"><div><h3 className="card-title">Language footprint</h3><p className="card-sub">Repository bytes across the imported snapshot, not time spent or lines you personally wrote.</p></div></div><div className="language-list">{data.languages.map(l => <div key={l.name}><span><i className="dot" style={{ background: l.color }} />{l.name}</span><strong>{Number(l.share).toFixed(1)}%</strong></div>)}</div></section>
  </>
}
