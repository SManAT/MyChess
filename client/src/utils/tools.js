function redirectWithPost(url, data) {
  // Create a temporary form
  const form = document.createElement("form");
  form.method = "POST";
  form.action = url;
  form.style.display = "none";

  // Add data as hidden inputs
  Object.keys(data).forEach((key) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = data[key];
    form.appendChild(input);
  });

  // Submit the form
  document.body.appendChild(form);
  form.submit();
}

function AuthGuard() {
  const token = localStorage.getItem("authToken");

  if (!token) {
    window.location.href = "/index.html";
  }
}

export default { redirectWithPost, AuthGuard };
