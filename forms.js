/**
 * Формы для добавления/редактирования данных
 */

// Редактирование временно отключено - работает только чтение через GitHub API
// Для редактирования нужно будет добавить GitHub API с токеном
const EDITING_ENABLED = false;

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
                
                // Валидация
                if (!data.date || !data.source || !data.amount) {
                    showNotification('Заполните все обязательные поля', 'error');
                    return;
                }
                
                try {
                    // Редактирование временно отключено - работает только чтение
                    alert('Редактирование временно недоступно.\n\nДанные читаются напрямую из GitHub. Для редактирования нужно настроить GitHub API с токеном (опционально).\n\nВы можете редактировать файлы напрямую в репозитории GitHub.');
                    if (onSuccess) onSuccess();
                    return;
                    
                    /* Временно отключено - нужен backend или GitHub API с токеном
                    // Код для редактирования будет добавлен позже
                    */
                    if (onSuccess) onSuccess();
                    
                } catch (error) {
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
                
                // Валидация
                if (!data.category || !data.amount) {
                    showNotification('Заполните все обязательные поля', 'error');
                    return;
                }
                
                // Редактирование временно отключено
                alert('Редактирование временно недоступно.\n\nДанные читаются напрямую из GitHub. Для редактирования нужно настроить GitHub API с токеном (опционально).\n\nВы можете редактировать файлы напрямую в репозитории GitHub.');
                if (onSuccess) onSuccess();
                return;
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
                
                // Редактирование временно отключено
                alert('Редактирование временно недоступно.\n\nДанные читаются напрямую из GitHub. Для редактирования нужно настроить GitHub API с токеном (опционально).\n\nВы можете редактировать файлы напрямую в репозитории GitHub.');
                if (onSuccess) onSuccess();
                return;
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
        from {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
        }
        to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    }
    @keyframes slideUp {
        from {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
        to {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Экспорт
window.Forms = {
    showAddIncome: showAddIncomeForm,
    showAddExpense: showAddExpenseForm,
    showMarkAsPaid: showMarkAsPaidForm
};
