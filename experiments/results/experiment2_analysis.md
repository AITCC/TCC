# Experiment 2: NestJS Framework Evaluation

## 1. Overview

This experiment evaluates the system's capability to handle TypeScript-based frameworks with decorator patterns, specifically NestJS.

## 2. Experimental Setup

### 2.1 Subject System

- **Framework**: NestJS v10.0.0
- **Language**: TypeScript
- **Paradigm**: Decorator-based routing
- **Source**: NestJS official documentation patterns

### 2.2 System Characteristics

| Metric              | Value                                                  |
| ------------------- | ------------------------------------------------------ |
| Total files         | 2                                                      |
| Source code files   | 1                                                      |
| Lines of code (LOC) | 51                                                     |
| API endpoints       | 5                                                      |
| HTTP methods        | GET, POST, PUT, DELETE                                 |
| Decorators used     | @Controller, @Get, @Post, @Put, @Delete, @Param, @Body |

### 2.3 Ground Truth

### Table 1: API Endpoints in Subject System

| Endpoint ID | HTTP Method | Path             | Decorator      |
| ----------- | ----------- | ---------------- | -------------- |
| E2.1        | GET         | `/api/items`     | @Get()         |
| E2.2        | POST        | `/api/items`     | @Post()        |
| E2.3        | GET         | `/api/items/:id` | @Get(':id')    |
| E2.4        | PUT         | `/api/items/:id` | @Put(':id')    |
| E2.5        | DELETE      | `/api/items/:id` | @Delete(':id') |

## 3. Execution Process

### 3.1 Phase 1: Candidate File Identification

**Results:**

- Files analyzed: 2
- Candidates identified: 1
- Identified file: `items.controller.ts`

**Analysis:** The system correctly identified the controller file based on the `.controller.ts` naming convention common in NestJS applications.

### 3.2 Phase 2: Content-Based Confirmation

**Results:**

- Candidates confirmed: 1
- Confirmation rate: 100%

### 3.3 Phase 3: Endpoint Extraction

#### Table 2: Endpoint Extraction Results

| Ground Truth ID | Extracted | Decorator Recognized | Path Correct | Method Correct | Schema Correct |
| --------------- | --------- | -------------------- | ------------ | -------------- | -------------- |
| E2.1            | Yes       | Yes                  | Yes          | Yes            | Yes            |
| E2.2            | Yes       | Yes                  | Yes          | Yes            | Yes            |
| E2.3            | Yes       | Yes                  | Yes          | Yes            | Yes            |
| E2.4            | Yes       | Yes                  | Yes          | Yes            | Yes            |
| E2.5            | Yes       | Yes                  | Yes          | Yes            | Yes            |

**Results:**

- Endpoints extracted: 5
- Correct extractions: 5
- Decorator patterns recognized: 100%

### 3.4 Phase 4: Artifact Generation

- OpenAPI specification: Valid (OpenAPI 3.0.0)
- Integration test files: 2
- Test framework: Jest + TypeScript

## 4. Evaluation Metrics

### 4.1 Accuracy Metrics

True Positives (TP) = 5
False Positives (FP) = 0
False Negatives (FN) = 0

Precision = 5 / 5 = 1.00 (100%)
Recall = 5 / 5 = 1.00 (100%)
F1-Score = 1.00 (100%)

### 4.2 Performance Metrics

- Total execution time: ~2 seconds
- Time per endpoint: ~0.40 seconds

## 5. Generated Artifacts Analysis

### 5.1 Decorator Pattern Recognition

The system successfully interpreted TypeScript decorators:

1. **Controller-level decorator**: `@Controller('api/items')` correctly identified as base path
2. **Method decorators**: All HTTP method decorators recognized
3. **Parameter decorators**: `@Param()` and `@Body()` properly mapped to OpenAPI parameters
4. **Route parameters**: `:id` syntax correctly converted to `{id}` in OpenAPI

### 5.2 TypeScript Type Inference

The system demonstrated understanding of TypeScript features:

- Interface definitions (`Item` interface)
- Type annotations (`@Param('id') id: string`)
- Return types (`Item[]`, `Item`)
- Partial types (`Partial<Item>`)

### 5.3 HTTP Status Code Accuracy

Appropriate status codes for each operation:

- GET operations: 200 OK
- POST operation: 201 Created ✓ (semantically correct)
- PUT operation: 200 OK
- DELETE operation: 200 OK

## 6. Discussion

### 6.1 Strengths Observed

1. **Decorator Pattern Understanding**: Successfully parsed modern TypeScript decorator syntax
2. **Framework-Specific Conventions**: Recognized NestJS naming patterns (`.controller.ts`)
3. **Type System Awareness**: Utilized TypeScript type information for schema generation
4. **Perfect Accuracy**: Maintained 100% precision and recall from Experiment 1

### 6.2 Comparison with Experiment 1

| Aspect        | Express.js (E1) | NestJS (E2)     |
| ------------- | --------------- | --------------- |
| Language      | JavaScript      | TypeScript      |
| Routing Style | Function-based  | Decorator-based |
| Precision     | 100%            | 100%            |
| Recall        | 100%            | 100%            |
| Endpoints     | 6               | 5               |
| LOC           | 46              | 51              |

Both frameworks achieved identical accuracy, demonstrating the system's framework-agnostic capability.

### 6.3 Threats to Validity

- Limited to single controller class
- Does not test module composition or dependency injection
- May not represent complex NestJS architectural patterns

## 7. Conclusion

Experiment 2 validated the system's capability to handle TypeScript-based frameworks with decorator patterns. The LLM successfully interpreted NestJS-specific syntax and generated accurate OpenAPI specifications.

**Key Findings:**

- Decorator pattern recognition: 100% success
- TypeScript type inference: Functional
- Framework portability: Confirmed (Express.js → NestJS)
- Consistent performance: ~2 seconds execution time

**Implications:**

- The AI-based approach generalizes across different programming paradigms
- No framework-specific parsers required
- System handles both JavaScript and TypeScript effectively
