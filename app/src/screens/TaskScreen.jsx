import { useState, useEffect } from 'react'
import domainData from '../../../content/domains/joystick-control.json'

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function formatEnvironment(env) {
  if (!env) return 'Not specified'

  // jc_002 style: first_run calm, subsequent_runs with wind
  if (env.first_run === 'calm') {
    const sub = env.subsequent_runs
    const subStr = sub
      ? `Wind ${sub.wind_speed_kts}kts @ ${sub.wind_dir_deg}°`
      : 'as specified'
    return `Run 1: Calm. Subsequent runs: ${subStr}`
  }

  const parts = []
  if (env.wind_speed_kts != null) {
    parts.push(`Wind: ${env.wind_speed_kts}kts @ ${env.wind_dir_deg}°`)
  }
  if (env.wave_height_m != null) {
    parts.push(`Wave: ${env.wave_height_m}m @ ${env.wave_dir_deg}°`)
  }
  if (env.current_speed_kts != null) {
    parts.push(`Current: ${env.current_speed_kts}kts @ ${env.current_dir_deg}°`)
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

export default function TaskScreen({ session, onComplete }) {
  const { trainingDay } = session

  const task = domainData.tasks
    .filter(t => t.min_training_day <= trainingDay)
    .reduce((best, t) => !best || t.min_training_day > best.min_training_day ? t : best, null)

  const isMultiRun = !!(task?.observe_and_record?.runs)

  const [elapsed, setElapsed] = useState(0)
  const [recordedData, setRecordedData] = useState(() =>
    task ? buildInitialRecordedData(task) : {}
  )
  const [debriefIndex, setDebriefIndex] = useState(0)
  const [debriefAnswers, setDebriefAnswers] = useState({})

  useEffect(() => {
    const id = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [])

  if (!task) {
    return (
      <div className="screen">
        <p className="no-tasks">
          No tasks available for training day {trainingDay}. Check content/domains/.
        </p>
      </div>
    )
  }

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
    onComplete({
      task,
      recordedData,
      debriefAnswers,
      elapsedSeconds: elapsed,
    })
  }

  const debriefQuestions = task.debrief_questions ?? []
  const currentQuestion = debriefQuestions[debriefIndex]

  return (
    <div className="screen">
      <div className="timer-bar">
        <span className="timer">{formatTime(elapsed)}</span>
        <span className="task-id">{task.id} — {session.traineeName} — Day {session.trainingDay}</span>
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
