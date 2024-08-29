import React from 'react';
import RadioPluginBox from './RadioPluginBox';

import useServiceStore from '@dartfrog/puddle/store/service';
import Split from 'react-split';
import { ServiceID } from '@dartfrog/puddle';
import { PROCESS_NAME } from '../utils';
import { useNavigate } from 'react-router-dom';
import ChatBox from '@dartfrog/puddle/components/ChatBox';
import DisplayUserActivity from '@dartfrog/puddle/components/DisplayUserActivity';


interface RadioHalfChatProps {
}

const RadioHalfChat: React.FC<RadioHalfChatProps> = ({ }) => {

  const {chatState, serviceMetadata, serviceId} = useServiceStore();

  const baseOrigin = window.origin.split(".").slice(1).join(".")
  const navigate = useNavigate();
  const shortServiceId = serviceId ? ServiceID.fromString(serviceId).toShortString() : '';

  return (
    <div
      style={{
        height: '100vh',
        maxHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px',
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          marginBottom:"0.8rem",
          display: 'flex',
          flexDirection: 'row',
          gap:"0.8rem",
          fontSize:"0.7rem",
        }}
      >
        <a
          style={{
            fontFamily:"monospace",
            // border:"1px solid #d1d1d1",
            display:"inline-block",
            cursor:"pointer",
            padding:"0.4rem",
            // color:"black",
          }}
          className='underline-on-hover color-white'
          href={`http://${baseOrigin}/dartfrog:dartfrog:herobrine.os/`}
        >
          df
        </a>
        <div
          style={{
            fontSize:"1.3rem",
            cursor:"pointer",
          }}
        >
          <a 
            href={`/${PROCESS_NAME}/`}
            onClick={(event) => {
              event.preventDefault();
              navigate(`/`);
            }}
          >
          📻
          </a>

        </div>
        {/* <div
          style={{
            fontFamily:"monospace",
            display:"inline-block",
            cursor:"pointer",
            padding:"0.4rem",
            border:"1px solid #d1d1d1",
          }}
          className='underline-on-hover'
        >
          navigation
        </div> */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontFamily:"monospace",
          }}
        >
          <div
            style={{
              flex:"1",
              fontWeight:"bold",
            }}
          >
            df://{shortServiceId}
          </div>
          <div
            style={{
              flex:"1",
              color:"gray",
            }}
          >
            description
          </div>
        </div>
      </div>
      <div
        style={{
          flex: '1 1 100%',
          maxHeight: "100%",
          overflow: 'auto',
        }}
      >
        <Split
          sizes={[65, 40]}
          minSize={[60, 60]}
          direction="horizontal"
          gutterSize={10}
          style={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'row',
            overflowX: 'hidden',
            height:"100%",
            maxHeight:"100%",
            overflowY: 'hidden',
          }}
        >
          <div
            style={{
              display:"flex",
              flex:"1",
              flexDirection:"column",
              height:"100%",
            }}
          >
            <RadioPluginBox />
          </div>
          <div
            style={{
              height: "100%",
              maxHeight: "100%",
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              gap: "6px",
            }}
          >
            <div style={{ flex: 1, overflow: 'auto' }}>
              <ChatBox chatState={chatState} />
            </div>
            <DisplayUserActivity metadata={serviceMetadata} />
          </div>
        </Split>
      </div>
    </div>
  );
};

export default RadioHalfChat;