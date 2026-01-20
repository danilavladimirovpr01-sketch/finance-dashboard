// Конфигурация API
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000'
    : (window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : ''));

let monthlyChart = null;
let planFactChart = null;

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
                'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

document.addEventListener('DOMContentLoaded', () => {
    // Инициализируем Telegram Web App
    if (window.TelegramWebApp) {
        window.TelegramWebApp.init();
    }
    
    loadAnalytics();
    
    document.getElementById('yearSelect').addEventListener('change', loadAnalytics);
});

async function loadAnalytics() {
    const year = document.getElementById('yearSelect').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/summary/${year}`);
        if (!response.ok) {
            throw new Error('Ошибка загрузки данных');
        }
        
        const data = await response.json();
        updateAnalytics(data);
    } catch (error) {
        console.error('Ошибка:', error);
        showError('Не удалось загрузить данные аналитики.');
    }
}

function updateAnalytics(data) {
    const months = data.months || [];
    
    // Подготовка данных для графиков
    const labels = months.map(m => MONTHS[m.month - 1]);
    const planIncomes = months.map(m => m.plan?.totals?.income || 0);
    const planExpenses = months.map(m => m.plan?.totals?.expenses || 0);
    const factIncomes = months.map(m => m.fact?.totals?.income || 0);
    const factExpenses = months.map(m => m.fact?.totals?.expenses || 0);
    
    // График по месяцам
    updateMonthlyChart(labels, planIncomes, planExpenses);
    
    // График сравнения плана и факта
    updatePlanFactChart(labels, planIncomes, factIncomes, planExpenses, factExpenses);
    
    // Таблица сводки
    updateSummaryTable(months);
}

function updateMonthlyChart(labels, incomes, expenses) {
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    
    if (monthlyChart) {
        monthlyChart.destroy();
    }
    
    monthlyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Доходы',
                    data: incomes,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Расходы',
                    data: expenses,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true
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

function updatePlanFactChart(labels, planIncomes, factIncomes, planExpenses, factExpenses) {
    const ctx = document.getElementById('planFactChart').getContext('2d');
    
    if (planFactChart) {
        planFactChart.destroy();
    }
    
    planFactChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'План доходов',
                    data: planIncomes,
                    backgroundColor: 'rgba(16, 185, 129, 0.6)'
                },
                {
                    label: 'Факт доходов',
                    data: factIncomes,
                    backgroundColor: 'rgba(16, 185, 129, 1)'
                },
                {
                    label: 'План расходов',
                    data: planExpenses,
                    backgroundColor: 'rgba(239, 68, 68, 0.6)'
                },
                {
                    label: 'Факт расходов',
                    data: factExpenses,
                    backgroundColor: 'rgba(239, 68, 68, 1)'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true
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

function updateSummaryTable(months) {
    const tbody = document.querySelector('#summaryTable tbody');
    tbody.innerHTML = '';
    
    months.forEach(month => {
        const planIncome = month.plan?.totals?.income || 0;
        const planExpense = month.plan?.totals?.expenses || 0;
        const balance = planIncome - planExpense;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${MONTHS[month.month - 1]}</td>
            <td>${formatCurrency(planIncome)}</td>
            <td>${formatCurrency(planExpense)}</td>
            <td><strong>${formatCurrency(balance)}</strong></td>
        `;
        tbody.appendChild(row);
    });
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
