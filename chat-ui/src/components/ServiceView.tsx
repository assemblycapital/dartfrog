import React from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { HamburgerIcon } from './Icons';
import TopBar from './TopBar';

const ServiceView = () => {
  const { id } = useParams<{ id: string }>();
  const serviceId = id


  return (
    <div
      style={{
        height: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px',
        boxSizing:"border-box",
      }}
    >
      <TopBar serviceId={serviceId}/>
     

      <h1>Service View</h1>
      <p>This is the Service View component.</p>
      <p>{serviceId}</p>
    </div>
  );
};

export default ServiceView;