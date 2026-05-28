import { useState, useEffect } from 'react'

const DP_CLASSES = ['DP1', 'DP2', 'DP3']
const DP_SYSTEMS = ['Converteam', 'Kongsberg K-Pos', 'Wärtsilä NACOS', 'Other']

function generateId() {
  return Date.now().toString() + Math.random().toString(36).slice(2, 7)
}

const EMPTY_FORM = {
  vesselName: '',
  dpClass: 'DP2',
  dpSystem: 'Kongsberg K-Pos',
  traineeName: '',
  dpoName: '',
  dpoNiCert: '',
}

export default function VesselProfileScreen({ onBack }) {
  const [profiles, setProfiles] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [mode, setMode] = useState('list')
  const [editingProfile, setEditingProfile] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [error, setError] = useState('')
  const [sessionCounts, setSessionCounts] = useState({})

  useEffect(() => {
    const saved = localStorage.getItem('dp-vessel-profiles')
    if (saved) {
      try { setProfiles(JSON.parse(saved)) } catch {}
    }
    const aid = localStorage.getItem('dp-active-profile-id')
    if (aid) setActiveId(aid)

    const sessions = JSON.parse(localStorage.getItem('dp-sessions') ?? '[]')
    const counts = {}
    sessions.forEach(s => {
      const pid = s.profile?.id
      if (pid) counts[pid] = (counts[pid] ?? 0) + 1
    })
    setSessionCounts(counts)
  }, [])

  function saveProfiles(updated) {
    setProfiles(updated)
    localStorage.setItem('dp-vessel-profiles', JSON.stringify(updated))
  }

  function selectActive(id) {
    setActiveId(id)
    if (id) {
      localStorage.setItem('dp-active-profile-id', id)
    } else {
      localStorage.removeItem('dp-active-profile-id')
    }
  }

  function handleSelectProfile(profile) {
    selectActive(profile.id)
    onBack()
  }

  function handleEdit(profile) {
    setEditingProfile(profile)
    setForm({
      vesselName: profile.vesselName,
      dpClass: profile.dpClass,
      dpSystem: profile.dpSystem,
      traineeName: profile.traineeName,
      dpoName: profile.dpoName,
      dpoNiCert: profile.dpoNiCert,
    })
    setError('')
    setMode('edit')
  }

  function handleCreate() {
    setForm(EMPTY_FORM)
    setError('')
    setMode('create')
  }

  function validateForm() {
    if (!form.vesselName.trim()) { setError('Enter vessel name.'); return false }
    if (!form.traineeName.trim()) { setError('Enter trainee name.'); return false }
    if (!form.dpoName.trim()) { setError('Enter supervising DPO name.'); return false }
    if (!form.dpoNiCert.trim()) { setError('Enter DPO NI certificate number.'); return false }
    setError('')
    return true
  }

  function handleSaveCreate() {
    if (!validateForm()) return
    const now = new Date().toISOString()
    const newProfile = {
      id: generateId(),
      ...form,
      trainingDaysCurrent: 1,
      createdAt: now,
      updatedAt: now,
    }
    const updated = [...profiles, newProfile]
    saveProfiles(updated)
    selectActive(newProfile.id)
    setMode('list')
  }

  function handleSaveEdit() {
    if (!validateForm()) return
    const now = new Date().toISOString()
    const updated = profiles.map(p =>
      p.id === editingProfile.id ? { ...p, ...form, updatedAt: now } : p
    )
    saveProfiles(updated)
    setMode('list')
  }

  function handleDelete(id) {
    const updated = profiles.filter(p => p.id !== id)
    saveProfiles(updated)
    if (activeId === id) {
      const newActive = updated[0]?.id ?? null
      selectActive(newActive)
    }
    setDeleteConfirmId(null)
  }

  function updateForm(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  if (mode === 'create' || mode === 'edit') {
    const isEdit = mode === 'edit'
    return (
      <div className="home-screen">
        <div className="vp-form-header">
          <button className="btn-back" onClick={() => { setMode('list'); setError('') }}>
            ← Back
          </button>
          <div className="vp-form-title">{isEdit ? 'Edit Profile' : 'New Profile'}</div>
        </div>

        <div className="home-form" style={{ marginTop: '24px' }}>
          <div className="form-section-label">Vessel</div>

          <div className="form-group">
            <label>Vessel Name</label>
            <input
              type="text"
              value={form.vesselName}
              onChange={e => updateForm('vesselName', e.target.value)}
              placeholder="e.g. Pacific Surveyor"
              autoFocus
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>DP Class</label>
              <select value={form.dpClass} onChange={e => updateForm('dpClass', e.target.value)}>
                {DP_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group form-group-grow">
              <label>DP System</label>
              <select value={form.dpSystem} onChange={e => updateForm('dpSystem', e.target.value)}>
                {DP_SYSTEMS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="form-section-label" style={{ marginTop: '8px' }}>Crew</div>

          <div className="form-group">
            <label>Trainee Name</label>
            <input
              type="text"
              value={form.traineeName}
              onChange={e => updateForm('traineeName', e.target.value)}
              placeholder="Full name"
            />
          </div>

          <div className="form-group">
            <label>Supervising DPO Name</label>
            <input
              type="text"
              value={form.dpoName}
              onChange={e => updateForm('dpoName', e.target.value)}
              placeholder="Full name"
            />
          </div>

          <div className="form-group">
            <label>DPO NI Certificate Number</label>
            <input
              type="text"
              value={form.dpoNiCert}
              onChange={e => updateForm('dpoNiCert', e.target.value)}
              placeholder="e.g. NI-DP-12345"
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <button className="btn-start" onClick={isEdit ? handleSaveEdit : handleSaveCreate}>
            {isEdit ? 'Save Changes' : 'Create Profile'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <div className="history-header">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <h1>Vessel Profiles</h1>
      </div>

      {profiles.length === 0 && (
        <div className="history-empty">
          <p className="no-tasks">No vessel profiles saved.</p>
          <p className="no-tasks" style={{ marginTop: '8px' }}>Create a profile to get started.</p>
        </div>
      )}

      <div className="vp-list">
        {profiles.map(profile => {
          const isActive = profile.id === activeId
          const sessionCount = sessionCounts[profile.id] ?? 0
          return (
            <div key={profile.id} className={`vp-card${isActive ? ' vp-card--active' : ''}`}>
              {isActive && <div className="vp-active-badge">Active</div>}
              <div className="vp-card-main" onClick={() => handleSelectProfile(profile)}>
                <div className="vp-card-vessel">{profile.vesselName}</div>
                <div className="vp-card-meta">{profile.dpClass} · {profile.dpSystem}</div>
                <div className="vp-card-crew">
                  {profile.traineeName} · DPO: {profile.dpoName}
                </div>
                <div className="vp-card-sessions">
                  {sessionCount} session{sessionCount !== 1 ? 's' : ''} logged
                </div>
              </div>
              <div className="vp-card-actions">
                <button
                  className="btn-vp-edit"
                  onClick={e => { e.stopPropagation(); handleEdit(profile) }}
                >
                  Edit
                </button>
                {deleteConfirmId === profile.id ? (
                  <div className="vp-delete-confirm">
                    <span className="vp-delete-text">Delete?</span>
                    <button
                      className="btn-danger"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => handleDelete(profile.id)}
                    >
                      Yes
                    </button>
                    <button
                      className="btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => setDeleteConfirmId(null)}
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn-vp-delete"
                    onClick={e => { e.stopPropagation(); setDeleteConfirmId(profile.id) }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="vp-create-section">
        <button className="btn-start" onClick={handleCreate}>
          + Create New Profile
        </button>
      </div>
    </div>
  )
}
