import { useState, useEffect } from 'react'
import curriculumData from '../../../content/curriculum.json'

const NI_SECTION_TOTALS = {
  1: 10, 2: 7, 3: 8, 4: 12, 5: 8,
  6: 4, 7: 25, 8: 10, 9: 15, 10: 3, 11: 13,
}

const NI_SECTION_TITLES = {
  1: 'DP Class Requirements',
  2: 'Bridge Team Roles',
  3: 'DP System Elements',
  4: 'In-Depth System Knowledge',
  5: 'Position Reference Systems',
  6: 'Sensors',
  7: 'DP Operations',
  8: 'Moving the Vessel / Close Proximity',
  9: 'Watchkeeping During DP Operations',
  10: 'Departure from Working Position',
  11: 'DP Alarms and Degraded Status',
}

const DOMAIN_LABELS = {
  jc: 'Joystick Control',
  dp: 'DP Operations',
  env: 'Environmental',
  sen: 'Sensor Management',
  pme: 'Power & Propulsion',
  drift: 'Drift Assessment',
  approach: 'Approach Operations',
  mode: 'Mode Transitions',
  obs: 'Observation',
  debrief: 'Debrief',
  review: 'Review',
  peer: 'Peer Assessment',
  final: 'Final Assessment',
  setup: 'System Setup',
}

function buildTaskNiMap() {
  const map = {}
  curriculumData.curriculum.forEach(day => {
    day.slots.forEach(slot => {
      if (!map[slot.task_id] && slot.ni_task_ref) {
        map[slot.task_id] = slot.ni_task_ref
      }
    })
  })
  return map
}

function formatTimeHM(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

export default function ProgressScreen({ onBack }) {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    const sessions = JSON.parse(localStorage.getItem('dp-sessions') ?? '[]')
    const taskNiMap = buildTaskNiMap()

    const totalSeconds = sessions.reduce((sum, s) => sum + (s.totalElapsed ?? 0), 0)
    const uniqueDates = new Set(sessions.map(s => s.date?.slice(0, 10)).filter(Boolean))

    const domainCounts = {}
    sessions.forEach(s => {
      s.completedTasks?.forEach(entry => {
        const id = entry.task?.id ?? ''
        const domain = id.replace(/_\d+$/, '')
        domainCounts[domain] = (domainCounts[domain] ?? 0) + 1
      })
    })

    const addressedRefs = new Set()
    sessions.forEach(s => {
      s.completedTasks?.forEach(entry => {
        const refs = taskNiMap[entry.task?.id]
        if (refs) refs.forEach(r => addressedRefs.add(r))
      })
    })

    const sectionAddressed = {}
    addressedRefs.forEach(ref => {
      const section = parseInt(ref.split('.')[0], 10)
      if (!isNaN(section)) {
        if (!sectionAddressed[section]) sectionAddressed[section] = new Set()
        sectionAddressed[section].add(ref)
      }
    })

    setStats({
      totalSeconds,
      uniqueDates: uniqueDates.size,
      totalSessions: sessions.length,
      domainCounts,
      sectionAddressed,
      totalAddressedRefs: addressedRefs.size,
    })
  }, [])

  if (!stats) return null

  return (
    <div className="screen">
      <div className="history-header">
        <button className="btn-back" onClick={onBack}>← Back</button>
        <h1>Progress</h1>
      </div>

      <div className="progress-stats-row">
        <div className="progress-stat">
          <div className="progress-stat-value">{formatTimeHM(stats.totalSeconds)}</div>
          <div className="progress-stat-label">Passive Time</div>
        </div>
        <div className="progress-stat">
          <div className="progress-stat-value">{stats.uniqueDates}</div>
          <div className="progress-stat-label">Training Days</div>
        </div>
        <div className="progress-stat">
          <div className="progress-stat-value">{stats.totalSessions}</div>
          <div className="progress-stat-label">Sessions</div>
        </div>
      </div>

      <div className="progress-section">
        <div className="progress-section-title">NI Section Coverage</div>
        <div className="progress-ni-instruction">
          NI task refs addressed across all saved sessions
        </div>
        {Object.entries(NI_SECTION_TOTALS).map(([sec, total]) => {
          const section = parseInt(sec, 10)
          const addressed = stats.sectionAddressed[section]?.size ?? 0
          const pct = total > 0 ? Math.min(100, Math.round((addressed / total) * 100)) : 0
          return (
            <div key={section} className="progress-ni-row">
              <div className="progress-ni-header">
                <span className="progress-ni-sec">§{section}</span>
                <span className="progress-ni-title">{NI_SECTION_TITLES[section]}</span>
                <span className="progress-ni-count">{addressed}/{total}</span>
              </div>
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      {Object.keys(stats.domainCounts).length > 0 && (
        <div className="progress-section">
          <div className="progress-section-title">Tasks by Domain</div>
          <div className="progress-domain-list">
            {Object.entries(stats.domainCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([domain, count]) => (
                <div key={domain} className="progress-domain-row">
                  <span className="progress-domain-name">
                    {DOMAIN_LABELS[domain] ?? domain}
                  </span>
                  <span className="progress-domain-count">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {stats.totalSessions === 0 && (
        <div className="history-empty" style={{ marginTop: '24px' }}>
          <p className="no-tasks">No sessions saved yet.</p>
          <p className="no-tasks" style={{ marginTop: '8px' }}>
            Complete and save sessions to see progress here.
          </p>
        </div>
      )}
    </div>
  )
}
