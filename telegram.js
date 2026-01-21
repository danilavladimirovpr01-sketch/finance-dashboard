/**
 * Интеграция с Telegram Web App SDK
 */
let tg = null;
let isTelegram = false;
function initTelegram() {
    if (window.Telegram && window.Telegram.WebApp) {
        tg = window.Telegram.WebApp;
        isTelegram = true;
        tg.ready();
        tg.expand();
        applyTelegramTheme();
        tg.onEvent('themeChanged', applyTelegramTheme);
        setupMainButton();
        return true;
    } else {
        isTelegram = false;
        return false;
    }
}
function applyTelegramTheme() {
    if (!isTelegram) return;
    const colors = tg.themeParams;
    document.documentElement.style.setProperty('--tg-theme-bg-color', colors.bg_color || '#ffffff');
    document.documentElement.style.setProperty('--tg-theme-text-color', colors.text_color || '#000000');
    document.documentElement.style.setProperty('--tg-theme-hint-color', colors.hint_color || '#999999');
    document.documentElement.style.setProperty('--tg-theme-link-color', colors.link_color || '#2481cc');
    document.documentElement.style.setProperty('--tg-theme-button-color', colors.button_color || '#2481cc');
    document.documentElement.style.setProperty('--tg-theme-button-text-color', colors.button_text_color || '#ffffff');
    document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', colors.secondary_bg_color || '#f1f1f1');
    document.body.classList.toggle('tg-dark', tg.colorScheme === 'dark');
    document.body.classList.toggle('tg-light', tg.colorScheme === 'light');
}
function setupMainButton() { if (!isTelegram) return; }
function getTelegramUser() { return (isTelegram && tg.initDataUnsafe && tg.initDataUnsafe.user) ? tg.initDataUnsafe.user : null; }
function sendDataToBot(data) { if (isTelegram) tg.sendData(JSON.stringify(data)); }
function closeApp() { if (isTelegram) tg.close(); }
function showAlert(message, callback) { isTelegram ? tg.showAlert(message, callback) : (alert(message), callback && callback()); }
function showConfirm(message, callback) { isTelegram ? tg.showConfirm(message, callback) : (callback && callback(confirm(message))); }
function showPrompt(message, callback) { isTelegram ? tg.showPrompt(message, callback) : (callback && callback(prompt(message))); }
function getInitData() { return isTelegram ? tg.initData || null : null; }
function hapticFeedback(type = 'impact', style = 'medium') {
    if (!isTelegram) return;
    if (type === 'impact') tg.HapticFeedback.impactOccurred(style);
    else if (type === 'notification') tg.HapticFeedback.notificationOccurred(style);
    else if (type === 'selection') tg.HapticFeedback.selectionChanged();
}
window.TelegramWebApp = {
    init: initTelegram,
    isTelegram: () => isTelegram,
    getUser: getTelegramUser,
    sendData: sendDataToBot,
    close: closeApp,
    showAlert: showAlert,
    showConfirm: showConfirm,
    showPrompt: showPrompt,
    getInitData: getInitData,
    haptic: hapticFeedback,
    tg: () => tg
};
