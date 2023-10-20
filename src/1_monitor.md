# monitor

## 1 monitor

### 1.1 监控分类

- 1）性能监控
- 2）数据监控
- 3）异常监控

### 1.2 为什么前端监控

- 获取用户行为以及跟踪产品在用户端的使用情况，并以监控数据为基础，指明产品优化的方向

### 1.3 前端性能监控和错误监控

- 前端衡量性能的指标（时间监控）
  - Resorce timing Performance API

- 前端资源监控
  - performance.getEntriesByType('resource');

- ajax 请求监控
  - 拦截 open 和 send 方法

- 前端代码异常
  - window.onerror

### 1.4 website

- 新建项目 [website](../public/1_monitor_example/website/app.js)
- 执行命令

```bash
npm init -y
yarn add koa koa-static bootstrap jquery
```

- 新建 [index.html](../public/1_monitor_example/website/client/index.html)

```html
<link rel="stylesheet" href="/bootstrap/dist/css/bootstrap.css">

<div class="text-center text-danger h2">前端监控例子</div>
<script src="/jquery/dist/jquery.js"></script>
```

### 1.5 [app.js](../public/1_monitor_example/website/app.js)

```js
const Koa = require('koa');
const path = require('path');
const Server = require('koa-static');

const app = new Koa();
app.use(Server(path.join(__dirname, 'client')));
app.use(Server(path.join(__dirname, 'node_modules')));
app.listen(3000, () => {
  console.log('server start 3000');
});
```

## 2 monitor

### 2.1 新建项目 [monitor](../public/1_monitor_example/monitor/rollup.config.js)

```js
import babal from 'rollup-plugin-babel';

export default {
  input: './index.js',
  output: {
    file: '../website/client/bundle.js',
    format: 'umd',
  },
  watch: {
    exclude: 'node_modules/**',
  },
  plugins: [
    babal({
      babelrc: false,
      presets: [
        '@babel/preset-env',
      ],
    }),
  ],
};

```

- 安装 rollup `yarn add rollup rollup-plugin-babel @babel/core @babel/preset-env -D`

### 2.2 新建入口文件 [index.js](../public/1_monitor_example/monitor/index.js)

```js
const fn = () => {
  console.log('hello welcome');
};
fn();
```

### 2.3 [package.json](../public/1_monitor_example/monitor/package.json)

```js
"type": "module",

"dev": "rollup -c --watch"
```

- 在 [index.html](../public/1_monitor_example/website/client/index.html) 中引入 bundle.js `<script src="bundle.js"></script>`
- 命令行执行 `npm run dev`

### 2.4 页面性能监控

- [performance.js](../public/1_monitor_example/monitor/performance.js)

```js
// 监控页面性能
export default {
  init(cb) {
    const data = {};
    data.test = 1;
    cb(data);
  },
};
```

- [index.js](../public/1_monitor_example/monitor/index.js) 引入 performance.js 并调用 init 方法

```js
import perf from './performance.js';

perf.init((data) => {
  console.log(data);
});
```

- 格式化 performance.timing 数据
- [performance.js](../public/1_monitor_example/monitor/performance.js)

```js
const processData = (obj) => {
  const data = {
    ...obj,
  };
  return data;
};
export default {
  init(cb) {
    const prefData = performance.timing;
    console.log('prefData:', prefData);
    const data = processData(prefData);
    console.log('data:', data);
    cb(data);
  },
};

```

### 2.5 页面性能监控

- processData 方法：[performance.js](../public/1_monitor_example/monitor/performance.js)

```js
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
```

## 3 monitor

### 3.1 页面性能监控 [performance.js](../public/1_monitor_example/monitor/performance.js)

- 解决加载后获取页面性能数据：监听 load

```js
window.addEventListener('load', () => {
  const prefData = performance.timing;
  const data = processData(prefData);
  cb(data);
}, false);
```

- load 方法：DOM 结束后执行方法

```js
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

load(() => {
  const prefData = performance.timing;
  const data = processData(prefData);
  cb(data);
});
```

### 3.2 捕捉用户未加载就关闭页面的数据 domready [performance.js](../public/1_monitor_example/monitor/performance.js)

- domready 方法：未加载完的监控数据

```js
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
```

### 3.3 上传统计数据方法

1. 通过 ajax
2. 通过 image

```js
new Image().src = '/p.gif?xx=xx'
```

### 3.4 格式化页面性能数据 formatObj [index.js](../public/1_monitor_example/monitor/index.js)

```js
import perf from './performance.js';

/**
 * 格式化数据
 * @param {{[key: string]: any}} data
 * @returns {string}
 */
const formatObj = (data) => {
  const arr = [];
  for (const key in data) {
    arr.push(`${key}=${data[key]}`);
  }
  return arr.join('&');
};

perf.init((data) => {
  new Image().src = `/p.gif${formatObj(data)}`;
  console.log(data);
});
```

### 3.5 监控页面静态资源加载情况 [index.js](../public/1_monitor_example/monitor/index.js)

```js
import resource from './resource.js';

resource.init((data) => {
  console.log('resource:', data);
});
```

- [resource.js](../public/1_monitor_example/monitor/resource.js)

```js
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
    window.onload = () => { // onload 加载完成后获取
      const resourceData = performance.getEntriesByType('resource');
      resourceData.map((_) => cb(processData(_)));
    };
  },
};
```

- 浏览器控制台验证正确

## 4 monitor

### 4.1 对资源信息收一个发一个 [resource.js](../public/1_monitor_example/monitor/resource.js)

```js
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
```

### 4.2 服务端新增接口 /api/list [app.js](../public/1_monitor_example/website/app.js)

```js
app.use(async (ctx, next) => {
  if (ctx.path === '/api/list') {
    ctx.body = { name: 'kft', age: 18 };
  }
  // 访问 http://localhost:3000/api/list 验证返回正确
  return next();
});
```

### 4.3 新建 [main.js](../public/1_monitor_example/website/client/main.js) 并在 [index.html](../public/1_monitor_example/website/client/index.html) 引入

```js
/* global $ */
$.ajax({
  method: 'get',
  url: '/api/list',
});

```

### 4.4 ajax 监控：[index.js](../public/1_monitor_example/monitor/index.js)

```js
import xhr from './xhr';

xhr.init((data) => {
  console.log('xhr:', data);
});

```

### 4.5 新建 ajax 监控文件 [xhr.js](../public/1_monitor_example/monitor/xhr.js)

```js
export default {
  init(cb) {
    const xhr = window.XMLHttpRequest;
    const oldOpen = xhr.prototype.open;
    /** @param  {any[]} args [method, url, async, [username], [password]] */
    xhr.prototype.open = function open(...args) => {
      cb();
      return oldOpen.apply(this, args);
    };
  },
};

```

## 5 monitor

### 5.1 重写 open 和 send 方法 [xhr.js](../public/1_monitor_example/monitor/xhr.js)

```js
/**
 * @typedef {object} Info
 * @property {string} method
 * @property {string | URL} url
 * @property {boolean} async
 * @property {string} type
 * @property {number} requestSize
 * @property {number} responseSize
 * @property {string} [username]
 * @property {string} [password]
 */
export default {
  init(cb) {
    const xhr = window.XMLHttpRequest;
    const oldOpen = xhr.prototype.open;
    /** @param  {any[]} args [method, url, async, [username], [password]] */
    xhr.prototype.open = function open(...args) {
      const [method, url, async, username, password] = args;
      /** @type {Info} info */
      this.info = {
        method, url, async, username, password,
      };
      return oldOpen.apply(this, args);
    };
    const oldSend = xhr.prototype.send;
    /**
     *
     * @param  {[body?: Document | XMLHttpRequestBodyInit | null | undefined]} args
     * @returns
     */
    xhr.prototype.send = function send(...args) {
      const [value] = args;
      const start = Date.now();
      const fn = (type) => () => {
        this.info.time = Date.now() - start;
        this.info.requestSize = value ? value.length : 0;
        this.info.responseSize = this.responseText.length;
        this.info.type = type;
        cb(this.info);
      };
      this.addEventListener('load', fn('load'), false);
      this.addEventListener('error', fn('error'), false);
      this.addEventListener('abort', fn('abort'), false);
      return oldSend.apply(this, args);
    };
  },
};

```

### 5.2 页面的错误捕捉：错误代码 [main.js](../public/1_monitor_example/website/client/main.js)

```js
const x = xxx;
```

### 5.3 页面的错误捕捉：监控文件 [index.js](../public/1_monitor_example/monitor/index.js)

```js
import errCatch from './errCatch';

errCatch.init((data) => {
  console.log('errCatch:', data);
});

```

### 5.4 页面的错误捕捉：监控文件执行文件 [errCatch.js](../public/1_monitor_example/monitor/errCatch.js)

```js
export default {
  init(cb) {
    window.onerror = function onerror(message, source, lineno, colno, error) {
      const info = {
        message: error.message,
        name: error.name,
      };
      const { stack } = error;
      const matchUrl = stack.match(/http:\/\/[^\n]*/)[0];
      const filename = matchUrl.match(/http:\/\/(?:\S*).js/)[0];
      info.filename = filename;
      const [, row, colume] = matchUrl.match(/:(\d+):(\d+)/);
      info.row = row;
      info.colume = colume; // 上线时代码压缩，使用 source-map
      cb(info);
    };
  },
};
```

- window.onerror 无法捕捉 Promise 错误
