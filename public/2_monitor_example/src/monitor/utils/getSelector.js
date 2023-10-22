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
