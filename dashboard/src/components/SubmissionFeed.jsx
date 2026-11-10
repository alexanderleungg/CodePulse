const formatDate = value => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Unknown date' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}
function EventIcon({ type }) {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">{type === 'pull_request' ? <><circle cx="6" cy="5" r="2" /><circle cx="6" cy="19" r="2" /><circle cx="18" cy="19" r="2" /><path d="M6 7v10M18 17V9a4 4 0 0 0-4-4h-2m0 0 3-3m-3 3 3 3" /></> : type === 'manual' ? <><path d="M4 4h6a3 3 0 0 1 3 3v14a3 3 0 0 0-3-3H4zm16 0h-4a3 3 0 0 0-3 3v14a3 3 0 0 1 3-3h4z" /></> : <><path d="M2 12h6m8 0h6" /><circle cx="12" cy="12" r="4" /></>}</svg>
}

export default function SubmissionFeed({ events = [], limit = 6 }) {
  if (!events.length) return <p className="empty">No recent activity. Sync GitHub or log some practice.</p>
  return <ul className="cp-event-feed">{events.slice(0, limit).map(event => <li className="cp-event" key={event.id}>
    <span className={`cp-event-icon event-${event.type}`}><EventIcon type={event.type} /></span>
    <div className="cp-event-copy">{event.url ? <a href={event.url} target="_blank" rel="noreferrer" className="cp-event-title">{event.title}</a> : <span className="cp-event-title">{event.title}</span>}<span className="cp-event-meta">{event.repo || 'Manual practice'} · {event.type === 'pull_request' ? 'Pull request' : event.type === 'manual' ? 'Learning log' : 'Commit'}</span></div>
    <time className="cp-event-date" dateTime={event.date}>{formatDate(event.date)}</time>
  </li>)}</ul>
}
