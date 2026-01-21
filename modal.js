/**
 * Управление модальными окнами
 */

function createModal(title, content, buttons = []) {
    // Создаем overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 20px;
    `;
    
    // Создаем модальное окно
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.cssText = `
        background: var(--tg-theme-secondary-bg-color, var(--card-bg));
        border-radius: 12px;
        padding: 24px;
        max-width: 500px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;
    
    // Заголовок
    const titleEl = document.createElement('h2');
    titleEl.textContent = title;
    titleEl.style.cssText = `
        margin: 0 0 16px 0;
        font-size: 20px;
        color: var(--tg-theme-text-color, var(--text-color));
    `;
    
    // Контент
    const contentEl = document.createElement('div');
    contentEl.className = 'modal-content';
    contentEl.appendChild(content);
    
    // Кнопки
    const buttonsEl = document.createElement('div');
    buttonsEl.className = 'modal-buttons';
    buttonsEl.style.cssText = `
        display: flex;
        gap: 12px;
        margin-top: 20px;
        justify-content: flex-end;
    `;
    
    buttons.forEach(button => {
        const btn = document.createElement('button');
        btn.textContent = button.text;
        btn.className = button.className || 'btn-primary';
        btn.onclick = () => {
            if (button.onClick) {
                button.onClick();
            }
            closeModal(overlay);
        };
        buttonsEl.appendChild(btn);
    });
    
    // Собираем модальное окно
    modal.appendChild(titleEl);
    modal.appendChild(contentEl);
    modal.appendChild(buttonsEl);
    overlay.appendChild(modal);
    
    // Закрытие по клику на overlay
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            closeModal(overlay);
        }
    };
    
    document.body.appendChild(overlay);
    
    // Анимация появления
    setTimeout(() => {
        overlay.style.opacity = '1';
        modal.style.transform = 'scale(1)';
    }, 10);
    
    return overlay;
}

function closeModal(overlay) {
    if (overlay) {
        overlay.style.opacity = '0';
        const modal = overlay.querySelector('.modal');
        if (modal) {
            modal.style.transform = 'scale(0.9)';
        }
        setTimeout(() => {
            overlay.remove();
        }, 200);
    }
}

// Экспорт
window.Modal = {
    create: createModal,
    close: closeModal
};
