import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ServiceID } from '@dartfrog/puddle';
import useRadioStore from '../store/radio';
import useChatStore from '@dartfrog/puddle/store/chat';
import ReactPlayer from 'react-player'

interface RadioPluginBoxProps {
}

const RadioPluginBox: React.FC = ({ }) => {
  const [interactScreen, setInteractScreen] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const {playingMedia, requestPlayMedia} = useRadioStore();
  const [inputMediaUrl, setInputMediaUrl] = useState('');
  const [showControls, setShowControls] = useState(false);
  const [playerInSync, setPlayerInSync] = useState(true);
  const [autoSync, setAutoSync] = useState(true);

  const playerRef = useRef<ReactPlayer>(null);

  const {api, serviceId} = useChatStore();

  useEffect(() => {
    const parsedServiceId = ServiceID.fromString(serviceId);
    if (!parsedServiceId) return;
    setIsHost(parsedServiceId.hostNode() === window.our?.node);
  }, [serviceId]);

  useEffect(() => {
    const handleInteraction = () => {
      setInteractScreen(false);
      setIsPlaying(true);
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };

    document.addEventListener('click', handleInteraction);
    document.addEventListener('keydown', handleInteraction);

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, [playerRef]);

  const handlePlayMedia = useCallback(() => {
    if (inputMediaUrl) {
      // console.log('Playing media:', inputMediaUrl);
      requestPlayMedia(api, inputMediaUrl)
      setInputMediaUrl("")
    }
  }, [inputMediaUrl, api,]);

  const toggleControls = () => {
    setShowControls(!showControls);
  };

  const seekToGlobal = useCallback(()=> {

    if (!playerRef.current) return;
    let player = playerRef.current;
    if (!playingMedia) return;
    if (!playingMedia.start_time) return;
    let startedTime = playingMedia.start_time;

    let adjustedStartedTime = startedTime / 1000000000;

    if (!player) return;

    var currentUnixTime = Date.now() / 1000;
    var duration = player.getDuration();

    if (!duration) return;

    let globalProgress = Math.ceil(currentUnixTime - adjustedStartedTime) % duration;

    player.seekTo(globalProgress, "seconds");
  }, [playingMedia, playerRef]);

  const handleProgress = useCallback((progress: any) => {
    // turn on scrub buttons if out of sync

    var currentUnixTime = Date.now() / 1000;
    if (!playerRef.current) return;
    var duration = playerRef.current.getDuration();
    if (!duration) return;

    if (!playingMedia.start_time) return;

    // nanoseconds to seconds
    let startSeconds = playingMedia.start_time / 1000000000;


    let localProgress = progress.playedSeconds;
    let globalProgress = Math.ceil(currentUnixTime - startSeconds);

    globalProgress = globalProgress % duration;

    let outOfSync = Math.abs(localProgress - globalProgress);

    if (outOfSync > 2) {
      if (autoSync) {
        seekToGlobal();
      } else {
        setPlayerInSync(false);
      }
    } else {
        setPlayerInSync(true);
    }

  }, [playingMedia, playerRef, autoSync]);


  const toggleAutoSync = () => {
    setAutoSync(!autoSync);
  };

    return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        boxSizing: 'border-box',
        position:"relative",
        justifyContent: 'space-between',
        alignItems: 'center',
        overflow:"hidden",
      }}
    >
        {interactScreen &&
          <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10,
          }}
        >
          <button
            style={{
              width:"auto",
              padding: '10px 20px',
              fontSize: '16px',
              cursor: 'pointer',
              backgroundColor: '#181818',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
            }}
          >
            interact with the page to continue
          </button>
        </div>
        }

        <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {playingMedia ? (
            <div
              style={{
                height: "100%",
                maxHeight:"100%",
                width:"100%",
              }}
            >
              <ReactPlayer
                ref={playerRef}
                url={playingMedia.media.url}
                playing={isPlaying}
                controls={true}
                width="100%"
                height="100%"
                loop={true}
                onReady={() => {

                }}
                onProgress={(e) => handleProgress(e)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
                config={{
                  file: {
                    attributes: {
                      style: {
                        height: "100%",
                        maxHeight: "100%",
                        width: "100%",
                      },
                    },
                  },
                }}
              />
            </div>
          ) : (
            <div
              style={{
                height:"100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                textAlign:"center",
              }}
            >
              nothing is playing
            </div>
          )
          }
        </div>

        <div
          style={{
            width: "100%",
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginTop: "0.5rem",
          }}
        >
          {showControls && (
            <div
              style={{
                width: "100%",
                marginBottom: '0.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap:"0.5rem",
              }}
            >
               {isHost &&
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      width:"100%",
                    }}
                  >
                    {/* host controls */}
                    <input
                      type="text"
                      value={inputMediaUrl}
                      onChange={(e) => setInputMediaUrl(e.target.value)}
                      placeholder="media url"
                      style={{
                        flexGrow: "1",
                        border: "1px solid #333",
                        margin: "0px",
                        height: "32px",
                        boxSizing: "border-box",
                      }}
                    />
                    <button
                      onClick={handlePlayMedia}
                      style={{
                        cursor: 'pointer',
                        borderRadius: '0px',
                        margin: "0px",
                        height: "32px",
                        borderLeft: "none",
                        padding: "0 10px",
                      }}
                    >
                      play
                    </button>
                  </div>
                }
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    width:"100%",
                  }}
                >
                  {/* viewer controls */}
                  <button
                    onClick={toggleAutoSync}
                    style={{
                      cursor: 'pointer',
                      margin: "0px",
                      height: "32px",
                      width: "auto",
                      padding: "0 10px",
                    }}
                  >
                    {autoSync ? "disable autosync" : "enable autosync"}
                  </button>
                </div>
            </div>
          )}

          <div
            style={{
              width:"100%",
              alignItems: 'flex-start',
              display:"flex",
              flexDirection:"row",
              gap:"1rem",
            }}
          >
            <button
              onClick={toggleControls}
              style={{
                width:"auto",
                padding:"0.5rem 1rem",
                userSelect: "none",
              }}
            >
              {showControls ? "hide controls" : "controls"}
            </button>
            {!playerInSync &&
              <button
                onClick={()=>{
                  seekToGlobal();
                  setPlayerInSync(true);
                }}
                style={{
                  width:"auto",
                  padding:"0.5rem 1rem",
                  userSelect: "none",
                }}
              >
                sync
              </button>

            }

          </div>
        </div>
    </div>
    )
};

export default RadioPluginBox;