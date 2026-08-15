/**
 * Ecliptix — Sort By custom dropdown
 * ----------------------------------
 * Wires the Sort By custom dropdown UI to the hidden native <select> so the
 * existing filtering logic in games.js runs completely unchanged.
 *
 * ALSO guarantees the two filter panels never sit open together:
 * · opening the Sort By panel closes the Genre panel, and
 * · clicking the Genre trigger closes the Sort By panel.
 * (Registered as a second listener on the Genre button — same-target
 * listeners always run regardless of stopPropagation, so games.js is
 * not modified.)
 */
(function () {
  'use strict';

  function setupSortDropdown() {
    const btn = document.getElementById('sortDropdownBtn');
    const list = document.getElementById('sortDropdownList');
    const select = document.getElementById('sortFilter');
    const label = document.getElementById('sortSelectedText');
    const genreList = document.getElementById('genreDropdownList');
    const genreBtn = document.getElementById('genreDropdownBtn');

    if (!btn || !list || !select || !label) return;

    // Close the Genre panel (opened/handled by games.js)
    const closeGenre = () => {
      if (genreList) genreList.style.display = 'none';
    };

    // Toggle dropdown (same style.display approach as the Genre dropdown),
    // always closing the Genre panel first so the two never overlap.
    const toggleSort = () => {
      const isShowing = list.style.display === 'block';
      closeGenre();
      list.style.display = isShowing ? 'none' : 'block';
    };

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSort();
    });

    // Clicking the Genre trigger also closes the Sort By panel, so opening
    // one dropdown never leaves the other one open / overlapping.
    if (genreBtn) {
      genreBtn.addEventListener('click', () => {
        list.style.display = 'none';
      });
    }

    // Close when clicking outside
    document.addEventListener('click', () => {
      list.style.display = 'none';
    });

    // Select an item
    list.addEventListener('click', (e) => {
      if (e.target.classList.contains('dropdown-item')) {
        const value = e.target.dataset.value;
        label.textContent = e.target.textContent;
        select.value = value;

        // Trigger the change event → games.js listener reloads the games
        select.dispatchEvent(new Event('change'));

        list.style.display = 'none';
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupSortDropdown);
  } else {
    setupSortDropdown();
  }
})();