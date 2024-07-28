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
      console.log('Playing media:', inputMediaUrl);
      requestPlayMedia(api, inputMediaUrl)
      setInputMediaUrl("")
    }
  }, [inputMediaUrl, api,]);

    return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        boxSizing: 'border-box',
        position:"relative",
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
        <div
          style={{
            flexGrow:"1"
          }}
        >
        </div>

        {playingMedia ? (
          <ReactPlayer
            ref={playerRef}
            url={playingMedia.media.url}
            playing={isPlaying}
            controls={true}
            width="100%"
            // height="100%"
            loop={true}
            onReady={() => {

              }
            }
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
            config={{
              file: {
                attributes: {
                  style: {
                    height: "default",
                    maxHeight: "100%",
                    width: "100%",
                  },
                },
              },
            }}
          />
        ) : (
          <div
            style={{
              height:"30vh",
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
        <div
          style={{
            flexGrow:"1"
          }}
        >
          {isHost &&
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                marginTop: "1rem",
              }}
            >
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

        </div>
    </div>
    )
};

export default RadioPluginBox;