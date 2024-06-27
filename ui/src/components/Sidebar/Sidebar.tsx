import React, { useEffect, useState } from 'react';
import './Sidebar.css';
import useDartStore from '../../store/dart';
import { computeColorForName } from '@dartfrog/puddle/utils';
import Notifs from './Notifs';
import Messages from './Messages';
import Invites from './Invites';
import Settings from './Settings';
import Friends from './Friends';

interface SidebarProps {}

const Sidebar: React.FC<SidebarProps> = ({ }) => {
  const { isSidebarOpen, nameColors, addNameColor } = useDartStore();
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
          <div className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
            <div className={`profile`}>
              <div>
                <div className='profile-image'>
                  <img src="assets/dartfrog256_nobg.png" alt="profile" />
                </div>
              </div>
              <div
                className='profile-name'
                style={{
                  color: myNameColor,
                  fontSize: '1.5em',
                  cursor: 'pointer',
                }}
              >
                {window.our?.node}
              </div>
            </div>
            <div style={{ cursor: 'pointer' }} onClick={() => setActiveComponent('notifs')}>
              notifs
            </div>
            <div style={{ cursor: 'pointer' }} onClick={() => setActiveComponent('messages')}>
              messages
            </div>
            <div style={{ cursor: 'pointer' }} onClick={() => setActiveComponent('invites')}>
              invites
            </div>
            <div style={{ cursor: 'pointer' }} onClick={() => setActiveComponent('friends')}>
              friends
            </div>
            <div style={{ cursor: 'pointer' }} onClick={() => setActiveComponent('settings')}>
              settings
            </div>
          </div>
        );
    }

    return (
      <div
        style={{
          overflow: 'hidden',
        }}
      >
        <div 
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            height: '26px',
            color: '#757575',
            backgroundColor: '#1f1f1f',
            gap: '1rem',
            overflowX: 'hidden',
            overflowY: 'hidden',
            padding: '0px 10px',
          }}
        >
          <div
            onClick={() => setActiveComponent('sidebar')}
            style={{ cursor: 'pointer',
              flex:1,
              height: '100%',
              display: 'flex', // Added
              alignItems: 'center', // Added
            }}
          >
            back
          </div>

          <div
            style={{
              flex:3,
              height: '100%',
              fontSize: '1.5em',
              display: 'flex', // Added
              alignItems: 'center', // Added
            }}
          >
            {activeComponent}
          </div>
        </div>
        {component}
      </div>
    );
  };

  return renderComponent();
};

export default Sidebar;
