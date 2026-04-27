import { useCallback, useEffect, useRef, useState } from "react";

/** Same-origin WebSocket (proxied to the API server in dev). */
export function roomWebSocketUrl(roomId: string): string {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  const base = `${proto}//${window.location.host}`;
  return `${base}/ws/${encodeURIComponent(roomId)}`;
}

export function useRoomWebSocket(
  roomId: string,
  onMessage: (raw: string) => void,
) {
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const [readyState, setReadyState] = useState<number>(() =>
    typeof WebSocket !== "undefined" ? WebSocket.CONNECTING : 3,
  );

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const url = roomWebSocketUrl(roomId);
    const ws = new WebSocket(url);
    wsRef.current = ws;
    ws.onopen = () => setReadyState(ws.readyState);
    ws.onclose = () => setReadyState(WebSocket.CLOSED);
    ws.onerror = () => setReadyState(WebSocket.CLOSED);
    ws.onmessage = (ev: MessageEvent) => {
      onMessageRef.current(String(ev.data));
    };
    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [roomId]);

  const send = useCallback((payload: string) => {
    const w = wsRef.current;
    if (w?.readyState === WebSocket.OPEN) {
      w.send(payload);
    }
  }, []);

  return { readyState, send };
}
