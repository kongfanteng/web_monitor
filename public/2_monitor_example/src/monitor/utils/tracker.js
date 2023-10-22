const host = 'cn-beijing.log.aliyuncs.com';
const project = 'kft-monitor';
const logStore = 'kft-monitor-store';

function getExtraData() {
  return {
    title: document.title,
    url: location.href,
    timestamp: Date.now(),
    userAgent: navigator.userAgent, // 用户 ID
  };
}
const formatObj = (data) => {
  const arr = [];
  for (const key in data) {
    if (Object.hasOwn(data, key)) {
      arr.push(`${key}=${data[key]}`);
    }
  }
  return arr.join('&');
};
class SendTracker {
  constructor() {
    this.url = `http://${project}.${host}/logstores/${logStore}/track?APIVersion=0.6.0&`; // 上报的路径
    this.xhr = new XMLHttpRequest();
  }

  send(data = {}) {
    const extraData = getExtraData();
    const log = formatObj({ ...extraData, ...data });
    this.url += log;
    this.xhr.open('GET', this.url, true);
    this.xhr.onerror = function onerror(error) {
      console.log(error);
    };
    this.xhr.send();
  }
}
export default new SendTracker();
