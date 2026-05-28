import { useState, useEffect } from 'react'

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function formatSessionTime(seconds) {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0')
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${h}:${m}:${s}`
}

function formatEnvironment(env) {
  if (!env) return 'Not specified'
  if (typeof env === 'string') return env
  if (env.first_run === 'calm') {
    const sub = env.subsequent_runs
    const subStr = sub
      ? `Wind ${sub.wind_speed_kts}kts${sub.wind_dir_deg != null ? ` @ ${sub.wind_dir_deg}°` : ''}`
      : 'as specified'
    return `Run 1: Calm. Subsequent runs: ${subStr}`
  }
  const parts = []
  if (env.wind_speed_kts != null) {
    parts.push(env.wind_dir_deg != null
      ? `Wind: ${env.wind_speed_kts}kts @ ${env.wind_dir_deg}°`
      : `Wind: ${env.wind_speed_kts}kts — direction not specified`)
  }
  if (env.wave_height_m != null) {
    parts.push(env.wave_dir_deg != null
      ? `Wave: ${env.wave_height_m}m @ ${env.wave_dir_deg}°`
      : `Wave: ${env.wave_height_m}m — direction not specified`)
  }
  if (env.current_speed_kts != null) {
    parts.push(env.current_dir_deg != null
      ? `Current: ${env.current_speed_kts}kts @ ${env.current_dir_deg}°`
      : `Current: ${env.current_speed_kts}kts — direction not specified`)
  }
  return parts.length ? parts.join(' | ') : 'Not specified'
}

function buildInitialRecordedData(task) {
  const oar = task.observe_and_record
  if (oar.runs) {
    const data = {}
    oar.runs.forEach(r => { data[`run_${r}`] = {} })
    return data
  }
  return {}
}

export default function TaskScreen({ task, profile, taskNumber, sessionStartTime, onComplete }) {
  const [elapsed, setElapsed] = useState(0)
  const [sessionElapsed, setSessionElapsed] = useState(0)
  const [recordedData, setRecordedData] = useState(() =>
    task ? buildInitialRecordedData(task) : {}
  )
  const [debriefIndex, setDebriefIndex] = useState(0)
  const [debriefAnswers, setDebriefAnswers] = useState({})

  useEffect(() => {
    if (!task) return
    setRecordedData(buildInitialRecordedData(task))
    setElapsed(0)
    setDebriefIndex(0)
    setDebriefAnswers({})
  }, [task?.id])

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(s => s + 1)
      if (sessionStartTime) {
        setSessionElapsed(Math.floor((Date.now() - sessionStartTime) / 1000))
      }
    }, 1000)
    return () => clearInterval(id)
  }, [sessionStartTime])

  if (!task) {
    return (
      <div className="screen">
        <p className="no-tasks">
          No tasks available for training day {profile.trainingDay}. Check content/domains/.
        </p>
      </div>
    )
  }

  const isMultiRun = !!(task.observe_and_record?.runs)
  const debriefQuestions = task.debrief_questions ?? []
  const currentQuestion = debriefQuestions[debriefIndex]

  function handleSimpleChange(key, value) {
    setRecordedData(prev => ({ ...prev, [key]: value }))
  }

  function handleRunChange(runKey, fieldKey, value) {
    setRecordedData(prev => ({
      ...prev,
      [runKey]: { ...prev[runKey], [fieldKey]: value },
    }))
  }

  function handleComplete() {
    onComplete({ task, recordedData, debriefAnswers, elapsedSeconds: elapsed })
  }

  return (
    <div className="screen">
      <div className="timer-bar">
        <span className="timer">{formatTime(elapsed)}</span>
        <div className="timer-right">
          <span className="session-progress">
            {`Task ${taskNumber} of session`}
            {' — '}{formatSessionTime(sessionElapsed)} elapsed
          </span>
          <span className="task-id">{task.id} · {profile.traineeName} · Day {profile.trainingDay}</span>
        </div>
      </div>

      <h1>{task.title}</h1>
      <div className="meta-row">
        <span>Duration: {task.duration_minutes} min</span>
        <span>Difficulty: {task.difficulty}</span>
        <span>Mode: {task.vessel_mode_execute ?? task.vessel_mode ?? '—'}</span>
      </div>

      <div className="panel">
        <h2>Environment</h2>
        <p>{formatEnvironment(task.environment)}</p>
      </div>

      <div className="panel">
        <h2>Setup</h2>
        <p>{task.setup}</p>
      </div>

      <div className="panel">
        <h2>Execute</h2>
        <p>{task.execute}</p>
      </div>

      <div className="panel">
        <h2>Professional Standard</h2>
        <ul className="checklist">
          {task.professional_standard.map((item, i) => (
            <li key={i}>
              <input type="checkbox" id={`std-${i}`} />
              <label htmlFor={`std-${i}`}>{item}</label>
            </li>
          ))}
        </ul>
      </div>

      <div className="panel">
        <h2>Observe and Record</h2>
        {isMultiRun ? (
          task.observe_and_record.runs.map(runNum => {
            const runKey = `run_${runNum}`
            return (
              <div key={runNum} className="run-group">
                <h3>Run {runNum}</h3>
                {task.observe_and_record.fields_per_run.map(field => (
                  <div key={field.key} className="field-row">
                    <label>{field.label}</label>
                    {field.type === 'text' ? (
                      <textarea
                        value={recordedData[runKey]?.[field.key] ?? ''}
                        onChange={e => handleRunChange(runKey, field.key, e.target.value)}
                        placeholder="—"
                      />
                    ) : (
                      <input
                        type="number"
                        step="any"
                        value={recordedData[runKey]?.[field.key] ?? ''}
                        onChange={e => handleRunChange(runKey, field.key, e.target.value)}
                        placeholder="—"
                      />
                    )}
                  </div>
                ))}
              </div>
            )
          })
        ) : (
          task.observe_and_record.fields.map(field => (
            <div key={field.key} className="field-row">
              <label>{field.label}</label>
              {field.type === 'text' ? (
                <textarea
                  value={recordedData[field.key] ?? ''}
                  onChange={e => handleSimpleChange(field.key, e.target.value)}
                  placeholder="—"
                />
              ) : (
                <input
                  type="number"
                  step="any"
                  value={recordedData[field.key] ?? ''}
                  onChange={e => handleSimpleChange(field.key, e.target.value)}
                  placeholder="—"
                />
              )}
            </div>
          ))
        )}
      </div>

      {debriefQuestions.length > 0 && (
        <div className="panel">
          <h2>Debrief</h2>
          <div className="debrief-progress">
            Question {debriefIndex + 1} of {debriefQuestions.length}
          </div>
          <p className="question">{currentQuestion}</p>
          <textarea
            className="debrief-textarea"
            placeholder="Your answer (optional)"
            value={debriefAnswers[debriefIndex] ?? ''}
            onChange={e =>
              setDebriefAnswers(prev => ({ ...prev, [debriefIndex]: e.target.value }))
            }
          />
          {debriefIndex < debriefQuestions.length - 1 && (
            <button
              className="btn-secondary"
              onClick={() => setDebriefIndex(i => i + 1)}
            >
              Next Question
            </button>
          )}
        </div>
      )}

      <button className="btn-complete" onClick={handleComplete}>
        Complete Task
      </button>
    </div>
  )
}
