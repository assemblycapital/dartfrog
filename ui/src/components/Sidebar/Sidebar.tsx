import React, { useEffect, useState } from 'react';
import './Sidebar.css';
import useDartStore from '../../store/dart';
import { AssemblyCapitalLogo, XIcon } from '@dartfrog/puddle';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_PFP, NameColor, getClassForNameColor } from '@dartfrog/puddle';
import { PROCESS_NAME, DARTFROG_VERSION } from '../../utils';

interface SidebarProps {}

const Sidebar: React.FC<SidebarProps> = ({ }) => {
  const { isSidebarOpen, setIsSidebarOpen, currentPage, isClientConnected, messageStoreMap} = useDartStore();
  const [profileImage, setProfileImage] = useState<string>(DEFAULT_PFP);
  const [nameColorClass, setNameColorClass] = useState<string>('name-color-default');
  const [hasUnreadMessages, setHasUnreadMessages] = useState<boolean>(false);

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

  useEffect(()=>{
    // if there are any unread in any messages, set true, otherwise false
    const hasUnread = Array.from(messageStoreMap.values()).some(store => 
      store.history.some(message => message.is_unread)
    );
    setHasUnreadMessages(hasUnread);
  },[messageStoreMap]);


  const renderComponent = () => {
    const getBoldClass = (page: string) => currentPage === page ? 'bold' : '';

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          height:"100%",
        }}
      >
        <div
          style={{
            backgroundColor: '#333',
            color: '#9d9d9d',
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
              alignItems: 'center',
              justifyContent: 'center', // Center vertically
              height: '100%' // Ensure the anchor takes full height
            }}
            onClick={(event) => {
              event.preventDefault();
              navigate(`/nodes/${window.our?.node}`);
            }}
          >
            <div
              style={{
                width: "100%",
                flexGrow:"1",
                display: 'flex',
                alignItems: 'center', // Center text vertically
                justifyContent: 'center' // Center text horizontally
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
                textAlign: 'center', // Center text horizontally
                display: 'flex', // Use Flexbox
                alignItems: 'center', // Center text vertically
                justifyContent: 'center' // Center text horizontally
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
            style={{
              display:"flex",
              flexDirection:"row",
              gap:"1rem",
            }}
          >
            {hasUnreadMessages &&
              <span
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}

                className="name-color-blue"
                >
                  ●
              </span>
            }
            <span>

              messages
            </span>
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
          <div
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              marginTop: 'auto', 
              flexGrow: '1', 
              height: "100%",
              color:'#818181',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap:"0.6rem",
            }}
          >
            <AssemblyCapitalLogo color={'#818181'} />
            <span
              style={{
                fontSize:'0.5rem',
                cursor:"default"
              }}
            >
              dartfrog {DARTFROG_VERSION}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return renderComponent();
};

export default Sidebar;