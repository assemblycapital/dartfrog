import React, { useEffect, useState } from 'react';
import './Sidebar.css';
import useDartStore from '../../store/dart';
import { computeColorForName } from '@dartfrog/puddle/utils';
import Notifs from './Notifs';
import Messages from './Messages';
import Invites from './Invites';
import Settings from './Settings';
import Friends from './Friends';
import { XIcon } from '../icons/Icons';
import defaultProfileImage from '../../assets/dartfrog256_nobg.png';
import { useNavigate } from 'react-router-dom';
import { NameColor, getClassForNameColor } from '@dartfrog/puddle/index';

interface SidebarProps {}

const Sidebar: React.FC<SidebarProps> = ({ }) => {
  const { isSidebarOpen, setIsSidebarOpen, } = useDartStore();
  const [profileImage, setProfileImage] = useState<string>(defaultProfileImage);
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
                <div className="close-sidebar-button" style={{ position: 'absolute', right: '0px' }}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <div className="close-sidebar-button-svg" style={{ width: '16px', height: '16px' }}>
                    <XIcon />
                  </div>
                </div>
              </div>
              <div className='sidebar'>

              <div className='profile'
                style={{
                  cursor:"pointer"
                }}
                onClick={()=>{
                  navigate(`/nodes/${window.our?.node}`)

                }}
              >

                <div
                  style={{
                    width:"100%",
                  }}
                >
                  <div
                    style={{
                      width:'15vh',
                      height:'15vh',
                      maxWidth:'15vh',
                      maxHeight:'15vh',
                      minWidth:'15vh',
                      minHeight:'15vh',
                    }}
                  >
                    <div className='profile-image'>
                      <img src={profileImage} alt="profile" />
                    </div>
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
              </div>
              <div className={`sidebar-option`}
                onClick={()=>{
                  navigate("/");
                }}
              >
                home 
              </div>
              <div className={`sidebar-option`}
                onClick={()=>{
                  navigate("/services");
                }}
              >
                services
              </div>
              <div className={`sidebar-option`}
                onClick={()=>{
                  navigate("/messages");
                }}
              >
                messages
              </div>
              <div className={`sidebar-option`}
                onClick={()=>{
                  navigate("/nodes");
                }}
              >
                nodes
              </div>
            </div>
          </div>
        );
    }


  return renderComponent();
};

export default Sidebar;
