import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { subscribeNotificationStream } from "@/lib/services/notification-stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function encodeSseEvent(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const userId = session.user.id;
  const encoder = new TextEncoder();
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let unsubscribe = () => {};
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode("retry: 5000\n\n"));
      controller.enqueue(
        encoder.encode(
          encodeSseEvent("connected", {
            ok: true,
            userId,
            timestamp: new Date().toISOString(),
          })
        )
      );

      unsubscribe = subscribeNotificationStream(userId, (event) => {
        if (closed) {
          return;
        }

        controller.enqueue(encoder.encode(encodeSseEvent("notification", event)));
      });

      heartbeat = setInterval(() => {
        if (closed) {
          return;
        }

        controller.enqueue(encoder.encode(": ping\n\n"));
      }, 25000);
    },
    cancel() {
      if (closed) {
        return;
      }

      closed = true;
      if (heartbeat) {
        clearInterval(heartbeat);
      }
      unsubscribe();
    },
  });

  request.signal.addEventListener("abort", () => {
    if (closed) {
      return;
    }

    closed = true;
    if (heartbeat) {
      clearInterval(heartbeat);
    }
    unsubscribe();
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
