// @/modules/kakao-page.ts (가정) 파일 내에서
// 새로운 API 함수와 타입(이전 대화에서 제안된 이름)을 import 합니다.
import {
  getKakaoPageWebtoonList,
  KakoPageLayoutItem, // 🚨 기존 KakoPageStaticLandingGenreSectionItem 대신 새 타입을 사용합니다.
  GetMainLayoutResponse, // 응답 타입도 import 하는 것이 좋습니다.
} from './kakaoPageApi';

/**
 * @description: 카카오페이지 웹툰 목록을 가져옵니다. 
 * 'main' 쿼리(screenUid: 51)는 단일 레이아웃을 반환하므로, 반복문 없이 한번만 호출합니다.
 */
export const getWebtoonList = async () => {
  // 🚨 배열 타입 변경
  const webtoonList: KakoPageLayoutItem[] = [];

  // 🚨 1. 반복문 제거: 새로운 쿼리는 페이지네이션을 사용하지 않습니다.
  const res = await getKakaoPageWebtoonList();

  const sections = res.data.layout.sections;

  // 🚨 2. 새로운 파싱 로직: sections 배열에서 목록을 담고 있는 섹션을 찾습니다.
  // 'StaticLandingDayOfWeekSection'가 웹툰 리스트를 포함하는 일반적인 섹션 타입입니다.
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

  // isEnd 체크도 이제 필요 없습니다.

  return webtoonList;
};
