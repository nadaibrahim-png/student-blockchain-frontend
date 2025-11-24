import React from 'react'
import Header from '../components/Header'
import VerificationPanel from '../components/VerificationPanel'
import StudentVerification from '../components/StudentVerification'

export default function Dashboard(){
  return (
    <div className="container">
      <Header />

      <div style={{ height: 18 }} />

      <div className="card">
        <VerificationPanel />
      </div>

      <div style={{ height: 18 }} />

      <div className="card">
        <StudentVerification />
      </div>

    </div>
  )
}
