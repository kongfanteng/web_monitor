# 前端监控

## 1 2_monitor

### 1.1 为什么做前端监控

- 更快发现问题和解决问题
- 做产品的决策依据
- 提升前端工程师的技术深度和广度，打造简历亮点
- 为业务扩展提供更多可能性

### 1.2 前端监控目标

#### 1 稳定性 stability

1. JS 错误：JS 执行错误或 Promise 异常
2. 资源异常：script link 等资源加载异常
3. 接口错误：ajax 或 fetch 请求接口异常
4. 白屏：页面空白

#### 2 用户体验（experience）

- 加载时间：各个阶段的加载时间
- TTFB(time to first byte)(首字节时间)：是指浏览器发起第一个请求到数据返回第一个字节所消耗的时间
- FP(first paint)(首次绘制)：首次绘制包括了任何用户自定义的背景绘制，它是将第一个像素点绘制到屏幕的时刻
- FCP(first content paint)(首次内容绘制)：首次内容绘制是浏览器将第一个 DOM 渲染到屏幕的时间，可以是任何文本、图像、SVG 等
- FMP(First Meaningful paint)(首次有意义绘制)：首次有意义绘制是页面可用性的量度标准
- FID(First Input Delay)(首次输入延迟)：用户首次和页面交互到页面响应交互的时间
- 卡顿：超过 50ms 的长任务

#### 4 业务(busniess)

- PV：page view 即页面浏览量或点击量
- UV：指访问某个站点的不同 IP 地址的人数
- 页面的停留时间：用户在每个页面的停留时间

### 1.3 前端监控流程

1. 埋点
2. 数据采集
3. 数据建模存储
4. 数据传输（实时/批量）
5. 数据统计（分析/挖掘）
   1. 数据可视化（反馈）
   2. 报告和报警

### 1.4 常见的埋点方案

1. 代码埋点
   - 代码埋点，就是以嵌入代码的形式进行埋点，比如需要监控用户的点击事件，会选择在用户点击时，插入一段代码，保存这个监听行为或者直接将监听行为以某一种数据格式直接传递给服务器端。
   - 优点是可以在任意时刻，精确的发送或保存所需要的数据信息
   - 缺点是工作量较大
2. 可视化埋点
   1. 通过可视化交互的手段，代替代码埋点
   2. 将业务代码和埋点代码分离，提供一个可视化交互的页面，输入为业务代码，通过这个可视化系统，可以在业务代码中自定义的增加埋点事件等等，最后输出的代码耦合了业务代码和埋点代码
   3. 可视化埋点其实是用系统来代替手工插入埋点代码
3. 无痕埋点
   - 前端的任意一个事件都被绑定一个标识，所有事件都被记录下来
   - 通过定期上传记录文件，配合文件解析，解析出来我们想要的数据，并生成可视化报告供专业人员分析
   - 无痕埋点的优点是采集全量数据，不会出现漏埋和勿埋等现象
   - 缺点是给数据传输和服务器增加压力，也无法灵活定制数据结构

### 1.5 2_monitor_example

```cmd
mkdir 2_monitor_example && cd 2_monitor_example && npm init -y
```

## 2 2_monitor

### 2.1 新建 [webpack.config.js](../public/2_monitor_example/webpack.config.js)

```js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  context: process.cwd(),
  mode: 'development',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'monitor.js',
  },
  devServer: {
    static: path.resolve(__dirname, 'dist'),
    open: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      inject: 'head',
      scriptLoading: 'blocking', // 默认为 defer，无法捕捉即时 TypeError 错误
    }),
  ],
};
```

```bash
# 新建 index.html 和 index.js
mkdir src && echo '前端监控 SDK' >> src/index.html && touch src/index.js

# 安装依赖包
yarn add webpack webpack-cli html-webpack-plugin user-agent webpack-dev-server -D

# package.json
"scripts": {
  "build": "webpack",
  "dev": "webpack-dev-server"
},
```

### 2.2 JsError 准备

- [src/index.html](../public/2_monitor_example/src/index.html)

```html
<div class="container">
  <div class="content">
    <input type="button" value="点击抛出错误" onclick="errorClick()" />
    <input type="button" value="点击抛出Promise错误" onclick="promiseClick()" />
  </div>
</div>
<script>
  window.someVar.error = 'error'
</script>
```

- [src/monitor/lib/jsError.js](../public/2_monitor_example/src/monitor/lib/jsError.js)

```js
export function injectJsError() {}
```

- [src/monitor/index.js](../public/2_monitor_example/src/monitor/index.js)

```js
import { injectJsError } from './lib/jsError'

injectJsError()
```

- [src/index.js](../public/2_monitor_example/src/index.js)

```js
import './monitor'
```

### 2.3 JsError 代码

#### 2.3.1 [src/monitor/lib/jsError.js](../public/2_monitor_example/src/monitor/lib/jsError.js)

```js
import getLastEvent from '../utils/getLastEvent';
import getSelector from '../utils/getSelector';

function getLines(stack) {
  return stack.split('\n').slice(1).map((item) => item.replace(/^\s+at\s+/g, '')).join('^');
}
export function injectJsError() {
  // 监听全局未捕获的错误
  window.addEventListener('error', (event) => {
    // 错误事件对象
    console.log('event:', event);
    const lastEvent = getLastEvent();

    const log = {
      kind: 'stability', // 监控指标的大类
      type: 'error', // 小类型，这是一个错误
      errorType: 'jsError', // JS 执行错误
      url: '', // 访问哪个路径报错
      message: event.message, // 报错信息
      filename: event.filename, // 哪个文件报错了
      position: `${event.lineno}:${event.colno}`,
      stack: getLines(event.error.stack),
      selector: lastEvent ? getSelector(lastEvent) : '', // 代表最后一个操作的元素
    };
    console.log('log:', log);
  });
}

```

#### 2.3.2 [src/monitor/utils/getLastEvent.js](../public/2_monitor_example/src/monitor/utils/getLastEvent.js)

```js
let lastEvent
;['click', 'touchstart', 'mousedown', 'keydown', 'mouseover'].forEach(
  (eventType) => {
    document.addEventListener(
      eventType,
      (event) => {
        lastEvent = event
      },
      {
        capture: true, // 捕获阶段
        possive: true, // 捕获不阻止默认事件
      }
    )
  }
)
export default function getLastEvent() {
  return lastEvent
}
```

#### 2.3.3 [src/monitor/utils/getSelector.js](../public/2_monitor_example/src/monitor/utils/getSelector.js)

```js
function getSelectors(path) {
  return path
    .reverse()
    .filter((element) => element !== document && element !== window)
    .map((element) => {
      if (element.id) {
        return `${element.nodeName.toLowerCase()}#${element.id}`;
      }
      if (element.className && typeof element.className === 'string') {
        return `${element.nodeName.toLowerCase()}#${element.className}`;
      }
      return element.nodeName.toLowerCase();
    })
    .join(' ');
}
export default function getSelector(path) {
  if (Array.isArray(path)) {
    return getSelectors(path);
  }
  return undefined;
}

```

#### 2.3.4 [src/monitor/lib/jsError.js](../public/2_monitor_example/src/monitor/lib/jsError.js)

```js
import getLastEvent from '../utils/getLastEvent';
import getSelector from '../utils/getSelector';

const lastEvent = getLastEvent(); // error 监控方法中

selector: lastEvent ? getSelector(lastEvent) : '', // 代表最后一个操作的元素
```

- 调试查看 log 正确

### 2.4 定义上报文件 [src/monitor/utils/tracker.js](../public/2_monitor_example/src/monitor/utils/tracker.js)

```js
class SendTracker {
  contructor() {
    this.url = ''; // 上报的路径
    this.xhr = new XMLHttpRequest();
  }

  send(data = {}) {

  }
}
export default new SendTracker();

```

### 2.5 [src/monitor/lib/jsError.js](../public/2_monitor_example/src/monitor/lib/jsError.js) 引入 track.js

```js
import tracker from '../utils/tracker';

tracker.send(log);
```

## 3 2_monitor

### 3.1 [阿里云创建日志服务](https://sls.console.aliyun.com/lognext/profile)

- 创建 Project
- 创建 Logstore，选中 WebTracking
- 查询日志 => 立即尝试
- 查看 PutWebTracking 文档
  - POST {project}.{endpoint}/logstores/{logstoreName}/track
  - { "__logs__": [ {key: value} ] }

### 3.2 [src/monitor/utils/tracker.js](../public/2_monitor_example/src/monitor/utils/tracker.js) 定义 url/send

```js
const host = 'cn-beijing.log.aliyuncs.com';
const project = 'kft-monitor';
const logStore = 'kft-monitor-store';

class SendTracker {
  contructor() {
    this.url = `http://${project}.${host}/logstores/${logStore}/track`; // 上报的路径
    this.xhr = new XMLHttpRequest();
  }

  send(data = {}) {
    this.xhr.open('POST', this.url, true);
    const body = JSON.stringify(data);
    this.xhr.setRequestHeader('Content-Type', 'application/json'); // 请求体类型
    this.xhr.setRequestHeader('x-log-apiversion', '0.6.0'); // 请求体类型
    this.xhr.setRequestHeader('x-log-bodyrawsize', body.length); // 请求体类型
    this.xhr.onload = function onload() {
      console.log(this.xhr.response);
    };
    this.xhr.onerror = function onerror(error) {
      console.log(error);
    };
    this.xhr.send(body);
  }
}
export default new SendTracker();

```

### 3.3 [src/monitor/utils/tracker.js](../public/2_monitor_example/src/monitor/utils/tracker.js) 定义 getExtraData

```js
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
    // 阿里云文档: https://help.aliyun.com/zh/sls/user-guide/use-the-web-tracking-feature-to-collect-logs
    this.url = `http://${project}.${host}/logstores/${logStore}/track?APIVersion=0.6.0&`; // 上报的路径
    this.xhr = new XMLHttpRequest();
  }

  send(data = {}) {
    const extraData = getExtraData();
    const log = formatObj({ ...extraData, ...data });
    this.url += log;
    this.xhr.open('GET', this.url, true);
    this.xhr.onload = function onload() {

    };
    this.xhr.onerror = function onerror(error) {
      console.log(error);
    };
    this.xhr.send();
  }
}
export default new SendTracker();

```

- [阿里云配置索引](https://sls.console.aliyun.com/lognext/project/kft-monitor/logsearch/kft-monitor-store)，查看上传数据正确

### 3.4 clickError & promiseError [src/index.html](../public/2_monitor_example/src/index.html)

```html
<script>
  function errorClick() {
    window.someVar.error = 'error'
  }
  function promiseErrorClick() {
    new Promise(function (resolve, reject) {
      // window.someVar.error = 'error'
      reject('error')
    }).then((result) => {
      console.log(result)
    })
  }
</script>
```

### 3.5 [src/monitor/lib/jsError.js](../public/2_monitor_example/src/monitor/lib/jsError.js) 捕捉 promise 错误

```js

window.addEventListener('error', (event) => {}, true)
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
```

- 验证 promiseError 捕捉

## 4 2_monitor

### 4.1 ResourceError

#### 4.1.1 [src/index.html](../public/2_monitor_example/src/index.html)

```html
<script src="/someError.js"></script>
```

#### 4.1.2 [src/monitor/lib/jsError.js](../public/2_monitor_example/src/monitor/lib/jsError.js)

```js
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
      // ...
    });
  }
}, true);
```

#### 4.1.3 [src/monitor/utils/getSelector.js](../public/2_monitor_example/src/monitor/utils/getSelector.js)

```js
export default function(pathOrTarget){
  if(Array.isArray(pathOrTarget)){
    // ...
  }else{
    const path = []
    while(pathOrTarget){
      path.push(pathOrTarget)
      pathOrTarget = pathOrTarget.parentNode
    }
    return getSelectors(path)
  }
}
```

### 4.2 AjaxError

#### 4.2.1 [src/index.html](../public/2_monitor_example/src/index.html)

```js
<input
  type="button"
  id="successBtn"
  value="ajax成功请求"
  onclick="sendSuccess()"
/>
<input
  type="button"
  id="errorBtn"
  value="ajax失败请求"
  onclick="sendError()"
/>
<script>
  function sendSuccess() {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', '/success', true)
    xhr.responseType = 'json'
    xhr.onload = function () {
      console.log(xhr.response)
    }
    xhr.send()
  }
  function sendError() {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', '/error', true)
    xhr.responseType = 'json'
    xhr.onload = function () {
      console.log(xhr.response)
    }
    xhr.onerror = function (error) {
      console.log(error)
    }
    xhr.send('name=kft')
  }
</script>
```

#### 4.2.2 [webpack.config.js](../public/2_monitor_example/webpack.config.js)

```js
devServer: {
  // ...
  setupMiddlewares: (middlewares) => {
    middlewares.unshift({
      name: 'success',
      path: '/success',
      middleware: (req, res) => {
        res.json({ id: 1 });
      },
    });
    middlewares.unshift({
      name: 'error',
      path: '/error',
      middleware: (req, res) => {
        res.sendStatus(500);
      },
    });
    return middlewares;
  },
}
```

#### 4.2.3 [src/monitor/lib/xhr.js](../public/2_monitor_example/src/monitor/lib/xhr.js)

```js
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

```

#### 4.2.4 [src/monitor/index.js](../public/2_monitor_example/src/monitor/index.js)

```js
import { injectXHR } from './lib/xhr'
injectXHR()
```

### 4.3 BlankScreen

#### 4.3.1 [src/monitor/lib/blankScreen.js](../public/2_monitor_example/src/monitor/lib/blankScreen.js)

```js
import tracker from '../utils/tracker';

export function blankScreen() {}

```

#### 4.3.2 [src/index.html](../public/2_monitor_example/src/index.html)

```js
<div id="container">
  <div class="content">xxx</div>
</div>
<script></script>
```

#### 4.3.3 [src/monitor/lib/blankScreen.js](../public/2_monitor_example/src/monitor/lib/blankScreen.js)

```js
import tracker from '../utils/tracker';

export function blankScreen() {
  const wrapperElements = ['html', 'body', '#container', '.content'];
  let emptyPoints = 0;
  function getSelector(element) {
    if (element.id) {
      return `#${element.id}`;
    } if (element.className) {
      return (
        `.${
          element.className
            .split(' ')
            .filter((item) => !!item)
            .join('.')}`
      );
    }
    return element.nodeName.toLowerCase();
  }
  function isWrapper(element) {
    const selector = getSelector(element);
    if (wrapperElements.indexOf(selector) !== -1) {
      emptyPoints += 1;
    }
  }
  for (let i = 1; i <= 9; i += 1) {
    const xElements = document.elementsFromPoint(
      (window.innerWidth * i) / 10,
      window.innerHeight / 2,
    );
    const yElements = document.elementsFromPoint(
      (window.innerWidth * i) / 2,
      window.innerHeight / 10,
    );
    isWrapper(xElements[0]);
    isWrapper(yElements[0]);
  }
  if (emptyPoints > 18) {
    const centerElements = document.elementsFromPoint(
      window.innerWidth / 2,
      window.innerHeight / 2,
    );
    const log = {
      kind: 'stability', // 监控指标的大类
      type: 'blank', // 小类型，这是一个错误
      emptyPoints,
      screen: `${window.screen.width}X${window.screen.height}`,
      viewPoint: `${window.innerWidth}X${window.innerHeight}`,
      selector: getSelector(centerElements[0]),
    };
    tracker.send(log);
  }
}

```

#### 4.3.4 [src/monitor/index.js](../public/2_monitor_example/src/monitor/index.js)

```js
import { blankScreen } from './lib/blankScreen';
blankScreen();
```

#### 4.3.5 [src/monitor/utils/onload.js](../public/2_monitor_example/src/monitor/utils/onload.js)

```js
export default function (callback) {
  if (document.readyState === 'complete') {
    callback();
  } else {
    window.addEventListener('load', callback);
  }
}

```

### 4.4 BlankScreen

#### 4.4.1 [src/monitor/lib/blankScreen.js](../public/2_monitor_example/src/monitor/lib/blankScreen.js)

```js
onload(function(){
  // for...
  // if(emptyPoints >= 18)
})
```

- 调试查看发送成功

#### 4.4.2 非白屏 [src/index.html](../public/2_monitor_example/src/index.html)

```js
<div id="container">
  <div class="content" style="width: 600px; word-wrap: break-word"></div>
</div>

<script>
  const content = document.getElementsByClassName('content')[0]
  content.innerHTML = '<span>@</span>'.repeat(10000)
</script>
```

- 调试查看不发送白屏数据

### 4.5 加载时间 timing

#### 4.5.1 [src/monitor/lib/timing.js](../public/2_monitor_example/src/monitor/lib/timing.js)

```js
import onload from '../utils/onload';

export function timing() {
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
    }, 3000);
  });
}

```

#### 4.5.2 [src/monitor/index.js](../public/2_monitor_example/src/monitor/index.js)

```js
import { timing } from './lib/timing';

timing();
```

#### 4.5.3 [src/monitor/lib/timing.js](../public/2_monitor_example/src/monitor/lib/timing.js)

```js
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
```

#### 4.5.4 [src/index.html](../public/2_monitor_example/src/index.html)

```html
<script>
  // DOM 解析完成，即使依赖的资源没有加载完成，也会触发这个事件
  document.addEventListener('DOMContentLoaded', () => {
    let start = Date.now()
    while((Date.now() - start) < 1000){}
  })
</script>

```

## 5 2_monitor

### 5.1 性能指标

#### 5.1.1 [src/monitor/lib/timing.js](../public/2_monitor_example/src/monitor/lib/timing.js)

```js
let FMP;
let LCP;
// 增加一个性能条目的观察者
new PerformanceObserver((entryList, observer) => {
  const perfEntries = entryList.getEntries();
  FMP = perfEntries[0]; // setTimeout 2000ms 后
  observer.disconnect();
}).observe({ entryTypes: ['element'] });

new PerformanceObserver((entryList, observer) => {
  const perfEntries = entryList.getEntries();
  LCP = perfEntries[0];
  observer.disconnect();
}).observe({ entryTypes: ['largest-contentful-paint'] });
onload(() => {
  setTimeout(() => {
    // ...
  }, 3000);
});
```

#### 5.1.2 [src/index.html](../public/2_monitor_example/src/index.html)

```html
<div id="container">
  <div class="content" style="width: 600px; word-wrap: break-word"></div>
</div>
<script>
  setTimeout(() => {
    const content = document.getElementsByClassName('content')[0]
    const h1 = document.createElement('h1')
    h1.innerHTML = '我是这个页面中最有意义的内容'
    h1.setAttribute('elementtiming', 'meaningful')
    content.appendChild(h1)
  }, 2000)
</script>
```

#### 5.1.3 [src/monitor/lib/timing.js](../public/2_monitor_example/src/monitor/lib/timing.js)

```js
setTimeout(() => {
  // ...

  const FP = performance.getEntriesByName('first-paint')[0];
  const FCP = performance.getEntriesByName('first-contentful-paint')[0];
  console.log('FP:', FP);
  console.log('FCP:', FCP);
  console.log('FMP:', FMP);
  console.log('LCP:', LCP);
}, 3000)
```

#### 5.1.4 用户第一次交互 点击页面 [src/monitor/lib/timing.js](../public/2_monitor_example/src/monitor/lib/timing.js)

```js
// ... type: 'lagest-contentful-paint'
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
```

#### 5.1.5 [src/index.html](../public/2_monitor_example/src/index.html)

```html
button[id="clickBtn"][onclick="clickMe()"]{点我}

<script>
  function clickMe(){
    let start = Date.now()
    while((Date.now() - start) < 1000) {}
  }
</script>
```

### 5.2 性能指标

#### 5.2.1 [src/monitor/lib/timing.js](../public/2_monitor_example/src/monitor/lib/timing.js)

```js
export function timing(){
  let FMP, LCP;
  if(PerformanceObserver){
    // ...
  }
}


const logPaint = {
  kind: 'experience', // 用户体验指标
  type: 'paint', // 统计每个阶段的时间
  firstPaint: FP.startTime,
  firstContentfulPaint: FCP.startTime,
  firstMeaningfulPaint: FMP.startTime,
  largestContentfulPaint: LCP.startTime,
};
tracker.send(logPaint);
```

#### 5.2.2 推荐监控产品

- 开源
  - sentry
  - 顶塔
- 商业
  - 神策
