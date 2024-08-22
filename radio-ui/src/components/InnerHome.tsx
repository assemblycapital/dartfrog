import React from 'react';
import useServiceStore from '@dartfrog/puddle/store/service';
import styles from './Home.module.css';
import { Link } from 'react-router-dom';

const InnerHome: React.FC = () => {
  const { localServices } = useServiceStore();

  return (
    <div style={{ display: "flex", flexDirection: "row", flex: 1 }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div>
          <div>join the hub</div>
          <div>4 online, 5 mins ago</div>
        </div>
        <div>create a new station</div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {localServices.map((service, index) => (
          <div key={index}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            <div>
              <span style={{ fontWeight: "bold" }}>title</span>
              <span>{' - '}</span>
              <span>description</span>
            </div>
            <div>
              df://{service.id.toString()}
            </div>
            <div
              style={{
                marginLeft: "0.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  gap: "1rem",
                }}
              >
                <Link to={`/df/service/${service.id.toString()}`} className={styles.actionButton}>join</Link>
                <div className={styles.actionButton}>copy link</div>
                <div className={styles.actionButton}>edit</div>
                <div className={styles.actionButton}>delete</div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  gap: "1rem",
                }}
              >
                <span>4 online,</span>
                <span>5 mins ago</span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  gap: "1rem",
                }}
              >
                Now Playing: 
                <span>{' '}</span>
                <span> internet checkpoint - taia777 </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InnerHome;