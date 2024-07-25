import React, { useCallback, useEffect, useState } from 'react';
import CurrentPageHeader from '../CurrentPageHeader';
import useDartStore from '../../store/dart';
import { useNavigate, useParams } from 'react-router-dom';

const Messages: React.FC = () => {
    const {setCurrentPage, messageStoreMap, requestNewMessageStore, } = useDartStore();

    const { node } = useParams<{ node: string }>();

    const [inputValue, setInputValue] = useState('');

    const navigate = useNavigate();

    useEffect(()=>{
        setCurrentPage('messages')
    }, [])


    useEffect(()=>{
        
        let gotMessageStore = messageStoreMap.get(node);
        if (!gotMessageStore) {


            requestNewMessageStore(node)
            return;

        }
        console.log("got message store!", gotMessageStore)
    }, [messageStoreMap])

    return (
        <div>
            message node! {node}
        </div>
    );
};

export default Messages;
