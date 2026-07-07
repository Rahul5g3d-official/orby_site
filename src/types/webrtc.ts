export type SignalRole = "studio" | "phone";

export type SignalType =
  | "join"
  | "joined"
  | "peer-joined"
  | "offer"
  | "answer"
  | "ice-candidate"
  | "leave"
  | "peer-left"
  | "error";

export interface SignalMessage<TPayload = unknown> {
  type: SignalType;
  roomId: string;
  from: string;
  to?: string;
  role?: SignalRole;
  payload?: TPayload;
}

export interface SessionDescriptionPayload {
  description: RTCSessionDescriptionInit;
}

export interface IceCandidatePayload {
  candidate: RTCIceCandidateInit;
}
