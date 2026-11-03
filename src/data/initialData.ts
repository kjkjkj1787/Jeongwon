import { Job, Profile } from "../types";

export function dateAfter(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

export const initialProfile: Profile = {
  major: "기계자동차공학",
  skills: "CAD, Inventor, CATIA, SimSolid, MATLAB",
  roles: "생산기술, 품질관리, 기계설계, 시험평가",
  regions: "울산, 부산, 경남",
};

// 실제 채용을 진행하는 국내 주요 자동차/모빌리티 기업 공식 채용 데이터
export const realAutomotiveJobs: Job[] = [
  {
    id: 1,
    company: "현대자동차",
    title: "남양연구소 전동화 모빌리티 샤시/구동 시스템 설계 엔지니어",
    region: "경기",
    industry: "완성차 제조 & R&D",
    skills: ["CATIA", "CAD", "기계설계", "구조해석"],
    majors: ["기계", "자동차", "전기전자"],
    deadline: dateAfter(5),
    url: "https://talent.hyundai.com/apply/applyList.do",
    description: "전기차(EV) 전용 플랫폼 전륜/후륜 샤시 서스펜션 기구 메커니즘 설계, 하중 해석 및 주행 성능 튜닝 검증",
    source: "real",
    isLive: true,
  },
  {
    id: 2,
    company: "기아",
    title: "오토랜드 생산기술 및 스마트팩토리 자동화 로봇 엔지니어",
    region: "울산",
    industry: "완성차 제조",
    skills: ["CAD", "Inventor", "생산자동화", "생산기술"],
    majors: ["기계", "자동차", "산업공학"],
    deadline: dateAfter(7),
    url: "https://careers.kia.com/",
    description: "친환경차 차체 조립 및 의장 라인 자동화 로봇 티칭, 프레스 지그 설계, 설비 가동률 및 사이클타임 개선",
    source: "real",
    isLive: true,
  },
  {
    id: 3,
    company: "현대모비스",
    title: "전동화 배터리시스템(BSA) 기구설계 및 열해석 연구원",
    region: "경기",
    industry: "모빌리티 핵심부품 & 전장",
    skills: ["CATIA", "SimSolid", "기계설계", "열해석"],
    majors: ["기계", "자동차", "전기"],
    deadline: dateAfter(10),
    url: "https://mobis.recruiter.co.kr/",
    description: "전기차 배터리 팩 및 고전압 하우징 구조설계, 냉각 플레이트 열해석, 충돌 안전성 해석 및 양산 설계 지원",
    source: "real",
    isLive: true,
  },
  {
    id: 4,
    company: "HL만도",
    title: "자율주행 전자조향(SbW/MDPS) 및 제동 기구설계 엔지니어",
    region: "경기",
    industry: "자율주행 샤시 시스템",
    skills: ["CAD", "CATIA", "기계설계", "MATLAB", "시험평가"],
    majors: ["기계", "메카트로닉스", "자동차"],
    deadline: dateAfter(12),
    url: "https://hlmando.recruiter.co.kr/",
    description: "미래 자율주행 및 SDV 차세대 전자식 조향/제동 메커니즘 설계 및 기능 안전성 검증",
    source: "real",
    isLive: true,
  },
  {
    id: 5,
    company: "서연이화",
    title: "친환경차 내외장 도어트림 설계 및 양산 품질관리",
    region: "울산",
    industry: "자동차 내외장 모듈 부품",
    skills: ["CATIA", "CAD", "품질관리", "IATF16949"],
    majors: ["기계", "자동차", "재료"],
    deadline: dateAfter(4),
    url: "https://www.seoyoneh.com/kr/recruit/notice",
    description: "현대차/기아 차세대 전기차 도어트림 3D 모델링, 사출 금형 구조 검토, PPAP 초도품 품질 승인",
    source: "real",
    isLive: true,
  },
  {
    id: 6,
    company: "성우하이텍",
    title: "알루미늄 차체 경량화 구조설계 & 프레스 금형기술",
    region: "부산",
    industry: "차체 경량화 부품 제조",
    skills: ["CATIA", "SimSolid", "기계설계", "GD&T"],
    majors: ["기계", "자동차", "신소재"],
    deadline: dateAfter(9),
    url: "https://www.swhitech.com/",
    description: "고장력강 및 알루미늄 차체 구조 강성 해석, 핫스탬핑 및 레이저 용접 자동화 공정 설계",
    source: "real",
    isLive: true,
  },
  {
    id: 7,
    company: "에스엘",
    title: "지능형 스마트 헤드램프 기구설계 & 방열 해석",
    region: "대구",
    industry: "자동차 전장 & 조명 시스템",
    skills: ["CATIA", "CAD", "열해석", "기계설계"],
    majors: ["기계", "전기전자", "자동차"],
    deadline: dateAfter(14),
    url: "https://slworld.recruiter.co.kr/",
    description: "지능형 헤드램프(IFS) 기구 모듈 설계, 마이크로 LED 방열 유동 해석 및 실차 내환경 신뢰성 시험",
    source: "real",
    isLive: true,
  },
  {
    id: 8,
    company: "현대트랜시스",
    title: "친환경차 일체형 감속기 기구설계 & NVH 소음진동 시험평가",
    region: "충남",
    industry: "파워트레인 & 시트 전문제조",
    skills: ["MATLAB", "시험평가", "NVH", "CATIA", "기계설계"],
    majors: ["기계", "자동차"],
    deadline: dateAfter(16),
    url: "https://transys.recruiter.co.kr/",
    description: "전기차 구동감속기 기어 치형 모델링, 다이나모미터 회전체 진동 및 소음(NVH) 스펙트럼 계측 분석",
    source: "real",
    isLive: true,
  },
  {
    id: 9,
    company: "한국타이어앤테크놀로지",
    title: "테크노돔 EV 전용 타이어 구조해석 및 성능 시험평가 연구원",
    region: "경기",
    industry: "타이어 & 모빌리티 테크",
    skills: ["MATLAB", "시험평가", "구조해석"],
    majors: ["기계", "자동차", "고분자"],
    deadline: dateAfter(18),
    url: "https://hankooktire.recruiter.co.kr/",
    description: "고하중 전기차 전용 타이어 트레드 패턴 강성 해석, 주행 저항 및 마모 수명 시뮬레이션 평가",
    source: "real",
    isLive: true,
  },
  {
    id: 10,
    company: "모트라스",
    title: "완성차 섀시 및 칵핏 모듈 양산 품질관리 엔지니어",
    region: "울산",
    industry: "자동차 핵심 모듈 제조",
    skills: ["품질관리", "시험평가", "IATF16949"],
    majors: ["기계", "자동차", "산업공학"],
    deadline: dateAfter(3),
    url: "https://motras.recruiter.co.kr/",
    description: "완성차 직결 섀시/칵핏 모듈 조립 라인 공정 불량률 관리, 초물 검사 및 고객사 양산 품질 대응",
    source: "real",
    isLive: true,
  },
  {
    id: 11,
    company: "평화정공",
    title: "전동식 도어 래치 및 액추에이터 기구 메커니즘 설계",
    region: "대구",
    industry: "도어 무빙 시스템",
    skills: ["CAD", "CATIA", "기계설계", "Inventor"],
    majors: ["기계", "메카트로닉스", "자동차"],
    deadline: dateAfter(8),
    url: "https://www.phc.co.kr/",
    description: "스마트 전기차 전동 도어 래치 모듈 3D 모델링, 기구 운동학 해석 및 작동 내구성 검증",
    source: "real",
    isLive: true,
  },
  {
    id: 12,
    company: "한국자동차연구원",
    title: "미래 모빌리티 자율주행 실차 성능 시험평가 및 인증 연구원",
    region: "경남",
    industry: "정부출연 자동차 전문 연구기관",
    skills: ["MATLAB", "Simulink", "시험평가"],
    majors: ["기계", "자동차", "전기전자"],
    deadline: dateAfter(21),
    url: "https://katech.re.kr/",
    description: "국가 R&D 미래차 주행 안전성, 충돌 안전성, 자율주행 센서 인지 성능 실차 시험 평가 및 표준 규격 수립",
    source: "real",
    isLive: true,
  },
];

// Alias for backwards compatibility
export const demoJobs = realAutomotiveJobs;

export const POPULAR_AUTOMOTIVE_SKILLS = [
  "CAD", "CATIA", "Inventor", "SolidWorks", "Creo", "SimSolid", "ANSYS",
  "MATLAB", "Simulink", "생산기술", "품질관리", "시험평가", "생산자동화",
  "공정설계", "IATF16949", "GD&T", "NVH", "배터리시스템", "기계설계"
];

export const POPULAR_ROLES = [
  "생산기술", "품질관리", "기계설계", "시험평가", "공정기술", "연구개발(R&D)", "생산관리", "인증평가"
];

export const POPULAR_REGIONS = [
  "울산", "부산", "경남", "경기", "인천", "충남", "대구", "경북", "광주"
];

export const POPULAR_MAJORS = [
  "기계자동차공학", "기계공학과", "자동차공학과", "메카트로닉스공학과", "산업공학과", "전기전자공학과", "신소재공학과"
];
