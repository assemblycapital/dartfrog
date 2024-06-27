import { useCallback, useState } from "react";
import { validateServiceName } from "./NewTab";
import useDartStore from "../../store/dart";

import './CreateService.css';


const CreateService: React.FC<{ setTabService: (service: string) => void }> = ({ setTabService }) => {

  const [inputCreateServiceName, setInputCreateServiceName] = useState('');
  const [isCreateInputValid, setIsCreateInputValid] = useState(true);
  const [selectedPlugin, setSelectedPlugin] = useState('text-chat');
  const [selectedPermission, setSelectedPermission] = useState('public');

  const { requestServiceList, createService } = useDartStore();

  const handleCreateInputChange = (e) => {
    const value = e.target.value;
    setInputCreateServiceName(value);
    setIsCreateInputValid(validateServiceName(value));
  };

  const handlePluginChange = (e) => {
    setSelectedPlugin(e.target.value);
  };

  const handlePermissionChange = (e) => {
    setSelectedPermission(e.target.value);
  };

  const CHAT_PLUGIN = "chat:dartfrog:herobrine.os";
  const PIANO_PLUGIN = "piano:dartfrog:herobrine.os";
  const PAGE_PLUGIN = "page:dartfrog:herobrine.os";
  const CHESS_PLUGIN = "chess:dartfrog:herobrine.os";

  const PLUGIN_MAP = {
    "chat": [CHAT_PLUGIN],
    "piano": [CHAT_PLUGIN, PIANO_PLUGIN],
    "page": [CHAT_PLUGIN, PAGE_PLUGIN],
    "chess": [CHAT_PLUGIN, CHESS_PLUGIN]
  }

  const handleInputCreateClick = useCallback(() => {
    if (isCreateInputValid && inputCreateServiceName !== '') {
      let serviceId = `${inputCreateServiceName}.${window.our?.node}`;
      if (selectedPlugin === 'text-chat') {
        createService(serviceId, [CHAT_PLUGIN]);
      } else if (selectedPlugin === 'piano') {
        createService(serviceId, [CHAT_PLUGIN, PIANO_PLUGIN]);
      } else if (selectedPlugin === 'page') {
        createService(serviceId, [CHAT_PLUGIN, PAGE_PLUGIN]);
      } else if (selectedPlugin === 'chess') {
        createService(serviceId, [CHAT_PLUGIN, CHESS_PLUGIN]);
      }
      setInputCreateServiceName('');
      setTabService(serviceId);
      requestServiceList(window.our?.node);
    }
  }, [inputCreateServiceName, selectedPlugin, selectedPermission, isCreateInputValid]);
  
  
  const createFromShortcut = (pluginName: string) => {
    let numString = Math.floor(Math.random() * 10000).toString();
    let serviceName = `${pluginName}-${numString}`;
    let serviceId = `${serviceName}.${window.our?.node}`;
    createService(serviceId, PLUGIN_MAP[pluginName]);
    setTabService(serviceId);
  }
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
              createFromShortcut("piano");
            }}
          >
            piano
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
              createFromShortcut("page");
            }}
          >
            page
          </div>
          <div className="service-create-shortcut"
            onClick={() =>{
              createFromShortcut("chat");
            }}
          >
            chat
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
          advanced options
        </div>
        <div>
          <input
            type="text"
            placeholder="service-name"
            value={inputCreateServiceName}
            onChange={handleCreateInputChange}
            className={`${isCreateInputValid ? '' : 'invalid'}`}
          />
          <select
            name="servicePluginsOption"
            id="servicePluginsOption"
            value={selectedPlugin}
            onChange={handlePluginChange}
          >
            <option value="text-chat">Text Chat</option>
            <option value="piano">Piano</option>
            <option value="page">Page</option>
            <option value="chess">Chess</option>
          </select>
          <select
            name="servicePermissionsOption"
            id="servicePermissionsOption"
            value={selectedPermission}
            onChange={handlePermissionChange}
          >
            <option value="public">Public</option>
            <option value="invite-only" disabled>Invite Only</option>
            <option value="hidden" disabled>Hidden</option>
          </select>
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
      </div>
    </div>
  )
}

export default CreateService;
