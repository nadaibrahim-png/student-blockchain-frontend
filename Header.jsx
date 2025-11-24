import React from 'react'

export default function Header(){
  return (
    <div className="header">
      <div>
        <h1 style={{ margin:0 }}>Blockchain Security Dashboard</h1>
        <div className="small">Simple React frontend for interacting with the Verification contract</div>
      </div>
      <div>
        <small className="small">Built with React + ethers.js</small>
      </div>
    </div>
  )
}
