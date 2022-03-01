# ✅ Feature: Complex

## ✅ Scenario: Scenario one
> **Given** this background   
> **Given** this scenario   
> **When** a table

| B  | C  |
| -- | -- |
| 1  | 2  |
| -1 | -2 |
   
> **Then** expect text
```text
some text
```
<br/>

## 🤷 Scenario: Skipped Scenario two
> **Given** this background   
> **Given** no steps<br/>

## ❌ Scenario: Scenario outline 1
> **Given** this background   
> **Given** given 1   
> **When** when   
> **And** and 1 2   
> **Then** then 2<br/>

## ❌ Scenario: Scenario outline 3
> **Given** this background   
> **Given** given 3   
> **When** when   
> **And** and 3 4   
> **Then** then 4

# ✅ Feature: Simple

## ✅ Scenario: Simple scenario
> **Given** this scenarion   
> **Then** all is well