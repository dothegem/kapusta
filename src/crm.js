// src/crm.js
window.CRM = window.CRM || {};

// "Таблицы"
const DB_KEYS = {
    DEALS: 'db_deals',
    COMPANIES: 'db_companies',
    TASKS: 'db_tasks'
};

// === CRUD для СДЕЛОК (Deals) ===

window.CRM.createDeal = async (tenderData, calculationData) => {
    const deals = await getDB(DB_KEYS.DEALS);
    
    const newDeal = {
        id: crypto.randomUUID(),
        tenderId: tenderData.id || crypto.randomUUID(), // Если тендер не сохранен отдельно
        // companyId связываем через ИНН
        companyId: await window.CRM.getOrCreateCompanyId(tenderData.customer), 
        stage: 'new',
        amount: calculationData.aggregates?.total || 0,
        margin: calculationData.aggregates?.margin || 0,
        tenderDataSnapshot: tenderData, // Храним слепок тендера внутри для простоты
        createdAt: new Date().toISOString()
    };
    
    deals.push(newDeal);
    await saveDB(DB_KEYS.DEALS, deals);
    return newDeal;
};

window.CRM.getDeals = async () => {
    return await getDB(DB_KEYS.DEALS);
};

// === CRUD для ЗАДАЧ (Tasks) ===

window.CRM.createTask = async (taskInput) => {
    // taskInput: { dealId, title, dueDate }
    const tasks = await getDB(DB_KEYS.TASKS);
    
    const newTask = {
        id: crypto.randomUUID(),
        dealId: taskInput.dealId || null,
        title: taskInput.title,
        dueDate: taskInput.dueDate,
        isDone: false,
        createdAt: new Date().toISOString()
    };
    
    tasks.push(newTask);
    await saveDB(DB_KEYS.TASKS, tasks);
    return newTask;
};

window.CRM.toggleTask = async (taskId) => {
    const tasks = await getDB(DB_KEYS.TASKS);
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.isDone = !task.isDone;
        await saveDB(DB_KEYS.TASKS, tasks);
    }
};

// === HELPER: Компании ===

window.CRM.getOrCreateCompanyId = async (customerData) => {
    if (!customerData || !customerData.inn) return null;
    
    const companies = await getDB(DB_KEYS.COMPANIES);
    let company = companies.find(c => c.inn === customerData.inn);
    
    if (!company) {
        company = {
            id: crypto.randomUUID(),
            name: customerData.name,
            inn: customerData.inn,
            kpp: customerData.kpp,
            contacts: [] // Можно добавить контакты из парсера
        };
        companies.push(company);
        await saveDB(DB_KEYS.COMPANIES, companies);
    }
    
    return company.id;
};

// === UTILS ===
async function getDB(key) {
    const result = await chrome.storage.local.get(key);
    return result[key] || [];
}

async function saveDB(key, data) {
    await chrome.storage.local.set({ [key]: data });
}