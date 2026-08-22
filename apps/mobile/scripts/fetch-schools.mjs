#!/usr/bin/env node
/**
 * 공공데이터포털 "전국대학및전문대학정보표준데이터" API를 1회 호출해
 * src/data/schools.ts 의 SCHOOL_LIST를 전국 대학/전문대학 전체 목록으로 재생성한다.
 *
 * 이 스크립트는 온보딩 시점마다 API를 호출하지 않는다 — 결과를 정적 TS 파일로
 * 커밋해두고, 학교 목록을 갱신하고 싶을 때(연 1~2회 정도)만 다시 실행한다.
 *
 * 사용법 (키 발급 방법은 docs/school-list-data-source.md 참고):
 *   SCHOOL_API_KEY=발급받은_디코딩_서비스키 node scripts/fetch-schools.mjs
 *
 * 참고: 이 API는 "폐교" 여부를 나타내는 필드를 제공하지 않는다. 실제로 서남대,
 * 한중대 등 이미 폐교된 학교가 데이터에 그대로 남아있는 것을 확인했으나, 반대로
 * (Wikipedia 등에서 수집한) 폐교 후보 목록을 기준으로 자동 제외를 시도했더니
 * 국립강릉원주대학교·전남도립대학교처럼 현재 실제 운영 중인 학교까지 잘못
 * 걸러지는 오탐이 발견되어, 이 스크립트는 폐교 여부로 필터링하지 않는다.
 * (누락되어 자동완성에 안 뜨는 것보다, 이미 폐교된 학교가 하나 더 보이는 쪽의
 * 리스크가 훨씬 작다는 판단 — 목록에 없는 학교는 화면의 "직접 입력하기"로 보완됨)
 */

const API_KEY = process.env.SCHOOL_API_KEY;
const BASE_URL = 'https://api.data.go.kr/openapi/tn_pubr_public_univ_info_api';
const NUM_OF_ROWS = 1000;
const INSPECT = process.argv.includes('--inspect');
const OUTPUT_PATH = new URL('../src/data/schools.ts', import.meta.url);

// 대학원(대학원/특수대학원/전문대학원)은 제외하고 학부 과정(대학/전문대학)만 수집한다.
// 대학원 레코드는 "OO대학교 OO대학원" 형태라 그대로 쓰면 자동완성이 지저분해짐.
const INCLUDED_UNIV_SE = new Set(['대학', '전문대학']);

// 정부 표준데이터 자체의 오타로 캠퍼스명이 잘려 내려온다 (예: "제2캠퍼" → "제2캠퍼스").
const CAMPUS_LABEL_FIX = {
  본교: '',
  본원: '',
  '제2캠퍼': '제2캠퍼스',
  '제3캠퍼': '제3캠퍼스',
  '제4캠퍼': '제4캠퍼스',
};

// API는 캠퍼스를 "제2캠퍼"/"제3캠퍼" 같은 일련번호로만 내려주고 실제 캠퍼스
// 이름을 제공하지 않는다. 아래는 각 학교 주소(lctnRoadNmAddr)를 대조해 확인한
// 실제 캠퍼스명 (2026-08-09 검증). 새로 다중 캠퍼스 학교가 늘어나면 여기 추가할 것 —
// 없는 조합은 CAMPUS_LABEL_FIX의 일반 라벨("제N캠퍼스")로 대체된다.
const CAMPUS_NAME_OVERRIDES = {
  // 본교 쪽도 고유 캠퍼스명이 있는 경우 함께 표기한다 (예: 가톨릭대학교 본교 = 성심교정).
  '가톨릭대학교|본교': '성심교정',
  '강원대학교|본교': '춘천캠퍼스',
  '건양대학교|본교': '논산캠퍼스',
  '경기대학교|본교': '수원캠퍼스',
  '경동대학교|본교': '고성캠퍼스',
  '경인교육대학교|본교': '인천캠퍼스',
  '국립강릉원주대학교|본교': '강릉캠퍼스',
  '단국대학교|본교': '죽전캠퍼스',
  '명지대학교|본교': '자연캠퍼스',
  '상명대학교|본교': '서울캠퍼스',
  '서남대학교|본교': '남원캠퍼스',
  '신한대학교|본교': '동두천캠퍼스',
  '안양대학교|본교': '안양캠퍼스',
  '예원예술대학교|본교': '임실캠퍼스',
  '을지대학교|본교': '대전캠퍼스',
  '인제대학교|본교': '김해캠퍼스',
  '인천가톨릭대학교|본교': '강화캠퍼스',
  '전남대학교|본교': '용봉캠퍼스',
  '중앙대학교|본교': '서울캠퍼스',
  '홍익대학교|본교': '서울캠퍼스',

  '가톨릭대학교|제2캠퍼': '성의교정',
  '가톨릭대학교|제3캠퍼': '성신교정',
  '강원대학교|제2캠퍼': '삼척캠퍼스',
  '건양대학교|제2캠퍼': '메디컬캠퍼스',
  '경기대학교|제2캠퍼': '서울캠퍼스',
  '경동대학교|제2캠퍼': '속초캠퍼스',
  '경동대학교|제3캠퍼': '원주캠퍼스',
  '경동대학교|제4캠퍼': '양주캠퍼스',
  '경인교육대학교|제2캠퍼': '경기캠퍼스',
  '국립강릉원주대학교|제2캠퍼': '원주캠퍼스',
  '단국대학교|제2캠퍼': '천안캠퍼스',
  '명지대학교|제2캠퍼': '인문캠퍼스',
  '상명대학교|제2캠퍼': '천안캠퍼스',
  '서남대학교|제2캠퍼': '아산캠퍼스',
  '신한대학교|제2캠퍼': '의정부캠퍼스',
  '안양대학교|제2캠퍼': '강화캠퍼스',
  '예원예술대학교|제2캠퍼': '양주캠퍼스',
  '을지대학교|제2캠퍼': '성남캠퍼스',
  '을지대학교|제3캠퍼': '의정부캠퍼스',
  '인제대학교|제2캠퍼': '부산캠퍼스',
  '인천가톨릭대학교|제2캠퍼': '송도캠퍼스',
  '전남대학교|제2캠퍼': '여수캠퍼스',
  '중앙대학교|제2캠퍼': '안성캠퍼스',
  '홍익대학교|제2캠퍼': '세종캠퍼스',
};

async function fetchPage(pageNo) {
  const url = new URL(BASE_URL);
  url.searchParams.set('serviceKey', API_KEY);
  url.searchParams.set('pageNo', String(pageNo));
  url.searchParams.set('numOfRows', String(NUM_OF_ROWS));
  url.searchParams.set('type', 'json');

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`API 요청 실패: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  if (json?.header?.resultCode && json.header.resultCode !== '00') {
    throw new Error(`API 오류 응답: ${json.header.resultCode} ${json.header.resultMsg}`);
  }
  const body = json?.body;
  if (!body) {
    console.error('예상치 못한 응답 구조:\n', JSON.stringify(json, null, 2).slice(0, 1000));
    throw new Error('응답 파싱 실패 - 서비스키/파라미터를 확인하세요.');
  }
  return body;
}

function extractItems(body) {
  let items = body.items?.item ?? body.items ?? [];
  if (!Array.isArray(items)) items = [items];
  return items;
}

async function fetchAll() {
  if (!API_KEY) {
    console.error('SCHOOL_API_KEY 환경변수가 필요합니다. docs/school-list-data-source.md 참고.');
    process.exit(1);
  }

  const first = await fetchPage(1);
  const totalCount = Number(first.totalCount ?? 0);
  const firstItems = extractItems(first);

  if (INSPECT) {
    console.log('--- 응답 첫 레코드 ---');
    console.log(JSON.stringify(firstItems[0], null, 2));
    console.log(`\ntotalCount: ${totalCount}`);
    return null;
  }

  console.log(`총 ${totalCount}건 수집 시작 (페이지당 ${NUM_OF_ROWS}건)...`);
  const all = [...firstItems];
  const totalPages = Math.ceil(totalCount / NUM_OF_ROWS);
  for (let page = 2; page <= totalPages; page++) {
    all.push(...extractItems(await fetchPage(page)));
    console.log(`  ${page}/${totalPages} 페이지 수집 완료`);
  }
  return all;
}

// 학부(대학/전문대학) 과정만 남기고, 캠퍼스 중복 표기를 정리한 뒤 정렬한다.
function clean(records) {
  const names = new Set();
  let excludedGraduate = 0;

  for (const record of records) {
    if (!INCLUDED_UNIV_SE.has(record.univSeNm)) {
      excludedGraduate += 1;
      continue;
    }

    let rawName = String(record.schlNm ?? '').trim();
    if (!rawName) continue;

    // 정부 데이터 자체가 필드 길이 제한으로 긴 이름 끝의 "스"를 잘라서 내려줄 때가
    // 있다 (예: "...영남융합기술캠퍼" → "...영남융합기술캠퍼스"가 맞음).
    if (rawName.endsWith('캠퍼')) rawName += '스';

    let displayName;
    if (rawName.includes('(')) {
      // 이미 "OO대학교(세종)"처럼 학교명 자체에 캠퍼스가 표기된 경우 그대로 둔다.
      displayName = rawName;
    } else if (rawName.endsWith('캠퍼스')) {
      // "한국폴리텍 I 대학 서울강서캠퍼스" 처럼 이름 끝에 캠퍼스가 붙어 있는 경우
      // "한국폴리텍 I 대학(서울강서캠퍼스)" 형태로 통일한다.
      const match = rawName.match(/^(.*?)\s+(\S+캠퍼스)$/);
      displayName = match ? `${match[1]}(${match[2]})` : rawName;
    } else {
      const overrideKey = `${rawName}|${record.mainbranchNm}`;
      const campusLabel =
        CAMPUS_NAME_OVERRIDES[overrideKey] ?? CAMPUS_LABEL_FIX[record.mainbranchNm] ?? record.mainbranchNm ?? '';
      displayName = campusLabel ? `${rawName}(${campusLabel})` : rawName;
    }

    names.add(displayName.trim());
  }

  console.log(`대학원 레코드 ${excludedGraduate}건 제외, 최종 ${names.size}개교`);
  return Array.from(names).sort((a, b) => a.localeCompare(b, 'ko'));
}

function toTsFile(schoolList) {
  const body = schoolList.map((s) => `  '${s.replace(/'/g, "\\'")}',`).join('\n');
  return `// 이 파일은 scripts/fetch-schools.mjs 로 자동 생성됨 — 직접 수정하지 말 것.
// 생성 시각: ${new Date().toISOString()}
// 출처: 공공데이터포털 "전국대학및전문대학정보표준데이터" (data.go.kr, 15107736)
// 갱신하려면: SCHOOL_API_KEY=... node scripts/fetch-schools.mjs
//
// 이 API는 폐교 여부 필드를 제공하지 않아, 이미 폐교된 학교가 일부 섞여 있을 수
// 있음 (예: 서남대학교, 한중대학교). 자동완성 목록에 없는 학교는 화면의
// "직접 입력하기"로 보완 가능하므로, 소수 폐교 학교가 섞이는 리스크보다
// 활성 학교가 잘못 걸러지는 리스크를 피하는 쪽으로 설계함.

export const SCHOOL_LIST = [
${body}
];
`;
}

async function main() {
  const records = await fetchAll();
  if (records === null) return; // --inspect 모드

  const schoolList = clean(records);
  const fs = await import('node:fs/promises');
  await fs.writeFile(OUTPUT_PATH, toTsFile(schoolList), 'utf-8');
  console.log(`\n완료: ${OUTPUT_PATH.pathname} 에 ${schoolList.length}개교 저장됨.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
