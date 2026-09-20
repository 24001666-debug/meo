document.addEventListener('DOMContentLoaded', () => {
  const promptBox = document.querySelector('.prompt-box');
  const spinSlider = document.getElementById('spinSpeed');
  const gifToggle = document.getElementById('gifToggle');
  const bgSpin = document.querySelector('.bg-spin');
  const promptInput = document.getElementById('promptInput');
  const sendButton = document.getElementById('sortButton');
  const chatDropdown = document.getElementById('chatDropdown');

  const queue = [];
  const resultHistory = [];
  let nextQueueId = 1;
  let lastShownImage = null;
  let lastResult = null;

  const stockImages = ['StockImage1.jpg', 'StockImage2.jpeg'];
  let generationInProgress = false;

  const switchToStockImage2 = () => {
    const newestResult = resultHistory[resultHistory.length - 1] || lastResult;
    if (!newestResult) return;

    newestResult.image = 'StockImage2.jpeg';
    lastShownImage = 'StockImage2.jpeg';
    lastResult = newestResult;
    renderQueue();
  };

  const triggerRandomImageSwap = () => {
    const randomDelay = Math.floor(Math.random() * 10) + 1;
    setTimeout(() => {
      switchToStockImage2();
    }, randomDelay * 1000);
  };

  const updateInputState = () => {
    if (!promptInput || !sendButton) return;

    const isDisabled = generationInProgress || queue.length > 0;
    promptInput.disabled = isDisabled;
    sendButton.disabled = isDisabled;
    sendButton.style.opacity = isDisabled ? '0.6' : '1';
    sendButton.style.cursor = isDisabled ? 'not-allowed' : 'pointer';
  };

  const renderQueue = () => {
    if (!chatDropdown) return;

    if (!queue.length && !resultHistory.length && !lastResult) {
      chatDropdown.classList.remove('is-visible');
      chatDropdown.innerHTML = '';
      return;
    }

    const visibleItems = [...resultHistory, ...queue];

    chatDropdown.classList.add('is-visible');
    chatDropdown.innerHTML = visibleItems
      .map((item, index) => {
        const isActive = index === 0;
        const isReady = item.status === 'ready';
        const statusLabel = isReady
          ? 'Ready'
          : item.status === 'generating'
            ? 'Generating'
            : 'Queued';

        if (isReady) {
          return `
            <div class="queue-item ${isActive ? 'active' : ''} ready-item">
              <div class="queue-header">
                <span class="queue-label">${item.label}</span>
                <span class="queue-status">${statusLabel}</span>
              </div>
              <div class="image-message">
                <img src="${item.image}" alt="Generated stock image" />
              </div>
            </div>
          `;
        }

        return `
          <div class="queue-item ${isActive ? 'active' : ''}">
            <div class="queue-header">
              <span class="queue-label">${item.label}</span>
              <span class="queue-status">${statusLabel}</span>
            </div>
            <div class="queue-time">
              <span class="time-label">Status</span>
              <span class="time-value spin-gif" aria-label="${statusLabel}"></span>
            </div>
          </div>
        `;
      })
      .join('');
  };

  const simulateGeneration = (itemId) => {
    const item = queue.find((entry) => entry.id === itemId);
    if (!item) return;

    item.status = 'generating';
    item.elapsedSeconds = 0;
    generationInProgress = true;
    updateInputState();
    renderQueue();

    const timer = setInterval(() => {
      const current = queue.find((entry) => entry.id === itemId);
      if (!current) {
        clearInterval(timer);
        return;
      }

      current.elapsedSeconds += 1;

      if (current.elapsedSeconds >= 8) {
        current.status = 'ready';

        let nextImage = stockImages[Math.floor(Math.random() * stockImages.length)];
        while (nextImage === lastShownImage && stockImages.length > 1) {
          nextImage = stockImages[Math.floor(Math.random() * stockImages.length)];
        }

        current.image = nextImage;
        lastShownImage = nextImage;

        if (lastResult && lastResult.image !== nextImage) {
          console.log('Stock image changed:', nextImage);
        }

        renderQueue();
        clearInterval(timer);

        lastResult = {
          id: current.id,
          label: current.label,
          status: 'ready',
          image: current.image,
        };
        resultHistory.push(lastResult);

        generationInProgress = false;
        queue.shift();
        updateInputState();
        renderQueue();
      } else {
        renderQueue();
      }
    }, 1000);
  };

  const submitInput = () => {
    if (!promptInput || !chatDropdown) return;
    if (generationInProgress || queue.length > 0) return;

    const value = promptInput.value.trim();
    if (!value) {
      renderQueue();
      return;
    }

    const item = {
      id: nextQueueId++,
      label: value,
      status: 'queued',
      progress: 0,
    };

    queue.push(item);

    renderQueue();
    promptInput.value = '';
    updateInputState();

    triggerRandomImageSwap();
    setTimeout(() => simulateGeneration(item.id), 200);
  };

  if (promptBox) {
    promptBox.addEventListener('click', () => {
      promptBox.style.outline = '1px solid rgba(128, 171, 255, 0.6)';
      promptBox.style.boxShadow = '0 0 0 3px rgba(69, 122, 255, 0.2), 0 12px 38px rgba(0, 0, 0, 0.2)';
    });
  }

  if (spinSlider) {
    spinSlider.addEventListener('input', (event) => {
      const speed = Number(event.target.value);
      const duration = (0.6 / speed).toFixed(2) + 's';
      document.documentElement.style.setProperty('--spin-duration', duration);
    });
  }

  const initialSpeed = Number(spinSlider?.value || 2);
  const initialDuration = (0.6 / initialSpeed).toFixed(2) + 's';
  document.documentElement.style.setProperty('--spin-duration', initialDuration);

  if (gifToggle && bgSpin) {
    bgSpin.style.display = gifToggle.checked ? 'block' : 'none';

    gifToggle.addEventListener('change', () => {
      bgSpin.style.display = gifToggle.checked ? 'block' : 'none';
    });
  }

  if (promptInput) {
    promptInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        submitInput();
      }
    });
  }

  if (sendButton) {
    sendButton.addEventListener('click', submitInput);
  }
});