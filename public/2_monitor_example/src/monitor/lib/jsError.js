import getLastEvent from '../utils/getLastEvent';
import getSelector from '../utils/getSelector';
import tracker from '../utils/tracker';

function getLines(stack) {
  return stack.split('\n').slice(1).map((item) => item.replace(/^\s+at\s+/g, '')).join('^');
}
export function injectJsError() {
  // 监听全局未捕获的错误
  window.addEventListener('error', (event) => {
    const lastEvent = getLastEvent();
    if (event.target && (event.target.src || event.target.href)) {
      // 资源加载错误
      tracker.send({
        kind: 'stability', // 监控指标的大类
        type: 'error', // 小类型，这是一个错误
        errorType: 'resourceError', // JS 执行错误
        filename: event.target.src || event.target.href, // 哪个文件报错了
        tagName: event.target.tagName,
        selector: lastEvent ? getSelector(event.target) : '', // 代表最后一个操作的元素
      });
    } else {
      tracker.send({
        kind: 'stability', // 监控指标的大类
        type: 'error', // 小类型，这是一个错误
        errorType: 'jsError', // JS 执行错误
        url: '', // 访问哪个路径报错
        message: event.message, // 报错信息
        filename: event.filename, // 哪个文件报错了
        position: `${event.lineno}:${event.colno}`,
        stack: getLines(event.error.stack),
        selector: lastEvent ? getSelector(lastEvent) : '', // 代表最后一个操作的元素
      });
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    const lastEvent = getLastEvent(); // 最后一个交互事件
    let message;
    let filename;
    let line = 0;
    let column = 0;
    let stack = '';
    const { reason } = event;
    if (typeof event.reason === 'string') {
      message = event.reason;
    } else if (typeof event.reason === 'object') {
      // 错误对象
      message = reason.message;
      // at http://localhost:8080/:23:38
      if (reason.stack) {
        const matchResult = reason.stack.match(/at\s+(.+):(\d+):(\d+)/);
        ([filename, line, column] = matchResult.slice(1));
      }
      stack = getLines(reason.stack);
    }
    tracker.send({
      kind: 'stability', // 监控指标的大类
      type: 'error', // 小类型，这是一个错误
      errorType: 'promiseError', // promise 执行错误
      message, // 报错信息
      filename, // 哪个文件报错了
      position: `${line}:${column}`,
      stack,
      selector: lastEvent ? getSelector(lastEvent.path) : '', // 代表最后一个操作的元素
    });
  }, true);
}
