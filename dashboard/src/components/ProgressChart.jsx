import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'

const tickDate = value => new Date(`${value}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })

export default function ProgressChart({ weekly = [] }) {
  return <section className="card progress-card" aria-label="Weekly commits and pull requests">
    <div className="card-head"><div><h3 className="card-title">Your coding rhythm</h3><p className="card-sub">Recorded activity, week by week</p></div><span className="subtle-label">Weekly</span></div>
    {!weekly.length ? <p className="empty">Your first synced activity will appear here.</p> : <div className="cp-chart-wrap" style={{ height: 214 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={weekly} margin={{ top: 10, right: 8, left: -24, bottom: 0 }}>
          <defs><linearGradient id="cpCommitFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#80e7b4" stopOpacity={0.23} /><stop offset="100%" stopColor="#80e7b4" stopOpacity={0} /></linearGradient></defs>
          <CartesianGrid stroke="#2c3334" vertical={false} strokeDasharray="3 5" />
          <XAxis dataKey="week" tickFormatter={tickDate} tick={{ fill: '#a0aba7', fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={26} />
          <YAxis allowDecimals={false} tick={{ fill: '#a0aba7', fontSize: 10 }} tickLine={false} axisLine={false} />
          <Tooltip labelFormatter={value => `Week of ${tickDate(value)}`} contentStyle={{ background: '#202725', border: '1px solid #3b4540', borderRadius: 10, color: '#eef2ee', fontSize: 12 }} />
          <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          <Area type="monotone" dataKey="commits" name="Commits" stroke="#80e7b4" strokeWidth={2} fill="url(#cpCommitFill)" isAnimationActive={false} />
          <Area type="monotone" dataKey="pull_requests" name="Pull requests" stroke="#b5a2f3" strokeWidth={2} fill="transparent" isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>}
  </section>
}
