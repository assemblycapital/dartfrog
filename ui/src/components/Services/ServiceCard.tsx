import { Service, getServiceRecencyText } from '@dartfrog/puddle/index';
import { useNavigate } from 'react-router-dom';
import React from 'react';

import './ServiceCard.css'
import ProfilePicture from '../ProfilePicture';
import { PROCESS_NAME } from '../../utils';

interface ServiceCard {
  service:Service
}

const ServiceCard: React.FC<ServiceCard> = ({ service }) => {
    const navigate = useNavigate();

    const isRecentlyActive = () => {
        const lastPresence = new Date(service.meta.last_sent_presence*1000);
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        return lastPresence > fifteenMinutesAgo;
    };

    return (
        <a
          className="service-card hover-dark-gray color-white"
          style={{
            cursor:"pointer",
            padding:"1rem",
            display:"flex",
            flexDirection:"row",
            justifyContent: "center",
            alignItems: "center",
            gap:"1rem",
            userSelect:"none",
          }}
          href={`/${PROCESS_NAME}/join/${service.id.toString()}`}
        >
          <div
            style={{
              flex:"1",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <ProfilePicture node={service.id.hostNode()} size={'36px'} />
          </div>
          <div
            style={{
              flex:"2",
              display:"flex",
              flexDirection:"column",
              // alignItems:"center",
              overflow:"hidden",
              flexShrink: 1,
              minWidth: 0,
            }}
          >
            <div
              style={{
              }}
            >
              <span
                className={''}
                style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {service.id.toShortString()}
              </span>
            </div>
            <div
              style={{
                color:'gray',
                fontSize:'0.6rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
                {service.id.process()}
            </div>
 
          </div>
          <div
            style={{
              flex:"2",
              overflow:"hidden",
              flexShrink: 1,
              minWidth: 0,
              display:"flex",
              flexDirection:"row",
            }}
          >

          <div
            style={{
              display:"flex",
              flexDirection:"column",
              overflow:"hidden",
            }}
          >
            <div
              style={{
              }}
            >
              <span
                className={''}
                style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {service.meta.title}
              
              </span>
            </div>
            <div
              style={{
                color:'gray',
                fontSize:'0.6rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {service.meta.description}
            </div>
 
          </div>
            {service.id.hostNode() === window.our?.node && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`/services/${service.id.toString()}`);
                }}
                style={{
                  padding: '5px 10px',
                  cursor: 'pointer',
                  marginLeft: "1rem",
                }}
              >
                edit
              </button>
            )}

          </div>
          <div
            style={{
              flex:"1",
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
            }}
          >
            {service.meta.subscribers && service.meta.subscribers.length > 0 && isRecentlyActive() ? (
              <span>
                {service.meta.subscribers.length} online
              </span>
            ) : (
              <span
                style={{
                  color:"gray",
                }}
              >
                {getServiceRecencyText(service)}
              </span>
            )}
           
          </div>
        </a>
    );
};

export default ServiceCard;