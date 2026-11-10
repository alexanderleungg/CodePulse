import { useState } from 'react'

const DAY = 86400000
const shortDate = value => new Date(`${value}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })

export default function ActivityHeatmap({ activity = [], now, windowDays = 180 }) {
  const [fallbackNow] = useState(() => Date.now())
  const [selected, setSelected] = useState(null)
  const today = new Date(now ?? fallbackNow)
  today.setUTCHours(0, 0, 0, 0)
  const daysInWindow = Math.max(1, Math.min(366, Number(windowDays) || 180))
  const windowStart = today.getTime() - (daysInWindow - 1) * DAY
  const firstDay = new Date(windowStart)
  const start = windowStart - firstDay.getUTCDay() * DAY
  const end = today.getTime() + (6 - today.getUTCDay()) * DAY
  const weeks = Math.round((end - start + DAY) / (7 * DAY))
  const counts = new Map(activity.map(day => [day.day, Number(day.count) || 0]))
  const days = Array.from({ length: weeks * 7 }, (_, index) => {
    const time = start + index * DAY
    const date = new Date(time)
    const key = date.toISOString().slice(0, 10)
    return { key, date, outside: time < windowStart || time > today.getTime(), count: time < windowStart || time > today.getTime() ? 0 : counts.get(key) || 0 }
  })
  const max = Math.max(1, ...days.map(day => day.count))
  const months = days.reduce((result, day, index) => {
    if ((index === 0 || day.date.getUTCDate() === 1) && index < Math.max(1, weeks - 1) * 7) {
      const week = Math.floor(index / 7)
      if (!result.some(month => month.week === week)) result.push({ week, label: day.date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }) })
    }
    return result
  }, [])
  const elapsed = days.filter(day => !day.outside)
  const total = elapsed.reduce((sum, day) => sum + day.count, 0)
  const activeDays = elapsed.filter(day => day.count > 0).length

  return <section className="card heatmap-card" aria-label="Coding activity calendar">
    <div className="card-head">
      <div><h3 className="card-title">Activity calendar</h3><p className="card-sub">{total.toLocaleString()} recorded activities · {activeDays} active days · UTC</p></div>
      <span className="subtle-label">Last {daysInWindow} days</span>
    </div>
    <div className="heat-scroll">
      <div className="heatmap" style={{ '--weeks': weeks, '--heat-min-width': `${weeks * 16 + 26}px` }}>
        <div className="heat-months">{months.map(month => <span key={month.week} style={{ gridColumn: month.week + 1 }}>{month.label}</span>)}</div>
        <div className="heat-days" aria-hidden="true">{['', 'Mon', '', 'Wed', '', 'Fri', ''].map((day, i) => <span key={i}>{day}</span>)}</div>
        <div className="heat-grid" onMouseLeave={() => setSelected(null)}>
          {days.map(day => day.outside ? <span key={day.key} className="heat-cell future" aria-hidden="true" /> : <button key={day.key} type="button" className="heat-cell" data-level={day.count ? Math.ceil(day.count / max * 4) : 0}
            aria-label={`${shortDate(day.key)}: ${day.count} recorded activities`} title={`${shortDate(day.key)}: ${day.count} activities`}
            onMouseEnter={() => setSelected(day)} onFocus={() => setSelected(day)} onBlur={() => setSelected(null)} onClick={() => setSelected(day)} />)}
        </div>
      </div>
    </div>
    <div className="heat-foot"><span className="heat-readout">{selected ? `${shortDate(selected.key)} · ${selected.count} recorded activities` : 'Hover or select a day for details'}</span><span className="heat-scale" aria-hidden="true">Less {[0, 1, 2, 3, 4].map(level => <i key={level} data-level={level} />)} More</span></div>
  </section>
}
