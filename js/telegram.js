/**
 * Интеграция с Telegram Web App SDK
 */

// Глобальный объект для работы с Telegram API
let tg = null;
let isTelegram = false;

/**
 * Инициализация Telegram Web App
 */
function initTelegram() {
    // Проверяем, запущено ли приложение в Telegram
    if (window.Telegram && window.Telegram.WebApp) {
        tg = window.Telegram.WebApp;
        isTelegram = true;
        
        // Инициализируем приложение
        tg.ready();
        
        // Расширяем приложение на весь экран
        tg.expand();
        
        // Устанавливаем тему
        applyTelegramTheme();
        
        // Слушаем изменения темы
        tg.onEvent('themeChanged', applyTelegramTheme);
        
        // Показываем главную кнопку (опционально)
        setupMainButton();
        
        console.log('Telegram Web App инициализирован');
        return true;
    } else {
        console.log('Приложение запущено не в Telegram');
        isTelegram = false;
        return false;
    }
}

/**
 * Применение темы Telegram
 */
function applyTelegramTheme() {
    if (!isTelegram) return;
    
    const theme = tg.colorScheme; // 'light' или 'dark'
    const colors = tg.themeParams;
    
    // Применяем цвета Telegram
    document.documentElement.style.setProperty('--tg-theme-bg-color', colors.bg_color || '#ffffff');
    document.documentElement.style.setProperty('--tg-theme-text-color', colors.text_color || '#000000');
    document.documentElement.style.setProperty('--tg-theme-hint-color', colors.hint_color || '#999999');
    document.documentElement.style.setProperty('--tg-theme-link-color', colors.link_color || '#2481cc');
    document.documentElement.style.setProperty('--tg-theme-button-color', colors.button_color || '#2481cc');
    document.documentElement.style.setProperty('--tg-theme-button-text-color', colors.button_text_color || '#ffffff');
    document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', colors.secondary_bg_color || '#f1f1f1');
    
    // Добавляем класс для темы
    document.body.classList.toggle('tg-dark', theme === 'dark');
    document.body.classList.toggle('tg-light', theme === 'light');
}

/**
 * Настройка главной кнопки Telegram
 */
function setupMainButton() {
    if (!isTelegram) return;
    
    // Можно настроить кнопку для определенных действий
    // Например, для сохранения данных
    // tg.MainButton.setText('Сохранить');
    // tg.MainButton.show();
    // tg.MainButton.onClick(() => {
    //     saveData();
    // });
}

/**
 * Получить данные пользователя из Telegram
 */
function getTelegramUser() {
    if (!isTelegram || !tg.initDataUnsafe) {
        return null;
    }
    
    return tg.initDataUnsafe.user || null;
}

/**
 * Отправить данные в бот
 */
function sendDataToBot(data) {
    if (!isTelegram) return;
    
    tg.sendData(JSON.stringify(data));
}

/**
 * Закрыть приложение
 */
function closeApp() {
    if (isTelegram) {
        tg.close();
    }
}

/**
 * Показать всплывающее окно
 */
function showAlert(message, callback) {
    if (isTelegram) {
        tg.showAlert(message, callback);
    } else {
        alert(message);
        if (callback) callback();
    }
}

/**
 * Показать подтверждение
 */
function showConfirm(message, callback) {
    if (isTelegram) {
        tg.showConfirm(message, callback);
    } else {
        const result = confirm(message);
        if (callback) callback(result);
    }
}

/**
 * Показать всплывающее окно с вводом
 */
function showPrompt(message, callback) {
    if (isTelegram) {
        tg.showPrompt(message, callback);
    } else {
        const result = prompt(message);
        if (callback) callback(result);
    }
}

/**
 * Получить initData для отправки на сервер (для авторизации)
 */
function getInitData() {
    if (!isTelegram) return null;
    return tg.initData || null;
}

/**
 * Вибрация (для тактильной обратной связи)
 */
function hapticFeedback(type = 'impact', style = 'medium') {
    if (!isTelegram) return;
    
    if (type === 'impact') {
        tg.HapticFeedback.impactOccurred(style);
    } else if (type === 'notification') {
        tg.HapticFeedback.notificationOccurred(style);
    } else if (type === 'selection') {
        tg.HapticFeedback.selectionChanged();
    }
}

// Экспорт функций
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
