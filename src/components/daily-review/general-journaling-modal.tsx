'use client'

import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/auth-context'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

type LifeArea = { id: string; name: string }
type Goal = {
  id: string
  title: string
  status?: 'active' | 'paused' | 'done' | 'archived'
  lifeAreaId?: string | null
  isActive?: boolean
}
type Task = {
  id: string
  title: string
  description?: string
  status?: 'backlog' | 'scheduled' | 'today' | 'inprogress' | 'blocked' | 'done' | 'archived'
  lifeAreaId?: string | null
  goalId?: string | null
  startAt?: any
  dueAt?: any
  importance?: number
  urgency?: number
  isActive?: boolean
}
type ActivityType = { id: string; title: string; defaultLifeAreaId?: string | null }
type ActivityBasic = {
  id: string
  title: string
  typeId?: string | null
  lifeAreaId?: string | null
}

function toLocalInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function nowLocalInput() { return toLocalInputValue(new Date()) }
function plusDaysLocalInput(days: number, h=9, m=0) {
  const d = new Date(); d.setDate(d.getDate()+days); d.setHours(h,m,0,0); return toLocalInputValue(d)
}

/* fuzzy similarity for entity highlighting */
function sim(a: string, b: string) {
  const s1=a.toLowerCase().trim(), s2=b.toLowerCase().trim()
  if(!s1||!s2) return 0; if(s1===s2) return 1
  const bg=(s:string)=>{const r:string[]=[]; for(let i=0;i<s.length-1;i++) r.push(s.slice(i,i+2)); return r}
  const b1=bg(s1), b2=bg(s2); const m=new Map<string,number>(); b1.forEach(x=>m.set(x,(m.get(x)||0)+1))
  let o=0; b2.forEach(x=>{const n=m.get(x)||0; if(n>0){o++; m.set(x,n-1)}})
  return (2*o)/(b1.length+b2.length)
}

function tokenize(
  text: string,
  entities: Array<{id:string; title:string; lifeAreaName?:string; kind:'task'|'goal'|'activityType'}>
) {
  return text.split(/(\s+)/).map((tok,i)=>{
    const clean = tok.replace(/[^\p{L}\p{N}]/gu,'')
    let best: typeof entities[number] | null = null; let score = 0
    for (const e of entities) { const s = sim(clean, e.title); if (s>0.8 && s>score) { best=e; score=s } }
    if (!best || !clean) return <React.Fragment key={i}>{tok}</React.Fragment>
    const href = best.kind==='task' ? `/tasks/${best.id}` : best.kind==='goal' ? `/goals/${best.id}` : undefined
    const chip = (
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            {href ? <Link href={href} className="font-semibold underline underline-offset-4">{tok}</Link> : <span className="font-semibold">{tok}</span>}
          </TooltipTrigger>
          <TooltipContent><span className="text-xs">{best.kind==='activityType'?'Activity':'Goal/Task'} • {best.lifeAreaName || 'Unassigned'}</span></TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
    return <React.Fragment key={i}>{chip}</React.Fragment>
  })
}

/* join helper */
function joinHuman(list: string[], conj: 'and'|'or') {
  if (list.length <= 1) return list[0] || ''
  if (list.length === 2) return `${list[0]} ${conj} ${list[1]}`
  return `${list.slice(0, -1).join(', ')} ${conj} ${list[list.length - 1]}`
}

function buildReflectPromptV2(goals: Goal[], tasks: Task[], justCreatedTasks: Task[]) {
  const activeGoals = goals.filter(g => g.isActive)
  const activeTasks = tasks.filter(t => t.isActive)
  const taskPool = activeTasks.length > 0 ? activeTasks : justCreatedTasks
  const goalTitles = activeGoals.map(g => g.title).slice(0, 3)
  const taskTitles = taskPool.map(t => t.title).slice(0, 2)

  let part1 = 'How was your progress today?'
  if (goalTitles.length > 0) part1 = `How was your progress towards ${joinHuman(goalTitles, 'and')}?`

  let part2 = 'What went well and what got in the way?'
  if (taskTitles.length === 1) part2 = `Did you work on ${taskTitles[0]} today, and how did it go?`
  else if (taskTitles.length >= 2) part2 = `Did you work on ${joinHuman(taskTitles, 'or')} today, and how did it go?`

  return `${part1} ${part2}`
}

type TodayGen = {
  id: string
  title: string
  as: 'task' | 'activity'
  selected: boolean
  task: {
    description: string
    status: Task['status']
    startAt: string
    dueAt: string
    importance: number
    urgency: number
    lifeAreaId: string | null
    goalId: string | null
  }
  activity: {
    activityTypeId: string | null
    lifeAreaId: string | null
    startAt: string
    durationMin: number
  }
  expanded: boolean
}

type TomorrowGen = {
  id: string
  title: string
  as: 'task' | 'activity'
  lifeAreaId?: string | null
  activityTypeId?: string | null
  selected: boolean
}

export default function GeneralJournalingModal({ open, onOpenChange }: { open: boolean; onOpenChange: (o:boolean)=>void }) {
  const { user } = useAuth()

  const [lifeAreas, setLifeAreas] = useState<LifeArea[]>([])
  const [activeAreaIds, setActiveAreaIds] = useState<Set<string>>(new Set())
  const [goals, setGoals] = useState<Goal[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([])
  const [activities, setActivities] = useState<ActivityBasic[]>([])

  // steps: 0 Today, 1 Generate (AI), 2 Reflect, 3 Tomorrow
  const [step, setStep] = useState<0|1|2|3>(0)

  const [p1, setP1] = useState(''); const [p2, setP2] = useState(''); const [p3, setP3] = useState('')

  const [taskQuery, setTaskQuery] = useState(''); const [actQuery, setActQuery] = useState('')
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set())
  const [selectedActivityIds, setSelectedActivityIds] = useState<Set<string>>(new Set())

  const [isGenerating, setIsGenerating] = useState(false)
  const [todaySuggestions, setTodaySuggestions] = useState<TodayGen[]>([])
  const [tomorrowSuggestions, setTomorrowSuggestions] = useState<TomorrowGen[]>([])
  const [justCreatedTasks, setJustCreatedTasks] = useState<Task[]>([])

  useEffect(()=>{
    if (!user || !open) return
    const unsubAreas = onSnapshot(collection(db,'users',user.uid,'lifeAreas'), snap=>{
      setLifeAreas(snap.docs.map(d=>({id:d.id, ...(d.data() as any)})) as LifeArea[])
    })
    const unsubMode = onSnapshot(
      query(collection(db,'users',user.uid,'modes'), where('isActive','==',true), limit(1)),
      snap=>{
        const ids = ((snap.docs[0]?.data()?.activeLifeAreaIds as string[])??[])
        setActiveAreaIds(new Set(ids))
      }
    )
    const unsubTypes = onSnapshot(collection(db,'users',user.uid,'activityTypes'), snap=>{
      setActivityTypes(snap.docs.map(d=>({id:d.id, ...(d.data() as any)})) as ActivityType[])
    })
    const unsubActs = onSnapshot(collection(db,'users',user.uid,'activities'), snap=>{
      setActivities(
        snap.docs.map(d=>{
          const raw = d.data() as any
          return {
            id: d.id,
            title: raw.title,
            typeId: raw.typeId ?? null,
            lifeAreaId: raw.lifeAreaId ?? null,
          } as ActivityBasic
        })
      )
    })
    ;(async ()=>{
      const gs = await getDocs(query(collection(db,'users',user.uid,'goals')))
      setGoals(gs.docs.map(d=>({id:d.id, ...(d.data() as any)})) as Goal[])
      const ts = await getDocs(query(collection(db,'users',user.uid,'tasks')))
      setTasks(ts.docs.map(d=>({id:d.id, ...(d.data() as any)})) as Task[])
    })()
    return ()=>{unsubAreas();unsubMode();unsubTypes();unsubActs()}
  },[user,open])

  const lifeAreaName = (id?:string|null)=> lifeAreas.find(la=>la.id===id)?.name
  const entities = useMemo(()=>[
    ...tasks.map(t=>({id:t.id,title:t.title,lifeAreaName:lifeAreaName(t.lifeAreaId),kind:'task' as const})),
    ...goals.map(g=>({id:g.id,title:g.title,lifeAreaName:lifeAreaName(g.lifeAreaId),kind:'goal' as const})),
    ...activityTypes.map(a=>({id:a.id,title:a.title,lifeAreaName:lifeAreaName(a.defaultLifeAreaId),kind:'activityType' as const})),
  ],[tasks,goals,activityTypes,lifeAreas])

  const filteredTasks = useMemo(()=>{
    const s = taskQuery.toLowerCase().trim()
    const list = tasks.filter(t=>t.status!=='archived')
    if(!s) return list.slice(0,100)
    return list.filter(t=>t.title.toLowerCase().includes(s)||sim(t.title,s)>0.7).slice(0,100)
  },[tasks,taskQuery])

  const filteredActivities = useMemo(()=>{
    const s = actQuery.toLowerCase().trim()
    const list = activities
    if(!s) return list.slice(0,100)
    return list.filter(a=>a.title.toLowerCase().includes(s)||sim(a.title,s)>0.7).slice(0,100)
  },[activities,actQuery])

  function toggleTask(id:string){
    setSelectedTaskIds(prev=>{const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n})
  }
  function toggleActivity(id:string){
    setSelectedActivityIds(prev=>{const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n})
  }

  /* --- AI generator call (server route) --- */
  async function generateFromP1() {
    setIsGenerating(true); setTodaySuggestions([])
    const res = await fetch('/api/ai/generate-tasks-activities', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        input: p1,
        context: {
          lifeAreas: lifeAreas.map(l=>({name:l.name})),
          tasks: tasks.map(t=>({title:t.title})),
          goals: goals.map(g=>({title:g.title})),
          activityTypes: activityTypes.map(a=>({title:a.title})),
        }
      })
    })
    const data = await res.json()
    setIsGenerating(false)
    if (!res.ok) throw new Error(data?.error || 'Failed to generate')

    const firstArea = [...activeAreaIds][0] ?? null
    const suggs: TodayGen[] = [
      ...data.tasks.map((t:any, i:number)=>({
        id:`t-${i}`, title:t.title, as:'task' as const, selected:true, expanded:false,
        task:{
          description: t.description || '',
          status: (t.status || 'scheduled') as Task['status'],
          startAt: toLocalInputValue(new Date(Date.now() + (t.startOffsetMin ?? 0)*60*1000)),
          dueAt: plusDaysLocalInput(t.dueDaysFromNow ?? 1),
          importance: Number(t.importance ?? 50),
          urgency: Number(t.urgency ?? 40),
          lifeAreaId: mapNameToId(t.lifeAreaName, lifeAreas) ?? firstArea,
          goalId: mapTitleToId(t.goalTitle, goals),
        },
        activity:{ activityTypeId:null, lifeAreaId:firstArea, startAt: nowLocalInput(), durationMin:30 },
      })),
      ...data.activities.map((a:any, i:number)=>({
        id:`a-${i}`, title:a.title, as:'activity' as const, selected:true, expanded:false,
        task:{
          description:'', status:'scheduled', startAt: nowLocalInput(), dueAt: plusDaysLocalInput(1),
          importance:50, urgency:40, lifeAreaId:firstArea, goalId:null
        },
        activity:{
          activityTypeId: mapTitleToId(a.activityTypeTitle, activityTypes),
          lifeAreaId: mapNameToId(a.lifeAreaName, lifeAreas) ?? firstArea,
          startAt: toLocalInputValue(new Date(Date.now() + (a.startOffsetMin ?? 0)*60*1000)),
          durationMin: Number(a.durationMin ?? 30),
        },
      })),
    ]
    setTodaySuggestions(suggs)
  }

  function mapNameToId(name?:string, arr?:{id:string;name:string}[]|null){
    if(!name) return null
    const exact = arr?.find(x=>x.name.toLowerCase()===name.toLowerCase())?.id
    if (exact) return exact
    const best = arr?.reduce((best,cur)=> {
      const s = sim(name, cur.name); return s > (best?.score ?? 0) ? {id:cur.id, score:s} : best
    }, null as null | {id:string;score:number})
    return (best && best.score>0.8) ? best.id : null
  }
  function mapTitleToId(title?:string, arr?:{id:string;title:string}[]|null){
    if(!title) return null
    const exact = arr?.find(x=>x.title.toLowerCase()===title.toLowerCase())?.id
    if (exact) return exact
    const best = arr?.reduce((best,cur)=> {
      const s = sim(title, cur.title); return s > (best?.score ?? 0) ? {id:cur.id, score:s} : best
    }, null as null | {id:string;score:number})
    return (best && best.score>0.8) ? best.id : null
  }

  // ---- ensure we write typeId (and auto life area) for activities ----
  async function ensureActivityTypeId(title: string, providedId: string | null, hintedLifeAreaId: string | null) {
    if (!user) throw new Error('No user')
    if (providedId) return providedId
    const byTitle = activityTypes.find(t => t.title.toLowerCase() === title.toLowerCase())
    if (byTitle) return byTitle.id
    const ref = await addDoc(collection(db,'users',user.uid,'activityTypes'), {
      title,
      defaultLifeAreaId: hintedLifeAreaId ?? null,
      createdAt: serverTimestamp(),
    })
    // IMPORTANT: do NOT optimistically push to state here (snapshot will update it),
    // to avoid duplicate entries and duplicate <option key> warnings.
    return ref.id
  }
  function defaultLifeAreaForType(typeId?: string | null) {
    if (!typeId) return null
    const t = activityTypes.find(t => t.id === typeId)
    return t?.defaultLifeAreaId ?? null
  }

  // Deduped views for selects (prevents duplicate <option> keys even if backend duplicates appear)
  const uniqueActivityTypes = useMemo(() => {
    const m = new Map<string, ActivityType>()
    for (const t of activityTypes) if (!m.has(t.id)) m.set(t.id, t)
    return Array.from(m.values())
  }, [activityTypes])

  const uniqueLifeAreas = useMemo(() => {
    const m = new Map<string, LifeArea>()
    for (const la of lifeAreas) if (!m.has(la.id)) m.set(la.id, la)
    return Array.from(m.values())
  }, [lifeAreas])

  // FIXED: use captured `user`
  async function addTodaySelectedAndAdvance() {
    if (!user) return
    const toCreate = todaySuggestions.filter(s=>s.selected)
    const createdTitles: string[] = []
    await Promise.all(toCreate.map(async (s)=>{
      if (s.as==='task') {
        const t=s.task
        await addDoc(collection(db,'users',user.uid,'tasks'),{
          title: s.title,
          description: t.description||'',
          status: t.status || 'scheduled',
          lifeAreaId: t.lifeAreaId ?? null,
          goalId: t.goalId ?? null,
          startAt: t.startAt ? new Date(t.startAt) : null,
          dueAt: t.dueAt ? new Date(t.dueAt) : null,
          importance: Number(t.importance ?? 50),
          urgency: Number(t.urgency ?? 40),
          createdAt: serverTimestamp(),
        })
        createdTitles.push(s.title)
      } else {
        const a=s.activity
        const resolvedTypeId = await ensureActivityTypeId(s.title, a.activityTypeId, a.lifeAreaId)
        const la = (a.lifeAreaId ?? defaultLifeAreaForType(resolvedTypeId) ?? null)
        await addDoc(collection(db,'users',user.uid,'activities'),{
          title: s.title,
          typeId: resolvedTypeId,
          lifeAreaId: la,
          startTime: a.startAt ? new Date(a.startAt) : serverTimestamp(),
          durationMinutes: Number(a.durationMin ?? 30),
          createdAt: serverTimestamp(),
        })
      }
    }))
    setJustCreatedTasks(createdTitles.map((title, i)=>({ id:`local-${i}`, title } as Task)))
    setStep(2)
  }

  function buildTomorrowFromP3() {
    const firstArea = [...activeAreaIds][0] ?? null
    const parts = p3.split(/[\n\.!\?]+/g).map(s=>s.trim()).filter(Boolean).slice(0,10)
    setTomorrowSuggestions(parts.map((title,i)=>({ id:`tm-${i}`, title, as:'task', lifeAreaId:firstArea, activityTypeId:null, selected:true })))
  }

  // FIXED: use captured `user`
  async function createTomorrowSelected() {
    if (!user) return
    const dueAt = new Date(); dueAt.setDate(dueAt.getDate()+1); dueAt.setHours(9,0,0,0)
    await Promise.all(tomorrowSuggestions.filter(s=>s.selected).map(async s=>{
      if (s.as==='task') {
        await addDoc(collection(db,'users',user.uid,'tasks'),{
          title: s.title, status:'scheduled', lifeAreaId: s.lifeAreaId ?? null,
          dueAt, importance:50, urgency:40, createdAt: serverTimestamp()
        })
      } else {
        const resolvedTypeId = await ensureActivityTypeId(s.title, s.activityTypeId ?? null, s.lifeAreaId ?? null)
        const la = (s.lifeAreaId ?? defaultLifeAreaForType(resolvedTypeId) ?? null)
        await addDoc(collection(db,'users',user.uid,'activities'),{
          title: s.title,
          typeId: resolvedTypeId,
          lifeAreaId: la,
          startTime: serverTimestamp(),
          durationMinutes: 30,
          createdAt: serverTimestamp()
        })
      }
    }))
    setTomorrowSuggestions([])
  }

  function matchIds(text:string, kind:'task'|'goal'|'activityType') {
    const ids:string[]=[]
    entities.filter(e=>e.kind===kind).forEach(e=>{
      if (sim(text, e.title)>0.8 || text.toLowerCase().includes(e.title.toLowerCase())) ids.push(e.id)
    })
    return Array.from(new Set(ids))
  }

  // FIXED: use captured `user`
  async function saveJournalsAndClose() {
    if (!user) return
    const payloads = [p1, p2, p3].map(txt=>txt.trim()).filter(Boolean).map(txt=>({
      text: txt,
      kind: 'general',
      matchedTaskIds: matchIds(txt,'task'),
      matchedGoalIds: matchIds(txt,'goal'),
      matchedActivityTypeIds: matchIds(txt,'activityType'),
      createdAt: serverTimestamp(),
    }))
    await Promise.all(payloads.map(p=> addDoc(collection(db,'users',user.uid,'journal'), p)))
    onOpenChange(false)
    setStep(0); setP1(''); setP2(''); setP3('')
    setSelectedTaskIds(new Set()); setSelectedActivityIds(new Set())
    setTodaySuggestions([]); setTomorrowSuggestions([]); setJustCreatedTasks([])
  }

  const prompt1Label = 'What did you get done today?'
  const reflectPromptV2 = buildReflectPromptV2(goals, tasks, justCreatedTasks)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>General Journaling</DialogTitle>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center gap-2 text-xs mb-2">
          <Badge variant={step===0?'default':'outline'}>1</Badge><span>Today</span>
          <span className="opacity-40">—</span>
          <Badge variant={step===1?'default':'outline'}>2</Badge><span>Generate</span>
          <span className="opacity-40">—</span>
          <Badge variant={step===2?'default':'outline'}>3</Badge><span>Reflect</span>
          <span className="opacity-40">—</span>
          <Badge variant={step===3?'default':'outline'}>4</Badge><span>Tomorrow</span>
        </div>

        {/* STEP 0 — TODAY */}
        {step===0 && (
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-4 space-y-2">
                <div className="text-sm font-medium">{prompt1Label}</div>
                <Textarea rows={3} value={p1} onChange={(e)=>setP1(e.target.value)} />
                <div className="text-sm text-muted-foreground">{tokenize(p1, entities)}</div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardContent className="pt-4 space-y-2">
                  <div className="text-sm font-medium">Select any tasks you completed</div>
                  <Input placeholder="Search tasks…" value={taskQuery} onChange={(e)=>setTaskQuery(e.target.value)} />
                  <div className="max-h-56 overflow-auto rounded-md border">
                    {filteredTasks.length===0 ? <div className="p-3 text-sm text-muted-foreground">No tasks</div> : (
                      <div className="p-2 grid gap-1">
                        {filteredTasks.map(t=>{
                          const checked=selectedTaskIds.has(t.id)
                          return (
                            <label key={t.id} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-muted cursor-pointer">
                              <input type="checkbox" className="h-4 w-4" checked={checked} onChange={()=>toggleTask(t.id)} />
                              <span className="text-sm">
                                <span className="font-medium">{t.title}</span>{' '}
                                <span className="text-xs text-muted-foreground">{lifeAreaName(t.lifeAreaId)||'Unassigned'}</span>
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Real ACTIVITIES */}
              <Card>
                <CardContent className="pt-4 space-y-2">
                  <div className="text-sm font-medium">Select any activities you did</div>
                  <Input placeholder="Search activities…" value={actQuery} onChange={(e)=>setActQuery(e.target.value)} />
                  <div className="max-h-56 overflow-auto rounded-md border">
                    {filteredActivities.length===0 ? <div className="p-3 text-sm text-muted-foreground">No activities</div> : (
                      <div className="p-2 grid gap-1">
                        {filteredActivities.map(a=>{
                          const checked=selectedActivityIds.has(a.id)
                          return (
                            <label key={a.id} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-muted cursor-pointer">
                              <input type="checkbox" className="h-4 w-4" checked={checked} onChange={()=>toggleActivity(a.id)} />
                              <span className="text-sm">
                                <span className="font-medium">{a.title}</span>{' '}
                                <span className="text-xs text-muted-foreground">{lifeAreaName(a.lifeAreaId)||'Unassigned'}</span>
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button onClick={async ()=>{
                await generateFromP1()
                setStep(1)
              }} disabled={isGenerating || !p1.trim()}>
                {isGenerating ? 'Generating…' : 'Next'}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 1 — GENERATE */}
        {step===1 && (
          <div className="space-y-5">
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div className="text-sm font-medium">AI suggestions from your input</div>
                {todaySuggestions.length===0 ? (
                  <div className="text-sm text-muted-foreground">No suggestions. You can go back and tweak your text.</div>
                ) : (
                  <div className="space-y-3">
                    {todaySuggestions.map(s=>{
                      const goalsForArea = s.task.lifeAreaId ? goals.filter(g=>g.lifeAreaId===s.task.lifeAreaId) : goals
                      return (
                        <div key={s.id} className="rounded-md border p-3 space-y-2">
                          <div className="flex items-center gap-3">
                            <input type="checkbox" className="h-4 w-4" checked={s.selected}
                                   onChange={(e)=>setTodaySuggestions(prev=>prev.map(x=>x.id===s.id?{...x,selected:e.target.checked}:x))} />
                            <Input value={s.title} onChange={(e)=>setTodaySuggestions(prev=>prev.map(x=>x.id===s.id?{...x,title:e.target.value}:x))} />
                            <select className="h-9 px-2 rounded-md border bg-background" value={s.as}
                                    onChange={(e)=>setTodaySuggestions(prev=>prev.map(x=>x.id===s.id?{...x,as:e.target.value as 'task'|'activity'}:x))}>
                              <option value="task">Task</option>
                              <option value="activity">Activity</option>
                            </select>
                            <Button variant="outline" size="sm" onClick={()=>setTodaySuggestions(prev=>prev.map(x=>x.id===s.id?{...x,expanded:!x.expanded}:x))}>
                              {s.expanded ? 'Hide details' : 'Edit details'}
                            </Button>
                          </div>

                          <div className="grid gap-2 sm:grid-cols-2">
                            {s.as==='task' ? (
                              <>
                                <div>
                                  <label className="text-xs">Life Area</label>
                                  <select className="w-full h-9 px-2 rounded-md border bg-background" value={s.task.lifeAreaId ?? ''}
                                          onChange={(e)=>setTodaySuggestions(prev=>prev.map(x=>x.id===s.id?{...x,task:{...x.task,lifeAreaId:e.target.value||null}}:x))}>
                                    <option value="">Unassigned</option>
                                    {uniqueLifeAreas.map(la=><option key={la.id} value={la.id}>{la.name}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <label className="text-xs">Goal</label>
                                  <select className="w-full h-9 px-2 rounded-md border bg-background" value={s.task.goalId ?? ''}
                                          onChange={(e)=>setTodaySuggestions(prev=>prev.map(x=>x.id===s.id?{...x,task:{...x.task,goalId:e.target.value||null}}:x))}>
                                    <option value="">(none)</option>
                                    {(s.task.lifeAreaId?goalsForArea:goals).map(g=><option key={g.id} value={g.id}>{g.title}</option>)}
                                  </select>
                                </div>
                              </>
                            ) : (
                              <>
                                <div>
                                  <label className="text-xs">Life Area</label>
                                  <select className="w-full h-9 px-2 rounded-md border bg-background" value={s.activity.lifeAreaId ?? ''}
                                          onChange={(e)=>setTodaySuggestions(prev=>prev.map(x=>x.id===s.id?{...x,activity:{...x.activity,lifeAreaId:e.target.value||null}}:x))}>
                                    <option value="">Unassigned</option>
                                    {uniqueLifeAreas.map(la=><option key={la.id} value={la.id}>{la.name}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <label className="text-xs">Activity Type</label>
                                  <select className="w-full h-9 px-2 rounded-md border bg-background" value={s.activity.activityTypeId ?? ''}
                                          onChange={(e)=>setTodaySuggestions(prev=>prev.map(x=>x.id===s.id?{...x,activity:{...x.activity,activityTypeId:e.target.value||null}}:x))}>
                                    <option value="">(none)</option>
                                    {uniqueActivityTypes.map(at=><option key={at.id} value={at.id}>{at.title}</option>)}
                                  </select>
                                </div>
                              </>
                            )}
                          </div>

                          {s.expanded && s.as==='task' && (
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div>
                                <label className="text-xs">Description</label>
                                <Textarea rows={2} value={s.task.description}
                                          onChange={(e)=>setTodaySuggestions(prev=>prev.map(x=>x.id===s.id?{...x,task:{...x.task,description:e.target.value}}:x))} />
                              </div>
                              <div>
                                <label className="text-xs">Status</label>
                                <select className="w-full h-9 px-2 rounded-md border bg-background" value={s.task.status ?? 'scheduled'}
                                        onChange={(e)=>setTodaySuggestions(prev=>prev.map(x=>x.id===s.id?{...x,task:{...x.task,status:e.target.value as Task['status']}}:x))}>
                                  <option value="backlog">Backlog</option>
                                  <option value="scheduled">Scheduled</option>
                                  <option value="today">Today</option>
                                  <option value="inprogress">In Progress</option>
                                  <option value="blocked">Blocked</option>
                                  <option value="done">Done</option>
                                  <option value="archived">Archived</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-xs">Start at</label>
                                <input type="datetime-local" className="w-full h-9 px-2 rounded-md border bg-background" value={s.task.startAt}
                                       onChange={(e)=>setTodaySuggestions(prev=>prev.map(x=>x.id===s.id?{...x,task:{...x.task,startAt:e.target.value}}:x))}/>
                              </div>
                              <div>
                                <label className="text-xs">Due at</label>
                                <input type="datetime-local" className="w-full h-9 px-2 rounded-md border bg-background" value={s.task.dueAt}
                                       onChange={(e)=>setTodaySuggestions(prev=>prev.map(x=>x.id===s.id?{...x,task:{...x.task,dueAt:e.target.value}}:x))}/>
                              </div>
                              <div>
                                <label className="text-xs">Importance: {s.task.importance}</label>
                                <input type="range" min={0} max={100} value={s.task.importance}
                                       onChange={(e)=>setTodaySuggestions(prev=>prev.map(x=>x.id===s.id?{...x,task:{...x.task,importance:Number(e.target.value)}}:x))}/>
                              </div>
                              <div>
                                <label className="text-xs">Urgency: {s.task.urgency}</label>
                                <input type="range" min={0} max={100} value={s.task.urgency}
                                       onChange={(e)=>setTodaySuggestions(prev=>prev.map(x=>x.id===s.id?{...x,task:{...x.task,urgency:Number(e.target.value)}}:x))}/>
                              </div>
                            </div>
                          )}

                          {s.expanded && s.as==='activity' && (
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div>
                                <label className="text-xs">Start at</label>
                                <input type="datetime-local" className="w-full h-9 px-2 rounded-md border bg-background" value={s.activity.startAt}
                                       onChange={(e)=>setTodaySuggestions(prev=>prev.map(x=>x.id===s.id?{...x,activity:{...x.activity,startAt:e.target.value}}:x))}/>
                              </div>
                              <div>
                                <label className="text-xs">Duration (min)</label>
                                <Input type="number" min={5} value={s.activity.durationMin}
                                       onChange={(e)=>setTodaySuggestions(prev=>prev.map(x=>x.id===s.id?{...x,activity:{...x.activity,durationMin:Number(e.target.value||0)}}:x))}/>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button onClick={addTodaySelectedAndAdvance} disabled={todaySuggestions.length===0}>Add selected & Continue</Button>
                  <Button variant="outline" onClick={()=>setStep(0)}>Back</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* STEP 2 — REFLECT */}
        {step===2 && (
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div className="text-sm font-medium">Active focus</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-xs font-medium mb-1">Goals</div>
                    <div className="max-h-40 overflow-auto rounded-md border p-2 grid gap-1">
                      {goals.map(g=>(
                        <label key={g.id} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-muted cursor-pointer">
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={!!g.isActive}
                            onChange={async e=>{
                              if (!user) return
                              await setDoc(doc(db,'users',user.uid,'goals',g.id),{isActive:e.target.checked},{merge:true})
                              setGoals(prev=>prev.map(x=>x.id===g.id?{...x,isActive:e.target.checked}:x))
                            }}
                          />
                          <span className="text-sm"><span className="font-medium">{g.title}</span>{' '}
                            <span className="text-xs text-muted-foreground">{lifeAreaName(g.lifeAreaId)||'Unassigned'}</span></span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium mb-1">Tasks</div>
                    <div className="max-h-40 overflow-auto rounded-md border p-2 grid gap-1">
                      {tasks.map(t=>(
                        <label key={t.id} className="flex items-center gap-2 rounded px-2 py-1 hover:bgMuted cursor-pointer">
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={!!t.isActive}
                            onChange={async e=>{
                              if (!user) return
                              await setDoc(doc(db,'users',user.uid,'tasks',t.id),{isActive:e.target.checked},{merge:true})
                              setTasks(prev=>prev.map(x=>x.id===t.id?{...x,isActive:e.target.checked}:x))
                            }}
                          />
                          <span className="text-sm"><span className="font-medium">{t.title}</span>{' '}
                            <span className="text-xs text-muted-foreground">{lifeAreaName(t.lifeAreaId)||'Unassigned'}</span></span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 space-y-2">
                <div className="text-sm font-medium">{reflectPromptV2}</div>
                <Textarea rows={4} value={p2} onChange={(e)=>setP2(e.target.value)} />
                <div className="text-sm text-muted-foreground">{tokenize(p2, entities)}</div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={()=>setStep(1)}>Back</Button>
              <Button onClick={()=>setStep(3)}>Next</Button>
            </div>
          </div>
        )}

        {/* STEP 3 — TOMORROW */}
        {step===3 && (
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div className="text-sm font-medium">What will you do tomorrow?</div>
                <Textarea rows={3} value={p3} onChange={(e)=>setP3(e.target.value)} />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={buildTomorrowFromP3}>Suggest tasks/activities</Button>
                </div>
                {tomorrowSuggestions.length>0 && (
                  <div className="space-y-3">
                    {tomorrowSuggestions.map(s=>(
                      <div key={s.id} className="flex flex-col gap-2 rounded-md border p-2">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={s.selected}
                            onChange={(e)=>setTomorrowSuggestions(prev=>prev.map(x=>x.id===s.id?{...x,selected:e.target.checked}:x))}
                          />
                          <span className="font-medium">{s.title}</span>
                          <Badge variant="outline">{s.as==='task'?'Task (due tomorrow)':'Activity (log now)'}</Badge>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="text-xs">Type</label>
                            <select
                              className="w-full border rounded-md h-9 px-2 bg-background"
                              value={s.as}
                              onChange={(e)=>setTomorrowSuggestions(prev=>prev.map(x=>x.id===s.id?{...x,as:e.target.value as 'task'|'activity'}:x))}
                            >
                              <option value="task">Task (due tomorrow)</option>
                              <option value="activity">Activity (log now)</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs">Life Area</label>
                            <select
                              className="w-full border rounded-md h-9 px-2 bg-background"
                              value={s.lifeAreaId ?? ''}
                              onChange={(e)=>setTomorrowSuggestions(prev=>prev.map(x=>x.id===s.id?{...x,lifeAreaId:e.target.value||null}:x))}
                            >
                              <option value="">Unassigned</option>
                              {[...activeAreaIds].map(id=>{
                                const la = uniqueLifeAreas.find(x=>x.id===id); if(!la) return null
                                return <option key={la.id} value={la.id}>{la.name}</option>
                              })}
                            </select>
                          </div>
                          {s.as==='activity' && (
                            <div>
                              <label className="text-xs">Activity Type</label>
                              <select
                                className="w-full border rounded-md h-9 px-2 bg-background"
                                value={s.activityTypeId ?? ''}
                                onChange={(e)=>setTomorrowSuggestions(prev=>prev.map(x=>x.id===s.id?{...x,activityTypeId:e.target.value||null}:x))}
                              >
                                <option value="">(none)</option>
                                {uniqueActivityTypes.map(at=><option key={at.id} value={at.id}>{at.title}</option>)}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Button onClick={createTomorrowSelected}>Create selected</Button>
                      <Button variant="outline" onClick={()=>setTomorrowSuggestions([])}>Clear</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={()=>setStep(2)}>Back</Button>
              <Button onClick={saveJournalsAndClose}>Save journal</Button>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
