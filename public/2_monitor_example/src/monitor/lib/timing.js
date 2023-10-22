import getLastEvent from '../utils/getLastEvent';
import getSelector from '../utils/getSelector';
import onload from '../utils/onload';
import tracker from '../utils/tracker';

export function timing() {
  let FMP;
  let LCP;
  if (PerformanceObserver) {
    // 增加一个性能条目的观察者
    new PerformanceObserver((entryList, observer) => {
      const perfEntries = entryList.getEntries();
      [FMP] = perfEntries; // setTimeout 2000ms 后
      observer.disconnect();
    }).observe({ entryTypes: ['element'] });

    new PerformanceObserver((entryList, observer) => {
      const perfEntries = entryList.getEntries();
      [LCP] = perfEntries;
      observer.disconnect();
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    new PerformanceObserver((entryList, observer) => {
      const lastEvent = getLastEvent();
      const firstInput = entryList.getEntries()[0];
      if (firstInput) {
        // processingStart 开始处理的时间 startTime - 点击的时间，差值就是处理的延迟
        const inputDelay = firstInput.processingStart - firstInput.startTime;
        const { duration } = firstInput; // 处理的耗时
        if (inputDelay > 0 || duration > 0) {
          const log = {
            kind: 'experience', // 用户体验指标
            type: 'firstInputDelay', // 首次输入延迟
            inputDelay, // 延迟的时间
            duration, // 处理的时间
            startTime: firstInput.startTime,
            selector: lastEvent
              ? getSelector(lastEvent.path || lastEvent.target)
              : '',
          };
          tracker.send(log);
        }
      }
      observer.disconnect();
    }).observe({ type: 'first-input', buffered: true });
  }

  onload(() => {
    setTimeout(() => {
      const {
        fetchStart,
        connectStart,
        connectEnd,
        requestStart,
        responseStart,
        responseEnd,
        domLoading,
        domInteractive,
        domContentLoadedEventEnd,
        domContentLoadedEventStart,
        loadEventStart,
      } = performance.timing;
      const log = {
        kind: 'experience', // 用户体验指标
        type: 'timing', // 统计每个阶段的时间
        connectTime: connectEnd - connectStart, // 连接时间
        ttfbTime: responseEnd - requestStart, // 首字节到达时间
        responseTime: responseEnd - responseStart, // 响应的读取时间
        parseDOMTime: loadEventStart - domLoading, // DOM 解析的时间
        domContentLoadedTime:
        domContentLoadedEventEnd - domContentLoadedEventStart,
        timeToInteractive: domInteractive - fetchStart, // 首次可交互时间
        loadTime: loadEventStart - fetchStart, // 完整的加载时间
      };
      tracker.send(log);

      const FP = performance.getEntriesByName('first-paint')[0];
      const FCP = performance.getEntriesByName('first-contentful-paint')[0];
      const logPaint = {
        kind: 'experience', // 用户体验指标
        type: 'paint', // 统计每个阶段的时间
        firstPaint: FP.startTime,
        firstContentfulPaint: FCP.startTime,
        firstMeaningfulPaint: FMP.startTime,
        largestContentfulPaint: LCP.startTime,
      };
      tracker.send(logPaint);
    }, 3000);
  });
}
