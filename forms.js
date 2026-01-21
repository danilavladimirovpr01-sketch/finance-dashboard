/**
 * Формы для добавления/редактирования данных
 */

// Редактирование включено - работает через GitHub API с токеном
// Токен нужно ввести в настройках

/**
 * Форма добавления дохода
 */
function showAddIncomeForm(year, month, onSuccess) {
    const form = document.createElement('form');
    form.innerHTML = `
        <div class="form-group">
            <label>Дата</label>
            <input type="text" name="date" placeholder="ДД.ММ.ГГГГ" required 
                   pattern="\\d{2}\\.\\d{2}\\.\\d{4}" />
        </div>
        <div class="form-group">
            <label>Источник дохода</label>
            <input type="text" name="source" placeholder="Например: Работа курьер" required />
        </div>
        <div class="form-group">
            <label>Сумма (руб.)</label>
            <input type="number" name="amount" placeholder="0" min="0" step="0.01" required />
        </div>
        <div class="form-group">
            <label>Примечание</label>
            <textarea name="note" rows="2" placeholder="Опционально"></textarea>
        </div>
    `;
    
    const modal = Modal.create('Добавить доход', form, [
        {
            text: 'Отмена',
            className: 'btn-secondary',
            onClick: () => {}
        },
        {
            text: 'Добавить',
            className: 'btn-primary',
            onClick: async () => {
                const formData = new FormData(form);
                const data = {
                    date: formData.get('date'),
                    source: formData.get('source'),
                    amount: parseFloat(formData.get('amount')),
                    note: formData.get('note') || ''
                };
                
                if (!data.date || !data.source || !data.amount) {
                    showNotification('Заполните все обязательные поля', 'error');
                    return;
                }
                
                try {
                    const token = window.GitHubAPI.getGitHubToken();
                    if (!token) {
                        showNotification('GitHub токен не установлен. Пожалуйста, введите токен в настройках.', 'error');
                        showSettings();
                        return;
                    }
                    
                    showNotification('Добавление дохода...', 'info');
                    await window.GitHubAPI.addIncomeToPlan(year, month, data);
                    showNotification('Доход успешно добавлен!', 'success');
                    
                    if (onSuccess) onSuccess();
                    Modal.close();
                    
                } catch (error) {
                    console.error('Ошибка:', error);
                    showNotification(error.message || 'Ошибка при добавлении дохода', 'error');
                }
            }
        }
    ]);
}

/**
 * Форма добавления расхода
 */
function showAddExpenseForm(year, month, onSuccess) {
    const form = document.createElement('form');
    form.innerHTML = `
        <div class="form-group">
            <label>Категория</label>
            <select name="category" required>
                <option value="">Выберите категорию</option>
                <option value="Продукты питания">Продукты питания</option>
                <option value="Коммунальные услуги">Коммунальные услуги</option>
                <option value="Аренда жилья">Аренда жилья</option>
                <option value="Транспорт">Транспорт</option>
                <option value="Кредит машина">Кредит машина</option>
                <option value="Кредит Ирина">Кредит Ирина</option>
                <option value="Кредитка Сбер">Кредитка Сбер</option>
                <option value="Кредитка Тиньков">Кредитка Тиньков</option>
                <option value="Платеж Дмитрию">Платеж Дмитрию</option>
                <option value="Здоровье и медицина">Здоровье и медицина</option>
                <option value="Образование">Образование</option>
                <option value="Хобби и развлечения">Хобби и развлечения</option>
                <option value="Спорт и фитнес">Спорт и фитнес</option>
                <option value="Одежда и обувь">Одежда и обувь</option>
                <option value="Красота и уход">Красота и уход</option>
                <option value="Подарки">Подарки</option>
                <option value="Электроника">Электроника</option>
                <option value="Программное обеспечение">Программное обеспечение</option>
                <option value="Непредвиденные расходы">Непредвиденные расходы</option>
                <option value="Накопления">Накопления</option>
                <option value="Инвестиции">Инвестиции</option>
                <option value="Другое">Другое</option>
            </select>
        </div>
        <div class="form-group">
            <label>Сумма (руб.)</label>
            <input type="number" name="amount" placeholder="0" min="0" step="0.01" required />
        </div>
        <div class="form-group">
            <label>Срок оплаты</label>
            <input type="text" name="due_date" placeholder="ДД.ММ.ГГГГ" 
                   pattern="\\d{2}\\.\\d{2}\\.\\d{4}" />
        </div>
        <div class="form-group">
            <label>Примечание</label>
            <textarea name="note" rows="2" placeholder="Опционально"></textarea>
        </div>
    `;
    
    const modal = Modal.create('Добавить расход', form, [
        {
            text: 'Отмена',
            className: 'btn-secondary',
            onClick: () => {}
        },
        {
            text: 'Добавить',
            className: 'btn-primary',
            onClick: async () => {
                const formData = new FormData(form);
                const data = {
                    category: formData.get('category'),
                    amount: parseFloat(formData.get('amount')),
                    due_date: formData.get('due_date') || '',
                    note: formData.get('note') || ''
                };
                
                if (!data.category || !data.amount) {
                    showNotification('Заполните все обязательные поля', 'error');
                    return;
                }
                
                try {
                    const token = window.GitHubAPI.getGitHubToken();
                    if (!token) {
                        showNotification('GitHub токен не установлен. Пожалуйста, введите токен в настройках.', 'error');
                        showSettings();
                        return;
                    }
                    
                    showNotification('Добавление расхода...', 'info');
                    await window.GitHubAPI.addExpenseToPlan(year, month, data);
                    showNotification('Расход успешно добавлен!', 'success');
                    
                    if (onSuccess) onSuccess();
                    Modal.close();
                    
                } catch (error) {
                    console.error('Ошибка:', error);
                    showNotification(error.message || 'Ошибка при добавлении расхода', 'error');
                }
            }
        }
    ]);
}

/**
 * Форма отметки расхода как оплаченного
 */
function showMarkAsPaidForm(year, month, category, amount, onSuccess) {
    const form = document.createElement('form');
    form.innerHTML = `
        <div class="form-group">
            <label>Категория</label>
            <input type="text" value="${category}" readonly />
        </div>
        <div class="form-group">
            <label>Сумма (руб.)</label>
            <input type="number" name="amount" value="${amount}" min="0" step="0.01" required />
        </div>
        <div class="form-group">
            <label>Дата оплаты</label>
            <input type="text" name="payment_date" placeholder="ДД.ММ.ГГГГ" 
                   pattern="\\d{2}\\.\\d{2}\\.\\d{4}" />
        </div>
        <div class="form-group">
            <label>Примечание</label>
            <textarea name="note" rows="2" placeholder="Опционально"></textarea>
        </div>
    `;
    
    const modal = Modal.create('Отметить как оплаченный', form, [
        {
            text: 'Отмена',
            className: 'btn-secondary',
            onClick: () => {}
        },
        {
            text: 'Отметить',
            className: 'btn-primary',
            onClick: async () => {
                const formData = new FormData(form);
                const data = {
                    category: category,
                    amount: parseFloat(formData.get('amount')),
                    payment_date: formData.get('payment_date') || '',
                    note: formData.get('note') || ''
                };
                
                try {
                    const token = window.GitHubAPI.getGitHubToken();
                    if (!token) {
                        showNotification('GitHub токен не установлен. Пожалуйста, введите токен в настройках.', 'error');
                        showSettings();
                        return;
                    }
                    
                    showNotification('Отметка расхода как оплаченного...', 'info');
                    await window.GitHubAPI.markExpenseAsPaid(year, month, data.category, data.amount, data.payment_date);
                    showNotification('Расход отмечен как оплаченный!', 'success');
                    
                    if (onSuccess) onSuccess();
                    Modal.close();
                    
                } catch (error) {
                    console.error('Ошибка:', error);
                    showNotification(error.message || 'Ошибка при отметке расхода', 'error');
                }
            }
        }
    ]);
}

/**
 * Показать уведомление
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 2000;
        animation: slideDown 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Добавляем стили для форм
const style = document.createElement('style');
style.textContent = `
    .form-group {
        margin-bottom: 16px;
    }
    .form-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: var(--tg-theme-text-color, var(--text-color));
    }
    .form-group input,
    .form-group select,
    .form-group textarea {
        width: 100%;
        padding: 10px;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        font-size: 14px;
        background: var(--tg-theme-bg-color, white);
        color: var(--tg-theme-text-color, var(--text-color));
        box-sizing: border-box;
    }
    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
        outline: none;
        border-color: var(--tg-theme-link-color, var(--primary-color));
    }
    .btn-primary {
        background: var(--tg-theme-button-color, var(--primary-color));
        color: var(--tg-theme-button-text-color, white);
    }
    .btn-secondary {
        background: var(--tg-theme-secondary-bg-color, #f1f1f1);
        color: var(--tg-theme-text-color, var(--text-color));
    }
    @keyframes slideDown {
        from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
    @keyframes slideUp {
        from { transform: translateX(-50%) translateY(0); opacity: 1; }
        to { transform: translateX(-50%) translateY(-100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

/**
 * Показать настройки (для ввода GitHub токена)
 */
function showSettings() {
    const form = document.createElement('form');
    const currentToken = window.GitHubAPI.getGitHubToken();
    
    form.innerHTML = `
        <div class="form-group">
            <label>GitHub Personal Access Token</label>
            <input type="password" id="githubTokenInput" placeholder="ghp_xxxxxxxxxxxx" 
                   value="${currentToken ? '••••••••' : ''}" />
            <small style="color: var(--tg-theme-hint-color, #666); font-size: 12px; margin-top: 4px; display: block;">
                Токен нужен для редактирования данных. Создайте токен на 
                <a href="https://github.com/settings/tokens" target="_blank" style="color: var(--tg-theme-link-color, #3b82f6);">
                    GitHub Settings → Developer settings → Personal access tokens
                </a>
                <br>Нужны права: <code>repo</code>
            </small>
        </div>
        <div class="form-group">
            <label>
                <input type="checkbox" id="showTokenCheckbox" />
                Показать токен
            </label>
        </div>
    `;
    
    const tokenInput = form.querySelector('#githubTokenInput');
    const showCheckbox = form.querySelector('#showTokenCheckbox');
    
    showCheckbox.addEventListener('change', () => {
        tokenInput.type = showCheckbox.checked ? 'text' : 'password';
        if (!showCheckbox.checked && currentToken) {
            tokenInput.value = '••••••••';
        } else if (showCheckbox.checked && currentToken) {
            tokenInput.value = currentToken;
        }
    });
    
    const modal = Modal.create('⚙️ Настройки', form, [
        { text: 'Отмена', className: 'btn-secondary', onClick: () => {} },
        { text: 'Сохранить', className: 'btn-primary', onClick: () => {
            const token = tokenInput.value.trim();
            if (token && token !== '••••••••') {
                window.GitHubAPI.setGitHubToken(token);
                showNotification('Токен сохранен!', 'success');
            } else if (!token) {
                window.GitHubAPI.setGitHubToken('');
                showNotification('Токен удален', 'info');
            }
            Modal.close();
        }}
    ]);
}

// Экспорт
window.Forms = {
    showAddIncome: showAddIncomeForm,
    showAddExpense: showAddExpenseForm,
    showMarkAsPaid: showMarkAsPaidForm,
    showSettings: showSettings
};
