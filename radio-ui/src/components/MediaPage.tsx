import React from 'react';
import ReactPlayer from 'react-player';

interface MediaPageProps {
  // Add any props you might need
}

const MediaPage: React.FC<MediaPageProps> = () => {
  return (
    <div className="media-page" style={{
      width:"100%",
    }}>
      <h1>Media Page</h1>
      {/* Add your media content here */}
      <div>
        your personal database of public media URLs
      </div>
      <div>
        coming soon....
      </div>
      <div 
          style={{
            display: "flex",
            flexDirection: "column",
            // position: "relative",
            gap:"1rem",
          }}
        >
          <ReactPlayer url={'https://youtu.be/7ENMpzR54us'} 
            width="100%"
            height="20rem"
            controls
          />
          <ReactPlayer url={'https://youtu.be/9bjpX5kerOQ'}
            width="100%"
            height="20rem"
            controls
          />
        </div>
    </div>
  );
};

export default MediaPage;