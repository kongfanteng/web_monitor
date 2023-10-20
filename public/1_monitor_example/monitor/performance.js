/**
 * @param {PerformanceTiming} p
 * @returns {}
 */
const processData = (p) => {
  const data = {
    prevPage: p.fetchStart - p.navigationStart, // 上一页面到这个页面的时长
    redirect: p.redirectEnd - p.redirectStart, // 重定向的时长
    dns: p.domainLookupEnd - p.domainLookupStart, // dns 解析时长
    connect: p.connectEnd - p.connectStart, // tcp 连接时长

    send: p.responseEnd - p.requestStart, // 响应结束到请求时间
    ttfb: p.responseStart - p.navigationStart, // 首字节接收到的时长
    domready: p.domInteractive - p.domLoading, // dom 准备的时长
    whiteScreen: p.domLoading - p.navigationStart, // 白屏
    dom: p.domComplete - p.domLoading, // dom 解析时间
    load: p.loadEventEnd - p.loadEventStart, // onload 执行时间
    total: p.loadEventEnd - p.navigationStart,
  };
  return data;
};

const load = (cb) => {
  let timer;
  const check = () => {
    if (performance.timing.loadEventEnd) {
      clearTimeout(timer);
      cb();
    } else {
      timer = setTimeout(check, 100);
    }
  };
  window.addEventListener('load', check, false);
};
const domready = (cb) => {
  let timer;
  const check = () => {
    if (performance.timing.domInteractive) {
      clearTimeout(timer);
      cb();
    } else {
      timer = setTimeout(check, 100);
    }
  };
  window.addEventListener('DOMContentLoaded', check, false);
};
export default {
  init(cb) {
    domready(() => {
      const prefData = performance.timing;
      const data = processData(prefData);
      cb(data);
    });
    load(() => {
      const prefData = performance.timing;
      const data = processData(prefData);
      cb(data);
    });
  },
};
