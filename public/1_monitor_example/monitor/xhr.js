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
    /**
     * @param  {(string|string | URL|boolean)[]} args
     * @returns
     */
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
