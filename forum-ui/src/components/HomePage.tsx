import { ServiceID, useServiceStore } from "@dartfrog/puddle";
import { useNavigate } from "react-router-dom";
import PostList from "./PostList";
import ForumHeader from "./ForumHeader";


const HomePage: React.FC = () => {
  const {serviceId} = useServiceStore();
  const parsedServiceId = ServiceID.fromString(serviceId)
  const navigate = useNavigate();
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        // overflowX:"hidden",
        // overflowY:"auto",
        height:"100%",
        maxHeight:"100%",
      }}
    >
      <div
        style={{
          display:"flex",
          flexDirection:"row",
          gap:"0.6rem",
          marginBottom:"6px"
        }}
      >
        <button
          style={{
            width:'auto',
            height:'auto',
            padding:'0.2rem 1rem',
          }}
          onClick={()=>{
            navigate(`/df/service/${serviceId}/new`)
          }}
        >
          create a post
        </button>
        <button
          style={{
            width:'auto',
            height:'auto',
            padding:'0.2rem 1rem',
          }}
          onClick={()=>{
            navigate(`/df/service/${serviceId}/chat`)
          }}
        >
          chat
        </button>
        { parsedServiceId.hostNode() === window.our?.node &&
          <button
            style={{
              width:'auto',
              height:'auto',
              padding:'0.2rem 1rem',
            }}
            onClick={()=>{
              navigate(`/df/service/${serviceId}/admin`)
            }}
          >
            admin
          </button>
        }
      </div>

      <PostList />
    </div>

  )
}

export default HomePage;