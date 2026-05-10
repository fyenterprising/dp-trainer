import { useState } from 'react'
import HomeScreen from './screens/HomeScreen.jsx'
import TaskScreen from './screens/TaskScreen.jsx'
import SummaryScreen from './screens/SummaryScreen.jsx'

export default function App() {
  const [screen, setScreen] = useState('home')
  const [session, setSession] = useState(null)
  const [completedTasks, setCompletedTasks] = useState([])

  function handleStart(sessionData) {
    setSession(sessionData)
    setCompletedTasks([])
    setScreen('task')
  }

  function handleCompleteTask(taskEntry) {
    setCompletedTasks(prev => [...prev, taskEntry])
    setScreen('summary')
  }

  function handleDone() {
    setSession(null)
    setCompletedTasks([])
    setScreen('home')
  }

  if (screen === 'home') {
    return <HomeScreen onStart={handleStart} />
  }

  if (screen === 'task') {
    return <TaskScreen session={session} onComplete={handleCompleteTask} />
  }

  if (screen === 'summary') {
    return (
      <SummaryScreen
        session={session}
        completedTasks={completedTasks}
        onDone={handleDone}
      />
    )
  }

  return null
}
