import React, { useState, useEffect } from 'react';
import RadioPluginBox from './RadioPluginBox';

import {useServiceStore, ChatBox, DisplayUserActivity} from '@dartfrog/puddle';
import Split from 'react-split';
import { ServiceID } from '@dartfrog/puddle';
import { PROCESS_NAME } from '../utils';
import { useNavigate } from 'react-router-dom';

interface RadioHalfChatProps {
}

const RadioHalfChat: React.FC<RadioHalfChatProps> = ({ }) => {

  const {chatState, serviceMetadata, serviceId, api} = useServiceStore();

  const baseOrigin = window.origin.split(".").slice(1).join(".")
  const navigate = useNavigate();
  const shortServiceId = serviceId ? ServiceID.fromString(serviceId).toShortString() : '';

  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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
          href={`http://${baseOrigin}/dartfrog:dartfrog:gliderlabs.os/`}
          onClick={(e)=>{
            api.unsubscribeService();
          }}
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
              api.unsubscribeService();
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
            df://{serviceId}
          </div>
          <div
            style={{
              flex:"1",
              color:"gray",
              display:"flex",
              flexDirection:"row",
              gap:"0.8rem",
            }}
          >
            <div
              style={{
                fontWeight:"bold",
                display:"inline-block"
              }}
            >
              {serviceMetadata?.title || 'title'}
            </div>
            <div
              style={{
                display:"inline-block"
              }}
            >
              {serviceMetadata?.description || 'description'}
            </div>
          </div>
        </div>
        <div
          style={{
            marginLeft: 'auto',
            fontFamily: 'monospace',
            cursor: 'pointer',
          }}
          onClick={() => alert('Current time: ' + currentTime)}
        >
          {currentTime}
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