import { useState } from 'react'

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`
}

function FieldValue({ value }) {
  if (value === '' || value == null) {
    return <span className="summary-field-value empty">not recorded</span>
  }
  return <span className="summary-field-value">{value}</span>
}

function TaskRecord({ entry, index }) {
  const { task, recordedData, debriefAnswers, elapsedSeconds } = entry
  const isMultiRun = !!(task.observe_and_record?.runs)
  const debriefQuestions = task.debrief_questions ?? []

  return (
    <div className="summary-task">
      <h2>
        Task {index + 1} — {task.title}
        <span className="summary-task-time">{formatTime(elapsedSeconds)}</span>
      </h2>

      {isMultiRun ? (
        task.observe_and_record.runs.map(runNum => {
          const runKey = `run_${runNum}`
          const runData = recordedData[runKey] ?? {}
          return (
            <div key={runNum} style={{ marginBottom: '14px' }}>
              <h3>Run {runNum}</h3>
              {task.observe_and_record.fields_per_run.map(field => (
                <div key={field.key} className="summary-field">
                  <span className="summary-field-label">{field.label}</span>
                  <FieldValue value={runData[field.key]} />
                </div>
              ))}
            </div>
          )
        })
      ) : (
        task.observe_and_record.fields.map(field => (
          <div key={field.key} className="summary-field">
            <span className="summary-field-label">{field.label}</span>
            <FieldValue value={recordedData[field.key]} />
          </div>
        ))
      )}

      {debriefQuestions.length > 0 && Object.keys(debriefAnswers).length > 0 && (
        <div style={{ marginTop: '18px' }}>
          <h2>Debrief Answers</h2>
          {debriefQuestions.map((q, qi) => {
            const answer = debriefAnswers[qi]
            if (!answer) return null
            return (
              <div key={qi} className="debrief-answer">
                <div className="debrief-q">Q{qi + 1}: {q}</div>
                <div className="debrief-a">{answer}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function SummaryScreen({ profile, completedTasks, sessionStartTime, onDone }) {
  const [saved, setSaved] = useState(false)

  const totalElapsed = completedTasks.reduce((sum, t) => sum + t.elapsedSeconds, 0)
  const sessionDate = new Date(sessionStartTime).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })

  function handleSave() {
    const sessionRecord = {
      id: sessionStartTime.toString(),
      date: new Date(sessionStartTime).toISOString(),
      profile,
      completedTasks,
      totalElapsed,
    }
    const existing = JSON.parse(localStorage.getItem('dp-sessions') ?? '[]')
    localStorage.setItem('dp-sessions', JSON.stringify([...existing, sessionRecord]))
    setSaved(true)
  }

  return (
    <div className="screen">
      <div className="summary-header">
        <h1>Session Complete</h1>
        <div className="summary-profile-block">
          <div className="summary-profile-row">
            <span className="summary-profile-label">Vessel</span>
            <span>{profile.vesselName} · {profile.dpClass} · {profile.dpSystem}</span>
          </div>
          <div className="summary-profile-row">
            <span className="summary-profile-label">Trainee</span>
            <span>{profile.traineeName}</span>
          </div>
          <div className="summary-profile-row">
            <span className="summary-profile-label">DPO</span>
            <span>{profile.dpoName} · {profile.dpoNiCert}</span>
          </div>
          <div className="summary-profile-row">
            <span className="summary-profile-label">Date</span>
            <span>{sessionDate} · Day {profile.trainingDay}</span>
          </div>
          <div className="summary-profile-row">
            <span className="summary-profile-label">Session</span>
            <span>
              {formatTime(totalElapsed)} · {completedTasks.length} task{completedTasks.length !== 1 ? 's' : ''} completed
            </span>
          </div>
        </div>
      </div>

      {completedTasks.length === 0 && (
        <p className="no-tasks">No tasks completed this session.</p>
      )}

      {completedTasks.map((entry, idx) => (
        <TaskRecord key={idx} entry={entry} index={idx} />
      ))}

      <div className="summary-actions">
        {saved ? (
          <div className="saved-badge">✓ Session saved to history</div>
        ) : (
          <button className="btn-save btn-primary" onClick={handleSave}>
            Save Session
          </button>
        )}
        <button className="btn-done btn-primary" onClick={onDone}>
          Done
        </button>
      </div>
    </div>
  )
}
