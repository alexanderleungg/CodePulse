import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts'

export default function TopicRadar({ skills = [] }) {
  const data = skills.map(skill => ({ ...skill, practice: Number(skill.share) || 0, target: Number(skill.target) || 0 }))
  return <section className="card radar-card" aria-label="Practice distribution compared with your target">
    <div className="card-head"><div><h3 className="card-title">Find your balance</h3><p className="card-sub">Practice share vs. your personal target</p></div></div>
    {!data.length ? <p className="empty">Set a skill target to see your practice mix.</p> : <div className="cp-chart-wrap" style={{ height: 250 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="68%">
          <PolarGrid stroke="#37413c" />
          <PolarAngleAxis dataKey="label" tick={{ fill: '#b4bdb8', fontSize: 11 }} />
          <Tooltip formatter={(value, name) => [`${Number(value).toFixed(1)}%`, name]} contentStyle={{ background: '#202725', border: '1px solid #3b4540', borderRadius: 10, color: '#eef2ee', fontSize: 12 }} />
          <Radar name="Your target" dataKey="target" stroke="#8b9690" strokeDasharray="5 5" fill="transparent" isAnimationActive={false} />
          <Radar name="Recent practice" dataKey="practice" stroke="#80e7b4" strokeWidth={2} fill="#80e7b4" fillOpacity={0.16} isAnimationActive={false} />
        </RadarChart>
      </ResponsiveContainer>
    </div>}
    <div className="cp-chart-legend"><span><i style={{ background: '#80e7b4' }} />Recent practice</span><span><i className="legend-target" />Your target</span></div>
  </section>
}
