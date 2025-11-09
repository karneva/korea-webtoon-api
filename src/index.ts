import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";

import { AppDataSource } from "./database/datasource";
import { specs } from "./swagger";
import { ROUTES } from "./constants";

import { putNaver } from "./routes/update/naver";
import { putKakao } from "./routes/update/kakao";
import { putKakaoPage } from "./routes/update/kakao-page";
import { getHealthCheck } from "./routes/health-check";
import { getWebtoons } from "./routes/webtoons";

const app = express();

// 미들웨어는 라우트 등록 전에 선적용
app.use(cors({ origin: "*" }));
app.use(express.json());

// Swagger 및 기본 루트
app.use(ROUTES.SWAGGER, swaggerUi.serve, swaggerUi.setup(specs));
app.get("/", (_req, res) => res.redirect(ROUTES.SWAGGER));

// 헬스체크는 가장 가볍게
app.get(ROUTES.HEALTH_CHECK, getHealthCheck);

// API 라우트
app.put(ROUTES.UPDATE_NAVER, putNaver);
app.put(ROUTES.UPDATE_KAKAO, putKakao);
app.put(ROUTES.UPDATE_KAKAO_PAGE, putKakaoPage);
app.get(ROUTES.GET_WEBTOONS, getWebtoons);

// Render가 주입하는 포트 사용. 로컬에선 3000 기본값
const PORT = Number(process.env.PORT) || 3000;

/* ▼▼▼ 핵심 수정 사항 ▼▼▼ 
  - 아래의 중복된 app.listen() 호출을 제거합니다.
  - 데이터베이스가 초기화된 후 bootstrap() 내부에서만 서버를 시작해야 합니다.
*/
// app.listen(PORT, () => {
//   console.log(`Server listening on port ${PORT}`);
// });

async function bootstrap() {
  try {
    await AppDataSource.initialize();

    // idempotent하게 VIEW 재생성
    await AppDataSource.query("DROP VIEW IF EXISTS normalized_webtoon");
    await AppDataSource.query(`
      CREATE VIEW normalized_webtoon AS
      SELECT id, title, provider, updateDays, url, thumbnail, isEnd, isFree, isUpdated, ageGrade, freeWaitHour, authors FROM naver_webtoon
      UNION ALL
      SELECT id, title, provider, updateDays, url, thumbnail, isEnd, isFree, isUpdated, ageGrade, freeWaitHour, authors FROM kakao_webtoon
      UNION ALL
      SELECT id, title, provider, updateDays, url, thumbnail, isEnd, isFree, isUpdated, ageGE, freeWaitHour, authors FROM kakao_page_webtoon;
    `);

    // 데이터베이스 초기화 성공 후 서버 시작
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // 그레이스풀 셧다운
    const shutdown = async (signal: string) => {
      try {
        console.log(`${signal} received. Shutting down gracefully...`);
        server.close();
        if (AppDataSource.isInitialized) {
          await AppDataSource.destroy();
        }
      } catch (e) {
        console.error("Error during shutdown:", e);
      } finally {
        process.exit(0);
      }
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (err) {
    console.error("Failed to initialize datasource:", err);
    // 초기화 실패 시 1로 종료하여 Render가 재시작하게 함
    process.exit(1);
  }
}

bootstrap();