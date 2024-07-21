import { Service, getServiceRecencyText } from '@dartfrog/puddle/index';
import { useNavigate } from 'react-router-dom';
import React from 'react';

import './ServiceCard.css'
import ProfilePicture from '../ProfilePicture';

interface ServiceCard {
  service:Service
}

const ServiceCard: React.FC<ServiceCard> = ({ service }) => {
    const navigate = useNavigate();
    return (
        <div
          className="service-card hover-dark-gray"
          style={{
            cursor:"pointer",
            padding:"1rem",
            display:"flex",
            flexDirection:"row",
            justifyContent: "center",
            alignItems: "center",
            gap:"1rem",
          }}
          onClick={()=>{
            navigate(`/join/${service.id.toString()}`)

          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <ProfilePicture node={service.id.hostNode()} size={'24px'} />
          </div>
          <div
            style={{
              display:"flex",
              flexDirection:"column",

            }}
          >
            <div
            >
              <span
                className={"link"}
              >
              {'df://'}{service.id.toShortString()}
              </span>
            </div>
            <div
              style={{
                color:'gray',
                fontSize:'0.6rem',
              }}
            >
              {service.id.process()}
            </div>

          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
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
        </div>
    );
};

export default ServiceCard;