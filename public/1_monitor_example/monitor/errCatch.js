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
