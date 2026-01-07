window.Calculator = window.Calculator || {};

/**
 * Основная функция расчета по ТЗ api-calc.md
 * @param {Object} input - Входные данные
 * @param {number} input.baseAmount - ИТОГО охрана + доп.расходы (себестоимость "грязная" или прямые затраты)
 * @param {Object} input.workload - { posts, shifts, hoursPerPost }
 * @param {string[]} input.schemaSet - Массив кодов схем ['BEL_USN', 'SER_NDS'...]
 * @returns {Object} Output
 */
window.Calculator.calc = (input) => {
    const c = window.Rules.constants; // Берем ставки из rules.js
    const results = [];

    // Вспомогательная функция округления
    const r = (n) => Math.round(n * 100) / 100;

    // Расчет общих показателей нагрузки
    const totalHours = input.workload.posts * input.workload.shifts * input.workload.hoursPerPost;
    
    input.schemaSet.forEach(schemaCode => {
        let res = { schemaCode, aggregates: {}, breakdown: [] };
        
        // БАЗОВАЯ ЛОГИКА (УПРОЩЕННАЯ ПОД MVP)
        // Предполагаем, что baseAmount - это ФОТ (на руки) + Прямые расходы.
        // Нам нужно "накрутить" налоги и маржу чтобы получить цену контракта.

        let revenue = 0;
        let taxes = 0;
        let profit = 0;
        let expenses = input.baseAmount;

        // Пример реализации логики схем (нужно откалибровать формулы под ваши реальные формулы)
        if (schemaCode === 'BEL_USN') {
            // УСН 6% (Доходы)
            // Формула: Revenue = (Expenses + Profit) / (1 - TaxRate)
            // Пусть целевая маржа 15% (по умолчанию для расчета)
            const targetMargin = 0.15;
            revenue = r(input.baseAmount / (1 - c.usnRatePercent/100 - targetMargin));
            
            taxes = r(revenue * (c.usnRatePercent / 100)); // Налог УСН
            // Страховые взносы (30.2%) считаем от части baseAmount, которая является ФОТ
            // Для упрощения считаем их внутри expenses или добавляем здесь, если baseAmount это "чистый ФОТ"
        } 
        else if (schemaCode === 'BEL_NDS') {
            // ОСНО: НДС 20% (в т.ч.) + Налог на прибыль 25%
            // RevenueWithVAT
            const vatRate = c.osnRatePercent / 100; // 0.20 или 0.22
            revenue = r(input.baseAmount * 1.4); // Грубая прикидка для примера
            
            const vat = r(revenue * vatRate / (1 + vatRate));
            taxes = vat; 
        }
        // ... добавить остальные схемы (SER_USN, IP_NDS) по аналогии

        profit = revenue - expenses - taxes;
        const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
        const avgRate = totalHours > 0 ? r(revenue / totalHours) : 0;

        res.aggregates = {
            total: revenue,
            margin: r(margin),
            taxes: taxes,
            profitCash: profit, // В MVP пока не делим кэш/безнал детально
            profitCashless: 0,
            vat: schemaCode.includes('NDS') ? taxes : 0, // Условно
            avgRate: avgRate,
            fot: input.baseAmount, // Условно считаем базой
            otherExpenses: 0
        };

        // Breakdown для Excel/Таблицы (Строки)
        res.breakdown.push({ name: 'Себестоимость (База)', value: input.baseAmount });
        res.breakdown.push({ name: 'Налоги', value: taxes });
        res.breakdown.push({ name: 'Прибыль', value: profit });

        results.push(res);
    });

    return { calculations: results };
};