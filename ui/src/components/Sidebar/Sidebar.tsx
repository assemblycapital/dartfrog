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

interface SidebarProps {}

const Sidebar: React.FC<SidebarProps> = ({ }) => {
  const { isSidebarOpen, nameColors, addNameColor, setIsSidebarOpen } = useDartStore();
  const [myNameColor, setMyNameColor] = useState<string>('');
  const [activeComponent, setActiveComponent] = useState<string>('sidebar');

  useEffect(() => {
    if (window.our?.node) {
      let color = nameColors[window.our?.node];
      if (!color) {
        color = computeColorForName(window.our?.node);
        addNameColor(window.our?.node, color);
      }
      setMyNameColor(color);
    }
  }, [nameColors]);

  const renderComponent = () => {
    let component;
    switch (activeComponent) {
      case 'notifs':
        component = <Notifs />;
        break;
      case 'messages':
        component = <Messages />;
        break;
      case 'invites':
        component = <Invites />;
        break;
      case 'friends':
        component = <Friends />;
        break;
      case 'settings':
        component = <Settings />;
        break;
      default:
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
                  marginBottom: '1rem',
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

              <div className='profile'>

                <div className='profile-image'>
                  <img src="assets/dartfrog256_nobg.png" alt="profile" />
                </div>
                <div
                  className='profile-name'
                  style={{
                    flex: '1',
                    color: myNameColor,
                    fontSize: '1.5em',
                    cursor: 'pointer',
                  }}
                >
                  {window.our?.node}
                </div>
              </div>
              {/* <div className='sidebar-option' onClick={() => setActiveComponent('notifs')}>
                notifs
              </div> */}
              <div className='sidebar-option' onClick={() => setActiveComponent('messages')}>
                messages
              </div>
              {/* <div className='sidebar-option' onClick={() => setActiveComponent('invites')}>
                invites
              </div> */}
              <div className='sidebar-option' onClick={() => setActiveComponent('friends')}>
                friends
              </div>
              <div className='sidebar-option' onClick={() => setActiveComponent('settings')}>
                settings
              </div>
            </div>
          </div>
        );
    }

    return (
      <div
        style={{
          overflow: 'hidden',
          height: '100%',
          width: '100%',
          display: "flex",
          flexDirection: "column"
        }}
      >
        <div 
          style={{
            backgroundColor: '#333',
            color: '#b4b4b4',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.4rem',
            height: '26px',
            gap: '1rem',
            overflowX: 'hidden',
            overflowY: 'hidden',
            padding: '0px 10px',
            position: 'relative',
            fontSize: '0.8em',
            userSelect: 'none',
          }}
        >
          <div
            onClick={() => setActiveComponent('sidebar')}
            className='sidebar-back-button'
            style={{ cursor: 'pointer',
              flex:1,
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'absolute',
              left: '0px',
              padding: '0px 3px',
              // color: '#808080',
            }}
          >
            back
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>

            {activeComponent}
          </div>

        </div>
        <div
          style={{
            height:"100%",
            width:"100%",
            maxHeight:"100%",
            flexGrow:"1",
          }}
        >

          {component}
        </div>
      </div>
    );
  };

  return renderComponent();
};

export default Sidebar;

