import React, { useEffect } from 'react';
import CurrentPageHeader from '../CurrentPageHeader';
import useDartStore from '../../store/dart';

const Messages: React.FC = () => {
    const {setCurrentPage} = useDartStore();
    useEffect(()=>{
        setCurrentPage('messages')
    }, [])
    return (
        <div>
            <CurrentPageHeader />
            <div>

                todo messages
            </div>
        </div>
    );
};

export default Messages;
