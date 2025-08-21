import { createAddressAvatar, createJazzicon, shortenAddress, tokenManager } from '@gaiaprotocol/client-common';
import '@shoelace-style/shoelace';
import { el } from '@webtaku/el';
import { getAddress } from 'viem';
import '../../src/components/chat.css';
import { ChatMessage, ChatService } from '../services/chat';
import { ChatProfile, chatProfileService } from '../services/chat-profile';
import { Attachment } from '../types/chat';
import { parseTextWithLinks } from '../utils/text';
import { Component } from './component';

declare const API_BASE_URI: string;

interface Options {
  roomId: string;
  myAccount: string;
  useAddressAvatar?: boolean;
}

/** 모든 하위 img가 로드되면 resolve */
async function waitForImages(node: HTMLElement) {
  const imgs = Array.from(node.querySelectorAll('img')) as HTMLImageElement[];
  if (!imgs.length) return;
  await Promise.all(
    imgs.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const done = () => {
          img.removeEventListener('load', done);
          img.removeEventListener('error', done);
          resolve();
        };
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
      });
    })
  );
}

/** 이미지 실패 시 대체 UI */
function replaceWithFallback(img: HTMLImageElement) {
  const wrapper = el('div.img-fallback');
  wrapper.style.width = '180px';
  wrapper.style.height = '120px';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';
  wrapper.style.justifyContent = 'center';
  wrapper.style.alignItems = 'center';
  wrapper.style.border = '1px solid var(--sl-color-neutral-200)';
  wrapper.style.borderRadius = '8px';
  wrapper.style.boxSizing = 'border-box';

  const icon = el('sl-icon', { name: 'image' });
  icon.style.fontSize = '48px';
  icon.style.color = 'var(--sl-color-neutral-500)';

  const msg = el('div', '불러올 수 없음');
  msg.style.fontSize = '12px';
  msg.style.color = 'var(--sl-color-neutral-600)';

  wrapper.append(icon, msg);
  img.replaceWith(wrapper);
}

function createChatComponent({ roomId, myAccount, useAddressAvatar }: Options): Component & {
  scrollToBottom: () => void;
} {
  // 상태
  const pendingAttachments: { file: File; blobUrl: string }[] = [];
  const observedAccounts = new Set<string>();
  let autoStick = true; // 사용자가 바닥 근처일 때만 자동 스크롤 유지

  // 루트/서브 요소
  const root = el('div.chat-component');
  const list = el('div.message-list');
  const input = el('sl-input', { placeholder: 'Type a message…', pill: true });
  const sendBtn = el('sl-button', { variant: 'primary', pill: true }, 'Send');
  const attachBtn = el('sl-button', { variant: 'default', circle: true }, el('sl-icon', { name: 'paperclip' }));
  const fileInput = el('input', { type: 'file', accept: 'image/*', multiple: true, style: 'display:none' }) as HTMLInputElement;
  const composer = el('div.composer', input, fileInput, attachBtn, sendBtn);
  const thumbBar = el('div.thumb-bar');

  root.append(list, thumbBar, composer);

  // 서비스
  const service = new ChatService(roomId);
  service.connect();

  // ===== 유틸 =====
  const ensureProfile = (account: string) => {
    if (!chatProfileService.getCached(account)) {
      chatProfileService.preload([account]);
    }
  };

  function isNearBottom(el: HTMLElement, threshold = 24) {
    return el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
  }

  function scrollToBottom() {
    list.scrollTop = list.scrollHeight;
  }

  /** DOM 부착 후 “두 번의 rAF”로 레이아웃 확정 뒤 스크롤 */
  function rafScrollToBottom() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => scrollToBottom());
    });
  }

  function buildNode(msg: ChatMessage, pending = false): HTMLElement {
    const account = getAddress(msg.account);
    ensureProfile(account);

    const wrapper = el('div.message', {
      className: `${pending ? 'pending' : ''} ${account === myAccount ? 'own' : ''}`.trim(),
      dataset: { id: String(msg.id ?? '') }
    });

    // 아바타
    const avatarContainer = el('div.avatar-container', {
      style: `
        width:40px;
        height:40px;
        background-size: cover;
        background-position: center;
        border-radius: 50%;
      `
    }) as HTMLElement;

    const cachedProfileImage = chatProfileService.getCached(account)?.profileImage;
    if (cachedProfileImage) {
      avatarContainer.style.backgroundImage = `url("${cachedProfileImage}")`;
    } else {
      const avatar = useAddressAvatar ? createAddressAvatar(account) : createJazzicon(account);
      avatar.classList.add('avatar');
      avatarContainer.append(avatar);
    }

    // 메타
    const cachedName = chatProfileService.getCached(account)?.nickname || shortenAddress(account);
    const time = new Date(msg.timestamp).toLocaleTimeString();
    const meta = el('div.meta', el('span.name', { dataset: { account } }, cachedName), el('time.time', time));

    // 본문
    const body = el('div.msg-body', meta);

    if (msg.text) {
      const textNode = el('div.text');
      textNode.append(parseTextWithLinks(msg.text));
      body.append(textNode);
    }

    if (msg.attachments?.length) {
      const gallery = el(
        'div.attachments',
        ...msg.attachments
          .filter((a) => a.kind === 'image')
          .map((attachment) => {
            const a = el('a', { href: attachment.url, target: '_blank' });
            const img = el('img.img-msg', { alt: 'image' }) as HTMLImageElement;

            // 로딩 전 임시 상태 class (CSS에서 skeleton 등 처리)
            img.classList.add('img-loading');
            img.src = attachment.url;

            if (img.complete) {
              img.classList.remove('img-loading');
            } else {
              img.onload = () => img.classList.remove('img-loading');
              img.onerror = () => replaceWithFallback(img);
            }

            a.append(img);
            return a;
          })
      );
      body.append(gallery);
    }

    wrapper.append(avatarContainer, body);
    return wrapper;
  }

  function renderOptimistic(text: string, attachments: Attachment[], localId: string) {
    const temp: ChatMessage = {
      id: -1,
      localId,
      type: 'chat',
      account: myAccount,
      text,
      attachments,
      timestamp: Date.now()
    };
    const node = buildNode(temp, true);
    node.dataset.localId = localId;
    list.append(node);

    // 이미지 로딩 완료 후 스크롤 (바닥 근접 시만)
    waitForImages(node).then(() => {
      if (autoStick) scrollToBottom();
    });

    return node;
  }

  function overwritePlaceholder(placeholder: HTMLElement, real: ChatMessage) {
    placeholder.replaceWith(buildNode(real));
  }

  function markFailed(node: HTMLElement) {
    node.classList.remove('pending');
    node.classList.add('failed');
  }

  // ===== 이벤트 바인딩 =====

  // 프로필 변경 시 UI 반영
  chatProfileService.addEventListener('chatprofilechange', (e) => {
    const { account, profile } = (e as CustomEvent<{ account: `0x${string}`; profile: ChatProfile }>).detail;

    list.querySelectorAll<HTMLElement>(`.message .name[data-account="${account}"]`).forEach((node) => {
      node.textContent = profile.nickname ?? shortenAddress(account);

      const messageEl = node.closest('.message');
      const avatarContainer = messageEl?.querySelector<HTMLElement>('.avatar-container') ?? null;

      if (avatarContainer) {
        if (profile.profileImage) {
          avatarContainer.style.backgroundImage = `url("${profile.profileImage}")`;
          avatarContainer.innerHTML = '';
        } else {
          if (!avatarContainer.querySelector('.avatar')) {
            const fallback = useAddressAvatar ? createAddressAvatar(account) : createJazzicon(account);
            fallback.classList.add('avatar');
            avatarContainer.innerHTML = '';
            avatarContainer.append(fallback);
          }
          avatarContainer.style.backgroundImage = '';
        }
      }
    });
  });

  // 파일 첨부
  function pushThumb(file: File, blobUrl: string) {
    const wrapper = el('div.thumb-wrapper');
    const img = el('img.thumb', { src: blobUrl });
    const removeBtn = el('button.remove', '×');

    removeBtn.onclick = () => {
      const idx = pendingAttachments.findIndex((p) => p.blobUrl === blobUrl);
      if (idx >= 0) {
        URL.revokeObjectURL(pendingAttachments[idx].blobUrl);
        pendingAttachments.splice(idx, 1);
      }
      wrapper.remove();
    };

    wrapper.append(img, removeBtn);
    thumbBar.append(wrapper);
  }

  attachBtn.onclick = () => fileInput.click();

  fileInput.onchange = () => {
    Array.from(fileInput.files || []).forEach((f) => {
      const blobUrl = URL.createObjectURL(f);
      pendingAttachments.push({ file: f, blobUrl });
      pushThumb(f, blobUrl);
    });
    fileInput.value = '';
  };

  // 메시지 수신
  service.addEventListener('message', (e) => {
    const msg = (e as CustomEvent<ChatMessage>).detail;

    // localId 치환
    if (msg.account === myAccount && msg.localId) {
      const ph = list.querySelector<HTMLElement>(`.message.pending[data-local-id="${msg.localId}"]`);
      if (ph) {
        overwritePlaceholder(ph, msg);
        if (autoStick) scrollToBottom();
        return;
      }
    }

    // 중복 가드
    if (list.querySelector(`[data-id="${msg.id}"]`)) return;

    list.append(buildNode(msg));
    waitForImages(list).then(() => {
      if (autoStick) scrollToBottom();
    });
  });

  // 초기 메시지
  service.addEventListener('init', (e) => {
    const initialMessages = (e as CustomEvent<ChatMessage[]>).detail;
    initialMessages.forEach((msg) => {
      observedAccounts.add(getAddress(msg.account));
      list.append(buildNode(msg));
    });
    chatProfileService.preload([...observedAccounts]);

    // 이미지 로딩을 기다리되, DOM 부착/레이아웃 확정 후 스크롤 보장
    waitForImages(list)
      .then(() => rafScrollToBottom())
      .catch(() => rafScrollToBottom());
  });

  // 전송
  async function sendCurrentInput() {
    const text = (input.value as string).trim();
    if (!text && pendingAttachments.length === 0) return;

    input.value = '';

    // 낙관적 렌더용 임시 첨부 (blob URL)
    const tempAttachments: Attachment[] = pendingAttachments.map((p) => ({
      kind: 'image',
      url: p.blobUrl
    }));

    const localId = crypto.randomUUID();
    const placeholder = renderOptimistic(text, tempAttachments, localId);

    try {
      // 업로드
      const uploaded: Attachment[] = await Promise.all(
        pendingAttachments.map(async (p) => {
          const fd = new FormData();
          fd.append('image', p.file);
          const res = await fetch(`${API_BASE_URI}/upload-image`, {
            method: 'POST',
            body: fd,
            headers: { Authorization: `Bearer ${tokenManager.getToken()}` }
          });
          const { imageUrl, thumbnailUrl } = await res.json();
          return { kind: 'image', url: imageUrl, thumb: thumbnailUrl };
        })
      );

      // 실제 전송
      const saved = await service.send(text, uploaded, localId);
      overwritePlaceholder(placeholder, saved);
      if (autoStick) scrollToBottom();
    } catch {
      markFailed(placeholder);
    } finally {
      pendingAttachments.forEach((p) => URL.revokeObjectURL(p.blobUrl));
      pendingAttachments.length = 0;
      thumbBar.innerHTML = '';
    }
  }

  sendBtn.addEventListener('click', sendCurrentInput);

  input.addEventListener(
    'keydown',
    (e: KeyboardEvent) => {
      if (e.isComposing || e.key === 'Process') return;
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendCurrentInput();
      }
    },
    { capture: true }
  );

  // 사용자 스크롤 시 autoStick 상태 갱신
  list.addEventListener('scroll', () => {
    autoStick = isNearBottom(list);
  });

  // 콘텐츠/레이아웃 변경 시 바닥 유지 (바닥 근접일 때만)
  const ro = new ResizeObserver(() => {
    if (autoStick) scrollToBottom();
  });
  ro.observe(list);

  // 가상 키보드/뷰포트 변화 대응
  const onResize = () => {
    if (autoStick) scrollToBottom();
  };
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', onResize);
  } else {
    // fallback: 윈도우 리사이즈
    window.addEventListener('resize', onResize);
  }

  // 컴포넌트 인터페이스
  return {
    el: root,
    scrollToBottom,
    remove() {
      service.disconnect();
      root.remove();
      ro.disconnect();
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', onResize);
      } else {
        window.removeEventListener('resize', onResize);
      }
    }
  };
}

export { createChatComponent };
