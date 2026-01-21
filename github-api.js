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
    let inTable = false;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lineLower = line.toLowerCase();
        
        // Определяем секцию (только для заголовков уровня ##, не ###)
        if (line.startsWith('##') && !line.startsWith('###')) {
            inTable = false;
            if (lineLower.includes('планируемые доходы') || lineLower.includes('плановые доходы')) {
                currentSection = 'incomes';
                continue;
            }
            if (lineLower.includes('планируемые расходы') || lineLower.includes('плановые расходы')) {
                currentSection = 'expenses';
                continue;
            }
            if (lineLower.includes('фактически оплаченные расходы') || lineLower.includes('оплаченные расходы')) {
                currentSection = 'paid';
                continue;
            }
            if (lineLower.includes('оставшиеся платежи') || lineLower.includes('осталось')) {
                currentSection = 'remaining';
                continue;
            }
            // Если встретили другие секции (Баланс, Заметки), сбрасываем секцию
            if (lineLower.includes('баланс') || lineLower.includes('заметки')) {
                currentSection = null;
                inTable = false;
                continue;
            }
        }
        
        // Парсим таблицу (строка начинается с |)
        if (line.startsWith('|') && !line.startsWith('|---')) {
            const cells = line.split('|').map(c => c.trim()).filter(c => c);
            
            // Пропускаем строки "Итого" - они не являются данными
            if (cells.length >= 1 && lineLower.includes('итого')) {
                continue;
            }
            
            // Определяем, это заголовок таблицы или данные
            const isHeader = (lineLower.includes('дата') && lineLower.includes('источник') && lineLower.includes('сумма')) ||
                            (lineLower.includes('категория') && lineLower.includes('сумма'));
            
            if (isHeader) {
                inTable = true;
                continue;
            }
            
            // Если мы в таблице и это не заголовок, парсим данные
            if (inTable && cells.length >= 3 && currentSection) {
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
        } else if (line.startsWith('|---')) {
            // Разделитель таблицы - подтверждаем, что мы в таблице
            inTable = true;
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
        const lineLower = line.toLowerCase();
        
        if (lineLower.includes('доходы') || lineLower.includes('фактические доходы')) {
            currentSection = 'incomes';
            continue;
        }
        if (lineLower.includes('расходы') || lineLower.includes('фактические расходы')) {
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
    // Убираем все кроме цифр и точки/запятой
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
        // Получаем текущий SHA файла
        const sha = await getFileSha(filePath);
        
        // Кодируем содержимое в base64
        const encodedContent = btoa(unescape(encodeURIComponent(content)));
        
        const url = `${GITHUB_API_BASE}/repos/${GITHUB_REPO}/contents/${filePath}`;
        const body = {
            message: message || `Update ${filePath}`,
            content: encodedContent,
            branch: GITHUB_BRANCH
        };
        
        // Если файл существует, добавляем SHA
        if (sha) {
            body.sha = sha;
        }
        
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
    
    // Загружаем текущий файл
    const currentContent = await getFileFromGitHub(filePath);
    if (!currentContent) {
        throw new Error('Файл плана не найден');
    }
    
    // Парсим и добавляем новый доход
    const updatedContent = addIncomeToMarkdown(currentContent, incomeData);
    
    // Обновляем файл
    await updateFileInGitHub(filePath, updatedContent, `Добавлен доход: ${incomeData.source} - ${incomeData.amount} руб.`);
}

/**
 * Добавить расход в план
 */
async function addExpenseToPlan(year, month, expenseData) {
    const filePath = `${FINANCES_PATH}/${year}/Plans/Plan_${year}_${month.toString().padStart(2, '0')}.md`;
    
    // Загружаем текущий файл
    const currentContent = await getFileFromGitHub(filePath);
    if (!currentContent) {
        throw new Error('Файл плана не найден');
    }
    
    // Парсим и добавляем новый расход
    const updatedContent = addExpenseToMarkdown(currentContent, expenseData);
    
    // Обновляем файл
    await updateFileInGitHub(filePath, updatedContent, `Добавлен расход: ${expenseData.category} - ${expenseData.amount} руб.`);
}

/**
 * Отметить расход как оплаченный
 */
async function markExpenseAsPaid(year, month, category, amount, paymentDate) {
    const filePath = `${FINANCES_PATH}/${year}/Plans/Plan_${year}_${month.toString().padStart(2, '0')}.md`;
    
    // Загружаем текущий файл
    const currentContent = await getFileFromGitHub(filePath);
    if (!currentContent) {
        throw new Error('Файл плана не найден');
    }
    
    // Перемещаем расход из "Планируемые расходы" в "Фактически оплаченные расходы"
    const updatedContent = moveExpenseToPaid(currentContent, category, amount, paymentDate);
    
    // Обновляем файл
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
    let foundSeparator = false;
    
    // Находим секцию доходов и таблицу
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lineLower = line.toLowerCase();
        
        if (lineLower.includes('планируемые доходы') || lineLower.includes('плановые доходы') || (lineLower.includes('доходы') && !lineLower.includes('итого'))) {
            inIncomesSection = true;
            continue;
        }
        
        if (inIncomesSection && line.startsWith('|') && lineLower.includes('дата') && lineLower.includes('источник') && lineLower.includes('сумма')) {
            tableStartIndex = i;
            continue;
        }
        
        if (inIncomesSection && tableStartIndex >= 0 && line.startsWith('|---')) {
            foundSeparator = true;
            continue;
        }
        
        // После разделителя отслеживаем строки данных
        if (inIncomesSection && tableStartIndex >= 0 && foundSeparator) {
            // Если это строка данных (начинается с | и не содержит "Итого")
            if (line.startsWith('|') && !lineLower.includes('итого')) {
                tableEndIndex = i; // Обновляем индекс последней строки данных
                continue;
            }
            
            // Если нашли строку "Итого" или следующую секцию, заканчиваем
            if (lineLower.includes('итого') || line.startsWith('##')) {
                break;
            }
        }
    }
    
    if (tableStartIndex < 0 || tableEndIndex < 0) {
        throw new Error('Не удалось найти таблицу доходов в файле');
    }
    
    // Форматируем сумму с пробелами для тысяч
    const formattedAmount = formatAmount(incomeData.amount);
    
    // Создаем новую строку таблицы
    const newRow = `| ${incomeData.date} | ${incomeData.source} | ${formattedAmount} | ${incomeData.note || ''} |`;
    
    // Вставляем новую строку после последней строки данных (перед "Итого")
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
    
    // Находим секцию расходов и таблицу
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lineLower = line.toLowerCase();
        
        if (lineLower.includes('планируемые расходы') || lineLower.includes('плановые расходы') || (lineLower.includes('расходы') && !lineLower.includes('итого') && !lineLower.includes('оплаченные'))) {
            inExpensesSection = true;
            continue;
        }
        
        if (inExpensesSection && line.startsWith('|') && lineLower.includes('категория') && lineLower.includes('сумма')) {
            tableStartIndex = i;
            continue;
        }
        
        if (inExpensesSection && tableStartIndex >= 0 && line.startsWith('|---')) {
            tableEndIndex = i;
            continue;
        }
        
        // Если нашли строку "Итого" - вставляем ПЕРЕД ней
        if (inExpensesSection && tableStartIndex >= 0 && lineLower.includes('итого')) {
            tableEndIndex = i - 1; // Вставляем перед строкой "Итого"
            break;
        }
        // Если нашли следующую секцию (##), заканчиваем
        if (inExpensesSection && tableStartIndex >= 0 && (line.startsWith('##') && !lineLower.includes('расходы'))) {
            tableEndIndex = i - 1;
            break;
        }
    }
    
    if (tableStartIndex < 0 || tableEndIndex < 0) {
        throw new Error('Не удалось найти таблицу расходов в файле');
    }
    
    // Форматируем сумму с пробелами для тысяч
    const formattedAmount = formatAmount(expenseData.amount);
    
    // Создаем новую строку таблицы
    const newRow = `| ${expenseData.category} | ${formattedAmount} | ${expenseData.due_date || ''} | ${expenseData.note || ''} |`;
    
    // Вставляем новую строку ПЕРЕД строкой "Итого" (или в конец таблицы, если "Итого" нет)
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
    
    // Находим строку расхода в таблице "Планируемые расходы"
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.includes(category) && line.includes(String(amount).replace(/\s/g, ''))) {
            expenseLineIndex = i;
            break;
        }
    }
    
    if (expenseLineIndex < 0) {
        throw new Error('Расход не найден в таблице');
    }
    
    // Удаляем строку из планируемых расходов
    const expenseLine = lines[expenseLineIndex];
    lines.splice(expenseLineIndex, 1);
    
    // Находим секцию "Фактически оплаченные расходы"
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.includes('Фактически оплаченные расходы') || line.includes('Оплаченные расходы')) {
            paidSectionStart = i;
            continue;
        }
        
        if (paidSectionStart >= 0 && line.startsWith('|') && line.includes('Категория')) {
            continue;
        }
        
        if (paidSectionStart >= 0 && line.startsWith('|---')) {
            paidTableEnd = i;
            continue;
        }
        
        if (paidSectionStart >= 0 && paidTableEnd >= 0 && (line.startsWith('##') || line.includes('Оставшиеся'))) {
            paidTableEnd = i - 1;
            break;
        }
    }
    
    if (paidSectionStart < 0) {
        // Если секции нет, создаем её
        // Находим конец секции расходов
        let expensesEnd = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('Планируемые расходы')) {
                for (let j = i; j < lines.length; j++) {
                    if (lines[j].startsWith('##') && !lines[j].includes('Расходы')) {
                        expensesEnd = j;
                        break;
                    }
                }
                break;
            }
        }
        
        if (expensesEnd < 0) {
            expensesEnd = lines.length;
        }
        
        // Добавляем новую секцию
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
        // Парсим строку расхода и добавляем в секцию оплаченных
        const cells = expenseLine.split('|').map(c => c.trim()).filter(c => c);
        const newPaidRow = `| ${category} | ${formatAmount(amount)} | ${paymentDate || new Date().toLocaleDateString('ru-RU')} | ${cells[3] || ''} |`;
        
        if (paidTableEnd >= 0) {
            lines.splice(paidTableEnd + 1, 0, newPaidRow);
        } else {
            // Если нет таблицы, создаем её
            const tableHeader = [
                '',
                '| Категория | Сумма (руб.) | Дата оплаты | Примечание |',
