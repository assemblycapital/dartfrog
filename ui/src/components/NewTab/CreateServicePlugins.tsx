import React, { useState } from 'react';

const CreateServicePlugins = () => {
  const [pluginInput, setPluginInput] = useState('');
  const [selectedPlugins, setSelectedPlugins] = useState<string[]>([]);

  const handlePluginInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPluginInput(e.target.value);
  };

  const handleAddPlugin = () => {
    if (pluginInput && !selectedPlugins.includes(pluginInput)) {
      setSelectedPlugins([...selectedPlugins, pluginInput]);
      setPluginInput('');
    }
  };

  const handleRemovePlugin = (plugin: string) => {
    setSelectedPlugins(selectedPlugins.filter(p => p !== plugin));
  };

  const handlePluginChange = (plugin: string) => {
    if (selectedPlugins.includes(plugin)) {
      setSelectedPlugins(selectedPlugins.filter(p => p !== plugin));
    } else {
      setSelectedPlugins([...selectedPlugins, plugin]);
    }
  };

  const CHAT_PLUGIN = 'Chat';
  const PIANO_PLUGIN = 'Piano';
  const PAGE_PLUGIN = 'Page';
  const CHESS_PLUGIN = 'Chess';

  return (
      <div>
        <div>
        <div style={{ display: 'flex', flexDirection: 'row', gap: '0.6rem' }}>
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
      </div>
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
        <span style={{ marginRight: "0.5rem" }}>Add Plugin:</span>
        <input
          type="text"
          placeholder="Add plugin"
          value={pluginInput}
          onChange={handlePluginInputChange}
        />
        <button onClick={handleAddPlugin}>Add</button>
      </div>
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
        <span style={{ marginRight: "0.5rem" }}>Selected Plugins:</span>
        <div>
          {selectedPlugins.map((plugin, index) => (
            <div key={index}>
              {plugin} <button onClick={() => handleRemovePlugin(plugin)}>Remove</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CreateServicePlugins;