/** User-flow checks in a simulated DOM. Does not start a browser or HTTP server.
 * Fixture is generated from ml.demo + ml.analytics with a fixed fictional date.
 * API and chart layout are mocked; this validates app interactions, not visuals.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { JSDOM } from 'jsdom'
import { createServer } from 'vite'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const fixtures = JSON.parse(await fs.readFile(path.join(root, 'scripts/fixtures/demo.json'), 'utf8'))
const clone = value => structuredClone(value)
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url:'http://localhost:5173/', pretendToBeVisual:true })
for (const name of ['window','document','navigator','HTMLElement','HTMLInputElement','HTMLSelectElement','HTMLDialogElement','Node','Event','MouseEvent','HashChangeEvent','getComputedStyle']) {
  Object.defineProperty(globalThis,name,{configurable:true,value:dom.window[name]})
}
window.scrollTo = () => {}
// jsdom has no layout; these warnings cannot assess real chart geometry.
const originalWarn=console.warn
console.warn=(...args)=>{if(typeof args[0]==="string" && /^The width\(/.test(args[0]) && /chart should be greater than 0/.test(args[0])) return; originalWarn(...args)}
window.matchMedia = () => ({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}})
window.HTMLDialogElement.prototype.showModal = function () {this.open = true}
window.HTMLDialogElement.prototype.close = function () {this.open = false}
globalThis.ResizeObserver = class {observe(){} unobserve(){} disconnect(){}}
globalThis.requestAnimationFrame = callback => setTimeout(callback,0)
globalThis.cancelAnimationFrame = clearTimeout
globalThis.IS_REACT_ACT_ENVIRONMENT = true
const requests = []
let state = {mode:'demo',profile:null,settings:clone(fixtures.windows['30'].settings),projects:[],manual:[]}
let failNextSync = false
let failNextDashboard = false
function dashboard(days) {
  const value = clone(fixtures.windows[String(days)])
  value.mode = state.mode
  if (state.profile) value.profile = clone(state.profile)
  value.settings = clone(state.settings)
  value.projects = clone(state.projects)
  for (const skill of value.skills) skill.target = state.settings.targets[skill.id]
  value.feed = [...state.manual,...value.feed]
  return value
}
function projectsFor(days,difficulty,exclude=[]) {
  const seen = new Set(exclude)
  const bySkill = new Map()
  for (const project of fixtures.catalog[String(days)][difficulty]) {
    if (!seen.has(project.id) && !bySkill.has(project.skill_id)) bySkill.set(project.skill_id,clone(project))
  }
  return [...bySkill.values()]
}
function reply(body,status=200) {
  return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}})
}
globalThis.fetch = async (input,options={}) => {
  const url = new URL(String(input),'http://localhost:5173')
  const method = options.method || 'GET'
  const body = options.body ? JSON.parse(options.body) : undefined
  const record = {path:url.pathname,query:url.searchParams,method,body,headers:options.headers}
  requests.push(record)
  if (options.signal?.aborted) throw new DOMException('Aborted','AbortError')
  if (method !== 'GET') assert.equal(options.headers['X-CodePulse-Request'],'1','Writes must send the CSRF boundary header')
  const days = Number(url.searchParams.get('days') || 30)
  switch (url.pathname) {
    case '/api/config': return reply({oauth_enabled:false})
    case '/api/dashboard':
      if(failNextDashboard){failNextDashboard=false;return reply({detail:'The API is temporarily unavailable.'},503)}
      return reply(dashboard(days))
    case '/api/recommendations': return reply(projectsFor(days,url.searchParams.get('difficulty') || 'intermediate',(url.searchParams.get('exclude') || '').split(',')))
    case '/api/projects': {
      assert.equal(method,'POST')
      const project = Object.values(fixtures.catalog[String(days)]).flat().find(p=>p.id===body.project_id)
      assert.ok(project,'Saved project exists in the catalog')
      if (!state.projects.some(p=>p.id===project.id)) state.projects.push({...clone(project),status:'planned',repo_url:'',created_at:'2026-11-10T18:00:00Z'})
      return reply(dashboard(days))
    }
    case '/api/settings':
      assert.equal(method,'PUT');state.settings=clone(body);return reply(dashboard(days))
    case '/api/connect':
      assert.match(body.username,/^[\w-]+$/)
      state={...state,mode:'live',profile:{login:body.username,name:'Connected Developer',avatar_url:'',html_url:`https://github.com/${body.username}`,bio:'Public activity fixture.'},projects:[],manual:[]}
      return reply(dashboard(days))
    case '/api/practice':
      state.manual.unshift({id:'manual:test',type:'manual',title:body.title,date:`${body.date}T12:00:00Z`,repo:'Manual learning entry',url:'',skills:[body.skill_id]})
      return reply(dashboard(days))
    case '/api/sync':
      if(failNextSync){failNextSync=false;return reply({detail:'GitHub rate limit reached. Try again later.'},429)}
      return reply(dashboard(days))
    case '/api/disconnect': state={mode:'demo',profile:null,settings:clone(fixtures.windows['30'].settings),projects:[],manual:[]};return reply(dashboard(days))
    default:
      if(url.pathname.startsWith('/api/projects/')) {
        const id=decodeURIComponent(url.pathname.split('/').at(-1))
        if(method==='PATCH') state.projects=state.projects.map(p=>p.id===id ? {...p,...body} : p)
        else if(method==='DELETE') state.projects=state.projects.filter(p=>p.id!==id)
        else assert.fail(`Unexpected project method ${method}`)
        return reply(dashboard(days))
      }
      assert.fail(`Unexpected API request: ${method} ${url.pathname}`)
  }
}
const React = await import('react')
const {act} = React
const {createRoot} = await import('react-dom/client')
const server = await createServer({root,server:{middlewareMode:true,hmr:false,watch:null},appType:'custom',logLevel:'error'})
const {default:App} = await server.ssrLoadModule('/src/App.jsx')
const container=document.getElementById('root')
const reactRoot=createRoot(container)
const text = node => node.textContent.replace(/\s+/g,' ').trim()
const findButton = (match,scope=document) => {
  const found=[...scope.querySelectorAll('button')].find(el=>typeof match==='string' ? text(el)===match : match.test(text(el)))
  assert.ok(found,`Button exists: ${match}`)
  return found
}
const get = selector => {const el=document.querySelector(selector);assert.ok(el,`Element exists: ${selector}`);return el}
async function settle() {await new Promise(resolve=>setTimeout(resolve,20))}
async function click(el) {assert.ok(!el.disabled,`Button is enabled: ${text(el)}`);await act(async()=>{el.dispatchEvent(new window.MouseEvent('click',{bubbles:true}));await settle()})}
async function input(el,value) {
  const prototype=el.tagName==='SELECT' ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype
  const setter=Object.getOwnPropertyDescriptor(prototype,'value').set
  await act(async()=>{setter.call(el,value);el.dispatchEvent(new window.Event(el.tagName==='SELECT' ? 'change' : 'input',{bubbles:true}));await settle()})
}
async function submit(form){await act(async()=>{form.dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));await settle()})}
async function navigate(page) {
  const link=get(`a[href="#/${page==='dashboard' ? '' : page}"]`)
  await act(async()=>{window.history.replaceState(null,'',link.getAttribute('href'));window.dispatchEvent(new window.HashChangeEvent('hashchange'));await settle()})
}
let passed=0
async function check(name,run){await run();passed++;console.log(`ok ${passed} - ${name}`)}
try {
  await check('dashboard starts with a labeled fictional workspace',async()=>{
    await act(async()=>{reactRoot.render(React.createElement(App));await settle()})
    assert.equal(text(get('main h1')),'Today')
    assert.match(text(get('.demo-notice')),/fictional developer/)
    assert.equal(get('.topbar nav[aria-label="Main navigation"] a[aria-current="page"]').textContent,'Dashboard')
    assert.equal(document.querySelectorAll('.profile-sidebar .stat').length,4,'Profile sidebar exposes four summary statistics')
    assert.deepEqual([...document.querySelectorAll('.profile-sidebar .stat-value')].map(text),[fixtures.windows['30'].summary.commits,fixtures.windows['30'].summary.active_days,fixtures.windows['30'].summary.repositories,fixtures.windows['30'].summary.pull_requests].map(value=>value.toLocaleString()))
    assert.equal(get('.today-grid').children[0],get('.goal-card'),'Today starts with the weekly goal')
    assert.equal(get('.today-grid').children[1],get('.review-card'),'Practice reminders sit beside the goal')
    assert.ok(get('.today-grid').compareDocumentPosition(get('.recommendation-grid')) & Node.DOCUMENT_POSITION_FOLLOWING,'Recommendations follow Today’s practice controls')
    assert.equal(get('.sidebar-profile small').textContent,'Demo workspace')
    assert.ok(requests.some(r=>r.path==='/api/dashboard' && r.query.get('days')==='30'))
  })
  await check('skill tracker exposes evidence and saves manual practice',async()=>{
    await navigate('skills')
    assert.match(document.body.textContent,/Skill evidence/)
    assert.equal(document.querySelectorAll('.skill-evidence').length,5)
    await input(get('.practice-form input:not([type="date"])'),'Practiced SQL indexing')
    await submit(get('.practice-form'))
    const request=requests.findLast(r=>r.path==='/api/practice')
    assert.equal(request.body.title,'Practiced SQL indexing')
    assert.equal(get('.practice-form input:not([type="date"])').value,'')
    assert.match(text(get('.toast')),/Practice recorded/)
  })
  await check('repository search and language filters show useful empty states',async()=>{
    await navigate('repositories')
    assert.equal(document.querySelectorAll('.repo-card').length,fixtures.windows['30'].repositories.length)
    await input(get('[aria-label="Search repositories"]'),'query-lab')
    assert.equal(document.querySelectorAll('.repo-card').length,1)
    assert.match(text(get('.repo-card')),/query-lab/)
    await input(get('[aria-label="Search repositories"]'),'no-repository-has-this-name')
    assert.match(text(get('.empty-state')),/No repositories found/)
    await input(get('[aria-label="Search repositories"]'),'')
    await input(get('[aria-label="Filter by language"]'),'Python')
    assert.equal(document.querySelectorAll('.repo-card').length,fixtures.windows['30'].repositories.filter(r=>r.language==='Python').length)
  })
  await check('difficulty requests preserve the selected activity window',async()=>{
    await navigate('projects')
    await input(get('[aria-label="Activity time range"]'),'90')
    await input(get('.inline-label select'),'beginner')
    const request=requests.findLast(r=>r.path==='/api/recommendations')
    assert.equal(request.query.get('days'),'90')
    assert.equal(request.query.get('difficulty'),'beginner')
    assert.ok([...document.querySelectorAll('.cp-project-difficulty')].every(el=>/beginner/.test(text(el))))
  })
  await check('project rerolls reach a third distinct brief and retain prior exclusions',async()=>{
    let card=get('.cp-project-card')
    const titles=[text(card.querySelector('.cp-project-title'))]
    const firstProject=projectsFor(90,'beginner').find(p=>p.title===titles[0])
    for(let i=0;i<2;i++){
      await click(card.querySelector('.cp-project-reroll'))
      card=[...document.querySelectorAll('.cp-project-card')].find(el=>text(el.querySelector('.cp-project-topic'))===firstProject.skill)
      titles.push(text(card.querySelector('.cp-project-title')))
    }
    assert.equal(new Set(titles).size,3,'Two rerolls must produce three distinct projects')
    const last=requests.findLast(r=>r.path==='/api/recommendations' && r.query.has('exclude'))
    assert.equal(last.query.get('days'),'90')
    assert.ok(last.query.get('exclude').split(',').length>=2,'Previously seen projects remain excluded')
    await click(findButton('View project brief',card))
    assert.ok(card.querySelector('.cp-project-details ol li'),'Brief includes actionable milestones')
  })
  await check('saved projects remain in the build list and can be completed',async()=>{
    const card=get('.cp-project-card')
    const title=text(card.querySelector('.cp-project-title'))
    await click(card.querySelector('.cp-project-save'))
    const saved=requests.findLast(r=>r.path==='/api/projects')
    assert.equal(saved.query.get('days'),'90','Saving uses the recommendation window')
    await click(findButton(/^My build list/))
    assert.match(text(get('.planned-project')),new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')))
    await input(get('.planned-project .planner-controls select'),'completed')
    assert.equal(state.projects[0].status,'completed')
    await navigate('dashboard')
    await navigate('projects')
    await click(findButton(/^My build list/))
    assert.equal(get('.planned-project .planner-controls select').value,'completed','Planner state survives navigation')
  })
  await check('preferences block invalid totals and persist a valid goal',async()=>{
    await navigate('settings')
    await input(get('#target-frontend'),'55')
    assert.equal(findButton(/^Save preferences/).disabled,true)
    assert.match(text(get('.target-total')),/Targets must add up to 100%/)
    await click(findButton('Backend'))
    await input(get('#weekly-goal'),'3')
    await submit(get('.settings-card form'))
    assert.equal(state.settings.weekly_goal,3)
    assert.equal(state.settings.targets.backend,40)
    assert.match(text(get('.toast')),/Preferences saved/)
    await navigate('skills')
    await navigate('settings')
    assert.equal(get('#target-backend').value,'40')
    assert.equal(get('#weekly-goal').value,'3')
  })
  await check('connection dialog validates names and imports a public profile',async()=>{
    await click(findButton('Connect GitHub'))
    const dialog=get('dialog')
    assert.equal(dialog.open,true)
    const before=requests.filter(r=>r.path==='/api/connect').length
    await input(get('#github-username'),'https://github.com/invalid')
    await submit(dialog.querySelector('form'))
    assert.match(text(get('dialog [role="alert"]')),/Enter a GitHub username/)
    assert.equal(requests.filter(r=>r.path==='/api/connect').length,before,'Invalid username must not reach the API')
    await input(get('#github-username'),'test-developer')
    await submit(dialog.querySelector('form'))
    assert.equal(document.querySelector('dialog'),null)
    assert.equal(document.querySelector('.demo-notice'),null)
    assert.match(text(get('.sidebar-profile')),/Connected Developer/)
    assert.match(text(get('.connection-status')),/Public profile/)
  })
  await check('API failures produce an error notification without discarding the workspace',async()=>{
    await navigate('dashboard')
    failNextSync=true
    await click(get('[aria-label="Sync GitHub"]'))
    assert.match(text(get('.toast[role="alert"]')),/GitHub rate limit reached/)
    assert.match(text(get('.sidebar-profile')),/Connected Developer/)
    assert.equal(document.querySelector('.busy-bar'),null,'Failed request releases the busy state')
    await click(get('[aria-label="Dismiss notification"]'))
    assert.equal(document.querySelector('.toast'),null)
  })
  await check('failed range refresh can be retried without losing the loaded page',async()=>{
    failNextDashboard=true
    await input(get('[aria-label="Activity time range"]'),'180')
    assert.match(text(get('.notice.error')),/temporarily unavailable/)
    assert.equal(text(get('main h1')),'Today')
    await click(findButton('Try again',get('.notice.error')))
    assert.equal(document.querySelector('.notice.error'),null)
    assert.equal(get('[aria-label="Activity time range"]').value,'180')
  })
  console.log(`\n${passed} frontend interaction checks passed (simulated DOM; no visual browser QA).`)
} finally {
  await act(async()=>{reactRoot.unmount();await settle()})
  await server.close()
  dom.window.close()
  console.warn=originalWarn
}
