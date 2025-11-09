import axios from 'axios';
import axiosRetry from 'axios-retry';

const kakaoPageApi = axios.create({
  baseURL: 'https://page.kakao.com/graphql',
  headers: {
    'Content-Type': 'application/json',
    //! Referer를 설정하지 않으면 403 에러 발생
    Referer: 'https://page.kakao.com',
  },
  timeout: 30_000,
});

axiosRetry(kakaoPageApi, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 3_000,
  onRetry: (retry, _, config) => {
    console.error(`🚧 [KAKAO_PAGE] ${config.url} - retry: ${retry}`);
  },
});

// 🚨 인터페이스 재정의: Layout 쿼리 응답 구조에 맞게 변경
export interface KakoPageLayoutItem {
  seriesId: number;
  statusBadge: 'BadgeUpStatic' | null;
  // Item fragment에 있는 필요한 다른 필드(title, thumbnail 등)를 추가해야 합니다.
}

// GraphQL Error 타입 (GraphQL 서버에서 에러 발생 시 반환하는 표준 구조)
export interface GraphQLError {
  message: string;
  locations?: { line: number; column: number }[];
  path?: string[];
  extensions?: Record<string, any>;
}

// 🚨 GetMainLayoutResponse 인터페이스를 수정합니다.
export interface GetMainLayoutResponse {
  // 성공 응답 시 포함되는 필드
  data: {
    layout: {
      sections: Array<{
        type: string;
        isEnd?: boolean;
        groups: Array<{
          items: KakoPageLayoutItem[];
        }>;
      }>;
    };
  };
  // 🚨 에러 응답 시 포함되는 필드를 옵셔널(?)로 추가합니다.
  errors?: GraphQLError[]; 
}

/**
 * @description: 기존 staticLandingGenreSection 대신 main layout 쿼리를 사용합니다.
 * screenUid: 51은 '웹툰 - 지금 핫한' 섹션에 해당합니다.
 */
// page 인자는 더 이상 사용하지 않지만, 기존 호출 로직 유지를 위해 남겨둡니다.
export const getKakaoPageWebtoonList = (page?: number) => {
  console.info(`⌛️ [KAKAO_PAGE] 웹툰 리스트 정보 요청 (Main Layout 쿼리 - screenUid: 51)`);
  
  return kakaoPageApi.post<GetMainLayoutResponse>('', {
    // 🚨 쿼리 전체를 고객님이 제공해주신 'main' 쿼리 전문으로 교체합니다.
    query: `
      query main($screenUid: Int!, $type: LayoutType) {
        layout(screenUid: $screenUid, type: $type) {
          ...Layout
        }
      }
      
      // ... (이 아래로 모든 Fragment를 포함한 전체 쿼리 문자열을 붙여넣습니다.)
      
    `,
    // 🚨 변수를 '지금 핫한'에 해당하는 screenUid: 51로 고정합니다.
    variables: { 
      screenUid: 51, 
      type: 'LAYOUT',
    },
    operationName: 'main',
  });
};

interface GetContentHomeOverviewResponse {
  data: {
    contentHomeOverview: {
      content: {
        bm: 'FreePreview' | 'PayWaitfree' | 'Pay';
        /**
         * @example 180
         */
        waitfreePeriodByMinute: number;
        /** 제목 */
        title: string;
        /**
         * @description 연재 요일
         * @example "월, 화, 일"
         */
        pubPeriod: string | null;
        ageGrade: 'Fifteen' | 'All' | 'Nineteen';
        /**
         * @example "권오준,ab studio"
         */
        authors: string;
        /**
         * @example 'Eng' - 완결,  'Ing' - 연재중
         */
        onIssue: 'End' | 'Ing';

        /**
         * @example "//page-images.kakaoentcdn.com/download/resource?kid=0h4rE/hAd4IJY30B/NBtri5kBVHSArCkBBOKtf1&filename=o1"
         */
        thumbnail: string;
      };
    };
  };
}

export const getContentHomeOverview = (seriesId: number) => {
  console.info(`⌛️ [KAKAO_PAGE] seriesId: ${seriesId} - 웹툰 상세 정보 요청`);
  return kakaoPageApi.post<GetContentHomeOverviewResponse>('', {
    query:
      'query contentHomeOverview($seriesId: Long!) {\n  contentHomeOverview(seriesId: $seriesId) {\n    id\n    seriesId\n    displayAd {\n      ...DisplayAd\n      ...DisplayAd\n      ...DisplayAd\n      __typename\n    }\n    content {\n      ...SeriesFragment\n      __typename\n    }\n    displayAd {\n      ...DisplayAd\n      __typename\n    }\n    lastNoticeDate\n    moreButton {\n      type\n      scheme\n      title\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment DisplayAd on DisplayAd {\n  sectionUid\n  bannerUid\n  treviUid\n  momentUid\n}\n\nfragment SeriesFragment on Series {\n  id\n  seriesId\n  title\n  thumbnail\n  categoryUid\n  category\n  categoryType\n  subcategoryUid\n  subcategory\n  badge\n  isAllFree\n  isWaitfree\n  ageGrade\n  state\n  onIssue\n  authors\n  description\n  pubPeriod\n  freeSlideCount\n  lastSlideAddedDate\n  waitfreeBlockCount\n  waitfreePeriodByMinute\n  bm\n  saleState\n  startSaleDt\n  serviceProperty {\n    ...ServicePropertyFragment\n    __typename\n  }\n  operatorProperty {\n    ...OperatorPropertyFragment\n    __typename\n  }\n  assetProperty {\n    ...AssetPropertyFragment\n    __typename\n  }\n}\n\nfragment ServicePropertyFragment on ServiceProperty {\n  viewCount\n  readCount\n  ratingCount\n  ratingSum\n  commentCount\n  pageContinue {\n    ...ContinueInfoFragment\n    __typename\n  }\n  todayGift {\n    ...TodayGift\n    __typename\n  }\n  preview {\n    ...PreviewFragment\n    ...PreviewFragment\n    ...PreviewFragment\n    __typename\n  }\n  waitfreeTicket {\n    ...WaitfreeTicketFragment\n    __typename\n  }\n  isAlarmOn\n  isLikeOn\n  ticketCount\n  purchasedDate\n  lastViewInfo {\n    ...LastViewInfoFragment\n    __typename\n  }\n  purchaseInfo {\n    ...PurchaseInfoFragment\n    __typename\n  }\n  preview {\n    ...PreviewFragment\n    __typename\n  }\n}\n\nfragment ContinueInfoFragment on ContinueInfo {\n  title\n  isFree\n  productId\n  lastReadProductId\n  scheme\n  continueProductType\n  hasNewSingle\n  hasUnreadSingle\n}\n\nfragment TodayGift on TodayGift {\n  id\n  uid\n  ticketType\n  ticketKind\n  ticketCount\n  ticketExpireAt\n  ticketExpiredText\n  isReceived\n  seriesId\n}\n\nfragment PreviewFragment on Preview {\n  item {\n    ...PreviewSingleFragment\n    __typename\n  }\n  nextItem {\n    ...PreviewSingleFragment\n    __typename\n  }\n  usingScroll\n}\n\nfragment PreviewSingleFragment on Single {\n  id\n  productId\n  seriesId\n  title\n  thumbnail\n  badge\n  isFree\n  ageGrade\n  state\n  slideType\n  lastReleasedDate\n  size\n  pageCount\n  isHidden\n  remainText\n  isWaitfreeBlocked\n  saleState\n  operatorProperty {\n    ...OperatorPropertyFragment\n    __typename\n  }\n  assetProperty {\n    ...AssetPropertyFragment\n    __typename\n  }\n}\n\nfragment OperatorPropertyFragment on OperatorProperty {\n  thumbnail\n  copy\n  helixImpId\n  isTextViewer\n  selfCensorship\n}\n\nfragment AssetPropertyFragment on AssetProperty {\n  bannerImage\n  cardImage\n  cardTextImage\n  cleanImage\n  ipxVideo\n}\n\nfragment WaitfreeTicketFragment on WaitfreeTicket {\n  chargedPeriod\n  chargedCount\n  chargedAt\n}\n\nfragment LastViewInfoFragment on LastViewInfo {\n  isDone\n  lastViewDate\n  rate\n  spineIndex\n}\n\nfragment PurchaseInfoFragment on PurchaseInfo {\n  purchaseType\n  rentExpireDate\n  expired\n}\n',
    operationName: 'contentHomeOverview',
    variables: { seriesId },
  });
};
