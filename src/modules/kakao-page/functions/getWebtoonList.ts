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
  
  // 1. GraphQL 에러 응답 확인 (이제 타입 에러 없이 작동)
  if (res.data.errors) {
    console.error('❌ [KAKAO_PAGE] GraphQL 쿼리 에러 발생:', res.data.errors);
    return webtoonList;
  }
  
  // 2. data 필드와 layout 필드의 존재 여부 확인 (TypeError 해결)
  // destructuring을 안전하게 사용하기 위해 한 줄에 처리합니다.
  const layout = res.data.data?.layout;

  if (!layout) {
    console.error('⚠️ [KAKAO_PAGE] 응답 데이터에 "layout" 필드가 없습니다. (data 필드: ', res.data.data, ')');
    // 이 로그를 통해 data 필드에 무엇이 들어있는지 최종적으로 확인할 수 있습니다.
    return webtoonList;
  }
  
  // 3. 웹툰 섹션 찾기
  const sections = layout.sections;
  const webtoonSection = sections.find(
    (section) => section.type === 'StaticLandingDayOfWeekSection'
  );

  if (!webtoonSection || webtoonSection.groups.length === 0) {
    console.error('⚠️ [KAKAO_PAGE] 웹툰 목록을 포함하는 섹션을 찾을 수 없습니다.');
    return webtoonList;
  }
  
  // 4. 아이템 추출
  const webtoonItems = webtoonSection.groups.flatMap(group => group.items);
  webtoonList.push(...webtoonItems);

  return webtoonList;
};
