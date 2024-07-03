import React, { useState, useCallback } from 'react';
import useDartStore from '../store/dart';
import CryptoJS from 'crypto-js';

interface AuthDialogProps {
}

const AuthDialog: React.FC<AuthDialogProps> = ({ }) => {
  const [password, setPassword] = useState("");
  const {authDialog, setAuthDialog} = useDartStore();

  const requestSubdomainAuthCookie = useCallback(async (password: string, subdomain: string) => {
    console.log("todo request cookie")
    // sha256 hash password using crypto-js
    const hashHex = '0x' + CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);

    const result = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password_hash: hashHex, subdomain: subdomain }),
    });

    if (result.status == 200) {
      // reload page
      // window.location.reload();
      console.log("login OK", result)
      // get the setcookie from the result
      const setCookie = result.headers.getSetCookie();
      console.log("Set-Cookie:", setCookie);
    } else {
      console.log("login NOT OK", result)
    }
  }, []);

  const handlePasswordSubmit = useCallback(async () => {
    requestSubdomainAuthCookie(password, "example")


  }, [password, authDialog, setAuthDialog]);

  return (
    <>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(256,256,256, 0.1)',
        backdropFilter: 'blur(5px)',
        zIndex: 999,
      }} />
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: '#242424',
        padding: '20px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
      }}>
        <h2>dartfrog auth</h2>
        <p>grant dartfrog access to the following processes</p>
        <ul>
          {authDialog.map((plugin, index) => (
            <li key={index}>{plugin}</li>
          ))}
        </ul>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          style={{
            width: '100%',
            padding: '10px',
            margin: '10px 0',
            borderRadius: '4px',
            border: '1px solid #ccc',
          }}
        />
        <button
          onClick={handlePasswordSubmit}
          style={{
            backgroundColor: '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          OK
        </button>
      </div>
    </>
  );
};

export default AuthDialog;