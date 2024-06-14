import { useCallback, useState } from "react";
import { validateServiceName } from "./NewTab";
import useDartStore from "../../store/dart";
import Spinner from "../Spinner";

const CreateService: React.FC = () => {
  const [inputCreateServiceName, setInputCreateServiceName] = useState('');
  const [isCreateInputValid, setIsCreateInputValid] = useState(true);
  const [selectedPlugin, setSelectedPlugin] = useState('text-chat');
  const [selectedPermission, setSelectedPermission] = useState('public');
  const [spinner, setSpinner] = useState(false);

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

  const handleInputCreateClick = useCallback(() => {
    if (isCreateInputValid && inputCreateServiceName !== '') {
      let serviceId = `${inputCreateServiceName}.${window.our?.node}`;
      if (selectedPlugin === 'text-chat') {
        createService(serviceId, ["chat"]);
      } else if (selectedPlugin === 'piano') {
        createService(serviceId, ["chat", "piano"]);
      } else if (selectedPlugin === 'page') {
        createService(serviceId, ["chat", "page"]);
      }
      setInputCreateServiceName('');
      requestServiceList(window.our?.node);
      setSpinner(true);
  
      setTimeout(() => {
        setSpinner(false);
      }, 1500);
    }
  }, [inputCreateServiceName, selectedPlugin, selectedPermission, isCreateInputValid]);
  
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.3rem",
      }}
    >
      <div style={{ cursor: "default", userSelect: "none" }}>
        create a new service:
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
          <option value="page">Page</option> {/* Added new option here */}
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
      {spinner && <Spinner />}
    </div>
  )
}

export default CreateService;
