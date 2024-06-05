import KinodeClientApi from "@kinode/client-api";
import { SERVER_NODE, WEBSOCKET_URL } from '../utils';

class DartApi {
  private api: KinodeClientApi | null = null;
  private updateHandler: (json: string | Blob) => void;

  constructor(updateHandler?: (json: string | Blob) => void) {
    this.updateHandler = updateHandler || this.defaultUpdateHandler;
    this.initialize();
  }

  private setApi(api: KinodeClientApi) {
    this.api = api;
  }

  private defaultUpdateHandler(json: string | Blob) {
    if (typeof json !== 'string') { return; }
    console.log('got json', json);
  }

  sendPoke(data: any) {
    if (!this.api) { return; }
    this.api.send({ data });
  }

  pokeSubscribe() {
    if (!this.api) { return; }
    const data = {
      "ClientRequest": {
        "ConsumerRequest": [0, { "JoinService": { "node": SERVER_NODE, "id": "TODO" } }]
      }
    };
    this.sendPoke(data);
  }

  pokeUnsubscribe() {
    if (!this.api) { return; }
    const data = {
      "ClientRequest": {
        "ConsumerRequest": [0, { "ExitService": { "node": SERVER_NODE, "id": "TODO" } }]
      }
    };
    this.sendPoke(data);
  }

  private initialize() {
    console.log("Attempting to connect to Kinode...");
    if (!(window.our?.node && window.our?.process)) {
      return;
    }
    const newApi = new KinodeClientApi({
      uri: WEBSOCKET_URL,
      nodeId: window.our.node,
      processId: window.our.process,
      onClose: (event) => {
        console.log("Disconnected from Kinode");
      },
      onOpen: (event, api) => {
        console.log("Connected to Kinode");
        this.pokeSubscribe();
      },
      onMessage: (json, api) => {
        this.updateHandler(json);
      },
      onError: (event) => {
        console.log("Kinode connection error", event);
      },
    });
    this.setApi(newApi);
  }
}

export default DartApi;
