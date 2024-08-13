import React, { useState, useEffect } from 'react';
import { Service, ServiceAccess, ServiceVisibility, ServiceEditOptions } from '@dartfrog/puddle/index';
import "./EditServiceForm.css";

interface EditServiceFormProps {
    service: Service;
    onSubmit: (options: ServiceEditOptions) => void;
    availablePeers: string[];
}

const EditServiceForm: React.FC<EditServiceFormProps> = ({ service, onSubmit, availablePeers }) => {
    const [selectedAccess, setSelectedAccess] = useState<ServiceAccess>(service.meta.access);
    const [selectedVisibility, setSelectedVisibility] = useState<ServiceVisibility>(service.meta.visibility);
    const [title, setTitle] = useState(service.meta.title);
    const [description, setDescription] = useState(service.meta.description);
    const [publishUserPresence, setPublishUserPresence] = useState(service.meta.publish_user_presence);
    const [publishSubscribers, setPublishSubscribers] = useState(service.meta.publish_subscribers);
    const [publishWhitelist, setPublishWhitelist] = useState(service.meta.publish_whitelist);
    const [publishSubscriberCount, setPublishSubscriberCount] = useState(service.meta.publish_subscriber_count);
    const [whitelist, setWhitelist] = useState<string[]>(service.meta.whitelist);
    const [isCustomWhitelist, setIsCustomWhitelist] = useState(false);
    const [customWhitelistPeer, setCustomWhitelistPeer] = useState('');

    const handleAccessChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedAccess(e.target.value as ServiceAccess);
    };

    const handleVisibilityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedVisibility(e.target.value as ServiceVisibility);
    };

    const handleRemoveFromWhitelist = (peer: string) => {
        setWhitelist(whitelist.filter(p => p !== peer));
    };

    const handleAddToWhitelist = (value: string) => {
        if (value === 'custom') {
            setIsCustomWhitelist(true);
        } else if (!whitelist.includes(value)) {
            setWhitelist([...whitelist, value]);
        }
    };

    const handleCustomWhitelistChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCustomWhitelistPeer(e.target.value);
    };

    const handleAddCustomWhitelist = () => {
        if (customWhitelistPeer && !whitelist.includes(customWhitelistPeer)) {
            setWhitelist([...whitelist, customWhitelistPeer]);
            setCustomWhitelistPeer('');
            setIsCustomWhitelist(false);
        }
    };

    const handleSubmit = () => {
        const serviceOptions: ServiceEditOptions = {
            title: title || undefined,
            description: description || undefined,
            access: selectedAccess,
            visibility: selectedVisibility,
            whitelist,
            publishUserPresence,
            publishSubscribers,
            publishWhitelist,
            publishSubscriberCount,
        };

        onSubmit(serviceOptions);
    };

    return (
      <div
      style={{
        display: "flex",
        flexDirection:"column",
        gap: "0.6rem",
        fontSize:"0.8rem",
      }}
    >
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
        <span style={{ marginRight: "0.5rem" }}>Access:</span>
        <select
          name="serviceAccessOption"
          id="serviceAccessOption"
          value={selectedAccess}
          onChange={handleAccessChange}
        >
          <option value="Public">Public</option>
          <option value="Whitelist">Whitelist</option>
          <option value="HostOnly">Host Only</option>
        </select>
      </div>
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
        <span style={{ marginRight: "0.5rem" }}>Visibility:</span>
        <select
          name="serviceVisibilityOption"
          id="serviceVisibilityOption"
          value={selectedVisibility}
          onChange={handleVisibilityChange}
        >
          <option value="Visible">Visible</option>
          <option value="VisibleToHost">Host Only</option>
          <option value="Hidden">Hidden</option>
        </select>
      </div>
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
        <span style={{ marginRight: "0.5rem" }}>Title:</span>
        <input
          type="text"
          placeholder="Service Title"
          value={title || ''}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
        <span style={{ marginRight: "0.5rem" }}>Description:</span>
        <input
          type="text"
          placeholder="Service Description"
          value={description || ''}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
        <span style={{ marginRight: "0.5rem" }}>Publish User Presence:</span>
        <input
          type="checkbox"
          checked={publishUserPresence}
          onChange={(e) => setPublishUserPresence(e.target.checked)}
        />
      </div>
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
        <span style={{ marginRight: "0.5rem" }}>Publish Subscribers:</span>
        <input
          type="checkbox"
          checked={publishSubscribers}
          onChange={(e) => setPublishSubscribers(e.target.checked)}
        />
      </div>
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
        <span style={{ marginRight: "0.5rem" }}>Publish Subscriber Count:</span>
        <input
          type="checkbox"
          checked={publishSubscriberCount}
          onChange={(e) => setPublishSubscriberCount(e.target.checked)}
        />
      </div>
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
        <span style={{ marginRight: "0.5rem" }}>Publish Whitelist:</span>
        <input
          type="checkbox"
          checked={publishWhitelist}
          onChange={(e) => setPublishWhitelist(e.target.checked)}
        />
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
        <span style={{ marginBottom: "0.5rem" }}>Whitelist:</span>
        <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: "0.5rem" }}>
          {whitelist.map(peer => (
            <div key={peer} style={{ padding: "0.2rem 0.5rem", borderRadius: "4px" }}>
              {peer}
              <button
                onClick={() => {
                  handleRemoveFromWhitelist(peer)
                }}
                className="whitelist-remove-node-button"
                >
                ×
              </button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", marginTop: "0.5rem", gap: "0.5rem" }}>
          <select
            onChange={(e) => handleAddToWhitelist(e.target.value)}
            value=""
            style={{ width:"auto" }}
          >
            <option value="" disabled>Add peer to whitelist</option>
            <option value="custom">custom</option>
            {availablePeers.filter(peer => !whitelist.includes(peer)).map(peer => (
              <option key={peer} value={peer}>{peer}</option>
            ))}
          </select>
          {isCustomWhitelist && (
            <>
              <input
                type="text"
                value={customWhitelistPeer}
                onChange={handleCustomWhitelistChange}
                placeholder="Enter custom peer"
                style={{ width: 'auto' }}
              />
              <button onClick={handleAddCustomWhitelist} style={{ width: 'auto' }}>Add</button>
            </>
          )}
        </div>
      </div>
      <div>

      <button
        style={{
          cursor: 'pointer',
          justifyContent: 'center',
          width:"auto",
        }}
        onClick={handleSubmit}
      >
        edit service
      </button>
      </div>
    </div>
  );
};

export default EditServiceForm;