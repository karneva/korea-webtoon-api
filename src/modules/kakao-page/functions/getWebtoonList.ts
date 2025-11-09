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

  // 🚨 반복문 제거 (이전 대화에서 이미 제거됨)
  const res = await getKakaoPageWebtoonList();

  // 🚨🚨🚨 수정된 부분: res.data.data.layout을 통해 접근합니다. 🚨🚨🚨
  const { layout } = res.data.data;
  const sections = layout.sections; 

  // 새로운 파싱 로직: sections 배열에서 목록을 담고 있는 섹션을 찾습니다.
  // '지금 핫한' 섹션은 보통 요일별(DayOfWeek) 섹션과 동일한 구조를 가집니다.
  const webtoonSection = sections.find(
    (section) => section.type === 'StaticLandingDayOfWeekSection'
  );

  if (!webtoonSection || webtoonSection.groups.length === 0) {
    console.error('⚠️ [KAKAO_PAGE] 웹툰 목록을 포함하는 섹션을 찾을 수 없습니다.');
    return webtoonList;
  }
  
  // 모든 그룹의 아이템을 합칩니다.
  const webtoonItems = webtoonSection.groups.flatMap(group => group.items);
  
  webtoonList.push(...webtoonItems);

  return webtoonList;
};
