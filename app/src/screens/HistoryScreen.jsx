import { useState, useEffect } from 'react'

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

function SessionDetail({ session }) {
  const { profile, completedTasks } = session
  return (
    <div className="history-detail">
      <div className="history-detail-profile">
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
      </div>

      {completedTasks.map((entry, idx) => {
        const { task, recordedData, debriefAnswers, elapsedSeconds } = entry
        const isMultiRun = !!(task.observe_and_record?.runs)
        const debriefQuestions = task.debrief_questions ?? []

        return (
          <div key={idx} className="history-task">
            <div className="history-task-header">
              Task {idx + 1} — {task.title}
              <span className="history-task-time">{formatTime(elapsedSeconds)}</span>
            </div>

            {isMultiRun ? (
              task.observe_and_record.runs.map(runNum => {
                const runKey = `run_${runNum}`
                const runData = recordedData[runKey] ?? {}
                return (
                  <div key={runNum} style={{ marginBottom: '10px' }}>
                    <div className="history-run-label">Run {runNum}</div>
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
              <div style={{ marginTop: '12px' }}>
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
      })}
    </div>
  )
}

export default function HistoryScreen({ onBack }) {
  const [sessions, setSessions] = useState([])
  const [expanded, setExpanded] = useState({})
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('dp-sessions')
    if (saved) {
      try {
        setSessions([...JSON.parse(saved)].reverse())
      } catch {}
    }
  }, [])

  function toggleExpand(id) {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  function handleClearAll() {
    localStorage.removeItem('dp-sessions')
    setSessions([])
    setShowConfirm(false)
  }

  return (
    <div className="screen">
      <div className="history-header">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <h1>Past Sessions</h1>
      </div>

      {sessions.length === 0 && (
        <div className="history-empty">
          <p className="no-tasks">No sessions saved yet.</p>
          <p className="no-tasks" style={{ marginTop: '8px' }}>
            Complete and save a session to see it here.
          </p>
        </div>
      )}

      {sessions.map(session => {
        const date = new Date(session.date).toLocaleDateString('en-GB', {
          day: '2-digit', month: 'short', year: 'numeric',
        })
        const isOpen = expanded[session.id]

        return (
          <div key={session.id} className="history-card">
            <div
              className="history-card-summary"
              onClick={() => toggleExpand(session.id)}
            >
              <div className="history-card-main">
                <div className="history-card-vessel">{session.profile.vesselName}</div>
                <div className="history-card-meta">
                  {session.profile.traineeName} · Day {session.profile.trainingDay} · {date}
                </div>
                <div className="history-card-stats">
                  {session.completedTasks.length} task{session.completedTasks.length !== 1 ? 's' : ''}
                  {' · '}{formatTime(session.totalElapsed)}
                  {' · '}{session.profile.dpClass}
                </div>
              </div>
              <div className="history-card-chevron">{isOpen ? '▲' : '▼'}</div>
            </div>

            {isOpen && <SessionDetail session={session} />}
          </div>
        )
      })}

      {sessions.length > 0 && (
        <div className="history-clear-section">
          {showConfirm ? (
            <div className="history-confirm">
              <span className="history-confirm-text">
                Delete all {sessions.length} sessions? This cannot be undone.
              </span>
              <div className="history-confirm-actions">
                <button className="btn-danger" onClick={handleClearAll}>
                  Delete All
                </button>
                <button className="btn-secondary" onClick={() => setShowConfirm(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button className="btn-clear" onClick={() => setShowConfirm(true)}>
              Clear All Sessions
            </button>
          )}
        </div>
      )}
    </div>
  )
}
