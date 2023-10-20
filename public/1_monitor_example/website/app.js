const Koa = require('koa');
const path = require('path');
const Server = require('koa-static');

const app = new Koa();

app.use(async (ctx, next) => {
  if (ctx.path === '/api/list') {
    ctx.body = { name: 'kft', age: 18 };
  }
  // 访问 http://localhost:3000/api/list 验证返回正确
  return next();
});

app.use(Server(path.join(__dirname, 'client')));
app.use(Server(path.join(__dirname, 'node_modules')));
app.listen(3000, () => {
  console.log('server start 3000');
});
