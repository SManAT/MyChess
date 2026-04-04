import "@scss/login.scss";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import api from "../utils/axiosApi.js";

import $ from "jquery";
window.$ = $;

$(function () {
  $("#username").trigger("focus");

  // Get all query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get("error");
  // Check if parameter exists
  if (error === "1") {
    $(".alert-danger").removeClass("hidden");
    $(".alert-danger").html(
      `Server <i>${api.defaults.baseURL}</i> is not reachable at the moment!`,
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
    loginData.username = "hans.moser";
    loginData.password = "324234234";

    // Store data that persists even after browser restart
    localStorage.setItem("username", loginData.username);

    // JWT from Server
    try {
      const response = await api.post("/api/login", loginData);
      if (response.data?.authenticated) {
        localStorage.setItem("authToken", response.data.token);
        localStorage.setItem("userId", response.data.userid);
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
