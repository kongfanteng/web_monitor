import onload from '../utils/onload';
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
  onload(() => {
    for (let i = 1; i <= 9; i += 1) {
      const xElements = document.elementsFromPoint(
        (window.innerWidth * i) / 10,
        window.innerHeight / 2,
      );
      const yElements = document.elementsFromPoint(
        window.innerWidth / 2,
        (window.innerHeight * i) / 10,
      );
      isWrapper(xElements[0]);
      isWrapper(yElements[0]);
    }
    if (emptyPoints >= 18) {
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
  });
}
