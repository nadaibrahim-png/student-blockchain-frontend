import React, { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import VerificationABI from "../abi/Verification.json";

const CONTRACT_ADDRESS = import.meta.env.VITE_VERIFICATION_ADDRESS;

export default function VerificationPanel() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [contract, setContract] = useState(null);

  const [countExporters, setCountExporters] = useState(null);
  const [countHashes, setCountHashes] = useState(null);
  const [owner, setOwner] = useState(null);

  const [busy, setBusy] = useState(false);
  const [txStatus, setTxStatus] = useState(null);
  const [error, setError] = useState(null);

  const [methodName, setMethodName] = useState("");
  const [methodArgs, setMethodArgs] = useState("");

  const connectWallet = useCallback(async () => {
    try {
      if (!window.ethereum) throw new Error("No injected wallet (e.g. MetaMask) found.");
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum, "any");
      await web3Provider.send("eth_requestAccounts", []);
      const s = web3Provider.getSigner();
      const acct = await s.getAddress();
      const network = await web3Provider.getNetwork();

      setProvider(web3Provider);
      setSigner(s);
      setAccount(acct);
      setChainId(network.chainId);
      setError(null);
    } catch (err) {
      setError(err?.message || String(err));
    }
  }, []);

  useEffect(() => {
    if (!CONTRACT_ADDRESS || !provider) return;
    try {
      const c = new ethers.Contract(CONTRACT_ADDRESS, VerificationABI, provider);
      setContract(c);
    } catch (err) {
      setError("Failed to create contract: " + (err?.message || String(err)));
    }
  }, [provider]);

  useEffect(() => {
    if (!contract || !signer) return;
    try {
      const c = contract.connect(signer);
      setContract(c);
    } catch (err) {
      console.warn("Could not attach signer to contract:", err);
    }
  }, [signer]);

  const refreshReads = useCallback(async () => {
    if (!contract) return;
    setBusy(true);
    setError(null);
    try {
      const [ce, ch, own] = await Promise.all([
        contract.count_Exporters?.(),
        contract.count_hashes?.(),
        contract.owner?.()
      ]);
      setCountExporters(ce !== undefined ? ce.toString() : "n/a");
      setCountHashes(ch !== undefined ? ch.toString() : "n/a");
      setOwner(own ?? "n/a");
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setBusy(false);
    }
  }, [contract]);

  useEffect(() => {
    if (!contract) return;
    refreshReads();
  }, [contract, refreshReads]);

  useEffect(() => {
    if (!window.ethereum) return;
    const onAccounts = (accounts) => {
      if (!accounts || accounts.length === 0) {
        setAccount(null);
        setSigner(null);
      } else {
        setAccount(accounts[0]);
      }
    };
    const onChain = (hex) => {
      try {
        setChainId(parseInt(hex, 16));
      } catch (e) {
        console.warn(e);
      }
    };
    window.ethereum.on?.("accountsChanged", onAccounts);
    window.ethereum.on?.("chainChanged", onChain);
    return () => {
      window.ethereum.removeListener?.("accountsChanged", onAccounts);
      window.ethereum.removeListener?.("chainChanged", onChain);
    };
  }, []);

  const parseArgs = (str) => {
    if (!str) return [];
    try {
      if (str.trim().startsWith("[")) {
        return JSON.parse(str);
      }
    } catch (e) {}
    let arr = str.split(",").map(s => s.trim()).filter(s => s.length > 0);
    arr = arr.map(token => {
      if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
        return token.slice(1, -1);
      }
      if (token.toLowerCase() === "true") return true;
      if (token.toLowerCase() === "false") return false;
      if (!isNaN(token)) {
        if (/^0x[0-9a-fA-F]+$/.test(token)) return token;
        return token.includes('.') ? parseFloat(token) : parseInt(token, 10);
      }
      return token;
    });
    return arr;
  };

  const callMethod = useCallback(async () => {
    setError(null);
    setTxStatus(null);
    if (!contract) return setError("Contract not initialized");
    if (!signer) return setError("Connect a wallet to send transactions");
    if (!methodName) return setError("Provide a method name to call");

    const args = parseArgs(methodArgs);
    setBusy(true);
    try {
      if (typeof contract[methodName] !== "function") {
        throw new Error(`Method \"${methodName}\" not found on contract ABI.`);
      }

      let populated;
      try {
        populated = await contract.populateTransaction[methodName](...args);
      } catch (e) {
        populated = null;
      }

      let txResponse;
      if (populated) {
        const gasEstimate = await provider.estimateGas({ ...populated, from: account });
        txResponse = await signer.sendTransaction({ ...populated, gasLimit: gasEstimate.mul(120).div(100) });
      } else {
        txResponse = await contract[methodName](...args);
      }

      setTxStatus(`pending:${txResponse.hash}`);
      const receipt = await txResponse.wait(1);
      if (receipt.status === 1) {
        setTxStatus(`confirmed:${receipt.transactionHash}`);
        await refreshReads();
      } else {
        setTxStatus(`failed:${receipt.transactionHash}`);
      }
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setBusy(false);
    }
  }, [contract, signer, provider, account, methodName, methodArgs, refreshReads]);

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <div>
          <strong>Account:</strong> {account ?? <button className="btn" onClick={connectWallet}>Connect wallet</button>}
        </div>
        <div className="small">Contract: {CONTRACT_ADDRESS || 'No contract address in env'}</div>
      </div>

      <div className="grid" style={{ marginBottom:12 }}>
        <div className="card">
          <div><strong>count_Exporters</strong></div>
          <div style={{ fontSize:18, marginTop:6 }}>{countExporters ?? '—'}</div>
        </div>
        <div className="card">
          <div><strong>count_hashes</strong></div>
          <div style={{ fontSize:18, marginTop:6 }}>{countHashes ?? '—'}</div>
        </div>
      </div>

      <div style={{ marginBottom:12 }}>
        <strong>Owner:</strong> {owner ?? '—'}
      </div>

      <div style={{ marginBottom:12 }}>
        <button className="btn" onClick={refreshReads} disabled={busy || !contract}>Refresh</button>
        <span style={{ marginLeft:12 }}>{busy ? 'Working…' : txStatus ?? 'idle'}</span>
      </div>

      <hr />

      <h3>Call a contract method (generic writer)</h3>
      <div style={{ marginTop:8 }}>
        <div style={{ marginBottom:8 }}>
          <label>Method name (exact ABI name):</label>
          <input className="input" value={methodName} onChange={(e)=>setMethodName(e.target.value)} placeholder='e.g. addHash' />
        </div>
        <div style={{ marginBottom:8 }}>
          <label>Arguments (comma-separated or JSON array):</label>
          <input className="input" value={methodArgs} onChange={(e)=>setMethodArgs(e.target.value)} placeholder='e.g. "someHash", 123' />
        </div>
        <div>
          <button className="btn" onClick={callMethod} disabled={busy || !signer}>Send Transaction</button>
        </div>
      </div>

      {error && <div style={{ color:'crimson', marginTop:8 }}>{error}</div>}

    </div>
  );
}
