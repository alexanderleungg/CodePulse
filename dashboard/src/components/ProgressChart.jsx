import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'

const tickDate = value => new Date(`${value}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })

export default function ProgressChart({ weekly = [] }) {
  return <section className="card progress-card" aria-label="Weekly commits and pull requests">
    <div className="card-head"><div><h3 className="card-title">Coding activity</h3><p className="card-sub">Commits and pull requests by week</p></div><span className="subtle-label">Weekly</span></div>
    {!weekly.length ? <p className="empty">Your first synced activity will appear here.</p> : <div className="cp-chart-wrap" style={{ height: 214 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={weekly} margin={{ top: 10, right: 8, left: -24, bottom: 0 }}>

          <CartesianGrid stroke="#222226" vertical={false} strokeDasharray="3 5" />
          <XAxis dataKey="week" tickFormatter={tickDate} tick={{ fill: '#7d7d86', fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={26} />
          <YAxis allowDecimals={false} tick={{ fill: '#7d7d86', fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip labelFormatter={value => `Week of ${tickDate(value)}`} contentStyle={{ background: '#17171a', border: '1px solid #2c2c31', borderRadius: 10, color: '#ededef', fontSize: 12 }} />
          <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          <Area type="monotone" dataKey="commits" name="Commits" stroke="#22c55e" strokeWidth={2} fill="#22c55e" fillOpacity={0.06} isAnimationActive={false} />
          <Area type="monotone" dataKey="pull_requests" name="Pull requests" stroke="#7cb4ff" strokeWidth={2} fill="transparent" isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>}
  </section>
}
