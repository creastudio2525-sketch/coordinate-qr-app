(() => {
  "use strict";

  const appTitle = "QRコード作成・読み込み";
  let overlay;
  let lastFocus;
  let entryObserver;

  function appUrl() {
    return new URL(window.location.pathname, window.location.origin).href;
  }

  function createBrandLink() {
    const brand = document.querySelector(".qr-brand");
    if (!brand || brand.querySelector(".qr-brand-link")) return;

    const link = document.createElement("a");
    link.className = "qr-brand-link";
    link.href = "https://member.creastudio.co.jp/index.php";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", "CreaStudioトップを新しいタブで開く");
    link.title = "CreaStudioトップを新しいタブで開く";
    brand.prepend(link);
  }

  function createEntry() {
    const main = document.querySelector(".qr-main");
    const tabs = main?.querySelector(".mode-tabs");
    if (!main || !tabs || document.querySelector(".referral-entry")) return;

    const entry = document.createElement("div");
    entry.className = "referral-entry";
    entry.innerHTML = `
      <div class="referral-entry-copy">
        <strong>このアプリを他の人に紹介</strong>
        <small>紹介用QRコードを表示します</small>
      </div>
      <button class="referral-launcher" type="button" aria-label="紹介用QRコードを表示">紹介用QR</button>`;
    entry.querySelector(".referral-launcher").addEventListener("click", openReferral);
    tabs.before(entry);
  }

  async function waitForEncoder() {
    for (let attempt = 0; attempt < 80; attempt += 1) {
      if (window.qrCodeEncoder?.toDataURL) return window.qrCodeEncoder;
      await new Promise((resolve) => window.setTimeout(resolve, 100));
    }
    throw new Error("QRコード作成機能を読み込めませんでした。");
  }

  async function openReferral() {
    if (overlay) return;
    lastFocus = document.activeElement;
    const url = appUrl();

    overlay = document.createElement("div");
    overlay.className = "referral-overlay";
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closeReferral();
    });

    const dialog = document.createElement("section");
    dialog.className = "referral-dialog";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "referral-title");
    dialog.innerHTML = `
      <button class="referral-close" type="button" aria-label="閉じる">×</button>
      <h2 id="referral-title">QRコードでアプリを紹介</h2>
      <p class="referral-description">相手のスマートフォンでQRコードを読み取ると、このアプリを開けます。</p>
      <div class="referral-qr-frame"><span class="referral-qr-loading" role="status">QRコードを作成しています…</span></div>
      <label class="referral-url-label" for="referral-url">アプリのURL</label>
      <div class="referral-url-row">
        <input id="referral-url" class="referral-url-field" type="text" readonly>
        <button class="referral-copy-button" type="button">コピー</button>
      </div>
      <button class="referral-share-button" type="button">リンクを共有</button>
      <p class="referral-status" role="status" aria-live="polite"></p>`;

    dialog.querySelector("#referral-url").value = url;
    dialog.querySelector(".referral-close").addEventListener("click", closeReferral);
    dialog.querySelector(".referral-copy-button").addEventListener("click", () => copyUrl(url, dialog));
    dialog.querySelector(".referral-share-button").addEventListener("click", () => shareUrl(url, dialog));
    overlay.append(dialog);
    document.body.append(overlay);
    document.addEventListener("keydown", onKeyDown);
    dialog.querySelector(".referral-close").focus();

    try {
      const encoder = await waitForEncoder();
      const imageUrl = await encoder.toDataURL(url, {
        errorCorrectionLevel: "M",
        margin: 4,
        width: 420,
        color: { dark: "#171717", light: "#ffffff" },
      });
      if (!overlay) return;
      const frame = dialog.querySelector(".referral-qr-frame");
      const image = document.createElement("img");
      image.className = "referral-qr-image";
      image.alt = "このアプリを紹介するQRコード";
      image.src = imageUrl;
      frame.replaceChildren(image);
    } catch (error) {
      const status = dialog.querySelector(".referral-status");
      if (status) status.textContent = error instanceof Error ? error.message : "QRコードを作成できませんでした。";
    }
  }

  async function copyUrl(url, dialog) {
    const status = dialog.querySelector(".referral-status");
    try {
      await navigator.clipboard.writeText(url);
      status.textContent = "URLをコピーしました。";
    } catch {
      const field = dialog.querySelector("#referral-url");
      field.focus();
      field.select();
      const copied = document.execCommand("copy");
      status.textContent = copied ? "URLをコピーしました。" : "URLを選択してコピーしてください。";
    }
  }

  async function shareUrl(url, dialog) {
    const status = dialog.querySelector(".referral-status");
    if (!navigator.share) {
      await copyUrl(url, dialog);
      status.textContent = "共有メニューが使えないため、URLをコピーしました。";
      return;
    }
    try {
      await navigator.share({ title: appTitle, text: "座標QRコード作成・読み込みアプリです。", url });
      status.textContent = "共有メニューを開きました。";
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      status.textContent = "共有できませんでした。URLをコピーしてお使いください。";
    }
  }

  function closeReferral() {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
    document.removeEventListener("keydown", onKeyDown);
    if (lastFocus instanceof HTMLElement && lastFocus.isConnected) lastFocus.focus({ preventScroll: true });
  }

  function onKeyDown(event) {
    if (event.key === "Escape") closeReferral();
  }

  let attempts = 0;
  const initialize = window.setInterval(() => {
    const root = document.querySelector("#root");
    createBrandLink();
    createEntry();
    if (root && document.querySelector(".referral-entry")) {
      window.clearInterval(initialize);
      entryObserver = new MutationObserver(() => {
        createBrandLink();
        if (!document.querySelector(".referral-entry")) createEntry();
      });
      entryObserver.observe(root, { childList: true, subtree: true });
    }
    else if (++attempts >= 120) window.clearInterval(initialize);
  }, 250);
})();
