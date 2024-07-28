import React, { useState } from 'react';
import { XIcon } from '@dartfrog/puddle/components/Icons';


const PACKAGE = "dartfrog:herobrine.os"
const CHAT_PLUGIN = `chat:${PACKAGE}`
const PIANO_PLUGIN = `piano:${PACKAGE}`;
const PAGE_PLUGIN = `page:${PACKAGE}`;
const CHESS_PLUGIN = `chess:${PACKAGE}`;
const RADIO_PLUGIN = `radio:${PACKAGE}`;

const PLUGINS = [CHAT_PLUGIN, PIANO_PLUGIN, PAGE_PLUGIN, CHESS_PLUGIN, RADIO_PLUGIN]

const PluginSelector = ({ plugin, setPlugin}) => {
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

const CreateServicePlugins = ({selectedPlugin, setSelectedPlugin}) => {

  return (
    <div
      style={{
        width:"100%",
        display: "flex",
        flexDirection: "column",
        gap:"0.4rem",
      }}
    >
      <PluginSelector
        plugin={selectedPlugin}
        setPlugin={(value) => setSelectedPlugin(value)}
      />
    </div>
  );
};

export default CreateServicePlugins;