// Offline render checks: run from dashboard with node src/components/check-render.mjs.
// Vite is used only as a JSX loader in middleware mode; no preview port is opened.
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

const root = fileURLToPath(new URL('../..', import.meta.url))
const loader = await createServer({ root, server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom' })
try {
  const { default: Heatmap } = await loader.ssrLoadModule('/src/components/ActivityHeatmap.jsx')
  for (const windowDays of [30, 90, 180]) {
    const html = renderToStaticMarkup(createElement(Heatmap, {
      windowDays, now: '2026-11-10T18:00:00Z',
      activity: [{ day: '2026-11-09', count: 3 }, { day: '2025-01-01', count: 999 }],
    }))
    assert.equal((html.match(/class="heat-cell"/g) || []).length, windowDays,
      `${windowDays}-day heatmap must render exactly ${windowDays} covered date controls`)
    assert.ok(html.includes(`Last ${windowDays} days`), 'The range label must match its data')
    assert.ok(html.includes('3 recorded activities'), 'Out-of-window activity must not inflate totals')
    assert.ok(html.includes('Nov 9: 3 recorded activities'), 'Activity labels retain their UTC date')
    assert.ok(!html.includes('999 recorded activities'), 'Uncovered dates must not appear as data')
  }
  const { default: ProjectCard } = await loader.ssrLoadModule('/src/components/ProjectCard.jsx')
  const project = { id: 'test-project', skill_id: 'systems', skill: 'Systems', title: 'HTTP server',
    description: 'Build a small server.', reason: 'Systems practice is below your chosen target.',
    difficulty: 'intermediate', hours: 6, tags: ['C++'], milestones: ['Handle a request.'] }
  const compact = renderToStaticMarkup(createElement(ProjectCard, { project, compact: true, onSave() {}, onReroll() {} }))
  assert.ok(compact.includes(project.reason), 'Dashboard compact recommendations must explain their evidence')
  assert.ok(compact.includes('Save project') && compact.includes('View project brief'), 'Project actions remain visible')
  const { default: WeeklyGoal } = await loader.ssrLoadModule('/src/components/WeeklyGoal.jsx')
  assert.ok(renderToStaticMarkup(createElement(WeeklyGoal, { goal: { target: 4, completed: 0, days: [] } })).includes('4 more days'))
  const { default: SubmissionFeed } = await loader.ssrLoadModule('/src/components/SubmissionFeed.jsx')
  const feed = renderToStaticMarkup(createElement(SubmissionFeed, { events: [{ id: 'manual-1', type: 'manual', title: 'SQL practice', date: '2026-11-10T12:00:00Z', url: '', repo: '' }] }))
  assert.ok(feed.includes('SQL practice') && !feed.includes('<a'), 'Manual or fictional events with no URL remain plain text')
  console.log('Component render checks passed: 30/90/180-day windows, compact explanation, empty goal and manual feed.')
} finally {
  await loader.close()
}
