import { useCallback, useState } from "react";
import { validateServiceName } from "./NewTab";
import useDartStore, { CHAT_PLUGIN, CHESS_PLUGIN, PAGE_PLUGIN, PIANO_PLUGIN } from "../../store/dart";

import './CreateService.css';
import { ServiceAccess, ServiceVisibility } from "@dartfrog/puddle";
import CreateServicePlugins from "./CreateServicePlugins";


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
  const [isAdvancedOptionsVisible, setIsAdvancedOptionsVisible] = useState(false);

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
        <div
          style={{
            cursor: "pointer",
          }}
          onClick={toggleAdvancedOptions}
        >
          advanced options {isAdvancedOptionsVisible ? '▲' : '▼'}
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
                <span style={{ marginRight: "0.5rem" }}>Plugins:</span>
                <CreateServicePlugins />
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
                  <option value="VisibleToHost">Invisible</option>
                  {/* <option value="Hidden">Hidden</option> */}
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