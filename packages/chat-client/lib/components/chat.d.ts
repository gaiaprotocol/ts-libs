import '@shoelace-style/shoelace';
import '../../src/components/chat.css';
import { ChatProfile } from '../services/chat-profile';
import { Component } from './component';
interface Options {
    roomId: string;
    myAccount: string;
    useAddressAvatar?: boolean;
    /** 아바타/이름 클릭 시 호출됩니다. (키보드 Enter/Space 포함) */
    onProfileClick?: (account: `0x${string}`, profile: ChatProfile, ev?: Event) => void;
}
declare function createChatComponent({ roomId, myAccount, useAddressAvatar, onProfileClick }: Options): Component & {
    scrollToBottom: () => void;
};
export { createChatComponent };
//# sourceMappingURL=chat.d.ts.map