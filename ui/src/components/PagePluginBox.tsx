import React, { useEffect, useState, useCallback } from 'react';
import { ServiceId, parseServiceId } from '@dartfrog/puddle';
import useDartStore from '../store/dart';

type PageState = {
  page: string;
};

interface PagePluginBoxProps {
  serviceId: ServiceId;
  pageState: PageState;
}

const PagePluginBox: React.FC<PagePluginBoxProps> = ({ serviceId, pageState }) => {
  const { pokeService } = useDartStore();
  const [isAuthor, setIsAuthor] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editableText, setEditableText] = useState(pageState.page);

  useEffect(() => {
    const parsedServiceId = parseServiceId(serviceId);
    setIsAuthor(parsedServiceId.node === window.our?.node);
  }, [serviceId]);

  useEffect(() => {
    // Update the editableText only when pageState.page changes
    setEditableText(pageState.page);
  }, [pageState.page]);

  const handleSave = useCallback(() => {
    const innerPluginRequest = {
      "Write": editableText
    };
    const data = {
      "PluginRequest": [
        "page",
        JSON.stringify(innerPluginRequest)
      ]
    };
    let parsedServiceId = parseServiceId(serviceId);
    pokeService(parsedServiceId, data);
    setEditMode(false);  // Exit edit mode after save
  }, [editableText, pokeService, serviceId]);

  const iframeView = (
    <iframe
      srcDoc={pageState.page}
      style={{ width: '100%', height: '100%', border: 'none' }}
      sandbox=""
    />
  );

  if (isAuthor) {
    return (
      <div
        style={{
          height: '500px',
        }}
      >
        {editMode ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: "2px",
              height: '100%',
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
        height: '500px',
      }}
    >
      {iframeView}
    </div>
  )
};

export default PagePluginBox;
