document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("loginForm").addEventListener("submit", async function (e) {
        e.preventDefault();

        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        try {
            const response = await fetch('http://127.0.0.1:3000/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const result = await response.json();

            if (result.success) {
                window.location.href = "/otobus.html";
            } else {
                alert(result.message || "Kullanıcı adı veya şifre hatalı!");
            }
        } catch (error) {
            console.error("Hata oluştu:", error);
            alert("Bir hata oluştu, lütfen daha sonra tekrar deneyin.");
        }
    });
});
