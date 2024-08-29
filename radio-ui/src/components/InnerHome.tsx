import React from 'react';
import useServiceStore from '@dartfrog/puddle/store/service';
import styles from './Home.module.css';
import { Link, useNavigate } from 'react-router-dom';
import { Service, getServiceRecencyText } from '@dartfrog/puddle/index';
import { PROCESS_NAME } from '../utils';
import ProfilePicture from '@dartfrog/puddle/components/ProfilePicture';

const InnerHome: React.FC = () => {
  const { localServices } = useServiceStore();
  const navigate = useNavigate();

  const isRecentlyActive = (service: Service) => {
    const lastPresence = new Date(service.meta.last_sent_presence * 1000);
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    return lastPresence > fifteenMinutesAgo;
  };

  return (
    <div style={{ display: "flex", flexDirection: "row", flex: 1 }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div>
          <div>join the hub</div>
          <div>4 online, 5 mins ago</div>
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div
          className='hover-gray'
          style={{
            cursor:"pointer",
            padding:"1rem",

          }}
        >
          create a new station
        </div>

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
              <div style={{ fontSize: "0.7rem" }}>
                df://{service.id.toString()}
              </div>
              <div style={{ marginLeft: "0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", flexDirection: "row", gap: "1rem" }}>
                  <Link to={`/df/service/${service.id.toString()}`}
                    className={`${styles.actionButton} df`}
                  >
                    join
                  </Link>
                  <div className={styles.actionButton}>copy link</div>
                  {service.id.hostNode() === window.our?.node && (
                    <div className={styles.actionButton} onClick={() => navigate(`/services/${service.id.toString()}`)}>edit</div>
                  )}
                  <div className={styles.actionButton}>delete</div>
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