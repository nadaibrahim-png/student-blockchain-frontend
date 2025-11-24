import React, { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import VerificationABI from '../abi/Verification.json';

const CONTRACT_ADDRESS = import.meta.env.VITE_VERIFICATION_ADDRESS;

export default function StudentVerification() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [docHash, setDocHash] = useState('');
  const [studentName, setStudentName] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  const connectWallet = useCallback(async () => {
    try {
      if (!window.ethereum) throw new Error('No injected wallet');
      const p = new ethers.providers.Web3Provider(window.ethereum, 'any');
      await p.send('eth_requestAccounts', []);
      const s = p.getSigner();
      setProvider(p);
      setSigner(s);
      setAccount(await s.getAddress());
      setError(null);
    } catch (e) {
      setError(e.message || String(e));
    }
  }, []);

  const addRecord = useCallback(async () => {
    setError(null);
    setStatus(null);
    if (!signer) return setError('Connect wallet');
    if (!docHash || !studentName) return setError('Provide doc hash and student name');
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, VerificationABI, signer);
      const tx = await contract.addRecord(docHash, studentName);
      setStatus('pending:' + tx.hash);
      const rcpt = await tx.wait(1);
      setStatus(rcpt.status === 1 ? 'confirmed' : 'failed');
    } catch (e) {
      setError(e.message || String(e));
    }
  }, [signer, docHash, studentName]);

  const verifyRecord = useCallback(async () => {
    setError(null);
    setVerifyResult(null);
    if (!provider) return setError('Connect wallet (or allow provider)');
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, VerificationABI, provider);
      const res = await contract.verifyRecord(docHash);
      const [issuer, name, timestamp, exists] = res;
      setVerifyResult({ issuer, name, timestamp: timestamp.toNumber ? timestamp.toNumber() : Number(timestamp), exists });
    } catch (e) {
      setError(e.message || String(e));
    }
  }, [provider, docHash]);

  return (
    <div>
      <h3>Student Document Verification</h3>
      <div style={{marginBottom:8}}>
        <strong>Account:</strong> {account ?? <button className='btn' onClick={connectWallet}>Connect wallet</button>}
      </div>

      <div style={{marginBottom:8}}>
        <label>Document hash (IPFS CID or hex):</label>
        <input className='input' value={docHash} onChange={(e)=>setDocHash(e.target.value)} placeholder='e.g. Qm... or 0xabc...' />
      </div>

      <div style={{marginBottom:8}}>
        <label>Student name:</label>
        <input className='input' value={studentName} onChange={(e)=>setStudentName(e.target.value)} placeholder='e.g. Alice' />
      </div>

      <div style={{marginBottom:8}}>
        <button className='btn' onClick={addRecord}>Add Record</button>
        <button style={{marginLeft:8}} className='btn' onClick={verifyRecord}>Verify Record</button>
      </div>

      {status && <div style={{marginTop:8}}>Status: {status}</div>}
      {error && <div style={{color:'crimson', marginTop:8}}>Error: {error}</div>}

      {verifyResult && (
        <div style={{marginTop:12}} className='card'>
          <div><strong>Exists:</strong> {verifyResult.exists ? 'Yes' : 'No'}</div>
          {verifyResult.exists && (
            <>
              <div><strong>Issuer:</strong> {verifyResult.issuer}</div>
              <div><strong>Name:</strong> {verifyResult.name}</div>
              <div><strong>Timestamp:</strong> {new Date(verifyResult.timestamp * 1000).toLocaleString()}</div>
            </>
          )}
        </div>
      )}
    </div>
);
}
