# Experiment 1: Express.js Framework Evaluation

## 1. Overview

This experiment evaluates the proposed system's capability to automatically generate API documentation and integration tests for a REST API implemented using the Express.js framework.

## 2. Experimental Setup

### 2.1 Subject System

- **Framework**: Express.js v4.18.0
- **Language**: JavaScript (ES6)
- **Source**: Official Express.js tutorial
- **Domain**: Generic CRUD operations for resource management

### 2.2 System Characteristics

| Metric              | Value                  |
| ------------------- | ---------------------- |
| Total files         | 2                      |
| Source code files   | 1                      |
| Lines of code (LOC) | 46                     |
| API endpoints       | 6                      |
| HTTP methods        | GET, POST, PUT, DELETE |

### 2.3 Ground Truth

The subject system implements six REST API endpoints, as shown in Table 1.

### Table 1: API Endpoints in Subject System

| Endpoint ID | HTTP Method | Path             | Description                      |
| ----------- | ----------- | ---------------- | -------------------------------- |
| E1.1        | GET         | `/`              | Root endpoint returning greeting |
| E1.2        | GET         | `/api/items`     | Retrieve all items               |
| E1.3        | POST        | `/api/items`     | Create new item                  |
| E1.4        | GET         | `/api/items/:id` | Retrieve item by identifier      |
| E1.5        | PUT         | `/api/items/:id` | Update item by identifier        |
| E1.6        | DELETE      | `/api/items/:id` | Delete item by identifier        |

## 3. Execution Process

### 3.1 Phase 1: Candidate File Identification

The system analyzed all files in the project directory using the AI-based filename analysis component.

**Results:**

- Files analyzed: 2
- Candidates identified: 1
- Identification rate: 50%
- Identified file: `index.js`

**Analysis:** The system successfully identified the main application file despite its generic naming convention, demonstrating the effectiveness of the AI-based approach over pattern-matching strategies.

### 3.2 Phase 2: Content-Based Confirmation

The identified candidate was analyzed based on source code content.

**Results:**

- Candidates processed: 1
- Candidates confirmed: 1
- Confirmation rate: 100%

**Analysis:** The content analysis successfully confirmed the presence of REST API definitions in the identified file.

### 3.3 Phase 3: Endpoint Extraction

The system extracted API endpoint information from the confirmed file using the LLM-based code analysis component.

### Table 2: Endpoint Extraction Results

| Ground Truth ID | Extracted | Path Correct | Method Correct | Schema Correct |
| --------------- | --------- | ------------ | -------------- | -------------- |
| E1.1            | Yes       | Yes          | Yes            | Yes            |
| E1.2            | Yes       | Yes          | Yes            | Yes            |
| E1.3            | Yes       | Yes          | Yes            | Yes            |
| E1.4            | Yes       | Yes          | Yes            | Yes            |
| E1.5            | Yes       | Yes          | Yes            | Yes            |
| E1.6            | Yes       | Yes          | Yes            | Yes            |

**Results:**

- Endpoints extracted: 6
- Correct extractions: 6
- Incorrect extractions: 0
- Missed endpoints: 0

### 3.4 Phase 4: Artifact Generation

The system generated two primary artifacts:

1. **OpenAPI Specification (JSON)**
   - Format: OpenAPI 3.0.0
   - Size: ~5KB
   - Validity: Valid (verified against OpenAPI schema)

2. **Integration Test Suite (TypeScript)**
   - Test framework: Jest
   - Files generated: 3
   - Total test cases: Approximately 18

## 4. Evaluation Metrics

### 4.1 Accuracy Metrics

The following metrics were calculated to assess the system's performance:

```text
True Positives (TP) = 6
False Positives (FP) = 0
False Negatives (FN) = 0

Precision = TP / (TP + FP) = 6 / 6 = 1.00 (100%)
Recall = TP / (TP + FN) = 6 / 6 = 1.00 (100%)
F1-Score = 2 × (Precision × Recall) / (Precision + Recall) = 1.00 (100%)
```

### 4.2 Performance Metrics

- **Total execution time**: ~2 seconds
- **Time per endpoint**: ~0.33 seconds
- **API calls to LLM**: 4 (1 for filename check, 1 for confirmation, 2 for extraction and test generation)

### 4.3 Quality Assessment

The generated OpenAPI specification was evaluated against the following criteria:

| Criterion                     | Result  |
| ----------------------------- | ------- |
| Valid JSON                    | ✓ Pass |
| OpenAPI 3.0 compliant         | ✓ Pass |
| All endpoints documented      | ✓ Pass |
| HTTP methods correct          | ✓ Pass |
| Path parameters identified    | ✓ Pass |
| Request schemas present       | ✓ Pass |
| Response schemas present      | ✓ Pass |
| Appropriate HTTP status codes | ✓ Pass |

## 5. Generated Artifacts Analysis

### 5.1 OpenAPI Specification Quality

The generated specification demonstrated high quality across multiple dimensions:

1. **Structural Completeness**: All required OpenAPI fields present (`openapi`, `info`, `paths`)
2. **Schema Inference**: Correct identification of data types (integer, string, array)
3. **Parameter Detection**: Proper conversion of Express route parameters (`:id` → `{id}`)
4. **HTTP Semantics**: Appropriate status codes (200 for GET, 201 for POST)
5. **Content Type Recognition**: Correct differentiation between `text/plain` and `application/json`

### 5.2 Test Suite Characteristics

The generated integration tests exhibited the following properties:

- Proper Jest test structure with `describe` and `it` blocks
- Appropriate use of HTTP client (axios)
- Coverage of all identified endpoints
- Parameterized tests for dynamic route segments
- TypeScript type safety

## 6. Discussion

### 6.1 Strengths Observed

1. **Generic File Recognition**: Successfully identified API file with non-descriptive name (`index.js`)
2. **Perfect Accuracy**: Achieved 100% precision and recall
3. **Rich Schema Extraction**: Inferred data types without explicit annotations
4. **Framework Understanding**: Correctly interpreted Express.js routing patterns

### 6.2 Limitations

No significant limitations were observed in this experiment. The system performed optimally on the Express.js codebase.

### 6.3 Threats to Validity

- **Internal Validity**: Single example from Express.js tutorial may not represent all Express.js applications
- **External Validity**: Results may not generalize to other frameworks or larger codebases
- **Construct Validity**: Manual verification of correctness may introduce subjective bias

## 7. Conclusion

Experiment 1 demonstrated successful automatic generation of API documentation and integration tests for an Express.js application. The system achieved perfect accuracy (Precision = 100%, Recall = 100%) and generated valid, comprehensive OpenAPI specifications.

**Key Findings:**

- AI-based approach successfully handles generic file names
- LLM effectively extracts API semantics from JavaScript code
- Generated artifacts meet industry standards (OpenAPI 3.0)
- Execution time is acceptable for practical use (~2 seconds)
  