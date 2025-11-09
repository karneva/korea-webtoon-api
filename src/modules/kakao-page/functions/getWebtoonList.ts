// src/modules/kakao-page/functions/getWebtoonList.ts

import {
  getKakaoPageWebtoonList,
  KakoPageLayoutItem,
} from './kakaoPageApi'; // 함수와 타입을 새 이름으로 import

/**
 * @description: 카카오페이지 웹툰 목록을 가져옵니다. 
 * 'main' 쿼리(screenUid: 51)는 단일 레이아웃을 반환하므로, 반복문 없이 한번만 호출합니다.
 */
export const getWebtoonList = async () => {
  const webtoonList: KakoPageLayoutItem[] = [];

  const res = await getKakaoPageWebtoonList();

  // 🚨 1. GraphQL 에러 응답 확인 (가장 중요)
  if (res.data.errors) {
    console.error('❌ [KAKAO_PAGE] GraphQL 쿼리 에러 발생. 서버 응답을 확인하세요.');
    console.error('GraphQL Errors:', res.data.errors);
    // 에러 발생 시 데이터 처리를 중단합니다.
    return webtoonList;
  }
  
  // 🚨 2. 안전한 접근 및 필드 확인 (Destructuring 대신 직접 접근)
  const data = res.data.data;

  // data 필드가 있고, 그 안에 layout 필드가 있는지 확인
  if (!data || !data.layout) {
    console.error('⚠️ [KAKAO_PAGE] 응답 데이터에 "layout" 필드가 없습니다.');
    // 현재 응답 데이터의 data 필드 내용을 출력하여 서버가 무엇을 보냈는지 확인합니다.
    console.error('res.data.data content:', data); 
    // 여기서 어떤 필드가 있는지 확인하면 screenUid: 51이 문제인지 파악할 수 있습니다.
    return webtoonList;
  }
  
  // 3. 성공적인 경우에만 Destructuring 및 로직 수행
  const { layout } = data; // 이제 안전하게 layout을 destructuring
  
  const sections = layout.sections; 

  const webtoonSection = sections.find(
    // 웹툰 목록을 포함하는 섹션 타입으로 찾습니다.
    (section) => section.type === 'StaticLandingDayOfWeekSection'
  );

  // ... (나머지 로직은 그대로 유지) ...
  if (!webtoonSection || webtoonSection.groups.length === 0) {
    console.error('⚠️ [KAKAO_PAGE] 웹툰 목록을 포함하는 섹션을 찾을 수 없습니다.');
    return webtoonList;
  }
  
  const webtoonItems = webtoonSection.groups.flatMap(group => group.items);
  webtoonList.push(...webtoonItems);

  return webtoonList;
};
