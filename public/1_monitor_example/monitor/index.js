// import perf from './performance.js';

// /**
//  * 格式化数据
//  * @param {{[key: string]: any}} data
//  * @returns {string}
//  */
// const formatObj = (data) => {
//   const arr = [];
//   for (const key in data) {
//     arr.push(`${key}=${data[key]}`);
//   }
//   return arr.join('&');
// };

// perf.init((data) => {
//   new Image().src = `/p.gif${formatObj(data)}`;
//   console.log(data);
// });

// 监控页面静态资源加载情况
// import resource from './resource.js';

// resource.init((data) => {
//   console.log('resource:', data);
// });

// ajax 监控
// import xhr from './xhr';

// xhr.init((data) => {
//   console.log('xhr:', data);
// });

// 页面的错误捕捉 try/catch
import errCatch from './errCatch';

errCatch.init((data) => {
  console.log('errCatch:', data);
});
