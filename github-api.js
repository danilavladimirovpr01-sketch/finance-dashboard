// GitHub API для работы с файлами напрямую
// Работает без backend - использует GitHub Raw API для чтения

const GITHUB_REPO = 'danilavladimirovpr01-sketch/finance-dashboard';
const GITHUB_BRANCH = 'main';
const GITHUB_RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}`;

// Путь к файлам с финансами в репозитории
const FINANCES_PATH = 'personal/Finances';

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
    // Убираем все кроме цифр и точки/запятой
    const cleaned = str.toString().replace(/[^\d.,]/g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
}

// Экспортируем функции
window.GitHubAPI = {
    getPlan,
    getFact,
    getFileFromGitHub
};
