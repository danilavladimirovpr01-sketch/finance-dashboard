// Используем GitHub API напрямую - без backend!
// Читаем файлы напрямую из репозитория через GitHub Raw API

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
    
    // Загружаем данные с обходом кэша
    loadData(true);
    
    // Обработчики событий
    document.getElementById('refreshBtn').addEventListener('click', () => {
        if (window.TelegramWebApp && window.TelegramWebApp.isTelegram()) {
            window.TelegramWebApp.haptic('impact', 'light');
        }
        loadData(true); // Принудительное обновление с обходом кэша
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
    
    document.getElementById('settingsBtn').addEventListener('click', () => {
        if (window.TelegramWebApp && window.TelegramWebApp.isTelegram()) {
            window.TelegramWebApp.haptic('impact', 'light');
        }
        window.Forms.showSettings();
    });
});

async function loadData(forceRefresh = false) {
    const year = document.getElementById('yearSelect').value;
    const month = document.getElementById('monthSelect').value;
    
    try {
        showLoading(true);
        
        // Загружаем план и факт напрямую из GitHub
        // Используем обход кэша, если forceRefresh = true
        const [planData, factData] = await Promise.all([
            window.GitHubAPI.getPlan(year, month, forceRefresh),
            window.GitHubAPI.getFact(year, month, forceRefresh)
        ]);
        
        // Объединяем данные в формат, который ожидает updateDashboard
        const result = {
            plan: planData || { incomes: [], expenses: [], paid_expenses: [], remaining_expenses: [] },
            fact: factData || { incomes: [], expenses: [] }
        };
        
        updateDashboard(result);
        showLoading(false);
    } catch (error) {
        console.error('Ошибка:', error);
        showError('Не удалось загрузить данные из GitHub. Проверьте, что репозиторий доступен.');
        showLoading(false);
    }
}

// Делаем loadData доступной глобально для вызова из forms.js
window.loadData = loadData;

function updateDashboard(data) {
    // data = { plan: {...}, fact: {...} }
    const plan = data.plan || { incomes: [], expenses: [], paid_expenses: [], remaining_expenses: [] };
    const fact = data.fact || { incomes: [], expenses: [] };
    
    // Вычисляем итоги
    const totalIncome = plan.incomes.reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalExpenses = plan.expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalPaid = plan.paid_expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalBalance = totalIncome - totalExpenses;
    
    // Обновляем карточки со статистикой
    document.getElementById('totalIncome').textContent = formatCurrency(totalIncome);
    document.getElementById('totalExpenses').textContent = formatCurrency(totalExpenses);
    document.getElementById('totalPaid').textContent = formatCurrency(totalPaid);
    document.getElementById('totalBalance').textContent = formatCurrency(totalBalance);
    
    // Обновляем таблицы
    updateIncomesTable(plan.incomes);
    updateExpensesTable(plan.expenses);
    updateRemainingTable(plan.remaining_expenses);
    
    // Обновляем графики
    updateIncomeExpenseChart({ plan, fact });
    updateExpensesChart(plan.expenses);
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
            <td>${income.date || income['Дата'] || income['Дата оплаты'] || '-'}</td>
            <td>${income.source || income['Источник дохода'] || income['Источник'] || '-'}</td>
            <td><strong>${formatCurrency(income.amount || parseAmount(income['Сумма (руб.)'] || income['Сумма'] || '0'))}</strong></td>
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
        const category = expense.category || expense['Категория'] || '-';
        const amount = expense.amount || parseAmount(expense['Сумма (руб.)'] || expense['Сумма'] || '0');
        const date = expense.due_date || expense['Срок оплаты'] || expense['Дата'] || '-';
        
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
        const category = item.category || item['Категория'] || '-';
        const amount = item.amount || parseAmount(item['Сумма (руб.)'] || item['Сумма'] || '0');
        const date = item.due_date || item['Срок оплаты'] || item['Дата'] || '-';
        
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
    
    // Вычисляем итоги из plan
    const plan = data.plan || { incomes: [], expenses: [], paid_expenses: [] };
    const totalIncome = plan.incomes.reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalExpenses = plan.expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalPaid = plan.paid_expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
    
    incomeExpenseChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Доходы', 'Расходы', 'Оплачено'],
            datasets: [{
                label: 'Сумма (₽)',
                data: [
                    totalIncome,
                    totalExpenses,
                    totalPaid
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
        const category = (exp.category || exp['Категория'] || '').replace(/\*\*/g, '').trim();
        const amount = exp.amount || parseAmount(exp['Сумма (руб.)'] || exp['Сумма'] || '0');
        
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

function showLoading(show) {
    const loadingDiv = document.getElementById('loadingIndicator');
    if (loadingDiv) {
        loadingDiv.style.display = show ? 'block' : 'none';
    }
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
