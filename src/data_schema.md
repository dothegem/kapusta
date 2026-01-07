# Data Schema Kapusta MVP v1.0

## Tender
- id: UUID
- source: string (kontur, bidzaar)
- sourceTenderId: string (номер закупки с площадки)
- lawType: string (44-ФЗ, 223-ФЗ)
- nmc: number
- dates: { publication: date, submission: date }
- customer: { name: string, inn: string, kpp: string }
- contacts: { fio: string, phone: string, email: string }

## Deal (Сделка)
- id: UUID
- tenderId: UUID
- companyId: UUID (Связь с Company)
- stage: string (new, calculation, sent, won, lost)
- amount: number (Сумма КП)
- margin: number (Текущая маржа %)
- createdAt: ISOString

## Task (Задача) - НОВАЯ СУЩНОСТЬ
- id: UUID
- dealId?: UUID (Опциональная связь со сделкой)
- title: string (Например: "Позвонить заказчику")
- dueDate: ISOString (Срок)
- isDone: boolean
- assigneeId: string (ID текущего пользователя)

## Company (Контрагент)
- id: UUID
- name: string
- inn: string
- kpp: string
- contacts: [Contact]