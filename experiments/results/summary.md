# Experiments Summary - TCC

## Overall Results

| ID  | Framework   | Language   | Files | LOC | Candidates | Confirmed | Endpoints | Extracted | Correct | Precision | Recall | F1-Score | Time |
| --- | ----------- | ---------- | ----- | --- | ---------- | --------- | --------- | --------- | ------- | --------- | ------ | -------- | ---- |
| E1  | Express.js  | JavaScript | 2     | 46  | 1          | 1         | 6         | 6         | 6       | 100%      | 100%   | 100%     | ~2s  |
| E2  | NestJS      | TypeScript | 2     | 51  | 1          | 1         | 5         | 5         | 5       | 100%      | 100%   | 100%     | ~2s  |
| E3  | FastAPI     | Python     | -     | -   | -          | -         | -         | -         | -       | -         | -      | -        | -    |
| E4  | Spring Boot | Java       | -     | -   | -          | -         | -         | -         | -       | -         | -      | -        | -    |
| E5  | Flask       | Python     | -     | -   | -          | -         | -         | -         | -       | -         | -      | -        | -    |

## Legend

- **Files**: Total files in project
- **LOC**: Lines of Code
- **Candidates**: Files identified in Phase 1
- **Confirmed**: Files confirmed in Phase 2
- **Endpoints**: Total API endpoints in source code
- **Extracted**: Endpoints extracted by system
- **Correct**: Correctly extracted endpoints
