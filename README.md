# AutoGen: API Docs + API tests

## Running

- Start development server: `npm run dev`
- Lint code: `npm run lint`
- Format code: `npm run format`
- Dev with lint-watch: `npm run start:dev`
- Run tests: `npm run test`

## Running with Docker

- Start dev environment: `docker-compose up --build`
- Build production image: `docker build -t your-app-name --target production .`
- Run production image: `docker run -p 3000:3000 your-app-name`