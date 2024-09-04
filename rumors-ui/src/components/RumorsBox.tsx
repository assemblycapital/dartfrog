import React, { useEffect, useState, useCallback } from 'react';
import { ServiceID } from '@dartfrog/puddle';
import useServiceStore from '@dartfrog/puddle/store/service';
import useRumorsStore from '../store/rumors';


interface PagePluginBoxProps {
}

const PagePluginBox: React.FC = ({ }) => {
  const [isAuthor, setIsAuthor] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const {api, serviceId} = useServiceStore();

  useEffect(() => {
    const parsedServiceId = ServiceID.fromString(serviceId);
    if (!parsedServiceId) return;
    setIsAuthor(parsedServiceId.hostNode() === window.our?.node);
  }, [serviceId]);


  return (
    <div
      style={{
        // height: '500px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        boxSizing: 'border-box',
        // border: '1px solid red',
      }}
    >
      TODO rumors
    </div>
  )
};

export default PagePluginBox;
