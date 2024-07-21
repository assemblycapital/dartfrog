import React, { useEffect, useState } from 'react';
import './Sidebar.css';
import useDartStore from '../../store/dart';
import { computeColorForName } from '@dartfrog/puddle/utils';
import { XIcon } from '../icons/Icons';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_PFP, NameColor, getClassForNameColor } from '@dartfrog/puddle/index';
import { PROCESS_NAME } from '../../utils';

interface SidebarProps {}

const Sidebar: React.FC<SidebarProps> = ({ }) => {
  const { isSidebarOpen, setIsSidebarOpen, currentPage} = useDartStore();
  const [profileImage, setProfileImage] = useState<string>(DEFAULT_PFP);
  const [nameColorClass, setNameColorClass] = useState<string>('name-color-default');
  const navigate = useNavigate();

  const {profile} = useDartStore();
  useEffect(()=>{
    if (profile && profile.pfp) {
      setProfileImage(profile.pfp)
    }
    if (profile) {
      setNameColorClass(getClassForNameColor(profile.nameColor))

    }
  },[profile]);


  const renderComponent = () => {
    const getBoldClass = (page: string) => currentPage === page ? 'bold' : '';

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            backgroundColor: '#333',
            color: '#b4b4b4',
            height: '26px',
            width: '100%',
            textAlign: 'center',
            userSelect: 'none',
            marginBottom: '5px',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>dartfrog</div>
          {/* <div className="close-sidebar-button" style={{ position: 'absolute', right: '0px' }}
            onClick={() => setIsSidebarOpen(false)}
          >
            <div className="close-sidebar-button-svg" style={{ width: '16px', height: '16px' }}>
              <XIcon />
            </div>
          </div> */}
        </div>
        <div className='sidebar'>
          <a
            href={`/${PROCESS_NAME}/nodes/${window.our?.node}`}
            className={`profile`}
            style={{
              cursor: "pointer",
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
            onClick={(event) => {
              event.preventDefault();
              navigate(`/nodes/${window.our?.node}`);
            }}
          >
            <div
              style={{
                width: "100%",
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              <div className='profile-image'
                style={{
                  width: '15vh',
                  height: '15vh',
                  maxWidth: '15vh',
                  maxHeight: '15vh',
                  minWidth: '15vh',
                  minHeight: '15vh',
                }}
              >
                <img src={profileImage} alt="profile" />
              </div>
            </div>
            <div
              className={`profile-name ${nameColorClass}`}
              style={{
                flex: '1',
                cursor: 'pointer',
              }}
            >
              {window.our?.node}
            </div>
          </a>
          <a className={`sidebar-option ${getBoldClass('home')}`}
            href={`/${PROCESS_NAME}/`}
            onClick={(event) => {
              event.preventDefault();
              navigate('/');
            }}
          >
            home
          </a>
          <a className={`sidebar-option ${getBoldClass('services')}`}
            href={`/${PROCESS_NAME}/services`}
            onClick={(event) => {
              event.preventDefault();
              navigate('/services');
            }}
          >
            services
          </a>
          <a className={`sidebar-option ${getBoldClass('messages')}`}
            href={`/${PROCESS_NAME}/messages`}
            onClick={(event) => {
              event.preventDefault();
              navigate('/messages');
            }}
          >
            messages
          </a>
          <a className={`sidebar-option ${getBoldClass('nodes')}`}
            href={`/${PROCESS_NAME}/nodes`}
            onClick={(event) => {
              event.preventDefault();
              navigate('/nodes');
            }}
          >
            nodes
          </a>
        </div>
      </div>
    );
  }

  return renderComponent();
};

export default Sidebar;