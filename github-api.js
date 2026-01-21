// GitHub API для работы с файлами напрямую
// Работает без backend - использует GitHub Raw API для чтения
// Для записи нужен GitHub Personal Access Token

const GITHUB_REPO = 'danilavladimirovpr01-sketch/finance-dashboard';
const GITHUB_OWNER = 'danilavladimirovpr01-sketch';
const GITHUB_REPO_NAME = 'finance-dashboard';
const GITHUB_BRANCH = 'main';
const GITHUB_RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}`;
const GITHUB_API_BASE = 'https://api.github.com';

// Путь к файлам с финансами в репозитории
const FINANCES_PATH = 'personal/Finances';

// Получить токен из localStorage
function getGitHubToken() {
    return localStorage.getItem('github_token') || '';
}

// Сохранить токен в localStorage
function setGitHubToken(token) {
    if (token) {
        localStorage.setItem('github_token', token);
    } else {
        localStorage.removeItem('github_token');
    }
}

/**
 * Получить содержимое файла из GitHub через Raw API
 */
async function getFileFromGitHub(filePath) {
    try {
        const url = `${GITHUB_RAW_BASE}/${filePath}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            if (response.status === 404) {
                return null; // Файл не найден
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const text = await response.text();
        return text;
    } catch (error) {
        console.error('Ошибка загрузки файла из GitHub:', error);
        throw error;
    }
}

/**
 * Получить план на месяц
 */
async function getPlan(year, month) {
    const filePath = `${FINANCES_PATH}/${year}/Plans/Plan_${year}_${month.toString().padStart(2, '0')}.md`;
    const content = await getFileFromGitHub(filePath);
    
    if (!content) {
        return null;
    }
    
    // Парсим markdown (используем упрощенный парсер)
    return parsePlanMarkdown(content);
}

/**
 * Получить фактические данные за месяц
 */
async function getFact(year, month) {
    const filePath = `${FINANCES_PATH}/${year}/Facts/Fact_${year}_${month.toString().padStart(2, '0')}.md`;
    const content = await getFileFromGitHub(filePath);
    
    if (!content) {
        return null;
    }
    
    return parseFactMarkdown(content);
}

/**
 * Упрощенный парсер markdown для плана
 */
function parsePlanMarkdown(content) {
    // Парсим таблицы из markdown
    const lines = content.split('\n');
    const incomes = [];
    const expenses = [];
    const paidExpenses = [];
    const remainingExpenses = [];
    
    let currentSection = null;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Определяем секцию
        if (line.includes('Планируемые доходы') || line.includes('Доходы')) {
            currentSection = 'incomes';
            continue;
        }
        if (line.includes('Планируемые расходы') || line.includes('Расходы')) {
            currentSection = 'expenses';
            continue;
        }
        if (line.includes('Фактически оплаченные расходы') || line.includes('Оплаченные')) {
            currentSection = 'paid';
            continue;
        }
        if (line.includes('Оставшиеся платежи') || line.includes('Осталось')) {
            currentSection = 'remaining';
            continue;
        }
        
        // Парсим таблицу (строка начинается с |)
        if (line.startsWith('|') && !line.startsWith('|---')) {
            const cells = line.split('|').map(c => c.trim()).filter(c => c);
            
            if (cells.length >= 3) {
                if (currentSection === 'incomes') {
                    incomes.push({
                        date: cells[0] || '',
                        source: cells[1] || '',
                        amount: parseAmount(cells[2] || '0'),
                        note: cells[3] || ''
                    });
                } else if (currentSection === 'expenses') {
                    expenses.push({
                        category: cells[0] || '',
                        amount: parseAmount(cells[1] || '0'),
                        due_date: cells[2] || '',
                        note: cells[3] || ''
                    });
                } else if (currentSection === 'paid') {
                    paidExpenses.push({
                        category: cells[0] || '',
                        amount: parseAmount(cells[1] || '0'),
                        date_paid: cells[2] || '',
                        note: cells[3] || ''
                    });
                } else if (currentSection === 'remaining') {
                    remainingExpenses.push({
                        category: cells[0] || '',
                        amount: parseAmount(cells[1] || '0'),
                        due_date: cells[2] || '',
                        note: cells[3] || ''
                    });
                }
            }
        }
    }
    
    return {
        incomes,
        expenses,
        paid_expenses: paidExpenses,
        remaining_expenses: remainingExpenses
    };
}

/**
 * Упрощенный парсер markdown для факта
 */
function parseFactMarkdown(content) {
    const lines = content.split('\n');
    const incomes = [];
    const expenses = [];
    
    let currentSection = null;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.includes('Доходы') || line.includes('Фактические доходы')) {
            currentSection = 'incomes';
            continue;
        }
        if (line.includes('Расходы') || line.includes('Фактические расходы')) {
            currentSection = 'expenses';
            continue;
        }
        
        if (line.startsWith('|') && !line.startsWith('|---')) {
            const cells = line.split('|').map(c => c.trim()).filter(c => c);
            
            if (cells.length >= 3) {
                if (currentSection === 'incomes') {
                    incomes.push({
                        date: cells[0] || '',
                        source: cells[1] || '',
                        amount: parseAmount(cells[2] || '0'),
                        note: cells[3] || ''
                    });
                } else if (currentSection === 'expenses') {
                    expenses.push({
                        category: cells[0] || '',
                        amount: parseAmount(cells[1] || '0'),
                        date: cells[2] || '',
                        note: cells[3] || ''
                    });
                }
            }
        }
    }
    
    return { incomes, expenses };
}

/**
 * Парсит сумму из строки (убирает пробелы, запятые, рубли)
 */
function parseAmount(str) {
    if (!str) return 0;
    const cleaned = str.toString().replace(/[^\d.,]/g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
}

/**
 * Получить SHA коммита файла (нужно для обновления)
 */
async function getFileSha(filePath) {
    const token = getGitHubToken();
    if (!token) {
        throw new Error('GitHub токен не установлен. Пожалуйста, введите токен в настройках.');
    }
    
    try {
        const url = `${GITHUB_API_BASE}/repos/${GITHUB_REPO}/contents/${filePath}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!response.ok) {
            if (response.status === 404) {
                return null; // Файл не существует
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.sha;
    } catch (error) {
        console.error('Ошибка получения SHA файла:', error);
        throw error;
    }
}

/**
 * Обновить файл в GitHub
 */
async function updateFileInGitHub(filePath, content, message) {
    const token = getGitHubToken();
    if (!token) {
        throw new Error('GitHub токен не установлен. Пожалуйста, введите токен в настройках.');
    }
    
    try {
        const sha = await getFileSha(filePath);
        const encodedContent = btoa(unescape(encodeURIComponent(content)));
        const url = `${GITHUB_API_BASE}/repos/${GITHUB_REPO}/contents/${filePath}`;
        const body = {
            message: message || `Update ${filePath}`,
            content: encodedContent,
            branch: GITHUB_BRANCH
        };
        if (sha) body.sha = sha;
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Ошибка обновления файла в GitHub:', error);
        throw error;
    }
}

/**
 * Добавить доход в план
 */
async function addIncomeToPlan(year, month, incomeData) {
    const filePath = `${FINANCES_PATH}/${year}/Plans/Plan_${year}_${month.toString().padStart(2, '0')}.md`;
    const currentContent = await getFileFromGitHub(filePath);
    if (!currentContent) throw new Error('Файл плана не найден');
    const updatedContent = addIncomeToMarkdown(currentContent, incomeData);
    await updateFileInGitHub(filePath, updatedContent, `Добавлен доход: ${incomeData.source} - ${incomeData.amount} руб.`);
}

/**
 * Добавить расход в план
 */
async function addExpenseToPlan(year, month, expenseData) {
    const filePath = `${FINANCES_PATH}/${year}/Plans/Plan_${year}_${month.toString().padStart(2, '0')}.md`;
    const currentContent = await getFileFromGitHub(filePath);
    if (!currentContent) throw new Error('Файл плана не найден');
    const updatedContent = addExpenseToMarkdown(currentContent, expenseData);
    await updateFileInGitHub(filePath, updatedContent, `Добавлен расход: ${expenseData.category} - ${expenseData.amount} руб.`);
}

/**
 * Отметить расход как оплаченный
 */
async function markExpenseAsPaid(year, month, category, amount, paymentDate) {
    const filePath = `${FINANCES_PATH}/${year}/Plans/Plan_${year}_${month.toString().padStart(2, '0')}.md`;
    const currentContent = await getFileFromGitHub(filePath);
    if (!currentContent) throw new Error('Файл плана не найден');
    const updatedContent = moveExpenseToPaid(currentContent, category, amount, paymentDate);
    await updateFileInGitHub(filePath, updatedContent, `Отмечен как оплаченный: ${category} - ${amount} руб.`);
}

/**
 * Добавить доход в markdown таблицу
 */
function addIncomeToMarkdown(content, incomeData) {
    const lines = content.split('\n');
    let inIncomesSection = false;
    let tableStartIndex = -1;
    let tableEndIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.includes('Планируемые доходы') || (line.includes('Доходы') && !line.includes('Итого'))) {
            inIncomesSection = true; continue;
        }
        if (inIncomesSection && line.startsWith('|') && line.includes('Дата') && line.includes('Источник')) {
            tableStartIndex = i; continue;
        }
        if (inIncomesSection && tableStartIndex >= 0 && line.startsWith('|---')) {
            tableEndIndex = i; continue;
        }
        if (inIncomesSection && tableStartIndex >= 0 && (line.includes('Итого') || line.startsWith('##'))) {
            tableEndIndex = i - 1; break;
        }
    }
    if (tableStartIndex < 0 || tableEndIndex < 0) throw new Error('Не удалось найти таблицу доходов в файле');
    const formattedAmount = formatAmount(incomeData.amount);
    const newRow = `| ${incomeData.date} | ${incomeData.source} | ${formattedAmount} | ${incomeData.note || ''} |`;
    lines.splice(tableEndIndex + 1, 0, newRow);
    return lines.join('\n');
}

/**
 * Добавить расход в markdown таблицу
 */
function addExpenseToMarkdown(content, expenseData) {
    const lines = content.split('\n');
    let inExpensesSection = false;
    let tableStartIndex = -1;
    let tableEndIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.includes('Планируемые расходы') || (line.includes('Расходы') && !line.includes('Итого') && !line.includes('Оплаченные'))) {
            inExpensesSection = true; continue;
        }
        if (inExpensesSection && line.startsWith('|') && line.includes('Категория') && line.includes('Сумма')) {
            tableStartIndex = i; continue;
        }
        if (inExpensesSection && tableStartIndex >= 0 && line.startsWith('|---')) {
            tableEndIndex = i; continue;
        }
        if (inExpensesSection && tableStartIndex >= 0 && (line.includes('Итого') || (line.startsWith('##') && !line.includes('Расходы')))) {
            tableEndIndex = i - 1; break;
        }
    }
    if (tableStartIndex < 0 || tableEndIndex < 0) throw new Error('Не удалось найти таблицу расходов в файле');
    const formattedAmount = formatAmount(expenseData.amount);
    const newRow = `| ${expenseData.category} | ${formattedAmount} | ${expenseData.due_date || ''} | ${expenseData.note || ''} |`;
    lines.splice(tableEndIndex + 1, 0, newRow);
    return lines.join('\n');
}

/**
 * Переместить расход в секцию оплаченных
 */
function moveExpenseToPaid(content, category, amount, paymentDate) {
    const lines = content.split('\n');
    let expenseLineIndex = -1;
    let paidSectionStart = -1;
    let paidTableEnd = -1;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.includes(category) && line.includes(String(amount).replace(/\s/g, ''))) {
            expenseLineIndex = i; break;
        }
    }
    if (expenseLineIndex < 0) throw new Error('Расход не найден в таблице');
    const expenseLine = lines[expenseLineIndex];
    lines.splice(expenseLineIndex, 1);
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.includes('Фактически оплаченные расходы') || line.includes('Оплаченные расходы')) { paidSectionStart = i; continue; }
        if (paidSectionStart >= 0 && line.startsWith('|') && line.includes('Категория')) { continue; }
        if (paidSectionStart >= 0 && line.startsWith('|---')) { paidTableEnd = i; continue; }
        if (paidSectionStart >= 0 && paidTableEnd >= 0 && (line.startsWith('##') || line.includes('Оставшиеся'))) { paidTableEnd = i - 1; break; }
    }
    if (paidSectionStart < 0) {
        let expensesEnd = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('Планируемые расходы')) {
                for (let j = i; j < lines.length; j++) {
                    if (lines[j].startsWith('##') && !lines[j].includes('Расходы')) { expensesEnd = j; break; }
                }
                break;
            }
        }
        if (expensesEnd < 0) expensesEnd = lines.length;
        const newSection = [
            '',
            '## Фактически оплаченные расходы',
            '',
            '| Категория | Сумма (руб.) | Дата оплаты | Примечание |',
            '|---|---|---|---|',
            `| ${category} | ${formatAmount(amount)} | ${paymentDate || new Date().toLocaleDateString('ru-RU')} | |`
        ];
        lines.splice(expensesEnd, 0, ...newSection);
    } else {
        const cells = expenseLine.split('|').map(c => c.trim()).filter(c => c);
        const newPaidRow = `| ${category} | ${formatAmount(amount)} | ${paymentDate || new Date().toLocaleDateString('ru-RU')} | ${cells[3] || ''} |`;
        if (paidTableEnd >= 0) {
            lines.splice(paidTableEnd + 1, 0, newPaidRow);
        } else {
            const tableHeader = [
                '',
                '| Категория | Сумма (руб.) | Дата оплаты | Примечание |',
                '|---|---|---|---|',
                newPaidRow
            ];
            lines.splice(paidSectionStart + 1, 0, ...tableHeader);
        }
    }
    return lines.join('\n');
}

/**
 * Форматировать сумму с пробелами для тысяч
 */
function formatAmount(amount) {
    return new Intl.NumberFormat('ru-RU').format(amount);
}

// Экспортируем функции
window.GitHubAPI = {
    getPlan,
    getFact,
    getFileFromGitHub,
    addIncomeToPlan,
    addExpenseToPlan,
    markExpenseAsPaid,
    getGitHubToken,
    setGitHubToken
};
