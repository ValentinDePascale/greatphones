// ========== ADMIN UI COMPONENTS ==========

// Modal Icons
var modalIcons = {
  info: '<span class="material-symbols-outlined">info</span>',
  success: '<span class="material-symbols-outlined">check_circle</span>',
  warning: '<span class="material-symbols-outlined">warning</span>',
  error: '<span class="material-symbols-outlined">error</span>',
  confirm: '<span class="material-symbols-outlined">help</span>'
};

// Toast Icons
var toastIcons = {
  info: '<span class="material-symbols-outlined">info</span>',
  success: '<span class="material-symbols-outlined">check_circle</span>',
  warning: '<span class="material-symbols-outlined">warning</span>',
  error: '<span class="material-symbols-outlined">error</span>'
};

/**
 * Show a modal dialog
 * @param {Object} options - Modal options
 * @param {string} options.title - Modal title
 * @param {string} options.message - Modal message
 * @param {string} options.type - Modal type: 'info', 'success', 'warning', 'error', 'confirm'
 * @param {string} options.confirmText - Text for confirm button (default: 'Confirmar')
 * @param {string} options.cancelText - Text for cancel button (default: 'Cancelar')
 * @param {boolean} options.showCancel - Show cancel button (default: true)
 * @param {string} options.confirmClass - CSS class for confirm button: 'primary', 'danger' (default: 'primary')
 * @returns {Promise<boolean>} - Resolves true if confirmed, false if cancelled
 */
function showModal(options) {
  return new Promise(function(resolve) {
    var overlay = document.getElementById('adminModalOverlay');
    var iconEl = document.getElementById('adminModalIcon');
    var titleEl = document.getElementById('adminModalTitle');
    var messageEl = document.getElementById('adminModalMessage');
    var actionsEl = document.getElementById('adminModalActions');
    
    if (!overlay) {
      resolve(false);
      return;
    }
    
    var type = options.type || 'info';
    var confirmText = options.confirmText || 'Confirmar';
    var cancelText = options.cancelText || 'Cancelar';
    var showCancel = options.showCancel !== false;
    var confirmClass = options.confirmClass || 'primary';
    
    iconEl.className = 'admin-modal-icon ' + type;
    iconEl.innerHTML = modalIcons[type] || modalIcons.info;
    titleEl.textContent = options.title || '';
    messageEl.textContent = options.message || '';
    
    var actionsHTML = '';
    if (showCancel) {
      actionsHTML += '<button class="admin-modal-btn" id="modalCancelBtn">' + cancelText + '</button>';
    }
    actionsHTML += '<button class="admin-modal-btn admin-modal-btn-' + confirmClass + '" id="modalConfirmBtn">' + confirmText + '</button>';
    actionsEl.innerHTML = actionsHTML;
    
    var confirmBtn = document.getElementById('modalConfirmBtn');
    var cancelBtn = document.getElementById('modalCancelBtn');
    
    function cleanup() {
      overlay.classList.remove('active');
      if (confirmBtn) confirmBtn.onclick = null;
      if (cancelBtn) cancelBtn.onclick = null;
      overlay.onclick = null;
    }
    
    if (confirmBtn) {
      confirmBtn.onclick = function() {
        cleanup();
        resolve(true);
      };
    }
    
    if (cancelBtn) {
      cancelBtn.onclick = function() {
        cleanup();
        resolve(false);
      };
    }
    
    overlay.onclick = function(e) {
      if (e.target === overlay) {
        cleanup();
        resolve(false);
      }
    };
    
    overlay.classList.add('active');
    
    if (confirmBtn) confirmBtn.focus();
  });
}

/**
 * Show an alert modal (OK button only)
 * @param {string} title - Alert title
 * @param {string} message - Alert message
 * @param {string} type - Alert type: 'info', 'success', 'warning', 'error'
 * @returns {Promise<void>}
 */
function showAlert(title, message, type) {
  return showModal({
    title: title,
    message: message,
    type: type || 'info',
    showCancel: false,
    confirmText: 'Aceptar'
  });
}

/**
 * Show a confirmation modal
 * @param {string} title - Confirmation title
 * @param {string} message - Confirmation message
 * @param {Object} options - Additional options
 * @returns {Promise<boolean>}
 */
function showConfirm(title, message, options) {
  options = options || {};
  return showModal({
    title: title,
    message: message,
    type: options.type || 'confirm',
    confirmText: options.confirmText || 'Confirmar',
    cancelText: options.cancelText || 'Cancelar',
    confirmClass: options.confirmClass || 'primary'
  });
}

/**
 * Show a toast notification
 * @param {Object} options - Toast options
 * @param {string} options.title - Toast title
 * @param {string} options.message - Toast message
 * @param {string} options.type - Toast type: 'info', 'success', 'warning', 'error'
 * @param {number} options.duration - Duration in ms (default: 4000)
 * @param {boolean} options.showProgress - Show progress bar (default: true)
 */
function showToast(options) {
  var container = document.getElementById('adminToastContainer');
  if (!container) return;
  
  var type = options.type || 'info';
  var duration = options.duration || 4000;
  var showProgress = options.showProgress !== false;
  
  var toast = document.createElement('div');
  toast.className = 'admin-toast';
  
  var iconHTML = '<div class="admin-toast-icon ' + type + '">' + (toastIcons[type] || toastIcons.info) + '</div>';
  var contentHTML = '<div class="admin-toast-content">';
  if (options.title) {
    contentHTML += '<div class="admin-toast-title">' + options.title + '</div>';
  }
  if (options.message) {
    contentHTML += '<div class="admin-toast-message">' + options.message + '</div>';
  }
  contentHTML += '</div>';
  var closeHTML = '<button class="admin-toast-close" onclick="this.parentElement.remove()">&times;</button>';
  var progressHTML = showProgress ? '<div class="admin-toast-progress" style="animation-duration:' + duration + 'ms"></div>' : '';
  
  toast.innerHTML = iconHTML + contentHTML + closeHTML + progressHTML;
  container.appendChild(toast);
  
  setTimeout(function() {
    toast.classList.add('show');
  }, 10);
  
  setTimeout(function() {
    toast.classList.remove('show');
    setTimeout(function() {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 300);
  }, duration);
}

/**
 * Show a success toast
 * @param {string} title - Toast title
 * @param {string} message - Toast message
 */
function showSuccessToast(title, message) {
  showToast({ title: title, message: message, type: 'success' });
}

/**
 * Show an error toast
 * @param {string} title - Toast title
 * @param {string} message - Toast message
 */
function showErrorToast(title, message) {
  showToast({ title: title, message: message, type: 'error' });
}

/**
 * Show a warning toast
 * @param {string} title - Toast title
 * @param {string} message - Toast message
 */
function showWarningToast(title, message) {
  showToast({ title: title, message: message, type: 'warning' });
}

/**
 * Show an info toast
 * @param {string} title - Toast title
 * @param {string} message - Toast message
 */
function showInfoToast(title, message) {
  showToast({ title: title, message: message, type: 'info' });
}
