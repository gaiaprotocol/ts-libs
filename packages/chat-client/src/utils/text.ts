import { el } from '@webtaku/el';

/**
 * 문자열에서 URL을 자동으로 링크로 변환한 DocumentFragment 반환
 */
export function parseTextWithLinks(text: string): DocumentFragment {
  const frag = document.createDocumentFragment();
  const urlRegex = /((https?:\/\/)[^\s]+)/g;

  let lastIndex = 0;
  let match;

  while ((match = urlRegex.exec(text)) !== null) {
    const { index } = match;
    const url = match[0];

    if (index > lastIndex) {
      frag.append(document.createTextNode(text.slice(lastIndex, index)));
    }

    const a = el('a', {
      href: url,
      target: '_blank',
      rel: 'noopener noreferrer'
    }, url);
    a.classList.add('msg-link');
    frag.append(a);

    lastIndex = index + url.length;
  }

  if (lastIndex < text.length) {
    frag.append(document.createTextNode(text.slice(lastIndex)));
  }

  return frag;
}
