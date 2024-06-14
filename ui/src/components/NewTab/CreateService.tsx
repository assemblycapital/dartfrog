import { useCallback, useState } from "react";
import { validateServiceName } from "./NewTab";
import useDartStore from "../../store/dart";

const CreateService: React.FC = () => {
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

  const handleInputCreateClick = useCallback(() => {
    if (isCreateInputValid && inputCreateServiceName !== '') {
      let serviceId = `${inputCreateServiceName}.${window.our?.node}`;
      console.log(selectedPermission, selectedPlugin);
      if (selectedPlugin === 'text-chat') {
        createService(serviceId, ["chat"]);
      } else if (selectedPlugin === 'piano') {
        createService(serviceId, ["chat", "piano"]);
      }
      setInputCreateServiceName('');
      requestServiceList(window.our?.node);
    }
  }, [inputCreateServiceName, selectedPlugin, selectedPermission, isCreateInputValid]);

  return (
    <div>
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
          style={{ cursor: 'pointer' }}
          onClick={handleInputCreateClick}
        >
          create
        </button>
      </div>
    </div>
  )
}

export default CreateService;
