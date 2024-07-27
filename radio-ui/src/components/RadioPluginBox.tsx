import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ServiceID } from '@dartfrog/puddle';
import useRadioStore from '../store/radio';
import useChatStore from '@dartfrog/puddle/store/chat';
import ReactPlayer from 'react-player'

interface RadioPluginBoxProps {
}

const RadioPluginBox: React.FC = ({ }) => {
  const [isHost, setIsHost] = useState(false);
  const {} = useRadioStore();

  const playerRef = useRef();
  const {api, serviceId} = useChatStore();

  useEffect(() => {
    const parsedServiceId = ServiceID.fromString(serviceId);
    if (!parsedServiceId) return;
    setIsHost(parsedServiceId.hostNode() === window.our?.node);
  }, [serviceId]);
  // function handleProgress(progress: any) {
    // turn on scrub buttons if out of sync

    // var currentUnixTime = Date.now() / 1000;
    // if (!playerRef.current) return;
    // var duration = playerRef.current.getDuration();
    // if (!duration) return;

    // let localProgress = progress.playedSeconds;
    // let globalProgress = Math.ceil(currentUnixTime - spinTime);

    // globalProgress = globalProgress % duration;

    // let outOfSync = Math.abs(localProgress - globalProgress);

    // stupid way to detect livestreams
    // just dont autoscrub if the duration and played seconds are close
    // because that tends to be the case for live streams...
    //
    // NOTE: this has bad edge cases. it was dumb anyways but im leaving commented for later
    //
    // ...(later) yeah, the duration is different for each user. everyone has a
    //  static duration from when they first loaded the live stream. so this logic
    //  will never work.
    // let maybeLive = Math.abs(duration - globalProgress) < 3 || globalProgress < 3;

    // if (outOfSync > 2) {
    //   // dispatch(setPlayerInSync(false));
    //   return;
    // }
  // }

    return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
        <ReactPlayer
          ref={playerRef}
          url={'https://www.youtube.com/watch?v=yJpJ8REjvqo'}
          playing={true}
          controls={true}
          width="100%"
          height="100%"
          loop={true}
          onReady={() => {

            }
          }
          // onSeek={e => console.log('onSeek', e)}
          // onProgress={(e) => handleProgress(e)}
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
          config={{
            file: {
              // makes the audio player look nice
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
    </div>
    )
};

export default RadioPluginBox;
