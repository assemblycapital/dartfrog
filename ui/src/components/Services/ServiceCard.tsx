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
              alignItems:"center",
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
              flex:"1",
              display: "flex",
              justifyContent: "flex-start",
            }}
          >
            {service.meta.subscribers.length === 0 ? (

              <span>
                {getServiceRecencyText(service)}
              </span>
            ):(
              <span>
                {service.meta.subscribers.length} online
              </span>
            )}
          </div>
        </a>
    );
};

export default ServiceCard;