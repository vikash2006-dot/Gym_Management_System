/**
 * TITANFIT Gym Management System - Client Scripts
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Sidebar Navigation Toggle
  const sidebarToggle = document.getElementById('sidebarToggle');
  const appSidebar = document.getElementById('appSidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  if (sidebarToggle && appSidebar && sidebarOverlay) {
    sidebarToggle.addEventListener('click', () => {
      appSidebar.classList.toggle('show');
      sidebarOverlay.classList.toggle('show');
    });

    sidebarOverlay.addEventListener('click', () => {
      appSidebar.classList.remove('show');
      sidebarOverlay.classList.remove('show');
    });
  }

  // 2. Auto-dismiss flash messages after 5 seconds
  const flashSuccess = document.getElementById('flash-alert-success');
  const flashError = document.getElementById('flash-alert-error');

  [flashSuccess, flashError].forEach(alertEl => {
    if (alertEl) {
      setTimeout(() => {
        alertEl.style.transition = 'opacity 0.5s ease';
        alertEl.style.opacity = '0';
        setTimeout(() => alertEl.remove(), 500);
      }, 5000);
    }
  });

  // 3. Dynamic Workout Plan Exercise Rows (Trainer)
  const addExerciseBtn = document.getElementById('addExerciseBtn');
  const exerciseRowsContainer = document.getElementById('exerciseRowsContainer');

  if (addExerciseBtn && exerciseRowsContainer) {
    addExerciseBtn.addEventListener('click', () => {
      const row = document.createElement('div');
      row.className = 'exercise-row';
      row.innerHTML = `
        <div class="form-group" style="margin-bottom: 0;">
          <input type="text" name="exercise" class="form-control" placeholder="Exercise Name (e.g. Bench Press)" required>
        </div>
        <div class="form-group" style="margin-bottom: 0;">
          <input type="number" name="sets" class="form-control" placeholder="Sets" min="1" value="3" required>
        </div>
        <div class="form-group" style="margin-bottom: 0;">
          <input type="number" name="reps" class="form-control" placeholder="Reps" min="1" value="10" required>
        </div>
        <div class="form-group" style="margin-bottom: 0;">
          <select name="dayOfWeek" class="form-control" required>
            <option value="Monday">Monday</option>
            <option value="Tuesday">Tuesday</option>
            <option value="Wednesday">Wednesday</option>
            <option value="Thursday">Thursday</option>
            <option value="Friday">Friday</option>
            <option value="Saturday">Saturday</option>
            <option value="Sunday">Sunday</option>
          </select>
        </div>
        <button type="button" class="btn-remove-row" title="Remove Exercise">
          <i class="fa-solid fa-trash"></i>
        </button>
      `;

      // Attach remove handler
      row.querySelector('.btn-remove-row').addEventListener('click', () => {
        row.remove();
      });

      exerciseRowsContainer.appendChild(row);
    });

    // Attach remove handlers to initial rows
    exerciseRowsContainer.querySelectorAll('.btn-remove-row').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const row = e.target.closest('.exercise-row');
        if (row && exerciseRowsContainer.querySelectorAll('.exercise-row').length > 1) {
          row.remove();
        } else {
          alert('A workout plan must contain at least one exercise row.');
        }
      });
    });
  }
});
