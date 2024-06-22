import React, { useEffect, useState, useCallback } from 'react';
import { ServiceId, parseServiceId } from '@dartfrog/puddle';
import usePageStore from '../store/page';

type PageState = {
  page: string;
};

interface PagePluginBoxProps {
  serviceId: ServiceId;
  page: string;
}

const PagePluginBox: React.FC<PagePluginBoxProps> = ({ serviceId, page }) => {
  const [isAuthor, setIsAuthor] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editableText, setEditableText] = useState(page);
  const {sendPageEdit} = usePageStore();

  useEffect(() => {
    const parsedServiceId = parseServiceId(serviceId);
    setIsAuthor(parsedServiceId.node === window.our?.node);
  }, [serviceId]);

  useEffect(() => {
    // Update the editableText only when pageState.page changes
    setEditableText(page);
  }, [page]);

  const handleSave = useCallback(() => {
    sendPageEdit(editableText);
    setEditMode(false);  // Exit edit mode after save
  }, [editableText, serviceId]);

  const iframeView = (
    <iframe
      srcDoc={page}
      style={{ width: '100%', height: '100%', border: 'none' }}
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
            }}
            >
            <textarea
              value={editableText}
              onChange={(e) => setEditableText(e.target.value)}
              style={{ width: '100%', height: '100%', minHeight: '150px' }}
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
        height: '100%',
        width: '100%',
      }}
    >
      {iframeView}
    </div>
  )
};

export default PagePluginBox;
