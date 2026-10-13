const form = document.querySelector('#signupForm');
const toast = document.querySelector('#toast');
const submitBtn = document.querySelector('#submitBtn');
let toastTimer;
let mode = 'signup';

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}
function setError(input, message) {
  const field = input.closest('.field');
  field.classList.toggle('invalid', Boolean(message));
  field.querySelector('.error').textContent = message || '';
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
}
function validateField(input) {
  const value = input.value.trim();
  let message = '';
  if (input.required && !value) message = 'This field is required.';
  else if (input.id === 'fullName' && value.length < 2) message = 'Please enter your full name.';
  else if (input.id === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) message = 'Enter a valid email address.';
  else if (input.id === 'phone' && !/^[+\d][\d\s().-]{7,17}$/.test(value)) message = 'Enter a valid phone number.';
  else if (input.id === 'password' && value.length < 8) message = 'Use at least 8 characters.';
  else if (input.id === 'confirmPassword' && value !== document.querySelector('#password').value) message = 'Passwords do not match.';
  setError(input, message);
  return !message;
}

form.querySelectorAll('input:not([type="checkbox"])').forEach(input => {
  input.addEventListener('blur', () => validateField(input));
  input.addEventListener('input', () => {
    if (input.closest('.field').classList.contains('invalid')) validateField(input);
    if (input.id === 'password' && document.querySelector('#confirmPassword').value) validateField(document.querySelector('#confirmPassword'));
  });
});

document.querySelectorAll('.visibility-toggle').forEach(button => {
  button.addEventListener('click', () => {
    const input = document.getElementById(button.dataset.target);
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    button.setAttribute('aria-label', `${show ? 'Hide' : 'Show'} ${button.dataset.target === 'password' ? 'password' : 'confirm password'}`);
  });
});

form.addEventListener('submit', event => {
  event.preventDefault();
  const fields = [...form.querySelectorAll('input:not([type="checkbox"])')];
  if (mode === 'login') {
    const email = document.querySelector('#email');
    const password = document.querySelector('#password');
    const valid = validateField(email) & validateField(password);
    if (!valid) return;
    showToast('Demo sign-in: connect your authentication service to log in.');
    return;
  }
  const validFields = fields.map(validateField).every(Boolean);
  const terms = document.querySelector('#terms');
  document.querySelector('#termsError').textContent = terms.checked ? '' : 'Please accept the terms to continue.';
  if (!validFields || !terms.checked) {
    if (!terms.checked) terms.focus();
    const firstInvalid = form.querySelector('.field.invalid input');
    if (firstInvalid) firstInvalid.focus();
    return;
  }
  // Frontend demo only: no account is created until a backend/auth provider is connected.
  const userName = document.querySelector('#fullName').value.trim().split(/\s+/)[0];
  showToast(`Thanks, ${userName}! Your form is valid. Connect a backend to create your account.`);
  submitBtn.querySelector('span').textContent = 'Account Details Validated ✓';
  setTimeout(() => { if (mode === 'signup') submitBtn.querySelector('span').textContent = 'Create Account'; }, 2500);
});

document.querySelector('#terms').addEventListener('change', () => {
  if (document.querySelector('#terms').checked) document.querySelector('#termsError').textContent = '';
});

function fieldsClear() {
  form.querySelectorAll('.field').forEach(field => { field.classList.remove('invalid'); field.querySelector('.error').textContent = ''; });
}
function toggleMode() {
  mode = mode === 'signup' ? 'login' : 'signup';
  const nameField = document.querySelector('#nameField');
  const phoneField = document.querySelector('#phoneField');
  const confirmField = document.querySelector('#confirmField');
  [nameField, phoneField, confirmField].forEach(el => el.hidden = mode === 'login');
  document.querySelector('.terms-row').hidden = mode === 'login';
  document.querySelector('#formTitle').textContent = mode === 'login' ? 'Welcome Back' : 'Create Your Account';
  document.querySelector('#formSubtitle').textContent = mode === 'login' ? 'Log in to continue your TrackB journey.' : 'Join TrackB and start your smart travel journey today.';
  document.querySelector('.separator p').textContent = mode === 'login' ? 'or log in with' : 'or sign up with';
  submitBtn.querySelector('span').textContent = mode === 'login' ? 'Log In' : 'Create Account';
  document.querySelector('#loginPrompt').innerHTML = mode === 'login' ? 'New to TrackB? <button type="button" id="loginLink">Create account</button>' : 'Already have an account? <button type="button" id="loginLink">Log in</button>';
  document.querySelector('#termsError').textContent = '';
  document.querySelector('#password').autocomplete = mode === 'login' ? 'current-password' : 'new-password';
  fieldsClear();
}
document.querySelector('#loginPrompt').addEventListener('click', event => {
  if (event.target.closest('#loginLink')) toggleMode();
});

// Social login buttons are functional demo actions; wire these to OAuth for production.
document.querySelectorAll('[data-provider]').forEach(button => button.addEventListener('click', () => {
  showToast(`${button.dataset.provider} sign-in selected. Connect OAuth credentials to enable it.`);
}));
document.querySelectorAll('[data-info]').forEach(link => link.addEventListener('click', event => {
  event.preventDefault();
  showToast(`${link.dataset.info}: add your policy page URL before publishing.`);
}));
// Brand and "Back to Home" are normal links to ../index.html (the SmartBus home page).

// Open directly in Log in view when arriving from the home page's Login button (?mode=login).
if (new URLSearchParams(window.location.search).get('mode') === 'login') toggleMode();
