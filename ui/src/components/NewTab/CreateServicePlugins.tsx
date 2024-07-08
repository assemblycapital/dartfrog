import React, { useState } from 'react';
import { XIcon } from '../icons/Icons';


const PACKAGE = "dartfrog:herobrine.os"
const CHAT_PLUGIN = `chat:${PACKAGE}`
const PIANO_PLUGIN = `piano:${PACKAGE}`;
const PAGE_PLUGIN = `page:${PACKAGE}`;
const CHESS_PLUGIN = `chess:${PACKAGE}`;

const PLUGINS = [CHAT_PLUGIN, PIANO_PLUGIN, PAGE_PLUGIN, CHESS_PLUGIN]



const PluginSelector = ({ plugin, setPlugin, removeSelf}) => {
  const [isCustom, setIsCustom] = useState(false);
  const [customPlugin, setCustomPlugin] = useState(plugin.replace('Custom: ', ''));

  const handlePluginChange = (e) => {
    const value = e.target.value;
    if (value === 'custom') {
      setIsCustom(true);
      setPlugin(customPlugin);
    } else {
      setIsCustom(false);
      setPlugin(value);
    }
  };

  const handleCustomPluginChange = (e) => {
    const value = e.target.value;
    setCustomPlugin(value);
    setPlugin(value);
  };

  return (
    <div style={{
        boxSizing: "border-box",
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: "0.4rem",
        width:"100%",
        height:"27px",
        maxHeight:"27px",
      }}
    >
      <div 
        className='remove-plugin-selector'
        onClick={removeSelf}
        style={{
          padding: "6px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexShrink: 0
        }}
        >
        <XIcon />
      </div >
      <select 
        value={isCustom ? 'custom' : plugin} 
        onChange={handlePluginChange} 
        style={{
          width: 'auto',
          padding: "0px 6px",
          margin: "0px"
        }}
      >
        {PLUGINS.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
        <option value="custom">custom</option>
      </select>
      {isCustom && (
        <input
          type="text"
          value={customPlugin}
          onChange={handleCustomPluginChange}
          style={{
            width: '100%',
            margin:"0px",
          }}
        />
      )}
    </div>
  );
};

const CreateServicePlugins = ({selectedPlugins, setSelectedPlugins}) => {

  const handleAddPlugin = () => {
    setSelectedPlugins([...selectedPlugins, CHAT_PLUGIN]);
  };

  const handlePluginChange = (index: number, value: string) => {
    const newPlugins = [...selectedPlugins];
    newPlugins[index] = value;
    setSelectedPlugins(newPlugins);
  };

  const handleRemovePlugin = (index: number) => {
    setSelectedPlugins(selectedPlugins.filter((_, i) => i !== index));
  };

  return (
    <div
      style={{
        width:"100%",
        display: "flex",
        flexDirection: "column",
        gap:"0.4rem",
      }}
    >
      {selectedPlugins.map((plugin, index) => (
        <PluginSelector
          key={index}
          plugin={plugin}
          setPlugin={(value) => handlePluginChange(index, value)}
          removeSelf={() => handleRemovePlugin(index)}
        />
      ))}
      <button onClick={handleAddPlugin}>Add Plugin</button>
    </div>
  );
};

export default CreateServicePlugins;