function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function BetweenTaskScreen({ lastTask, nextTaskAvailable, onNextTask, onEndSession }) {
  return (
    <div className="screen between-screen">
      <div className="between-label">Task Complete</div>
      <div className="between-task-title">{lastTask.task.title}</div>
      <div className="between-task-meta">
        {lastTask.task.id} · {formatTime(lastTask.elapsedSeconds)}
      </div>

      <div className="between-divider" />

      <div className="between-actions">
        {nextTaskAvailable ? (
          <button className="btn-primary btn-between-next" onClick={onNextTask}>
            Next Task →
          </button>
        ) : (
          <p className="between-tasks-done">
            You have completed all available tasks for today. End your session and save your progress.
          </p>
        )}
        <button className="btn-secondary btn-between-end" onClick={onEndSession}>
          End Session
        </button>
      </div>
    </div>
  )
}
