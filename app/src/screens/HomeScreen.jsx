import { useState, useEffect } from 'react'

const DP_CLASSES = ['DP1', 'DP2', 'DP3']
const DP_SYSTEMS = ['Converteam', 'Kongsberg K-Pos', 'Wärtsilä NACOS', 'Other']

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

const EMPTY_PROFILE = {
  vesselName: '',
  dpClass: 'DP2',
  dpSystem: 'Kongsberg K-Pos',
  traineeName: '',
  dpoName: '',
  dpoNiCert: '',
  trainingDay: '',
}

export default function HomeScreen({ onStart, onHistory }) {
  const [step, setStep] = useState(1)
  const [profile, setProfile] = useState(EMPTY_PROFILE)
  const [checked, setChecked] = useState({})
  const [error, setError] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('dp-profile')
    if (saved) {
      try { setProfile(JSON.parse(saved)) } catch {}
    }
  }, [])

  function updateField(key, value) {
    setProfile(prev => ({ ...prev, [key]: value }))
  }

  function handleProfileNext() {
    if (!profile.vesselName.trim()) { setError('Enter vessel name.'); return }
    if (!profile.traineeName.trim()) { setError('Enter trainee name.'); return }
    if (!profile.dpoName.trim()) { setError('Enter supervising DPO name.'); return }
    if (!profile.dpoNiCert.trim()) { setError('Enter DPO NI certificate number.'); return }
    const day = parseInt(profile.trainingDay, 10)
    if (!profile.trainingDay || isNaN(day) || day < 1 || day > 30) {
      setError('Training day must be between 1 and 30.')
      return
    }
    setError('')
    localStorage.setItem('dp-profile', JSON.stringify(profile))
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
    onStart({ ...profile, trainingDay: parseInt(profile.trainingDay, 10) })
  }

  if (step === 1) {
    return (
      <div className="home-screen">
        <div className="home-title">DPTrainer</div>
        <div className="home-tagline">Structured simulator sessions for Trainee DPOs</div>

        <div className="home-nav">
          <button className="btn-nav btn-nav-active">New Session</button>
          <button className="btn-nav" onClick={onHistory}>Past Sessions</button>
        </div>

        <div className="home-form">
          <div className="form-section-label">Vessel Profile</div>

          <div className="form-group">
            <label htmlFor="vessel-name">Vessel Name</label>
            <input
              id="vessel-name"
              type="text"
              value={profile.vesselName}
              onChange={e => updateField('vesselName', e.target.value)}
              placeholder="e.g. Pacific Surveyor"
              autoFocus
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dp-class">DP Class</label>
              <select
                id="dp-class"
                value={profile.dpClass}
                onChange={e => updateField('dpClass', e.target.value)}
              >
                {DP_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group form-group-grow">
              <label htmlFor="dp-system">DP System</label>
              <select
                id="dp-system"
                value={profile.dpSystem}
                onChange={e => updateField('dpSystem', e.target.value)}
              >
                {DP_SYSTEMS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="form-section-label" style={{ marginTop: '8px' }}>Crew</div>

          <div className="form-group">
            <label htmlFor="trainee-name">Trainee Name</label>
            <input
              id="trainee-name"
              type="text"
              value={profile.traineeName}
              onChange={e => updateField('traineeName', e.target.value)}
              placeholder="Full name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="dpo-name">Supervising DPO Name</label>
            <input
              id="dpo-name"
              type="text"
              value={profile.dpoName}
              onChange={e => updateField('dpoName', e.target.value)}
              placeholder="Full name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="dpo-cert">DPO NI Certificate Number</label>
            <input
              id="dpo-cert"
              type="text"
              value={profile.dpoNiCert}
              onChange={e => updateField('dpoNiCert', e.target.value)}
              placeholder="e.g. NI-DP-12345"
            />
          </div>

          <div className="form-group">
            <label htmlFor="training-day">Training Day Number (1–30)</label>
            <input
              id="training-day"
              type="number"
              min="1"
              max="30"
              value={profile.trainingDay}
              onChange={e => updateField('trainingDay', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleProfileNext()}
              placeholder="e.g. 3"
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <button className="btn-start" onClick={handleProfileNext}>
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
          {profile.vesselName} · {profile.dpClass} · Day {profile.trainingDay}
        </div>
        <div className="checklist-screen-crew">
          {profile.traineeName} · DPO: {profile.dpoName}
        </div>
      </div>

      <div className="checklist-screen-instruction">
        Confirm each item before starting. All 16 must be verified.
      </div>

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
