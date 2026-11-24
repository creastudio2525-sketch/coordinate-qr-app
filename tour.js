(() => {
  "use strict";

  if (window.__coordinateQrTourLoaded) return;
  window.__coordinateQrTourLoaded = true;

  const steps = [
    {
      target: ".mode-tabs",
      title: "作成と読み込みを切り替え",
      text: "上のタブから、QRコードの作成と読み込みを切り替えます。読み込みではカメラや画像を使えます。",
    },
    {
      target: "#point-name",
      title: "点名を入力",
      text: "QRコードに記録する点名を入力します。例のように日本語や数字も使えます。",
    },
    {
      target: ".coordinate-fields",
      title: "X・Y・Z座標を入力",
      text: "3つの座標を入力します。マイナス値と小数に対応し、スマートフォンでは専用テンキーを使えます。",
    },
    {
      target: ".coordinate-settings",
      title: "座標系と測地系を選択",
      text: "現場に合わせて系番号と測地系を選びます。「GNSSから系番号を推定」も利用できます。",
    },
    {
      target: ".create-card .primary-button",
      title: "QRコードを作成",
      text: "入力後に押すと、QRコードと記録内容が表示されます。作成後は地図、メール・LINE共有、履歴も利用できます。",
    },
    {
      target: ".qr-result",
      title: "QRコードと内容を確認",
      text: "QRコードと点名・XYZの内容を確認できます。画面の内容を見ながら読み取りや共有ができます。",
    },
    {
      target: ".coordinate-map-panel",
      title: "地図と現在地",
      text: "作成結果の地図はOpenStreetMapを表示します。「自己位置を表示する」をオンにすると、許可後に現在地へ移動してピンを表示します。",
    },
    {
      target: ".share-actions",
      title: "メール・LINEで共有",
      text: "メールは端末のメールアプリへ、LINEはLINEへ引き継いで送れます。",
    },
    {
      target: ".history-card",
      title: "この画面を閉じるまで履歴を保持",
      text: "作成・読み込みしたQRコードは履歴に残ります。項目を選ぶと内容をもう一度表示できます。",
    },
    {
      target: ".mode-tabs button:nth-of-type(2)",
      title: "QRコードを読み込む",
      text: "読み込みタブでカメラを起動するか、画像を選んでQRコードを読み取ります。",
    },
  ];

  let launcher;
  let backdrop;
  let panel;
  let currentSteps = [];
  let activeIndex = 0;
  let previousFocus = null;
  let activeTarget = null;

  function visible(element) {
    if (!element) return false;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
  }

  function createLauncher() {
    if (document.querySelector(".tour-launcher")) return;
    launcher = document.createElement("button");
    launcher.type = "button";
    launcher.className = "tour-launcher";
    launcher.textContent = "使い方";
    launcher.setAttribute("aria-label", "画面ツアーを開始");
    launcher.addEventListener("click", startTour);
    document.body.append(launcher);
  }

  function startTour() {
    currentSteps = steps.filter((step) => visible(document.querySelector(step.target)));
    if (!currentSteps.length) return;

    previousFocus = document.activeElement;
    activeIndex = 0;
    backdrop = document.createElement("button");
    backdrop.type = "button";
    backdrop.className = "tour-scrim";
    backdrop.setAttribute("aria-label", "画面ツアーを終了");
    backdrop.addEventListener("click", closeTour);

    panel = document.createElement("section");
    panel.className = "tour-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-labelledby", "tour-title");
    panel.innerHTML = `
      <div class="tour-panel-header">
        <h2 id="tour-title" tabindex="-1"></h2>
        <span class="tour-counter" aria-live="polite"></span>
      </div>
      <p class="tour-description"></p>
      <div class="tour-panel-actions">
        <button class="tour-close" type="button">終了</button>
        <button class="tour-previous" type="button">前へ</button>
        <button class="tour-next" type="button">次へ</button>
      </div>`;

    panel.querySelector(".tour-close").addEventListener("click", closeTour);
    panel.querySelector(".tour-previous").addEventListener("click", () => showStep(activeIndex - 1));
    panel.querySelector(".tour-next").addEventListener("click", () => {
      if (activeIndex >= currentSteps.length - 1) closeTour();
      else showStep(activeIndex + 1);
    });
    document.body.append(backdrop, panel);
    document.addEventListener("keydown", onKeyDown);
    showStep(0);
  }

  function showStep(index) {
    if (activeTarget) activeTarget.classList.remove("tour-highlight");
    activeIndex = index;
    const step = currentSteps[activeIndex];
    activeTarget = document.querySelector(step.target);
    if (!visible(activeTarget)) {
      if (activeIndex < currentSteps.length - 1) showStep(activeIndex + 1);
      else closeTour();
      return;
    }

    activeTarget.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center", inline: "nearest" });
    activeTarget.classList.add("tour-highlight");
    panel.querySelector("#tour-title").textContent = step.title;
    panel.querySelector(".tour-description").textContent = step.text;
    panel.querySelector(".tour-counter").textContent = `${activeIndex + 1} / ${currentSteps.length}`;
    panel.querySelector(".tour-previous").disabled = activeIndex === 0;
    panel.querySelector(".tour-next").textContent = activeIndex === currentSteps.length - 1 ? "完了" : "次へ";
    panel.querySelector("#tour-title").focus({ preventScroll: true });
  }

  function closeTour() {
    if (activeTarget) activeTarget.classList.remove("tour-highlight");
    activeTarget = null;
    backdrop?.remove();
    panel?.remove();
    backdrop = null;
    panel = null;
    document.removeEventListener("keydown", onKeyDown);
    if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
  }

  function onKeyDown(event) {
    if (event.key === "Escape") closeTour();
    else if (event.key === "ArrowRight" && activeIndex < currentSteps.length - 1) showStep(activeIndex + 1);
    else if (event.key === "ArrowLeft" && activeIndex > 0) showStep(activeIndex - 1);
  }

  let attempts = 0;
  const initialize = window.setInterval(() => {
    if (document.querySelector(".qr-header")) {
      window.clearInterval(initialize);
      createLauncher();
    } else if (++attempts >= 120) {
      window.clearInterval(initialize);
    }
  }, 250);
})();
