/*import { el } from "@webtaku/el";
import { fetchNftsForAddress } from "../api/nft"; // 🔷 당신의 API에 맞게 수정
import type { NftItem } from "../types/nft"; // 🔷 NFT 타입 선언 필요

export function createNftSelectorModal(address: string, onSelect: (nft: NftItem) => void) {
  const modal = el("ion-modal");
  const loading = el("ion-spinner", { name: "crescent" });
  const list = el("ion-list");
  const errorText = el("ion-text", { color: "danger", style: "display: none;" }, "NFT 불러오기 실패");

  const content = el("ion-content.ion-padding",
    loading,
    errorText,
    list
  );

  const modalHeader = el("ion-header",
    el("ion-toolbar",
      el("ion-title", "NFT 선택"),
      el("ion-buttons", { slot: "end" },
        el("ion-button", { onclick: () => modal.dismiss() }, "닫기")
      ),
    )
  );

  modal.append(modalHeader, content);

  fetchNftsForAddress(address)
    .then(nfts => {
      loading.remove();
      if (!nfts.length) {
        list.append(el("ion-item", "표시할 NFT가 없습니다."));
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
        },
          img,
          el("ion-label", nft.name || "이름 없음")
        );

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
*/