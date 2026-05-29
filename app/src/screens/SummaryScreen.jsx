import { useState } from 'react'

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '00')
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`
}

function formatEnvForPrint(env) {
  if (!env) return 'Not specified'
  if (typeof env === 'string') return env
  const parts = []
  if (env.wind_speed_kts != null) parts.push(`Wind: ${env.wind_speed_kts}kts${env.wind_dir_deg != null ? ` @ ${env.wind_dir_deg}°` : ''}`)
  if (env.wave_height_m != null) parts.push(`Wave: ${env.wave_height_m}m${env.wave_dir_deg != null ? ` @ ${env.wave_dir_deg}°` : ''}`)
  if (env.current_speed_kts != null) parts.push(`Current: ${env.current_speed_kts}kts${env.current_dir_deg != null ? ` @ ${env.current_dir_deg}°` : ''}`)
  if (env.first_run === 'calm') return 'Run 1: Calm. Subsequent runs: as specified'
  return parts.length ? parts.join(' · ') : 'Not specified'
}

function groupNiRefs(completedTasks) {
  const allRefs = new Set()
  completedTasks.forEach(entry => {
    const slot = entry.slot
    if (slot?.ni_task_ref) slot.ni_task_ref.forEach(r => allRefs.add(r))
  })
  const bySection = {}
  allRefs.forEach(ref => {
    const section = ref.split('.')[0]
    if (!bySection[section]) bySection[section] = []
    bySection[section].push(ref)
  })
  return bySection
}

const NI_SECTION_TITLES = {
  1: 'DP Class Requirements', 2: 'Bridge Team Roles', 3: 'DP System Elements',
  4: 'In-Depth System Knowledge', 5: 'Position Reference Systems', 6: 'Sensors',
  7: 'DP Operations', 8: 'Moving the Vessel / Close Proximity',
  9: 'Watchkeeping During DP Operations', 10: 'Departure from Working Position',
  11: 'DP Alarms and Degraded Status',
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
    <div className="summary-task print-task">
      <h2>
        Task {index + 1} — {task.title}
        <span className="summary-task-time">{formatTime(elapsedSeconds)}</span>
      </h2>

      <div className="print-task-meta">
        <span>{task.id}</span>
        {task.duration_minutes && <span>· {task.duration_minutes} min</span>}
        {task.environment && <span>· {formatEnvForPrint(task.environment)}</span>}
      </div>

      {task.professional_standard?.length > 0 && (
        <div className="print-section">
          <h3>Professional Standard</h3>
          <ul className="print-standard-list">
            {task.professional_standard.map((item, i) => (
              <li key={i}>☐ {item}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="print-section">
        <h3>Observations and Records</h3>
        {isMultiRun ? (
          task.observe_and_record.runs.map(runNum => {
            const runKey = `run_${runNum}`
            const runData = recordedData[runKey] ?? {}
            return (
              <div key={runNum} style={{ marginBottom: '14px' }}>
                <h4>Run {runNum}</h4>
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
      </div>

      {debriefQuestions.length > 0 && (
        <div className="print-section">
          <h3>Debrief</h3>
          {debriefQuestions.map((q, qi) => {
            const answer = debriefAnswers[qi]
            return (
              <div key={qi} className="debrief-answer">
                <div className="debrief-q">Q{qi + 1}: {q}</div>
                {answer
                  ? <div className="debrief-a">{answer}</div>
                  : <div className="debrief-a empty">not answered</div>
                }
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
  const printDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })

  const niBySection = groupNiRefs(completedTasks)

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

  function handleExportPDF() {
    window.print()
  }

  return (
    <div className="screen" id="print-root">

      {/* ── PRINT-ONLY HEADER ── */}
      <div className="print-header print-only">
        <div className="print-logo">DPTrainer</div>
        <div className="print-doc-title">Session Training Record</div>
        <div className="print-doc-date">Generated: {printDate}</div>
      </div>

      {/* ── SCREEN HEADER (also printed) ── */}
      <div className="summary-header">
        <h1 className="no-print">Session Complete</h1>
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

      {/* ── NI REFERENCES (print only) ── */}
      {Object.keys(niBySection).length > 0 && (
        <div className="print-ni-refs print-only">
          <h2>NI Logbook References Addressed</h2>
          {Object.entries(niBySection)
            .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
            .map(([sec, refs]) => (
              <div key={sec} className="print-ni-row">
                <strong>Section {sec}{NI_SECTION_TITLES[sec] ? ` — ${NI_SECTION_TITLES[sec]}` : ''}:</strong>{' '}
                {refs.sort().join(', ')}
              </div>
            ))}
        </div>
      )}

      {completedTasks.length === 0 && (
        <p className="no-tasks">No tasks completed this session.</p>
      )}

      {completedTasks.map((entry, idx) => (
        <TaskRecord key={idx} entry={entry} index={idx} />
      ))}

      {/* ── PRINT FOOTER ── */}
      <div className="print-footer print-only">
        <div className="print-footer-disclaimer">
          This record was generated by DPTrainer. DPTrainer is not affiliated with or endorsed by the Nautical Institute. The original signed logbook remains the official NI submission record.
        </div>
        <div className="print-sig-row">
          <span>Supervising DPO signature: ___________________________</span>
          <span>Date: _______________</span>
        </div>
      </div>

      {/* ── ACTIONS (screen only) ── */}
      <div className="summary-actions no-print">
        {saved ? (
          <div className="saved-badge">✓ Session saved to history</div>
        ) : (
          <button className="btn-save btn-primary" onClick={handleSave}>
            Save Session
          </button>
        )}
        <button className="btn-export btn-secondary" onClick={handleExportPDF}>
          Export PDF
        </button>
        <button className="btn-done btn-primary" onClick={onDone}>
          Done
        </button>
      </div>
    </div>
  )
}
