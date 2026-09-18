import { useState, useEffect } from 'react'
import Icon from '../components/Icon.jsx'

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

// The DPO review marker is a working note that a trainee and DPO discussed
// the session — not a signature, verification, or piece of evidence — so it
// is never surfaced in the PDF export or the DP time log, only here.
function formatReviewDateTime(dateTimeStr) {
  const d = new Date(dateTimeStr)
  if (isNaN(d.getTime())) return { date: '—', time: '—' }
  return {
    date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
  }
}

function nowForDateTimeLocal() {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function ReviewSection({ session, reviewDraft, onStartReview, onDraftChange, onConfirmReview, onCancelReview, onRemoveReview }) {
  if (session.reviewed) {
    const { date, time } = formatReviewDateTime(session.reviewed.dateTime)
    return (
      <div className="review-section">
        <div className="review-status-row">
          <span className="review-reviewed-text">
            <Icon name="tick" />
            Reviewed by {session.reviewed.dpoName} — {date} at {time}
          </span>
          <button className="btn-review-remove" onClick={() => onRemoveReview(session.id)}>
            Remove Review
          </button>
        </div>
      </div>
    )
  }

  if (reviewDraft?.sessionId === session.id) {
    return (
      <div className="review-section">
        <div className="review-form">
          <div className="form-group">
            <label>DPO Name</label>
            <input
              type="text"
              value={reviewDraft.dpoName}
              onChange={e => onDraftChange({ ...reviewDraft, dpoName: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Date and Time</label>
            <input
              type="datetime-local"
              value={reviewDraft.dateTime}
              onChange={e => onDraftChange({ ...reviewDraft, dateTime: e.target.value })}
            />
          </div>
          <div className="review-form-actions">
            <button className="btn-primary" onClick={() => onConfirmReview(session.id)}>Confirm</button>
            <button className="btn-secondary" onClick={onCancelReview}>Cancel</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="review-section">
      <div className="review-status-row">
        <span className="review-unreviewed-text">Not yet reviewed by a DPO.</span>
        <button className="btn-secondary" onClick={() => onStartReview(session)}>Mark as Reviewed</button>
      </div>
    </div>
  )
}

function SessionDetail({ session, reviewDraft, onStartReview, onDraftChange, onConfirmReview, onCancelReview, onRemoveReview }) {
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

      <ReviewSection
        session={session}
        reviewDraft={reviewDraft}
        onStartReview={onStartReview}
        onDraftChange={onDraftChange}
        onConfirmReview={onConfirmReview}
        onCancelReview={onCancelReview}
        onRemoveReview={onRemoveReview}
      />
    </div>
  )
}

export default function HistoryScreen({ onBack }) {
  const [sessions, setSessions] = useState([])
  const [expanded, setExpanded] = useState({})
  const [showConfirm, setShowConfirm] = useState(false)
  const [reviewDraft, setReviewDraft] = useState(null) // { sessionId, dpoName, dateTime } | null

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

  // `sessions` is held newest-first for display; storage keeps the original
  // chronological order SummaryScreen appends to, so reverse back on the way out.
  function persistSessions(updatedDisplayOrder) {
    setSessions(updatedDisplayOrder)
    localStorage.setItem('dp-sessions', JSON.stringify([...updatedDisplayOrder].reverse()))
  }

  function handleStartReview(session) {
    setReviewDraft({
      sessionId: session.id,
      dpoName: session.profile?.dpoName ?? '',
      dateTime: nowForDateTimeLocal(),
    })
  }

  function handleCancelReview() {
    setReviewDraft(null)
  }

  function handleConfirmReview(sessionId) {
    if (!reviewDraft) return
    persistSessions(sessions.map(s => s.id === sessionId
      ? { ...s, reviewed: { dpoName: reviewDraft.dpoName, dateTime: reviewDraft.dateTime } }
      : s
    ))
    setReviewDraft(null)
  }

  function handleRemoveReview(sessionId) {
    persistSessions(sessions.map(s => s.id === sessionId ? { ...s, reviewed: null } : s))
  }

  return (
    <div className="screen">
      <div className="history-header">
        <button className="btn-back" onClick={onBack}><Icon name="arrow" className="icon--flip" /> Back</button>
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
              <div className="history-card-chevron">
                <Icon name="chevron" className={isOpen ? 'icon--rotate-180' : ''} />
              </div>
            </div>

            {isOpen && (
              <SessionDetail
                session={session}
                reviewDraft={reviewDraft}
                onStartReview={handleStartReview}
                onDraftChange={setReviewDraft}
                onConfirmReview={handleConfirmReview}
                onCancelReview={handleCancelReview}
                onRemoveReview={handleRemoveReview}
              />
            )}
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
