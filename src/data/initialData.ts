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

export const demoJobs: Job[] = [
  {
    id: 1,
    company: "자동차 완성차 기업 A",
    title: "생산기술 신입사원",
    region: "울산",
    industry: "완성차 제조",
    skills: ["CAD", "Inventor", "생산자동화"],
    majors: ["기계", "자동차", "산업공학"],
    deadline: dateAfter(3),
    url: "https://example.com/recruit/auto-a-prod",
    description: "생산라인 공정 개선 및 설비 효율화, 스마트팩토리 공정 최적화 및 양산 안정화 지원",
  },
  {
    id: 2,
    company: "자동차 부품기업 B",
    title: "품질관리 엔지니어",
    region: "경남",
    industry: "자동차 부품 제조",
    skills: ["MATLAB", "품질관리", "시험평가"],
    majors: ["기계", "자동차"],
    deadline: dateAfter(6),
    url: "https://example.com/recruit/parts-b-qa",
    description: "자동차 파워트레인 및 샤시 부품 품질 검사와 양산 품질 시험 데이터 관리 및 IATF16949 대응",
  },
  {
    id: 3,
    company: "모빌리티 기술기업 C",
    title: "기계설계 연구원",
    region: "부산",
    industry: "모빌리티 연구개발",
    skills: ["CATIA", "CAD", "SimSolid"],
    majors: ["기계", "자동차"],
    deadline: dateAfter(10),
    url: "https://example.com/recruit/mobility-c-design",
    description: "전기차 감속기 및 구동 모듈 3D 모델링, 구조/진동 CAE 해석 및 시제품 검증",
  },
  {
    id: 4,
    company: "자동차 시험기관 D",
    title: "시험평가 연구원",
    region: "경기",
    industry: "자동차 시험·인증",
    skills: ["MATLAB", "시험평가"],
    majors: ["기계", "자동차", "전기"],
    deadline: dateAfter(15),
    url: "https://example.com/recruit/lab-d-test",
    description: "차량 부품의 성능 및 내구성 평가, 주행 안정성 실차 및 다이나모 시험 계측 분석",
  },
  {
    id: 5,
    company: "글로벌 전장기업 E",
    title: "전동화 배터리 시스템 설계",
    region: "울산",
    industry: "EV 배터리팩 & 전장",
    skills: ["CATIA", "CAD", "열해석", "기계설계"],
    majors: ["기계", "자동차", "전기전자"],
    deadline: dateAfter(2),
    url: "https://example.com/recruit/ev-battery-e",
    description: "전기차 배터리 팩 및 모듈 하우징 구조설계, 냉각 플레이트 열유체 해석 및 양산 설계",
  },
  {
    id: 6,
    company: "자율주행 모빌리티 F",
    title: "차량 샤시/기구제어 엔지니어",
    region: "경남",
    industry: "자율주행 & 조향제어",
    skills: ["MATLAB", "Simulink", "시험평가", "기계설계"],
    majors: ["기계", "자동차", "메카트로닉스"],
    deadline: dateAfter(8),
    url: "https://example.com/recruit/autonomous-f",
    description: "전자식 조향장치(MDPS) 및 제동(ESC) 기구 메커니즘 설계 및 실차 기능 튜닝",
  },
  {
    id: 7,
    company: "스마트 모빌리티 테크 G",
    title: "스마트 제조 및 공정기술원",
    region: "부산",
    industry: "미래차 자동화설비",
    skills: ["CAD", "Inventor", "생산자동화", "생산기술"],
    majors: ["기계", "산업공학", "자동차"],
    deadline: dateAfter(12),
    url: "https://example.com/recruit/smart-g-process",
    description: "로봇 용접 및 조립 자동화 라인 티칭/설계, 공정 불량률 저감 및 사이클타임 개선",
  },
  {
    id: 8,
    company: "첨단 소재부품 솔루션 H",
    title: "차량 경량화 해석/설계 연구원",
    region: "울산",
    industry: "복합소재 & 차체",
    skills: ["SimSolid", "CATIA", "기계설계"],
    majors: ["기계", "재료", "자동차"],
    deadline: dateAfter(18),
    url: "https://example.com/recruit/lightweight-h",
    description: "알루미늄 및 탄소섬유 복합소재 차체 부품 구조강성 해석 및 충돌 안전성 최적화",
  },
];

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
