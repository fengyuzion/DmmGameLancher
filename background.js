"use strict";

//设置 icon 的 tip
var manifest = chrome.runtime.getManifest();
chrome.browserAction.setTitle({
    "title": manifest.name + "\n" + manifest.description
});

//当以最后关闭由此扩展 create 的 window 来关闭浏览器时
//chrome.windows.onRemoved 不会被触发
//所以存储在 localStorage 中的数据不会被删除
//再次启动浏览器时 , 需要删除不存在的窗口
var deleteStoredGameWindow = game => {
    var windowInfo = DmmGameHandler.getWindow(game);
    if (windowInfo) {
        chrome.windows.get(windowInfo.id, window => {
            if (!window) {
                DmmGameHandler.removeWindow(game);
                console.log("↑删除不存在的window , 而不是由于 chrome.windows.onRemoved");
                console.log("↓error不用管");
            }
        });
    }
};
dmmGameArray.forEach(deleteStoredGameWindow);

//窗口被移除时
chrome.windows.onRemoved.addListener(function(windowId) {
    for (var game of dmmGameArray) {
        var window = DmmGameHandler.getWindow(game);
        if (window && window.id == windowId) {
            DmmGameHandler.removeWindow(game);
            break;
        }
    }
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    switch (request.type) {
        case "window_create":
            DmmGameHandler.createGameWindow(request.game);
            break;
        case "window_focus":
            DmmGameHandler.focusWindow(request.game);
            break;
        case "screenShot":
            DmmGameHandler.screenShot(request.game);
            break;
        case "toggleSound":
            DmmGameHandler.toggleSound(request.game);
            break;
    }
});

chrome.webNavigation.onDOMContentLoaded.addListener(function(details) {
    for (var game of dmmGameArray) {
        var window = DmmGameHandler.getWindow(game);
        if (window && window.tabId == details.tabId) {
            chrome.tabs.executeScript(details.tabId, {
                "code": `
                //rename window
                document.title = "${game.name}";

                //fit game area to window
                function fitGameAreaToWindow(){
                    document.body.style.overflow = "hidden";
                    var game_frame = document.getElementById("game_frame");
                    if (game_frame) {
                        game_frame.style.zIndex = 99;
                        game_frame.style.position = "fixed";
                        game_frame.style.top = -${game.bound.top_delta} + "px";

                        var game_frame_width = Math.round(game_frame.getBoundingClientRect().width);
                        game_frame.style.left = -(game_frame_width - ${game.bound.width - 2 * game.bound.left_delta})/2  + "px";
                    }
                }
                fitGameAreaToWindow();
                `
            });
            break;
        }
    }
});
