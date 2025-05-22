import { http, HttpResponse } from 'msw';

const encoder = new TextEncoder();

export const handlers = [
  http.get(import.meta.env.VITE_SSE_URL, () => {
    const stream = new ReadableStream({
      start(controller) {
        // helper: 이벤트를 문자열로 포맷해서 enqueue
        const send = (type: string, payload: any) => {
          const log = JSON.stringify({ type, payload });
          controller.enqueue(encoder.encode(`data:${log}\n\n`));
        };

        // 첫 번째 이벤트 즉시
        send('subscription_succeeded', 'subscription_succeeded');

        // 두 번째 이벤트 1초 뒤
        setTimeout(() => {
          send('job_run_queue_enter', 'queue_enter');
        }, 1000);

        // 세 번째 이벤트 2초 뒤, 그 후 스트림 종료
        setTimeout(() => {
          send('job_run_started', 'job started');
        }, 2000);

        setTimeout(() => {
          send('job_run_ended', 'job ended');
          controller.close();
        }, 3000);
      },
    });

    return new HttpResponse(stream, {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  }),
];
