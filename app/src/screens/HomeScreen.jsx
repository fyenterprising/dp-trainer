import { useState } from 'react'

export default function HomeScreen({ onStart }) {
  const [traineeName, setTraineeName] = useState('')
  const [trainingDay, setTrainingDay] = useState('')
  const [error, setError] = useState('')

  function handleStart() {
    const name = traineeName.trim()
    const day = parseInt(trainingDay, 10)

    if (!name) {
      setError('Enter trainee name.')
      return
    }
    if (!trainingDay || isNaN(day) || day < 1 || day > 30) {
      setError('Training day must be between 1 and 30.')
      return
    }

    setError('')
    onStart({ traineeName: name, trainingDay: day })
  }

  return (
    <div className="home-screen">
      <div className="home-title">DPTrainer</div>
      <div className="home-tagline">Structured simulator sessions for Trainee DPOs</div>

      <div className="home-form">
        <div className="form-group">
          <label htmlFor="trainee-name">Trainee Name</label>
          <input
            id="trainee-name"
            type="text"
            value={traineeName}
            onChange={e => setTraineeName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleStart()}
            placeholder="Full name"
            autoFocus
          />
        </div>

        <div className="form-group">
          <label htmlFor="training-day">Training Day Number (1–30)</label>
          <input
            id="training-day"
            type="number"
            min="1"
            max="30"
            value={trainingDay}
            onChange={e => setTrainingDay(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleStart()}
            placeholder="e.g. 3"
          />
        </div>

        {error && <div className="form-error">{error}</div>}

        <button className="btn-start" onClick={handleStart}>
          Start Session
        </button>
      </div>
    </div>
  )
}
