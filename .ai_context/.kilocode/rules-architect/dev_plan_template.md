# Шаблон Плана Разработки (Development Plan)

$START_DEV_PLAN

**PURPOSE:** [Основная цель и назначение этого плана разработки.]

---

### 1. Draft Code Graph (Черновой Граф Кода)

<!-- 
ИИ-Агент: Этот блок должен быть в формате XML. 
Опиши здесь высокоуровневую структуру новых или изменяемых компонентов, 
используя правила из спецификации для генерации графа.
-->

```xml
<DraftCodeGraph>
  <MyComponent_py FILE="path/to/component.py" TYPE="COMPONENT_TYPE">
    <annotation>Описание компонента.</annotation>
    <MyComponent_MyClass_CLASS NAME="MyClass" TYPE="IS_CLASS_OF_MODULE">
      <annotation>Описание класса.</annotation>
      <MyComponent_MyClass_my_method_METHOD NAME="my_method" TYPE="IS_METHOD_OF_CLASS">
        <annotation>Описание метода.</annotation>
        <CrossLinks>
          <Link TARGET="OtherComponent_OtherClass_other_method_METHOD" TYPE="CALLS_METHOD" />
        </CrossLinks>
      </MyComponent_MyClass_my_method_METHOD>
    </MyComponent_MyClass_CLASS>
  </MyComponent_py>
</DraftCodeGraph>
```

---

### 2. Step-by-step Data Flow (Пошаговый Поток Данных)

<!-- 
ИИ-Агент: Опиши здесь ключевые алгоритмы в виде пошаговой последовательности. 
Проведи мысленную имитацию, чтобы убедиться в логической состоятельности.
-->

1.  **Шаг 1:** [Описание первого шага алгоритма.]
2.  **Шаг 2:** [Описание второго шага, включая трансформацию данных.]
3.  **Шаг 3:** [Описание заключительного шага.]

---

### 3. Acceptance Criteria (Критерии Приемки)

<!-- 
ИИ-Агент: Перечисли здесь четкие, измеримые критерии, по которым можно будет 
проверить, что задача выполнена успешно.
-->

- [ ] **Критерий 1:** [Описание первого критерия.]
- [ ] **Критерий 2:** [Описание второго критерия.]

$END_DEV_PLAN