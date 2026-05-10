function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function FieldValue({ value }) {
  if (value === '' || value == null) {
    return <span className="summary-field-value empty">not recorded</span>
  }
  return <span className="summary-field-value">{value}</span>
}

export default function SummaryScreen({ session, completedTasks, onDone }) {
  const totalElapsed = completedTasks.reduce((sum, t) => sum + t.elapsedSeconds, 0)

  return (
    <div className="screen">
      <div className="summary-header">
        <h1>Session Complete</h1>
        <div className="summary-meta">
          {session.traineeName} — Day {session.trainingDay} — Total time: {formatTime(totalElapsed)}
        </div>
      </div>

      {completedTasks.length === 0 && (
        <p className="no-tasks">No tasks completed this session.</p>
      )}

      {completedTasks.map((entry, idx) => {
        const { task, recordedData, debriefAnswers, elapsedSeconds } = entry
        const isMultiRun = !!(task.observe_and_record?.runs)
        const debriefQuestions = task.debrief_questions ?? []

        return (
          <div key={idx} className="summary-task">
            <h2>
              {task.id} — {task.title} ({formatTime(elapsedSeconds)})
            </h2>

            {/* Observe and record */}
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

            {/* Debrief answers */}
            {debriefQuestions.length > 0 && (
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
                {Object.keys(debriefAnswers).length === 0 && (
                  <p className="no-tasks">No debrief answers recorded.</p>
                )}
              </div>
            )}
          </div>
        )
      })}

      <button className="btn-primary btn-done" onClick={onDone}>
        Done
      </button>
    </div>
  )
}
