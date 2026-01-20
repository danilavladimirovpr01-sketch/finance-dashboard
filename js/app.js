// Конфигурация API
// Определяем URL API в зависимости от окружения
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000'
    : (window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : ''));

// Глобальные переменные для графиков
let incomeExpenseChart = null;
let expensesChart = null;

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    // Инициализируем Telegram Web App
    if (window.TelegramWebApp) {
        window.TelegramWebApp.init();
    }
    
    // Устанавливаем текущий месяц
    const now = new Date();
    document.getElementById('monthSelect').value = now.getMonth() + 1;
    
    // Проверяем параметры URL (для навигации из бота)
    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get('page');
    if (page) {
        // Можно добавить логику для разных страниц
        console.log('Открыта страница:', page);
    }
    
    // Загружаем данные
    loadData();
    
    // Обработчики событий
    document.getElementById('refreshBtn').addEventListener('click', () => {
        if (window.TelegramWebApp && window.TelegramWebApp.isTelegram()) {
            window.TelegramWebApp.haptic('impact', 'light');
        }
        loadData();
    });
    
    document.getElementById('addIncomeBtn').addEventListener('click', () => {
        const year = document.getElementById('yearSelect').value;
        const month = document.getElementById('monthSelect').value;
        if (window.TelegramWebApp && window.TelegramWebApp.isTelegram()) {
            window.TelegramWebApp.haptic('impact', 'light');
        }
        window.Forms.showAddIncome(year, month, loadData);
    });
    
    document.getElementById('addExpenseBtn').addEventListener('click', () => {
        const year = document.getElementById('yearSelect').value;
        const month = document.getElementById('monthSelect').value;
        if (window.TelegramWebApp && window.TelegramWebApp.isTelegram()) {
            window.TelegramWebApp.haptic('impact', 'light');
        }
        window.Forms.showAddExpense(year, month, loadData);
    });
    
    document.getElementById('yearSelect').addEventListener('change', loadData);
    document.getElementById('monthSelect').addEventListener('change', loadData);
});

async function loadData() {
    const year = document.getElementById('yearSelect').value;
    const month = document.getElementById('monthSelect').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/plans/${year}/${month}`);
        if (!response.ok) {
            throw new Error('Ошибка загрузки данных');
        }
        
        const result = await response.json();
        updateDashboard(result.data);
    } catch (error) {
        console.error('Ошибка:', error);
        showError('Не удалось загрузить данные. Убедитесь, что backend запущен на порту 8000.');
    }
}

function updateDashboard(data) {
    // Обновляем карточки со статистикой
    document.getElementById('totalIncome').textContent = formatCurrency(data.totals.income);
    document.getElementById('totalExpenses').textContent = formatCurrency(data.totals.expenses);
    document.getElementById('totalPaid').textContent = formatCurrency(data.totals.paid);
    document.getElementById('totalBalance').textContent = formatCurrency(data.totals.balance);
    
    // Обновляем таблицы
    updateIncomesTable(data.incomes);
    updateExpensesTable(data.expenses);
    updateRemainingTable(data.remaining);
    
    // Обновляем графики
    updateIncomeExpenseChart(data);
    updateExpensesChart(data.expenses);
}

function updateIncomesTable(incomes) {
    const tbody = document.querySelector('#incomesTable tbody');
    tbody.innerHTML = '';
    
    if (incomes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="loading">Нет данных</td></tr>';
        return;
    }
    
    incomes.forEach(income => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${income['Дата'] || income['Дата оплаты'] || '-'}</td>
            <td>${income['Источник дохода'] || income['Источник'] || '-'}</td>
            <td><strong>${formatCurrency(parseAmount(income['Сумма (руб.)'] || income['Сумма'] || '0'))}</strong></td>
        `;
        tbody.appendChild(row);
    });
}

function updateExpensesTable(expenses) {
    const tbody = document.querySelector('#expensesTable tbody');
    tbody.innerHTML = '';
    
    if (expenses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="loading">Нет данных</td></tr>';
        return;
    }
    
    const year = document.getElementById('yearSelect').value;
    const month = document.getElementById('monthSelect').value;
    
    expenses.forEach(expense => {
        const category = expense['Категория'] || '-';
        const amount = parseAmount(expense['Сумма (руб.)'] || expense['Сумма'] || '0');
        const date = expense['Срок оплаты'] || expense['Дата'] || '-';
        
        if (amount > 0) {
            const row = document.createElement('tr');
            const cleanCategory = category.replace(/\*\*/g, '');
            row.innerHTML = `
                <td>${cleanCategory}</td>
                <td><strong>${formatCurrency(amount)}</strong></td>
                <td>${date}</td>
                <td>
                    <button class="btn-mark-paid" onclick="markAsPaid('${cleanCategory}', ${amount})" 
                            title="Отметить как оплаченный">✓</button>
                </td>
            `;
            tbody.appendChild(row);
        }
    });
}

// Функция для отметки расхода как оплаченного
window.markAsPaid = function(category, amount) {
    const year = document.getElementById('yearSelect').value;
    const month = document.getElementById('monthSelect').value;
    if (window.TelegramWebApp && window.TelegramWebApp.isTelegram()) {
        window.TelegramWebApp.haptic('impact', 'medium');
    }
    window.Forms.showMarkAsPaid(year, month, category, amount, loadData);
};

function updateRemainingTable(remaining) {
    const tbody = document.querySelector('#remainingTable tbody');
    tbody.innerHTML = '';
    
    if (remaining.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="loading">Нет данных</td></tr>';
        return;
    }
    
    remaining.forEach(item => {
        const category = item['Категория'] || '-';
        const amount = parseAmount(item['Сумма (руб.)'] || item['Сумма'] || '0');
        const date = item['Срок оплаты'] || item['Дата'] || '-';
        
        if (amount > 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${category.replace(/\*\*/g, '')}</td>
                <td><strong>${formatCurrency(amount)}</strong></td>
                <td>${date}</td>
            `;
            tbody.appendChild(row);
        }
    });
}

function updateIncomeExpenseChart(data) {
    const ctx = document.getElementById('incomeExpenseChart').getContext('2d');
    
    if (incomeExpenseChart) {
        incomeExpenseChart.destroy();
    }
    
    incomeExpenseChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Доходы', 'Расходы', 'Оплачено'],
            datasets: [{
                label: 'Сумма (₽)',
                data: [
                    data.totals.income,
                    data.totals.expenses,
                    data.totals.paid
                ],
                backgroundColor: [
                    '#10b981',
                    '#ef4444',
                    '#3b82f6'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

function updateExpensesChart(expenses) {
    const ctx = document.getElementById('expensesChart').getContext('2d');
    
    // Группируем расходы по категориям
    const categories = {};
    expenses.forEach(exp => {
        const category = (exp['Категория'] || '').replace(/\*\*/g, '').trim();
        const amount = parseAmount(exp['Сумма (руб.)'] || exp['Сумма'] || '0');
        
        if (category && amount > 0) {
            categories[category] = (categories[category] || 0) + amount;
        }
    });
    
    const labels = Object.keys(categories);
    const values = Object.values(categories);
    
    if (expensesChart) {
        expensesChart.destroy();
    }
    
    if (labels.length === 0) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        return;
    }
    
    expensesChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    '#ef4444', '#f59e0b', '#10b981', '#3b82f6',
                    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'right'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + formatCurrency(context.parsed);
                        }
                    }
                }
            }
        }
    });
}

function parseAmount(text) {
    if (!text) return 0;
    const cleaned = String(text).replace(/[^\d,.]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    
    const container = document.querySelector('.container');
    const firstChild = container.querySelector('.dashboard') || container.querySelector('header');
    if (firstChild) {
        container.insertBefore(errorDiv, firstChild.nextSibling);
        setTimeout(() => errorDiv.remove(), 5000);
    }
}
