import { useState } from 'react'
import HomeScreen from './screens/HomeScreen.jsx'
import TaskScreen from './screens/TaskScreen.jsx'
import BetweenTaskScreen from './screens/BetweenTaskScreen.jsx'
import SummaryScreen from './screens/SummaryScreen.jsx'
import HistoryScreen from './screens/HistoryScreen.jsx'
import domainData from '../../content/domains/joystick-control.json'
import curriculumData from '../../content/curriculum.json'

const taskById = {}
domainData.tasks.forEach(t => { taskById[t.id] = t })

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

export default function App() {
  const [screen, setScreen] = useState('home')
  const [profile, setProfile] = useState(null)
  const [completedTasks, setCompletedTasks] = useState([])
  const [lastCompletedTask, setLastCompletedTask] = useState(null)
  const [sessionStartTime, setSessionStartTime] = useState(null)
  const [currentTask, setCurrentTask] = useState(null)
  const [taskNumber, setTaskNumber] = useState(1)

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
    return <HomeScreen onStart={handleStart} onHistory={() => setScreen('history')} />
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

  return null
}
