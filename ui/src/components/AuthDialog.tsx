import React, { useState, useCallback, useEffect } from 'react';
import useDartStore from '../store/dart';
import CryptoJS from 'crypto-js';
import './AuthDialog.css';
import { Spinner } from '@dartfrog/puddle';

interface AuthDialogProps {
}

const AuthDialog: React.FC<AuthDialogProps> = ({ }) => {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // const {authDialog, setAuthDialog, isAuthDialogActive, clearPluginFromAuthDialog, setIsAuthDialogActive} = useDartStore();
  
  // useEffect(()=>{
  //   if (authDialog.length === 0) {
  //     setIsAuthDialogActive(false);
  //   }
  // }, [authDialog])

  // const clearSubdomain = useCallback((subdomain: string) => {
  //   clearPluginFromAuthDialog(subdomain)
  // }, [setAuthDialog]);

  // const requestSubdomainAuthCookie = useCallback(async (password: string, subdomain: string) => {
  //   // sha256 hash password using crypto-js
  //   const hashHex = '0x' + CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);

  //   const result = await fetch("/login", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({ password_hash: hashHex, subdomain: subdomain }),
  //     credentials: 'include',
  //   });

  //   if (result.status == 200) {
  //     clearSubdomain(subdomain);
  //   }
  // }, [clearSubdomain]);

  // const handlePasswordSubmit = useCallback(async () => {
  //   setIsLoading(true);
  //   for (const pluginName of authDialog) {
  //     await requestSubdomainAuthCookie(password, pluginName);
  //   }
  //   setIsLoading(false);
  // }, [password, authDialog, requestSubdomainAuthCookie]);

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
        padding: '2rem 4rem',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        gap: "0.8rem",
      }}>
        
        <div
          style={{
            fontWeight: 'bold'
          }}
        >
          grant dartfrog access to
        </div>
        <ul
          style={{
            fontSize: '0.8rem'
          }}
        >
          {/* {authDialog.map((plugin, index) => (
            <li key={index}>{plugin}</li>
          ))} */}
        </ul>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          disabled={isLoading}
          autoComplete="off"  // Disable suggestions
          style={{
            width: '100%',
            padding: '10px',
          }}
        />
        <button
          // onClick={handlePasswordSubmit}
          disabled={isLoading || password.length < 3}
          className="password-button"
        >
          {isLoading ? <Spinner /> : 'OK'}
        </button>
      </div>
    </>
  );
};

export default AuthDialog;