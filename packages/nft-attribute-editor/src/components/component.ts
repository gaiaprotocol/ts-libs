import { EventEmitter, EventMap } from '@webtaku/event-emitter';

export class Component<E extends EventMap> extends EventEmitter<E> {
  constructor(
    public el: HTMLElement,
    public remove: () => void,
  ) { super(); }
}
