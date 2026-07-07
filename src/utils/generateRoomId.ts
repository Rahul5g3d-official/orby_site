const ROOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateRoomId(length = 8): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  return [...bytes]
    .map((byte) => ROOM_ALPHABET[byte % ROOM_ALPHABET.length])
    .join("");
}

export function generatePeerId(prefix: "studio" | "phone"): string {
  return `${prefix}-${generateRoomId(10).toLowerCase()}`;
}
