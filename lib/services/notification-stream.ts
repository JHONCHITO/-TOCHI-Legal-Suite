import { EventEmitter } from "node:events";

export type NotificationStreamKind = "connected" | "created" | "updated" | "sync";

export interface NotificationStreamEvent {
  kind: NotificationStreamKind;
  userId: string;
  timestamp: string;
  notificationId?: string;
  unreadCount?: number;
  title?: string;
  message?: string;
  url?: string;
  priority?: "alta" | "media" | "baja";
  type?: string;
}

type Listener = (event: NotificationStreamEvent) => void;

type StreamHub = {
  emitter: EventEmitter;
};

const GLOBAL_KEY = "__tochiNotificationStreamHub__";

function getHub(): StreamHub {
  const globalObject = globalThis as typeof globalThis & {
    [GLOBAL_KEY]?: StreamHub;
  };

  if (!globalObject[GLOBAL_KEY]) {
    const emitter = new EventEmitter();
    emitter.setMaxListeners(0);
    globalObject[GLOBAL_KEY] = { emitter };
  }

  return globalObject[GLOBAL_KEY]!;
}

function channel(userId: string) {
  return `notification:${userId}`;
}

export function emitNotificationEvent(
  userId: string,
  event: Omit<NotificationStreamEvent, "userId" | "timestamp"> & { timestamp?: string }
) {
  if (!userId) {
    return;
  }

  getHub().emitter.emit(channel(userId), {
    ...event,
    userId,
    timestamp: event.timestamp || new Date().toISOString(),
  } satisfies NotificationStreamEvent);
}

export function subscribeNotificationStream(userId: string, listener: Listener) {
  const hub = getHub();
  const eventName = channel(userId);
  hub.emitter.on(eventName, listener);

  return () => {
    hub.emitter.off(eventName, listener);
  };
}
