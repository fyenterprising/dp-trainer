import { useState, useEffect } from 'react'

const CHECKLIST_ITEMS = [
  'NI certified DPO is present and supervising',
  'DPO certificate number confirmed and recorded',
  'WS01 confirmed as active controlling desk',
  'Simulation checkbox activated in Overview tab — confirmed',
  'Initial position entered into sim from live GPS display — confirmed',
  'Vessel heading entered into sim from gyrocompass — confirmed',
  'Water depth entered into sim from echosounder — confirmed',
  'Vessel draft entered into sim from stability display — confirmed',
  'All thrusters confirmed enabled in Thrusters tab',
  'Both DGPS references active and SNR above 35',
  'Both gyros active and reading within 0.5 degrees',
  'Wind sensor active and feedforward enabled',
  'PME/power configuration confirmed with DPO',
  'Alarm buzzer set to Enable — confirmed',
  'Rejection limit set and confirmed with DPO',
  'Session timer started — confirmed',
]

export default function HomeScreen({ onStart, onHistory, onProgress, onVesselProfile }) {
  const [step, setStep] = useState(1)
  const [activeProfile, setActiveProfile] = useState(null)
  const [trainingDay, setTrainingDay] = useState('')
  const [checked, setChecked] = useState({})
  const [error, setError] = useState('')

  useEffect(() => {
    const profiles = JSON.parse(localStorage.getItem('dp-vessel-profiles') ?? '[]')
    const activeId = localStorage.getItem('dp-active-profile-id')
    if (activeId) {
      const found = profiles.find(p => p.id === activeId)
      if (found) { setActiveProfile(found); return }
    }
    if (profiles.length > 0) {
      setActiveProfile(profiles[0])
      localStorage.setItem('dp-active-profile-id', profiles[0].id)
    }
  }, [])

  function handleProfileNext() {
    if (!activeProfile) { setError('Select or create a vessel profile first.'); return }
    const day = parseInt(trainingDay, 10)
    if (!trainingDay || isNaN(day) || day < 1 || day > 30) {
      setError('Training day must be between 1 and 30.')
      return
    }
    setError('')
    setChecked({})
    setStep(2)
  }

  function toggleItem(i) {
    setChecked(prev => ({ ...prev, [i]: !prev[i] }))
  }

  const checkedCount = Object.values(checked).filter(Boolean).length
  const allChecked = checkedCount === CHECKLIST_ITEMS.length

  function handleStartSession() {
    if (!allChecked) return
    onStart({
      ...activeProfile,
      trainingDay: parseInt(trainingDay, 10),
    })
  }

  if (step === 1) {
    return (
      <div className="home-screen">
        <div className="home-title">DPTrainer</div>
        <div className="home-tagline">Structured simulator sessions for Trainee DPOs</div>

        <div className="home-nav">
          <button className="btn-nav btn-nav-active">New Session</button>
          <button className="btn-nav" onClick={onHistory}>Past Sessions</button>
          <button className="btn-nav" onClick={onProgress}>Progress</button>
        </div>

        <div className="home-form">
          <div className="form-section-label">Vessel Profile</div>

          {activeProfile ? (
            <div className="active-profile-card">
              <div className="active-profile-vessel">{activeProfile.vesselName}</div>
              <div className="active-profile-meta">
                {activeProfile.dpClass} · {activeProfile.dpSystem}
              </div>
              <div className="active-profile-crew">
                {activeProfile.traineeName} · DPO: {activeProfile.dpoName}
              </div>
              <button
                className="btn-secondary"
                onClick={onVesselProfile}
                style={{ marginTop: '12px', width: '100%' }}
              >
                Change Vessel
              </button>
            </div>
          ) : (
            <div className="no-profile-prompt">
              <p className="no-tasks" style={{ marginBottom: '10px' }}>No vessel profile set.</p>
              <button
                className="btn-secondary"
                onClick={onVesselProfile}
                style={{ width: '100%' }}
              >
                Create Vessel Profile
              </button>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="training-day">Training Day Number (1–30)</label>
            <input
              id="training-day"
              type="number"
              min="1"
              max="30"
              value={trainingDay}
              onChange={e => setTrainingDay(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleProfileNext()}
              placeholder="e.g. 3"
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <button
            className={`btn-start${!activeProfile ? ' btn-start--disabled' : ''}`}
            onClick={handleProfileNext}
            disabled={!activeProfile}
          >
            Next →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="checklist-screen">
      <div className="checklist-screen-header">
        <div className="checklist-screen-title">Pre-Session Checklist</div>
        <div className="checklist-screen-vessel">
          {activeProfile?.vesselName} · {activeProfile?.dpClass} · Day {trainingDay}
        </div>
        <div className="checklist-screen-crew">
          {activeProfile?.traineeName} · DPO: {activeProfile?.dpoName}
        </div>
      </div>

      <div className="checklist-screen-instruction">
        Confirm each item before starting. All 16 must be verified.
      </div>

      {checkedCount === 0 && (
        <div className="checklist-test-row">
          <button
            className="btn-select-all"
            onClick={() => {
              const all = {}
              CHECKLIST_ITEMS.forEach((_, i) => { all[i] = true })
              setChecked(all)
            }}
          >
            SELECT ALL (TEST)
          </button>
          <div className="checklist-test-label">Testing only — not for real sessions</div>
        </div>
      )}

      <div className="pre-checklist">
        {CHECKLIST_ITEMS.map((item, i) => (
          <div
            key={i}
            className={`pre-checklist-item${checked[i] ? ' pre-checklist-item--checked' : ''}`}
            onClick={() => toggleItem(i)}
          >
            <div className={`pre-check-box${checked[i] ? ' pre-check-box--checked' : ''}`}>
              {checked[i] && '✓'}
            </div>
            <span className="pre-checklist-text">{item}</span>
          </div>
        ))}
      </div>

      <div className="checklist-footer">
        <div className="checklist-count">
          <span className={allChecked ? 'count-done' : 'count-partial'}>
            {checkedCount} / {CHECKLIST_ITEMS.length}
          </span>
          {' '}items confirmed
        </div>
        <div className="checklist-actions">
          <button className="btn-secondary" onClick={() => setStep(1)}>
            ← Back
          </button>
          <button
            className={`btn-start${allChecked ? '' : ' btn-start--disabled'}`}
            onClick={handleStartSession}
            disabled={!allChecked}
          >
            Start Session
          </button>
        </div>
      </div>
    </div>
  )
}
