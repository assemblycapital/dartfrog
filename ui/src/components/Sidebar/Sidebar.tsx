import React, { useEffect, useState } from 'react';
import './Sidebar.css';
import useDartStore from '../../store/dart';
import { computeColorForName } from '@dartfrog/puddle/utils';

interface SidebarProps {
  // isSidebarOpen: boolean;
  // setIsSidebarOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ }) => {
  const { isSidebarOpen, setIsSidebarOpen, nameColors, addNameColor} = useDartStore();

  const [myNameColor, setMyNameColor] = useState<string>('');
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

  return (
    <div className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
      <div
        className={`profile`}
      >
        <div>
          <div className='profile-image'
          >
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
      <div
        style={{
          cursor: 'pointer',
        }}
      >
        notifs
      </div>
      <div
        style={{
          cursor: 'pointer',
        }}
      >
        messages
      </div>
      <div
        style={{
          cursor: 'pointer',
        }}
      >
        invites
      </div>
      <div
        style={{
          cursor: 'pointer',
        }}
      >
        friends
      </div>
      <div
        style={{
          cursor: 'pointer',
        }}
      >
        settings
      </div>

    </div>
  );
};

export default Sidebar;
