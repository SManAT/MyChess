import "@scss/login.scss";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import $ from "jquery";
import axios from "axios";
window.$ = $;
window.axios = axios;

$(function () {
  // axios define Server URL
  axios.defaults.baseURL =
    "http://" +
    import.meta.env.VITE_SERVER_URL +
    ":" +
    import.meta.env.VITE_SERVER_PORT;

  $("#username").trigger("focus");

  // Get all query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get("error");
  // Check if parameter exists
  if (error === "1") {
    $(".alert-danger").removeClass("hidden");
    $(".alert-danger").html(
      `Server <i>${axios.defaults.baseURL}</i> is not reachable at the moment!`,
    );
  }

  $("#login_form").on("submit", async function (e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    let loginData = {
      username: formData.get("username"),
      password: formData.get("password"),
    };

    //Debug
    loginData.username = "Hans";
    loginData.password = "Moser";

    // Store data that persists even after browser restart
    localStorage.setItem("username", loginData.username);

    // JWT from Server
    try {
      const response = await axios.post("/login", loginData);
      if (response.data?.authenticated) {
        localStorage.setItem("authToken", response.data.token);
        window.location.href = "/lobby.html";
        return;
      }
    } catch (error) {
      if (
        error.code === "ENOTFOUND" ||
        error.code === "ECONNREFUSED" ||
        !error.response
      ) {
        console.error("Server is unreachable");
        window.location.href = "/index.html?error=1";
      }
    }
  });
});
