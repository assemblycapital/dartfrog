import React, { useEffect, useState, useCallback } from 'react';
import { ServiceID } from '@dartfrog/puddle';
import usePageStore from '../store/page';
import useChatStore from '@dartfrog/puddle/store/service';


interface PagePluginBoxProps {
}

const PagePluginBox: React.FC = ({ }) => {
  const [isAuthor, setIsAuthor] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const {page, sendPageEdit} = usePageStore();
  const [editableText, setEditableText] = useState(page);

  const {api} = useChatStore();
  const {serviceId} = useChatStore();

  useEffect(() => {
    const parsedServiceId = ServiceID.fromString(serviceId);
    if (!parsedServiceId) return;
    setIsAuthor(parsedServiceId.hostNode() === window.our?.node);
  }, [serviceId]);

  useEffect(() => {
    // Update the editableText only when pageState.page changes
    setEditableText(page);
  }, [page]);

  const handleSave = useCallback(() => {
    sendPageEdit(api, editableText);
    setEditMode(false);  // Exit edit mode after save
  }, [editableText, api]);

  const iframeView = (
    <iframe
      srcDoc={page}
      style={{
        width: '100%',
        height: '100%',
        // border: '1px solid green',
        border: 'none',
        boxSizing: 'border-box',
      }}
      sandbox=""
    />
  );

  if (isAuthor) {
    return (
      <div
        style={{
          // height: '500px',
          height: '100%',
          width: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {editMode ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: "2px",
              height: '100%',
              width: '100%',
              overflow: 'hidden',
            }}
            >
            <textarea
              value={editableText}
              onChange={(e) => setEditableText(e.target.value)}
              style={{ width: '100%', height: '100%', flex: 1, overflow: 'auto' }}
            />
            <div>
              <button onClick={handleSave}>Save</button>
              <button onClick={() => setEditMode(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: "2px",
              height: '100%',
              overflow: 'hidden',
            }}
            >
            {iframeView}
            <button onClick={() => setEditMode(true)}>Edit</button>
          </div>
        )}
      </div>
    );
  }

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
      {iframeView}
    </div>
  )
};

export default PagePluginBox;
