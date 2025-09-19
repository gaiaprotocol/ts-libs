import '@ionic/core';
import { el } from "@webtaku/el";
export function createNftSelectorModal(address, onSelect, fetchNfts) {
    const modal = el("ion-modal");
    const loading = el("ion-spinner", { name: "crescent" });
    const list = el("ion-list");
    const errorText = el("ion-text", { color: "danger", style: "display: none;" }, "Failed to load NFTs");
    const content = el("ion-content.ion-padding", loading, errorText, list);
    const modalHeader = el("ion-header", el("ion-toolbar", el("ion-title", "Select NFT"), el("ion-buttons", { slot: "end" }, el("ion-button", { onclick: () => modal.dismiss() }, "Close"))));
    modal.append(modalHeader, content);
    fetchNfts(address)
        .then(nfts => {
        loading.remove();
        if (!nfts.length) {
            list.append(el("ion-item", "No NFTs to display."));
            return;
        }
        nfts.forEach(nft => {
            const img = el("img", {
                src: nft.image,
                alt: nft.name,
                style: "width: 40px; height: 40px; object-fit: cover; border-radius: 4px; margin-right: 12px;"
            });
            const item = el("ion-item", {
                button: true,
                onclick: () => {
                    onSelect(nft);
                    modal.dismiss();
                }
            }, img, el("ion-label", nft.name || "Unnamed"));
            list.append(item);
        });
    })
        .catch(err => {
        console.error(err);
        loading.remove();
        errorText.style.display = "";
    });
    return modal;
}
//# sourceMappingURL=nft-selector-modal.js.map