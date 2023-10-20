/**
 * 格式化资源数据
 * @param {PerformanceEntry} _ 资源数据
 * @returns {[key: string]}
 */
const processData = (_) => {
  const data = {
    name: _.name,
    initiatorType: _.initiatorType,
    duration: _.duration,
  };
  return data;
};
export default {
  init(cb) {
    if (window.PerformanceObserver) {
      const observer = new PerformanceObserver((list) => {
        const data = list.getEntries();
        cb(processData(data[0]));
      });
      observer.observe({ entryTypes: ['resource'] });
    } else {
      window.onload = () => { // onload 加载完成后获取
        const resourceData = performance.getEntriesByType('resource');
        resourceData.map((_) => cb(processData(_)));
      };
    }
  },
};
