"use strict";

(function () {
    const vscode = acquireVsCodeApi();

    // installPackage
    function installPackage() {
        const packageInput = document.getElementById("packageInput");
        if (!packageInput.value || packageInput.value.trim() === "") {
            return;
        }

        vscode.postMessage({
            command: "installPackage",
            data: packageInput.value,
        });
        // clear input
        packageInput.value = "";
    }

    window.addEventListener("message", (event) => {
        const message = event.data;
        if (message.command === "packageInstalled") {
            const newListItem = document.createElement("li");
            newListItem.textContent = message.data;
            const installedPackagesList = document.getElementById("installedPackagesList");
            installedPackagesList.appendChild(newListItem);
        }
    });

    //installButton
    const installButton = document.getElementById("installButton");
    installButton.addEventListener("click", installPackage);
}());
