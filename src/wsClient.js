// wsClient.js
// Simple wrapper to maintain WebSocket connection, auth, subscribe, send message.

export default class WSClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.listeners = new Set();
    this.ready = false;
  }

  connect(accessToken) {
    // include nothing in URL — we'll auth on first message
    this.ws = new WebSocket(this.wsUrl);
    this.ws.onopen = () => {
      // send auth
      this.ws.send(JSON.stringify({ type: 'auth', accessToken }));
      this.ready = true;
    };
    this.ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        for (const cb of this.listeners) cb(data);
      } catch (e) {
        console.error('ws parse error', e);
      }
    };
    this.ws.onclose = () => {
      this.ready = false;
      console.warn('WS closed');
      // don't implement reconnect loop here to keep it simple
    };
    this.ws.onerror = (e) => {
      console.error('WS error', e);
    };
  }

  onMessage(cb) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  subscribe(chat_id) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'subscribe', chat_id }));
  }

  sendMessage(payload) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WS not open');
      return;
    }
    this.ws.send(JSON.stringify(payload));
  }
}