import { useCallback, useState } from "react";
import { validateServiceName } from "./Services";
import useDartStore, { CHAT_PLUGIN, CHESS_PLUGIN, PAGE_PLUGIN, PIANO_PLUGIN, RADIO_PLUGIN, FORUM_PLUGIN } from "../../store/dart";
import { ServiceCreationOptions, ServiceVisibility, ServiceAccess } from "@dartfrog/puddle/index";

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
  const [selectedPlugin, setSelectedPlugin] = useState(PAGE_PLUGIN);
  const [selectedVisibility, setSelectedVisibility] = useState<ServiceVisibility>(ServiceVisibility.Visible);
  const [selectedAccess, setSelectedAccess] = useState<ServiceAccess>(ServiceAccess.Public);
  const [isAdvancedOptionsVisible, setIsAdvancedOptionsVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [publishUserPresence, setPublishUserPresence] = useState(true);
  const [publishSubscribers, setPublishSubscribers] = useState(true);
  const [publishWhitelist, setPublishWhitelist] = useState(false);
  const [publishSubscriberCount, setPublishSubscriberCount] = useState(false);

  const navigate = useNavigate();

  const { requestLocalServiceList, createService } = useDartStore();

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
        whitelist: [],
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
      title, description, publishUserPresence, publishSubscribers, publishWhitelist, publishSubscriberCount]);
  
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