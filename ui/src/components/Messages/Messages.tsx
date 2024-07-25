import React, { useCallback, useEffect, useState } from 'react';
import CurrentPageHeader from '../CurrentPageHeader';
import useDartStore from '../../store/dart';
import { useNavigate } from 'react-router-dom';

const Messages: React.FC = () => {
    const {setCurrentPage, messageStoreMap} = useDartStore();
    useEffect(()=>{
        setCurrentPage('messages')
    }, [])

    const [inputValue, setInputValue] = useState('');

    const navigate = useNavigate();


    const handleSubmit = useCallback(() => {
        if (inputValue === "") return;
        navigate(`/messages/${inputValue}`)
    }, [inputValue]);


    return (
        <div>
            <div style={{ marginTop: "1rem"}}>
                <input 
                type="text" 
                value={inputValue} 
                onChange={(e) => setInputValue(e.target.value)} 
                />
                <button onClick={handleSubmit}>find</button>
            </div>

            <div>
                {Array.from(messageStoreMap.entries()).map(([key, value]) => (
                        <div key={key}>
                            <h3>{key}</h3>
                            <pre>{JSON.stringify(value, null, 2)}</pre>
                        </div>
                    ))}

            </div>
        </div>
    );
};

export default Messages;
