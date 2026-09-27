document.addEventListener('DOMContentLoaded', () => {
  const promptBox = document.querySelector('.prompt-box');
  const spinSlider = document.getElementById('spinSpeed');
  const gifToggle = document.getElementById('gifToggle');
  const bgSpin = document.querySelector('.bg-spin');
  const promptInput = document.getElementById('promptInput');
  const stepsInput = document.getElementById('stepsInput');
  const sendButton = document.getElementById('sortButton');
  const chatDropdown = document.getElementById('chatDropdown');

  const queue = [];
  const resultHistory = [];
  let nextQueueId = 1;
  let lastResult = null;

  let generationInProgress = false;

  const updateInputState = () => {
    if (!promptInput || !sendButton) return;

    const isDisabled = generationInProgress || queue.length > 0;
    promptInput.disabled = isDisabled;
    if (stepsInput) stepsInput.disabled = isDisabled;
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
          : item.status === 'error'
            ? 'Error'
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
              <div class="queue-time">
                <span class="time-label">Generation time</span>
                <span class="time-value">${Number(item.elapsedSeconds || 0).toFixed(1)}s</span>
              </div>
              <div class="image-message">
                <img src="${item.image}" alt="Generated diffusion model output" />
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
              <span class="time-value ${item.status === 'error' ? '' : 'spin-gif'}" aria-label="${statusLabel}">${item.error || ''}</span>
            </div>
          </div>
        `;
      })
      .join('');
  };

  const generateImage = async (itemId) => {
    const item = queue.find((entry) => entry.id === itemId);
    if (!item) return;

    item.status = 'generating';
    generationInProgress = true;
    updateInputState();
    renderQueue();

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: item.label, steps: item.steps }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Image generation failed.');

      item.status = 'ready';
      item.image = result.image;
      item.elapsedSeconds = result.elapsed_seconds;
      item.seed = result.seed;
      lastResult = { ...item };
      resultHistory.push(lastResult);
    } catch (error) {
      item.status = 'error';
      item.error = error.message;
    }
    generationInProgress = false;
    queue.shift();
    updateInputState();
    renderQueue();
  };
  const submitInput = () => {
    if (!promptInput || !chatDropdown) return;
    if (generationInProgress || queue.length > 0) return;

    const value = promptInput.value.trim();
    if (!value) {
      renderQueue();
      return;
    }

    const steps = Number.parseInt(stepsInput?.value || '3', 10);
    if (!Number.isInteger(steps) || steps < 1 || steps > 100) {
      if (stepsInput) stepsInput.focus();
      return;
    }

    const item = {
      id: nextQueueId++,
      label: value,
      steps,
      status: 'queued',
      progress: 0,
    };

    queue.push(item);

    renderQueue();
    promptInput.value = '';
    updateInputState();

    generateImage(item.id);
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
