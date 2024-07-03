import { useCallback, useState } from "react";
import { validateServiceName } from "./NewTab";
import useDartStore, { CHAT_PLUGIN, CHESS_PLUGIN, PAGE_PLUGIN, PIANO_PLUGIN } from "../../store/dart";

import './CreateService.css';
import { ServiceAccess, ServiceVisibility } from "@dartfrog/puddle";


const PLUGIN_MAP = {
  "chat": [CHAT_PLUGIN],
  "piano": [CHAT_PLUGIN, PIANO_PLUGIN],
  "page": [CHAT_PLUGIN, PAGE_PLUGIN],
  "chess": [CHAT_PLUGIN, CHESS_PLUGIN]
}

const CreateService: React.FC<{ setTabService: (service: string) => void }> = ({ setTabService }) => {

  const [inputCreateServiceName, setInputCreateServiceName] = useState('');
  const [isCreateInputValid, setIsCreateInputValid] = useState(true);
  const [selectedPlugins, setSelectedPlugins] = useState([CHAT_PLUGIN, PAGE_PLUGIN]);
  const [selectedVisibility, setSelectedVisibility] = useState<ServiceVisibility>('Visible');
  const [selectedAccess, setSelectedAccess] = useState<ServiceAccess>('Public');
  const [pluginInput, setPluginInput] = useState('');

  const { requestServiceList, createService } = useDartStore();

  const handleCreateInputChange = (e) => {
    const value = e.target.value;
    setInputCreateServiceName(value);
    setIsCreateInputValid(validateServiceName(value));
  };

  const handlePluginChange = (plugin) => {
    setSelectedPlugins((prevSelectedPlugins) => {
      if (prevSelectedPlugins.includes(plugin)) {
        return prevSelectedPlugins.filter((p) => p !== plugin);
      } else {
        return [...prevSelectedPlugins, plugin];
      }
    });
  };

  const handleAccessChange = (e) => {
    setSelectedAccess(e.target.value as ServiceAccess);
  };

  const handleVisibilityChange = (e) => {
    setSelectedVisibility(e.target.value as ServiceVisibility);
  };

  const handleInputCreateClick = useCallback(() => {
    if (isCreateInputValid && inputCreateServiceName !== '') {
      let serviceId = `${inputCreateServiceName}.${window.our?.node}`;
      createService(serviceId, selectedPlugins, selectedVisibility, selectedAccess, []);
      setInputCreateServiceName('');
      setTabService(serviceId);
      requestServiceList(window.our?.node);
    }
  }, [inputCreateServiceName, selectedPlugins, selectedVisibility, selectedAccess, isCreateInputValid]);
  
  const createFromShortcut = (pluginName: string) => {
    let numString = Math.floor(Math.random() * 10000).toString();
    let serviceName = `${pluginName}-${numString}`;
    let serviceId = `${serviceName}.${window.our?.node}`;
    createService(serviceId, PLUGIN_MAP[pluginName], 'Visible', 'Public', []);
    setTabService(serviceId);
  }

  const handlePluginInputChange = (e) => {
    setPluginInput(e.target.value);
  };

  const handleAddPlugin = () => {
    if (pluginInput && !selectedPlugins.includes(pluginInput)) {
      setSelectedPlugins([...selectedPlugins, pluginInput]);
      setPluginInput('');
    }
  };

  const handleRemovePlugin = (plugin) => {
    setSelectedPlugins(selectedPlugins.filter(p => p !== plugin));
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
          <div
            style={{
              padding: '0.8rem 0',
              display: 'flex',
              flexDirection: 'row',
              gap: '0.6rem',
            }}
          >
            <label>
              <input
                type="checkbox"
                checked={selectedPlugins.includes(CHAT_PLUGIN)}
                onChange={() => handlePluginChange(CHAT_PLUGIN)}
              />
              Chat
            </label>
            <label>
              <input
                type="checkbox"
                checked={selectedPlugins.includes(PIANO_PLUGIN)}
                onChange={() => handlePluginChange(PIANO_PLUGIN)}
              />
              Piano
            </label>
            <label>
              <input
                type="checkbox"
                checked={selectedPlugins.includes(PAGE_PLUGIN)}
                onChange={() => handlePluginChange(PAGE_PLUGIN)}
              />
              Page
            </label>
            <label>
              <input
                type="checkbox"
                checked={selectedPlugins.includes(CHESS_PLUGIN)}
                onChange={() => handlePluginChange(CHESS_PLUGIN)}
              />
              Chess
            </label>
          </div>
          <div>
            <input
              type="text"
              placeholder="Add plugin"
              value={pluginInput}
              onChange={handlePluginInputChange}
            />
            <button onClick={handleAddPlugin}>Add</button>
          </div>
          <div>
            {selectedPlugins.map((plugin, index) => (
              <div key={index}>
                {plugin} <button onClick={() => handleRemovePlugin(plugin)}>Remove</button>
              </div>
            ))}
          </div>
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
          <select
            name="serviceVisibilityOption"
            id="serviceVisibilityOption"
            value={selectedVisibility}
            onChange={handleVisibilityChange}
          >
            <option value="Visible">Visible</option>
            <option value="VisibleToHost">Invisible</option>
            {/* <option value="Hidden">Hidden</option> */}
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
