import React, { useCallback, useEffect, useState } from 'react';
import styles from './Home.module.css';
import { Link, useNavigate } from 'react-router-dom';
import { Service, ServiceAccess, ServiceCreationOptions, ServiceVisibility, getServiceRecencyText, useServiceStore, HUB_NODE } from '@dartfrog/puddle';
import {PROCESS_NAME } from '../utils';
import ReactPlayer from 'react-player';

const ServiceList: React.FC = () => {
  const { localServices, deleteService } = useServiceStore();
  const navigate = useNavigate();

  const isRecentlyActive = (service: Service) => {
    const lastPresence = new Date(service.meta.last_sent_presence * 1000);
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    return lastPresence > fifteenMinutesAgo;
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* <button
        className='df'
        style={{
          cursor:"pointer",
          padding:"1rem",
          width:"auto",
        }}
        onClick={()=>{
          navigate("/create")
        }}
      >
        create a new station
      </button> */}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1rem" }}>
        {localServices.map((service, index) => (
          <div key={index}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              padding: "1rem",
            }}
            className='hover-dark-gray color-white'
          >
            {(service.meta.title || service.meta.description) && (
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ flex: 1 }}>
                  {service.meta.title && (
                    <span style={{ fontWeight: "bold" }}>{service.meta.title}</span>
                  )}
                  {service.meta.title && service.meta.description && <span>{' - '}</span>}
                  {service.meta.description && (
                    <span style={{ fontSize: "0.7rem" }}>{service.meta.description}</span>
                  )}
                </div>
              </div>
            )}
            <div
              style={{
                fontSize: "0.7rem",
                color:"#646cff",

              }}
            >
              df://{service.id.toString()}
            </div>
            <div style={{ marginLeft: "0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ display: "flex", flexDirection: "row", gap: "1rem" }}>
                <Link to={`/df/service/${service.id.toString()}`}
                  className={`${styles.actionButton} df`}
                >
                  join
                </Link>
                {/* <div className={styles.actionButton}>copy link</div> */}
                {/* {service.id.hostNode() === window.our?.node && (
                  <div className={styles.actionButton} onClick={() => navigate(`/services/${service.id.toString()}`)}>edit</div>
                )} */}
                <div className={styles.actionButton}
                   onClick={() => {
                    if (window.confirm(`Are you sure you want to delete ${service.id.toString()}?`)) {
                      deleteService(service.id.toString());
                    }
                  }}

                >
                  delete
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "row", gap: "1rem", fontSize: "0.7rem" }}>
                {service.meta.subscribers && service.meta.subscribers.length > 0 && isRecentlyActive(service) ? (
                  <span>{service.meta.subscribers.length} online</span>
                ) : (
                  <span style={{ color: "gray" }}>{getServiceRecencyText(service)}</span>
                )}
              </div>
              {/* {service.meta.now_playing && (
                <div style={{ display: "flex", flexDirection: "row", gap: "1rem", fontSize: "0.7rem" }}>
                  Now Playing: 
                  <span>{' '}</span>
                  <span>{service.meta.now_playing}</span>
                </div>
              )} */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const InnerHome: React.FC = () => {
  const navigate = useNavigate();
  const {localServices, createService} = useServiceStore();
  const [hasMyService, setHasMyService] = useState(false);

  useEffect(()=>{

    for (const service of localServices) {
      if (service.id.name === 'radio-hub') {
        setHasMyService(true);
        break;
      }
    }
  }, [localServices])

  const handleClickMyService = useCallback(() => {
    if (!hasMyService) {
      const serviceOptions: ServiceCreationOptions = {
        serviceName: 'radio-hub',
        processName:  PROCESS_NAME,
        visibility: ServiceVisibility.Visible,
        access: ServiceAccess.Public,
        whitelist: [],
        publishUserPresence: true,
        publishSubscribers: true,
        publishWhitelist: false,
        publishSubscriberCount: false,
      };
      createService(serviceOptions);
    }
    navigate(`/df/service/radio-hub:${window.our?.node}@radio:dartfrog:herobrine.os`);
  }, [hasMyService])

  return (
      <div style={{ display: "flex", flexDirection: "row", gap: "1rem", width:"100%",}}>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ 
          padding: "1rem",
          paddingBottom:"0px",
          cursor:"pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          // height: "100%",
        }}
              className="hover-dark-gray"
              onClick={() => {
                const hubHost = HUB_NODE
                const hubServiceId = `radio-hub:${hubHost}@radio:dartfrog:herobrine.os`;
                navigate(`/df/service/${hubServiceId}`);
              }}
        >
          <img src="https://i.postimg.cc/J7vfr0d3/38e531b0-c773-4731-9e5d-e405c4436b1c.webp"
            style={{
              height:"20rem",
              width:"20rem",
              objectFit: "contain",
            }}
          />
          <div
              style={{
                // height: "100%",
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
            <div>
              <img 
                src="https://bwyl.nyc3.digitaloceanspaces.com/radio/radio.png" 
                alt="Radio Icon" 
                style={{ 
                  width: '72px', 
                  height: '72px',
                  animation: 'pulse 2s infinite ease-in-out'
                }} 
              />
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                paddingRight:"2rem",
              }}
            >
              <button className='df' style={{width:"auto", padding:"9px"}}>join the hub!</button>
            </div>
          </div>
        </div>
        <hr />
        <div 
          style={{
            display: "flex",
            flexDirection: "column",
            // padding: "0.6rem",
            position: "relative",
            // paddingTop:"32px"
          }}
        >
          <img 
            src="https://media.tenor.com/PWaOCHK8jKEAAAAi/music-notes-sound.gif"
            style={{
              width: "48px",
              height: "48px",
              position: "absolute",
              top: "-32px",
              left: "1rem",
              transform: "translateX(-50%)",
              zIndex: 1,
            }}
          />
          <a
            className="hover-dark-gray color-white"
            style={{
              cursor: "pointer",
              padding: "1rem",
              position: "relative",
              zIndex: 0,
            }}
            href=""
            onClick={(e)=>{
              e.preventDefault()
              handleClickMyService()

            }}
          >
            my station
          </a>
        </div>
        <hr />
        <div
          style={{
            // flex:"1",
            display: "flex",
            flexDirection: "row",
            height:"7rem",
            gap:"4px",

          }}
        >
          <div className="hover-dark-gray big-category-button"
            onClick={() => {
              const hubHost = HUB_NODE
              const serviceId = `music:${hubHost}@radio:dartfrog:herobrine.os`;
              navigate(`/df/service/${serviceId}`);
            }}
          >
            music
          </div>
          <div style={{
            borderLeft: "1px solid #444",
            height: "100%"
          }}
          />

          <div className="hover-dark-gray big-category-button"
            onClick={() => {
              const hubHost = HUB_NODE
              const serviceId = `learn:${hubHost}@radio:dartfrog:herobrine.os`;
              navigate(`/df/service/${serviceId}`);
            }}
          >
            learn
          </div>

          <div style={{
            borderLeft: "1px solid #444",
            height: "100%"
          }}
          />
          <div className="hover-dark-gray big-category-button"
            onClick={() => {
              const hubHost = HUB_NODE
              const serviceId = `random:${hubHost}@radio:dartfrog:herobrine.os`;
              navigate(`/df/service/${serviceId}`);
            }}
          >
            random
          </div>
        </div>
      </div>
      <div style={{display:"flex", flexDirection:"column", flexGrow:"1"}}>
        <div 
          style={{
            display: "flex",
            flexDirection: "column",
            // position: "relative",
            gap:"1rem",
          }}
        >
          <ReactPlayer url={'https://youtu.be/9bjpX5kerOQ'}
            width="100%"
            height="20rem"
            controls
            style={{
              backgroundColor:"#1b1b1b"
            }}
          />
          <ReactPlayer url={'https://youtu.be/7ENMpzR54us'} 
            width="100%"
            height="20rem"
            controls
            style={{
              backgroundColor:"#1b1b1b"
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default InnerHome;