import React from 'react';
import useServiceStore from '@dartfrog/puddle/store/service';
import styles from './Home.module.css';
import { Link, useNavigate } from 'react-router-dom';
import { Service, getServiceRecencyText } from '@dartfrog/puddle/index';
import { PROCESS_NAME } from '../utils';
import ProfilePicture from '@dartfrog/puddle/components/ProfilePicture';

const InnerHome: React.FC = () => {
  const { localServices, peerMap, deleteService } = useServiceStore();
  const navigate = useNavigate();

  const isRecentlyActive = (service: Service) => {
    const lastPresence = new Date(service.meta.last_sent_presence * 1000);
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    return lastPresence > fifteenMinutesAgo;
  };

  return (
    <div style={{ display: "flex", flexDirection: "row", flex: 1 }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{flex: 1, padding: "1rem"}}>
          <div
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                cursor: "pointer",
              }}
              className="hover-dark-gray"
              onClick={() => {
                const hubHost = 'waterhouse.os';
                const hubServiceId = `hub:${hubHost}@radio:dartfrog:herobrine.os`;
                navigate(`/df/service/${hubServiceId}`);
              }}
            >
            <div>
              <img src="https://bwyl.nyc3.digitaloceanspaces.com/radio/radio.png" alt="Radio Icon" style={{ width: '72px', height: '72px' }} />
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div>join the hub</div>
            </div>
          </div>
        </div>
        <div style={{flex:3}}>
          {/* <div>
            services...
          </div> */}

        </div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1rem" }}>
        <button
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
        </button>

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
    </div>
  );
};

export default InnerHome;