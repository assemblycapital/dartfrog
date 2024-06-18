import Spinner from "./Spinner";
import useDartStore from "../store/dart";
import TabbedWindowManager from "./TabbedWindowManager";

interface BrowserBoxProps {
}
const BrowserBox: React.FC<BrowserBoxProps> = ({}) => {
  const { services, availableServices, exitService, joinService, closeApi } = useDartStore();
  
  // if (!(services instanceof Map)) {
  //   // this is pretty dumb
  //   // but if i dont do it, everything explodes :)
  //   return (
  //     <div
  //       style={{
  //         height: '400px',
  //       }}
  //     >
  //       <Spinner />
  //     </div>
  //   )
  // }
  // if (!(availableServices instanceof Map)) {
  //   // this is pretty dumb
  //   // but if i dont do it, everything explodes :)
  //   return (
  //     <div
  //       style={{
  //         height: '400px',
  //       }}
  //     >
  //       <Spinner />
  //     </div>
  //   )
  // }


  return (
    <div>
        <TabbedWindowManager />
    </div>
  );
}


export default BrowserBox;

function formatTimeStamp(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString();
}
