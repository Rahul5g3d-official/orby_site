export const rtcConfiguration: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export function createPeerConnection(): RTCPeerConnection {
  return new RTCPeerConnection(rtcConfiguration);
}

export function closePeerConnection(connection: RTCPeerConnection): void {
  connection.getSenders().forEach((sender) => {
    if (sender.track) sender.track.stop();
  });
  connection.close();
}
