export function isMobile() {
    let mobileFlag = false;
    // // 根据浏览器头判断是否移动端
    // if (/Android|iPhone|SymbianOS|Windows Phone|iPad|iPod/.test(navigator.userAgent)) {
    //     mobileFlag = true;
    // }
    // const screenWidth = window.screen.width;
    // const screenHeight = window.screen.height;
    // // 根据屏幕分辨率判断是否是手机
    // if (screenWidth < 500 && screenHeight < 800) {
    //     mobileFlag = true;
    // }
    if (typeof window !== "undefined" && "ontouchstart" in window) {
        mobileFlag = true;
    }
    return mobileFlag;
}
