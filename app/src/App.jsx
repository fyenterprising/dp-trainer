import { useState, useEffect } from 'react'
import HomeScreen from './screens/HomeScreen.jsx'
import TaskScreen from './screens/TaskScreen.jsx'
import BetweenTaskScreen from './screens/BetweenTaskScreen.jsx'
import SummaryScreen from './screens/SummaryScreen.jsx'
import HistoryScreen from './screens/HistoryScreen.jsx'
import VesselProfileScreen from './screens/VesselProfileScreen.jsx'
import ProgressScreen from './screens/ProgressScreen.jsx'
import setupData from '../../content/domains/setup.json'
import joystickData from '../../content/domains/joystick-control.json'
import environmentalData from '../../content/domains/environmental.json'
import sensorsData from '../../content/domains/sensors.json'
import modeData from '../../content/domains/mode-transitions.json'
import approachData from '../../content/domains/approach.json'
import alarmsData from '../../content/domains/alarms.json'
import failuresData from '../../content/domains/failures.json'
import watchkeepingData from '../../content/domains/watchkeeping.json'
import operationsData from '../../content/domains/operations.json'
import reviewData from '../../content/domains/review.json'
import curriculumData from '../../content/curriculum.json'

const allDomains = [
  setupData, joystickData, environmentalData, sensorsData, modeData,
  approachData, alarmsData, failuresData, watchkeepingData, operationsData, reviewData,
]

const taskById = {}
allDomains.forEach(domain => {
  domain.tasks.forEach(t => { taskById[t.id] = t })
})

function selectNextTask(trainingDay, completedTaskIds) {
  const dayEntry = curriculumData.curriculum.find(d => d.day === trainingDay)
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

  useEffect(() => {
    migrateProfile()
  }, [])

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

  if (screen === 'home') {
    return (
      <HomeScreen
        onStart={handleStart}
        onHistory={() => setScreen('history')}
        onProgress={() => setScreen('progress')}
        onVesselProfile={() => setScreen('vesselprofile')}
      />
    )
  }

  if (screen === 'task') {
    return (
      <TaskScreen
        task={currentTask}
        profile={profile}
        taskNumber={taskNumber}
        sessionStartTime={sessionStartTime}
        onComplete={handleCompleteTask}
      />
    )
  }

  if (screen === 'between') {
    const completedIds = completedTasks.map(e => e.task.id)
    const nextTaskAvailable = selectNextTask(profile.trainingDay, completedIds) !== null
    return (
      <BetweenTaskScreen
        lastTask={lastCompletedTask}
        nextTaskAvailable={nextTaskAvailable}
        onNextTask={handleNextTask}
        onEndSession={handleEndSession}
      />
    )
  }

  if (screen === 'summary') {
    return (
      <SummaryScreen
        profile={profile}
        completedTasks={completedTasks}
        sessionStartTime={sessionStartTime}
        onDone={handleDone}
      />
    )
  }

  if (screen === 'history') {
    return <HistoryScreen onBack={() => setScreen('home')} />
  }

  if (screen === 'vesselprofile') {
    return <VesselProfileScreen onBack={() => setScreen('home')} />
  }

  if (screen === 'progress') {
    return <ProgressScreen onBack={() => setScreen('home')} />
  }

  return null
}
