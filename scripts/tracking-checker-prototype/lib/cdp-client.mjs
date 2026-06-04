export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function waitForDebugPort(port) {
  const endpoint = `http://127.0.0.1:${port}/json/version`;
  for (let i = 0; i < 80; i += 1) {
    try {
      const response = await fetch(endpoint);
      if (response.ok) return response.json();
    } catch {
      // Chrome is still starting.
    }
    await sleep(250);
  }
  throw new Error(`Chrome DevTools endpoint did not start on port ${port}`);
}

export async function getBrowserWebSocketUrl(port) {
  const version = await waitForDebugPort(port);
  return version.webSocketDebuggerUrl;
}

export async function createPage(port) {
  const response = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, {
    method: "PUT",
  });
  if (!response.ok) {
    throw new Error(`Failed to create Chrome tab: ${response.status}`);
  }
  return response.json();
}

export function createCdpClient(webSocketDebuggerUrl) {
  const ws = new WebSocket(webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  const listeners = [];

  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result ?? {});
      return;
    }
    if (message.method) {
      for (const item of listeners) {
        if (item.method !== message.method) continue;
        if (item.sessionId && item.sessionId !== message.sessionId) continue;
        listenerCall(item.listener, message.params ?? {});
      }
    }
  });

  const ready = new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });

  return {
    ready,
    send(method, params = {}, options = {}) {
      id += 1;
      ws.send(JSON.stringify({ id, method, params, sessionId: options.sessionId }));
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
      });
    },
    on(method, listener, options = {}) {
      listeners.push({
        method,
        listener,
        sessionId: options.sessionId
      });
    },
    close() {
      ws.close();
    },
  };
}

export async function createPageSession(browserCdp) {
  const target = await browserCdp.send("Target.createTarget", { url: "about:blank" });
  const attached = await browserCdp.send("Target.attachToTarget", {
    targetId: target.targetId,
    flatten: true
  });
  const sessionId = attached.sessionId;

  return {
    sessionId,
    ready: Promise.resolve(),
    send(method, params = {}) {
      return browserCdp.send(method, params, { sessionId });
    },
    on(method, listener) {
      browserCdp.on(method, listener, { sessionId });
    },
    close() {
      return browserCdp
        .send("Target.closeTarget", { targetId: target.targetId })
        .catch(() => {});
    }
  };
}

function listenerCall(listener, params) {
  try {
    listener(params);
  } catch {
    // Event listeners should not break unrelated CDP message handling.
  }
}
