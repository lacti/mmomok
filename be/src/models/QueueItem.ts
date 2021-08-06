import { GameRequest } from "./GameMessage";

export interface StartQueueItem {
  type: "start";
  payload: {};
}

export interface ConnectQueueItem {
  type: "connect";
  connectionId: string;
  payload: {
    memberId: string;
  };
}

export interface DisconnectQueueItem {
  type: "disconnect";
  connectionId: string;
  payload: {};
}

export interface MessageQueueItem {
  type: "message";
  connectionId: string;
  payload: GameRequest;
}

type QueueItem =
  | StartQueueItem
  | ConnectQueueItem
  | DisconnectQueueItem
  | MessageQueueItem;

export default QueueItem;
