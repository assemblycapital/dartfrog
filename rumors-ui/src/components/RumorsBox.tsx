import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useParams, useNavigate } from 'react-router-dom';
import useRumorsStore, { Rumor } from '../store/rumors';
import { dfLinkRegex, dfLinkToRealLink, ServiceID, useServiceStore, HomeIcon, isImageUrl} from '@dartfrog/puddle';

const Field: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div style={{ display: "flex", flexDirection: "row", gap: "1rem", marginBottom: "0.5rem" }}>
    <div style={{ fontWeight: "bold" }}>{label}:</div>
    <div>{value}</div>
  </div>
);

const PostView: React.FC<{ isAdmin: boolean }> = ({ isAdmin }) => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { rumors, deleteRumor, banUser } = useRumorsStore();
  const {api} = useServiceStore();

  const rumor = rumors.find(r => r.id === Number(postId));

  return (
    <div style={{ width: "100%" }}>
      <button onClick={() => navigate(-1)}>Back</button>
      {rumor ? (
        <>
        <div style={{ display: "flex", flexDirection: "column", marginTop: "1rem" }}>
          <Field label="Post ID" value={postId} />
          <Field label="Text" value={rumor.text} />
          <Field label="Time" value={new Date(rumor.time * 1000).toLocaleString()} />
          <Field label="Author" value={rumor.source || 'unknown'} />
        </div>
        
        {isAdmin &&
          <div>

            <button
              style={{
                marginRight:"1rem",
              }}
              onClick={()=>{
                deleteRumor(api, rumor.id)
              }}
            >
              delete
            </button>
            <button
              onClick={()=>{
                if (!rumor.source) return;
                banUser(api, rumor.source)
              }}
            >
              ban author
            </button>
          </div>
        }
        </>
      ) : (
        <p>Post not found</p>
      )}
    </div>
  );
};

const BannedUsersList: React.FC = () => {
  const { bannedUsers, banUser, unbanUser } = useRumorsStore();
  const { api } = useServiceStore();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');

  const handleBan = () => {
    if (username.trim() && api) {
      banUser(api, username.trim());
      setUsername('');
    }
  };

  const handleUnban = () => {
    if (username.trim() && api) {
      unbanUser(api, username.trim());
      setUsername('');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "10px" }}>
        <button onClick={() => navigate(-1)}>Back</button>
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter username"
        />
        <button onClick={handleBan} style={{ marginLeft: '0.5rem' }}>Ban User</button>
        <button onClick={handleUnban} style={{ marginLeft: '0.5rem' }}>Unban User</button>
      </div>

      <div>Banned Users:</div>
      {bannedUsers.length > 0 ? (
        <ul>
          {bannedUsers.map((user, index) => (
            <li key={index}>
              {user}
              <button
                onClick={() => api && unbanUser(api, user)}
                style={{ marginLeft: '0.5rem' }}
              >
                Unban
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No users are currently banned.</p>
      )}
    </div>
  );
};

const DisplayRumor: React.FC<{ rumor: Rumor; isAdmin: boolean }> = ({ rumor, isAdmin }) => {
  const [showFullImage, setShowFullImage] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const renderRumorContent = () => {
    if (isImageUrl(rumor.text)) {
      return (
        <img 
          src={rumor.text} 
          alt="Post image" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowFullImage(!showFullImage);
          }}
          style={{ 
            maxWidth: showFullImage ? '100%' : '150px',
            width: 'auto',
            height: 'auto',
            maxHeight: showFullImage ? '100%' : '150px',
            objectFit: 'cover',
            cursor: 'pointer',
          }} 
        />
      );
    }
  
    const baseOrigin = window.origin.split(".").slice(1).join(".");
    if (dfLinkRegex.test(rumor.text)) {
      const realLink = dfLinkToRealLink(rumor.text, baseOrigin);
      return (
        <a
          style={{
            // textDecoration: "underline",
            cursor: "pointer",
            fontSize: "1rem",
          }}
          href={realLink}
        >
          {rumor.text}
        </a>
      );
    }

    const isGreentext = rumor.text.charAt(0) === '>';
    return (
      <div className={`${isGreentext ? 'green-text' : ''}`}>
        {rumor.text}
      </div>
    );
  };

  return (
    <div
      style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        position: 'relative',
        padding:"0.4rem 0rem"
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {renderRumorContent()}
      {isHovered && (
        <Link
          to={`post/${rumor.id}`}
          style={{
            marginTop:"6px",
            padding: '2px 5px',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            color: '#9e9e9e',
            borderRadius: '3px',
            fontSize: '0.8rem',
            textDecoration: 'none',
          }}
        >
          details
        </Link>
      )}
    </div>
  );
};

const RumorsBox: React.FC = () => {
  const { rumors, createRumor, bannedUsers } = useRumorsStore();
  const { api, serviceId, serviceMetadata } = useServiceStore();
  const [inputValue, setInputValue] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && api) {
      createRumor(api, inputValue.trim());
      setInputValue('');
    }
  };

  const baseOrigin = window.origin.split(".").slice(1).join(".")

  useEffect(() => {
    const parsedServiceId = ServiceID.fromString(serviceId);
    if (!parsedServiceId) return;
    setIsAdmin(parsedServiceId.hostNode() === window.our?.node);
  }, [serviceId]);

  return (
      <div
        style={{
          flex: "1",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "1rem",
          // gap: "0.5rem",
          height: "100vh",
          maxHeight: "100vh",
          boxSizing: "border-box",
          overflowY:"hidden"
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            width: "100%",
          }}
        >
          <a
            href={`http://${baseOrigin}/dartfrog:dartfrog:herobrine.os/`}
            onClick={(e)=>{
              api.unsubscribeService();
            }}
          >
            <HomeIcon color='rgba(255,255,255,0.4)' size='12px'/>
          </a>
          <div
            style={{
              fontSize: "0.6rem",
              color: "rgba(255,255,255,0.4)",
              marginLeft: "10px",
              flexGrow: 1,
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            df://{serviceId}
          </div>
        </div>
        {(serviceMetadata && serviceMetadata.title) &&
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              textAlign: "center",
              fontSize: "1.4rem",
              margin:"0.4rem 0rem",
              color:"rgba(256,256,256,0.5)"

            }}
          >
            <div>
              {serviceMetadata.title}
            </div>
            {serviceMetadata.description &&
              <div
                style={{
                  fontSize: "0.7rem",
                  color:"rgba(256,256,256,0.4)"
                }}
              >
                {serviceMetadata.description}
              </div>
            }
          </div>
        }
        <Routes>
          <Route path="/" element={
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width:"100%",
                height:"100%",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                overflow:"hidden",
                marginTop:"0.4rem",
              }}
            >
              <form onSubmit={handleSubmit} style={{ display: "flex", width: "100%", maxWidth: "500px"}}>
                <input
                  type="text"
                  placeholder="rumor has it that..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  style={{
                    flexGrow: 1,
                    minWidth: 0,
                    margin: "0px",
                  }}
                />
                <button>
                  send
                </button>
              </form>
              <div
                style={{
                  flexGrow: 1,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  // gap: "0.5rem",
                  width: "100%",
                }}
              >
                {rumors && rumors.length > 0 ? (
                  rumors.map((rumor, index) => (
                    <DisplayRumor key={index} rumor={rumor} isAdmin={isAdmin} />
                  ))
                ) : (
                  <div style={{ 
                    textAlign: "center", 
                    color: "rgba(256,256,256,0.4)",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    No rumors yet. Be the first to start one!
                  </div>
                )}
            </div>
            {isAdmin &&
              <div style={{ alignSelf: 'flex-start', marginTop: '1rem' }}>
                <Link to={`/df/service/${serviceId}/admin`}
                  style={{
                    color: "#808080"
                  }}
                  className='underline-on-hover'
                >
                  admin 
                </Link>
              </div>
            }
            </div>
          } />
          <Route path="/post/:postId" element={<PostView isAdmin={isAdmin} />} />
          <Route path="/admin" element={<BannedUsersList />} />
        </Routes>
      </div>
  );
};

export default RumorsBox;
