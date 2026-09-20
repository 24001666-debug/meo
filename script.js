document.addEventListener('DOMContentLoaded', () => {
  const promptBox = document.querySelector('.prompt-box');
  const spinSlider = document.getElementById('spinSpeed');
  const gifToggle = document.getElementById('gifToggle');
  const bgSpin = document.querySelector('.bg-spin');
  const promptInput = document.getElementById('promptInput');
  const sortButton = document.getElementById('sortButton');
  const sortedResult = document.getElementById('sortedResult');

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

  const sortText = () => {
    if (!promptInput || !sortedResult) return;

    const value = promptInput.value.trim();
    if (!value) {
      sortedResult.textContent = '';
      return;
    }

    const sorted = value
      .split(/\s+/)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
      .join(' ');

    sortedResult.textContent = sorted;
  };

  if (promptInput) {
    promptInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        sortText();
      }
    });
  }

  if (sortButton) {
    sortButton.addEventListener('click', sortText);
  }
});