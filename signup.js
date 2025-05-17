async function signUp(event) {
  event.preventDefault();

  const username = document.querySelector('input[name="username"]').value.trim();
  const email = document.querySelector('input[name="email"]').value.trim();
  const password = document.querySelector('input[name="password"]').value;
  const confirmPassword = document.querySelector('input[name="confirm-password"]').value;

  if (!username || !email || !password || !confirmPassword) {
    alert("All fields are required.");
    return;
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match.");
    return;
  }

  try {
    const response = await fetch('/api/signup', {  // your backend signup endpoint
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    const data = await response.json();

    if (response.ok) {
      alert("Account created successfully!");
      window.location.href = "Main Menu.html";  // or wherever you want
    } else {
      alert("Error: " + (data.message || "Signup failed"));
    }
  } catch (error) {
    alert("Error: " + error.message);
  }
}
