import { useState, useEffect } from 'react'
import Footer from './components/Footer.jsx'
import HomeScreen from './screens/HomeScreen.jsx'
import TaskScreen from './screens/TaskScreen.jsx'
import BetweenTaskScreen from './screens/BetweenTaskScreen.jsx'
import SummaryScreen from './screens/SummaryScreen.jsx'
import HistoryScreen from './screens/HistoryScreen.jsx'
import VesselProfileScreen from './screens/VesselProfileScreen.jsx'
import ProgressScreen from './screens/ProgressScreen.jsx'
import DPTimeLogScreen from './screens/DPTimeLogScreen.jsx'
import { curriculum, taskById } from './data/content.js'

function selectNextTask(trainingDay, completedTaskIds) {
  const dayEntry = curriculum.find(d => d.day === trainingDay)
  if (!dayEntry) {
    console.log('[selectNextTask] No curriculum entry for day', trainingDay)
    return null
  }

  const next = dayEntry.slots
    .filter(slot => taskById[slot.task_id])
    .find(slot => !completedTaskIds.includes(slot.task_id))

  if (!next) {
    console.log('[selectNextTask] day:', trainingDay, '| completedIds:', completedTaskIds, '| no more available tasks')
    return null
  }

  console.log('[selectNextTask] day:', trainingDay, '| completedIds:', completedTaskIds, '| selected:', next.task_id)
  return taskById[next.task_id]
}

function migrateProfile() {
  const old = localStorage.getItem('dp-profile')
  if (!old) return
  try {
    const parsed = JSON.parse(old)
    const existing = JSON.parse(localStorage.getItem('dp-vessel-profiles') ?? '[]')
    if (existing.length === 0) {
      const now = new Date().toISOString()
      const migrated = {
        id: Date.now().toString(),
        vesselName: parsed.vesselName ?? '',
        dpClass: parsed.dpClass ?? 'DP2',
        dpSystem: parsed.dpSystem ?? 'Kongsberg K-Pos',
        traineeName: parsed.traineeName ?? '',
        dpoName: parsed.dpoName ?? '',
        dpoNiCert: parsed.dpoNiCert ?? '',
        trainingDaysCurrent: parseInt(parsed.trainingDay, 10) || 1,
        createdAt: now,
        updatedAt: now,
      }
      localStorage.setItem('dp-vessel-profiles', JSON.stringify([migrated]))
      localStorage.setItem('dp-active-profile-id', migrated.id)
    }
    localStorage.removeItem('dp-profile')
  } catch {}
}

export default function App() {
  const [screen, setScreen] = useState('home')
  const [profile, setProfile] = useState(null)
  const [completedTasks, setCompletedTasks] = useState([])
  const [lastCompletedTask, setLastCompletedTask] = useState(null)
  const [sessionStartTime, setSessionStartTime] = useState(null)
  const [currentTask, setCurrentTask] = useState(null)
  const [taskNumber, setTaskNumber] = useState(1)
  const [theme, setTheme] = useState(() =>
    document.body.classList.contains('theme-night') ? 'night' : 'day'
  )

  useEffect(() => {
    migrateProfile()
  }, [])

  function toggleTheme() {
    const next = theme === 'day' ? 'night' : 'day'
    document.body.classList.remove('theme-day', 'theme-night')
    document.body.classList.add(`theme-${next}`)
    localStorage.setItem('dp-theme', next)
    setTheme(next)
  }

  function handleStart(profileData) {
    const next = selectNextTask(profileData.trainingDay, [])
    setProfile(profileData)
    setCompletedTasks([])
    setLastCompletedTask(null)
    setSessionStartTime(Date.now())
    setCurrentTask(next)
    setTaskNumber(1)
    setScreen('task')
  }

  function handleCompleteTask(taskEntry) {
    setCompletedTasks(prev => [...prev, taskEntry])
    setLastCompletedTask(taskEntry)
    setScreen('between')
  }

  function handleNextTask() {
    const completedIds = completedTasks.map(e => e.task.id)
    const next = selectNextTask(profile.trainingDay, completedIds)
    if (!next) return
    setCurrentTask(next)
    setTaskNumber(prev => prev + 1)
    setScreen('task')
  }

  function handleEndSession() {
    setScreen('summary')
  }

  function handleDone() {
    setProfile(null)
    setCompletedTasks([])
    setLastCompletedTask(null)
    setSessionStartTime(null)
    setCurrentTask(null)
    setTaskNumber(1)
    setScreen('home')
  }

  const themeToggle = (
    <button
      className="btn-theme-toggle"
      onClick={toggleTheme}
      style={{ position: 'fixed', top: '16px', right: '16px', zIndex: 1000 }}
    >
      {theme === 'day' ? '☽ NIGHT MODE' : '☀ DAY MODE'}
    </button>
  )

  if (screen === 'home') {
    return (
      <>
        {themeToggle}
        <HomeScreen
          theme={theme}
          onStart={handleStart}
          onHistory={() => setScreen('history')}
          onProgress={() => setScreen('progress')}
          onVesselProfile={() => setScreen('vesselprofile')}
          onDPLog={() => setScreen('dptimelog')}
        />
        <Footer />
      </>
    )
  }

  if (screen === 'task') {
    return (
      <>
        {themeToggle}
        <TaskScreen
          task={currentTask}
          profile={profile}
          taskNumber={taskNumber}
          sessionStartTime={sessionStartTime}
          onComplete={handleCompleteTask}
        />
        <Footer />
      </>
    )
  }

  if (screen === 'between') {
    const completedIds = completedTasks.map(e => e.task.id)
    const nextTaskAvailable = selectNextTask(profile.trainingDay, completedIds) !== null
    return (
      <>
        {themeToggle}
        <BetweenTaskScreen
          lastTask={lastCompletedTask}
          nextTaskAvailable={nextTaskAvailable}
          onNextTask={handleNextTask}
          onEndSession={handleEndSession}
        />
        <Footer />
      </>
    )
  }

  if (screen === 'summary') {
    return (
      <>
        {themeToggle}
        <SummaryScreen
          profile={profile}
          completedTasks={completedTasks}
          sessionStartTime={sessionStartTime}
          onDone={handleDone}
        />
        <Footer />
      </>
    )
  }

  if (screen === 'history') {
    return (
      <>
        {themeToggle}
        <HistoryScreen onBack={() => setScreen('home')} />
        <Footer />
      </>
    )
  }

  if (screen === 'vesselprofile') {
    return (
      <>
        {themeToggle}
        <VesselProfileScreen onBack={() => setScreen('home')} />
        <Footer />
      </>
    )
  }

  if (screen === 'progress') {
    return (
      <>
        {themeToggle}
        <ProgressScreen onBack={() => setScreen('home')} />
        <Footer />
      </>
    )
  }

  if (screen === 'dptimelog') {
    return (
      <>
        {themeToggle}
        <DPTimeLogScreen onBack={() => setScreen('home')} />
        <Footer />
      </>
    )
  }

  return null
}
