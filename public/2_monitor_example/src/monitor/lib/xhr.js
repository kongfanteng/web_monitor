import tracker from '../utils/tracker';

export function injectXHR() {
  const { XMLHttpRequest } = window;
  const oldOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function open(method, url, async, ...args) {
    if (!url.match(/logstores/)) {
      this.logData = { method, url, async };
    }
    return oldOpen.apply(this, [method, url, async, ...args]);
  };
  const oldSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function send(body) {
    if (this.logData) {
      const startTime = Date.now(); // 发送前记录开始时间
      const handle = (type) => (event) => {
        const duration = Date.now() - startTime;
        const { status } = this;
        const { statusText } = this;
        const log = {
          kind: 'stability', // 监控指标的大类
          type, // 小类型，这是一个错误
          errorType: event.type, // promise 执行错误
          pathname: this.logData.url, // 哪个文件报错了
          status: `${status}-${statusText}`,
          duration,
          response: this.response ? JSON.stringify(this.response) : '',
          params: body || '',
        };
        tracker.send(log);
      };
      this.addEventListener('load', handle('load', false));
      this.addEventListener('error', handle('error', false));
      this.addEventListener('abort', handle('abort', false));
    }
    return oldSend.apply(this, [body]);
  };
}
