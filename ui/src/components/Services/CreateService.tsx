import { useCallback, useState, useEffect } from "react";
import { validateServiceName } from "./Services";
import useDartStore, { CHAT_PLUGIN, CHESS_PLUGIN, PAGE_PLUGIN, PIANO_PLUGIN, RADIO_PLUGIN, FORUM_PLUGIN } from "../../store/dart";
import { ServiceCreationOptions, ServiceVisibility, ServiceAccess } from "@dartfrog/puddle";

import './CreateService.css';
// import { ServiceAccess, ServiceVisibility } from "@dartfrog/puddle";
import CreateServicePlugins from "./CreateServicePlugins";
import { useNavigate } from 'react-router-dom';


const PLUGIN_MAP = {
  "chat": CHAT_PLUGIN,
  "piano": PIANO_PLUGIN,
  "page": PAGE_PLUGIN,
  "chess": CHESS_PLUGIN,
  "radio": RADIO_PLUGIN,
  "forum": FORUM_PLUGIN,
}

const CreateService: React.FC<{ }> = ({ }) => {

  const [inputCreateServiceName, setInputCreateServiceName] = useState('');
  const [isCreateInputValid, setIsCreateInputValid] = useState(true);
  const [selectedPlugin, setSelectedPlugin] = useState(FORUM_PLUGIN);
  const [selectedVisibility, setSelectedVisibility] = useState<ServiceVisibility>(ServiceVisibility.Visible);
  const [selectedAccess, setSelectedAccess] = useState<ServiceAccess>(ServiceAccess.Public);
  const [isAdvancedOptionsVisible, setIsAdvancedOptionsVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [publishUserPresence, setPublishUserPresence] = useState(true);
  const [publishSubscribers, setPublishSubscribers] = useState(true);
  const [publishWhitelist, setPublishWhitelist] = useState(false);
  const [publishSubscriberCount, setPublishSubscriberCount] = useState(false);
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [availablePeers, setAvailablePeers] = useState<string[]>([]);
  const [isCustomWhitelist, setIsCustomWhitelist] = useState(false);
  const [customWhitelistPeer, setCustomWhitelistPeer] = useState('');

  const navigate = useNavigate();

  const { requestLocalServiceList, createService, peerMap } = useDartStore();

  useEffect(() => {
    setAvailablePeers(Array.from(peerMap.keys()));
  }, [peerMap]);

  const handleAddToWhitelist = (peer: string) => {
    if (peer === 'custom') {
      setIsCustomWhitelist(true);
    } else if (peer && !whitelist.includes(peer)) {
      setWhitelist([...whitelist, peer]);
      setIsCustomWhitelist(false);
      setCustomWhitelistPeer('');
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

  const handleRemoveFromWhitelist = (peer: string) => {
    setWhitelist(whitelist.filter(p => p !== peer));
  };

  const handleCreateInputChange = (e) => {
    const value = e.target.value;
    setInputCreateServiceName(value);
    setIsCreateInputValid(validateServiceName(value));
  };

  const handleAccessChange = (e) => {
    setSelectedAccess(e.target.value as ServiceAccess);
  };

  const handleVisibilityChange = (e) => {
    setSelectedVisibility(e.target.value as ServiceVisibility);
  };

  const handleInputCreateClick = useCallback(() => {
    if (isCreateInputValid && inputCreateServiceName !== '') {
      let serviceId = `${inputCreateServiceName}:${window.our?.node}@${selectedPlugin}`;
      
      const serviceOptions: ServiceCreationOptions = {
        serviceName: inputCreateServiceName,
        processName: selectedPlugin,
        visibility: selectedVisibility,
        access: selectedAccess,
        whitelist: whitelist,
        title: title || undefined,
        description: description || undefined,
        publishUserPresence,
        publishSubscribers,
        publishWhitelist,
        publishSubscriberCount,
      };

      createService(serviceOptions);

      setInputCreateServiceName('');
      navigate(`/join/${serviceId}`);
      setTimeout(() => {
        requestLocalServiceList();
      }, 100);
    }
  }, [inputCreateServiceName, selectedPlugin, selectedVisibility, selectedAccess, isCreateInputValid,
      title, description, publishUserPresence, publishSubscribers, publishWhitelist, publishSubscriberCount, whitelist]);

  const createFromShortcut = (shortProcessName: string) => {
    let numString = Math.floor(Math.random() * 10000).toString();
    let serviceName = `${shortProcessName}-${numString}`;
    let processName = PLUGIN_MAP[shortProcessName];
    
    const serviceOptions: ServiceCreationOptions = {
      serviceName,
      processName,
      visibility: ServiceVisibility.Visible,
      access: ServiceAccess.Public,
      whitelist: [],
      publishUserPresence: true,
      publishSubscribers: true,
      publishWhitelist: false,
      publishSubscriberCount: false,
    };

    createService(serviceOptions);
    
    setTimeout(() => {
      requestLocalServiceList();
    }, 100);
    
    let serviceId = `${serviceName}:${window.our?.node}@${processName}`;
    navigate(`/join/${serviceId}`);
  }


  const toggleAdvancedOptions = () => {
    setIsAdvancedOptionsVisible(!isAdvancedOptionsVisible);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{
        cursor: "default",
        userSelect: "none",
        marginBottom: "0.8rem",

      }}>
        create a new service:
      </div>
      <div
        style={{
        }}
      >
          <div className="service-create-shortcut"
            onClick={() =>{
              createFromShortcut("page");
            }}
          >
            page
          </div>
          <div className="service-create-shortcut"
            onClick={() =>{
              createFromShortcut("chess");
            }}
          >
            chess
          </div>
          <div className="service-create-shortcut"
            onClick={() =>{
              createFromShortcut("radio");
            }}
          >
            radio
          </div>
          <div className="service-create-shortcut"
            onClick={() =>{
              createFromShortcut("forum");
            }}
          >
            forum
          </div>
          <div className="service-create-shortcut"
            onClick={() =>{
              createFromShortcut("piano");
            }}
          >
            piano
          </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.3rem",
          color: "#ffffff66",
          marginTop: "0.8rem",
        }}
      >
        <div>
        <div
            className="toggle-advanced-options"
            style={{
              cursor: "pointer",
              display:"inline-block",
              padding: "0.4rem 0.2rem",
            }}
            onClick={toggleAdvancedOptions}
          >
            advanced options {isAdvancedOptionsVisible ? '▲' : '▼'}
        </div>
        </div>
        {isAdvancedOptionsVisible && (
          <div
            style={{
              display:"flex",
              flexDirection:"column",
              gap: "0.6rem"
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection:"column",
                gap: "0.6rem"
              }}
            >
              <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                <span style={{ marginRight: "0.5rem" }}>App:</span>
                <CreateServicePlugins selectedPlugin={selectedPlugin} setSelectedPlugin={setSelectedPlugin}/>
              </div>
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
                <span style={{ marginRight: "0.5rem" }}>Name:</span>
                <input
                  type="text"
                  placeholder="service-name"
                  value={inputCreateServiceName}
                  onChange={handleCreateInputChange}
                  className={`${isCreateInputValid ? '' : 'invalid'}`}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                <span style={{ marginRight: "0.5rem" }}>Title:</span>
                <input
                  type="text"
                  placeholder="Service Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                <span style={{ marginRight: "0.5rem" }}>Description:</span>
                <input
                  type="text"
                  placeholder="Service Description"
                  value={description}
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
                <span style={{ marginRight: "0.5rem" }}>Publish Whitelist:</span>
                <input
                  type="checkbox"
                  checked={publishWhitelist}
                  onChange={(e) => setPublishWhitelist(e.target.checked)}
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
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <span style={{ marginBottom: "0.5rem" }}>Whitelist:</span>
                <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: "0.5rem" }}>
                  {whitelist.map(peer => (
                    <div key={peer} style={{ padding: "0.2rem 0.5rem", borderRadius: "4px" }}>
                      {peer}
                      <button onClick={() => handleRemoveFromWhitelist(peer)} style={{ width:"auto", marginLeft: "0.5rem", background: "none", border: "none", color: "red", cursor: "pointer" }}>
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
            </div>

            <button
              style={{
                cursor: 'pointer',
                justifyContent: 'center',
              }}
              onClick={handleInputCreateClick}
            >
              create
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default CreateService;