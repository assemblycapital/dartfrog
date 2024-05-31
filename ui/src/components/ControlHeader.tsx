import useChatStore from '../store/chat';

const ControlHeader = (nodeConnected) => {

  const { muteSoundEffects, setMuteSoundEffects } = useChatStore();

  return (
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          color: "#ffffff55",
          fontSize: "0.8rem",
          gap: "0.8rem",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "0.8rem",
            flexGrow: 1,
          }}
        >
          <button onClick={() => {
              if(muteSoundEffects) {
                setMuteSoundEffects(false);
              } else {
                setMuteSoundEffects(true);
              }
            }}
            style={{
              opacity: "0.5",
              fontSize: "0.8rem",
              padding: "0px 2px",
              cursor: "pointer",
            }}
            >
            {muteSoundEffects ? 'unmute' : 'mute'}
          </button>

        </div>

        <div>
          <span
          style={{
            cursor: "default",
          }}
          >
          {window.our.node} {' '} {nodeConnected ? 'connected': 'connecting...'}
          </span>
        </div>

      </div>

  );
}
export default ControlHeader;