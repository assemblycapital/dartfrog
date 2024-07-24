import React from 'react';
import { HomeIcon } from '@dartfrog/puddle/components/Icons';
import { PROCESS_NAME } from '../utils';
import { useNavigate } from 'react-router-dom';
import useDartStore from '../store/dart';

const CurrentPageHeader: React.FC = () => {
    const {currentPage} = useDartStore();
    const navigate = useNavigate();
    return (
        <div
          style={{
            fontSize: '0.8rem',
            color: '#9d9d9d',
            backgroundColor: '#333',
            textAlign: 'center',
            width: '100%',
            padding: '0 8px',
            height: '26px',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'default',
            position: 'relative'
          }}
        >
          <a
            style={{
              position: 'absolute',
              left: '0px',
              display: 'flex',
              alignItems: 'center',
              height: '100%',
              cursor: 'pointer',
              padding: '0px 10px'

            }}
            className="hover-dark-gray"
            href={`/${PROCESS_NAME}`}
            onClick={(event) => {
              event.preventDefault()
              navigate(`/`);
            }}
          >
              <HomeIcon size='15px' color='#9d9d9d' />
          </a>
          <div>
            {currentPage}
          </div>
        </div>
    );
};

export default CurrentPageHeader;